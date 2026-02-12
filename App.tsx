import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// Import all providers
import { ProductProvider } from './src/context/ProductContext';
import { BasketProvider } from './src/context/BasketContext';
import { AuthProvider } from './src/context/AuthContext';

import { AppColors } from './src/constants/theme.ts';
import AppNavigator from './src/AppNavigator.tsx';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomerProvider } from './src/context/CustomerContext.tsx';
import { BusinessProvider } from './src/context/BusinessContext.tsx';

// --- 4. APPLICATION ROOT ---

export default function App() {
  return (
    // SafeAreaView handles notches and status bars correctly
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.gestureHandlerContainer}>
        <BusinessProvider>
          <AuthProvider>
            <CustomerProvider>
              {/* These two are now "Children" of Business, so they can see the selected ID */}
              <BasketProvider>
                <ProductProvider>
                  <View style={styles.mainContainer}>
                    <AppNavigator />
                  </View>
                </ProductProvider>
              </BasketProvider>
            </CustomerProvider>
          </AuthProvider>
        </BusinessProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gestureHandlerContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1, // Crucial: ensures the container takes the full screen height
    backgroundColor: AppColors.backgroundDefault,
  },
  contentScrollView: {
    // flex: 1,
    paddingHorizontal: 0,
  },
  contentHeader: {
    // paddingVertical: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  scrollableItem: {
    // paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    color: '#374151',
    fontSize: 16,
  },
});
