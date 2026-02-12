import React, { useState, useEffect } from 'react';
// Core React Native components must be explicitly imported
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  FlatList,
} from 'react-native';

// Import the external API service and the necessary types
import { useApiService } from '../services/apiService';
import { Businesses, Business } from '../model/interfaces';
import { AppColors } from '../constants/theme.ts';

interface BusinessSliderProps {
  onBusinessSelect: (business: Business) => void;
  selectedBusinessId: number | null;
}

/**
 * Business Slider COMPONENT
 * Handles fetching businesses using the apiService and rendering the slider.
 */
export default function BusinessSlider({ onBusinessSelect, selectedBusinessId }: BusinessSliderProps) {

  const { getBusinesses } = useApiService();

  // Data State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const filteredBusinesses = selectedCategory === 'All'
    ? businesses
    : businesses.filter(b => b.cuisines.includes(selectedCategory));

  // --- 1. DATA FETCHING (Using apiService.getCategories) ---
  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadBusinesses = async () => {
      try {
        const data: Businesses = await getBusinesses();

        setBusinesses(data);

      } catch (e) {
        // Error handling now uses the exception thrown by the apiService request wrapper
        const errorMessage = (e as Error).message || 'Failed to fetch businesses via API Service.';
        console.error("Failed to fetch businesses:", e);
        setError(errorMessage);
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();

  }, []);

  // --- RENDERING LOGIC ---
  if (error) {
    return (
      <View style={[componentStyles.errorContainer]}>
        <Text style={componentStyles.errorText}>API Error: {error}</Text>
        <Text style={componentStyles.secondaryText}>Check your network or WordPress API settings.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[componentStyles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={componentStyles.secondaryText}>Loading businesses...</Text>
      </View>
    );
  }

  if (businesses.length === 0) {
    return (
      <View style={[componentStyles.noDataContainer]}>
        <Text style={componentStyles.secondaryText}>No businesses found</Text>
      </View>
    );
  }

  const uniqueCuisines = [
    'All',
    ...new Set(businesses.flatMap(b => b.cuisines))
  ];

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(item)}
      style={[
        styles.filterItem,
        selectedCategory === item && styles.filterItemActive
      ]}
    >
      <Text style={[
        styles.filterText,
        selectedCategory === item && styles.filterTextActive
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={uniqueCuisines}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item}
        style={styles.filterBar}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      />
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={componentStyles.contentContainer}
    >
      {filteredBusinesses.map((business) => (
        <TouchableOpacity
          key={business.id}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => onBusinessSelect(business)}
        >
          {/* 1. Cover Image with Badge Overlay */}
          <ImageBackground
            source={{ uri: business.cover_image }}
            style={styles.coverImage}
            imageStyle={{ borderRadius: 12 }} // Rounds the image itself
          >
            {business.primary_badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{business.primary_badge}</Text>
              </View>
            )}

            {/* Optional: Verified Checkmark overlay */}
            {business.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={{fontSize: 10}}>✔️</Text>
              </View>
            )}
          </ImageBackground>

          {/* 2. Business Info underneath */}
          <View style={styles.infoContainer}>
            <Text style={styles.businessName} numberOfLines={1}>
              {business.name}
            </Text>
            <Text style={styles.cuisineList} numberOfLines={1}>
              {business.cuisines.join(' • ')}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
    </>
  );
}

// --- DROPDOWN STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    marginBottom: 0,
    width: '100%',
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF'
  },
  triggerText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  businessText: {
    color: AppColors.textDark,
    fontSize: 10,
    fontWeight: '600',
    marginRight: 20
  },
  placeholderText: {
    color: AppColors.textMedium,
  },
  icon: {
    fontSize: 14,
    color: AppColors.textDark,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  optionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 220,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 4,
  },
  optionsScrollView: {
    flexGrow: 1,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#F3F4F6', // Slight highlight for the currently selected item in the dropdown list
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  //Styling for the Business Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },
  coverImage: {
    width: '100%',
    height: 160,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: '#ff5a5f', // Your brand color
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    margin: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  infoContainer: {
    padding: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cuisineList: {
    fontSize: 14,
    color: '#777',
  },
  //styling for the filter bar
  filterBar: {
    marginVertical: 15,
    maxHeight: 50,
  },
  filterItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterItemActive: {
    backgroundColor: '#ff5a5f', // Your brand color
    borderColor: '#ff5a5f',
  },
  filterText: {
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
});

// --- COMPONENT SUPPORT STYLESHEET ---
const componentStyles = StyleSheet.create({
  mainWrapper: {
    // Wrapper for the entire component's UI, centered
    alignItems: 'center',
    paddingVertical: 20,
  },
  contentContainer: {
    marginLeft:0
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'left',
  },
  resultCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#0EA5E9',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 5,
  },
  resultValue: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    fontWeight: '600',
  },
  noDataContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
  },
  secondaryText: {
    marginTop: 5,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  userIdText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
  }
});
