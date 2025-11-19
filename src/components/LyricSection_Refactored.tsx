/**
 * LyricSection - Refactored with UI Components
 *
 * BEFORE: Manual View/Text/TextInput styling
 * AFTER: Using Card and Input UI components
 *
 * Benefits:
 * - Consistent card styling across app
 * - Less duplication
 * - Easier to update design
 */

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLyricStore, Section } from '../state/lyricStore';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';

interface LyricSectionProps {
  section: Section;
}

export function LyricSection({ section }: LyricSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const updateSection = useLyricStore(s => s.updateSection);
  const removeSection = useLyricStore(s => s.removeSection);

  return (
    <Card className="mb-4">
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <Button
            variant="ghost"
            onPress={() => setIsCollapsed(!isCollapsed)}
            className="flex-1 justify-start px-0"
          >
            <Text className="text-lg font-medium text-gray-200">
              {section.title || section.type}
            </Text>
            <Ionicons
              name={isCollapsed ? "chevron-down" : "chevron-up"}
              size={20}
              color="#6B7280"
              style={{ marginLeft: 'auto' }}
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onPress={() => removeSection(section.id)}
            className="ml-2"
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Button>
        </View>
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          <Textarea
            placeholder={`Write your ${section.type} here...`}
            value={section.content}
            onChangeText={(text) => updateSection(section.id, text)}
            className="font-georgia"
          />
        </CardContent>
      )}
    </Card>
  );
}
