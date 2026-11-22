import React, { useState, useEffect, useRef } from 'react';
import { GameRoom, UserProfile, PlayerColor } from '../types/game';
import { getTokenGridCoords, getValidTokenMoves } from '../utils/ludoEngine';
import { soundManager } from '../utils/soundManager';
import { PlayerAvatarBox } from './GameModeModals';

const PRESET_MESSAGES: string[][] = [
  ['Hi!', 'Hello!'],
  ['Play Fast!', 'Okay!'],
  ['Lucky roll!', 'Login to Facebook to Chat'],
  ['Plz add me as Buddy!', 'Catch me if you can!'],
  ['I have to go. Bye!', 'I will let you win!'],
  ['Like my picture?', "Don't kill my token!"],
  ['You should give up!', 'I am going to win!'],
  ['Dare you to play me again!', 'I am Ludo King!'],
  ['I need to go, Sorry!', "Don't run away!"],
  ['Some Urgent work, Bye!', 'Why you hit me?'],
  ['Game is Not Over yet!', "You can't beat me!"],
  ['Bye! Bye!', 'Hahahaha!'],
  ['Today is My Day!', 'All the best!'],
];

const VOICE_NOTES: string[][] = [
  ['Hi!', 'Play fast please!'],
  ['Sabr ka phal meetha hota hai!', 'Kismat badalti dekhi...'],
  ['Ab aayega maza!', 'Bhaago bhaago aaya Ludo Sher!'],
  ['Galti se mistake ho gaya!', 'Meri goti mat kaatna!'],
  ['Kya kismat hai yaar!', 'Main hi Ludo King hoon!'],
  ['Sorry mujhe jaana padega!', 'Hahaha maza aa gaya!'],
];

// Exact pixel-measured circle centers inside the 15x15 board (x=30..1050, y=497..1516 of 1080x2400 game_board_clean.jpg)
const EXACT_BASE_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [
    [1.96, 1.98],
    [3.92, 1.99],
    [1.96, 4.01],
    [3.92, 4.01],
  ],
  green: [
    [10.95, 1.96],
    [12.96, 1.96],
    [10.94, 4.0],
    [12.97, 4.01],
  ],
  blue: [
    [1.96, 11.01],
    [3.92, 11.02],
    [1.96, 13.06],
    [3.92, 13.06],
  ],
  yellow: [
    [10.97, 11.12],
    [13.0, 11.12],
    [10.97, 13.1],
    [13.0, 13.11],
  ],
};

const PLAYER_BORDER_COLOR: Record<PlayerColor, string> = {
  blue: '#1ad1ff',
  green: '#1fa32a',
  red: '#ef4444',
  yellow: '#facc15',
};

const DICE_PRELOAD_URLS = [
  '/assets/ludo/dice/cube_blue_1.png',
  '/assets/ludo/dice/cube_blue_2.png',
  '/assets/ludo/dice/cube_blue_3.png',
  '/assets/ludo/dice/cube_blue_4.png',
  '/assets/ludo/dice/cube_blue_5.png',
  '/assets/ludo/dice/cube_blue_6.png',
  '/assets/ludo/dice/cube_blue_roll_1.png',
  '/assets/ludo/dice/cube_blue_roll_2.png',
  '/assets/ludo/dice/cube_blue_roll_3.png',
  '/assets/ludo/dice/cube_blue_roll_4.png',
  '/assets/ludo/dice/cube_green_1.png',
  '/assets/ludo/dice/cube_green_2.png',
  '/assets/ludo/dice/cube_green_3.png',
  '/assets/ludo/dice/cube_green_4.png',
  '/assets/ludo/dice/cube_green_5.png',
  '/assets/ludo/dice/cube_green_6.png',
  '/assets/ludo/dice/cube_green_roll_1.png',
  '/assets/ludo/dice/cube_green_roll_2.png',
  '/assets/ludo/dice/cube_green_roll_3.png',
  '/assets/ludo/dice/cube_green_roll_4.png',
];

function getHudCurrencyFontClass(formatted: string): string {
  if (formatted.length >= 11) return 'text-[8.5px] tracking-tighter';
  if (formatted.length >= 9) return 'text-[9.5px] tracking-tighter';
  if (formatted.length >= 7) return 'text-[10.5px] tracking-tight';
  return 'text-[11.5px]';
}

/**
 * 100% Authentic Extracted 3D Ludo King Goti (/assets/ludo/tokens/pin_${color}.png)
 * Anchored at exact measured ring center (50.5% X, 77.3% Y) so the crimson base ring
 * sits DEAD-CENTER on every board square and base circle!
 */
const LocationPinToken: React.FC<{
  color: PlayerColor;
  isMovable: boolean;
  isHopping: boolean;
  stackOffsetPct: number;
  isStacked: boolean;
  onClick?: () => void;
}> = ({ color, isMovable, isHopping, stackOffsetPct, isStacked, onClick }) => {
  const scaleFactor = isStacked ? 0.88 : 1;

  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      style={{
        width: '100%',
        height: '100%',
        transform: `translate3d(${stackOffsetPct}%, 0, 0)`,
      }}
      className={`relative select-none ${
        isMovable
          ? 'pointer-events-auto cursor-pointer z-40'
          : isHopping
          ? 'pointer-events-none z-30'
          : 'pointer-events-none z-20'
      }`}
    >
      {/* Precise non-overlapping touch target so ONLY the tapped Goti moves */}
      {isMovable && (
        <div
          style={{
            left: isStacked ? '-4%' : '-12%',
            top: '-46%',
            width: isStacked ? '108%' : '124%',
            height: '152%',
          }}
          className="absolute z-30 bg-transparent"
        />
      )}

      {/* Rotating White-Black Dashed Ring UNDERNEATH the 3D Pin Base when movable (z-0) */}
      {isMovable && (
        <div
          style={{
            left: '50%',
            top: '50%',
            width: '100%',
            height: '100%',
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-0 pointer-events-none"
        >
          <div className="w-full h-full rounded-full border-[2.5px] border-dashed border-white shadow-[0_0_0_2px_#0b2968] animate-spin" />
        </div>
      )}

      {/* 100% Original Extracted 3D Glossy Ludo King Pin anchored at exact ring center (50.5%, 77.3%) */}
      <img
        src={`/assets/ludo/tokens/pin_${color}.png`}
        alt={`${color} token`}
        style={{
          left: '50%',
          top: '50%',
          width: '146%',
          height: '178%',
          maxWidth: 'none',
          transform: isHopping
            ? `translate3d(-50.5%, -98%, 0) scale(${(1.13 * scaleFactor).toFixed(2)})`
            : isMovable
            ? `translate3d(-50.5%, -81%, 0) scale(${(1.04 * scaleFactor).toFixed(2)})`
            : `translate3d(-50.5%, -77.3%, 0) scale(${scaleFactor.toFixed(2)})`,
        }}
        className="absolute z-10 object-contain pointer-events-none transition-transform duration-150 will-change-transform"
        draggable={false}
      />
    </div>
  );
};

/**
 * Zero-rerender 60fps Shrinking Green-to-Red Turn Timer Border Around Player Square Avatar.
 * Animates via requestAnimationFrame directly on the SVG <rect> DOM node for butter-smooth mobile FPS.
 */
const AvatarTurnTimer: React.FC<{
  isActive: boolean;
  turnDeadline: number;
  inactiveBorderColor: string;
  children: React.ReactNode;
}> = ({ isActive, turnDeadline, inactiveBorderColor, children }) => {
  const rectRef = useRef<SVGRectElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastWarnSecRef = useRef<number>(-1);
  const perimeter = 376;

  useEffect(() => {
    if (!isActive) {
      lastWarnSecRef.current = -1;
      return;
    }
    const totalDuration = 14000;
    let rafId = 0;

    const tick = () => {
      const remaining = Math.max(0, turnDeadline - Date.now());
      const pct = Math.min(1, Math.max(0, remaining / totalDuration));
      const isLowTime = pct <= 0.28;

      if (rectRef.current) {
        rectRef.current.style.strokeDashoffset = String(perimeter * (1 - pct));
        rectRef.current.setAttribute('stroke', isLowTime ? '#ff1e1e' : '#26f71b');
      }
      if (svgRef.current) {
        svgRef.current.style.filter = isLowTime
          ? 'drop-shadow(0 0 5px rgba(255,30,30,0.9))'
          : 'drop-shadow(0 0 5px rgba(38,247,27,0.85))';
      }

      if (pct > 0.02 && isLowTime) {
        const secLeft = Math.ceil(remaining / 1000);
        if (lastWarnSecRef.current !== secLeft) {
          lastWarnSecRef.current = secLeft;
          soundManager.playTimerWarn();
        }
      }

      if (remaining > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isActive, turnDeadline]);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-[3.5px]">
      <div
        style={{ borderColor: inactiveBorderColor }}
        className="w-full h-full relative overflow-hidden border-[2px] bg-[#0a235c]"
      >
        {children}
      </div>

      {isActive && (
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        >
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            fill="none"
            stroke="#091e4d"
            strokeWidth="6"
          />
          <rect
            ref={rectRef}
            x="3"
            y="3"
            width="94"
            height="94"
            fill="none"
            stroke="#26f71b"
            strokeWidth="6"
            strokeLinecap="butt"
            strokeDasharray={perimeter}
            strokeDashoffset={0}
          />
        </svg>
      )}
    </div>
  );
};

/**
 * 100% Authentic 3D Colored Die Cube:
 * - Jumps up ONCE with smooth GPU CSS animation (.animate-dice-jump) and lands cleanly on the exact rolled face.
 * - Remembers the last rolled face between turns so it NEVER flashes a fake "4" or double number!
 */
const CenterColoredDice: React.FC<{
  value: number | null;
  rolling: boolean;
  color: PlayerColor;
  canRoll: boolean;
  onRoll: () => void;
}> = ({ value, rolling, color, canRoll, onRoll }) => {
  const [rollFrame, setRollFrame] = useState<number>(1);
  const lastFaceRef = useRef<number>(6);

  if (value !== null && value >= 1 && value <= 6) {
    lastFaceRef.current = value;
  }

  useEffect(() => {
    if (!rolling) return;
    const interval = setInterval(() => {
      setRollFrame((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 110);
    return () => clearInterval(interval);
  }, [rolling]);

  const face = lastFaceRef.current;
  const baseAssetColor = color === 'green' ? 'green' : 'blue';
  const imgSrc = rolling
    ? `/assets/ludo/dice/cube_${baseAssetColor}_roll_${rollFrame}.png`
    : `/assets/ludo/dice/cube_${baseAssetColor}_${face}.png`;

  const filterStyle =
    color === 'red'
      ? 'hue-rotate(145deg) saturate(1.35)'
      : color === 'yellow'
      ? 'hue-rotate(205deg) saturate(1.4) brightness(1.12)'
      : 'none';

  return (
    <button
      onClick={() => {
        if (canRoll && !rolling) {
          onRoll();
        }
      }}
      style={{
        left: '40.3%',
        top: '91.6%',
        width: '19.3%',
        height: '7.9%',
      }}
      className={`absolute rounded-[11px] flex items-center justify-center z-30 bg-transparent ${
        canRoll
          ? 'ring-[2.5px] ring-[#ffea47] shadow-[0_0_12px_rgba(255,234,71,0.85)] cursor-pointer'
          : 'cursor-default'
      }`}
      title={canRoll ? 'Tap to Roll Dice' : 'Dice'}
    >
      <img
        src={imgSrc}
        alt={`Dice ${face}`}
        style={{
          width: '62%',
          height: '68%',
          filter: filterStyle,
        }}
        className={`object-contain pointer-events-none select-none drop-shadow-[0_4px_5px_rgba(0,0,0,0.45)] ${
          rolling ? 'animate-dice-jump' : ''
        }`}
        draggable={false}
      />
    </button>
  );
};

interface TrailSquare {
  id: string;
  col: number;
  row: number;
  color: PlayerColor;
}

const TRAIL_BG_COLOR: Record<PlayerColor, string> = {
  blue: '#0095eb',
  green: '#16a34a',
  red: '#ef4444',
  yellow: '#eab308',
};

export const LudoBoardView: React.FC<{
  room: GameRoom;
  user: UserProfile;
  onRollDice: () => void;
  onMoveToken: (tokenIndex: number) => void;
  onToggleAuto: () => void;
  onSendChat: (text: string, isVoiceNote?: boolean, voiceGender?: 'male' | 'female') => void;
  onQuitGame: () => void;
  onOpenStore: (tab: 'coins' | 'diamonds') => void;
  onFreeUnlock: (payload: { addCoins?: number; addDiamonds?: number; label?: string }) => void;
}> = ({
  room,
  user,
  onRollDice,
  onMoveToken,
  onToggleAuto,
  onSendChat,
  onQuitGame,
  onOpenStore,
  onFreeUnlock,
}) => {
  const [chatModal, setChatModal] = useState<null | 'preset' | 'voice' | 'voice_pack'>(null);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [exitingMascot, setExitingMascot] = useState(false);
  const [soundOn, setSoundOn] = useState(() => soundManager.soundEnabled);
  const [musicOn, setMusicOn] = useState(() => soundManager.musicEnabled);
  const [vibrateOn, setVibrateOn] = useState(() => soundManager.vibrationEnabled);
  const [hoppingKeys, setHoppingKeys] = useState<Record<string, boolean>>({});
  const [trailSquares, setTrailSquares] = useState<TrailSquare[]>([]);
  const [timeoutBannerText, setTimeoutBannerText] = useState<string | null>(null);

  const prevTokensRef = useRef<Record<string, number>>({});
  const prevRollingRef = useRef<boolean>(false);
  const moveLockedRef = useRef<boolean>(false);
  const lastEventTsRef = useRef<number>(0);
  const timeoutBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload all dice cube images once on mount for zero-stutter dice rolls
  useEffect(() => {
    DICE_PRELOAD_URLS.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    return () => {
      if (timeoutBannerTimerRef.current) {
        clearTimeout(timeoutBannerTimerRef.current);
      }
    };
  }, []);

  // Unlock single-token click guard whenever a fresh roll lands
  useEffect(() => {
    if (room.hasRolled && room.diceValue !== null && !room.isRolling && !room.isMoving) {
      moveLockedRef.current = false;
    }
  }, [room.hasRolled, room.diceValue, room.isRolling, room.isMoving, room.turnIndex]);

  // Play authentic dice roll sound for BOTH user AND opponent whenever room.isRolling transitions false -> true
  useEffect(() => {
    if (room.isRolling && !prevRollingRef.current) {
      soundManager.playDiceRoll();
    }
    prevRollingRef.current = room.isRolling;
  }, [room.isRolling]);

  // Detect each single step of any token to trigger "tak-tak" step sound + hop arc + crisp fading color trail!
  useEffect(() => {
    const prev = prevTokensRef.current;
    const newlyHopping: Record<string, boolean> = {};
    const newTrails: TrailSquare[] = [];
    let steppedCount = 0;
    let cameOutOfBase = false;

    room.players.forEach((p) => {
      p.tokens.forEach((pos, idx) => {
        const key = `${p.color}_${idx}`;
        const prevPos = prev[key];
        if (prevPos !== undefined && prevPos !== pos) {
          newlyHopping[key] = true;
          if (prevPos === -1 && pos === 0) {
            cameOutOfBase = true;
          } else if (pos >= 0 && prevPos >= 0) {
            steppedCount++;
            // Leave a brief translucent colored trail on the exact square the Goti just stepped from
            const fromCoords = getTokenGridCoords(p.color, idx, prevPos);
            newTrails.push({
              id: `${key}_${prevPos}_${Date.now()}_${Math.random()}`,
              col: fromCoords.col,
              row: fromCoords.row,
              color: p.color,
            });
          }
        }
        prev[key] = pos;
      });
    });

    if (cameOutOfBase) {
      soundManager.playTokenOut();
    } else if (steppedCount > 0) {
      soundManager.playTokenStep(1);
    }

    if (newTrails.length > 0) {
      setTrailSquares((old) => [...old.slice(-8), ...newTrails]);
      const addedIds = new Set(newTrails.map((t) => t.id));
      setTimeout(() => {
        setTrailSquares((old) => old.filter((t) => !addedIds.has(t.id)));
      }, 260);
    }

    if (Object.keys(newlyHopping).length > 0) {
      setHoppingKeys((old) => ({ ...old, ...newlyHopping }));
      const timer = setTimeout(() => {
        setHoppingKeys((old) => {
          const next = { ...old };
          Object.keys(newlyHopping).forEach((k) => delete next[k]);
          return next;
        });
      }, 170);
      return () => clearTimeout(timer);
    }
  }, [room.players]);

  // Detect TIMEOUT, CAPTURE (Goti cut), and HOME events cleanly (timer stored in ref so banner ALWAYS auto-hides!)
  useEffect(() => {
    const evt = room.lastEvent;
    if (!evt || evt.timestamp <= lastEventTsRef.current) return;
    lastEventTsRef.current = evt.timestamp;

    if (evt.type === 'TIMEOUT') {
      soundManager.playTimeout();
      setTimeoutBannerText('You ran out of time!');
      if (timeoutBannerTimerRef.current) {
        clearTimeout(timeoutBannerTimerRef.current);
      }
      timeoutBannerTimerRef.current = setTimeout(() => {
        setTimeoutBannerText(null);
        timeoutBannerTimerRef.current = null;
      }, 1350);
    } else if (evt.type === 'CAPTURE') {
      soundManager.playCapture();
    } else if (evt.type === 'HOME') {
      soundManager.playTokenHome();
    }
  }, [room.lastEvent]);

  const currentPlayer = room.players[room.turnIndex] || room.players[0];
  const isMyTurn =
    room.type === 'PASS_N_PLAY'
      ? !currentPlayer?.isBot
      : currentPlayer?.id === user.id && !currentPlayer?.isBot;

  const canRoll =
    isMyTurn && !room.hasRolled && !room.isRolling && !room.isMoving && room.status === 'PLAYING';
  const validMoves =
    isMyTurn && room.hasRolled && !room.isMoving && room.diceValue
      ? getValidTokenMoves(currentPlayer, room.diceValue, room.players)
      : [];

  // Map Left HUD = Local User, Right HUD = Opponent (supports Blue/Green AND Red/Yellow combinations!)
  const leftPlayer = room.players.find((p) => p.id === user.id) || room.players[0];
  const rightPlayer =
    room.players.find((p) => p.id !== leftPlayer?.id) || room.players[1] || room.players[0];

  const isLeftTurn = currentPlayer?.id === leftPlayer?.id && room.status === 'PLAYING';
  const isRightTurn = currentPlayer?.id === rightPlayer?.id && room.status === 'PLAYING';

  // Safe single-Goti click handler (guarantees only the exact tapped token moves once per roll)
  const handleTokenTap = (tokenIndex: number) => {
    if (moveLockedRef.current || !room.hasRolled || room.isRolling || room.isMoving) return;
    if (!validMoves.includes(tokenIndex)) return;
    moveLockedRef.current = true;
    onMoveToken(tokenIndex);
  };

  // Group tokens by board coordinate so stacked tokens separate cleanly side-by-side
  const posGroupMap = new Map<string, string[]>();
  const rawTokens: {
    key: string;
    color: PlayerColor;
    tokenIndex: number;
    col: number;
    row: number;
    inBase: boolean;
    isMovable: boolean;
    posKey: string;
  }[] = [];

  room.players.forEach((p) => {
    p.tokens.forEach((pos, tIdx) => {
      let col = 0;
      let row = 0;
      const inBase = pos === -1;
      if (inBase) {
        const coords = EXACT_BASE_COORDS[p.color][tIdx] || [2.0, 2.0];
        col = coords[0];
        row = coords[1];
      } else {
        const c = getTokenGridCoords(p.color, tIdx, pos);
        col = c.col;
        row = c.row;
      }

      const posKey = `${col.toFixed(1)}_${row.toFixed(1)}`;
      const key = `${p.color}_${tIdx}`;
      if (!inBase) {
        const list = posGroupMap.get(posKey) || [];
        list.push(key);
        posGroupMap.set(posKey, list);
      }

      const isMovable =
        currentPlayer?.id === p.id &&
        isMyTurn &&
        room.hasRolled &&
        !room.isMoving &&
        validMoves.includes(tIdx);

      rawTokens.push({
        key,
        color: p.color,
        tokenIndex: tIdx,
        col,
        row,
        inBase,
        isMovable,
        posKey,
      });
    });
  });

  // Sort tokens so higher row (lower on screen) and movable tokens render cleanly on top
  rawTokens.sort((a, b) => {
    if (a.isMovable !== b.isMovable) return a.isMovable ? 1 : -1;
    return a.row - b.row;
  });

  // Latest chat message bubble across players
  const recentChat = room.players.reduce<{
    senderId: string;
    text: string;
    isVoiceNote?: boolean;
    timestamp: number;
  } | null>((acc, p) => {
    if (p.lastChat && (!acc || p.lastChat.timestamp > acc.timestamp)) {
      return {
        senderId: p.id,
        text: p.lastChat.text,
        isVoiceNote: p.lastChat.isVoice,
        timestamp: p.lastChat.timestamp,
      };
    }
    return acc;
  }, null);

  const formattedDiamonds = user.diamonds.toLocaleString();
  const formattedUserCoins = user.coins.toLocaleString();
  const formattedRightCoins = (rightPlayer?.coins || 3250).toLocaleString();

  const handleConfirmQuitYes = () => {
    soundManager.playClick();
    setShowQuitConfirm(false);
    setShowSideMenu(false);
    setExitingMascot(true);
    setTimeout(() => {
      onQuitGame();
    }, 650);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#061e5c]">
      {/* 1. 100% EXACT NATIVE CLEAN GAMEPLAY BOARD & HUD (1080x2400) */}
      <img
        src="/assets/ludo/screens/game_board_clean.jpg"
        alt="Ludo Board"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      {/* Left Yellow Side-Tab Pull Button (y=21.5%..31.3%, Video 03:20) */}
      <button
        onClick={() => {
          soundManager.playClick();
          setShowSideMenu((prev) => !prev);
        }}
        style={{ left: '0%', top: '21.5%', width: '4.8%', height: '9.8%' }}
        className="absolute cursor-pointer bg-transparent z-30"
        title="Game Menu"
      />

      {/* AUTHENTIC SIDE MENU CARD POPUP (Tightly cropped 558x526 + Working Red X + Click-Outside Backdrop!) */}
      {showSideMenu && !showQuitConfirm && (
        <>
          {/* Click-outside backdrop to dismiss Side Menu */}
          <div
            onClick={() => {
              soundManager.playClick();
              setShowSideMenu(false);
            }}
            className="absolute inset-0 z-30 bg-black/25"
          />

          <div
            style={{ left: '0%', top: '15.92%', width: '51.67%', height: '21.92%' }}
            className="absolute z-40 select-none"
          >
            <img
              src="/assets/ludo/ui/side_menu_card.png"
              alt="Side Menu"
              className="w-full h-full object-fill pointer-events-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)]"
              draggable={false}
            />

            {/* Live Diamonds Count inside Side Menu Card */}
            <div
              style={{ left: '41.5%', top: '8.0%', width: '21.0%', height: '10.0%' }}
              className="absolute bg-[#021230] flex items-center justify-center rounded-sm overflow-hidden pointer-events-none"
            >
              <span className="text-white font-black text-[12px] leading-none">
                {user.diamonds.toLocaleString()}
              </span>
            </div>

            {/* Live Winning Prize Count inside Side Menu Card */}
            <div
              style={{ left: '46.5%', top: '57.2%', width: '25.0%', height: '9.0%' }}
              className="absolute bg-[#004dc9] flex items-center justify-start px-1 rounded-sm overflow-hidden pointer-events-none"
            >
              <span className="text-white font-black text-[12px] leading-none">
                {room.winAmount.toLocaleString()}
              </span>
            </div>

            {/* Top-Left Leave/Quit Button [←🏃] -> Opens Full-Screen "QUIT GAME?" Confirmation */}
            <button
              onClick={() => {
                soundManager.playClick();
                setShowQuitConfirm(true);
              }}
              style={{ left: '4.0%', top: '5.5%', width: '16.5%', height: '16.5%' }}
              className="absolute z-50 cursor-pointer bg-transparent active:scale-90 transition-transform"
              title="Quit Game"
            />

            {/* Diamond Plus [+] Button */}
            <button
              onClick={() => {
                soundManager.playClick();
                setShowSideMenu(false);
                onOpenStore('diamonds');
              }}
              style={{ left: '64.0%', top: '5.5%', width: '13.5%', height: '15.0%' }}
              className="absolute z-50 cursor-pointer bg-transparent active:scale-90 transition-transform"
              title="Add Diamonds"
            />

            {/* Top-Right Red [X] Close Button (100% aligned over the red circle!) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playClick();
                setShowSideMenu(false);
              }}
              style={{ left: '84.0%', top: '-2.0%', width: '18.0%', height: '19.5%' }}
              className="absolute z-50 cursor-pointer bg-transparent active:scale-90 transition-transform"
              title="Close Menu"
            />

            {/* 4 Round Yellow-Bordered Settings Buttons: [🔊 Sound] [📳 Vibrate] [📣 Auto] [🎵 Music] */}
            <button
              onClick={() => {
                const next = soundManager.toggleSound();
                setSoundOn(next);
                if (next) soundManager.playClick();
              }}
              style={{ left: '5.0%', top: '76.5%', width: '16.0%', height: '17.0%' }}
              className="absolute z-50 cursor-pointer bg-transparent flex items-center justify-center"
              title="Toggle Sound"
            >
              {!soundOn && (
                <div className="w-4/5 h-[3px] bg-red-600 rotate-45 shadow-[0_0_4px_#000]" />
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                soundManager.vibrationEnabled = !soundManager.vibrationEnabled;
                setVibrateOn(soundManager.vibrationEnabled);
              }}
              style={{ left: '29.5%', top: '76.5%', width: '16.0%', height: '17.0%' }}
              className="absolute z-50 cursor-pointer bg-transparent flex items-center justify-center"
              title="Toggle Vibration"
            >
              {!vibrateOn && (
                <div className="w-4/5 h-[3px] bg-red-600 rotate-45 shadow-[0_0_4px_#000]" />
              )}
            </button>

            <button
              onClick={() => {
                onToggleAuto();
              }}
              style={{ left: '52.5%', top: '76.5%', width: '16.0%', height: '17.0%' }}
              className="absolute z-50 cursor-pointer bg-transparent flex items-center justify-center"
              title="Toggle Auto-Play"
            />

            <button
              onClick={() => {
                soundManager.playClick();
                const next = soundManager.toggleMusic();
                setMusicOn(next);
              }}
              style={{ left: '76.0%', top: '76.5%', width: '16.0%', height: '17.0%' }}
              className="absolute z-50 cursor-pointer bg-transparent flex items-center justify-center"
              title="Toggle Music"
            >
              {!musicOn && (
                <div className="w-4/5 h-[3px] bg-red-600 rotate-45 shadow-[0_0_4px_#000]" />
              )}
            </button>

            {/* Clean Floating [👑 Gift ME] Pill Button right below the blue card */}
            <button
              onClick={() => {
                setShowSideMenu(false);
                onFreeUnlock({
                  addCoins: 1000,
                  label: 'Gift Claimed! +1,000 Bonus Coins!',
                });
              }}
              style={{ left: '16%', top: '106%', width: '64%', height: '24%' }}
              className="absolute z-50 rounded-full bg-gradient-to-b from-[#ffe853] via-[#f7b500] to-[#d97706] border-2 border-[#fff3a1] shadow-[0_4px_12px_rgba(0,0,0,0.7)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
              title="Gift Me"
            >
              <span className="text-sm">👑</span>
              <span className="text-[#5a2800] font-black text-xs tracking-wide">Gift ME</span>
            </button>
          </div>
        </>
      )}

      {/* 2. EXACT PIXEL-ALIGNED 15x15 BOARD OVERLAY (x=30..1050, y=497..1516 of 1080x2400) */}
      <div
        style={{
          left: '2.778%',
          top: '20.708%',
          width: '94.444%',
          height: '42.458%',
        }}
        className="absolute z-20 pointer-events-none"
      >
        {/* Crisp Translucent Colored Square Trail Behind Moving Goti (Fades out immediately in 240ms) */}
        {trailSquares.map((sq) => (
          <div
            key={sq.id}
            style={{
              left: `${(sq.col / 15) * 100}%`,
              top: `${(sq.row / 15) * 100}%`,
              width: '6.6667%',
              height: '6.6667%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: TRAIL_BG_COLOR[sq.color],
            }}
            className="absolute z-10 pointer-events-none animate-trail-fade"
          />
        ))}

        {rawTokens.map((tk) => {
          const leftPct = (tk.col / 15) * 100;
          const topPct = (tk.row / 15) * 100;
          const group = tk.inBase ? [tk.key] : posGroupMap.get(tk.posKey) || [tk.key];
          const idxInGroup = group.indexOf(tk.key);
          const isStacked = group.length > 1;
          const stackOffsetPct = isStacked
            ? (idxInGroup - (group.length - 1) / 2) * 30
            : 0;

          return (
            <div
              key={tk.key}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: '6.6667%',
                height: '6.6667%',
                transform: 'translate(-50%, -50%)',
                transition: 'left 185ms linear, top 185ms linear',
              }}
              className={`absolute ${tk.isMovable ? 'z-40' : 'z-20'}`}
            >
              <LocationPinToken
                color={tk.color}
                isMovable={tk.isMovable}
                isHopping={Boolean(hoppingKeys[tk.key])}
                stackOffsetPct={stackOffsetPct}
                isStacked={isStacked}
                onClick={tk.isMovable ? () => handleTokenTap(tk.tokenIndex) : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* CENTERED "You ran out of time!" DARK TRANSLUCENT BANNER (Auto-hides cleanly after 1.35s!) */}
      {timeoutBannerText && (
        <div
          style={{ left: '2.8%', top: '40.2%', width: '94.4%', height: '4.6%' }}
          className="absolute z-40 bg-black/75 flex items-center justify-center pointer-events-none shadow-lg"
        >
          <span className="text-white font-bold text-[15px] tracking-wide">
            {timeoutBannerText}
          </span>
        </div>
      )}

      {/* 3. BOTTOM HUD INTERACTIVE ELEMENTS & LIVE PLAYER OVERLAYS */}
      {/* Speech Bubble Button (Left: opens Preset Chat & Voice Notes) */}
      <button
        onClick={() => {
          soundManager.playClick();
          setChatModal('preset');
        }}
        style={{ left: '0.8%', top: '79.3%', width: '10.2%', height: '4.1%' }}
        className="absolute cursor-pointer bg-transparent z-30 active:scale-90 transition-transform"
        title="Open Preset Chat & Voice Notes"
      />

      {/* Gift Button (Right: sends emoji / gift) */}
      <button
        onClick={() => {
          onFreeUnlock({
            addCoins: 500,
            label: 'Gift Sent! +500 Bonus Coins!',
          });
        }}
        style={{ left: '88.5%', top: '78.8%', width: '9.0%', height: '4.0%' }}
        className="absolute cursor-pointer bg-transparent z-30 active:scale-90 transition-transform"
        title="Send Gift"
      />

      {/* Left Player Square Avatar + 60fps Shrinking Green-to-Red Turn Timer Border */}
      <div
        style={{ left: '2.5%', top: '82.9%', width: '19.1%', height: '8.7%' }}
        className="absolute z-20"
      >
        <AvatarTurnTimer
          isActive={isLeftTurn}
          turnDeadline={room.turnDeadline}
          inactiveBorderColor={PLAYER_BORDER_COLOR[leftPlayer?.color || 'blue']}
        >
          <PlayerAvatarBox
            avatar={leftPlayer?.avatar || user.avatar}
            name={leftPlayer?.name || user.name}
          />
        </AvatarTurnTimer>
      </div>

      {/* Right Player Square Avatar + 60fps Shrinking Green-to-Red Turn Timer Border */}
      <div
        style={{ left: '78.0%', top: '82.7%', width: '19.6%', height: '9.0%' }}
        className="absolute z-20"
      >
        <AvatarTurnTimer
          isActive={isRightTurn}
          turnDeadline={room.turnDeadline}
          inactiveBorderColor={PLAYER_BORDER_COLOR[rightPlayer?.color || 'green']}
        >
          <PlayerAvatarBox
            avatar={rightPlayer?.avatar || '/assets/ludo/avatar_p4.png'}
            name={rightPlayer?.name || 'Papa Papa'}
          />
        </AvatarTurnTimer>
      </div>

      {/* Dynamic Bottom-Left & Bottom-Right Token Color Pins (matches Blue/Green OR Red/Yellow pairings!) */}
      {leftPlayer && leftPlayer.color !== 'blue' && (
        <div
          style={{ left: '2.8%', top: '92.1%', width: '7.6%', height: '4.7%' }}
          className="absolute bg-[#003b8e] flex items-center justify-center z-20 pointer-events-none"
        >
          <img
            src={`/assets/ludo/tokens/pin_${leftPlayer.color}.png`}
            alt={leftPlayer.color}
            className="h-full w-auto object-contain"
            draggable={false}
          />
        </div>
      )}
      {rightPlayer && rightPlayer.color !== 'green' && (
        <div
          style={{ left: '89.4%', top: '92.1%', width: '7.6%', height: '4.7%' }}
          className="absolute bg-[#003b8e] flex items-center justify-center z-20 pointer-events-none"
        >
          <img
            src={`/assets/ludo/tokens/pin_${rightPlayer.color}.png`}
            alt={rightPlayer.color}
            className="h-full w-auto object-contain"
            draggable={false}
          />
        </div>
      )}

      {/* Left Player 5 Missed-Turn Dots (○○○○● turns black from right to left) */}
      <div
        style={{ left: '2.4%', top: '97.25%', width: '8.6%', height: '1.1%' }}
        className="absolute bg-[#003b8e] flex items-center justify-between px-0.5 z-20"
      >
        {[0, 1, 2, 3, 4].map((dotIdx) => {
          const missedCount = leftPlayer?.missedTurns || 0;
          const isBlackDot = dotIdx >= 5 - missedCount;
          return (
            <span
              key={dotIdx}
              className={`w-[5.5px] h-[5.5px] rounded-full border border-[#eab308] ${
                isBlackDot ? 'bg-[#090d16]' : 'bg-[#16a34a]'
              }`}
            />
          );
        })}
      </div>

      {/* Right Player 5 Missed-Turn Dots (○○○○● turns black from right to left) */}
      <div
        style={{ left: '89.0%', top: '97.25%', width: '8.6%', height: '1.1%' }}
        className="absolute bg-[#003b8e] flex items-center justify-between px-0.5 z-20"
      >
        {[0, 1, 2, 3, 4].map((dotIdx) => {
          const missedCount = rightPlayer?.missedTurns || 0;
          const isBlackDot = dotIdx >= 5 - missedCount;
          return (
            <span
              key={dotIdx}
              className={`w-[5.5px] h-[5.5px] rounded-full border border-[#eab308] ${
                isBlackDot ? 'bg-[#090d16]' : 'bg-[#16a34a]'
              }`}
            />
          );
        })}
      </div>

      {/* Floating Chat / Voice Bubble Above Player Avatar */}
      {recentChat && Date.now() - recentChat.timestamp < 5500 && (
        <div
          style={{
            left: recentChat.senderId === leftPlayer?.id ? '3.0%' : '52.0%',
            top: '74.5%',
            maxWidth: '45%',
          }}
          className="absolute z-30 bg-[#0b347a]/95 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg border border-[#38bdf8] shadow-xl flex items-center gap-1.5"
        >
          {recentChat.isVoiceNote && <span className="text-yellow-300">🔊</span>}
          <span className="truncate">{recentChat.text}</span>
        </div>
      )}

      {/* Bouncing Downward Orange Arrow above Center Dice Box ONLY when waiting to roll */}
      {!room.hasRolled && !room.isRolling && !room.isMoving && (
        <div
          style={{ left: '45.2%', top: '88.0%', width: '9.6%', height: '3.2%' }}
          className="absolute z-30 pointer-events-none flex items-center justify-center animate-bounce"
        >
          <svg viewBox="0 0 64 48" className="w-full h-full drop-shadow-[0_3px_4px_rgba(0,0,0,0.7)]">
            <polygon
              points="18,4 46,4 46,22 58,22 32,45 6,22 18,22"
              fill="#f59e0b"
              stroke="#fef08a"
              strokeWidth="3"
            />
          </svg>
        </div>
      )}

      {/* SINGLE CENTER DICE BOX (Single 3D jump -> lands directly on rolled face, never flashes double numbers!) */}
      <CenterColoredDice
        value={room.diceValue}
        rolling={room.isRolling}
        color={currentPlayer?.color || 'blue'}
        canRoll={canRoll}
        onRoll={onRollDice}
      />

      {/* LEFT PLAYER (Hammer) EXPANDING CURRENCY & NAME BOXES IN BOTTOM BLUE BAR */}
      {/* 1. Left Player Diamonds: Expanding Dark-Blue Background Box */}
      <div
        style={{ left: '16.5%', top: '93.0%', maxWidth: '22.0%', height: '1.6%' }}
        className="absolute bg-[#003b8e] inline-flex items-center px-1 rounded-sm w-fit min-w-[11%] z-20 overflow-hidden"
      >
        <span className="text-[#8be9ff] font-extrabold text-[10px] leading-none whitespace-nowrap">
          {formattedDiamonds}
        </span>
      </div>

      {/* 2. Left Player Name */}
      <div
        style={{ left: '13.2%', top: '94.6%', width: '25.0%', height: '1.7%' }}
        className="absolute bg-[#003b8e] flex items-center z-20 overflow-hidden"
      >
        <span className="text-white font-black text-[12px] leading-none truncate">
          {leftPlayer?.name || user.name}
        </span>
      </div>

      {/* 3. Left Player Coins: Positioned cleanly under Hammer (left: 12.6%..38.8%), never touching Center Dice Box */}
      <div
        style={{ left: '12.6%', top: '96.35%', width: '26.6%', height: '2.15%' }}
        className="absolute bg-[#003b8e] flex items-center z-20 overflow-hidden"
      >
        <div className="inline-flex items-center gap-0.5 bg-[#003b8e] pr-1 rounded-sm w-fit max-w-full">
          <img
            src="/assets/ludo/ui/hud_q_coin.png"
            alt="Coins"
            className="h-[13px] w-auto object-contain shrink-0"
            draggable={false}
          />
          <span
            className={`text-white font-extrabold leading-none whitespace-nowrap ${getHudCurrencyFontClass(
              formattedUserCoins
            )}`}
          >
            {formattedUserCoins}
          </span>
        </div>
      </div>

      {/* RIGHT PLAYER (Matched Opponent) NAME & EXPANDING COINS BOX IN BOTTOM BLUE BAR */}
      <div
        style={{ left: '60.0%', top: '94.6%', width: '25.5%', height: '1.7%' }}
        className="absolute bg-[#003b8e] flex items-center z-20 overflow-hidden"
      >
        <span className="text-white font-black text-[12px] leading-none truncate">
          {rightPlayer?.name || 'Rahul Sharma'}
        </span>
      </div>

      <div
        style={{ left: '61.5%', top: '96.35%', width: '25.5%', height: '2.15%' }}
        className="absolute bg-[#003b8e] flex items-center z-20 overflow-hidden"
      >
        <div className="inline-flex items-center gap-1 bg-[#003b8e] pr-1.5 rounded-sm w-fit max-w-full">
          <img
            src="/assets/ludo/ui/hud_right_coin.png"
            alt="Coins"
            className="h-[14px] w-auto object-contain shrink-0"
            draggable={false}
          />
          <span
            className={`text-white font-extrabold leading-none whitespace-nowrap ${getHudCurrencyFontClass(
              formattedRightCoins
            )}`}
          >
            {formattedRightCoins}
          </span>
        </div>
      </div>

      {/* 4. PRESET CHAT & VOICE NOTES OVERLAY (Matches Screenshot 0b842988 & Video 02:28) */}
      {chatModal === 'preset' && (
        <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]/80">
          <img
            src="/assets/ludo/screens/preset_chat_clean.jpg"
            alt="Preset Chat"
            className="w-full h-full object-fill pointer-events-none"
            draggable={false}
          />
          <button
            onClick={() => {
              soundManager.playClick();
              setChatModal('voice');
            }}
            style={{ left: '50.5%', top: '16.5%', width: '43.0%', height: '4.5%' }}
            className="absolute cursor-pointer bg-transparent"
            title="Voice Notes"
          />

          <button
            onClick={() => {
              soundManager.playClick();
              setChatModal(null);
            }}
            style={{ left: '91.0%', top: '21.0%', width: '8.0%', height: '4.0%' }}
            className="absolute cursor-pointer bg-transparent"
            title="Close Chat"
          />

          <div
            style={{ left: '10.5%', top: '25.8%', width: '79.0%', height: '49.0%' }}
            className="absolute grid grid-cols-2 grid-rows-13 gap-x-3 gap-y-1"
          >
            {PRESET_MESSAGES.flat().map((msg, i) => (
              <button
                key={i}
                onClick={() => {
                  soundManager.playChatPop();
                  onSendChat(msg, false);
                  setChatModal(null);
                }}
                className="w-full h-full cursor-pointer bg-transparent"
                title={msg}
              />
            ))}
          </div>

          <button
            onClick={() => {
              onFreeUnlock({
                addCoins: 5000,
                label: 'VIP Chat & King Pass Unlocked FREE!',
              });
              setChatModal(null);
            }}
            style={{ left: '33.0%', top: '77.5%', width: '34.0%', height: '10.0%' }}
            className="absolute cursor-pointer bg-transparent"
          />
        </div>
      )}

      {chatModal === 'voice' && (
        <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]/80">
          <img
            src="/assets/ludo/screens/voice_note_clean.jpg"
            alt="Voice Note"
            className="w-full h-full object-fill pointer-events-none"
            draggable={false}
          />
          <button
            onClick={() => {
              soundManager.playClick();
              setChatModal('preset');
            }}
            style={{ left: '7.0%', top: '16.5%', width: '43.0%', height: '4.5%' }}
            className="absolute cursor-pointer bg-transparent"
          />

          <button
            onClick={() => {
              soundManager.playClick();
              setChatModal(null);
            }}
            style={{ left: '91.0%', top: '21.0%', width: '8.0%', height: '4.0%' }}
            className="absolute cursor-pointer bg-transparent"
          />

          <div
            style={{ left: '10.5%', top: '26.5%', width: '79.0%', height: '38.0%' }}
            className="absolute grid grid-cols-2 grid-rows-6 gap-2"
          >
            {VOICE_NOTES.flat().map((line, idx) => (
              <button
                key={idx}
                onClick={() => {
                  soundManager.playVoiceNote(line, voiceGender);
                  onSendChat(line, true, voiceGender);
                  setChatModal(null);
                }}
                className="w-full h-full cursor-pointer bg-transparent"
                title={line}
              />
            ))}
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              setChatModal('voice_pack');
            }}
            style={{ left: '12.0%', top: '69.0%', width: '76.0%', height: '6.5%' }}
            className="absolute cursor-pointer bg-transparent"
          />
        </div>
      )}

      {chatModal === 'voice_pack' && (
        <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]/80">
          <img
            src="/assets/ludo/screens/voice_pack_clean.jpg"
            alt="Voice Pack"
            className="w-full h-full object-fill pointer-events-none"
            draggable={false}
          />
          <button
            onClick={() => {
              soundManager.playClick();
              setVoiceGender((g) => (g === 'male' ? 'female' : 'male'));
              setChatModal('voice');
            }}
            style={{ left: '15.0%', top: '30.0%', width: '70.0%', height: '45.0%' }}
            className="absolute cursor-pointer bg-transparent"
          />
          <button
            onClick={() => setChatModal('voice')}
            style={{ left: '84.0%', top: '24.0%', width: '10.0%', height: '5.0%' }}
            className="absolute cursor-pointer bg-transparent"
          />
        </div>
      )}

      {/* 5. FULL-SCREEN "QUIT GAME? Your opponent will win if you quit!" OVERLAY (Matches Video 03:26 - 03:28, ad-free!) */}
      {showQuitConfirm && !exitingMascot && (
        <div className="absolute inset-0 z-50 overflow-hidden select-none">
          <img
            src="/assets/ludo/screens/game_quit_confirm_clean.jpg"
            alt="Quit Game?"
            className="w-full h-full object-fill pointer-events-none"
            draggable={false}
          />

          {/* [ Yes ] Button Hitbox (left: 5.8%, top: 76.8%, width: 16.5%, height: 4.8%) */}
          <button
            onClick={handleConfirmQuitYes}
            style={{ left: '5.5%', top: '76.5%', width: '17.2%', height: '5.2%' }}
            className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
            title="Yes, Quit Game"
          />

          {/* 4 Center Icon Buttons inside Quit Screen: [🔊] [📳] [📣] [🎵] */}
          <button
            onClick={() => {
              const next = soundManager.toggleSound();
              setSoundOn(next);
              if (next) soundManager.playClick();
            }}
            style={{ left: '26.8%', top: '76.8%', width: '9.5%', height: '4.6%' }}
            className="absolute cursor-pointer bg-transparent flex items-center justify-center"
            title="Toggle Sound"
          >
            {!soundOn && (
              <div className="w-4/5 h-[3px] bg-red-600 rotate-45 shadow-[0_0_4px_#000]" />
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              soundManager.vibrationEnabled = !soundManager.vibrationEnabled;
              setVibrateOn(soundManager.vibrationEnabled);
            }}
            style={{ left: '39.2%', top: '76.8%', width: '9.5%', height: '4.6%' }}
            className="absolute cursor-pointer bg-transparent flex items-center justify-center"
            title="Toggle Vibration"
          >
            {!vibrateOn && (
              <div className="w-4/5 h-[3px] bg-red-600 rotate-45 shadow-[0_0_4px_#000]" />
            )}
          </button>

          <button
            onClick={() => {
              onToggleAuto();
            }}
            style={{ left: '51.5%', top: '76.8%', width: '9.5%', height: '4.6%' }}
            className="absolute cursor-pointer bg-transparent flex items-center justify-center"
            title="Toggle Auto-Play"
          />

          <button
            onClick={() => {
              soundManager.playClick();
              const next = soundManager.toggleMusic();
              setMusicOn(next);
            }}
            style={{ left: '63.8%', top: '76.8%', width: '9.5%', height: '4.6%' }}
            className="absolute cursor-pointer bg-transparent flex items-center justify-center"
            title="Toggle Music"
          >
            {!musicOn && (
              <div className="w-4/5 h-[3px] bg-red-600 rotate-45 shadow-[0_0_4px_#000]" />
            )}
          </button>

          {/* [ No ] Button Hitbox (left: 77.2%, top: 76.5%, width: 17.2%, height: 5.2%) */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowQuitConfirm(false);
            }}
            style={{ left: '77.2%', top: '76.5%', width: '17.2%', height: '5.2%' }}
            className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
            title="No, Continue Playing"
          />
        </div>
      )}

      {/* 6. LUDO KING MASCOT SPINNING RING TRANSITION WHEN EXITING TO HOME (Matches Video 03:29 - 03:30) */}
      {exitingMascot && (
        <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center pointer-events-none">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl">
              <img
                src="/assets/ludo/ui/mascot_spinner.png"
                alt="Loading Home"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <div className="absolute inset-0 rounded-full border-[5px] border-dashed border-[#ff6b00] animate-spin" />
          </div>
        </div>
      )}

      {/* 7. WINNER CELEBRATION OVERLAY */}
      {room.status === 'FINISHED' && !exitingMascot && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
          <img
            src="/assets/ludo/ludo_king_logo.png"
            alt="Ludo King"
            className="w-44 mb-4 drop-shadow-[0_6px_20px_rgba(255,215,0,0.6)]"
          />
          <div className="bg-gradient-to-b from-[#0d47a1] to-[#051d4d] border-[3px] border-[#ffd700] rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <h2 className="text-[#ffe23b] font-black text-2xl uppercase mb-2">
              🏆 CONGRATULATIONS!
            </h2>
            <p className="text-white font-bold text-sm mb-4">
              Winner:{' '}
              <span className="text-[#4cff2b]">
                {room.players.find((p) => p.id === room.winnerId)?.name || user.name}
              </span>
            </p>
            <button
              onClick={onQuitGame}
              className="w-full py-3 rounded-xl bg-gradient-to-b from-[#33e227] to-[#118c09] border-2 border-[#a5ff90] text-white font-black text-base uppercase cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
