import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// NOTE: Assuming useSafeAreaInsets is used if you want true control over bottom inset
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import necessary external components and constants
import Icon from './atoms/Icon'; // Assuming Icon path is correct
import { AppColors } from '../constants/theme'; // Assuming AppColors structure is correct
import { Tab, IconName } from '../types/navigation'; // Import shared types

interface NavItemProps {
  label: string;
  tab: Tab;
  isActive: boolean;
  onPress: (tab: Tab) => void;
}

/**
 * Individual navigation tab item (Icon + Label).
 */
const NavItem: React.FC<NavItemProps> = ({ label, tab, isActive, onPress }) => {
  const iconBaseName = tab.toLowerCase();
  const iconKey: IconName = `${iconBaseName}-${
    isActive ? 'active' : 'inactive'
  }` as IconName;

  // Assuming AppColors has 'active' and 'inactive' properties
  const color = isActive ? AppColors.active : AppColors.inactive;

  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={() => onPress(tab)}
      activeOpacity={0.7}
    >
      <Icon name={iconKey} width={30} height={30} />
      <Text style={[styles.navLabel, { color: color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

interface FooterNavProps {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}

/**
 * The fixed footer navigation bar.
 * Uses useSafeAreaInsets to ensure the bar sits correctly above the home indicator.
 */
export const FooterNav: React.FC<FooterNavProps> = ({
  activeTab,
  onTabPress,
}) => {
  // Get safe area insets (e.g., the height of the home indicator area)
  const insets = useSafeAreaInsets();

  const navItems = [
    { label: 'Home', tab: 'Home' as Tab },
    { label: 'Order', tab: 'Order' as Tab },
    { label: 'Reorder', tab: 'Reorder' as Tab },
    { label: 'More', tab: 'More' as Tab },
  ];

  return (
    // Apply position absolute to keep it fixed, and bottom padding for safe area
    <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
      {navItems.map(item => (
        <NavItem
          key={item.tab}
          label={item.label}
          tab={item.tab}
          isActive={activeTab === item.tab}
          onPress={onTabPress}
        />
      ))}
    </View>
  );
};

// Component-specific styles
// Footer Navigation Styles
const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
    borderWidth: 2,
    borderColor: AppColors.borderLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 110,
    // Add shadow/elevation for separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 10,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
