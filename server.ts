import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  GameModeType,
  GameRoom,
  LobbyType,
  PlayerColor,
  RoomPlayer,
  UserProfile,
} from './src/types/game';
import {
  SAFE_TRACK_INDICES,
  checkPlayerWon,
  chooseSmartTokenMove,
  getGlobalTrackIndex,
  getInitialTokensForMode,
  getMovableTokenIndices,
  getOppositeColor,
} from './src/utils/ludoEngine';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const usersMap = new Map<string, UserProfile>();

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed: UserProfile[] = JSON.parse(raw);
      parsed.forEach((u) => usersMap.set(u.id, u));
    }
  } catch (e) {
    console.error('Failed to load users.json:', e);
  }
}

function saveUsers() {
  try {
    const arr = Array.from(usersMap.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save users.json:', e);
  }
}

loadUsers();

function generateHexId24(): string {
  // 12 random bytes = 24 hex characters, matching 69b84f4b3e878421ab1293ae9
  return '69b8' + crypto.randomBytes(10).toString('hex');
}

function createDefaultUser(customName?: string): UserProfile {
  let id = generateHexId24();
  while (usersMap.has(id)) {
    id = generateHexId24();
  }
  const profile: UserProfile = {
    id,
    name: customName || 'Hammer',
    avatar: '/assets/ludo/avatar_hammer.png',
    country: 'India',
    statusMessage: 'Ready, Set, Ludo!',
    gender: 'male',
    level: 1,
    xp: 105,
    maxXp: 180,
    coins: 4250,
    diamonds: 150,
    isGuestSignedIn: true,
    kingPassUnlocked: false,
    stats: {
      gamesWon: 2,
      gamesLost: 0,
      winStreak: 2,
      tokensCaptured: 3,
      tokensKilled: 0,
      performanceRating: 7,
      tournamentsWon: 0,
    },
    unlockedDice: ['DEFAULT'],
    selectedDice: 'DEFAULT',
    unlockedTokens: ['DEFAULT'],
    selectedToken: 'DEFAULT',
    unlockedThemes: ['DEFAULT', 'NATURE'],
    selectedTheme: 'DEFAULT',
    buddies: [],
    gameHistory: [],
    createdAt: Date.now(),
  };
  usersMap.set(id, profile);
  saveUsers();
  return profile;
}

// Active rooms indexed by room code
const roomsMap = new Map<string, GameRoom>();

// Track WebSocket connections per room and user
interface ClientConn {
  ws: WebSocket;
  userId?: string;
  roomCode?: string;
}
const clients = new Set<ClientConn>();

const BOT_PROFILES = [
  { name: 'Rahul Sharma', avatar: '/assets/ludo/avatar_p4.png', coins: 12450, diamonds: 180 },
  { name: 'Priya Verma', avatar: '/assets/ludo/avatar_p1.png', coins: 8400, diamonds: 210 },
  { name: 'Aarav_King', avatar: 'letter:#0284c7:A', coins: 19200, diamonds: 340 },
  { name: 'Sneha Gupta', avatar: '/assets/ludo/avatar_p2.png', coins: 6350, diamonds: 120 },
  { name: 'Rohit_07', avatar: 'letter:#7c3aed:R', coins: 4850, diamonds: 95 },
  { name: 'Vikram Singh', avatar: '/assets/ludo/avatar_p6.png', coins: 15800, diamonds: 260 },
  { name: 'Anjali_Queen', avatar: '/assets/ludo/avatar_tyra.png', coins: 9250, diamonds: 150 },
  { name: 'Kabir Khan', avatar: '/assets/ludo/avatar_p3.png', coins: 7400, diamonds: 110 },
  { name: 'Neha_Star', avatar: 'letter:#db2777:N', coins: 11300, diamonds: 190 },
  { name: 'Aman_Boss', avatar: 'letter:#ea580c:A', coins: 5600, diamonds: 85 },
  { name: 'Surya_99', avatar: 'letter:#16a34a:S', coins: 24500, diamonds: 420 },
  { name: 'Karan_Pro', avatar: '/assets/ludo/avatar_p5.png', coins: 3950, diamonds: 75 },
  { name: 'Pooja_Ludo', avatar: 'letter:#9333ea:P', coins: 14200, diamonds: 230 },
  { name: 'Arjun_Roy', avatar: 'letter:#2563eb:A', coins: 6750, diamonds: 140 },
  { name: 'devil king', avatar: 'letter:#e33d7a:D', coins: 4250, diamonds: 150 },
];

let lastBotIdx = -1;
function pickRandomBotProfile() {
  let idx = Math.floor(Math.random() * BOT_PROFILES.length);
  if (idx === lastBotIdx) {
    idx = (idx + 1 + Math.floor(Math.random() * (BOT_PROFILES.length - 1))) % BOT_PROFILES.length;
  }
  lastBotIdx = idx;
  return BOT_PROFILES[idx];
}

function generateRoomCode(): string {
  // 8-digit numeric code like 02699963 from video
  let code = '';
  do {
    const num = Math.floor(1000000 + Math.random() * 90000000);
    code = num.toString().padStart(8, '0').slice(0, 8);
  } while (roomsMap.has(code));
  return code;
}

function broadcastRoom(room: GameRoom) {
  const payload = JSON.stringify({
    type: 'room:state',
    room,
  });
  for (const c of clients) {
    if (c.roomCode === room.code && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(payload);
    }
  }
}

const TURN_DURATION_MS = 14000;

function assignNextPlayerColor(room: GameRoom): PlayerColor {
  if (room.players.length === 1) {
    // 2nd player ALWAYS gets diagonal opposite color: Blue <-> Green, Red <-> Yellow
    return getOppositeColor(room.players[0].color);
  }
  const used = new Set(room.players.map((p) => p.color));
  const allColors: PlayerColor[] = ['blue', 'green', 'red', 'yellow'];
  return allColors.find((c) => !used.has(c)) || 'green';
}

function advanceTurn(room: GameRoom, keepSamePlayer: boolean = false) {
  if (room.status !== 'PLAYING') return;
  if (!keepSamePlayer) {
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    room.consecutiveSixes = 0;
  }
  room.diceValue = null;
  room.hasRolled = false;
  room.isRolling = false;
  room.isMoving = false;
  room.turnDeadline = Date.now() + TURN_DURATION_MS;
  broadcastRoom(room);
  scheduleBotOrAutoIfNeeded(room);
}

function executeRoll(room: GameRoom, playerId: string, forcedValue?: number) {
  if (room.status !== 'PLAYING') return;
  const currentPlayer = room.players[room.turnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return;
  if (room.hasRolled || room.isRolling || room.isMoving) return;

  room.isRolling = true;
  room.diceValue = null;
  broadcastRoom(room);

  setTimeout(() => {
    if (room.status !== 'PLAYING') return;
    let rolled = forcedValue;
    if (!rolled || rolled < 1 || rolled > 6) {
      if (room.forcedNextDice && room.forcedNextDice[playerId]) {
        rolled = room.forcedNextDice[playerId];
        delete room.forcedNextDice[playerId];
      } else {
        // Generous 6 probability if all tokens are locked in base so games start briskly like Ludo King
        const allInBase = currentPlayer.tokens.every((t) => t === -1);
        if (allInBase && Math.random() < 0.38) {
          rolled = 6;
        } else {
          rolled = Math.floor(Math.random() * 6) + 1;
        }
      }
    }

    if (rolled === 6) {
      room.consecutiveSixes += 1;
      if (room.consecutiveSixes >= 3) {
        // Three consecutive 6s forfeit turn in Ludo King
        room.isRolling = false;
        room.diceValue = 6;
        room.hasRolled = true;
        room.lastEvent = {
          type: 'ROLL',
          playerId,
          diceValue: 6,
          details: 'Three 6s! Turn skipped',
          timestamp: Date.now(),
        };
        broadcastRoom(room);
        setTimeout(() => advanceTurn(room, false), 800);
        return;
      }
    } else {
      room.consecutiveSixes = 0;
    }

    room.isRolling = false;
    room.diceValue = rolled;
    room.hasRolled = true;
    room.turnDeadline = Date.now() + TURN_DURATION_MS;
    room.lastEvent = {
      type: 'ROLL',
      playerId,
      diceValue: rolled,
      timestamp: Date.now(),
    };

    const movable = getMovableTokenIndices(currentPlayer, rolled);
    broadcastRoom(room);

    if (movable.length === 0) {
      // No legal moves, advance turn after brief pause
      setTimeout(() => {
        advanceTurn(room, false);
      }, 900);
    } else if (currentPlayer.isBot || currentPlayer.autoPlay) {
      // Only bots or players who explicitly enabled Auto-Play move automatically
      const chosen = chooseSmartTokenMove(room, currentPlayer, rolled);
      if (chosen !== null) {
        setTimeout(() => {
          executeMove(room, playerId, chosen);
        }, 600);
      }
    }
  }, 500);
}

function executeMove(room: GameRoom, playerId: string, tokenIndex: number) {
  if (room.status !== 'PLAYING') return;
  const currentPlayer = room.players[room.turnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return;
  if (!room.hasRolled || room.diceValue === null || room.isRolling || room.isMoving) return;

  const dice = room.diceValue;
  const movable = getMovableTokenIndices(currentPlayer, dice);
  if (!movable.includes(tokenIndex)) return;

  const startPos = currentPlayer.tokens[tokenIndex];
  // Strict Ludo rule: a token inside home base (-1) can ONLY exit on a 6!
  if (startPos === -1 && dice !== 6) return;

  const targetPos = startPos === -1 ? 0 : startPos + dice;
  if (targetPos > 56) return;
  const totalSteps = startPos === -1 ? 1 : dice;

  // Atomically consume this roll so NO second token or extra steps can EVER fire on the same dice roll!
  // Never touch room.isRolling here so the dice stays locked on the rolled number while the Goti walks!
  room.hasRolled = false;
  room.isMoving = true;
  broadcastRoom(room);

  let stepDone = 0;
  const stepInterval = setInterval(() => {
    if (room.status !== 'PLAYING') {
      clearInterval(stepInterval);
      return;
    }
    stepDone += 1;
    const nextStepPos = startPos === -1 ? 0 : startPos + stepDone;
    currentPlayer.tokens[tokenIndex] = nextStepPos;

    if (stepDone < totalSteps) {
      // Broadcast intermediate single-square step ("tak-tak" one square at a time!)
      room.lastEvent = {
        type: 'MOVE',
        playerId: currentPlayer.id,
        tokenIndex,
        diceValue: 1,
        timestamp: Date.now(),
      };
      broadcastRoom(room);
      return;
    }

    // Final step reached!
    clearInterval(stepInterval);
    room.isMoving = false;
    const nextPos = targetPos;

    let capturedSomeone = false;
    const reachedHome = nextPos === 56;

    // Check capture on outer track (0..50)
    if (nextPos >= 0 && nextPos <= 50) {
      const targetGlobal = getGlobalTrackIndex(currentPlayer.color, nextPos);
      if (targetGlobal !== null && !SAFE_TRACK_INDICES.has(targetGlobal)) {
        for (const other of room.players) {
          if (other.id === currentPlayer.id) continue;
          const matchingIndices: number[] = [];
          other.tokens.forEach((tPos, tIdx) => {
            if (getGlobalTrackIndex(other.color, tPos) === targetGlobal) {
              matchingIndices.push(tIdx);
            }
          });
          if (matchingIndices.length === 1) {
            const killedIdx = matchingIndices[0];
            other.tokens[killedIdx] = -1;
            capturedSomeone = true;
            currentPlayer.kills += 1;

            const killerProfile = usersMap.get(currentPlayer.id);
            if (killerProfile) {
              killerProfile.stats.tokensCaptured += 1;
              saveUsers();
            }
            const victimProfile = usersMap.get(other.id);
            if (victimProfile) {
              victimProfile.stats.tokensKilled += 1;
              saveUsers();
            }
          }
        }
      }
    }

    // Check if player won the match
    if (checkPlayerWon(currentPlayer, room.gameMode)) {
      room.status = 'FINISHED';
      room.winnerId = currentPlayer.id;
      room.lastEvent = {
        type: 'WIN',
        playerId: currentPlayer.id,
        tokenIndex,
        diceValue: dice,
        timestamp: Date.now(),
      };

      room.players.forEach((p) => {
        const prof = usersMap.get(p.id);
        if (!prof) return;
        if (p.id === currentPlayer.id) {
          prof.coins += room.winAmount;
          prof.stats.gamesWon += 1;
          prof.stats.winStreak += 1;
          prof.xp = Math.min(prof.maxXp, prof.xp + 25);
          if (prof.xp >= prof.maxXp) {
            prof.level += 1;
            prof.xp = 10;
            prof.maxXp = Math.round(prof.maxXp * 1.4);
          }
        } else {
          prof.stats.gamesLost += 1;
          prof.stats.winStreak = 0;
        }
        const opp = room.players.find((o) => o.id !== p.id);
        prof.gameHistory.unshift({
          id: room.code + '_' + Date.now(),
          mode: room.gameMode,
          opponentName: opp ? opp.name : 'Opponent',
          entryAmount: room.entryAmount,
          won: p.id === currentPlayer.id,
          timestamp: Date.now(),
        });
        prof.gameHistory = prof.gameHistory.slice(0, 25);
      });
      saveUsers();
      broadcastRoom(room);
      return;
    }

    room.lastEvent = {
      type: capturedSomeone ? 'CAPTURE' : reachedHome ? 'HOME' : 'MOVE',
      playerId: currentPlayer.id,
      tokenIndex,
      diceValue: dice,
      timestamp: Date.now(),
    };

    const extraTurn = dice === 6 || capturedSomeone || reachedHome;
    broadcastRoom(room);

    setTimeout(() => {
      advanceTurn(room, extraTurn);
    }, 380);
  }, 215);
}

function scheduleBotOrAutoIfNeeded(room: GameRoom) {
  if (room.status !== 'PLAYING') return;
  const currentPlayer = room.players[room.turnIndex];
  if (!currentPlayer) return;

  if (currentPlayer.isBot || currentPlayer.autoPlay) {
    setTimeout(() => {
      if (
        room.status === 'PLAYING' &&
        room.players[room.turnIndex]?.id === currentPlayer.id &&
        !room.hasRolled &&
        !room.isRolling
      ) {
        executeRoll(room, currentPlayer.id);
      }
    }, 850);
  }
}

// Periodic turn timeout watcher (every 500ms)
setInterval(() => {
  const now = Date.now();
  for (const room of roomsMap.values()) {
    if (room.status !== 'PLAYING') continue;
    if (now > room.turnDeadline && !room.isRolling && !room.isMoving) {
      const currentPlayer = room.players[room.turnIndex];
      if (!currentPlayer) continue;

      if (currentPlayer.isBot || currentPlayer.autoPlay) {
        if (!room.hasRolled) {
          executeRoll(room, currentPlayer.id);
        } else if (room.diceValue !== null) {
          const chosen = chooseSmartTokenMove(room, currentPlayer, room.diceValue);
          if (chosen !== null) {
            executeMove(room, currentPlayer.id, chosen);
          } else {
            advanceTurn(room, false);
          }
        } else {
          advanceTurn(room, false);
        }
      } else {
        // Human player missed their turn timer -> record missed turn and pass chance to next player!
        currentPlayer.missedTurns = Math.min(5, (currentPlayer.missedTurns || 0) + 1);
        room.lastEvent = {
          type: 'TIMEOUT',
          playerId: currentPlayer.id,
          details: 'Turn missed!',
          timestamp: now,
        };
        advanceTurn(room, false);
      }
    }
  }
}, 500);

async function startServer() {
  const app = express();
  app.use(express.json());

    // 1. Guest Login / Get or Create User Profile
  app.post('/api/guest-login', (req, res) => {
    const { existingId, userId, name } = req.body || {};
    const targetId = existingId || userId;
    if (targetId && usersMap.has(targetId)) {
      const user = usersMap.get(targetId)!;
      user.isGuestSignedIn = true;
      saveUsers();
      return res.json({ user });
    }
    const newUser = createDefaultUser(name);
    return res.json({ user: newUser });
  });

  app.get('/api/user/:id', (req, res) => {
    const user = usersMap.get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  });

  // 2. Update User Profile (Name, Avatar, Country, Status, Selected Dice/Token/Theme)
  app.post('/api/user/:id/update', (req, res) => {
    const user = usersMap.get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const {
      name,
      avatar,
      country,
      statusMessage,
      bio,
      gender,
      selectedDice,
      selectedToken,
      selectedTheme,
    } = req.body || {};

    if (typeof name === 'string' && name.trim()) user.name = name.trim().slice(0, 18);
    if (typeof avatar === 'string' && avatar.trim()) user.avatar = avatar.trim();
    if (typeof country === 'string' && country.trim()) user.country = country.trim();
    if (typeof statusMessage === 'string') user.statusMessage = statusMessage;
    if (typeof bio === 'string') user.statusMessage = bio;
    if (gender === 'male' || gender === 'female' || gender === 'other') user.gender = gender;
    if (typeof selectedDice === 'string') user.selectedDice = selectedDice;
    if (typeof selectedToken === 'string') user.selectedToken = selectedToken;
    if (typeof selectedTheme === 'string') user.selectedTheme = selectedTheme;

    saveUsers();
    return res.json({ user });
  });

  // 3. Free Store & Inventory Unlock Endpoint (Unlocks Coins, Diamonds, Dice, Tokens, Themes for FREE!)
  app.post('/api/user/:id/unlock', (req, res) => {
    const user = usersMap.get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const {
      addCoins,
      addDiamonds,
      unlockDice,
      diceId,
      unlockToken,
      tokenId,
      unlockTheme,
      themeId,
      unlockKingPass,
      kingPass,
    } = req.body || {};

    if (typeof addCoins === 'number' && addCoins > 0) {
      user.coins += addCoins;
    }
    if (typeof addDiamonds === 'number' && addDiamonds > 0) {
      user.diamonds += addDiamonds;
    }
    const dId = unlockDice || (diceId ? String(diceId) : undefined);
    if (typeof dId === 'string' && dId) {
      if (!user.unlockedDice.includes(dId)) {
        user.unlockedDice.push(dId);
      }
      user.selectedDice = dId;
    }
    const tkId = unlockToken || tokenId;
    if (typeof tkId === 'string' && tkId) {
      if (!user.unlockedTokens.includes(tkId)) {
        user.unlockedTokens.push(tkId);
      }
      user.selectedToken = tkId;
    }
    const thId = unlockTheme || themeId;
    if (typeof thId === 'string' && thId) {
      if (!user.unlockedThemes.includes(thId)) {
        user.unlockedThemes.push(thId);
      }
      user.selectedTheme = thId;
    }
    if (unlockKingPass || kingPass) {
      user.kingPassUnlocked = true;
    }

    saveUsers();
    return res.json({ user });
  });

  // 4. Create Room (Online, Play with Friends, Computer, Pass N Play, Team Up)
  app.post('/api/rooms/create', (req, res) => {
    const body = req.body || {};
    const userId: string = body.userId;
    const modeMap: Record<string, LobbyType> = {
      online: 'ONLINE',
      friends: 'FRIENDS',
      computer: 'COMPUTER',
      passnplay: 'PASS_N_PLAY',
      teamup: 'TEAM_UP',
    };
    const type: LobbyType =
      body.type || (body.mode ? modeMap[String(body.mode).toLowerCase()] : 'FRIENDS') || 'FRIENDS';
    const gameMode: GameModeType = body.gameMode || body.subMode || 'CLASSIC';
    const maxPlayers: 2 | 4 = body.maxPlayers === 4 ? 4 : 2;
    const entryAmount: number = typeof body.entryAmount === 'number' ? body.entryAmount : 100;
    const color: PlayerColor = body.color || body.hostColor || 'blue';
    const voiceChat: boolean = Boolean(body.voiceChat);
    const customCode: string | undefined = body.customCode;

    let hostProfile = usersMap.get(userId);
    if (!hostProfile) {
      hostProfile = createDefaultUser();
    }

    if (hostProfile.coins >= entryAmount) {
      hostProfile.coins -= entryAmount;
      saveUsers();
    }

    if (type === 'ONLINE') {
      for (const existingRoom of roomsMap.values()) {
        if (
          existingRoom.type === 'ONLINE' &&
          existingRoom.status === 'MATCHMAKING' &&
          existingRoom.players.length < existingRoom.maxPlayers &&
          existingRoom.hostId !== hostProfile.id
        ) {
          const assignedColor = assignNextPlayerColor(existingRoom);

          existingRoom.players.push({
            id: hostProfile.id,
            name: hostProfile.name,
            avatar: hostProfile.avatar,
            color: assignedColor,
            isBot: false,
            isConnected: true,
            coins: hostProfile.coins,
            diamonds: hostProfile.diamonds,
            tokens: getInitialTokensForMode(existingRoom.gameMode),
            kills: 0,
            autoPlay: false,
            missedTurns: 0,
          });

          if (existingRoom.players.length >= existingRoom.maxPlayers) {
            existingRoom.status = 'PLAYING';
            existingRoom.turnDeadline = Date.now() + TURN_DURATION_MS;
          }
          broadcastRoom(existingRoom);
          return res.json({ room: existingRoom, user: hostProfile });
        }
      }
    }

    const code =
      customCode && customCode.trim() && !roomsMap.has(customCode.trim())
        ? customCode.trim()
        : generateRoomCode();

    const winAmount =
      maxPlayers === 2 ? Math.round(entryAmount * 1.9) : Math.round(entryAmount * 3.6);

    const hostPlayer: RoomPlayer = {
      id: hostProfile.id,
      name: hostProfile.name,
      avatar: hostProfile.avatar,
      color,
      isBot: false,
      isConnected: true,
      coins: hostProfile.coins,
      diamonds: hostProfile.diamonds,
      tokens: getInitialTokensForMode(gameMode),
      kills: 0,
      autoPlay: false,
      missedTurns: 0,
    };

    const room: GameRoom = {
      code,
      type,
      gameMode,
      maxPlayers,
      entryAmount,
      winAmount,
      voiceChat: Boolean(voiceChat),
      status: type === 'ONLINE' ? 'MATCHMAKING' : type === 'FRIENDS' || type === 'TEAM_UP' ? 'WAITING' : 'PLAYING',
      hostId: hostProfile.id,
      players: [hostPlayer],
      turnIndex: 0,
      diceValue: null,
      isRolling: false,
      isMoving: false,
      hasRolled: false,
      consecutiveSixes: 0,
      turnDeadline: Date.now() + TURN_DURATION_MS,
      winnerId: null,
      forcedNextDice: {},
    };

    if (type === 'COMPUTER' || type === 'PASS_N_PLAY') {
      const needed = maxPlayers - 1;
      for (let i = 0; i < needed; i++) {
        const nextColor = assignNextPlayerColor(room);
        const botInfo = BOT_PROFILES[i % BOT_PROFILES.length];
        room.players.push({
          id: type === 'COMPUTER' ? `bot_${i + 1}_${code}` : `local_${i + 2}_${code}`,
          name: type === 'COMPUTER' ? `Computer ${i + 1}` : `Player ${i + 2}`,
          avatar: botInfo.avatar,
          color: nextColor,
          isBot: type === 'COMPUTER',
          isConnected: true,
          coins: botInfo.coins,
          diamonds: botInfo.diamonds,
          tokens: getInitialTokensForMode(gameMode),
          kills: 0,
          autoPlay: false,
          missedTurns: 0,
        });
      }
      room.status = 'PLAYING';
      room.turnDeadline = Date.now() + TURN_DURATION_MS;
    }

    roomsMap.set(code, room);
    return res.json({ room, user: hostProfile });
  });

  // 5. Join Private Friend Room by Room Code (Rahul & Vishal real-time multiplayer!)
  app.post('/api/rooms/join', (req, res) => {
    const {
      userId,
      code,
      preferredColor,
    }: {
      userId: string;
      code: string;
      preferredColor?: PlayerColor;
    } = req.body || {};

    const cleanCode = (code || '').trim();
    const room = roomsMap.get(cleanCode);
    if (!room) {
      return res.status(404).json({ error: 'Invalid private room code!' });
    }

    let userProfile = usersMap.get(userId);
    if (!userProfile) {
      userProfile = createDefaultUser();
    }

    const existingPlayer = room.players.find((p) => p.id === userProfile!.id);
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      broadcastRoom(room);
      return res.json({ room, user: userProfile });
    }

    if (room.players.length >= room.maxPlayers || room.status === 'FINISHED') {
      return res.status(400).json({ error: 'Room is already full or finished!' });
    }

    if (userProfile.coins >= room.entryAmount) {
      userProfile.coins -= room.entryAmount;
      saveUsers();
    }

    // Enforce strict diagonal opposite color pairing for 2nd player (Blue <-> Green, Red <-> Yellow)
    const assignedColor: PlayerColor =
      room.players.length === 1
        ? getOppositeColor(room.players[0].color)
        : preferredColor && !room.players.some((p) => p.color === preferredColor)
        ? preferredColor
        : assignNextPlayerColor(room);

    room.players.push({
      id: userProfile.id,
      name: userProfile.name,
      avatar: userProfile.avatar,
      color: assignedColor,
      isBot: false,
      isConnected: true,
      coins: userProfile.coins,
      diamonds: userProfile.diamonds,
      tokens: getInitialTokensForMode(room.gameMode),
      kills: 0,
      autoPlay: false,
      missedTurns: 0,
    });

    if (room.type !== 'FRIENDS' && room.players.length >= room.maxPlayers && room.status === 'WAITING') {
      broadcastRoom(room);
      setTimeout(() => {
        const r = roomsMap.get(cleanCode);
        if (r && r.status === 'WAITING') {
          r.status = 'PLAYING';
          r.turnDeadline = Date.now() + TURN_DURATION_MS;
          broadcastRoom(r);
        }
      }, 1200);
    } else {
      broadcastRoom(room);
    }

    return res.json({ room, user: userProfile });
  });

  // Simulate or invite a Friend into a Friends Room slot (for 1-device testing or buddy invite)
  app.post('/api/rooms/:code/simulate-friend', (req, res) => {
    const room = roomsMap.get(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.players.length >= room.maxPlayers) {
      return res.json({ room });
    }
    const assignedColor = assignNextPlayerColor(room);

    const friendName = req.body?.friendName || (room.players.length === 1 ? 'Papa Papa' : pickRandomBotProfile().name);
    const friendAvatar = req.body?.friendAvatar || '/assets/ludo/avatar_p4.png';

    room.players.push({
      id: `friend_${Date.now()}_${room.players.length}`,
      name: friendName,
      avatar: friendAvatar,
      color: assignedColor,
      isBot: true,
      isConnected: true,
      coins: 3250,
      diamonds: 150,
      tokens: getInitialTokensForMode(room.gameMode),
      kills: 0,
      autoPlay: false,
      missedTurns: 0,
    });

    broadcastRoom(room);
    return res.json({ room });
  });

  // Start room (Online Matchmaking or Friends Room Host starts)
  app.post('/api/rooms/:code/start', (req, res) => {
    const room = roomsMap.get(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const { fillWithBots, matchedOpponent } = req.body || {};

    if (room.players.length < 2 && fillWithBots) {
      const nextColor = assignNextPlayerColor(room);
      const chosenBot =
        matchedOpponent && matchedOpponent.name
          ? matchedOpponent
          : pickRandomBotProfile();

      room.players.push({
        id: `bot_opp_${room.code}`,
        name: chosenBot.name,
        avatar: chosenBot.avatar,
        color: nextColor,
        isBot: true,
        isConnected: true,
        coins: chosenBot.coins || 8450,
        diamonds: chosenBot.diamonds || 150,
        tokens: getInitialTokensForMode(room.gameMode),
        kills: 0,
        autoPlay: false,
        missedTurns: 0,
      });
    }

    room.status = 'PLAYING';
    room.turnDeadline = Date.now() + TURN_DURATION_MS;
    broadcastRoom(room);
    scheduleBotOrAutoIfNeeded(room);
    return res.json({ room });
  });

  // Quit game HTTP endpoint (increments gamesLost for quitter and gamesWon for opponent, matching Video 04:00-04:06)
  app.post('/api/rooms/:code/quit', (req, res) => {
    const room = roomsMap.get(req.params.code);
    const { userId } = req.body || {};
    const quitterProfile = userId ? usersMap.get(userId) : undefined;

    if (room && room.status === 'PLAYING') {
      if (quitterProfile) {
        quitterProfile.stats.gamesLost += 1;
        quitterProfile.stats.winStreak = 0;
      }
      const other = room.players.find((pl) => pl.id !== userId);
      if (other) {
        room.status = 'FINISHED';
        room.winnerId = other.id;
        const winnerProf = usersMap.get(other.id);
        if (winnerProf) {
          winnerProf.coins += room.winAmount;
          winnerProf.stats.gamesWon += 1;
          winnerProf.stats.winStreak += 1;
        }
      }
      saveUsers();
      broadcastRoom(room);
    } else if (room && room.status !== 'PLAYING') {
      roomsMap.delete(room.code);
    }

    return res.json({ user: quitterProfile || null, room: room || null });
  });

  // Direct HTTP Roll endpoint (works alongside WebSocket so dice roll never fails on mobile)
  app.post('/api/rooms/:code/roll', (req, res) => {
    const room = roomsMap.get(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const { userId, forcedValue } = req.body || {};
    const targetPlayerId =
      room.type === 'PASS_N_PLAY'
        ? room.players[room.turnIndex]?.id
        : userId || room.players[room.turnIndex]?.id;
    if (targetPlayerId) {
      const p = room.players.find((pl) => pl.id === targetPlayerId);
      if (p && !p.isBot) {
        p.missedTurns = 0;
      }
      executeRoll(room, targetPlayerId, forcedValue);
    }
    return res.json({ room });
  });

  // Direct HTTP Move endpoint (works alongside WebSocket so tapping a Goti never fails on mobile)
  app.post('/api/rooms/:code/move', (req, res) => {
    const room = roomsMap.get(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const { userId, tokenIndex } = req.body || {};
    const targetPlayerId =
      room.type === 'PASS_N_PLAY'
        ? room.players[room.turnIndex]?.id
        : userId || room.players[room.turnIndex]?.id;
    if (targetPlayerId && typeof tokenIndex === 'number') {
      executeMove(room, targetPlayerId, tokenIndex);
    }
    return res.json({ room });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const room = roomsMap.get(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    return res.json({ room });
  });

  app.get('/api/controller/state', (_req, res) => {
    return res.json({
      users: Array.from(usersMap.values()),
      rooms: Array.from(roomsMap.values()),
    });
  });

  app.post('/api/controller/force-dice', (req, res) => {
    const { roomCode, userId, diceValue } = req.body || {};
    const room = roomsMap.get(roomCode);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.forcedNextDice) room.forcedNextDice = {};
    room.forcedNextDice[userId] = Number(diceValue);
    return res.json({ success: true, room });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('error', (err) => {
    console.error('WebSocketServer error:', err);
  });

  wss.on('connection', (ws) => {
    const conn: ClientConn = { ws };
    clients.add(conn);

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
      clients.delete(conn);
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const targetCode = msg.roomCode || msg.code;
        switch (msg.type) {
          case 'room:subscribe': {
            conn.userId = msg.userId;
            conn.roomCode = targetCode;
            const room = roomsMap.get(targetCode);
            if (room) {
              const p = room.players.find((pl) => pl.id === msg.userId);
              if (p) p.isConnected = true;
              ws.send(JSON.stringify({ type: 'room:state', room }));
            }
            break;
          }
          case 'game:roll': {
            const room = roomsMap.get(targetCode);
            if (room) {
              const targetPlayerId =
                room.type === 'PASS_N_PLAY'
                  ? room.players[room.turnIndex]?.id
                  : msg.userId;
              const p = room.players.find((pl) => pl.id === targetPlayerId);
              if (p && !p.isBot) {
                p.missedTurns = 0;
              }
              executeRoll(room, targetPlayerId);
            }
            break;
          }
          case 'game:move': {
            const room = roomsMap.get(targetCode);
            if (room) {
              const targetPlayerId =
                room.type === 'PASS_N_PLAY'
                  ? room.players[room.turnIndex]?.id
                  : msg.userId;
              executeMove(room, targetPlayerId, Number(msg.tokenIndex));
            }
            break;
          }
          case 'game:toggle-auto': {
            const room = roomsMap.get(targetCode);
            if (room) {
              const p = room.players.find((pl) => pl.id === msg.userId);
              if (p) {
                p.autoPlay = typeof msg.autoPlay === 'boolean' ? msg.autoPlay : !p.autoPlay;
                broadcastRoom(room);
                if (p.autoPlay && room.players[room.turnIndex]?.id === p.id) {
                  scheduleBotOrAutoIfNeeded(room);
                }
              }
            }
            break;
          }
          case 'game:chat': {
            const room = roomsMap.get(targetCode);
            if (room) {
              const p = room.players.find((pl) => pl.id === msg.userId);
              if (p) {
                p.lastChat = {
                  text: String(msg.text || '').slice(0, 60),
                  timestamp: Date.now(),
                  isVoice: Boolean(msg.isVoice || msg.isVoiceNote),
                  gender: msg.gender || msg.voiceGender || 'female',
                };
                room.lastEvent = {
                  type: 'CHAT',
                  playerId: p.id,
                  details: p.lastChat.text,
                  timestamp: Date.now(),
                };
                broadcastRoom(room);
              }
            }
            break;
          }
          case 'game:quit': {
            const room = roomsMap.get(targetCode);
            if (room) {
              if (room.status === 'PLAYING' && room.players.length >= 2) {
                const other = room.players.find((pl) => pl.id !== msg.userId);
                if (other) {
                  room.status = 'FINISHED';
                  room.winnerId = other.id;
                  broadcastRoom(room);
                }
              } else {
                roomsMap.delete(room.code);
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(conn);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.on('error', (err) => {
    console.error('HTTP Server error:', err);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ludo King Server listening on http://0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in Ludo server:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in Ludo server:', reason);
});

startServer().catch((err) => {
  console.error('Failed to start Ludo King Server:', err);
});
