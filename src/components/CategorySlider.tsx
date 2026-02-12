import React, { useState, useEffect } from 'react';
// Core React Native components must be explicitly imported
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';

// Import the external API service and the necessary types
import { useApiService } from '../services/apiService';
import { Categories, Category } from '../model/interfaces';
import { AppColors } from '../constants/theme.ts';

// Extract the nested Category type from the Categories interface for use in state
// type Category = Categories['categories'][number];

// ----------------------------------------------------------------------
interface CategorySliderProps {
  onCategorySelect: (categoryId: number | null) => void;
  selectedCategoryId: number | null;
}
/**
 * Category Slider COMPONENT
 * Handles fetching categories using the apiService and managing the dropdown state.
 */
export default function CategorySlider({ onCategorySelect, selectedCategoryId }: CategorySliderProps) {

  const { getCategories } = useApiService();

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 1. DATA FETCHING (Using apiService.getCategories) ---
  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadCategories = async () => {
      try {
        const data: Categories = await getCategories();

        //Remove uncategorized category
        const filteredCategories = data.filter(
          (category) => category.name !== 'Uncategorized'
        );

        setCategories(filteredCategories);

      } catch (e) {
        // Error handling now uses the exception thrown by the apiService request wrapper
        const errorMessage = (e as Error).message || 'Failed to fetch categories via API Service.';
        console.error("Failed to fetch categories:", e);
        setError(errorMessage);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();

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
        <Text style={componentStyles.secondaryText}>Loading categories...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={[componentStyles.noDataContainer]}>
        <Text style={componentStyles.secondaryText}>No categories found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false} // Hides the scrollbar
      contentContainerStyle={componentStyles.contentContainer} // Apply padding to the scroll content
    >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => onCategorySelect(category.id)} // Call the prop function
            // style={({ pressed }) => [
            //   componentStyles.categoryButton, // Base style for padding/margin
            //   selectedCategoryId === category.id && componentStyles.selectedCategoryButton, // Highlight selected
            //   pressed && { opacity: 0.7 }, // Pressed state feedback
            // ]}
          >
          <Text style={styles.categoryText} key={category.id}>{category.name}</Text>
          </TouchableOpacity>
        ))}
    </ScrollView>
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
  categoryText: {
    color: AppColors.textWhite,
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
});

// --- COMPONENT SUPPORT STYLESHEET ---
const componentStyles = StyleSheet.create({
  mainWrapper: {
    // Wrapper for the entire component's UI, centered
    alignItems: 'center',
    paddingVertical: 20,
  },
  contentContainer: {
    marginLeft:24
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
