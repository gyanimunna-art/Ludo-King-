import React, { useState, useEffect } from 'react';
import { UserProfile, GameRoom, GameSubMode, PlayerColor } from '../types/game';
import { soundManager } from '../utils/soundManager';
import { TopBarOverlay } from './ModalsAndTabs';

const ENTRY_TIERS = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
const COLORS: PlayerColor[] = ['blue', 'red', 'green', 'yellow'];
const COLOR_LEFT_PCT: Record<PlayerColor, string> = {
  blue: '21.8%',
  red: '37.5%',
  green: '53.0%',
  yellow: '68.6%',
};

const SUBMODES: { mode: GameSubMode; topPct: string }[] = [
  { mode: 'CLASSIC', topPct: '39.6%' },
  { mode: '1 KILL WIN', topPct: '47.3%' },
  { mode: 'QUICK', topPct: '55.0%' },
  { mode: 'POPULAR', topPct: '62.8%' },
  { mode: 'MASK', topPct: '70.5%' },
];

/* =========================================================================
   1. ONLINE MULTIPLAYER SETUP MODAL (Matches online_step1.jpg & online_step2.jpg)
   ========================================================================= */
export const OnlineSetupModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onStartOnline: (
    subMode: GameSubMode,
    maxPlayers: 2 | 4,
    entryAmount: number,
    color: PlayerColor
  ) => void;
}> = ({ user, onClose, onStartOnline }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [subMode, setSubMode] = useState<GameSubMode>('CLASSIC');
  const [color, setColor] = useState<PlayerColor>('blue');
  const [maxPlayers, setMaxPlayers] = useState<2 | 4>(2);
  const [tierIdx, setTierIdx] = useState(1); // Default 500 matching screenshot

  const entryAmount = ENTRY_TIERS[tierIdx];
  const winAmount = Math.floor(entryAmount * (maxPlayers === 2 ? 1.9 : 3.6));

  if (step === 1) {
    return (
      <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
        <img
          src="/assets/ludo/screens/online_step1.jpg"
          alt="Select Game"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
        <TopBarOverlay user={user} dimmed />

        {/* Live Modal Header Coins & Diamonds (y=28.3% in online_step1.jpg) */}
        <div
          style={{ left: '19.5%', top: '28.3%', maxWidth: '24.5%', height: '2.5%' }}
          className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[18%] overflow-hidden"
        >
          <span className="text-white font-extrabold text-[12px] leading-none whitespace-nowrap">
            {user.coins.toLocaleString()}
          </span>
        </div>
        <div
          style={{ left: '76.5%', top: '28.3%', maxWidth: '17.0%', height: '2.5%' }}
          className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[12%] overflow-hidden"
        >
          <span className="text-white font-extrabold text-[12px] leading-none whitespace-nowrap">
            {user.diamonds.toLocaleString()}
          </span>
        </div>

        {/* Radio Checkmark Overlay for Selected SubMode */}
        {SUBMODES.map((item) => {
          const isSelected = subMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => {
                soundManager.playClick();
                setSubMode(item.mode);
              }}
              style={{ left: '34.5%', top: item.topPct, width: '45.0%', height: '5.2%' }}
              className="absolute cursor-pointer bg-transparent flex items-center"
            >
              <div
                style={{ width: '20.5%', height: '86%', marginLeft: '1.2%' }}
                className="rounded-full bg-[#062f78] border-2 border-[#f5be2e] flex items-center justify-center"
              >
                {isSelected && (
                  <span className="text-[#f7c631] font-black text-base leading-none">✔</span>
                )}
              </div>
            </button>
          );
        })}

        {/* Next Button Hitbox */}
        <button
          onClick={() => {
            soundManager.playClick();
            setStep(2);
          }}
          style={{ left: '34.5%', top: '80.6%', width: '31.0%', height: '5.8%' }}
          className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
          title="Next"
        />

        {/* Bottom-Left Back Button */}
        <button
          onClick={onClose}
          style={{ left: '2.0%', top: '94.0%', width: '12.5%', height: '5.5%' }}
          className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
          title="Back"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
      <img
        src="/assets/ludo/screens/online_step2.jpg"
        alt="Online Setup Step 2"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      <TopBarOverlay user={user} dimmed />

      {/* Modal Header Coins & Diamonds (y=13.1% in online_step2.jpg) */}
      <div
        style={{ left: '20.5%', top: '13.1%', maxWidth: '24.5%', height: '2.3%' }}
        className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[18%] overflow-hidden"
      >
        <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
          {user.coins.toLocaleString()}
        </span>
      </div>
      <div
        style={{ left: '76.5%', top: '13.1%', maxWidth: '17.0%', height: '2.3%' }}
        className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[12%] overflow-hidden"
      >
        <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
          {user.diamonds.toLocaleString()}
        </span>
      </div>

      {/* SELECT TOKEN / COLOR Radio Circles (y=27.3%) */}
      {COLORS.map((c) => {
        const selected = color === c;
        const bgColors: Record<PlayerColor, string> = {
          blue: '#1ca3ff',
          red: '#ff1616',
          green: '#00ec5a',
          yellow: '#ffe119',
        };
        return (
          <button
            key={c}
            onClick={() => {
              soundManager.playClick();
              setColor(c);
            }}
            style={{ left: COLOR_LEFT_PCT[c], top: '27.3%', width: '8.2%', height: '3.8%' }}
            className="absolute rounded-full border-2 border-white/80 flex items-center justify-center cursor-pointer shadow-md"
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ backgroundColor: bgColors[c] }}
            >
              {selected && (
                <span className="text-white font-black text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  ✔
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* SELECT PLAYERS: 2 PLAYERS vs 4 PLAYERS (y=39.6% and y=47.3%) */}
      <button
        onClick={() => {
          soundManager.playClick();
          setMaxPlayers(2);
        }}
        style={{ left: '35.5%', top: '39.6%', width: '36.0%', height: '4.6%' }}
        className="absolute cursor-pointer bg-transparent flex items-center"
      >
        <div
          style={{ width: '24%', height: '90%' }}
          className="rounded-full bg-[#062f78] border-2 border-[#f5be2e] flex items-center justify-center"
        >
          {maxPlayers === 2 && <span className="text-[#f7c631] font-black text-base">✔</span>}
        </div>
      </button>

      <button
        onClick={() => {
          soundManager.playClick();
          setMaxPlayers(4);
        }}
        style={{ left: '35.5%', top: '47.3%', width: '36.0%', height: '4.6%' }}
        className="absolute cursor-pointer bg-transparent flex items-center"
      >
        <div
          style={{ width: '24%', height: '90%' }}
          className="rounded-full bg-[#062f78] border-2 border-[#f5be2e] flex items-center justify-center"
        >
          {maxPlayers === 4 && <span className="text-[#f7c631] font-black text-base">✔</span>}
        </div>
      </button>

      {/* SELECT GAME Entry Amount Controls (- / WIN / Entry / +) */}
      <button
        onClick={() => {
          soundManager.playClick();
          setTierIdx((i) => Math.max(0, i - 1));
        }}
        style={{ left: '18.5%', top: '66.2%', width: '11.5%', height: '5.2%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
      />

      {/* Dynamic WIN Amount Overlay */}
      <div
        style={{ left: '38.0%', top: '67.4%', width: '24.0%', height: '3.2%' }}
        className="absolute bg-[#3d5b1f] rounded flex items-center justify-center"
      >
        <span className="text-white font-black text-[13px] leading-none">
          {winAmount.toLocaleString()}
        </span>
      </div>

      {/* Dynamic Entry Amount Overlay */}
      <div
        style={{ left: '36.5%', top: '72.0%', width: '27.0%', height: '2.8%' }}
        className="absolute bg-[#f8ba1c] rounded flex items-center justify-center"
      >
        <span className="text-black font-black text-[12px] leading-none">
          Entry: {entryAmount.toLocaleString()}
        </span>
      </div>

      {/* Plus Button */}
      <button
        onClick={() => {
          soundManager.playClick();
          setTierIdx((i) => Math.min(ENTRY_TIERS.length - 1, i + 1));
        }}
        style={{ left: '69.2%', top: '66.2%', width: '11.5%', height: '5.2%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
      />

      {/* Play Button Hitbox */}
      <button
        onClick={() => onStartOnline(subMode, maxPlayers, entryAmount, color)}
        style={{ left: '35.5%', top: '78.2%', width: '29.0%', height: '5.0%' }}
        className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
        title="Play Online"
      />

      {/* Bottom-Left Back Button */}
      <button
        onClick={() => {
          soundManager.playClick();
          setStep(1);
        }}
        style={{ left: '2.0%', top: '94.0%', width: '12.5%', height: '5.5%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
        title="Back"
      />
    </div>
  );
};

/* =========================================================================
   2. PLAY WITH FRIENDS MODAL (Create Room & Join Room via Code)
      Matches friends_create_step1.jpg, friends_create_step2.jpg,
      friends_join_tab.jpg, and friends_invalid_code.jpg 100%!
   ========================================================================= */
export const FriendsSetupModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onCreateFriendsRoom: (
    subMode: GameSubMode,
    maxPlayers: 2 | 3 | 4 | 5 | 6,
    entryAmount: number,
    color: PlayerColor
  ) => void;
  onJoinFriendsRoom: (
    code: string,
    color: PlayerColor
  ) => Promise<{ ok: boolean; error?: string }>;
}> = ({ user, onClose, onCreateFriendsRoom, onJoinFriendsRoom }) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4 | 5 | 6>(4);
  const [tierIdx, setTierIdx] = useState(0); // Default 100 matching screenshot edc9a22a
  const [color, setColor] = useState<PlayerColor>('blue');
  const [subMode, setSubMode] = useState<GameSubMode>('CLASSIC');
  const [joinCode, setJoinCode] = useState('');
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);

  const entryAmount = ENTRY_TIERS[tierIdx];

  const handleJoinSubmit = async () => {
    if (!joinCode.trim()) {
      soundManager.playInvalid();
      setShowInvalidPopup(true);
      return;
    }
    const res = await onJoinFriendsRoom(joinCode.trim(), color);
    if (!res.ok) {
      setShowInvalidPopup(true);
    }
  };

  // Invalid Private Room Code Screen (Matches Video 04:48.5)
  if (showInvalidPopup) {
    return (
      <div
        onClick={() => setShowInvalidPopup(false)}
        className="absolute inset-0 z-50 overflow-hidden cursor-pointer bg-[#02091c]"
      >
        <img
          src="/assets/ludo/screens/friends_invalid_code.jpg"
          alt="Invalid Private Room Code"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
      </div>
    );
  }

  // CREATE ROOM - STEP 2 (SELECT TOKEN/COLOR + SELECT GAME + Create Room)
  if (tab === 'create' && createStep === 2) {
    const friendsSubModes: { mode: GameSubMode; topPct: string }[] = [
      { mode: 'CLASSIC', topPct: '48.8%' },
      { mode: '1 KILL WIN', topPct: '55.0%' },
      { mode: 'QUICK', topPct: '61.4%' },
      { mode: 'POPULAR', topPct: '67.8%' },
    ];

    return (
      <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
        <img
          src="/assets/ludo/screens/friends_create_step2.jpg"
          alt="Create Room Step 2"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
        <TopBarOverlay user={user} dimmed />

        {/* Modal Header Coins & Diamonds (y=19.3% in friends_create_step2.jpg) */}
        <div
          style={{ left: '25.5%', top: '19.3%', maxWidth: '22.5%', height: '2.3%' }}
          className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[16%] overflow-hidden"
        >
          <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
            {user.coins.toLocaleString()}
          </span>
        </div>
        <div
          style={{ left: '71.5%', top: '19.3%', maxWidth: '17.0%', height: '2.3%' }}
          className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[12%] overflow-hidden"
        >
          <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
            {user.diamonds.toLocaleString()}
          </span>
        </div>

        {/* SELECT TOKEN / COLOR Radio Circles (y=35.4%) */}
        {COLORS.map((c) => {
          const selected = color === c;
          const bgColors: Record<PlayerColor, string> = {
            blue: '#1ca3ff',
            red: '#ff1616',
            green: '#00ec5a',
            yellow: '#ffe119',
          };
          return (
            <button
              key={c}
              onClick={() => {
                soundManager.playClick();
                setColor(c);
              }}
              style={{ left: COLOR_LEFT_PCT[c], top: '35.4%', width: '9.0%', height: '4.2%' }}
              className="absolute rounded-full border-2 border-white/80 flex items-center justify-center cursor-pointer shadow-md"
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ backgroundColor: bgColors[c] }}
              >
                {selected && (
                  <span className="text-white font-black text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    ✔
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* SELECT GAME SubMode Radio Buttons */}
        {friendsSubModes.map((item) => {
          const isSelected = subMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => {
                soundManager.playClick();
                setSubMode(item.mode);
              }}
              style={{ left: '37.0%', top: item.topPct, width: '40.0%', height: '4.6%' }}
              className="absolute cursor-pointer bg-transparent flex items-center"
            >
              <div
                style={{ width: '21.5%', height: '86%', marginLeft: '1%' }}
                className="rounded-full bg-[#062f78] border-2 border-[#f5be2e] flex items-center justify-center"
              >
                {isSelected && <span className="text-[#f7c631] font-black text-sm">✔</span>}
              </div>
            </button>
          );
        })}

        {/* Create Room Button Hitbox */}
        <button
          onClick={() => onCreateFriendsRoom(subMode, maxPlayers, entryAmount, color)}
          style={{ left: '29.0%', top: '76.0%', width: '42.0%', height: '6.0%' }}
          className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
          title="Create Room"
        />

        {/* Back Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            setCreateStep(1);
          }}
          style={{ left: '4.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
          className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
        />
      </div>
    );
  }

  // JOIN ROOM TAB (Matches friends_join_tab.jpg)
  if (tab === 'join') {
    return (
      <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
        <img
          src="/assets/ludo/screens/friends_join_tab.jpg"
          alt="Join Private Room"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
        <TopBarOverlay user={user} dimmed />

        {/* Modal Header Coins & Diamonds (y=14.6%) */}
        <div
          style={{ left: '17.8%', top: '14.6%', maxWidth: '22.5%', height: '2.3%' }}
          className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[16%] overflow-hidden"
        >
          <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
            {user.coins.toLocaleString()}
          </span>
        </div>
        <div
          style={{ left: '74.5%', top: '14.6%', maxWidth: '17.0%', height: '2.3%' }}
          className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[12%] overflow-hidden"
        >
          <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
            {user.diamonds.toLocaleString()}
          </span>
        </div>

        {/* SELECT TOKEN / COLOR Radio Circles (y=36.9%) */}
        {COLORS.map((c) => {
          const selected = color === c;
          const bgColors: Record<PlayerColor, string> = {
            blue: '#1ca3ff',
            red: '#ff1616',
            green: '#00ec5a',
            yellow: '#ffe119',
          };
          return (
            <button
              key={c}
              onClick={() => {
                soundManager.playClick();
                setColor(c);
              }}
              style={{ left: COLOR_LEFT_PCT[c], top: '36.9%', width: '9.0%', height: '4.2%' }}
              className="absolute rounded-full border-2 border-white/80 flex items-center justify-center cursor-pointer shadow-md"
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ backgroundColor: bgColors[c] }}
              >
                {selected && (
                  <span className="text-white font-black text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    ✔
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Create Tab Switch Hitbox */}
        <button
          onClick={() => {
            soundManager.playClick();
            setTab('create');
          }}
          style={{ left: '15.0%', top: '44.8%', width: '34.0%', height: '4.8%' }}
          className="absolute cursor-pointer bg-transparent"
        />

        {/* ENTER PRIVATE CODE Input Field (Positioned 100% inside the white dashed rectangle) */}
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Enter private code here..."
          maxLength={12}
          style={{ left: '15.2%', top: '61.8%', width: '69.6%', height: '4.1%' }}
          className="absolute bg-white text-[#08245e] placeholder-[#9ca3af] font-black text-base text-center rounded-md outline-none"
        />

        {/* Join Room Button Hitbox */}
        <button
          onClick={handleJoinSubmit}
          style={{ left: '27.0%', top: '69.2%', width: '46.0%', height: '6.0%' }}
          className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
          title="Join Room"
        />

        {/* Bottom-Left Back Button */}
        <button
          onClick={onClose}
          style={{ left: '4.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
          className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
        />
      </div>
    );
  }

  // CREATE ROOM - STEP 1 (Matches Screenshot edc9a22a 100%)
  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
      <img
        src="/assets/ludo/screens/friends_create_step1.jpg"
        alt="Friends Create Step 1"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      <TopBarOverlay user={user} dimmed />

      {/* Modal Header Coins & Diamonds (y=20.2% in friends_create_step1.jpg) */}
      <div
        style={{ left: '22.8%', top: '20.2%', maxWidth: '24.0%', height: '2.3%' }}
        className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[16%] overflow-hidden"
      >
        <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
          {user.coins.toLocaleString()}
        </span>
      </div>
      <div
        style={{ left: '71.2%', top: '20.2%', maxWidth: '17.0%', height: '2.3%' }}
        className="absolute bg-[#030e29] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[12%] overflow-hidden"
      >
        <span className="text-white font-extrabold text-[11.5px] leading-none whitespace-nowrap">
          {user.diamonds.toLocaleString()}
        </span>
      </div>

      {/* SELECT PLAYERS 4 Cards (2P/3P/4P, Team Up, 5P, 6P) */}
      <button
        onClick={() => {
          soundManager.playClick();
          setMaxPlayers(4);
        }}
        style={{ left: '21.0%', top: '32.8%', width: '14.0%', height: '8.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setMaxPlayers(4);
        }}
        style={{ left: '36.0%', top: '32.8%', width: '13.5%', height: '8.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setMaxPlayers(5);
        }}
        style={{ left: '51.0%', top: '32.8%', width: '13.0%', height: '8.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setMaxPlayers(6);
        }}
        style={{ left: '65.5%', top: '32.8%', width: '13.0%', height: '8.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* Join Tab Switch Hitbox */}
      <button
        onClick={() => {
          soundManager.playClick();
          setTab('join');
        }}
        style={{ left: '50.5%', top: '45.8%', width: '31.0%', height: '4.4%' }}
        className="absolute cursor-pointer bg-transparent"
        title="Switch to Join Room"
      />

      {/* Entry Amount Minus Button */}
      <button
        onClick={() => {
          soundManager.playClick();
          setTierIdx((i) => Math.max(0, i - 1));
        }}
        style={{ left: '22.5%', top: '63.5%', width: '9.5%', height: '4.4%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
      />

      {/* Live Entry Amount Overlay inside Gold Box (covers static 100) */}
      <div
        style={{ left: '40.2%', top: '64.3%', width: '19.6%', height: '2.7%' }}
        className="absolute bg-[#4b4837] rounded flex items-center justify-center"
      >
        <span className="text-white font-black text-[13px] leading-none">
          {entryAmount.toLocaleString()}
        </span>
      </div>

      {/* Entry Amount Plus Button */}
      <button
        onClick={() => {
          soundManager.playClick();
          setTierIdx((i) => Math.min(ENTRY_TIERS.length - 1, i + 1));
        }}
        style={{ left: '67.8%', top: '63.5%', width: '9.5%', height: '4.4%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
      />

      {/* Next Button Hitbox */}
      <button
        onClick={() => {
          soundManager.playClick();
          setCreateStep(2);
        }}
        style={{ left: '37.0%', top: '73.5%', width: '26.0%', height: '4.8%' }}
        className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
        title="Next"
      />

      {/* Bottom-Left Back Button */}
      <button
        onClick={onClose}
        style={{ left: '4.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
        title="Back"
      />
    </div>
  );
};

/* =========================================================================
   3. TEAM UP, COMPUTER & PASS N PLAY SETUP MODALS
   ========================================================================= */
export const TeamUpSetupModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onCreateTeamUp: (subMode: GameSubMode, entryAmount: number, color: PlayerColor) => void;
  onJoinTeamUp: (code: string, color: PlayerColor) => Promise<{ ok: boolean; error?: string }>;
}> = ({ user, onClose, onCreateTeamUp }) => (
  <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
    <img
      src="/assets/ludo/screens/teamup_setup.jpg"
      alt="Team Up Setup"
      className="w-full h-full object-fill pointer-events-none"
      draggable={false}
    />
    <TopBarOverlay user={user} dimmed />
    <button
      onClick={() => onCreateTeamUp('CLASSIC', 500, 'blue')}
      style={{ left: '15.0%', top: '30.0%', width: '70.0%', height: '55.0%' }}
      className="absolute cursor-pointer bg-transparent"
    />
    <button
      onClick={onClose}
      style={{ left: '4.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
      className="absolute cursor-pointer bg-transparent"
    />
  </div>
);

export const ComputerSetupModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onStartComputer: (subMode: GameSubMode, maxPlayers: 2 | 4, color: PlayerColor) => void;
}> = ({ user, onClose, onStartComputer }) => {
  const [subMode, setSubMode] = useState<GameSubMode>('CLASSIC');

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
      <img
        src="/assets/ludo/screens/computer_setup.jpg"
        alt="Computer Mode Setup"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />
      <TopBarOverlay user={user} dimmed />
      <button
        onClick={() => {
          soundManager.playClick();
          setSubMode('CLASSIC');
        }}
        style={{ left: '25.0%', top: '42.0%', width: '50.0%', height: '7.0%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setSubMode('QUICK');
        }}
        style={{ left: '25.0%', top: '51.0%', width: '50.0%', height: '7.0%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => onStartComputer(subMode, 2, 'blue')}
        style={{ left: '34.0%', top: '71.0%', width: '32.0%', height: '6.5%' }}
        className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
      />
      <button
        onClick={onClose}
        style={{ left: '4.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />
    </div>
  );
};

export const PassNPlaySetupModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onStartPassNPlay: (
    subMode: GameSubMode,
    maxPlayers: 2 | 3 | 4,
    color: PlayerColor,
    names: string[]
  ) => void;
}> = ({ user, onClose, onStartPassNPlay }) => (
  <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
    <img
      src="/assets/ludo/screens/passnplay_setup.jpg"
      alt="Pass N Play Setup"
      className="w-full h-full object-fill pointer-events-none"
      draggable={false}
    />
    <TopBarOverlay user={user} dimmed />
    <button
      onClick={() =>
        onStartPassNPlay('CLASSIC', 2, 'blue', ['Player 1', 'Player 2', 'Player 3', 'Player 4'])
      }
      style={{ left: '25.0%', top: '38.0%', width: '50.0%', height: '42.0%' }}
      className="absolute cursor-pointer bg-transparent"
    />
    <button
      onClick={onClose}
      style={{ left: '4.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
      className="absolute cursor-pointer bg-transparent"
    />
  </div>
);

/* =========================================================================
   4. RED ROOM LOBBY & ONLINE MATCHMAKING SCREEN
      Matches:
      - online_searching.jpg (Screenshot f4340823 & Video 02:02-02:05)
      - online_matched.jpg (Screenshot ce04df04 & Video 02:06-02:08)
      - friends_room_lobby.jpg
      - friends_buddies_modal.jpg
      - friends_quit_room.jpg
   ========================================================================= */
export interface MatchedOpponentInfo {
  name: string;
  avatar: string;
  coins: number;
  diamonds: number;
}

const MATCHMAKING_POOL: MatchedOpponentInfo[] = [
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

let lastMatchedPoolIdx = -1;
function pickRandomMatchOpponent(): MatchedOpponentInfo {
  let idx = Math.floor(Math.random() * MATCHMAKING_POOL.length);
  if (idx === lastMatchedPoolIdx) {
    idx = (idx + 1 + Math.floor(Math.random() * (MATCHMAKING_POOL.length - 1))) % MATCHMAKING_POOL.length;
  }
  lastMatchedPoolIdx = idx;
  return MATCHMAKING_POOL[idx];
}

export const PlayerAvatarBox: React.FC<{ avatar: string; name: string }> = ({ avatar, name }) => {
  if (avatar.startsWith('letter:')) {
    const parts = avatar.split(':');
    const bg = parts[1] || '#e33d7a';
    const letter = parts[2] || (name ? name[0].toUpperCase() : 'P');
    return (
      <div
        style={{ backgroundColor: bg }}
        className="w-full h-full flex items-center justify-center text-white font-semibold text-4xl select-none"
      >
        {letter}
      </div>
    );
  }
  return (
    <img
      src={avatar}
      alt={name}
      className="w-full h-full object-cover"
      draggable={false}
    />
  );
};

export const RedRoomLobbyScreen: React.FC<{
  room: GameRoom;
  user: UserProfile;
  onStartMatch: (fillWithBots: boolean, matchedOpponent?: MatchedOpponentInfo) => void;
  onSimulateFriendJoin?: () => void;
  onCancelRoom: () => void;
  onShowToast: (msg: string) => void;
}> = ({ room, user, onStartMatch, onSimulateFriendJoin, onCancelRoom, onShowToast }) => {
  const [searchSec, setSearchSec] = useState(44);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [matchedState, setMatchedState] = useState(false);
  const [matchedOpponent] = useState<MatchedOpponentInfo>(() => pickRandomMatchOpponent());
  const [showBuddiesPopup, setShowBuddiesPopup] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [startingChestAnim, setStartingChestAnim] = useState(false);

  const isOnlineMode = room.type === 'ONLINE';

  // Online Mode automatic matchmaking -> golden chest match -> board launch
  useEffect(() => {
    if (!isOnlineMode) return;
    const cycleTimer = setInterval(() => {
      setCycleIdx((i) => (i + 1) % MATCHMAKING_POOL.length);
    }, 150);
    const secTimer = setInterval(() => {
      setSearchSec((s) => (s > 1 ? s - 1 : 44));
    }, 1000);
    const matchTimeout = setTimeout(() => {
      clearInterval(cycleTimer);
      clearInterval(secTimer);
      setMatchedState(true);
      soundManager.playGameStart();
    }, 2500);
    const launchTimeout = setTimeout(() => {
      onStartMatch(true, matchedOpponent);
    }, 4200);

    return () => {
      clearInterval(cycleTimer);
      clearInterval(secTimer);
      clearTimeout(matchTimeout);
      clearTimeout(launchTimeout);
    };
  }, [isOnlineMode, matchedOpponent]);

  const handleCopyRoomCode = async () => {
    soundManager.playClick();
    try {
      await navigator.clipboard.writeText(room.code);
    } catch {
      const el = document.createElement('textarea');
      el.value = room.code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    onShowToast(`Room Code Copied: ${room.code}`);
  };

  // Trigger Golden Chest + Flying Coins animation on Friends Room Play button tap (00:58 - 01:02)
  const handleTriggerFriendsPlay = () => {
    if (startingChestAnim) return;
    soundManager.playClick();
    if (room.players.length < 2 && onSimulateFriendJoin) {
      onSimulateFriendJoin();
    }
    setStartingChestAnim(true);
    soundManager.playGameStart();
    setTimeout(() => {
      onStartMatch(room.players.length < 2, {
        name: room.players[1]?.name || 'Papa Papa',
        avatar: room.players[1]?.avatar || '/assets/ludo/avatar_p4.png',
        coins: room.players[1]?.coins || 3250,
        diamonds: room.players[1]?.diamonds || 150,
      });
    }, 1850);
  };

  // CASE A: ONLINE MULTIPLAYER SEARCHING & MATCHED (Screenshots f4340823 & ce04df04)
  if (isOnlineMode) {
    const activeOpponent = matchedState ? matchedOpponent : MATCHMAKING_POOL[cycleIdx];

    return (
      <div className="relative w-full h-full overflow-hidden bg-[#5e0404]">
        <img
          src={
            matchedState
              ? '/assets/ludo/screens/online_matched.jpg'
              : '/assets/ludo/screens/online_searching.jpg'
          }
          alt="Online Matchmaking"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />

        {/* Game Mode & Entry Amount Overlay inside Red Table */}
        <div
          style={{ left: '29.5%', top: '35.2%', width: '19.5%', height: '2.5%' }}
          className="absolute bg-[#8c0707] flex items-center justify-center"
        >
          <span className="text-[#ffe23b] font-black text-[14px] leading-none capitalize">
            {room.gameMode.toLowerCase()}
          </span>
        </div>
        <div
          style={{ left: '53.0%', top: '35.2%', width: '23.0%', height: '2.5%' }}
          className="absolute bg-[#8c0707] flex items-center justify-center"
        >
          <span className="text-[#ffe23b] font-black text-[15px] leading-none">
            {room.entryAmount.toLocaleString()}
          </span>
        </div>

        {/* Left Player (User) Avatar & Name */}
        <div
          style={{ left: '16.0%', top: '41.0%', width: '23.1%', height: '10.4%' }}
          className="absolute overflow-hidden"
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
        <div
          style={{ left: '14.0%', top: '52.2%', width: '27.0%', height: '2.4%' }}
          className="absolute bg-[#910b0b] flex items-center justify-center"
        >
          <span className="text-white font-extrabold text-[13px] leading-none truncate">
            {user.name}
          </span>
        </div>

        {/* Right Player (Scrolling Avatar Reel while searching -> Locked Random Opponent when matched!) */}
        <div
          style={{ left: '60.9%', top: '41.0%', width: '23.1%', height: '10.4%' }}
          className="absolute overflow-hidden"
        >
          <PlayerAvatarBox avatar={activeOpponent.avatar} name={activeOpponent.name} />
        </div>

        {/* Right Player Name when Matched (covers static "devil king" in online_matched.jpg) */}
        {matchedState && (
          <div
            style={{ left: '58.5%', top: '52.1%', width: '28.0%', height: '2.5%' }}
            className="absolute bg-[#910b0b] flex items-center justify-center"
          >
            <span className="text-white font-extrabold text-[13px] leading-none truncate">
              {matchedOpponent.name}
            </span>
          </div>
        )}

        {/* Live Countdown Timer (00:44) while searching */}
        {!matchedState && (
          <div
            style={{ left: '46.2%', top: '59.1%', width: '13.5%', height: '2.6%' }}
            className="absolute bg-[#750305] flex items-center justify-center"
          >
            <span className="text-white font-black text-[15px] leading-none">
              00:{searchSec.toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Cancel / Back Button (Bottom-Left) */}
        {!matchedState && (
          <button
            onClick={onCancelRoom}
            style={{ left: '3.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
            className="absolute cursor-pointer bg-transparent"
            title="Cancel Matchmaking"
          />
        )}
      </div>
    );
  }

  // CASE B: FRIENDS PRIVATE ROOM CODE WAITING LOBBY (Video 00:46 - 01:02)
  const joinedOthers = room.players.slice(1);
  const slotLeftPositions = ['11.4%', '38.3%', '65.3%'];

  if (showBuddiesPopup) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#5e0404]">
        <img
          src="/assets/ludo/screens/friends_buddies_modal.jpg"
          alt="Invite Buddies"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
        <button
          onClick={() => {
            soundManager.playClick();
            setShowBuddiesPopup(false);
          }}
          style={{ left: '84.0%', top: '23.5%', width: '11.0%', height: '5.5%' }}
          className="absolute cursor-pointer bg-transparent"
        />
        <button
          onClick={() => {
            if (onSimulateFriendJoin) {
              onSimulateFriendJoin();
            }
            setShowBuddiesPopup(false);
          }}
          style={{ left: '15.0%', top: '32.0%', width: '70.0%', height: '45.0%' }}
          className="absolute cursor-pointer bg-transparent"
          title="Invite Buddy to Room"
        />
      </div>
    );
  }

  if (showQuitConfirm) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#5e0404]">
        <img
          src="/assets/ludo/screens/friends_quit_room.jpg"
          alt="Quit Room"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
        <button
          onClick={onCancelRoom}
          style={{ left: '22.0%', top: '53.0%', width: '25.0%', height: '6.0%' }}
          className="absolute cursor-pointer bg-transparent"
        />
        <button
          onClick={() => {
            soundManager.playClick();
            setShowQuitConfirm(false);
          }}
          style={{ left: '53.0%', top: '53.0%', width: '25.0%', height: '6.0%' }}
          className="absolute cursor-pointer bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#5e0404]">
      <img
        src="/assets/ludo/screens/friends_room_lobby.jpg"
        alt="Friends Room Lobby"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      <TopBarOverlay user={user} dimmed />

      {/* LIVE GENERATED ROOM CODE (e.g. 05906651) inside Dark-Blue Box */}
      <div
        onClick={handleCopyRoomCode}
        style={{ left: '43.6%', top: '28.3%', width: '26.2%', height: '2.9%' }}
        className="absolute bg-[#072a6c] rounded flex items-center justify-center cursor-pointer"
        title="Tap to copy Room Code"
      >
        <span className="text-[#ffe227] font-black text-[16px] tracking-wider leading-none select-all">
          {room.code}
        </span>
      </div>

      {/* Share & WhatsApp Icon Hitboxes */}
      <button
        onClick={handleCopyRoomCode}
        style={{ left: '71.8%', top: '28.0%', width: '16.5%', height: '6.8%' }}
        className="absolute cursor-pointer bg-transparent"
        title="Share / Copy Room Code"
      />

      {/* Dynamic Game Mode & Entry Amount Line (y=37.1%) */}
      <div
        style={{ left: '20.0%', top: '37.1%', width: '60.0%', height: '2.3%' }}
        className="absolute bg-[#8f0b0b] flex items-center justify-center"
      >
        <span className="text-[#4cff2b] font-black text-[13px] leading-none">
          {room.gameMode} &gt; Entry Amount : {room.entryAmount.toLocaleString()}
        </span>
      </div>

      {/* Host Avatar & Name in Center Box */}
      <div
        style={{ left: '37.0%', top: '40.4%', width: '26.0%', height: '11.6%' }}
        className="absolute overflow-hidden"
      >
        <img
          src={room.players[0]?.avatar || user.avatar}
          alt="Host"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div
        style={{ left: '34.0%', top: '52.8%', width: '32.0%', height: '2.4%' }}
        className="absolute bg-[#8f0b0b] flex items-center justify-center"
      >
        <span className="text-white font-extrabold text-[13px] leading-none truncate">
          {room.players[0]?.name || user.name}
        </span>
      </div>

      {/* GOLDEN TREASURE CHEST & FLYING COINS ANIMATION WHEN PLAY IS CLICKED (Video 00:59 - 01:02) */}
      {startingChestAnim && (
        <>
          <div
            style={{ left: '36.8%', top: '54.6%', width: '26.4%', height: '11.8%' }}
            className="absolute z-30 flex items-center justify-center overflow-hidden rounded-lg"
          >
            <img
              src="/assets/ludo/ui/golden_chest.png"
              alt="Golden Prize Chest"
              className="w-full h-full object-cover animate-pulse"
              draggable={false}
            />
          </div>

          {/* Flying Golden Coins from Host (top) and Joined Friend (bottom-left) into the Golden Chest */}
          {[0, 1, 2, 3, 4].map((coinIdx) => (
            <React.Fragment key={coinIdx}>
              <img
                src="/assets/ludo/ui/top_coin_icon.png"
                alt="Flying Coin"
                style={{
                  left: '48%',
                  top: `${46 + coinIdx * 2.5}%`,
                  animationDelay: `${coinIdx * 90}ms`,
                }}
                className="w-5 h-5 absolute z-40 animate-bounce pointer-events-none drop-shadow-[0_0_8px_rgba(255,215,0,0.95)]"
              />
              <img
                src="/assets/ludo/ui/top_coin_icon.png"
                alt="Flying Coin"
                style={{
                  left: `${22 + coinIdx * 5.2}%`,
                  top: `${68 - coinIdx * 2.2}%`,
                  animationDelay: `${coinIdx * 90}ms`,
                }}
                className="w-5 h-5 absolute z-40 animate-bounce pointer-events-none drop-shadow-[0_0_8px_rgba(255,215,0,0.95)]"
              />
            </React.Fragment>
          ))}
        </>
      )}

      {/* 3 Bottom Player Slots ([👤+] or Joined Friend's Live Avatar & Name Below Slot, matching 00:54-01:01) */}
      {[0, 1, 2].map((slotIdx) => {
        const joinedPlayer = joinedOthers[slotIdx];
        return (
          <React.Fragment key={slotIdx}>
            <div
              onClick={() => {
                if (!joinedPlayer) {
                  if (onSimulateFriendJoin) {
                    onSimulateFriendJoin();
                  } else {
                    soundManager.playClick();
                    setShowBuddiesPopup(true);
                  }
                }
              }}
              style={{
                left: slotLeftPositions[slotIdx],
                top: '66.4%',
                width: '23.8%',
                height: '10.6%',
              }}
              className="absolute cursor-pointer overflow-hidden border-2 border-white/90"
              title={joinedPlayer ? joinedPlayer.name : 'Tap to Invite / Join Friend'}
            >
              {joinedPlayer && (
                <div className="w-full h-full relative bg-[#072563]">
                  <PlayerAvatarBox avatar={joinedPlayer.avatar} name={joinedPlayer.name} />
                </div>
              )}
            </div>
            {joinedPlayer && (
              <div
                style={{
                  left: slotLeftPositions[slotIdx],
                  top: '77.4%',
                  width: '23.8%',
                  height: '2.4%',
                }}
                className="absolute flex items-center justify-center pointer-events-none"
              >
                <span className="text-white font-extrabold text-[12px] leading-none truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                  {joinedPlayer.name}
                </span>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Host Green "Play" Button (Appears at 00:54-00:58, hides at 00:59 when Golden Chest appears!) */}
      {!startingChestAnim && (
        <button
          onClick={handleTriggerFriendsPlay}
          style={{ left: '34.5%', top: '82.2%', width: '31.0%', height: '5.5%' }}
          className="absolute rounded-2xl bg-gradient-to-b from-[#69f52c] via-[#34c710] to-[#1d8505] border-[2.5px] border-[#ffdf38] shadow-[0_5px_12px_rgba(0,0,0,0.65)] text-white font-black text-lg tracking-wide flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.85)]">Play</span>
        </button>
      )}

      {/* Bright Green "You will start the game" Text Below Play Button (Matches 00:54 - 01:02) */}
      {(joinedOthers.length >= 1 || startingChestAnim) && (
        <div
          style={{ left: '15.0%', top: '89.0%', width: '70.0%', height: '2.8%' }}
          className="absolute flex items-center justify-center pointer-events-none"
        >
          <span className="text-[#4cff2b] font-extrabold text-[13px] tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            You will start the game
          </span>
        </div>
      )}

      {/* Bottom-Left Back Button -> Opens Quit Room Confirmation */}
      {!startingChestAnim && (
        <button
          onClick={() => {
            soundManager.playClick();
            setShowQuitConfirm(true);
          }}
          style={{ left: '2.5%', top: '93.5%', width: '12.5%', height: '5.5%' }}
          className="absolute cursor-pointer bg-transparent"
          title="Leave Room"
        />
      )}
    </div>
  );
};
