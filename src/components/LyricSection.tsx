import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLyricStore, Section } from '../state/lyricStore';
import { useState } from 'react';

interface LyricSectionProps {
  section: Section;
}

export function LyricSection({ section }: LyricSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const updateSection = useLyricStore(s => s.updateSection);
  const removeSection = useLyricStore(s => s.removeSection);

  return (
    <View className="mb-6">
      {/* Section Header */}
      <Pressable
        onPress={() => setIsCollapsed(!isCollapsed)}
        className="flex-row items-center justify-between mb-3"
      >
        <Text className="text-lg font-medium text-gray-900">
          {section.title || section.type}
        </Text>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => removeSection(section.id)}
            className="mr-3 p-1"
          >
            <Ionicons name="trash-outline" size={16} color="#6B7280" />
          </Pressable>
          <Ionicons
            name={isCollapsed ? "chevron-down" : "chevron-up"}
            size={20}
            color="#6B7280"
          />
        </View>
      </Pressable>

      {/* Section Content */}
      {!isCollapsed && (
        <TextInput
          multiline
          placeholder={`Write your ${section.type} here...`}
          value={section.content}
          onChangeText={(text) => updateSection(section.id, text)}
          className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px] text-base leading-6"
          style={{
            fontFamily: 'Georgia',
            textAlignVertical: 'top',
          }}
          placeholderTextColor="#9CA3AF"
        />
      )}
    </View>
  );
}