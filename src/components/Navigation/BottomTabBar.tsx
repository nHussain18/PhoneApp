import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionService } from '../../services/ActionService';
import { useLanguage } from '../../services/LanguageContext';
import { AppIcon } from '../Common/AppIcon';

export type BottomTabType = 'RECENTS' | 'KEYPAD' | 'CONTACTS';

interface BottomTabBarProps {
  activeTab: BottomTabType;
  onTabChange: (tab: BottomTabType) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const handleTabPress = (tab: BottomTabType) => {
    ActionService.triggerHaptic('selection');
    onTabChange(tab);
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(10, insets.bottom),
          height: 60 + Math.max(10, insets.bottom),
        },
      ]}
    >
      {/* 1. Recents Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('RECENTS')}
        activeOpacity={0.7}
      >
        <AppIcon
          name={activeTab === 'RECENTS' ? 'time' : 'time-outline'}
          size={24}
          color={activeTab === 'RECENTS' ? '#2563EB' : '#94A3B8'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'RECENTS' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {t('recents')}
        </Text>
      </TouchableOpacity>

      {/* 2. Keypad / Dialer Tab (Center) */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('KEYPAD')}
        activeOpacity={0.7}
      >
        <AppIcon
          name={activeTab === 'KEYPAD' ? 'keypad' : 'keypad-outline'}
          size={24}
          color={activeTab === 'KEYPAD' ? '#2563EB' : '#94A3B8'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'KEYPAD' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {t('keypad')}
        </Text>
      </TouchableOpacity>

      {/* 3. Contacts Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress('CONTACTS')}
        activeOpacity={0.7}
      >
        <AppIcon
          name={activeTab === 'CONTACTS' ? 'people' : 'people-outline'}
          size={24}
          color={activeTab === 'CONTACTS' ? '#2563EB' : '#94A3B8'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'CONTACTS' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {t('contacts')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
    zIndex: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#94A3B8',
  },
});
