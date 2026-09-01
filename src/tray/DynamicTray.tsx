import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Keyboard,
  Platform,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import {theme} from './theme';
import {PrimaryButton, SecondaryButton} from '../ui/atoms';
import {
  CONTENT_SPRING,
  DRAG_SPRING,
  FOOTER_SPRING,
  fade,
  fadeJS,
  FADE_IN_MS,
  FADE_OUT_MS,
  SCALE_IN_FROM,
  SCALE_OUT_TO,
  springHeight,
  springTransform,
} from './springs';

export type TrayFooter = {
  primary?: {label: string; icon?: string; enabled?: boolean; onPress: () => void};
  secondary?: {label: string; onPress: () => void};
};

export type TrayStep = {
  /** Stable identity for this step. Height is cached per key. */
  key: string;
  render: () => React.ReactNode;
  /** Optional persistent action row. Morphs between steps (Cancel reveal + primary shrink). */
  footer?: TrayFooter;
};

export type TrayTransition = 'push' | 'fade';

type Props = {
  visible: boolean;
  steps: TrayStep[];
  activeKey: string;
  /** 'push' = forward-flow (V1, slight upward drift). 'fade' = info reveal (V2, pure scale). */
  transition?: TrayTransition;
  onRequestClose: () => void;
};

type Vals = {opacity: Animated.Value; scale: Animated.Value; ty: Animated.Value};

const MARGIN_H = 12;
// Bottom gap must clear the home-indicator / curved-screen corner so the sheet's
// rounded bottom corners aren't sliced off by the physical display edge.
const MARGIN_B = 40;
const PUSH_TRAVEL = 10;
const FOOTER_H = 64; // 52 button + 12 top padding
const CANCEL_W = 104;
const CANCEL_GAP = 12;

/**
 * DynamicTray — a Family-style morphing bottom sheet, built from RN core only.
 *
 * ── Why height animation does not stutter ───────────────────────────────────
 * Height is a layout prop, so it only animates on the JS thread. Stutter comes
 * from animating height WHILE the children re-render every frame. We avoid that:
 * every step is measured once (onLayout), and during a morph the outgoing +
 * incoming steps are frozen as position:absolute layers whose props don't change.
 * The only per-frame JS work is one float (height); opacity + scale ride the
 * native thread. Smooth, no libraries.
 *
 * ── Cross-fade choreography (both directions) ───────────────────────────────
 * Outgoing content: opacity 1→0, scale 1→0.96.
 * Incoming content: opacity 0→1, scale 0.94→1 (springs up to full size).
 * 'push' adds a small vertical drift so a forward step reads as forward.
 *
 * ── Shared footer ───────────────────────────────────────────────────────────
 * The action row lives OUTSIDE the cross-fading content, so the primary button
 * is one continuous element across steps. Going single → two buttons, the
 * primary shrinks (flex) and anchors right while Cancel reveals from width 0.
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
  const sheetTY = useRef(new Animated.Value(screenH)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  // Combined vertical transform: drag/present offset + keyboard lift (both native).
  const sheetTranslate = useRef(Animated.add(sheetTY, keyboardOffset)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetHeightRef = useRef(screenH);
  const [rendered, setRendered] = useState(visible);

  // --- Morphing content area ----------------------------------------------
  const heightAnim = useRef(new Animated.Value(0)).current;
  const currentTargetRef = useRef(0);
  const valsRef = useRef(new Map<string, Vals>());
  const heightsRef = useRef(new Map<string, number>());
  const prevActiveRef = useRef<string | null>(null);
  const pendingFromRef = useRef<string | null | undefined>(undefined);
  const [mountedKeys, setMountedKeys] = useState<string[]>([activeKey]);

  // --- Footer (shared element) --------------------------------------------
  const activeStep = steps.find(s => s.key === activeKey);
  const activeFooter = activeStep?.footer;
  const hasFooter = !!activeFooter;
  const hasSecondary = !!activeFooter?.secondary;

  const footerH = useRef(new Animated.Value(hasFooter ? FOOTER_H : 0)).current;
  const footerOpacity = useRef(new Animated.Value(hasFooter ? 1 : 0)).current;
  const secondaryProgress = useRef(new Animated.Value(hasSecondary ? 1 : 0)).current;
  const lastFooterRef = useRef<TrayFooter | undefined>(activeFooter);
  const lastSecondaryRef = useRef(activeFooter?.secondary);
  if (activeFooter) lastFooterRef.current = activeFooter;
  if (activeFooter?.secondary) lastSecondaryRef.current = activeFooter.secondary;
  const displayFooter = activeFooter ?? lastFooterRef.current;

  const getVals = useCallback((key: string, initialOpacity = 0): Vals => {
    let v = valsRef.current.get(key);
    if (!v) {
      v = {
        opacity: new Animated.Value(initialOpacity),
        scale: new Animated.Value(initialOpacity ? 1 : SCALE_IN_FROM),
        ty: new Animated.Value(0),
      };
      valsRef.current.set(key, v);
    }
    return v;
  }, []);

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
      Keyboard.dismiss();
      Animated.parallel([
        springTransform(sheetTY, sheetHeightRef.current + MARGIN_B + 40, DRAG_SPRING),
        fade(backdrop, 0, FADE_OUT_MS),
      ]).start(({finished}) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Lift the sheet above the keyboard (so text inputs stay visible) ─────
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: {endCoordinates?: {height: number}; duration?: number}) => {
      const h = e.endCoordinates?.height ?? 0;
      Animated.timing(keyboardOffset, {
        toValue: -Math.max(0, h - MARGIN_B + 8),
        duration: e.duration || 250,
        useNativeDriver: true,
      }).start();
    };
    const onHide = (e: {duration?: number}) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: e?.duration || 200,
        useNativeDriver: true,
      }).start();
    };
    const s = Keyboard.addListener(showEvt, onShow);
    const h = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s.remove();
      h.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Morph footer when the active step's action row changes ─────────────
  useEffect(() => {
    Animated.parallel([
      springHeight(footerH, hasFooter ? FOOTER_H : 0, FOOTER_SPRING),
      // JS-driven: this opacity shares a node with the footer's animated height.
      fadeJS(footerOpacity, hasFooter ? 1 : 0, hasFooter ? FADE_IN_MS : FADE_OUT_MS),
      springHeight(secondaryProgress, hasSecondary ? 1 : 0, FOOTER_SPRING),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFooter, hasSecondary, activeKey]);

  // ── Kick off a content morph when activeKey changes ────────────────────
  useEffect(() => {
    const from = prevActiveRef.current;
    prevActiveRef.current = activeKey;
    if (from === null || from === activeKey) return;

    const incoming = getVals(activeKey);
    incoming.opacity.setValue(0);
    incoming.scale.setValue(SCALE_IN_FROM);
    incoming.ty.setValue(transition === 'push' ? PUSH_TRAVEL : 0);
    setMountedKeys(keys =>
      keys.includes(activeKey) ? keys : [...keys.filter(k => k !== activeKey), activeKey],
    );

    // Always start the morph from the incoming step's fresh onLayout (it fires
    // next frame on (re)mount). Starting from a cached height and then
    // re-measuring can double-spring the height and stutter.
    pendingFromRef.current = from;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, transition]);

  const startMorph = useCallback(
    (from: string | null, to: string, targetH: number) => {
      if (pendingFromRef.current === undefined) return;
      pendingFromRef.current = undefined;
      currentTargetRef.current = targetH;

      const toVals = getVals(to);
      const fromVals = from ? getVals(from) : null;

      Animated.parallel([
        springHeight(heightAnim, targetH),
        fade(toVals.opacity, 1, FADE_IN_MS),
        springTransform(toVals.scale, 1, CONTENT_SPRING),
        springTransform(toVals.ty, 0, CONTENT_SPRING),
        ...(fromVals ? [fade(fromVals.opacity, 0, FADE_OUT_MS)] : []),
        ...(fromVals ? [springTransform(fromVals.scale, SCALE_OUT_TO, CONTENT_SPRING)] : []),
        ...(fromVals && transition === 'push'
          ? [springTransform(fromVals.ty, -PUSH_TRAVEL, CONTENT_SPRING)]
          : []),
      ]).start(({finished}) => {
        if (!finished) return;
        setMountedKeys([to]);
        if (fromVals) {
          fromVals.opacity.setValue(0);
          fromVals.scale.setValue(SCALE_IN_FROM);
          fromVals.ty.setValue(0);
        }
      });
    },
    [getVals, heightAnim, transition],
  );

  const onStepLayout = useCallback(
    (key: string, e: LayoutChangeEvent) => {
      const h = Math.round(e.nativeEvent.layout.height);
      if (h <= 0) return;
      heightsRef.current.set(key, h);
      if (key !== activeKey) return;

      if (currentTargetRef.current === 0) {
        currentTargetRef.current = h;
        heightAnim.setValue(h);
        return;
      }
      if (pendingFromRef.current !== undefined) {
        startMorph(pendingFromRef.current, key, h);
        return;
      }
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
      onPanResponderMove: (_e, g) => sheetTY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 120 || g.vy > 0.8) onRequestClose();
        else springTransform(sheetTY, 0, DRAG_SPRING).start();
      },
    }),
  ).current;

  if (!rendered) return null;

  const cancelWrapWidth = secondaryProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CANCEL_W + CANCEL_GAP],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, {opacity: backdrop}]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, {transform: [{translateY: sheetTranslate}]}]}
        onLayout={e => (sheetHeightRef.current = e.nativeEvent.layout.height)}>
        <View {...pan.panHandlers} style={styles.grabZone}>
          <View style={styles.grabber} />
        </View>

        {/* Morphing content area */}
        <Animated.View style={[styles.clip, {height: heightAnim}]}>
          {mountedKeys.map(key => {
            const step = steps.find(s => s.key === key);
            if (!step) return null;
            const v = getVals(key);
            const isActive = key === activeKey;
            return (
              <Animated.View
                key={key}
                style={[
                  styles.layer,
                  {opacity: v.opacity, transform: [{translateY: v.ty}, {scale: v.scale}]},
                ]}
                pointerEvents={isActive ? 'auto' : 'none'}>
                <View onLayout={e => onStepLayout(key, e)}>{step.render()}</View>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Shared, morphing footer */}
        <Animated.View
          style={[styles.footer, {height: footerH, opacity: footerOpacity}]}
          pointerEvents={hasFooter ? 'auto' : 'none'}>
          <View style={styles.footerRow}>
            <Animated.View style={{width: cancelWrapWidth, overflow: 'hidden'}}>
              <View style={{width: CANCEL_W}}>
                <SecondaryButton
                  label={(activeFooter?.secondary ?? lastSecondaryRef.current)?.label ?? 'Cancel'}
                  onPress={() =>
                    (activeFooter?.secondary ?? lastSecondaryRef.current)?.onPress()
                  }
                />
              </View>
            </Animated.View>
            {displayFooter?.primary ? (
              <View style={{flex: 1}}>
                <PrimaryButton
                  label={displayFooter.primary.label}
                  icon={displayFooter.primary.icon}
                  enabled={displayFooter.primary.enabled ?? true}
                  onPress={displayFooter.primary.onPress}
                />
              </View>
            ) : null}
          </View>
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
    left: MARGIN_H,
    right: MARGIN_H,
    bottom: MARGIN_B,
    backgroundColor: theme.color.sheet,
    borderRadius: theme.radius.sheet,
    paddingBottom: theme.space(4),
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 8},
    elevation: 24,
  },
  grabZone: {alignItems: 'center', paddingTop: 10, paddingBottom: 6},
  grabber: {width: 40, height: 5, borderRadius: 3, backgroundColor: '#D9D9DE'},
  clip: {overflow: 'hidden', width: '100%'},
  layer: {position: 'absolute', left: 0, right: 0, top: 0},
  footer: {overflow: 'hidden', justifyContent: 'flex-start'},
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space(5),
    paddingTop: theme.space(3),
  },
});
