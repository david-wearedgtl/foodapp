import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBusiness } from '../context/BusinessContext';
import AddressSelect from '../components/AddressSelect';
import DeliveryCollectionToggle from '../components/DeliveryCollectionToggle';
import { AppColors} from '../constants/theme.ts';
import Icon from '../components/atoms/Icon.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Screen 1: Home
 */
export const HomeScreen: React.FC = () => {

  const navigation = useNavigation();
  const { activeBusiness } = useBusiness();

  const fallbackImage = require('../assets/images/home.jpg');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topNav}>
        <Pressable onPress={() => navigation.navigate('Directory')}>
          <Icon name="x" width={24} height={24} />
          <Text style={styles.backLink}>Change Restaurant</Text>
        </Pressable>
      </View>
      <View style={styles.addressDeliveryContainer}>
        <View style={styles.addressSelect}>
          <AddressSelect />
        </View>
        <View style={styles.deliverySelect}>
          <DeliveryCollectionToggle />
        </View>
      </View>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            // Use business cover_image, otherwise use the fallback
            source={activeBusiness?.cover_image
              ? { uri: activeBusiness.cover_image }
              : fallbackImage
            }
            style={styles.imageStyle}
            resizeMode="cover"
          />
        </View>
        <View style={styles.homeContentContainer}>
        <View style={styles.reviewContainer}>
          <View style={styles.reviews}>
            <Icon name={'star'} width={16} height={16} />
            <Text style={styles.reviewText}>1,245 reviews</Text>
          </View>
          <View><Pressable><Text>See all</Text></Pressable></View>
        </View>
        <Text style={styles.title}>{ activeBusiness?.name }</Text>
        <Text style={styles.content}>{ activeBusiness?.description ? activeBusiness?.description : 'Test'}</Text>
        <View style={styles.ctaContainer}>
          <Pressable style={[styles.button, {backgroundColor: AppColors.natural}]}><Text style={styles.buttonText}>Skip Tour</Text></Pressable>
          <Pressable style={[styles.button, {backgroundColor: AppColors.primary}]}><Text style={styles.buttonText}>Get Started</Text></Pressable>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backLink: {
    marginLeft: 8,
    color: AppColors.primary,
    fontWeight: '600'
  },
  container: {
    flex: 1,
    borderRadius: 16,
    padding: 0
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageStyle: {
    // Must define explicit dimensions for local/Base64 images
    width: '100%',
    height: 275,
    marginRight: 8,
  },
  addressDeliveryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Add horizontal padding to the row container
    marginBottom: 8,
  },
  addressSelect: {
    width: '55%',
  },
  deliverySelect: {
    width: '43%',
    marginLeft: '2%',
  },
  homeContentContainer: {
    marginLeft: 16,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 8,
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
  reviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  reviews: {
    flexDirection: 'row',
  },
  reviewText:{
    marginLeft: 8
  },
  ctaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop:16
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: 165,
    borderRadius: 40,

  },
  buttonText: {
    color: AppColors.textWhite,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  }
});
