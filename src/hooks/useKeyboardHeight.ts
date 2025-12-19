import { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Keyboard, Platform, LayoutAnimation, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UseKeyboardHeightOptions {
  bottomInset?: number;
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
}

interface UseKeyboardHeightReturn {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  animatedKeyboardHeight: Animated.Value;
}

/**
 * Custom hook for handling keyboard height with improved animation
 * Uses LayoutAnimation for smoother transitions when possible
 *
 * For optimal native-driver animations, consider using:
 * - react-native-keyboard-controller (Reanimated-based)
 * - react-native-reanimated with keyboard worklets
 *
 * This hook provides a simpler approach that works without additional dependencies
 */
export const useKeyboardHeight = ({
  bottomInset = 0,
  onKeyboardShow,
  onKeyboardHide,
}: UseKeyboardHeightOptions = {}): UseKeyboardHeightReturn => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const animatedKeyboardHeight = useRef(new Animated.Value(0)).current;

  // Debounce ref to prevent rapid updates
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyboardShow = useCallback((e: { endCoordinates: { height: number } }) => {
    const height = e.endCoordinates.height - bottomInset;

    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Use LayoutAnimation for smooth layout changes
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setKeyboardHeight(height);
    setIsKeyboardVisible(true);

    // Animate the value for components that need it
    // Note: useNativeDriver: false is required for height animations
    // For better performance, use react-native-reanimated
    Animated.timing(animatedKeyboardHeight, {
      toValue: height,
      duration: Platform.OS === 'ios' ? 250 : 150,
      useNativeDriver: false,
    }).start();

    onKeyboardShow?.();
  }, [animatedKeyboardHeight, bottomInset, onKeyboardShow]);

  const handleKeyboardHide = useCallback(() => {
    // Clear any pending updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Use LayoutAnimation for smooth layout changes
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setKeyboardHeight(0);
    setIsKeyboardVisible(false);

    Animated.timing(animatedKeyboardHeight, {
      toValue: 0,
      duration: Platform.OS === 'ios' ? 250 : 150,
      useNativeDriver: false,
    }).start();

    onKeyboardHide?.();
  }, [animatedKeyboardHeight, onKeyboardHide]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [handleKeyboardShow, handleKeyboardHide]);

  return {
    keyboardHeight,
    isKeyboardVisible,
    animatedKeyboardHeight,
  };
};

export default useKeyboardHeight;
