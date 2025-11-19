import React from 'react';
import { Pressable, Text, View, ActivityIndicator, type PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';

interface ButtonProps extends PressableProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
}

const buttonVariants = {
  variant: {
    default: 'bg-[#FACC15]',
    destructive: 'bg-[#EF4444]',
    outline: 'border border-gray-700 bg-transparent',
    secondary: 'bg-[#2a2a2e]',
    ghost: 'bg-transparent',
    link: 'bg-transparent',
  },
  size: {
    default: 'px-4 py-3',
    sm: 'px-3 py-2',
    lg: 'px-6 py-4',
    icon: 'p-2',
  },
};

const textVariants = {
  variant: {
    default: 'text-black',
    destructive: 'text-white',
    outline: 'text-gray-200',
    secondary: 'text-gray-200',
    ghost: 'text-gray-200',
    link: 'text-[#60A5FA]',
  },
  size: {
    default: 'text-base',
    sm: 'text-sm',
    lg: 'text-lg',
    icon: 'text-base',
  },
};

export function Button({
  variant = 'default',
  size = 'default',
  children,
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      className={cn(
        'rounded-lg flex-row items-center justify-center active:opacity-80',
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        isDisabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {({ pressed }) => (
        <>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === 'default' ? '#000' : '#fff'}
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Ionicons
                  name={icon}
                  size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
                  color={textVariants.variant[variant].includes('black') ? '#000' : '#fff'}
                  style={{ marginRight: children ? 8 : 0 }}
                />
              )}
              {typeof children === 'string' ? (
                <Text
                  className={cn(
                    'font-medium',
                    textVariants.variant[variant],
                    textVariants.size[size]
                  )}
                >
                  {children}
                </Text>
              ) : (
                children
              )}
              {icon && iconPosition === 'right' && (
                <Ionicons
                  name={icon}
                  size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
                  color={textVariants.variant[variant].includes('black') ? '#000' : '#fff'}
                  style={{ marginLeft: children ? 8 : 0 }}
                />
              )}
            </>
          )}
        </>
      )}
    </Pressable>
  );
}
