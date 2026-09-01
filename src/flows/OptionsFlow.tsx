import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {DynamicTray, type TrayStep} from '../tray/DynamicTray';
import {theme} from '../tray/theme';
import {PrimaryButton, SecondaryButton, Sheeting, TrayHeader} from '../ui/atoms';

type StepKey = 'options' | 'privateKey' | 'recovery';

const INFO = {
  privateKey: {
    title: 'Private Key',
    blurb: 'Your Private Key is the key used to back up your wallet. Keep it secret and secure at all times.',
    bullets: [
      'Keep your Private Key safe',
      "Don't share it with anyone else",
      "If you lose it, we can't recover it",
    ],
  },
  recovery: {
    title: 'Secret Recovery Phrase',
    blurb: 'Your Secret Recovery Phrase is the key used to back up your wallet. Keep it secret and secure at all times.',
    bullets: [
      'Keep your Secret Phrase safe',
      "Don't share it with anyone else",
      "If you lose it, we can't recover it",
    ],
  },
} as const;

export function OptionsFlow({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const [step, setStep] = useState<StepKey>('options');

  const infoPanel = (which: 'privateKey' | 'recovery') => {
    const data = INFO[which];
    return (
      <Sheeting>
        <View style={styles.infoIcon}>
          <Text style={{fontSize: 18}}>🔑</Text>
        </View>
        <TrayHeader title={data.title} onClose={onClose} />
        <Text style={styles.blurb}>{data.blurb}</Text>
        <View style={{height: theme.space(3)}} />
        {data.bullets.map(b => (
          <View key={b} style={styles.bulletRow}>
            <Text style={styles.bulletMark}>◦</Text>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
        <View style={styles.twoBtn}>
          <SecondaryButton label="Cancel" onPress={() => setStep('options')} />
          <View style={{width: theme.space(3)}} />
          <View style={{flex: 1}}>
            <PrimaryButton label="Reveal" icon="⛶" onPress={onClose} />
          </View>
        </View>
      </Sheeting>
    );
  };

  const steps: TrayStep[] = useMemo(
    () => [
      {
        key: 'options',
        render: () => (
          <Sheeting>
            <TrayHeader title="Options" onClose={onClose} />
            <OptionRow icon="🗝" label="View Private Key" onPress={() => setStep('privateKey')} />
            <OptionRow icon="📋" label="View Recovery Phrase" onPress={() => setStep('recovery')} />
            <Pressable
              style={[styles.optRow, styles.dangerRow]}
              onPress={onClose}>
              <Text style={styles.dangerText}>⚠  Remove Wallet</Text>
            </Pressable>
          </Sheeting>
        ),
      },
      {key: 'privateKey', render: () => infoPanel('privateKey')},
      {key: 'recovery', render: () => infoPanel('recovery')},
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );

  return (
    <DynamicTray
      visible={visible}
      steps={steps}
      activeKey={step}
      transition="fade" // symmetric cross-dissolve, not a forward push
      onRequestClose={onClose}
    />
  );
}

function OptionRow({icon, label, onPress}: {icon: string; label: string; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.optRow, pressed && {backgroundColor: theme.color.surface}]}>
      <Text style={styles.optIcon}>{icon}</Text>
      <Text style={styles.optLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
    paddingVertical: theme.space(4),
    paddingHorizontal: theme.space(3),
    borderRadius: theme.radius.chip,
  },
  optIcon: {fontSize: 18},
  optLabel: {fontSize: 16, fontWeight: '600', color: theme.color.text},
  dangerRow: {backgroundColor: theme.color.dangerBg, marginTop: theme.space(1)},
  dangerText: {fontSize: 16, fontWeight: '700', color: theme.color.danger},
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space(1),
  },
  blurb: {
    fontSize: theme.font.body,
    color: theme.color.textDim,
    lineHeight: 21,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space(3),
    paddingVertical: theme.space(2),
  },
  bulletMark: {fontSize: 18, color: theme.color.textDim},
  bulletText: {fontSize: 15, color: theme.color.text, fontWeight: '500'},
  twoBtn: {flexDirection: 'row', marginTop: theme.space(4)},
});
