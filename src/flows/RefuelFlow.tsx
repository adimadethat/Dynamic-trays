import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {DynamicTray, type TrayStep} from '../tray/DynamicTray';
import {theme} from '../tray/theme';
import {Chip, Divider, Dot, Sheeting, TrayHeader} from '../ui/atoms';

const CHAINS = [
  {id: 'base', name: 'Base', color: theme.color.base, glyph: 'B'},
  {id: 'optimism', name: 'Optimism', color: theme.color.optimism, glyph: 'O'},
  {id: 'arbitrum', name: 'Arbitrum', color: theme.color.arbitrum, glyph: 'A'},
  {id: 'polygon', name: 'Polygon', color: theme.color.polygon, glyph: 'P'},
];
const PRESETS = ['$2', '$5', '$10', '$20', '$50', 'Custom'];

type StepKey = 'chains' | 'amount' | 'custom' | 'review' | 'confirm';

export function RefuelFlow({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const [step, setStep] = useState<StepKey>('chains');
  const [selected, setSelected] = useState<string[]>(['base']);
  const [amount, setAmount] = useState<string | null>(null);
  const [custom, setCustom] = useState('0');

  const toggleChain = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const chosenChains = CHAINS.filter(c => selected.includes(c.id));
  const perChain = amount === 'Custom' ? Number(custom) : Number((amount ?? '$0').slice(1));
  const total = perChain * chosenChains.length;

  const pressKey = (k: string) =>
    setCustom(prev => {
      if (k === '<') return prev.length <= 1 ? '0' : prev.slice(0, -1);
      const next = prev === '0' ? k : prev + k;
      return Number(next) > 50 ? '50' : next;
    });

  const steps: TrayStep[] = useMemo(
    () => [
      {
        key: 'chains',
        footer: {
          primary: {
            label: 'Continue',
            enabled: selected.length > 0,
            onPress: () => setStep('amount'),
          },
        },
        render: () => (
          <Sheeting>
            <TrayHeader title="Choose Chains" onClose={onClose} />
            {CHAINS.map(c => {
              const on = selected.includes(c.id);
              return (
                <Pressable key={c.id} style={styles.row} onPress={() => toggleChain(c.id)}>
                  <Dot color={c.color} glyph={c.glyph} />
                  <Text style={styles.rowLabel}>{c.name}</Text>
                  <View style={[styles.check, on && styles.checkOn]}>
                    {on ? <Text style={styles.checkGlyph}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </Sheeting>
        ),
      },
      {
        key: 'amount',
        footer: {
          primary: {
            label: 'Continue',
            enabled: amount != null && amount !== 'Custom',
            onPress: () => setStep('review'),
          },
        },
        render: () => (
          <Sheeting>
            <TrayHeader title="Choose Amount" onClose={onClose} />
            <Text style={styles.caption}>
              Choose the amount of gas you'd like to top up on your selected chain.
            </Text>
            <View style={styles.grid}>
              {PRESETS.map(p => (
                <View key={p} style={styles.gridCell}>
                  <Chip
                    label={p}
                    active={amount === p}
                    onPress={() => {
                      setAmount(p);
                      if (p === 'Custom') setStep('custom');
                    }}
                  />
                </View>
              ))}
            </View>
          </Sheeting>
        ),
      },
      {
        key: 'custom',
        footer: {
          primary: {
            label: 'Continue',
            enabled: Number(custom) > 0,
            onPress: () => setStep('review'),
          },
        },
        render: () => (
          <Sheeting>
            <TrayHeader title="Custom Amount" onClose={onClose} />
            <View style={styles.amountDisplay}>
              <Text style={styles.amountBig}>${custom}</Text>
              <Text style={styles.amountMax}>Max Amount: $50</Text>
            </View>
            <Keypad onKey={pressKey} />
          </Sheeting>
        ),
      },
      {
        key: 'review',
        footer: {primary: {label: 'Continue', onPress: () => setStep('confirm')}},
        render: () => (
          <Sheeting>
            <TrayHeader title="Review Details" onClose={onClose} />
            <View style={styles.reviewTop}>
              <Text style={styles.reviewTag}>⚡ Refuel</Text>
              <View style={styles.benji}>
                <Dot color={theme.color.card} />
                <Text style={styles.benjiText}>Benji</Text>
              </View>
            </View>
            <View style={styles.amountsHead}>
              <Text style={styles.amountsLabel}>Amounts</Text>
              <Pressable onPress={() => setStep('amount')}>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            </View>
            {chosenChains.map(c => (
              <View key={c.id} style={styles.reviewRow}>
                <Dot color={c.color} glyph={c.glyph} />
                <Text style={styles.rowLabel}>{c.name}</Text>
                <Text style={styles.reviewAmt}>${perChain}</Text>
              </View>
            ))}
            <Divider />
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Pay with</Text>
              <View style={{flex: 1}} />
              <Dot color={theme.color.ethereum} glyph="E" />
              <Text style={styles.reviewAmt}> Ethereum</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.rowLabel}>Total</Text>
              <View style={{flex: 1}} />
              <Text style={styles.totalText}>≈ 0.00{total} ETH  ${total}</Text>
            </View>
          </Sheeting>
        ),
      },
      {
        key: 'confirm',
        footer: {
          secondary: {label: 'Cancel', onPress: () => setStep('review')},
          primary: {label: 'Confirm', icon: '⛨', onPress: onClose},
        },
        render: () => (
          <Sheeting>
            <View style={styles.confirmHead}>
              <Text style={styles.bolt}>⚡</Text>
              <Text style={styles.confirmTitle}>Refuel Gas</Text>
              <Text style={styles.caption}>
                To finish your refuel, review and confirm the transaction below.
              </Text>
            </View>
            <View style={styles.txReq}>
              <Text style={styles.txReqText}>✈ Transaction Request</Text>
            </View>
            <Text style={styles.confirmAmount}>${total}</Text>
            <Text style={styles.confirmSym}>◆ ETH</Text>
            <View style={styles.feeRow}>
              <Text style={styles.feeText}>${(total * 0.0375).toFixed(2)}{'\n'}Fee Estimate</Text>
              <Text style={styles.feeText}>Normal{'\n'}~45 Secs</Text>
            </View>
          </Sheeting>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, selected, amount, custom],
  );

  return (
    <DynamicTray
      visible={visible}
      steps={steps}
      activeKey={step}
      transition="push"
      onRequestClose={onClose}
    />
  );
}

function Keypad({onKey}: {onKey: (k: string) => void}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'];
  return (
    <View style={styles.keypad}>
      {keys.map((k, i) => (
        <Pressable
          key={i}
          disabled={k === ''}
          onPress={() => onKey(k)}
          style={({pressed}) => [styles.keyCell, pressed && k !== '' && styles.keyPressed]}>
          <Text style={styles.keyText}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space(3),
    gap: theme.space(3),
  },
  rowLabel: {fontSize: 16, color: theme.color.text, fontWeight: '600'},
  check: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {backgroundColor: theme.color.accent, borderColor: theme.color.accent},
  checkGlyph: {color: '#fff', fontSize: 13, fontWeight: '800'},
  caption: {
    fontSize: theme.font.body,
    color: theme.color.textDim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.space(4),
    paddingHorizontal: theme.space(2),
  },
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.space(1)},
  gridCell: {width: '33.33%', paddingHorizontal: theme.space(1), paddingVertical: theme.space(1)},
  amountDisplay: {alignItems: 'center', paddingVertical: theme.space(4)},
  amountBig: {fontSize: 56, fontWeight: '800', color: theme.color.text},
  amountMax: {fontSize: theme.font.small, color: theme.color.textDim, marginTop: theme.space(1)},
  keypad: {flexDirection: 'row', flexWrap: 'wrap'},
  keyCell: {width: '33.33%', height: 56, alignItems: 'center', justifyContent: 'center'},
  keyPressed: {backgroundColor: theme.color.surface, borderRadius: 12},
  keyText: {fontSize: 24, fontWeight: '500', color: theme.color.text},
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.chip,
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(3),
    marginBottom: theme.space(3),
  },
  reviewTag: {fontSize: 15, fontWeight: '700', color: theme.color.text},
  benji: {flexDirection: 'row', alignItems: 'center', gap: theme.space(2)},
  benjiText: {fontSize: 15, fontWeight: '600', color: theme.color.text},
  amountsHead: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.space(1)},
  amountsLabel: {fontSize: theme.font.small, color: theme.color.textDim, fontWeight: '600'},
  editLink: {fontSize: theme.font.small, color: theme.color.accent, fontWeight: '700'},
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space(2),
    gap: theme.space(3),
  },
  reviewAmt: {marginLeft: 'auto', fontSize: 15, fontWeight: '700', color: theme.color.text},
  totalText: {fontSize: 15, fontWeight: '700', color: theme.color.text},
  confirmHead: {alignItems: 'center', paddingTop: theme.space(2)},
  bolt: {fontSize: 40},
  confirmTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.color.text,
    marginTop: theme.space(2),
    marginBottom: theme.space(2),
  },
  txReq: {
    alignSelf: 'center',
    backgroundColor: '#EAF4FF',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(2),
    marginVertical: theme.space(3),
  },
  txReqText: {color: theme.color.accent, fontSize: 13, fontWeight: '700'},
  confirmAmount: {fontSize: 52, fontWeight: '800', color: theme.color.text, textAlign: 'center'},
  confirmSym: {
    fontSize: 15,
    color: theme.color.textDim,
    textAlign: 'center',
    marginTop: theme.space(1),
    marginBottom: theme.space(3),
    fontWeight: '600',
  },
  feeRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.space(3)},
  feeText: {fontSize: theme.font.small, color: theme.color.textDim, fontWeight: '600'},
});
