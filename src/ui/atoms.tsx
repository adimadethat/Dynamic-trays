import React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {theme} from '../tray/theme';

/** Sheet header: title on the left, a circular ✕ on the right (persistent chrome). */
export function TrayHeader({title, onClose}: {title: string; onClose: () => void}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        onPress={onClose}
        hitSlop={10}
        style={({pressed}) => [styles.closeBtn, pressed && {opacity: 0.6}]}>
        <Text style={styles.closeGlyph}>✕</Text>
      </Pressable>
    </View>
  );
}

/** Full-width primary button whose fill animates between disabled and enabled. */
export function PrimaryButton({
  label,
  onPress,
  enabled = true,
  icon,
}: {
  label: string;
  onPress: () => void;
  enabled?: boolean;
  icon?: string;
}) {
  const t = React.useRef(new Animated.Value(enabled ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(t, {
      toValue: enabled ? 1 : 0,
      duration: 180,
      useNativeDriver: false, // interpolating backgroundColor -> JS thread (cheap, one view)
    }).start();
  }, [enabled, t]);

  const backgroundColor = t.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.color.accentDisabled, theme.color.accent],
  });

  return (
    <Pressable onPress={enabled ? onPress : undefined}>
      {({pressed}) => (
        <Animated.View
          style={[styles.primary, {backgroundColor}, pressed && enabled && {opacity: 0.9}]}>
          <Text style={styles.primaryText}>
            {icon ? `${icon}  ` : ''}
            {label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

/** Secondary (gray) button used in two-button rows. */
export function SecondaryButton({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.secondary, pressed && {opacity: 0.7}]}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

/** Selectable amount chip (blue outline when active). */
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.chip,
        active && styles.chipActive,
        pressed && {opacity: 0.8},
      ]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Small colored chain/brand dot. */
export function Dot({color, glyph}: {color: string; glyph?: string}) {
  return (
    <View style={[styles.dot, {backgroundColor: color}]}>
      {glyph ? <Text style={styles.dotGlyph}>{glyph}</Text> : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Sheeting({children, style}: {children: React.ReactNode; style?: ViewStyle}) {
  return <View style={[styles.body, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: theme.space(5),
    paddingBottom: theme.space(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Horizontal inset is owned by <Sheeting>, which always wraps the header.
    paddingTop: theme.space(1),
    paddingBottom: theme.space(3),
  },
  title: {
    fontSize: theme.font.title,
    fontWeight: '700',
    color: theme.color.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {fontSize: 13, color: theme.color.textDim, fontWeight: '600'},
  primary: {
    height: 52,
    borderRadius: theme.radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {color: theme.color.accentText, fontSize: 16, fontWeight: '700'},
  secondary: {
    width: '100%',
    height: 52,
    borderRadius: theme.radius.card,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {color: theme.color.text, fontSize: 16, fontWeight: '700'},
  chip: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.chip,
    backgroundColor: theme.color.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: theme.color.surfaceActive,
    borderColor: theme.color.selected,
  },
  chipText: {fontSize: 16, fontWeight: '600', color: theme.color.text},
  chipTextActive: {color: theme.color.selected},
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGlyph: {color: '#fff', fontSize: 12, fontWeight: '700'},
  divider: {height: 1, backgroundColor: theme.color.border, marginVertical: theme.space(3)},
});
