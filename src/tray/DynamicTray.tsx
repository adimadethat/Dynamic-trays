import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import {theme} from './theme';
import {
  DRAG_SPRING,
  PUSH_TRAVEL,
  fade,
  FADE_IN_MS,
  FADE_OUT_MS,
  springHeight,
  springTransform,
} from './springs';

export type TrayStep = {
  /** Stable identity for this step. Height is cached per key. */
  key: string;
  render: () => React.ReactNode;
};

export type TrayTransition = 'push' | 'fade';

type Props = {
  visible: boolean;
  steps: TrayStep[];
  activeKey: string;
  /** 'push' = forward-flow (V1). 'fade' = info reveal (V2). */
  transition?: TrayTransition;
  onRequestClose: () => void;
};

type Vals = {opacity: Animated.Value; ty: Animated.Value};

/**
 * DynamicTray — a Family-style morphing bottom sheet, built from RN core only.
 *
 * ── Why this does not stutter (the thing everyone gets wrong) ──────────────
 * The height of the content area is a *layout* prop, so it can only animate on
 * the JS thread (the native driver refuses layout props). That is NOT the
 * problem people think it is. Stutter happens when you animate height WHILE the
 * children re-render / re-measure every frame — then each frame pays for a full
 * React render + Yoga relayout of live components.
 *
 * We avoid that completely:
 *   1. Every step is measured ONCE via onLayout and its natural height cached.
 *   2. During a morph, both the outgoing and incoming steps are frozen: they are
 *      position:absolute (so they never push layout) and their props do not
 *      change. The subtree is static.
 *   3. The only things animating per frame are:
 *         • container height  -> one number, JS thread (cheap: static subtree)
 *         • opacity + translateY of each layer -> NATIVE thread (free)
 *
 * Result: the JS thread interpolates a single float while the compositor does
 * the visible work. Smooth, with zero animation libraries.
 */
export function DynamicTray({
  visible,
  steps,
  activeKey,
  transition = 'push',
  onRequestClose,
}: Props) {
  const {height: screenH} = useWindowDimensions();

  // --- Whole-sheet presentation (slide up / drag to dismiss) ---------------
  const sheetTY = useRef(new Animated.Value(screenH)).current; // start off-screen
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetHeightRef = useRef(screenH); // measured, for dismiss travel
  const [rendered, setRendered] = useState(visible);

  // --- Morphing content area ----------------------------------------------
  const heightAnim = useRef(new Animated.Value(0)).current;
  const currentTargetRef = useRef(0); // last height we sprang to
  const valsRef = useRef(new Map<string, Vals>());
  const heightsRef = useRef(new Map<string, number>());
  const prevActiveRef = useRef<string | null>(null);
  const pendingFromRef = useRef<string | null | undefined>(undefined);

  const [mountedKeys, setMountedKeys] = useState<string[]>([activeKey]);

  const getVals = useCallback((key: string, initialOpacity = 0): Vals => {
    let v = valsRef.current.get(key);
    if (!v) {
      v = {
        opacity: new Animated.Value(initialOpacity),
        ty: new Animated.Value(0),
      };
      valsRef.current.set(key, v);
    }
    return v;
  }, []);

  // Ensure the very first active step is visible immediately.
  useEffect(() => {
    getVals(activeKey, 1).opacity.setValue(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Present / dismiss the whole sheet ──────────────────────────────────
  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        springTransform(sheetTY, 0, DRAG_SPRING),
        fade(backdrop, 1, FADE_IN_MS),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        springTransform(sheetTY, sheetHeightRef.current + 40, DRAG_SPRING),
        fade(backdrop, 0, FADE_OUT_MS),
      ]).start(({finished}) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Kick off a morph when activeKey changes ────────────────────────────
  useEffect(() => {
    const from = prevActiveRef.current;
    prevActiveRef.current = activeKey;
    if (from === null || from === activeKey) return; // first mount: no morph

    // Mount both layers, incoming last (drawn on top). Freeze incoming hidden.
    const incoming = getVals(activeKey);
    incoming.opacity.setValue(0);
    incoming.ty.setValue(transition === 'push' ? PUSH_TRAVEL : 0);
    setMountedKeys(keys =>
      keys.includes(activeKey) ? keys : [...keys.filter(k => k !== activeKey), activeKey],
    );

    // The morph starts from the incoming step's onLayout (fresh natural height).
    // If we already cached it, prime the spring immediately for zero latency.
    pendingFromRef.current = from;
    const cached = heightsRef.current.get(activeKey);
    if (cached != null) startMorph(from, activeKey, cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, transition]);

  const startMorph = useCallback(
    (from: string | null, to: string, targetH: number) => {
      if (pendingFromRef.current === undefined) return; // already consumed
      pendingFromRef.current = undefined;
      currentTargetRef.current = targetH;

      const toVals = getVals(to);
      const fromVals = from ? getVals(from) : null;

      Animated.parallel([
        springHeight(heightAnim, targetH),
        fade(toVals.opacity, 1, FADE_IN_MS),
        springTransform(toVals.ty, 0),
        ...(fromVals ? [fade(fromVals.opacity, 0, FADE_OUT_MS)] : []),
        ...(fromVals && transition === 'push'
          ? [springTransform(fromVals.ty, -PUSH_TRAVEL)]
          : []),
      ]).start(({finished}) => {
        if (!finished) return;
        // Drop the outgoing layer; keep only the active one mounted.
        setMountedKeys([to]);
        if (fromVals) {
          fromVals.opacity.setValue(0);
          fromVals.ty.setValue(0);
        }
      });
    },
    [getVals, heightAnim, transition],
  );

  // Called by each mounted step. Gives us the natural height for free.
  const onStepLayout = useCallback(
    (key: string, e: LayoutChangeEvent) => {
      const h = Math.round(e.nativeEvent.layout.height);
      if (h <= 0) return;
      heightsRef.current.set(key, h);

      if (key !== activeKey) return;

      // First ever measurement: adopt height with no animation.
      if (currentTargetRef.current === 0) {
        currentTargetRef.current = h;
        heightAnim.setValue(h);
        return;
      }
      // A morph to this key is pending: start it now with the fresh height.
      if (pendingFromRef.current !== undefined) {
        startMorph(pendingFromRef.current, key, h);
        return;
      }
      // Active content changed size on its own (e.g. a row appeared): keep the
      // tray fitted. Still just a height spring on a static layer -> smooth.
      if (Math.abs(h - currentTargetRef.current) > 1) {
        currentTargetRef.current = h;
        springHeight(heightAnim, h).start();
      }
    },
    [activeKey, heightAnim, startMorph],
  );

  // ── Drag-to-dismiss (interruptible, native-thread transform) ───────────
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => {
        sheetTY.setValue(Math.max(0, g.dy)); // only downward
      },
      onPanResponderRelease: (_e, g) => {
        const shouldClose = g.dy > 120 || g.vy > 0.8;
        if (shouldClose) {
          onRequestClose();
        } else {
          springTransform(sheetTY, 0, DRAG_SPRING).start();
        }
      },
    }),
  ).current;

  if (!rendered) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, {opacity: backdrop}]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, {transform: [{translateY: sheetTY}]}]}
        onLayout={e => (sheetHeightRef.current = e.nativeEvent.layout.height)}>
        {/* Grab handle owns the dismiss gesture */}
        <View {...pan.panHandlers} style={styles.grabZone}>
          <View style={styles.grabber} />
        </View>

        {/* The morphing content area: fixed to the animated height, clips overflow */}
        <Animated.View style={[styles.clip, {height: heightAnim}]}>
          {mountedKeys.map(key => {
            const step = steps.find(s => s.key === key);
            if (!step) return null;
            const v = getVals(key);
            const isActive = key === activeKey;
            return (
              <Animated.View
                key={key}
                // Absolute so a layer never pushes the others -> subtree stays static.
                style={[
                  styles.layer,
                  {opacity: v.opacity, transform: [{translateY: v.ty}]},
                ]}
                pointerEvents={isActive ? 'auto' : 'none'}>
                <View onLayout={e => onStepLayout(key, e)}>{step.render()}</View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.color.backdrop,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.color.sheet,
    borderTopLeftRadius: theme.radius.sheet,
    borderTopRightRadius: theme.radius.sheet,
    paddingBottom: 34, // home indicator safe area
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: -6},
    elevation: 24,
  },
  grabZone: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9D9DE',
  },
  clip: {
    overflow: 'hidden',
    width: '100%',
  },
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
