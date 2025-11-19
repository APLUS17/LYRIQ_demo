import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { cn } from '../utils/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={() => onOpenChange(false)}
      statusBarTranslucent
    >
      {children}
    </Modal>
  );
}

export function DialogContent({
  children,
  className,
  showClose = true,
}: DialogContentProps) {
  return (
    <>
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="flex-1 bg-black/50"
      />

      {/* Content */}
      <Animated.View
        entering={SlideInDown.duration(300).springify()}
        exiting={SlideOutDown.duration(200)}
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-[#2a2a2e] rounded-t-2xl border-t border-gray-700 max-h-[90%]',
          className
        )}
      >
        {/* Drag Handle */}
        <View className="items-center py-3">
          <View className="w-12 h-1 bg-gray-600 rounded-full" />
        </View>

        <ScrollView
          className="px-6 pb-6"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </>
  );
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <View className={cn('mb-4 pb-4 border-b border-gray-700', className)}>
      {children}
    </View>
  );
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <Text
      className={cn(
        'text-xl font-semibold text-gray-200',
        className
      )}
    >
      {children}
    </Text>
  );
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <Text className={cn('text-sm text-gray-400 mt-2', className)}>
      {children}
    </Text>
  );
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <View className={cn('mt-6 pt-4 border-t border-gray-700', className)}>
      {children}
    </View>
  );
}
