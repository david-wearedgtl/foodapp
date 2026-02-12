import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BusinessSlider from '../components/BusinessSlider';
import { AppColors } from '../constants/theme';
import { useBusiness } from '../context/BusinessContext.tsx';
import { Business } from '../model/interfaces.ts';

export const DirectoryScreen = ({ navigation }: any) => {

  const { activeBusiness, setBusiness } = useBusiness();

  const handleBusinessSelect = (business: Business) => {

    setBusiness(business);
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Deliver to:</Text>
        {/* PLACEHOLDER FOR LOCATION SELECTOR */}
        <View style={styles.locationPlaceholder}>
          <Text style={styles.locationText}>Enter your address...</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>What are you craving?</Text>

        {/* The Business Listing with Cuisine Filters */}
        <BusinessSlider
          onBusinessSelect={handleBusinessSelect}
          selectedBusinessId={activeBusiness?.id || null}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  welcomeText: { fontSize: 14, color: '#666' },
  locationPlaceholder: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  locationText: { color: AppColors.primary, fontWeight: '600' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }
});