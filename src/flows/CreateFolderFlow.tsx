import React, {useMemo, useState} from 'react';
import {Keyboard, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {
  ArrowsMerge,
  CaretDoubleRight,
  CaretRight,
  FolderOpen,
  FolderPlus,
  Trash,
  X,
  type IconProps,
} from 'phosphor-react-native';
import {DynamicTray, type TrayStep} from '../tray/DynamicTray';
import {Sheeting} from '../ui/atoms';
import {font, tw} from '../tray/tailwind';

/**
 * SOT "transactions selected" action sheet + "New folder" input.
 * Figma nodes 25991:71744 (actions) and 25991:72622 (input).
 *
 * Uses the real design system: Tailwind (zinc/blue/red) colors, Host Grotesk
 * type, and Phosphor icons.
 */

const SELECTED_COUNT = 4;

type StepKey = 'actions' | 'newFolder';

type ActionRow = {
  key: string;
  Icon: React.ComponentType<IconProps>;
  title: string;
  subtitle: string;
  danger?: boolean;
  onPress: () => void;
};

export function CreateFolderFlow({visible, onClose}: {visible: boolean; onClose: () => void}) {
  const [step, setStep] = useState<StepKey>('actions');
  const [folderName, setFolderName] = useState('');

  const actions: ActionRow[] = [
    {
      key: 'new',
      Icon: FolderPlus,
      title: 'New folder',
      subtitle: 'Create new folder',
      onPress: () => setStep('newFolder'),
    },
    {
      key: 'move',
      Icon: FolderOpen,
      title: 'Move to folder',
      subtitle: 'Chose from existing folder',
      onPress: onClose,
    },
    {
      key: 'merge',
      Icon: ArrowsMerge,
      title: 'Merge as one transaction',
      subtitle: 'Total value of $ 1,414.21',
      onPress: onClose,
    },
    {
      key: 'delete',
      Icon: Trash,
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
              <CloseButton onPress={onClose} />
            </View>

            {actions.map(a => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                style={({pressed}) => [styles.row, pressed && {backgroundColor: tw.zinc[50]}]}>
                <View style={[styles.iconBox, a.danger && {backgroundColor: tw.red[50]}]}>
                  <a.Icon size={20} color={a.danger ? tw.red[600] : tw.zinc[700]} weight="regular" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.rowTitle, a.danger && {color: tw.red[600]}]}>{a.title}</Text>
                  <Text style={styles.rowSub}>{a.subtitle}</Text>
                </View>
                <CaretRight size={18} color={tw.zinc[400]} weight="bold" />
              </Pressable>
            ))}

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or,</Text>
              <View style={styles.orLine} />
            </View>

            <View style={styles.bottomRow}>
              <Pressable onPress={onClose} style={styles.circleBtn}>
                <CaretDoubleRight size={22} color={tw.blue[500]} weight="bold" />
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
        render: () => {
          const canCreate = folderName.trim().length > 0;
          const cancel = () => {
            Keyboard.dismiss();
            setStep('actions');
          };
          const create = () => {
            Keyboard.dismiss();
            onClose();
          };
          return (
            <Sheeting>
              <View style={styles.headerBlock}>
                <View style={{flex: 1}}>
                  <Text style={styles.title}>New folder</Text>
                  <Text style={styles.subtitle}>This creates a new folder</Text>
                </View>
                <CloseButton onPress={onClose} />
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={folderName}
                  onChangeText={setFolderName}
                  autoFocus
                  style={styles.input}
                />
                {folderName.length === 0 ? (
                  <View style={styles.placeholderOverlay} pointerEvents="none">
                    <Text style={styles.placeholderText}>Dubai trip, Subscriptions, Bills etc.</Text>
                    <Text style={styles.asterisk}>*</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.hint}>This is a hint text to help user.</Text>

              <View style={styles.folderBtnRow}>
                <Pressable onPress={cancel} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={canCreate ? create : undefined}
                  style={[styles.createBtn, canCreate && styles.createBtnOn]}>
                  <Text style={[styles.createText, canCreate && styles.createTextOn]}>
                    Create folder
                  </Text>
                </Pressable>
              </View>
            </Sheeting>
          );
        },
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

function CloseButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.closeBtn}>
      <X size={15} color={tw.zinc[500]} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerBlock: {flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 16},
  title: {fontFamily: font.semibold, fontSize: 18, color: tw.zinc[900]},
  subtitle: {fontFamily: font.regular, fontSize: 14, color: tw.zinc[500], marginTop: 2},
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: tw.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    backgroundColor: tw.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {fontFamily: font.semibold, fontSize: 16, color: tw.zinc[900]},
  rowSub: {fontFamily: font.regular, fontSize: 14, color: tw.zinc[500], marginTop: 1},
  orRow: {flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14},
  orLine: {flex: 1, height: 1, backgroundColor: tw.zinc[200]},
  orText: {fontFamily: font.regular, fontSize: 14, color: tw.zinc[400]},
  bottomRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: tw.blue[500],
    backgroundColor: tw.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: tw.blue[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {fontFamily: font.semibold, fontSize: 16, color: tw.blue[500]},
  inputWrap: {marginTop: 4, justifyContent: 'center'},
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: tw.blue[500],
    backgroundColor: tw.white,
    paddingHorizontal: 16,
    fontFamily: font.regular,
    fontSize: 16,
    color: tw.zinc[900],
  },
  placeholderOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderText: {fontFamily: font.regular, fontSize: 16, color: tw.zinc[400]},
  asterisk: {fontFamily: font.regular, fontSize: 16, color: tw.red[600], marginLeft: 1},
  hint: {fontFamily: font.regular, fontSize: 14, color: tw.zinc[500], marginTop: 8},
  folderBtnRow: {flexDirection: 'row', gap: 12, marginTop: 24},
  cancelBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: tw.zinc[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {fontFamily: font.semibold, fontSize: 16, color: tw.zinc[900]},
  createBtn: {
    flex: 1.6,
    height: 56,
    borderRadius: 28,
    backgroundColor: tw.blue[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnOn: {backgroundColor: tw.blue[500]},
  createText: {fontFamily: font.semibold, fontSize: 16, color: tw.blue[500]},
  createTextOn: {color: tw.white},
});
