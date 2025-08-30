import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();

  const SettingRow = ({ icon, title, onPress }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    onPress?: () => void;
  }) => (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center justify-between py-6 px-8 active:bg-gray-800/30"
    >
      <View className="flex-row items-center space-x-4">
        <Ionicons name={icon} size={22} color="#FFFFFF" />
        <Text className="text-white text-lg font-light">{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666666" />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      {/* Minimal Header */}
      <View className="flex-row items-center px-6 py-4">
        <Pressable 
          onPress={onBack}
          className="active:opacity-60"
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View className="items-center py-16 px-8">
          <View className="w-28 h-28 rounded-full bg-white/10 items-center justify-center mb-8">
            <Ionicons name="person" size={48} color="#FFFFFF" />
          </View>
          <Text className="text-3xl font-light text-white mb-2">Alex Rivera</Text>
          <Text className="text-gray-500 text-base">Songwriter</Text>
        </View>

        {/* Essential Settings */}
        <View className="px-8 py-8">
          <View className="space-y-0">
            <SettingRow 
              icon="volume-high-outline" 
              title="Audio" 
              onPress={() => {}} 
            />
            <View className="h-px bg-gray-800 mx-8" />
            
            <SettingRow 
              icon="color-palette-outline" 
              title="Theme" 
              onPress={() => {}} 
            />
            <View className="h-px bg-gray-800 mx-8" />
            
            <SettingRow 
              icon="share-outline" 
              title="Export" 
              onPress={() => {}} 
            />
            <View className="h-px bg-gray-800 mx-8" />
            
            <SettingRow 
              icon="information-circle-outline" 
              title="About" 
              onPress={() => {}} 
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}