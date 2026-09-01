/** Minimal token set pulled from the Family reference screens. */
export const theme = {
  color: {
    // Sheet + surfaces
    sheet: '#FFFFFF',
    surface: '#F2F2F5',
    surfaceActive: '#FFFFFF',
    backdrop: 'rgba(0,0,0,0.28)',

    // Text
    text: '#0A0A0A',
    textDim: '#8A8A8E',

    // Accent (the Family blue) + states
    accent: '#2F9BFF',
    accentDisabled: '#BEE0FF',
    accentText: '#FFFFFF',

    // Selection / borders
    selected: '#2F9BFF',
    border: '#ECECEF',
    borderStrong: '#E2E2E6',

    // Danger (Remove Wallet)
    danger: '#FF3B30',
    dangerBg: '#FFECEC',

    // Brand chain dots
    base: '#2151F5',
    optimism: '#FF0420',
    arbitrum: '#12AAFF',
    polygon: '#8247E5',
    ethereum: '#627EEA',

    // Wallet card
    card: '#C77B2A',
  },
  radius: {
    sheet: 28,
    card: 16,
    chip: 12,
    pill: 999,
  },
  space: (n: number) => n * 4,
  font: {
    title: 20,
    body: 15,
    small: 13,
    mono: 44,
  },
} as const;

export type Theme = typeof theme;
