import React from 'react';
import { TextInput, type TextInputProps, View, Text } from 'react-native';
import { cn } from '../utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-300 mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={cn(
          'bg-[#1c1c1e] border border-gray-700 rounded-lg px-4 py-3 text-gray-200 text-base',
          'focus:border-[#FACC15]',
          error && 'border-[#EF4444]',
          className
        )}
        placeholderTextColor="#6B7280"
        {...props}
      />
      {error && (
        <Text className="text-sm text-[#EF4444] mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: TextareaProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-300 mb-2">
          {label}
        </Text>
      )}
      <TextInput
        multiline
        className={cn(
          'bg-[#1c1c1e] border border-gray-700 rounded-lg px-4 py-3 text-gray-200 text-base min-h-[100px]',
          'focus:border-[#FACC15]',
          error && 'border-[#EF4444]',
          className
        )}
        style={{ textAlignVertical: 'top' }}
        placeholderTextColor="#6B7280"
        {...props}
      />
      {error && (
        <Text className="text-sm text-[#EF4444] mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
