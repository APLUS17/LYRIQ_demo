import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../utils/cn';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'bg-[#2a2a2e] rounded-lg border border-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <View className={cn('p-4 pb-3', className)}>
      {children}
    </View>
  );
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <View className={cn('', className)}>
      {children}
    </View>
  );
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <View className={cn('p-4 pt-0', className)}>
      {children}
    </View>
  );
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <View className={cn('p-4 pt-0 flex-row items-center', className)}>
      {children}
    </View>
  );
}
