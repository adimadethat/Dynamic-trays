/**
 * Tailwind palette (v4 values) + Host Grotesk font families.
 *
 * The SOT screens use Tailwind's zinc / blue scales plus a couple of accents,
 * and set type in Host Grotesk. These are the exact values pulled from the
 * Figma variables (e.g. blue/500 = #2B7FFF = Tailwind v4 blue-500).
 */
export const tw = {
  white: '#FFFFFF',
  zinc: {
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#9F9FA9',
    500: '#71717B',
    700: '#3F3F47',
    800: '#27272A',
    900: '#18181B',
  },
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#2B7FFF',
  },
  red: {
    50: '#FEF2F2',
    600: '#E7000B',
  },
} as const;

/**
 * Host Grotesk static instances (bundled in assets/fonts, linked via
 * react-native.config.js + `npx react-native-asset`). Each weight is its own
 * family name for reliable cross-platform matching in React Native.
 */
export const font = {
  regular: 'HostGrotesk-Regular',
  medium: 'HostGrotesk-Medium',
  semibold: 'HostGrotesk-SemiBold',
  bold: 'HostGrotesk-Bold',
} as const;
