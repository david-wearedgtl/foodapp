import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Icon from './atoms/Icon.tsx';
import { AppColors } from '../constants/theme.ts';
import { useBasketContext } from '../context/BasketContext.tsx'; // <--- ADDED

// Get screen width for flexible sizing reference (optional, but helpful for responsiveness)
const screenWidth = Dimensions.get('window').width;

// Define the component's props
interface ToggleProps {
  // Defines the layout style: 'small' (70/30 split, horizontal) or 'large' (50/50 split, vertical)
  layout?: 'small' | 'large';
  // Optional props for displaying time in the 'large' layout
  deliveryTime?: string;
  collectionTime?: string;
}

// Define the size ratios based on the layout prop
const LAYOUT_RATIOS = {
  small: { ACTIVE: 0.7, INACTIVE: 0.3, HEIGHT: 20, FONT: 10, PADDING: 0 },
  large: { ACTIVE: 0.5, INACTIVE: 0.5, HEIGHT: 50, FONT: 12, PADDING: 0 },
};
export default function DeliveryCollectionToggle({
                                                   layout = 'small',
                                                   deliveryTime = '30-45 min',
                                                   collectionTime = '15-20 min'
                                                 }: ToggleProps) {

  const { isDelivery, toggleMode } = useBasketContext();
  const mode: 'delivery' | 'collection' = isDelivery ? 'delivery' : 'collection';

  // const initialWidth = layout === 'large' ? screenWidth * 0.8 : screenWidth * 0.45;
  // const [containerWidth, setContainerWidth] = useState(initialWidth);
  const [containerWidth, setContainerWidth] = useState(200);

  const { ACTIVE, INACTIVE, HEIGHT, FONT, PADDING } = LAYOUT_RATIOS[layout];

  const isDeliveryActive = mode === 'delivery';
  const isCollectionActive = mode === 'collection';

  const handleToggle = useCallback((newMode: 'delivery' | 'collection') => {
    // Only call context update if the mode is actually changing
    const newIsDelivery = newMode === 'delivery';
    if (newIsDelivery !== isDelivery) {
      toggleMode(newMode); // <--- Call context action
    }
  }, [isDelivery, toggleMode]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    // Capture the actual width of the parent View
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  // --- Dynamic Calculations based on Layout ---

  const activeButtonWidth = useMemo(() => containerWidth * ACTIVE - PADDING * 2, [containerWidth, ACTIVE, PADDING]);
  const inactiveButtonWidth = useMemo(() => containerWidth * INACTIVE, [containerWidth, INACTIVE]);

  const sliderPieceWidth = activeButtonWidth;

  const translateXDistance = useMemo(() => {
    if (layout === 'small') {
      // In small layout, active button moves across the smaller inactive width
      return isDeliveryActive ? PADDING : inactiveButtonWidth + PADDING;
    }
    // In large layout (50/50), the active button moves exactly half the container width
    return isDeliveryActive ? PADDING : sliderPieceWidth + PADDING * 2 + 1; // +1 for small gap due to padding logic
  }, [isDeliveryActive, inactiveButtonWidth, sliderPieceWidth, PADDING, layout]);


  // --- Helper View for the Button Content ---
  const ButtonContent = ({ type, isActive }: { type: 'delivery' | 'collection', isActive: boolean }) => {
    const iconName = type === 'delivery' ? 'delivery' : 'collection';
    const title = type === 'delivery' ? 'Delivery' : 'Pick Up';
    const time = type === 'delivery' ? deliveryTime : collectionTime;

    // Style for the main text (title)
    const titleStyle = [styles.textBase, { fontSize: FONT }, isActive ? styles.textActive : styles.textInactive];

    if (layout === 'large') {
      // Large layout: Icon, Title, Time (all centered vertically)
      return (
        <View style={styles.contentLarge}>
          <View style={styles.iconTitleRow}>
            <Icon name={`${iconName}-${isActive ? 'light' : 'dark'}`} width={24} height={24} />
          </View>
          <View style={styles.methodTimeRow}>
            <Text style={titleStyle}>{title}</Text>
            <Text style={[styles.timeText, isActive ? styles.timeTextActive : styles.timeTextInactive]}>
              {time}
            </Text>
          </View>
        </View>
      );
    }

    // Small layout: Icon and Title only
    return (
      <>
        <Icon name={`${iconName}-${isActive ? 'light' : 'dark'}`} width={14} height={14} />
        {isActive &&
          <Text style={titleStyle}>{title}</Text>
        }
      </>
    );
  };


  return (
    <View style={componentStyles.mainWrapper} onLayout={onLayout}>
      <View style={[styles.container, {
        width: '100%',
        height: HEIGHT,
        padding: PADDING,
      }]}>

        {/* Visual Slider/Track (Moves based on state) */}
        <View
          style={[
            styles.sliderTrack,
            {
              // Width must be the size of the active button
              width: sliderPieceWidth,
              // Position it based on active mode
              transform: [{ translateX: translateXDistance }],
              // Ensure height matches the container height minus padding
              height: HEIGHT - PADDING * 2,
            },
          ]}
        />

        {/* --- 1. Delivery Button (Left) --- */}
        <TouchableOpacity
          onPress={() => handleToggle('delivery')}
          style={[
            styles.button,
            // Dynamic width logic using percentages based on layout
            {
              width: `${isDeliveryActive ? ACTIVE * 100 : INACTIVE * 100}%`,
            }
          ]}
          activeOpacity={0.7}
        >
          <ButtonContent type="delivery" isActive={isDeliveryActive} />
        </TouchableOpacity>

        {/* --- 2. Collection Button (Right) --- */}
        <TouchableOpacity
          onPress={() => handleToggle('collection')}
          style={[
            styles.button,
            // Dynamic width logic using percentages based on layout
            {
              width: `${isCollectionActive ? ACTIVE * 100 : INACTIVE * 100}%`,
            }
          ]}
          activeOpacity={0.7}
        >
          <ButtonContent type="collection" isActive={isCollectionActive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLESHEETS ---

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 48,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    overflow: 'hidden',
  },
  sliderTrack: {
    position: 'absolute',
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  button: {
    // Buttons must stretch within the container's height
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentLarge: {
    // Style for the content wrapper when layout is 'large'
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 2,
  },
  methodTimeRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBase: {
    fontWeight: '700', // Made title text bolder
    textAlign: 'center',
    marginHorizontal: 4
  },
  textActive: {
    color: '#fff', // Text in active state (on top of sliderTrack) should be white
  },
  textInactive: {
    color: AppColors.secondary,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    width:'100%',
    textAlign: 'center',
  },
  timeTextActive: {
    color: AppColors.textWhite,
  },
  timeTextInactive: {
    color: AppColors.inactive,
  }
});

const componentStyles = StyleSheet.create({
  mainWrapper: {
    width: '100%',
    paddingVertical: 5,
    alignItems: 'center',
  },
});
