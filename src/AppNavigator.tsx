import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon, { IconName } from './components/atoms/Icon';
import { enableScreens } from 'react-native-screens';
import { Address } from './model/interfaces';

// 1. Import all screens (including the new CheckoutScreen)
import AuthScreen from './screens/Auth/LoginRegister';
import AddressesScreen from './screens/AddressesScreen';
import AddressFormScreen from './screens/AddressFormScreen';
import { DirectoryScreen } from './screens/DirectoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MoreScreen } from './screens/MoreScreen';
import { OrderScreen } from './screens/OrderScreen';
import { ReorderScreen } from './screens/ReorderScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';

export type RootStackParamList = {
  Directory: undefined;
  MainTabs: { businessId: number };
  Checkout: undefined;
  AddressFormScreen: AddressFormParams;
};

export type AddressFormParams = {
  address?: Address;
  type: 'shipping' | 'billing';
  isEdit: boolean;
};

export type MoreStackParamList = {
  MoreTab: undefined; // Entry point for the tab
  AuthScreen: undefined;
  AddressesScreen: undefined;
  AddressFormScreen: AddressFormParams;
};

// 2. Create Navigator Instances
const Tab = createBottomTabNavigator();
const MoreStack = createStackNavigator<MoreStackParamList>(); // Stack for the 'More' tab
const RootStack = createStackNavigator<RootStackParamList>(); // <-- Root Stack to wrap the whole app

// --- 3. Stacks for Tab Content (The "More" Tab) ---
const MoreStackScreen = () => {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      {/* The entry point for the "More" tab */}
      <MoreStack.Screen name="MoreTab" component={MoreScreen} />

      {/* The screens we navigate to from MoreScreen */}
      <MoreStack.Screen name="AuthScreen" component={AuthScreen} />
      <MoreStack.Screen name="AddressesScreen" component={AddressesScreen} />
      <MoreStack.Screen name="AddressFormScreen" component={AddressFormScreen} />

    </MoreStack.Navigator>
  );
};


// --- 4. Main Tab Navigator (The visible footer) ---
// This is now wrapped in RootStack
const TabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        safeAreaInsets: {
          top: 0, // Top inset is 0 here because React Navigation handles the top of the screen content by default, but we'll ensure it does in the next step.
          bottom: 0, // This is crucial. Setting to 0 prevents the *screen content* from pushing up further, relying on the tab bar itself to handle its position.
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: IconName = 'home-inactive';

          if (route.name === 'Home') {
            iconName = focused ? 'home-active' : 'home-inactive';
          } else if (route.name === 'Order') {
            iconName = focused ? 'order-active' : 'order-inactive';
          } else if (route.name === 'Reorder') {
            iconName = focused ? 'reorder-active' : 'reorder-inactive';
          } else if (route.name === 'More') {
            iconName = focused ? 'ellipse' : 'ellipse';
          }

          // You can return any component that you like here!
          return <Icon name={iconName} width={size} height={size} />;
        },
        tabBarActiveTintColor: '#007AFF', // Example Active Blue
        tabBarInactiveTintColor: '#6B7280', // Example Inactive Gray
        headerShown: false, // Hide stack header by default

      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />

      <Tab.Screen
        name="Order"
        component={OrderScreen}
        options={{ title: 'Order' }}
      />

      <Tab.Screen
        name="Reorder"
        component={ReorderScreen}
        options={{ title: 'Reorder' }}
      />

      <Tab.Screen
        name="More"
        component={MoreStackScreen}
      />

    </Tab.Navigator>
  );
};


// --- 5. Root Navigator (Final Export) ---
export default function AppNavigator() {
  enableScreens();
  const initialRoute = "Directory";
  return (
    <NavigationContainer>
      {/* The root stack handles screens that float above the tab bar (like Checkout) */}
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}>

        {/* Initial Directory Screen */}
        <RootStack.Screen name="Directory" component={DirectoryScreen} />

        {/* MainTabs is the entire tab bar setup */}
        <RootStack.Screen name="MainTabs" component={TabNavigator} />

        {/* Checkout screen floats above the MainTabs, hiding the footer */}
        <RootStack.Screen name="Checkout" component={CheckoutScreen} />

        {/* Add navigation to Address from the basket modal */}
        <RootStack.Screen name="AddressFormScreen" component={AddressFormScreen} />

      </RootStack.Navigator>
    </NavigationContainer>
  );
}
