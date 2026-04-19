// Highlander Events — Premium Design System v4 (UCR Blue & Gold Luxe)

export const Colors = {
  // UCR Brand
  ucrBlue: '#2979FF',
  ucrGold: '#FFB300',

  // Dark theme — Deep Navy + Gold accents (no purple)
  dark: {
    background: '#020810',
    surface: '#061022',
    surfaceElevated: '#0A1830',
    card: '#061022',
    text: '#F0F4FF',
    textSecondary: '#94A8CC',
    textMuted: '#506080',
    primary: '#2979FF',
    primaryLight: '#5C9AFF',
    accent: '#FFB300',
    accentLight: '#FFCC4D',
    cyan: '#00E5FF',
    success: '#00E676',
    danger: '#FF4D6A',
    warning: '#FFB300',
    border: '#142040',
    borderGlass: 'rgba(255,255,255,0.07)',
    glass: 'rgba(255,255,255,0.04)',
    glassStrong: 'rgba(255,255,255,0.09)',
    tabBar: '#020810',
    tabIconDefault: '#506080',
    tabIconSelected: '#FFB300',
    happeningNow: '#00E5FF',
    rsvp: '#FF4D6A',
    rsvpActive: '#FFB300',
  },

  // Kept for backward compat
  light: {
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    text: '#0A0E1A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    primary: '#1E6AFF',
    primaryLight: '#4D8BFF',
    accent: '#FFB800',
    accentLight: '#FFD166',
    cyan: '#00B8CC',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    border: '#E2E8F0',
    borderGlass: 'rgba(0,0,0,0.08)',
    glass: 'rgba(0,0,0,0.04)',
    glassStrong: 'rgba(0,0,0,0.08)',
    tabBar: '#FFFFFF',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#1E6AFF',
    happeningNow: '#22C55E',
    rsvp: '#EF4444',
    rsvpActive: '#FFB800',
  },

  // Event category colors — vibrant palette
  categories: {
    Academic:    '#6366F1',
    Social:      '#EC4899',
    Sports:      '#00E676',
    Career:      '#1E6AFF',
    Cultural:    '#FFB800',
    'Greek Life':'#A855F7',
    Arts:        '#F97316',
    Technology:  '#00E5FF',
  },

  // Category gradient pairs — for richer card backgrounds
  categoryGradients: {
    Academic:    ['#6366F1', '#818CF8'] as const,
    Social:      ['#EC4899', '#F472B6'] as const,
    Sports:      ['#00E676', '#4ADE80'] as const,
    Career:      ['#1E6AFF', '#60A5FA'] as const,
    Cultural:    ['#FFB800', '#FBBF24'] as const,
    'Greek Life':['#A855F7', '#C084FC'] as const,
    Arts:        ['#F97316', '#FB923C'] as const,
    Technology:  ['#00E5FF', '#22D3EE'] as const,
  },
};

// ─── Gradient Presets ─────────────────────────────────────────────────────────
export const Gradients = {
  // Primary brand gradients
  primary: ['#2979FF', '#1565D8'] as const,
  accent: ['#FFB300', '#E69500'] as const,
  cyan: ['#00E5FF', '#00B8D4'] as const,
  danger: ['#FF4D6A', '#DC2626'] as const,
  gold: ['#FFB300', '#FF8F00'] as const,
  blueGold: ['#2979FF', '#FFB300'] as const,

  // Surface gradients (for cards, modals)
  glassSurface: ['rgba(6,16,34,0.88)', 'rgba(6,16,34,0.68)'] as const,
  glassCard: ['rgba(10,24,48,0.92)', 'rgba(10,24,48,0.72)'] as const,
  glassElevated: ['rgba(16,30,58,0.92)', 'rgba(10,24,48,0.82)'] as const,

  // Background ambience
  heroOverlay: ['rgba(2,8,16,0.3)', 'transparent', 'transparent', 'rgba(2,8,16,0.96)'] as const,
  bottomFade: ['transparent', 'rgba(2,8,16,0.95)'] as const,
  topFade: ['rgba(2,8,16,0.95)', 'transparent'] as const,

  // Glow presets
  glowBlue: ['rgba(41,121,255,0.25)', 'rgba(41,121,255,0)'] as const,
  glowGold: ['rgba(255,179,0,0.22)', 'rgba(255,179,0,0)'] as const,
  glowCyan: ['rgba(0,229,255,0.2)', 'rgba(0,229,255,0)'] as const,

  // Tab bar
  tabBarGlass: ['rgba(2,8,16,0.92)', 'rgba(2,8,16,0.98)'] as const,
};

// ─── Glass Morphism Tokens ────────────────────────────────────────────────────
export const Glass = {
  background: 'rgba(6,16,34,0.78)',
  backgroundStrong: 'rgba(6,16,34,0.90)',
  backgroundLight: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',
  borderFocused: 'rgba(255,255,255,0.18)',
  borderAccent: 'rgba(255,179,0,0.35)',
  blurIntensity: 40,
  blurIntensityStrong: 80,
};

// ─── Shadow Presets ───────────────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  }),
  glowSmall: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  }),
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

// ─── Font Sizes ───────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
  hero: 42,
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const Fonts = {
  heading: 'SpaceGrotesk_700Bold',
  headingMed: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  mono: 'Inter_400Regular',
};

// ─── Animation Timing ─────────────────────────────────────────────────────────
export const AnimTiming = {
  // Duration presets (ms)
  instant: 100,
  fast: 200,
  normal: 350,
  slow: 500,
  entrance: 600,
  dramatic: 800,

  // Stagger delay between items (ms)
  stagger: 60,
  staggerFast: 40,
  staggerSlow: 100,

  // Spring configs (Hyper-responsive fluid physics)
  springSnappy: { damping: 18, stiffness: 400, mass: 0.8 },
  springBouncy: { damping: 14, stiffness: 250, mass: 1 },
  springGentle: { damping: 25, stiffness: 180, mass: 1.2 },
  springPress: { damping: 16, stiffness: 500, mass: 0.5 },

  // Timing configs
  easeOut: { duration: 350 },
  easeInOut: { duration: 400 },
};
