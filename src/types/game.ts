export type PlayerColor = 'blue' | 'red' | 'green' | 'yellow';

export type GameModeType = 'CLASSIC' | '1 KILL WIN' | 'QUICK' | 'POPULAR' | 'MASK';
export type GameSubMode = GameModeType;

export type LobbyType = 'ONLINE' | 'FRIENDS' | 'TEAM_UP' | 'COMPUTER' | 'PASS_N_PLAY';

export interface UserStats {
  gamesWon: number;
  gamesLost: number;
  winStreak: number;
  tokensCaptured: number;
  tokensKilled: number;
  performanceRating: number;
  tournamentsWon: number;
}

export interface GameHistoryItem {
  id: string;
  mode: string;
  opponentName: string;
  entryAmount: number;
  won: boolean;
  timestamp: number;
}

export interface BuddyInfo {
  id: string;
  name: string;
  avatar: string;
}

export interface UserProfile {
  id: string; // 24-char hex ID e.g. 69b84f4b3e878421ab1293ae9
  name: string;
  avatar: string;
  country: string;
  statusMessage: string;
  bio?: string;
  gender: 'male' | 'female' | 'other';
  level: number;
  xp: number;
  maxXp: number;
  coins: number;
  diamonds: number;
  isGuestSignedIn: boolean;
  kingPassUnlocked: boolean;
  stats: UserStats;
  unlockedDice: string[];
  selectedDice: string;
  unlockedTokens: string[];
  selectedToken: string;
  unlockedThemes: string[];
  selectedTheme: string;
  buddies: BuddyInfo[];
  gameHistory: GameHistoryItem[];
  createdAt: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isBot: boolean;
  isConnected: boolean;
  coins: number;
  diamonds: number;
  /**
   * 4 tokens per player:
   * -1 = Inside home base yard
   * 0..50 = Steps taken from player's start square around the outer track
   * 51..55 = Inside colored home stretch column
   * 56 = Reached center home triangle (finished)
   */
  tokens: [number, number, number, number];
  kills: number;
  autoPlay: boolean;
  missedTurns: number;
  lastChat?: {
    text: string;
    timestamp: number;
    isVoice?: boolean;
    gender?: 'male' | 'female';
  };
}

export interface GameRoom {
  code: string;
  type: LobbyType;
  gameMode: GameModeType;
  maxPlayers: 2 | 4;
  entryAmount: number;
  winAmount: number;
  voiceChat: boolean;
  status: 'WAITING' | 'MATCHMAKING' | 'PLAYING' | 'FINISHED';
  hostId: string;
  players: RoomPlayer[];
  turnIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  isMoving?: boolean;
  hasRolled: boolean;
  consecutiveSixes: number;
  turnDeadline: number;
  winnerId: string | null;
  lastEvent?: {
    type: 'ROLL' | 'MOVE' | 'CAPTURE' | 'HOME' | 'TIMEOUT' | 'CHAT' | 'WIN';
    playerId: string;
    tokenIndex?: number;
    diceValue?: number;
    details?: string;
    timestamp: number;
  };
  forcedNextDice?: Record<string, number>;
}
