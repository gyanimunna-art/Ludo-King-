import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { soundManager } from '../utils/soundManager';

const AVATAR_LIST = [
  '/assets/ludo/avatar_hammer.png',
  '/assets/ludo/avatar_tyra.png',
  '/assets/ludo/avatar_p1.png',
  '/assets/ludo/avatar_p2.png',
  '/assets/ludo/avatar_p3.png',
  '/assets/ludo/avatar_p4.png',
  '/assets/ludo/avatar_p5.png',
  '/assets/ludo/avatar_p6.png',
];

function getDiamondFontClass(formatted: string): string {
  if (formatted.length >= 10) return 'text-[9px] tracking-tighter';
  if (formatted.length >= 8) return 'text-[10px] tracking-tight';
  if (formatted.length >= 6) return 'text-[11px] tracking-tight';
  return 'text-[12.5px]';
}

function getCoinFontClass(formatted: string): string {
  if (formatted.length >= 12) return 'text-[9.5px] tracking-tighter';
  if (formatted.length >= 10) return 'text-[11px] tracking-tight';
  if (formatted.length >= 8) return 'text-[12px] tracking-tight';
  return 'text-[13px]';
}

function getModalCurrencyFontClass(formatted: string): string {
  if (formatted.length >= 11) return 'text-[10px]';
  if (formatted.length >= 9) return 'text-[11px]';
  return 'text-[12.5px]';
}

/**
 * Reusable Top Bar Overlay that keeps the single original Diamond icon, Coin icon, and Green + buttons
 * from the native Ludo King screen (zero double icons!) while auto-scaling the number inside the
 * dark-blue text box so even 126,450 or 10,453,550 stays 100% inside its box.
 */
export const TopBarOverlay: React.FC<{
  user: UserProfile;
  dimmed?: boolean;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenStore?: (tab: 'coins' | 'diamonds') => void;
}> = ({ user, dimmed = false, onOpenProfile, onOpenSettings, onOpenStore }) => {
  const diamondsStr = user.diamonds.toLocaleString();
  const coinsStr = user.coins.toLocaleString();
  const diamondFont = getDiamondFontClass(diamondsStr);
  const coinFont = getCoinFontClass(coinsStr);

  if (dimmed) {
    return (
      <>
        {/* Dimmed Top Bar Diamonds (strictly inside 35.5%..50.1%) */}
        <div
          style={{ left: '35.5%', top: '6.0%', width: '14.6%', height: '2.35%' }}
          className="absolute bg-[#020a24] flex items-center justify-end pr-1.5 overflow-hidden pointer-events-none"
        >
          <span className={`text-white/40 font-extrabold leading-none whitespace-nowrap ${diamondFont}`}>
            {diamondsStr}
          </span>
        </div>
        {/* Dimmed Top Bar Coins (strictly inside 61.5%..86.5%) */}
        <div
          style={{ left: '61.5%', top: '6.0%', width: '25.0%', height: '2.35%' }}
          className="absolute bg-[#020a24] flex items-center justify-end pr-1.5 overflow-hidden pointer-events-none"
        >
          <span className={`text-white/40 font-extrabold leading-none whitespace-nowrap ${coinFont}`}>
            {coinsStr}
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Live Avatar inside top-left frame (top: 5.65%) */}
      <div
        onClick={() => {
          if (onOpenProfile) {
            soundManager.playClick();
            onOpenProfile();
          }
        }}
        style={{ left: '3.1%', top: '5.65%', width: '8.1%', height: '3.65%' }}
        className="absolute rounded-[5px] overflow-hidden cursor-pointer z-20"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Live Diamonds Number Box (strictly between original Diamond icon at 35.5% and + button at 50.1%) */}
      <div
        onClick={() => {
          if (onOpenStore) {
            soundManager.playClick();
            onOpenStore('diamonds');
          }
        }}
        style={{ left: '35.5%', top: '6.0%', width: '14.6%', height: '2.35%' }}
        className="absolute bg-[#051951] flex items-center justify-end pr-1.5 overflow-hidden cursor-pointer z-20"
      >
        <span className={`text-white font-black leading-none whitespace-nowrap drop-shadow ${diamondFont}`}>
          {diamondsStr}
        </span>
      </div>

      {/* Live Coins Number Box (strictly between original Coin icon at 61.5% and + button at 86.5%) */}
      <div
        onClick={() => {
          if (onOpenStore) {
            soundManager.playClick();
            onOpenStore('coins');
          }
        }}
        style={{ left: '61.5%', top: '6.0%', width: '25.0%', height: '2.35%' }}
        className="absolute bg-[#051951] flex items-center justify-end pr-1.5 overflow-hidden cursor-pointer z-20"
      >
        <span className={`text-white font-black leading-none whitespace-nowrap drop-shadow ${coinFont}`}>
          {coinsStr}
        </span>
      </div>

      {/* Settings Gear Hitbox (top: 5.5%) */}
      {onOpenSettings && (
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenSettings();
          }}
          style={{ left: '13.5%', top: '5.5%', width: '6.2%', height: '3.4%' }}
          className="absolute cursor-pointer bg-transparent z-20 active:scale-90 transition-transform"
          title="Settings"
        />
      )}

      {/* Diamonds Pill & + Button Hitbox */}
      {onOpenStore && (
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenStore('diamonds');
          }}
          style={{ left: '31.0%', top: '5.5%', width: '24.2%', height: '3.4%' }}
          className="absolute cursor-pointer bg-transparent z-20"
          title="Diamonds Store"
        />
      )}

      {/* Coins Pill, + Button & Store Cart Hitbox */}
      {onOpenStore && (
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenStore('coins');
          }}
          style={{ left: '56.2%', top: '5.5%', width: '42.0%', height: '3.4%' }}
          className="absolute cursor-pointer bg-transparent z-20"
          title="Coins Store"
        />
      )}
    </>
  );
};

/* =========================================================================
   1. PROFILE & STATISTICS MODAL (Matches Screenshot 5031bf8e & Video 01:21)
   ========================================================================= */
export const ProfileModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (patch: Partial<UserProfile>) => void;
  onFreeUnlock: (payload: { addCoins?: number; addDiamonds?: number; label?: string }) => void;
  onShowToast: (msg: string) => void;
}> = ({ user, onClose, onUpdateUser, onFreeUnlock, onShowToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editBio] = useState(user.bio || 'Ready, Set, Ludo!');
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    soundManager.playClick();
    try {
      await navigator.clipboard.writeText(user.id);
    } catch {
      const el = document.createElement('textarea');
      el.value = user.id;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    onShowToast(`User ID Copied: ${user.id}`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isEditing) {
    return (
      <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
        <img
          src="/assets/ludo/screens/edit_profile_modal.jpg"
          alt="Edit Profile"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
        <TopBarOverlay user={user} dimmed />

        {/* Editable Name Input Box over the original white input field */}
        <input
          type="text"
          value={editName}
          maxLength={16}
          onChange={(e) => setEditName(e.target.value)}
          style={{ left: '28.5%', top: '30.5%', width: '46.2%', height: '4.3%' }}
          className="absolute bg-white text-[#072563] font-extrabold text-sm px-2.5 rounded-lg outline-none border-2 border-[#f4c032]"
        />

        {/* Avatar Grid Selection over SELECT PROFILE PICTURE section */}
        <div
          style={{ left: '12.5%', top: '44.2%', width: '74.5%', height: '21.0%' }}
          className="absolute bg-[#072a6e]/95 rounded-lg p-1.5 grid grid-cols-4 gap-1.5 items-center justify-items-center overflow-y-auto"
        >
          {AVATAR_LIST.map((av) => {
            const selected = editAvatar === av;
            return (
              <button
                key={av}
                onClick={() => {
                  soundManager.playClick();
                  setEditAvatar(av);
                }}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform cursor-pointer ${
                  selected
                    ? 'border-[#45ff2c] scale-105 shadow-[0_0_10px_#45ff2c]'
                    : 'border-white/40'
                }`}
              >
                <img src={av} alt="Avatar" className="w-full h-full object-cover" draggable={false} />
                {selected && (
                  <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#29d619] text-white text-[10px] font-black flex items-center justify-center">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Continue / Save Button Hitbox */}
        <button
          onClick={() => {
            soundManager.playClick();
            onUpdateUser({
              name: editName.trim() || 'Hammer',
              bio: editBio.trim() || 'Ready, Set, Ludo!',
              avatar: editAvatar,
            });
            setIsEditing(false);
            onShowToast('Profile Updated!');
          }}
          style={{ left: '31.5%', top: '84.5%', width: '37.0%', height: '5.5%' }}
          className="absolute cursor-pointer bg-transparent"
          title="Save Profile"
        />

        {/* Top-Left Back / Close Area */}
        <button
          onClick={() => {
            soundManager.playClick();
            setIsEditing(false);
          }}
          style={{ left: '0%', top: '0%', width: '100%', height: '14%' }}
          className="absolute cursor-pointer bg-transparent"
          title="Back"
        />
      </div>
    );
  }

  const statValues = [
    user.stats.gamesWon,
    user.stats.gamesLost,
    user.stats.winStreak,
    user.stats.tokensCaptured,
    user.stats.tokensKilled,
    user.stats.performanceRating,
    user.stats.tournamentsWon,
  ];
  const statTopPositions = ['41.8%', '45.0%', '48.2%', '51.4%', '54.6%', '57.8%', '61.0%'];

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
      {/* 100% Exact Native STATISTICS Modal Screenshot (1080x2400) */}
      <img
        src="/assets/ludo/screens/statistics_modal.jpg"
        alt="Statistics"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      <TopBarOverlay user={user} dimmed />

      {/* LIVE 24-CHAR HEX USER ID IN THE SKY-BLUE HEARTS BAR (y=20.4%..22.8%) */}
      <div
        onClick={handleCopyId}
        style={{ left: '22.0%', top: '20.5%', width: '57.5%', height: '2.2%' }}
        className="absolute bg-[#55b2f6] flex items-center justify-center cursor-pointer"
        title="Tap to copy your unique User ID"
      >
        <span
          className="text-white font-extrabold text-[12.5px] tracking-tight select-all"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.7)' }}
        >
          {user.id}
        </span>
      </div>

      {/* Right Orange Clipboard Copy Button Hitbox */}
      <button
        onClick={handleCopyId}
        style={{ left: '82.5%', top: '19.5%', width: '8.5%', height: '3.8%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
        title="Copy User ID"
      />

      {copied && (
        <div
          style={{ left: '28%', top: '17.2%', width: '44%' }}
          className="absolute bg-[#1ab61d] text-white font-black text-[10px] py-0.5 rounded-full text-center shadow-md border border-white"
        >
          ✓ ID COPIED TO CLIPBOARD
        </div>
      )}

      {/* Live Avatar inside Profile Frame */}
      <div
        onClick={() => setIsEditing(true)}
        style={{ left: '10.5%', top: '24.8%', width: '19.6%', height: '8.8%' }}
        className="absolute rounded-[10px] overflow-hidden cursor-pointer"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Live User Name Overlay */}
      <div
        style={{ left: '40.5%', top: '24.3%', width: '44.0%', height: '2.4%' }}
        className="absolute bg-[#0b4bb5] flex items-center"
      >
        <span className="text-white font-black text-[16px] leading-none drop-shadow">
          {user.name}
        </span>
      </div>

      {/* Live Coins inside Profile Card (covers 3,740 at y=27.0% with expanding dark-blue background) */}
      <div
        style={{ left: '39.6%', top: '26.9%', maxWidth: '23.0%', height: '2.15%' }}
        className="absolute bg-[#0e52c1] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[16%] overflow-hidden"
      >
        <span
          className={`text-white font-extrabold leading-none whitespace-nowrap ${getModalCurrencyFontClass(
            user.coins.toLocaleString()
          )}`}
        >
          {user.coins.toLocaleString()}
        </span>
      </div>

      {/* Live Diamonds inside Profile Card (covers 150 at y=27.0% with expanding dark-blue background) */}
      <div
        style={{ left: '68.8%', top: '26.9%', maxWidth: '20.5%', height: '2.15%' }}
        className="absolute bg-[#0e52c1] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[12%] overflow-hidden"
      >
        <span
          className={`text-white font-extrabold leading-none whitespace-nowrap ${getModalCurrencyFontClass(
            user.diamonds.toLocaleString()
          )}`}
        >
          {user.diamonds.toLocaleString()}
        </span>
      </div>

      {/* Live Bio / Status Line */}
      <div
        style={{ left: '32.5%', top: '30.8%', width: '49.5%', height: '2.4%' }}
        className="absolute bg-white flex items-center"
      >
        <span className="text-[#0c2d6e] font-bold text-[12px] leading-none truncate">
          {user.bio || 'Ready, Set, Ludo!'}
        </span>
      </div>

      {/* Blue Pencil Edit Bio / Profile Button */}
      <button
        onClick={() => {
          soundManager.playClick();
          setIsEditing(true);
        }}
        style={{ left: '83.5%', top: '30.5%', width: '7.5%', height: '3.2%' }}
        className="absolute cursor-pointer bg-transparent"
        title="Edit Bio & Name"
      />

      {/* Live 7 Statistics Rows Overlays */}
      {statValues.map((val, idx) => (
        <div
          key={idx}
          style={{ left: '74.5%', top: statTopPositions[idx], width: '13.5%', height: '2.2%' }}
          className="absolute bg-[#072a6c] flex items-center pl-2"
        >
          <span className="text-white font-extrabold text-[13px] leading-none">{val}</span>
        </div>
      ))}

      {/* Save Data / Change Device / +100 Free Diamonds Buttons */}
      <button
        onClick={() => {
          soundManager.playClick();
          onShowToast('Guest Profile Data Saved!');
        }}
        style={{ left: '20.0%', top: '65.0%', width: '19.0%', height: '4.2%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={handleCopyId}
        style={{ left: '41.0%', top: '65.0%', width: '19.0%', height: '4.2%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() =>
          onFreeUnlock({
            addDiamonds: 100,
            label: '+100 FREE Diamonds Added!',
          })
        }
        style={{ left: '61.5%', top: '65.0%', width: '19.0%', height: '4.2%' }}
        className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
        title="Claim +100 Free Diamonds"
      />

      {/* Facebook / Google Sign-In Locked to Guest Only */}
      <button
        onClick={() => {
          soundManager.playClick();
          onShowToast('Guest Mode Active: Social Sign-In is disabled.');
        }}
        style={{ left: '17.5%', top: '69.8%', width: '65.0%', height: '9.8%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* Edit Profile Button Hitbox */}
      <button
        onClick={() => {
          soundManager.playClick();
          setIsEditing(true);
        }}
        style={{ left: '34.5%', top: '82.2%', width: '31.0%', height: '4.4%' }}
        className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
        title="Edit Profile"
      />

      {/* Bottom-Left Back Button Hitbox */}
      <button
        onClick={onClose}
        style={{ left: '6.5%', top: '89.0%', width: '12.5%', height: '5.5%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
        title="Back"
      />
    </div>
  );
};

/* =========================================================================
   2. STORE MODAL (Matches Screenshots f98e8222 & 3989efbf 100% + Animated Coin/Diamond Burst)
   ========================================================================= */
export const StoreModal: React.FC<{
  user: UserProfile;
  initialTab: 'coins' | 'diamonds';
  onClose: () => void;
  onFreeUnlock: (payload: {
    addCoins?: number;
    addDiamonds?: number;
    themeId?: string;
    kingPass?: boolean;
    label?: string;
  }) => void;
}> = ({ user, initialTab, onClose, onFreeUnlock }) => {
  const [tab, setTab] = useState<'coins' | 'diamonds'>(initialTab);
  const [pulseCurrency, setPulseCurrency] = useState<'coins' | 'diamonds' | null>(null);

  const triggerUnlockWithAnim = (
    type: 'coins' | 'diamonds',
    payload: {
      addCoins?: number;
      addDiamonds?: number;
      themeId?: string;
      kingPass?: boolean;
      label?: string;
    }
  ) => {
    setPulseCurrency(type);
    onFreeUnlock(payload);
    setTimeout(() => setPulseCurrency(null), 650);
  };

  const diamondPacks = [
    { amount: 100, left: '3.5%', top: '58.5%' },
    { amount: 500, left: '35.8%', top: '58.5%' },
    { amount: 2000, left: '68.0%', top: '58.5%' },
    { amount: 6000, left: '3.5%', top: '81.5%' },
    { amount: 12500, left: '35.8%', top: '81.5%' },
    { amount: 25000, left: '68.0%', top: '81.5%' },
  ];

  const coinPacks = [
    { amount: 25000, left: '3.5%', top: '45.5%' },
    { amount: 100000, left: '35.8%', top: '45.5%' },
    { amount: 500000, left: '68.0%', top: '45.5%' },
    { amount: 1000000, left: '3.5%', top: '68.5%' },
    { amount: 5000000, left: '35.8%', top: '68.5%' },
    { amount: 10000000, left: '68.0%', top: '68.5%' },
  ];

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
      {/* 100% Exact Native Store Screen (store_diamonds.jpg or store_coins.jpg) */}
      <img
        src={
          tab === 'diamonds'
            ? '/assets/ludo/screens/store_diamonds.jpg'
            : '/assets/ludo/screens/store_coins.jpg'
        }
        alt="Store"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      {/* Live Coins Overlay in Store Top Bar (expanding dark-blue background box) */}
      <div
        style={{ left: '34.6%', top: '5.85%', maxWidth: '25.8%', height: '2.55%' }}
        className="absolute bg-[#04173c] inline-flex items-center px-1.5 rounded-sm w-fit min-w-[20.5%] z-20 overflow-hidden"
      >
        <span
          className={`font-black leading-none whitespace-nowrap transition-transform duration-200 ${getModalCurrencyFontClass(
            user.coins.toLocaleString()
          )} ${pulseCurrency === 'coins' ? 'text-[#45ff2c] scale-110' : 'text-white'}`}
        >
          {user.coins.toLocaleString()}
        </span>
      </div>

      {/* Live Diamonds Overlay in Store Top Bar (expanding dark-blue background box) */}
      <div
        style={{ left: '62.2%', top: '5.85%', maxWidth: '17.0%', height: '2.55%' }}
        className="absolute bg-[#04173c] inline-flex items-center justify-end px-1.5 rounded-sm w-fit min-w-[14.5%] z-20 overflow-hidden"
      >
        <span
          className={`font-black leading-none whitespace-nowrap transition-transform duration-200 ${getModalCurrencyFontClass(
            user.diamonds.toLocaleString()
          )} ${pulseCurrency === 'diamonds' ? 'text-[#45ff2c] scale-110' : 'text-white'}`}
        >
          {user.diamonds.toLocaleString()}
        </span>
      </div>

      {/* Top-Right King Pass K Icon */}
      <button
        onClick={() =>
          triggerUnlockWithAnim('coins', {
            kingPass: true,
            addCoins: 50000,
            addDiamonds: 200,
            label: 'King Pass VIP Unlocked for FREE!',
          })
        }
        style={{ left: '88.0%', top: '5.0%', width: '10.5%', height: '4.5%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
      />

      {/* Store 4 Category Tabs Hitboxes (Coins / Diamonds / TalkTime / Offers) */}
      <button
        onClick={() => {
          soundManager.playClick();
          setTab('coins');
        }}
        style={{ left: '3.5%', top: '10.2%', width: '23.5%', height: '5.6%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setTab('diamonds');
        }}
        style={{ left: '27.5%', top: '10.2%', width: '24.0%', height: '5.6%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          triggerUnlockWithAnim('coins', {
            addCoins: 25000,
            label: '7 Days Voice Talk Time Unlocked for FREE!',
          });
        }}
        style={{ left: '52.0%', top: '10.2%', width: '23.5%', height: '5.6%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setTab('diamonds');
        }}
        style={{ left: '76.0%', top: '10.2%', width: '21.5%', height: '5.6%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* BUNDLE OFFER (200,000 Coins + 7 Days Talk Time + 125 Diamonds + Nature Theme) -> FREE */}
      <button
        onClick={() =>
          triggerUnlockWithAnim('coins', {
            addCoins: 200000,
            addDiamonds: 125,
            themeId: 'nature',
            label: 'Bundle Offer: +200,000 Coins & +125 Diamonds Unlocked FREE!',
          })
        }
        style={{ left: '3.5%', top: '19.8%', width: '93.0%', height: '19.0%' }}
        className="absolute cursor-pointer bg-transparent active:scale-98 transition-transform"
        title="Claim Bundle Offer for FREE"
      />

      {tab === 'diamonds' ? (
        <>
          {/* 15 FREE Diamonds Every 1 Hour Button */}
          <button
            onClick={() =>
              triggerUnlockWithAnim('diamonds', {
                addDiamonds: 15,
                label: '+15 FREE Diamonds Claimed!',
              })
            }
            style={{ left: '3.5%', top: '45.2%', width: '93.0%', height: '8.5%' }}
            className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
          />

          {/* 6 Diamond Packs Grid (All Unlock for FREE on Tap) */}
          {diamondPacks.map((pack) => (
            <button
              key={pack.amount}
              onClick={() =>
                triggerUnlockWithAnim('diamonds', {
                  addDiamonds: pack.amount,
                  label: `+${pack.amount.toLocaleString()} Diamonds Added for FREE!`,
                })
              }
              style={{ left: pack.left, top: pack.top, width: '28.5%', height: '19.5%' }}
              className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
              title={`Get +${pack.amount.toLocaleString()} Diamonds FREE`}
            />
          ))}
        </>
      ) : (
        <>
          {/* 6 Coin Packs Grid (All Unlock for FREE on Tap) */}
          {coinPacks.map((pack) => (
            <button
              key={pack.amount}
              onClick={() =>
                triggerUnlockWithAnim('coins', {
                  addCoins: pack.amount,
                  label: `+${pack.amount.toLocaleString()} Coins Added for FREE!`,
                })
              }
              style={{ left: pack.left, top: pack.top, width: '28.5%', height: '19.5%' }}
              className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
              title={`Get +${pack.amount.toLocaleString()} Coins FREE`}
            />
          ))}

          {/* Bottom Row Extra Chests in Coins Store */}
          <button
            onClick={() =>
              triggerUnlockWithAnim('coins', {
                addCoins: 50000000,
                label: '+50,000,000 Mega Vault Coins Added for FREE!',
              })
            }
            style={{ left: '3.5%', top: '91.0%', width: '93.0%', height: '8.0%' }}
            className="absolute cursor-pointer bg-transparent active:scale-95 transition-transform"
          />
        </>
      )}

      {/* Bottom-Left Back Button Hitbox */}
      <button
        onClick={onClose}
        style={{ left: '2.0%', top: '93.8%', width: '13.0%', height: '5.8%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
        title="Back"
      />
    </div>
  );
};

/* =========================================================================
   3. SETTINGS & LANGUAGE MODAL (Matches Video 01:10 - 01:20)
   ========================================================================= */
export const SettingsModal: React.FC<{
  onClose: () => void;
  onShowToast: (msg: string) => void;
}> = ({ onClose, onShowToast }) => {
  const [showLanguage, setShowLanguage] = useState(false);
  const [musicOn, setMusicOn] = useState(soundManager.musicEnabled);
  const [soundOn, setSoundOn] = useState(soundManager.soundEnabled);

  if (showLanguage) {
    return (
      <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
        <img
          src="/assets/ludo/screens/language_modal.jpg"
          alt="Language"
          className="w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
        {/* Language Selection Hitboxes */}
        <button
          onClick={() => {
            soundManager.playClick();
            setShowLanguage(false);
            onShowToast('Language updated!');
          }}
          style={{ left: '15%', top: '26%', width: '70%', height: '52%' }}
          className="absolute cursor-pointer bg-transparent"
        />
        {/* Back Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            setShowLanguage(false);
          }}
          style={{ left: '6.5%', top: '89.0%', width: '12.5%', height: '5.5%' }}
          className="absolute cursor-pointer bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
      <img
        src="/assets/ludo/screens/settings_modal.jpg"
        alt="Settings"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />

      {/* Audio Toggle Row (y=26.2%) */}
      <button
        onClick={() => {
          const next = !soundOn;
          setSoundOn(next);
          soundManager.setSoundEnabled(next);
          soundManager.playClick();
          onShowToast(`Audio: ${next ? 'ON' : 'OFF'}`);
        }}
        style={{ left: '62.0%', top: '25.5%', width: '22.0%', height: '4.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* Background Music Toggle Row (y=31.5%) */}
      <button
        onClick={() => {
          const next = !musicOn;
          setMusicOn(next);
          soundManager.setMusicEnabled(next);
          soundManager.playClick();
          onShowToast(`Background Music: ${next ? 'ON' : 'OFF'}`);
        }}
        style={{ left: '68.0%', top: '30.8%', width: '16.0%', height: '4.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* Language Selector Bar (y=46.5%) */}
      <button
        onClick={() => {
          soundManager.playClick();
          setShowLanguage(true);
        }}
        style={{ left: '54.0%', top: '45.8%', width: '29.0%', height: '4.5%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* Tutorial / Themes / Store / Rules Buttons */}
      <button
        onClick={() => {
          soundManager.playClick();
          onShowToast('All game modes, themes & rooms are unlocked!');
        }}
        style={{ left: '20.0%', top: '52.0%', width: '64.0%', height: '24.0%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* Bottom-Left Back Button */}
      <button
        onClick={onClose}
        style={{ left: '2.5%', top: '93.0%', width: '13.5%', height: '6.0%' }}
        className="absolute cursor-pointer bg-transparent active:scale-90 transition-transform"
      />
    </div>
  );
};

/* =========================================================================
   4. PROMO POPUPS (Exclusive Sale, Diamond Spin, Season of Lights)
   ========================================================================= */
export const ExclusiveSaleModal: React.FC<{
  onClose: () => void;
  onClaimFree: () => void;
}> = ({ onClose, onClaimFree }) => (
  <div onClick={onClose} className="absolute inset-0 z-40 overflow-hidden cursor-pointer bg-[#02091c]">
    <img
      src="/assets/ludo/screens/popup_exclusive_sale.jpg"
      alt="Exclusive Sale"
      className="w-full h-full object-fill pointer-events-none"
      draggable={false}
    />
    {/* Claim 500 Diamonds FREE */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClaimFree();
      }}
      style={{ left: '22.0%', top: '34.0%', width: '56.0%', height: '38.0%' }}
      className="absolute cursor-pointer bg-transparent"
      title="Claim 500 Diamonds FREE"
    />
  </div>
);

export const DiamondSpinModal: React.FC<{
  onClose: () => void;
  onWinReward: (diamonds: number, coins: number) => void;
}> = ({ onClose, onWinReward }) => {
  const [spinning, setSpinning] = useState(false);

  const handleSpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (spinning) return;
    setSpinning(true);
    soundManager.playDiceRoll();
    setTimeout(() => {
      setSpinning(false);
      onWinReward(250, 10000);
      onClose();
    }, 900);
  };

  return (
    <div onClick={onClose} className="absolute inset-0 z-40 overflow-hidden cursor-pointer bg-[#02091c]">
      <img
        src="/assets/ludo/screens/popup_diamond_spin.jpg"
        alt="Diamond Spin"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />
      <button
        onClick={handleSpin}
        style={{ left: '16.0%', top: '26.0%', width: '68.0%', height: '50.0%' }}
        className="absolute cursor-pointer bg-transparent"
        title="Spin for Free"
      />
      {spinning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="px-5 py-2.5 rounded-full bg-[#103882] border-2 border-[#f8cc46] text-yellow-300 font-black text-base animate-bounce">
            SPINNING WHEEL...
          </div>
        </div>
      )}
    </div>
  );
};

export const SeasonOfLightsModal: React.FC<{
  onClose: () => void;
  onUnlockSeason: () => void;
}> = ({ onClose, onUnlockSeason }) => (
  <div onClick={onClose} className="absolute inset-0 z-40 overflow-hidden cursor-pointer bg-[#02091c]">
    <img
      src="/assets/ludo/screens/popup_season_lights.jpg"
      alt="Season of Lights"
      className="w-full h-full object-fill pointer-events-none"
      draggable={false}
    />
    <button
      onClick={(e) => {
        e.stopPropagation();
        onUnlockSeason();
      }}
      style={{ left: '20.0%', top: '30.0%', width: '60.0%', height: '48.0%' }}
      className="absolute cursor-pointer bg-transparent"
      title="Let's Go"
    />
  </div>
);

/* =========================================================================
   5. BOTTOM NAVIGATION TABS (EVENT, ADDA, INVENTORY, SOCIAL)
   ========================================================================= */
export const EventTabView: React.FC<{
  user: UserProfile;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenStore: (tab: 'coins' | 'diamonds') => void;
  onFreeUnlock: (payload: { addCoins?: number; addDiamonds?: number; label?: string }) => void;
}> = ({ user, onOpenProfile, onOpenSettings, onOpenStore, onFreeUnlock }) => (
  <div className="relative w-full h-full overflow-hidden bg-[#061e5c]">
    <img
      src="/assets/ludo/screens/event_tab.jpg"
      alt="Event Tab"
      className="w-full h-full object-fill pointer-events-none"
      draggable={false}
    />
    <TopBarOverlay
      user={user}
      onOpenProfile={onOpenProfile}
      onOpenSettings={onOpenSettings}
      onOpenStore={onOpenStore}
    />
    {/* Claim Season Rewards Free */}
    <button
      onClick={() =>
        onFreeUnlock({
          addDiamonds: 300,
          addCoins: 50000,
          label: 'Season 28 Event Reward Claimed (+300 Diamonds & +50,000 Coins)!',
        })
      }
      style={{ left: '10.0%', top: '22.0%', width: '80.0%', height: '65.0%' }}
      className="absolute cursor-pointer bg-transparent"
    />
  </div>
);

export const AddaModal: React.FC<{
  onClose: () => void;
  onConfirm: () => void;
}> = ({ onClose, onConfirm }) => (
  <div className="absolute inset-0 z-40 overflow-hidden bg-[#02091c]">
    <img
      src="/assets/ludo/screens/adda_modal.jpg"
      alt="Adda Voice Chat"
      className="w-full h-full object-fill pointer-events-none"
      draggable={false}
    />
    {/* Yes Button */}
    <button
      onClick={onConfirm}
      style={{ left: '20.0%', top: '52.0%', width: '27.0%', height: '5.5%' }}
      className="absolute cursor-pointer bg-transparent"
    />
    {/* No Button */}
    <button
      onClick={onClose}
      style={{ left: '53.0%', top: '52.0%', width: '27.0%', height: '5.5%' }}
      className="absolute cursor-pointer bg-transparent"
    />
  </div>
);

export const InventoryTabView: React.FC<{
  user: UserProfile;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenStore: (tab: 'coins' | 'diamonds') => void;
  onFreeUnlock: (payload: {
    addCoins?: number;
    addDiamonds?: number;
    diceId?: number;
    label?: string;
  }) => void;
}> = ({ user, onOpenProfile, onOpenSettings, onOpenStore, onFreeUnlock }) => (
  <div className="relative w-full h-full overflow-hidden bg-[#061e5c]">
    <img
      src="/assets/ludo/screens/inventory_tab.jpg"
      alt="Inventory Tab"
      className="w-full h-full object-fill pointer-events-none"
      draggable={false}
    />
    <TopBarOverlay
      user={user}
      onOpenProfile={onOpenProfile}
      onOpenSettings={onOpenSettings}
      onOpenStore={onOpenStore}
    />

    {/* Interactive Dice & Inventory Grid (Tapping any item unlocks & equips it for FREE!) */}
    <div
      style={{ left: '4.0%', top: '22.0%', width: '92.0%', height: '66.0%' }}
      className="absolute grid grid-cols-4 grid-rows-3 gap-2"
    >
      {Array.from({ length: 12 }).map((_, idx) => (
        <button
          key={idx}
          onClick={() =>
            onFreeUnlock({
              diceId: idx + 1,
              label: `3D Dice #${idx + 1} Unlocked & Equipped for FREE!`,
            })
          }
          className="w-full h-full cursor-pointer bg-transparent active:scale-95 transition-transform"
          title={`Unlock & Equip Dice #${idx + 1} FREE`}
        />
      ))}
    </div>
  </div>
);

export const SocialTabView: React.FC<{
  user: UserProfile;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenStore: (tab: 'coins' | 'diamonds') => void;
  onShowToast: (msg: string) => void;
}> = ({ user, onOpenProfile, onOpenSettings, onOpenStore, onShowToast }) => {
  const [subTab, setSubTab] = useState<'chats' | 'friends' | 'last'>('chats');

  const bgMap = {
    chats: '/assets/ludo/screens/social_chats.jpg',
    friends: '/assets/ludo/screens/social_friends.jpg',
    last: '/assets/ludo/screens/social_last.jpg',
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#061e5c]">
      <img
        src={bgMap[subTab]}
        alt="Social Tab"
        className="w-full h-full object-fill pointer-events-none"
        draggable={false}
      />
      <TopBarOverlay
        user={user}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onOpenStore={onOpenStore}
      />

      {/* CHATS / FRIENDS / LAST Played Sub-Tab Hitboxes */}
      <button
        onClick={() => {
          soundManager.playClick();
          setSubTab('chats');
        }}
        style={{ left: '6.0%', top: '20.2%', width: '28.0%', height: '4.8%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setSubTab('friends');
        }}
        style={{ left: '36.0%', top: '20.2%', width: '28.0%', height: '4.8%' }}
        className="absolute cursor-pointer bg-transparent"
      />
      <button
        onClick={() => {
          soundManager.playClick();
          setSubTab('last');
        }}
        style={{ left: '66.0%', top: '20.2%', width: '28.0%', height: '4.8%' }}
        className="absolute cursor-pointer bg-transparent"
      />

      {/* Search / Invite Friends Area */}
      <button
        onClick={() => {
          soundManager.playClick();
          onShowToast('Share your Room Code in FRIENDS mode to play together!');
        }}
        style={{ left: '10.0%', top: '28.0%', width: '80.0%', height: '55.0%' }}
        className="absolute cursor-pointer bg-transparent"
      />
    </div>
  );
};
