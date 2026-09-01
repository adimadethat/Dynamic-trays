import {Animated, Easing} from 'react-native';

/**
 * The "Family feel" is spring physics, not duration/easing curves.
 *
 * React Native's built-in `Animated.spring` supports a real physics model
 * (`stiffness` / `damping` / `mass`) — no library required. These presets are
 * tuned to feel like the trays in the Family app: quick to respond, settling
 * with a hair of overshoot, never floaty.
 *
 * IMPORTANT about the native driver:
 *   - `opacity` and `transform` CAN run on the native (UI) thread
 *     -> useNativeDriver: true. These never stutter, even if JS is busy.
 *   - layout props like `height` CANNOT use the native driver. They run on
 *     the JS thread. That is fine — see DynamicTray.tsx for why it stays
 *     smooth (the children are frozen during the morph, so the only per-frame
 *     JS work is interpolating one number).
 */

export type SpringOpts = Partial<
  Pick<
    Animated.SpringAnimationConfig,
    'stiffness' | 'damping' | 'mass' | 'restDisplacementThreshold' | 'restSpeedThreshold'
  >
>;

/** Height morph: snappy, effectively no overshoot (overshoot on height looks like a glitch). */
export const HEIGHT_SPRING: SpringOpts = {
  stiffness: 560,
  damping: 44,
  mass: 1,
  restDisplacementThreshold: 0.4,
  restSpeedThreshold: 0.4,
};

/** Drag release / dismiss: a touch more give so it feels physical in the hand. */
export const DRAG_SPRING: SpringOpts = {
  stiffness: 420,
  damping: 38,
  mass: 1,
};

/** Content fade timing (native-driven opacity). */
export const FADE_IN_MS = 220;
export const FADE_OUT_MS = 140;

/** Small vertical travel used to give the forward-flow morph a sense of direction. */
export const PUSH_TRAVEL = 14;

export function springHeight(
  value: Animated.Value,
  toValue: number,
  opts: SpringOpts = HEIGHT_SPRING,
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue,
    useNativeDriver: false, // height is a layout prop -> JS thread. Intentional.
    ...opts,
  });
}

export function fade(
  value: Animated.Value,
  toValue: number,
  durationMs: number,
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue,
    duration: durationMs,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true, // opacity -> native thread. Never stutters.
  });
}

export function springTransform(
  value: Animated.Value,
  toValue: number,
  opts: SpringOpts = DRAG_SPRING,
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue,
    useNativeDriver: true, // transform -> native thread.
    ...opts,
  });
}
