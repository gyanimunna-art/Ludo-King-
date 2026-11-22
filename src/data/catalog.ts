export interface StorePack {
  id: string;
  amount: number;
  priceLabel: string;
  badge?: string;
  iconType: 'small' | 'medium' | 'pot' | 'barrel' | 'chest' | 'cart';
}

export const DIAMOND_PACKS: StorePack[] = [
  { id: 'd_100', amount: 100, priceLabel: '₹79.00', iconType: 'small' },
  { id: 'd_500', amount: 500, priceLabel: '₹329.00', iconType: 'medium' },
  { id: 'd_2000', amount: 2000, priceLabel: '₹999.00', iconType: 'pot' },
  { id: 'd_6000', amount: 6000, priceLabel: '₹2,499.00', iconType: 'pot' },
  { id: 'd_12500', amount: 12500, priceLabel: '₹3,999.00', iconType: 'barrel' },
  { id: 'd_25000', amount: 25000, priceLabel: '₹6,999.00', iconType: 'chest' },
  { id: 'd_50000', amount: 50000, priceLabel: '₹12,999.00', iconType: 'chest' },
  { id: 'd_100000', amount: 100000, priceLabel: '₹24,999.00', iconType: 'cart' },
];

export const COIN_PACKS: StorePack[] = [
  { id: 'c_25k', amount: 25000, priceLabel: '₹100.00', iconType: 'small' },
  { id: 'c_100k', amount: 100000, priceLabel: '₹180.00', iconType: 'medium' },
  { id: 'c_500k', amount: 500000, priceLabel: '₹480.00', iconType: 'pot' },
  { id: 'c_1m', amount: 1000000, priceLabel: '₹690.00', iconType: 'pot' },
  { id: 'c_5m', amount: 5000000, priceLabel: '₹1,800.00', badge: '50% MORE', iconType: 'barrel' },
  { id: 'c_10m', amount: 10000000, priceLabel: '₹3,000.00', iconType: 'chest' },
  { id: 'c_50m', amount: 50000000, priceLabel: '₹9,000.00', iconType: 'chest' },
  { id: 'c_100m', amount: 100000000, priceLabel: '₹14,500.00', iconType: 'cart' },
];

export interface DiceCatalogItem {
  id: string;
  name: string;
  priceLabel: string;
  primaryColor: string;
  accentColor: string;
  pipColor: string;
}

export const DICE_CATALOG: DiceCatalogItem[] = [
  { id: 'DEFAULT', name: 'DEFAULT', priceLabel: 'EQUIPPED', primaryColor: '#F8FAFC', accentColor: '#CBD5E1', pipColor: '#0F172A' },
  { id: 'HALLOWEEN', name: 'HALLOWEEN', priceLabel: '₹175.00', primaryColor: '#1E293B', accentColor: '#FACC15', pipColor: '#A3E635' },
  { id: 'FOOTBALL', name: 'FOOTBALL', priceLabel: '₹249.00', primaryColor: '#1E3A8A', accentColor: '#FBBF24', pipColor: '#FFFFFF' },
  { id: 'NEW YEAR', name: 'NEW YEAR', priceLabel: '₹249.00', primaryColor: '#0284C7', accentColor: '#E0F2FE', pipColor: '#FDE047' },
  { id: 'TRI-COLOUR', name: 'TRI-COLOUR', priceLabel: '₹249.00', primaryColor: '#F97316', accentColor: '#16A34A', pipColor: '#FFFFFF' },
  { id: 'HEART', name: 'HEART', priceLabel: '₹249.00', primaryColor: '#F1F5F9', accentColor: '#EF4444', pipColor: '#DC2626' },
  { id: 'COLORS', name: 'COLORS', priceLabel: '₹249.00', primaryColor: '#EAB308', accentColor: '#3B82F6', pipColor: '#7C2D12' },
  { id: 'SUMMER', name: 'SUMMER', priceLabel: '₹249.00', primaryColor: '#334155', accentColor: '#F59E0B', pipColor: '#FDE047' },
  { id: 'MONSOON BOAT', name: 'MONSOON BOAT', priceLabel: '₹249.00', primaryColor: '#E2E8F0', accentColor: '#2563EB', pipColor: '#1D4ED8' },
  { id: 'SIXER', name: 'SIXER', priceLabel: '₹249.00', primaryColor: '#991B1B', accentColor: '#F87171', pipColor: '#FEF08A' },
  { id: 'CRICKET KING', name: 'CRICKET KING', priceLabel: '₹249.00', primaryColor: '#1E40AF', accentColor: '#22C55E', pipColor: '#FFFFFF' },
  { id: 'DIYA', name: 'DIYA', priceLabel: '₹249.00', primaryColor: '#7F1D1D', accentColor: '#F59E0B', pipColor: '#FDE047' },
  { id: 'PUMPKIN', name: 'PUMPKIN', priceLabel: '₹249.00', primaryColor: '#EA580C', accentColor: '#FDBA74', pipColor: '#431407' },
  { id: 'REPUBLIC', name: 'REPUBLIC', priceLabel: '₹249.00', primaryColor: '#38BDF8', accentColor: '#F97316', pipColor: '#FFFFFF' },
  { id: 'DRAGON', name: 'DRAGON', priceLabel: '₹249.00', primaryColor: '#991B1B', accentColor: '#FBBF24', pipColor: '#FDE047' },
  { id: 'CHOCOLATE', name: 'CHOCOLATE', priceLabel: '₹249.00', primaryColor: '#451A03', accentColor: '#D97706', pipColor: '#FEF3C7' },
  { id: 'PEACE', name: 'PEACE', priceLabel: '₹249.00', primaryColor: '#15803D', accentColor: '#86EFAC', pipColor: '#FFFFFF' },
  { id: 'HOLI', name: 'HOLI', priceLabel: '₹249.00', primaryColor: '#DB2777', accentColor: '#FACC15', pipColor: '#FFFFFF' },
  { id: 'MUMMY', name: 'MUMMY', priceLabel: '₹249.00', primaryColor: '#D6D3D1', accentColor: '#78716C', pipColor: '#1C1917' },
  { id: 'LION', name: 'LION', priceLabel: '₹249.00', primaryColor: '#B45309', accentColor: '#FDE047', pipColor: '#FFFBEB' },
  { id: 'SUPER KING', name: 'SUPER KING', priceLabel: 'TRY', primaryColor: '#1D4ED8', accentColor: '#FACC15', pipColor: '#FDE047' },
  { id: 'VIKING', name: 'VIKING', priceLabel: '₹249.00', primaryColor: '#0F766E', accentColor: '#99F6E4', pipColor: '#FFFFFF' },
  { id: 'FIREWORK', name: 'FIREWORK', priceLabel: '₹49.00', primaryColor: '#166534', accentColor: '#FACC15', pipColor: '#FEF08A' },
  { id: 'KABOOM', name: 'KABOOM', priceLabel: '₹249.00', primaryColor: '#4C1D95', accentColor: '#F43F5E', pipColor: '#FFFFFF' },
  { id: 'GORILLA', name: 'GORILLA', priceLabel: '₹249.00', primaryColor: '#991B1B', accentColor: '#FCA5A5', pipColor: '#FFFFFF' },
  { id: 'GLORY', name: 'GLORY', priceLabel: '₹249.00', primaryColor: '#0284C7', accentColor: '#FDE047', pipColor: '#FFFFFF' },
  { id: 'PENGUIN', name: 'PENGUIN', priceLabel: '₹249.00', primaryColor: '#0369A1', accentColor: '#E0F2FE', pipColor: '#FFFFFF' },
  { id: 'DHAMAKA', name: 'DHAMAKA', priceLabel: 'SEASON', primaryColor: '#1D4ED8', accentColor: '#F97316', pipColor: '#FEF08A' },
  { id: 'LANTERN', name: 'LANTERN', priceLabel: 'SEASON', primaryColor: '#15803D', accentColor: '#FACC15', pipColor: '#FEF08A' },
  { id: 'ROCKET', name: 'ROCKET', priceLabel: 'SEASON', primaryColor: '#7E22CE', accentColor: '#EC4899', pipColor: '#FEF08A' },
];

export const PRESET_CHATS: string[] = [
  'Hi!',
  'Hello!',
  'Play Fast!',
  'Okay!',
  'Lucky roll!',
  'Plz add me as Buddy!',
  'Catch me if you can!',
  'I have to go. Bye!',
  'I will let you win!',
  'Like my picture?',
  "Don't kill my token!",
  'You should give up!',
  'I am going to win!',
  'Dare you to play me again!',
  'I am Ludo King!',
  'I need to go, Sorry!',
  "Don't run away!",
  'Some Urgent work, Bye!',
  'Why you hit me?',
  'Game is Not Over yet!',
  "You can't beat me!",
  'Bye! Bye!',
  'Hahahaha!',
  'Today is My Day!',
  'All the best!',
  'I am the best!',
  'Boom Boom',
  'Ludo King is Awesome!',
  'Yeah!',
  'Oops!',
  'OMG',
  'LOL',
  '%&$#@$#%',
];

export const VOICE_NOTES: string[] = [
  'Hi',
  'Hello',
  'Please play fast',
  'Can we be friends?',
  'Do you wanna play again?',
];

export const PROFILE_AVATARS: string[] = [
  '/assets/ludo/avatar_hammer.png',
  '/assets/ludo/avatar_p1.png',
  '/assets/ludo/avatar_p2.png',
  '/assets/ludo/avatar_p3.png',
  '/assets/ludo/avatar_p4.png',
  '/assets/ludo/avatar_p5.png',
  '/assets/ludo/avatar_p6.png',
  '/assets/ludo/avatar_tyra.png',
];

export const LANGUAGES_LIST: string[] = [
  'English',
  'हिन्दी (Hindi)',
  'मराठी (Marathi)',
  'বাংলা (Bengali)',
  'ગુજરાતી (Gujarati)',
  'தமிழ் (Tamil)',
  'తెలుగు (Telugu)',
  'മലയാളം (Malayalam)',
  'ಕನ್ನಡ (Kannada)',
  'Bahasa Indonesia',
  'Français (French)',
  'Deutsche (German)',
  'عربي (Arabic)',
  'Español (Spanish)',
  'Italiano (Italian)',
];

export const ONLINE_ENTRY_TIERS = [
  { entry: 100, win2P: 190, win4P: 360, crowns: 'Upto 02' },
  { entry: 500, win2P: 950, win4P: 1800, crowns: 'Upto 04' },
  { entry: 1000, win2P: 1900, win4P: 3600, crowns: 'Upto 08' },
  { entry: 5000, win2P: 9500, win4P: 18000, crowns: 'Upto 12' },
  { entry: 10000, win2P: 19000, win4P: 36000, crowns: 'Upto 20' },
  { entry: 50000, win2P: 95000, win4P: 180000, crowns: 'Upto 40' },
  { entry: 100000, win2P: 190000, win4P: 360000, crowns: 'Upto 80' },
];
