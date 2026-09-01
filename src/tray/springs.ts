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
 *   - layout props like `height` / `width` CANNOT use the native driver. They
 *     run on the JS thread. That is fine — see DynamicTray.tsx for why it stays
 *     smooth (the children are frozen during the morph, so the only per-frame
 *     JS work is interpolating one number).
 */

export type SpringOpts = Partial<
  Pick<
    Animated.SpringAnimationConfig,
    'stiffness' | 'damping' | 'mass' | 'restDisplacementThreshold' | 'restSpeedThreshold'
  >
>;

/** Height morph: fast + crisp, essentially no overshoot (overshoot on height reads as a glitch). */
export const HEIGHT_SPRING: SpringOpts = {
  stiffness: 1000,
  damping: 52,
  mass: 1,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
};

/** Content scale/settle spring — a touch of life, quick to arrive. */
export const CONTENT_SPRING: SpringOpts = {
  stiffness: 900,
  damping: 44,
  mass: 0.9,
};

/** Drag release / dismiss: snappy return. */
export const DRAG_SPRING: SpringOpts = {
  stiffness: 700,
  damping: 46,
  mass: 1,
};

/** Footer morph (Cancel reveal + primary shrink) — width is JS-thread, keep it brisk. */
export const FOOTER_SPRING: SpringOpts = {
  stiffness: 900,
  damping: 48,
  mass: 1,
};

/** Content fade timing (native-driven opacity). Snappy: out leads, in follows fast. */
export const FADE_IN_MS = 150;
export const FADE_OUT_MS = 90;

/**
 * Scale endpoints for the cross-fade:
 *  - incoming content grows from slightly small -> full size
 *  - outgoing content shrinks slightly as it leaves
 */
export const SCALE_IN_FROM = 0.94; // incoming starts here, springs to 1
export const SCALE_OUT_TO = 0.96; // outgoing ends here as it fades

export function springHeight(
  value: Animated.Value,
  toValue: number,
  opts: SpringOpts = HEIGHT_SPRING,
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue,
    useNativeDriver: false, // height/width are layout props -> JS thread. Intentional.
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
  opts: SpringOpts = CONTENT_SPRING,
): Animated.CompositeAnimation {
  return Animated.spring(value, {
    toValue,
    useNativeDriver: true, // transform -> native thread.
    ...opts,
  });
}
