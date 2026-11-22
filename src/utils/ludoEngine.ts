import { GameModeType, GameRoom, PlayerColor, RoomPlayer } from '../types/game';

// 52-square clockwise outer track starting from Blue's start square [13, 6]
export const OUTER_TRACK: [number, number][] = [
  // Blue start column going UP (0..4)
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Left arm bottom row going LEFT (5..10) - index 8 is [8,2] Star
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left edge going UP (11..12)
  [7, 0], [6, 0],
  // Left arm top row going RIGHT (13..17) - index 13 is [6,1] Red Start
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Top arm left col going UP (18..23) - index 21 is [2,6] Star
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top edge going RIGHT (24..25)
  [0, 7], [0, 8],
  // Top arm right col going DOWN (26..30) - index 26 is [1,8] Green Start
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Right arm top row going RIGHT (31..36) - index 34 is [6,12] Star
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right edge going DOWN (37..38)
  [7, 14], [8, 14],
  // Right arm bottom row going LEFT (39..43) - index 39 is [8,13] Yellow Start
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Bottom arm right col going DOWN (44..49) - index 47 is [12,8] Star
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom edge going LEFT (50..51)
  [14, 7], [14, 6],
];

export const COLOR_START_OFFSET: Record<PlayerColor, number> = {
  blue: 0,
  red: 13,
  green: 26,
  yellow: 39,
};

export const HOME_STRETCH_COORDS: Record<PlayerColor, [number, number][]> = {
  blue: [
    [13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7], // index 5 is finished triangle
  ],
  red: [
    [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6],
  ],
  green: [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  ],
  yellow: [
    [7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8],
  ],
};

// Base yard token circle coordinates (fractional row/col inside the 6x6 base)
export const BASE_YARD_COORDS: Record<PlayerColor, [number, number][]> = {
  red: [
    [1.85, 1.85], [1.85, 3.85], [3.85, 1.85], [3.85, 3.85],
  ],
  green: [
    [1.85, 10.85], [1.85, 12.85], [3.85, 10.85], [3.85, 12.85],
  ],
  blue: [
    [10.85, 1.85], [10.85, 3.85], [12.85, 1.85], [12.85, 3.85],
  ],
  yellow: [
    [10.85, 10.85], [10.85, 12.85], [12.85, 10.85], [12.85, 12.85],
  ],
};

// Safe global track indices (4 colored start squares + 4 star squares)
export const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const STAR_COORDS: [number, number][] = [
  [8, 2],
  [2, 6],
  [6, 12],
  [12, 8],
];

export function getGlobalTrackIndex(color: PlayerColor, step: number): number | null {
  if (step < 0 || step > 50) return null;
  return (COLOR_START_OFFSET[color] + step) % 52;
}

export function getTokenBoardCoord(
  color: PlayerColor,
  step: number,
  tokenIndex: number
): [number, number] {
  if (step === -1) {
    return BASE_YARD_COORDS[color][tokenIndex];
  }
  if (step >= 0 && step <= 50) {
    const globalIdx = (COLOR_START_OFFSET[color] + step) % 52;
    return OUTER_TRACK[globalIdx];
  }
  if (step >= 51 && step <= 56) {
    return HOME_STRETCH_COORDS[color][step - 51];
  }
  return HOME_STRETCH_COORDS[color][5];
}

export function getTokenGridCoords(
  color: PlayerColor,
  tokenIndex: number,
  step: number
): { col: number; row: number } {
  const [r, c] = getTokenBoardCoord(color, step, tokenIndex);
  if (step === -1) {
    return { col: c + 0.5, row: r + 0.5 };
  }
  return { col: c + 0.5, row: r + 0.5 };
}

export function getMovableTokenIndices(player: RoomPlayer, diceValue: number): number[] {
  const movable: number[] = [];
  player.tokens.forEach((pos, idx) => {
    if (pos === -1) {
      if (diceValue === 6) {
        movable.push(idx);
      }
    } else if (pos >= 0 && pos < 56) {
      if (pos + diceValue <= 56) {
        movable.push(idx);
      }
    }
  });
  return movable;
}

export function getValidTokenMoves(
  player: RoomPlayer | undefined,
  diceValue: number,
  _allPlayers?: RoomPlayer[]
): number[] {
  if (!player) return [];
  return getMovableTokenIndices(player, diceValue);
}

export function getOppositeColor(color: PlayerColor): PlayerColor {
  switch (color) {
    case 'blue':
      return 'green';
    case 'green':
      return 'blue';
    case 'red':
      return 'yellow';
    case 'yellow':
      return 'red';
  }
}

export function getInitialTokensForMode(gameMode: GameModeType): [number, number, number, number] {
  if (gameMode === 'QUICK') {
    // In Quick mode, 2 tokens start already out on the start square
    return [0, 0, -1, -1];
  }
  return [-1, -1, -1, -1];
}

export function checkPlayerWon(player: RoomPlayer, gameMode: GameModeType): boolean {
  if (gameMode === '1 KILL WIN') {
    return player.kills >= 1 || player.tokens.every((t) => t === 56);
  }
  if (gameMode === 'QUICK') {
    // In Quick Ludo, getting 2 tokens home wins the match
    return player.tokens.filter((t) => t === 56).length >= 2;
  }
  return player.tokens.every((t) => t === 56);
}

/**
 * Evaluates and chooses the best token index for a Bot or Auto-Play move
 */
export function chooseSmartTokenMove(
  room: GameRoom,
  player: RoomPlayer,
  diceValue: number
): number | null {
  const validIndices = getMovableTokenIndices(player, diceValue);
  if (validIndices.length === 0) return null;
  if (validIndices.length === 1) return validIndices[0];

  let bestIdx = validIndices[0];
  let bestScore = -9999;

  for (const idx of validIndices) {
    const currentStep = player.tokens[idx];
    const nextStep = currentStep === -1 ? 0 : currentStep + diceValue;
    let score = 0;

    // 1. Entering home triangle (step 56) is highest priority
    if (nextStep === 56) {
      score += 500;
    }

    // 2. Capturing an opponent token
    if (nextStep >= 0 && nextStep <= 50) {
      const targetGlobal = getGlobalTrackIndex(player.color, nextStep);
      if (targetGlobal !== null && !SAFE_TRACK_INDICES.has(targetGlobal)) {
        for (const other of room.players) {
          if (other.id === player.id) continue;
          const oppTokensAtTarget = other.tokens.filter(
            (t) => getGlobalTrackIndex(other.color, t) === targetGlobal
          );
          if (oppTokensAtTarget.length === 1) {
            score += 400;
          }
        }
      }
    }

    // 3. Bringing a new token out of base on a 6
    if (currentStep === -1 && diceValue === 6) {
      score += 220;
    }

    // 4. Landing on a safe square
    if (nextStep >= 0 && nextStep <= 50) {
      const targetGlobal = getGlobalTrackIndex(player.color, nextStep);
      if (targetGlobal !== null && SAFE_TRACK_INDICES.has(targetGlobal)) {
        score += 120;
      }
    }

    // 5. Entering home stretch (51..55)
    if (nextStep >= 51 && nextStep <= 55) {
      score += 150;
    }

    // 6. Advancing the furthest token
    score += nextStep * 2;

    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  }

  return bestIdx;
}
