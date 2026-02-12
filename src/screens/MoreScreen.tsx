import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from '../components/atoms/Icon';
import { AppColors } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock AppColors structure (Replace with actual import from '../../constants/theme' in your project)
// const AppColors = {
//   inactive: '#6B7280',
//   backgroundCard: '#FFFFFF',
//   textDark: '#1F2937',
// };

/**
 * Screen 4: More
 */
export const MoreScreen: React.FC = () => {

  const {isLoggedIn, authToken, logout} = useAuthContext();
  // Initialize navigation hook
  const navigation = useNavigation();

  // Handler to navigate to the AuthScreen defined in the MoreStack
  const handleLoginRegisterPress = () => {
    if(!isLoggedIn){
      // @ts-ignore - Temporary ignore to avoid complex type definition for simplicity
      navigation.navigate('AuthScreen');
    } else {
      logout();
      Alert.alert('Logged out');
    }
  };

  const handleAddressesPress = () => {
    // @ts-ignore - Temporary ignore to avoid complex type definition for simplicity
    navigation.navigate('AddressesScreen');

  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Account</Text>
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.item} onPress={handleLoginRegisterPress}>
          <Icon name="account-circle" width={30} height={30} />
          <Text style={styles.itemText}>{isLoggedIn?'Logout':'Sign In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={handleAddressesPress}>
          <Icon name="pin-drop" width={30} height={30} />
          <Text style={styles.itemText}>Addresses</Text>
        </TouchableOpacity>
        <View style={styles.item}>
          <Icon name="credit-card-heart" width={30} height={30} />
          <Text style={styles.itemText}>Saved Cards</Text>
        </View>
        <View style={styles.item}>
          <Icon name="calendar-clock" width={30} height={30} />
          <Text style={styles.itemText}>Book a table</Text>
        </View>
        <View style={styles.item}>
          <Icon name="notification" width={30} height={30} />
          <Text style={styles.itemText}>Notifications</Text>
        </View>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.item}>
          <Icon name="info" width={30} height={30} />
          <Text style={styles.itemText}>About Us</Text>
        </View>
        <View style={styles.item}>
          <Icon name="call" width={30} height={30} />
          <Text style={styles.itemText}>Support</Text>
        </View>
        <View style={styles.item}>
          <Icon name="star-light" width={30} height={30} />
          <Text style={styles.itemText}>Rate App</Text>
        </View>
        <View style={styles.item}>
          <Icon name="info" width={30} height={30} />
          <Text style={styles.itemText}>Allergy information</Text>
        </View>
      </View>
      <View style={styles.itemContainer}>
        <View style={styles.item}>
          <Icon name="ellipse" width={30} height={30} />
          <Text style={styles.itemText}>More</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 16,
    padding: 24,
    marginBottom: 10,
    gap: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: 'column',
    gap: 16,
    borderColor: AppColors.borderMedium,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 16,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.inactive,
    marginBottom: 20,
  },
  content: {
    fontSize: 18,
    color: AppColors.textDark,
    lineHeight: 28,
  },
});
