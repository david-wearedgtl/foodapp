import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import AccountCircle from '../../assets/icons/account-circle.svg';
import BasketDark from '../../assets/icons/basket-dark.svg';
import BasketLight from '../../assets/icons/basket-light.svg';
import BookTable from '../../assets/icons/book-table.svg';
import CalendarClock from '../../assets/icons/calendar-clock.svg';
import Call from '../../assets/icons/call.svg';
import CollectionDark from '../../assets/icons/collection-dark.svg';
import CollectionLight from '../../assets/icons/collection-light.svg';
import CreditCard from '../../assets/icons/credit-card.svg';
import CreditCardHeart from '../../assets/icons/credit-card-heart.svg';
import DeliveryDark from '../../assets/icons/delivery-dark.svg';
import DeliveryLight from '../../assets/icons/delivery-light.svg';
import Ellipse from '../../assets/icons/ellipse.svg';
import Help from '../../assets/icons/help.svg';
import HomeActive from '../../assets/icons/home-active.svg';
import HomeInactive from '../../assets/icons/home-inactive.svg';
import Info from '../../assets/icons/info.svg';
import Minus from '../../assets/icons/minus.svg';
import MoreActive from '../../assets/icons/more-active.svg';
import MoreInactive from '../../assets/icons/more-inactive.svg';
import MoreDots from '../../assets/icons/more-dots.svg';
import Notification from '../../assets/icons/notification.svg';
import OrderActive from '../../assets/icons/order-active.svg';
import OrderInactive from '../../assets/icons/order-inactive.svg';
import Pin from '../../assets/icons/pin.svg';
import PinDrop from '../../assets/icons/pin-drop.svg';
import Plus from '../../assets/icons/plus.svg';
import ReorderActive from '../../assets/icons/reorder-active.svg';
import ReorderInactive from '../../assets/icons/reorder-inactive.svg';
import Search from '../../assets/icons/search.svg';
import Signin from '../../assets/icons/sign-in.svg';
import ReviewStar from '../../assets/icons/star.svg';
import StarLight from '../../assets/icons/star-light.svg';
import Tick from '../../assets/icons/tick.svg';
import X from '../../assets/icons/x.svg';
import { AppColors } from '../../constants/theme.ts';

export type IconName =
  | 'account-circle'
  | 'basket-dark'
  | 'basket-light'
  | 'book-table'
  | 'calendar-clock'
  | 'call'
  | 'collection-dark'
  | 'collection-light'
  | 'credit-card'
  | 'credit-card-heart'
  | 'delivery-dark'
  | 'delivery-light'
  | 'ellipse'
  | 'help'
  | 'home-active'
  | 'home-inactive'
  | 'info'
  | 'minus'
  | 'more-active'
  | 'more-inactive'
  | 'more-dots'
  | 'notification'
  | 'order-active'
  | 'order-inactive'
  | 'pin'
  | 'pin-drop'
  | 'plus'
  | 'reorder-active'
  | 'reorder-inactive'
  | 'search'
  | 'sign-in'
  | 'star'
  | 'star-light'
  | 'tick'
  | 'x'

// A map that links the icon name string to the actual imported SVG component
const IconMap = {
  'account-circle': AccountCircle,
  'basket-dark': BasketDark,
  'basket-light': BasketLight,
  'book-table': BookTable,
  'calendar-clock': CalendarClock,
  'call': Call,
  'collection-dark': CollectionDark,
  'collection-light': CollectionLight,
  'credit-card': CreditCard,
  'credit-card-heart': CreditCardHeart,
  'delivery-dark': DeliveryDark,
  'delivery-light': DeliveryLight,
  'ellipse': Ellipse,
  'help': Help,
  'home-active': HomeActive,
  'home-inactive': HomeInactive,
  'info': Info,
  'minus': Minus,
  'more-active' : MoreActive,
  'more-inactive': MoreInactive,
  'more-dots': MoreDots,
  'notification': Notification,
  'order-active': OrderActive,
  'order-inactive': OrderInactive,
  'pin': Pin,
  'pin-drop': PinDrop,
  'plus': Plus,
  'reorder-active': ReorderActive,
  'reorder-inactive': ReorderInactive,
  'search': Search,
  'sign-in': Signin,
  'star': ReviewStar,
  'star-light': StarLight,
  'tick': Tick,
  'x': X
};

// Define the props for the Icon component
interface IconProps {
  name: IconName;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A generic component to render an SVG icon dynamically.
 */
const Icon: React.FC<IconProps> = ({
                                     name,
                                     width = 24,
                                     height = 24,
                                     style
                                   }) => {
  // Get the correct component from the map
  const SvgComponent = IconMap[name as keyof typeof IconMap];

  if (!SvgComponent) {
    console.warn(`Icon "${name}" not found in IconMap.`);
    return null;
  }

  return (
    <View style={[styles.container, style, { width, height }]}>
      <SvgComponent
        width={width}
        height={height}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Icon;