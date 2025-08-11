import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide: () => void;
}

export default function Toast({ 
  visible, 
  message, 
  type = 'success', 
  duration = 3000,
  onHide 
}: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible) {
      // Show animation
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });

      // Auto-hide after duration
      const timeoutId = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timeoutId);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(-100, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 200 }, () => {
      runOnJS(onHide)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#059669', icon: 'checkmark-circle' as const };
      case 'error':
        return { backgroundColor: '#DC2626', icon: 'close-circle' as const };
      case 'info':
        return { backgroundColor: '#2563EB', icon: 'information-circle' as const };
      default:
        return { backgroundColor: '#059669', icon: 'checkmark-circle' as const };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 60,
          left: 20,
          right: 20,
          zIndex: 1000,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 12,
          backgroundColor: toastStyle.backgroundColor,
        },
        animatedStyle,
      ]}
    >
      <Ionicons name={toastStyle.icon} size={20} color="white" />
      <Text className="text-white font-medium ml-3 flex-1" numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}