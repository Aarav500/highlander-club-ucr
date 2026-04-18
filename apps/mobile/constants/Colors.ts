// Highlander Events — Premium Design System v3 (Dark Luxury + Glassmorphism)

export const Colors = {
  // UCR Brand
  ucrBlue: '#1E6AFF',
  ucrGold: '#FFB800',

  // Dark theme (Neo-Glassmorphism Obsidian)
  dark: {
    background: '#030508',
    surface: '#080C14',
    surfaceElevated: '#0D1221',
    card: '#080C14',
    text: '#FFFFFF',
    textSecondary: '#8896B3',
    textMuted: '#4A5578',
    primary: '#1E6AFF',
    primaryLight: '#4D8BFF',
    accent: '#FFB800',
    accentLight: '#FFD166',
    cyan: '#00E5FF',
    success: '#00E676',
    danger: '#FF3D5A',
    warning: '#FFB800',
    border: '#1A2240',
    borderGlass: 'rgba(255,255,255,0.08)',
    glass: 'rgba(255,255,255,0.05)',
    glassStrong: 'rgba(255,255,255,0.1)',
    tabBar: '#030508',
    tabIconDefault: '#4A5578',
    tabIconSelected: '#FFB800',
    happeningNow: '#00E5FF',
    rsvp: '#FF3D5A',
    rsvpActive: '#FFB800',
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
  primary: ['#1E6AFF', '#1455CC'] as const,
  accent: ['#FFB800', '#CC9200'] as const,
  cyan: ['#00E5FF', '#00B8D4'] as const,
  danger: ['#FF3D5A', '#DC2626'] as const,

  // Surface gradients (for cards, modals)
  glassSurface: ['rgba(8,12,20,0.85)', 'rgba(8,12,20,0.65)'] as const,
  glassCard: ['rgba(13,18,33,0.9)', 'rgba(13,18,33,0.7)'] as const,
  glassElevated: ['rgba(20,26,46,0.9)', 'rgba(13,18,33,0.8)'] as const,

  // Background ambience
  heroOverlay: ['rgba(3,5,8,0.3)', 'transparent', 'transparent', 'rgba(3,5,8,0.96)'] as const,
  bottomFade: ['transparent', 'rgba(3,5,8,0.95)'] as const,
  topFade: ['rgba(3,5,8,0.95)', 'transparent'] as const,

  // Glow presets
  glowBlue: ['rgba(30,106,255,0.25)', 'rgba(30,106,255,0)'] as const,
  glowGold: ['rgba(255,184,0,0.2)', 'rgba(255,184,0,0)'] as const,
  glowCyan: ['rgba(0,229,255,0.2)', 'rgba(0,229,255,0)'] as const,

  // Tab bar
  tabBarGlass: ['rgba(3,5,8,0.92)', 'rgba(3,5,8,0.98)'] as const,
};

// ─── Glass Morphism Tokens ────────────────────────────────────────────────────
export const Glass = {
  background: 'rgba(8,12,20,0.75)',
  backgroundStrong: 'rgba(8,12,20,0.88)',
  backgroundLight: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  borderFocused: 'rgba(255,255,255,0.16)',
  borderAccent: 'rgba(255,184,0,0.3)',
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
