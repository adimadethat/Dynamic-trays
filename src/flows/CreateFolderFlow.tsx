import React, {useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {DynamicTray, type TrayStep} from '../tray/DynamicTray';
import {Sheeting, TrayHeader} from '../ui/atoms';

/**
 * SOT "transactions selected" action sheet (Figma node 25991:71744).
 * Uses the SOT design tokens directly (zinc greys + #2B7FFF blue), not the
 * Family palette, so it matches the source screen.
 *
 * The `New folder` row morphs the tray into a `Create new folder` naming step —
 * a small forward-flow to exercise the engine (and to earn the entry-point name).
 */

const C = {
  text900: '#18181B',
  text500: '#71717B',
  text400: '#9F9FA9',
  surface100: '#F4F4F5',
  border: '#DFDFDF',
  primary500: '#2B7FFF',
  blue100: '#DBEAFE',
  red600: '#E7000B',
  red50: '#FEF2F2',
  white: '#FFFFFF',
};

const SELECTED_COUNT = 4;

type StepKey = 'actions' | 'newFolder';

export function CreateFolderFlow({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const [step, setStep] = useState<StepKey>('actions');
  const [folderName, setFolderName] = useState('');

  const actions = [
    {
      key: 'new',
      icon: '🗂',
      title: 'New folder',
      subtitle: 'Create new folder',
      onPress: () => setStep('newFolder'),
    },
    {
      key: 'move',
      icon: '📁',
      title: 'Move to folder',
      subtitle: 'Chose from existing folder',
      onPress: onClose,
    },
    {
      key: 'merge',
      icon: '⤵',
      title: 'Merge as one transaction',
      subtitle: 'Total value of $ 1,414.21',
      onPress: onClose,
    },
    {
      key: 'delete',
      icon: '🗑',
      title: `Delete all ${SELECTED_COUNT} transactions`,
      subtitle: 'This is irreversible.',
      danger: true,
      onPress: onClose,
    },
  ];

  const steps: TrayStep[] = useMemo(
    () => [
      {
        key: 'actions',
        render: () => (
          <Sheeting>
            <View style={styles.headerBlock}>
              <View style={{flex: 1}}>
                <Text style={styles.title}>{SELECTED_COUNT} transactions selected</Text>
                <Text style={styles.subtitle}>Swipe down to select more</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <Text style={styles.closeGlyph}>✕</Text>
              </Pressable>
            </View>

            {actions.map(a => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                style={({pressed}) => [styles.row, pressed && {backgroundColor: C.surface100}]}>
                <View style={[styles.iconBox, a.danger && {backgroundColor: C.red50}]}>
                  <Text style={styles.iconGlyph}>{a.icon}</Text>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  <Text style={styles.rowSub}>{a.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or,</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.bottomRow}>
              <Pressable onPress={onClose} style={styles.circleBtn}>
                <Text style={styles.circleGlyph}>»</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.submitBtn}>
                <Text style={styles.submitText}>Submit for approval</Text>
              </Pressable>
            </View>
          </Sheeting>
        ),
      },
      {
        key: 'newFolder',
        footer: {
          secondary: {label: 'Cancel', onPress: () => setStep('actions')},
          primary: {
            label: 'Create folder',
            enabled: folderName.trim().length > 0,
            onPress: onClose,
          },
        },
        render: () => (
          <Sheeting>
            <View style={styles.newFolderIcon}>
              <Text style={{fontSize: 20}}>🗂</Text>
            </View>
            <TrayHeader title="Create new folder" onClose={onClose} />
            <Text style={styles.subtitle}>
              Name a folder for these {SELECTED_COUNT} transactions.
            </Text>
            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Folder name"
              placeholderTextColor={C.text400}
              autoFocus
              style={styles.input}
            />
          </Sheeting>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, folderName],
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

const styles = StyleSheet.create({
  headerBlock: {flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 16},
  title: {fontSize: 18, fontWeight: '600', color: C.text900},
  subtitle: {fontSize: 14, color: C.text500, marginTop: 2},
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {fontSize: 13, color: C.text500, fontWeight: '600'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surface100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {fontSize: 18},
  rowTitle: {fontSize: 16, fontWeight: '600', color: C.text900},
  rowSub: {fontSize: 14, color: C.text500, marginTop: 1},
  chevron: {fontSize: 22, color: C.text400, fontWeight: '400'},
  orRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14},
  orLine: {flex: 1, height: 1, backgroundColor: C.border},
  orText: {fontSize: 14, color: C.text400},
  bottomRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: C.primary500,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleGlyph: {fontSize: 22, color: C.primary500, fontWeight: '800'},
  submitBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {fontSize: 16, fontWeight: '600', color: C.primary500},
  newFolderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  input: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    backgroundColor: C.surface100,
    paddingHorizontal: 16,
    fontSize: 16,
    color: C.text900,
  },
});
