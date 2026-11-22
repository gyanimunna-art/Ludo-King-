import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, GameRoom, GameSubMode, PlayerColor } from './types/game';
import { soundManager } from './utils/soundManager';
import {
  TopBarOverlay,
  ProfileModal,
  StoreModal,
  SettingsModal,
  ExclusiveSaleModal,
  DiamondSpinModal,
  SeasonOfLightsModal,
  EventTabView,
  AddaModal,
  InventoryTabView,
  SocialTabView,
} from './components/ModalsAndTabs';
import {
  OnlineSetupModal,
  FriendsSetupModal,
  TeamUpSetupModal,
  ComputerSetupModal,
  PassNPlaySetupModal,
  RedRoomLobbyScreen,
} from './components/GameModeModals';
import { LudoBoardView } from './components/LudoBoardView';

type BootStage = 'gametion' | 'ludoking' | 'ready';
type BottomTab = 'home' | 'event' | 'adda' | 'inventory' | 'social';
type ActiveModal =
  | null
  | 'profile'
  | 'store_coins'
  | 'store_diamonds'
  | 'settings'
  | 'exclusive_sale'
  | 'diamond_spin'
  | 'season_lights'
  | 'adda_popup'
  | 'online_setup'
  | 'friends_setup'
  | 'teamup_setup'
  | 'computer_setup'
  | 'passnplay_setup';

const PRELOAD_IMAGES = [
  '/assets/ludo/screens/home_screen.jpg',
  '/assets/ludo/screens/game_board_clean.jpg',
];

function getOrCreateLocalFallbackUser(): UserProfile {
  let savedId = localStorage.getItem('ludo_king_guest_id');
  if (!savedId || savedId.length !== 24) {
    const randHex = Array.from({ length: 20 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    savedId = '69b8' + randHex;
    localStorage.setItem('ludo_king_guest_id', savedId);
  }
  return {
    id: savedId,
    name: 'Hammer',
    avatar: '/assets/ludo/avatar_hammer.png',
    country: 'India',
    statusMessage: 'Ready, Set, Ludo!',
    gender: 'male',
    level: 1,
    xp: 105,
    maxXp: 180,
    coins: 3740,
    diamonds: 150,
    isGuestSignedIn: true,
    kingPassUnlocked: false,
    stats: {
      gamesWon: 2,
      gamesLost: 1,
      winStreak: 0,
      tokensCaptured: 3,
      tokensKilled: 0,
      performanceRating: 0,
      tournamentsWon: 0,
    },
    unlockedDice: ['DEFAULT'],
    selectedDice: 'DEFAULT',
    unlockedTokens: ['DEFAULT'],
    selectedToken: 'DEFAULT',
    unlockedThemes: ['DEFAULT'],
    selectedTheme: 'DEFAULT',
    buddies: [],
    gameHistory: [],
    createdAt: Date.now(),
  };
}

export default function App() {
  const [bootStage, setBootStage] = useState<BootStage>('gametion');
  const [loadProgress, setLoadProgress] = useState(25);
  const [user, setUser] = useState<UserProfile>(() => getOrCreateLocalFallbackUser());
  const [activeTab, setActiveTab] = useState<BottomTab>('home');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active multiplayer / local room state
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [inWaitingLobby, setInWaitingLobby] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2200);
  }, []);

  // Authenticate or sync persistent 24-char hex Guest Profile with backend
  const loginAsGuest = useCallback(async (existingId?: string | null) => {
    try {
      const res = await fetch('/api/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: existingId || undefined }),
      });
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('ludo_king_guest_id', data.user.id);
        setUser(data.user);
        return data.user as UserProfile;
      }
    } catch (e) {
      console.error('Guest login error:', e);
    }
    return null;
  }, []);

  // Preload core screens & run fast boot splash sequence -> opens directly onto Home Screen
  useEffect(() => {
    PRELOAD_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const savedId = localStorage.getItem('ludo_king_guest_id');
    loginAsGuest(savedId);

    const t1 = setTimeout(() => {
      setBootStage((prev) => (prev === 'gametion' ? 'ludoking' : prev));
    }, 750);

    const interval = setInterval(() => {
      setLoadProgress((p) => (p < 100 ? Math.min(100, p + 25) : 100));
    }, 180);

    const t2 = setTimeout(() => {
      clearInterval(interval);
      setBootStage('ready');
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
    };
  }, [loginAsGuest]);

  // Strictly mute BGM during active gameplay on the board; resume only on Home/Lobby
  const isPlayingOnBoard = Boolean(activeRoom && !inWaitingLobby);
  useEffect(() => {
    soundManager.setGameplayMode(isPlayingOnBoard);
  }, [isPlayingOnBoard]);

  // Unlock audio on first user interaction (NEVER plays BGM during gameplay)
  const handleGlobalInteract = useCallback(() => {
    if (!isPlayingOnBoard) {
      soundManager.startBgm();
    }
  }, [isPlayingOnBoard]);

  // Connect WebSocket on port 3000 for real-time Room Code & Online Multiplayer
  useEffect(() => {
    if (!user) return;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId: user.id }));
      if (activeRoom) {
        ws.send(JSON.stringify({ type: 'room:subscribe', code: activeRoom.code, userId: user.id }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room:state' && msg.room) {
          const updatedRoom: GameRoom = msg.room;
          setActiveRoom((prev) => {
            if (
              prev &&
              prev.type === 'FRIENDS' &&
              prev.status === 'WAITING' &&
              updatedRoom.players.length > prev.players.length
            ) {
              soundManager.playPlayerJoin();
            }
            return updatedRoom;
          });
          if (updatedRoom.status === 'PLAYING') {
            setInWaitingLobby(false);
          }
          if (updatedRoom.status === 'FINISHED') {
            loginAsGuest(user.id);
          }
        }
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [user?.id, loginAsGuest]);

  // Subscribe whenever activeRoom code changes
  useEffect(() => {
    if (activeRoom && user && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'room:subscribe',
          code: activeRoom.code,
          userId: user.id,
        })
      );
    }
  }, [activeRoom?.code, user?.id]);

  // Update user profile helper
  const handleUpdateUser = async (patch: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/${user.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error('Update user failed:', e);
    }
  };

  // Free unlock / free coins / free diamonds helper (Optimistic instant UI update + backend sync)
  const handleFreeUnlock = async (payload: {
    addCoins?: number;
    addDiamonds?: number;
    diceId?: number;
    tokenId?: string;
    themeId?: string;
    kingPass?: boolean;
    label?: string;
  }) => {
    if (!user) return;
    soundManager.playCoinCollect();

    // Instant optimistic update so the top bar coin/diamond numbers increase immediately on tap
    setUser((prev) => ({
      ...prev,
      coins: prev.coins + (payload.addCoins || 0),
      diamonds: prev.diamonds + (payload.addDiamonds || 0),
      kingPassUnlocked: payload.kingPass ? true : prev.kingPassUnlocked,
    }));

    if (payload.label) {
      showToast(payload.label);
    }

    try {
      const res = await fetch(`/api/user/${user.id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error('Free unlock error:', e);
    }
  };

  // Create Room (Online, Friends, Team Up, Computer, Pass N Play)
  const handleCreateRoom = async (opts: {
    mode: 'online' | 'friends' | 'computer' | 'passnplay' | 'teamup';
    subMode: GameSubMode;
    maxPlayers: 2 | 3 | 4 | 5 | 6;
    entryAmount: number;
    hostColor: PlayerColor;
    passNPlayNames?: string[];
  }) => {
    if (!user) return;
    soundManager.playClick();
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...opts,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
      if (data.room) {
        const created: GameRoom = data.room;
        setActiveModal(null);
        setActiveRoom(created);
        if (created.status === 'WAITING' || created.status === 'MATCHMAKING') {
          setInWaitingLobby(true);
        } else {
          setInWaitingLobby(false);
          soundManager.stopBgm();
          soundManager.playGameStart();
        }
      }
    } catch (e) {
      console.error('Create room error:', e);
    }
  };

  // Join Private Room by Code (Friends -> Join)
  const handleJoinRoomByCode = async (
    code: string,
    preferredColor: PlayerColor
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: 'User not loaded' };
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          code: code.trim(),
          preferredColor,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        soundManager.playInvalid();
        return { ok: false, error: data.error || 'Invalid private room code!' };
      }
      if (data.user) {
        setUser(data.user);
      }
      if (data.room) {
        soundManager.playPlayerJoin();
        setActiveModal(null);
        setActiveRoom(data.room);
        setInWaitingLobby(
          data.room.status === 'WAITING' || data.room.status === 'MATCHMAKING'
        );
        return { ok: true };
      }
    } catch (e) {
      console.error('Join room error:', e);
    }
    return { ok: false, error: 'Invalid private room code!' };
  };

  // Simulate Friend Joining Friends Room (or Invite Buddy)
  const handleSimulateFriendJoin = async () => {
    if (!activeRoom) return;
    try {
      const res = await fetch(`/api/rooms/${activeRoom.code}/simulate-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.room) {
        soundManager.playPlayerJoin();
        setActiveRoom(data.room);
      }
    } catch (e) {
      console.error('Simulate friend join error:', e);
    }
  };

  // Start room from waiting lobby (Online matchmaking matched or Friends Room Host starts)
  const handleStartRoom = async (
    fillWithBots: boolean,
    matchedOpponent?: { name: string; avatar: string; coins: number; diamonds: number }
  ) => {
    if (!activeRoom) return;
    try {
      const res = await fetch(`/api/rooms/${activeRoom.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fillWithBots, matchedOpponent }),
      });
      const data = await res.json();
      if (data.room) {
        setActiveRoom(data.room);
        setInWaitingLobby(false);
        soundManager.stopBgm();
        soundManager.playGameStart();
      }
    } catch (e) {
      console.error('Start room error:', e);
    }
  };

  const sendWsAction = (payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  // Render Boot Stage 1: Gametion Splash - Tap anywhere to skip immediately
  if (bootStage === 'gametion') {
    return (
      <div
        onClick={() => setBootStage('ludoking')}
        className="fixed inset-0 bg-black flex items-center justify-center select-none overflow-hidden cursor-pointer"
      >
        <div className="relative h-full aspect-[9/20] max-w-full overflow-hidden">
          <img
            src="/assets/ludo/screens/splash_gametion.jpg"
            alt="Gametion"
            className="w-full h-full object-fill"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  // Render Boot Stage 2: Ludo King Splash - Tap anywhere to skip immediately
  if (bootStage === 'ludoking') {
    return (
      <div
        onClick={() => setBootStage('ready')}
        className="fixed inset-0 bg-black flex items-center justify-center select-none overflow-hidden cursor-pointer"
      >
        <div className="relative h-full aspect-[9/20] max-w-full overflow-hidden">
          <img
            src="/assets/ludo/screens/splash_ludo.jpg"
            alt="Ludo King Loading"
            className="w-full h-full object-fill"
            draggable={false}
          />
          {/* Animated loading bar overlay matching bottom of splash_ludo.jpg */}
          <div className="absolute left-[18%] right-[18%] bottom-[5.8%] h-[1.4%] rounded-full bg-[#091d42] border border-[#f5c542] overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#26d026] via-[#65ff3b] to-[#1aa81a] transition-all duration-150"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-[#02091c] flex items-center justify-center select-none overflow-hidden"
      onClick={handleGlobalInteract}
    >
      {/* Strict 9:20 mobile viewport matching 1080x2400 native Ludo King screenshots */}
      <div className="relative h-full aspect-[9/20] max-w-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.95)] bg-[#061e5c]">
        {/* 1. ACTIVE GAMEPLAY BOARD VIEW */}
        {activeRoom && !inWaitingLobby ? (
          <LudoBoardView
            room={activeRoom}
            user={user}
            onRollDice={() => {
              if (activeRoom.isRolling || activeRoom.isMoving || activeRoom.hasRolled) return;
              setActiveRoom((prev) =>
                prev && !prev.isRolling && !prev.hasRolled ? { ...prev, isRolling: true } : prev
              );
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                sendWsAction({
                  type: 'game:roll',
                  code: activeRoom.code,
                  userId: user.id,
                });
              } else {
                fetch(`/api/rooms/${activeRoom.code}/roll`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.room) setActiveRoom(d.room);
                  })
                  .catch(() => {});
              }
            }}
            onMoveToken={(tokenIndex) => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                sendWsAction({
                  type: 'game:move',
                  code: activeRoom.code,
                  userId: user.id,
                  tokenIndex,
                });
              } else {
                fetch(`/api/rooms/${activeRoom.code}/move`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id, tokenIndex }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.room) setActiveRoom(d.room);
                  })
                  .catch(() => {});
              }
            }}
            onToggleAuto={() => {
              soundManager.playClick();
              sendWsAction({
                type: 'game:toggle-auto',
                code: activeRoom.code,
                userId: user.id,
              });
            }}
            onSendChat={(text, isVoiceNote, voiceGender) => {
              sendWsAction({
                type: 'game:chat',
                code: activeRoom.code,
                userId: user.id,
                text,
                isVoiceNote,
                voiceGender,
              });
            }}
            onQuitGame={() => {
              soundManager.playClick();
              const quittingPlayingMatch = activeRoom.status === 'PLAYING';
              if (quittingPlayingMatch) {
                setUser((prev) => ({
                  ...prev,
                  stats: {
                    ...prev.stats,
                    gamesLost: prev.stats.gamesLost + 1,
                    winStreak: 0,
                  },
                }));
              }
              fetch(`/api/rooms/${activeRoom.code}/quit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
              })
                .then((r) => r.json())
                .then((d) => {
                  if (d.user) setUser(d.user);
                })
                .catch(() => {});
              setActiveRoom(null);
              setInWaitingLobby(false);
              soundManager.startBgm();
            }}
            onOpenStore={(tab) => {
              setActiveModal(tab === 'diamonds' ? 'store_diamonds' : 'store_coins');
            }}
            onFreeUnlock={handleFreeUnlock}
          />
        ) : activeRoom && inWaitingLobby ? (
          /* 2. RED ROOM CODE / ONLINE MATCHMAKING LOBBY */
          <RedRoomLobbyScreen
            room={activeRoom}
            user={user}
            onStartMatch={handleStartRoom}
            onSimulateFriendJoin={handleSimulateFriendJoin}
            onCancelRoom={() => {
              soundManager.playClick();
              setActiveRoom(null);
              setInWaitingLobby(false);
            }}
            onShowToast={showToast}
          />
        ) : (
          /* 3. MAIN LOBBY & BOTTOM TABS */
          <>
            {activeTab === 'home' && (
              <div className="relative w-full h-full">
                {/* Crisp zero-lag Ludo King Home Screen (replaces continuous MP4 decode for smooth 60fps mobile performance) */}
                <img
                  src="/assets/ludo/screens/home_screen.jpg"
                  alt="Ludo King Home"
                  className="w-full h-full object-fill pointer-events-none"
                  draggable={false}
                />

                {/* LIVE TOP BAR OVERLAYS AT EXACT PIXEL COORDINATES (top: 6.0%) */}
                <TopBarOverlay
                  user={user}
                  onOpenProfile={() => setActiveModal('profile')}
                  onOpenSettings={() => setActiveModal('settings')}
                  onOpenStore={(t) =>
                    setActiveModal(t === 'diamonds' ? 'store_diamonds' : 'store_coins')
                  }
                />

                {/* Mail Hitbox (top: 5.5%) */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    showToast('No new system messages!');
                  }}
                  style={{ left: '22.0%', top: '5.5%', width: '7.5%', height: '3.4%' }}
                  className="absolute cursor-pointer bg-transparent z-20"
                  title="Messages"
                />

                {/* LEFT & RIGHT SIDEBAR PROMO HITBOXES */}
                {/* ₹25 Only Sale */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('exclusive_sale');
                  }}
                  style={{ left: '0.5%', top: '11.2%', width: '11.5%', height: '5.0%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />
                {/* King Pass (Left) */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('store_coins');
                  }}
                  style={{ left: '0.5%', top: '17.0%', width: '11.5%', height: '5.5%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />
                {/* Ludo Live */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('online_setup');
                  }}
                  style={{ left: '0.5%', top: '23.2%', width: '11.5%', height: '5.5%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />

                {/* Right Side: King Pass / Free Chest / Daily Target / 3D Dice Mascot / Help */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('store_diamonds');
                  }}
                  style={{ left: '87.0%', top: '9.5%', width: '12.5%', height: '5.0%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />
                <button
                  onClick={() => {
                    handleFreeUnlock({
                      addCoins: 5000,
                      addDiamonds: 50,
                      label: '+5,000 FREE Coins & +50 Diamonds Claimed!',
                    });
                  }}
                  style={{ left: '87.0%', top: '14.6%', width: '12.5%', height: '5.2%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveTab('event');
                  }}
                  style={{ left: '87.0%', top: '20.2%', width: '12.5%', height: '5.0%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveTab('inventory');
                  }}
                  style={{ left: '83.5%', top: '26.0%', width: '16.0%', height: '6.8%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('settings');
                  }}
                  style={{ left: '87.5%', top: '34.2%', width: '11.5%', height: '4.5%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />

                {/* MAIN 5 GAME MODE BUTTON HITBOXES */}
                {/* ONLINE */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('online_setup');
                  }}
                  style={{ left: '8.5%', top: '42.0%', width: '26.8%', height: '10.2%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
                  title="Play Online Multiplayer"
                />

                {/* TEAM UP */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('teamup_setup');
                  }}
                  style={{ left: '36.6%', top: '42.0%', width: '26.8%', height: '10.2%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
                  title="Team Up"
                />

                {/* FRIENDS (Create Room / Join Room via Code) */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('friends_setup');
                  }}
                  style={{ left: '64.8%', top: '42.0%', width: '26.8%', height: '10.2%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
                  title="Play with Friends"
                />

                {/* COMPUTER */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('computer_setup');
                  }}
                  style={{ left: '20.4%', top: '54.6%', width: '27.2%', height: '10.2%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
                  title="Play vs Computer"
                />

                {/* PASS N PLAY */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('passnplay_setup');
                  }}
                  style={{ left: '52.4%', top: '54.6%', width: '27.2%', height: '10.2%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
                  title="Pass N Play"
                />

                {/* SECONDARY GAME MODES & SEASON PASS */}
                {/* 7 Up Down */}
                <button
                  onClick={() => {
                    handleFreeUnlock({
                      addCoins: 2500,
                      label: 'Lucky 7 Bonus: +2,500 Coins Won!',
                    });
                  }}
                  style={{ left: '12.5%', top: '69.5%', width: '14.5%', height: '6.4%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />

                {/* TOURNAMENT */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('online_setup');
                  }}
                  style={{ left: '36.0%', top: '68.0%', width: '28.0%', height: '7.8%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
                />

                {/* Snakes & Ladders */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('computer_setup');
                  }}
                  style={{ left: '73.5%', top: '69.5%', width: '14.5%', height: '6.4%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />

                {/* SEASON 28 CLAIM */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('season_lights');
                  }}
                  style={{ left: '31.0%', top: '77.2%', width: '38.0%', height: '5.6%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
                />

                {/* Bottom-Left FREE Diamonds & Coins Chest */}
                <button
                  onClick={() => {
                    handleFreeUnlock({
                      addDiamonds: 100,
                      addCoins: 5000,
                      label: '+100 FREE Diamonds & +5,000 Coins Added!',
                    });
                  }}
                  style={{ left: '4.0%', top: '81.8%', width: '13.5%', height: '9.8%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />

                {/* Bottom-Right SPIN Wheel */}
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveModal('diamond_spin');
                  }}
                  style={{ left: '82.5%', top: '83.5%', width: '13.5%', height: '8.2%' }}
                  className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
                />
              </div>
            )}

            {/* EVENT TAB */}
            {activeTab === 'event' && (
              <EventTabView
                user={user}
                onOpenProfile={() => setActiveModal('profile')}
                onOpenSettings={() => setActiveModal('settings')}
                onOpenStore={(t) =>
                  setActiveModal(t === 'diamonds' ? 'store_diamonds' : 'store_coins')
                }
                onFreeUnlock={handleFreeUnlock}
              />
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <InventoryTabView
                user={user}
                onOpenProfile={() => setActiveModal('profile')}
                onOpenSettings={() => setActiveModal('settings')}
                onOpenStore={(t) =>
                  setActiveModal(t === 'diamonds' ? 'store_diamonds' : 'store_coins')
                }
                onFreeUnlock={handleFreeUnlock}
              />
            )}

            {/* SOCIAL TAB */}
            {activeTab === 'social' && (
              <SocialTabView
                user={user}
                onOpenProfile={() => setActiveModal('profile')}
                onOpenSettings={() => setActiveModal('settings')}
                onOpenStore={(t) =>
                  setActiveModal(t === 'diamonds' ? 'store_diamonds' : 'store_coins')
                }
                onShowToast={showToast}
              />
            )}

            {/* BOTTOM 5 NAVIGATION BAR HITBOXES (Always active across tabs) */}
            <div
              style={{ left: '0%', top: '92.8%', width: '100%', height: '7.2%' }}
              className="absolute grid grid-cols-5 z-20"
            >
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('home');
                }}
                className="w-full h-full cursor-pointer bg-transparent"
                title="HOME"
              />
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('event');
                }}
                className="w-full h-full cursor-pointer bg-transparent"
                title="EVENT"
              />
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveModal('adda_popup');
                }}
                className="w-full h-full cursor-pointer bg-transparent"
                title="ADDA"
              />
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('inventory');
                }}
                className="w-full h-full cursor-pointer bg-transparent"
                title="INVENTORY"
              />
              <button
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab('social');
                }}
                className="w-full h-full cursor-pointer bg-transparent"
                title="SOCIAL"
              />
            </div>
          </>
        )}

        {/* MODALS & POPUPS */}
        {activeModal === 'profile' && (
          <ProfileModal
            user={user}
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onUpdateUser={handleUpdateUser}
            onFreeUnlock={handleFreeUnlock}
            onShowToast={showToast}
          />
        )}

        {(activeModal === 'store_coins' || activeModal === 'store_diamonds') && (
          <StoreModal
            user={user}
            initialTab={activeModal === 'store_diamonds' ? 'diamonds' : 'coins'}
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onFreeUnlock={handleFreeUnlock}
          />
        )}

        {activeModal === 'settings' && (
          <SettingsModal
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onShowToast={showToast}
          />
        )}

        {activeModal === 'exclusive_sale' && (
          <ExclusiveSaleModal
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onClaimFree={() => {
              handleFreeUnlock({
                addDiamonds: 500,
                label: 'Exclusive Sale: +500 FREE Diamonds Claimed!',
              });
              setActiveModal(null);
            }}
          />
        )}

        {activeModal === 'diamond_spin' && (
          <DiamondSpinModal
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onWinReward={(diamonds, coins) => {
              handleFreeUnlock({
                addDiamonds: diamonds,
                addCoins: coins,
                label: `Spin Wheel Won +${diamonds} Diamonds & +${coins.toLocaleString()} Coins!`,
              });
            }}
          />
        )}

        {activeModal === 'season_lights' && (
          <SeasonOfLightsModal
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onUnlockSeason={() => {
              handleFreeUnlock({
                addDiamonds: 250,
                addCoins: 25000,
                themeId: 'season_lights',
                label: 'Season 28 Pass Unlocked for FREE!',
              });
              setActiveModal(null);
            }}
          />
        )}

        {activeModal === 'adda_popup' && (
          <AddaModal
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onConfirm={() => {
              soundManager.playClick();
              setActiveModal(null);
              showToast('Voice Room Connected!');
            }}
          />
        )}

        {activeModal === 'online_setup' && (
          <OnlineSetupModal
            user={user}
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onStartOnline={(subMode, maxPlayers, entryAmount, color) =>
              handleCreateRoom({
                mode: 'online',
                subMode,
                maxPlayers,
                entryAmount,
                hostColor: color,
              })
            }
          />
        )}

        {activeModal === 'friends_setup' && (
          <FriendsSetupModal
            user={user}
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onCreateFriendsRoom={(subMode, maxPlayers, entryAmount, color) =>
              handleCreateRoom({
                mode: 'friends',
                subMode,
                maxPlayers,
                entryAmount,
                hostColor: color,
              })
            }
            onJoinFriendsRoom={handleJoinRoomByCode}
          />
        )}

        {activeModal === 'teamup_setup' && (
          <TeamUpSetupModal
            user={user}
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onCreateTeamUp={(subMode, entryAmount, color) =>
              handleCreateRoom({
                mode: 'teamup',
                subMode,
                maxPlayers: 4,
                entryAmount,
                hostColor: color,
              })
            }
            onJoinTeamUp={handleJoinRoomByCode}
          />
        )}

        {activeModal === 'computer_setup' && (
          <ComputerSetupModal
            user={user}
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onStartComputer={(subMode, maxPlayers, color) =>
              handleCreateRoom({
                mode: 'computer',
                subMode,
                maxPlayers,
                entryAmount: 0,
                hostColor: color,
              })
            }
          />
        )}

        {activeModal === 'passnplay_setup' && (
          <PassNPlaySetupModal
            user={user}
            onClose={() => {
              soundManager.playClick();
              setActiveModal(null);
            }}
            onStartPassNPlay={(subMode, maxPlayers, color, names) =>
              handleCreateRoom({
                mode: 'passnplay',
                subMode,
                maxPlayers,
                entryAmount: 0,
                hostColor: color,
                passNPlayNames: names,
              })
            }
          />
        )}

        {/* IN-GAME TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="absolute top-[11%] inset-x-[10%] z-50 pointer-events-none flex justify-center">
            <div className="bg-gradient-to-b from-[#133b8a] to-[#081d4a] border-2 border-[#f8cc46] text-white font-bold text-xs px-4 py-2 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.85)] text-center">
              {toastMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
