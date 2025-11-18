import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAvailableProviders, AIProvider } from '../api/aiRhymeService';

const providerInfo: Record<AIProvider, { name: string; icon: string; color: string }> = {
  gemini: { name: 'Gemini', icon: 'sparkles', color: '#60A5FA' },
  openai: { name: 'OpenAI', icon: 'bulb', color: '#10B981' },
  anthropic: { name: 'Claude', icon: 'cube', color: '#8B5CF6' },
  grok: { name: 'Grok', icon: 'flash', color: '#F59E0B' },
};

interface AIProviderStatusProps {
  className?: string;
  compact?: boolean;
}

export function AIProviderStatus({ className = '', compact = false }: AIProviderStatusProps) {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    return (
      <View className={`bg-gray-800 rounded-lg p-3 ${className}`}>
        <View className="flex-row items-center">
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text className="ml-2 text-sm text-gray-300">
            No AI providers configured
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          Add API keys to .env to enable AI features
        </Text>
      </View>
    );
  }

  if (compact) {
    const primary = availableProviders[0];
    const info = providerInfo[primary];
    return (
      <View className={`flex-row items-center ${className}`}>
        <Ionicons name={info.icon as any} size={14} color={info.color} />
        <Text className="ml-1 text-xs text-gray-400">
          {info.name}
        </Text>
        {availableProviders.length > 1 && (
          <Text className="ml-1 text-xs text-gray-500">
            +{availableProviders.length - 1}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className={`bg-gray-800 rounded-lg p-3 ${className}`}>
      <View className="flex-row items-center mb-2">
        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
        <Text className="ml-2 text-sm font-medium text-gray-200">
          AI Providers Active
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {availableProviders.map((provider) => {
          const info = providerInfo[provider];
          return (
            <View
              key={provider}
              className="flex-row items-center bg-gray-700 px-2 py-1 rounded-full"
            >
              <Ionicons name={info.icon as any} size={12} color={info.color} />
              <Text className="ml-1 text-xs text-gray-300">{info.name}</Text>
            </View>
          );
        })}
      </View>
      <Text className="text-xs text-gray-500 mt-2">
        Primary: {providerInfo[availableProviders[0]].name}
      </Text>
    </View>
  );
}
