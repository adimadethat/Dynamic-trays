import React, {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RefuelFlow} from './src/flows/RefuelFlow';
import {OptionsFlow} from './src/flows/OptionsFlow';
import {CreateFolderFlow} from './src/flows/CreateFolderFlow';
import {theme} from './src/tray/theme';

const SETTINGS = [
  'Address Book',
  'Preferences',
  'Browser Settings',
  'Chat Settings',
  'Backups & Security',
  'Notifications',
];

export default function App() {
  const [refuel, setRefuel] = useState(false);
  const [options, setOptions] = useState(false);
  const [folder, setFolder] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDEDF0" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Your Family</Text>
        <Text style={styles.sub}>Dynamic trays — built from scratch, zero animation libraries.</Text>

        <View style={styles.launchers}>
          <TouchableOpacity style={styles.launch} onPress={() => setRefuel(true)}>
            <Text style={styles.launchTitle}>⚡ Refuel Gas</Text>
            <Text style={styles.launchSub}>Forward flow · height morph + push cross-fade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.launch} onPress={() => setOptions(true)}>
            <Text style={styles.launchTitle}>🔑 Wallet Options</Text>
            <Text style={styles.launchSub}>Info reveal · symmetric cross-dissolve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.launch} onPress={() => setFolder(true)}>
            <Text style={styles.launchTitle}>🗂 Create new folder</Text>
            <Text style={styles.launchSub}>SOT action sheet · morphs to a naming step</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {SETTINGS.map(s => (
            <View key={s} style={styles.settingRow}>
              <View style={styles.settingDot} />
              <Text style={styles.settingLabel}>{s}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <RefuelFlow visible={refuel} onClose={() => setRefuel(false)} />
      <OptionsFlow visible={options} onClose={() => setOptions(false)} />
      <CreateFolderFlow visible={folder} onClose={() => setFolder(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#EDEDF0'},
  scroll: {padding: theme.space(5), paddingTop: theme.space(6)},
  h1: {fontSize: 30, fontWeight: '800', color: theme.color.text},
  sub: {fontSize: 14, color: theme.color.textDim, marginTop: theme.space(2), marginBottom: theme.space(5)},
  launchers: {gap: theme.space(3), marginBottom: theme.space(6)},
  launch: {
    backgroundColor: '#fff',
    borderRadius: theme.radius.card,
    padding: theme.space(4),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  launchTitle: {fontSize: 17, fontWeight: '700', color: theme.color.text},
  launchSub: {fontSize: 13, color: theme.color.textDim, marginTop: 2},
  card: {
    backgroundColor: '#fff',
    borderRadius: theme.radius.card,
    paddingHorizontal: theme.space(4),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
    gap: theme.space(3),
  },
  settingDot: {width: 22, height: 22, borderRadius: 11, backgroundColor: theme.color.surface},
  settingLabel: {fontSize: 16, color: theme.color.text, fontWeight: '500'},
  chevron: {marginLeft: 'auto', fontSize: 20, color: theme.color.textDim},
});
