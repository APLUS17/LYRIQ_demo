/**
 * RhymePopover - Refactored with UI Components
 *
 * BEFORE: 90+ lines of custom modal code
 * AFTER: ~40 lines using standardized Dialog component
 *
 * Benefits:
 * - Consistent animations and styling
 * - Less code to maintain
 * - Built-in accessibility
 * - Easier to read and understand
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RhymeWord } from '../api/aiRhymeService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';

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
  onClose,
  onSelectRhyme,
}: RhymePopoverProps) {
  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={18} color="#60A5FA" />
            <DialogTitle className="ml-2">
              Rhymes for "{word}"
            </DialogTitle>
          </View>
        </DialogHeader>

        {/* Content */}
        <View className="min-h-[120px]">
          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text className="text-sm text-gray-400 mt-3">
                Finding rhymes...
              </Text>
            </View>
          ) : rhymes.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="search-outline" size={32} color="#6B7280" />
              <Text className="text-sm text-gray-400 mt-3">
                No rhymes found
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {rhymes.map((rhyme, index) => (
                <Button
                  key={`${rhyme.word}-${index}`}
                  variant="ghost"
                  onPress={() => {
                    onSelectRhyme(rhyme.word);
                    onClose();
                  }}
                  className="justify-start"
                >
                  <Text className="text-base text-gray-200">
                    {rhyme.word}
                  </Text>
                </Button>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        {!loading && rhymes.length > 0 && (
          <DialogFooter>
            <Text className="text-xs text-gray-500">
              Tap a word to insert
            </Text>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
