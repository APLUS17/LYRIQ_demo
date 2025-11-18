import React from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RhymeWord } from '../api/aiRhymeService';

interface RhymePopoverProps {
  visible: boolean;
  word: string;
  rhymes: RhymeWord[];
  loading: boolean;
  position?: { x: number; y: number };
  onClose: () => void;
  onSelectRhyme: (rhyme: string) => void;
}

export function RhymePopover({
  visible,
  word,
  rhymes,
  loading,
  position,
  onClose,
  onSelectRhyme,
}: RhymePopoverProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onClose}
      >
        <View
          className="absolute bg-[#2a2a2e] rounded-lg shadow-2xl border border-gray-700 min-w-[200px] max-w-[280px]"
          style={{
            top: position?.y || 100,
            left: position?.x || 20,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-3 border-b border-gray-700">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={16} color="#60A5FA" />
              <Text className="ml-2 text-sm font-semibold text-gray-200">
                Rhymes for "{word}"
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            className="max-h-[300px]"
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View className="p-4 items-center">
                <Text className="text-sm text-gray-400">Loading rhymes...</Text>
              </View>
            ) : rhymes.length === 0 ? (
              <View className="p-4 items-center">
                <Text className="text-sm text-gray-400">No rhymes found</Text>
              </View>
            ) : (
              <View className="p-2">
                {rhymes.map((rhyme, index) => (
                  <Pressable
                    key={`${rhyme.word}-${index}`}
                    onPress={() => {
                      onSelectRhyme(rhyme.word);
                      onClose();
                    }}
                    className="px-3 py-2.5 rounded-md active:bg-gray-700"
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? '#374151' : 'transparent',
                    })}
                  >
                    <Text className="text-base text-gray-200">
                      {rhyme.word}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer hint */}
          {!loading && rhymes.length > 0 && (
            <View className="px-3 py-2 border-t border-gray-700">
              <Text className="text-xs text-gray-500">
                Tap a word to insert
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}
