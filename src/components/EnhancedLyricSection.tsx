import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLyricStore, Section } from '../state/lyricStore';
import { SyllableDisplay, SyllableStats } from './SyllableDisplay';
import { RhymePopover } from './RhymePopover';
import { getRhymeSuggestions, RhymeWord } from '../api/aiRhymeService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH / 3.5;

interface EnhancedLyricSectionProps {
  section: Section;
  index: number;
}

export function EnhancedLyricSection({ section, index }: EnhancedLyricSectionProps) {
  const viewMode = useLyricStore(s => s.viewMode);
  const syllableCountEnabled = useLyricStore(s => s.syllableCountEnabled);
  const updateSection = useLyricStore(s => s.updateSection);
  const updateSectionTitle = useLyricStore(s => s.updateSectionTitle);
  const removeSection = useLyricStore(s => s.removeSection);
  const toggleStarSection = useLyricStore(s => s.toggleStarSection);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showRhymePopover, setShowRhymePopover] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [rhymes, setRhymes] = useState<RhymeWord[]>([]);
  const [rhymesLoading, setRhymesLoading] = useState(false);
  const [rhymePopoverPosition, setRhymePopoverPosition] = useState({ x: 20, y: 100 });

  // Gesture state
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  // Get lyric lines
  const lines = section.content ? section.content.split('\n') : [];

  // Handle word selection for rhyme suggestions
  const handleSelectionChange = useCallback(
    async (event: any) => {
      const { selection } = event.nativeEvent;
      const text = section.content || '';

      if (selection.start !== selection.end) {
        const selected = text.substring(selection.start, selection.end).trim();

        // Only trigger for single words
        if (selected && !selected.includes(' ') && selected.length > 2) {
          setSelectedWord(selected);
          setRhymesLoading(true);
          setShowRhymePopover(true);
          setRhymePopoverPosition({ x: 20, y: 200 });

          try {
            const suggestions = await getRhymeSuggestions(selected, text);
            setRhymes(suggestions);
          } catch (error) {
            console.error('Error getting rhymes:', error);
            setRhymes([]);
          } finally {
            setRhymesLoading(false);
          }
        }
      }
    },
    [section.content]
  );

  // Swipe to delete gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Swipe threshold reached - delete
          setIsDeleting(true);
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            removeSection(section.id);
          });
        } else {
          // Return to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleInsertRhyme = (rhyme: string) => {
    const text = section.content || '';
    const newText = text.replace(selectedWord, rhyme);
    updateSection(section.id, newText);
  };

  if (viewMode === 'compact' && isCollapsed) {
    return (
      <Pressable
        onPress={() => setIsCollapsed(false)}
        className="bg-[#2a2a2e] rounded-lg p-4 mb-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons
              name={section.isStarred ? 'star' : 'star-outline'}
              size={16}
              color={section.isStarred ? '#FACC15' : '#6B7280'}
            />
            <Text className="ml-2 text-base font-semibold text-gray-200">
              {section.title || section.type}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </View>
      </Pressable>
    );
  }

  return (
    <>
      <Animated.View
        style={{
          transform: [{ translateX }],
        }}
        {...(viewMode === 'structured' ? panResponder.panHandlers : {})}
      >
        <View className="bg-[#2a2a2e] rounded-lg p-4 mb-4 border border-gray-700">
          {/* Section Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <Pressable onPress={() => toggleStarSection(section.id)} className="mr-2">
                <Ionicons
                  name={section.isStarred ? 'star' : 'star-outline'}
                  size={20}
                  color={section.isStarred ? '#FACC15' : '#6B7280'}
                />
              </Pressable>
              <TextInput
                value={section.title || section.type}
                onChangeText={(text) => updateSectionTitle(section.id, text)}
                placeholder="Section title"
                placeholderTextColor="#6B7280"
                className="flex-1 text-lg font-semibold text-gray-200"
                style={{ fontFamily: 'Inter' }}
              />
            </View>
            <View className="flex-row items-center">
              {viewMode === 'compact' && (
                <Pressable
                  onPress={() => setIsCollapsed(!isCollapsed)}
                  className="p-1 mr-2"
                >
                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              )}
              <Pressable
                onPress={() => removeSection(section.id)}
                className="p-1"
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </Pressable>
            </View>
          </View>

          {/* Syllable Stats */}
          {syllableCountEnabled && lines.length > 0 && (
            <View className="mb-3">
              <SyllableStats lines={lines} />
            </View>
          )}

          {/* Lyric Editor */}
          {syllableCountEnabled && lines.length > 0 ? (
            <View className="bg-[#1c1c1e] rounded-lg p-3">
              <SyllableDisplay lines={lines} />
            </View>
          ) : (
            <TextInput
              multiline
              placeholder={`Write your ${section.type} here...`}
              value={section.content}
              onChangeText={(text) => updateSection(section.id, text)}
              onSelectionChange={handleSelectionChange}
              className="bg-[#1c1c1e] rounded-lg p-4 min-h-[120px] text-base leading-6 text-gray-200"
              style={{
                fontFamily: 'Georgia',
                textAlignVertical: 'top',
              }}
              placeholderTextColor="#6B7280"
            />
          )}

          {/* Section Footer */}
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xs text-gray-500">
              {lines.filter(l => l.trim()).length} lines
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable className="p-1">
                <Ionicons name="mic-outline" size={18} color="#6B7280" />
              </Pressable>
              <Pressable className="p-1">
                <Ionicons name="sparkles-outline" size={18} color="#60A5FA" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Delete indicator (shown during swipe) */}
        {viewMode === 'structured' && (
          <View
            className="absolute right-4 top-0 bottom-0 justify-center"
            style={{ opacity: translateX.interpolate({
              inputRange: [-SWIPE_THRESHOLD, 0],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }) as any }}
          >
            <Ionicons name="trash" size={24} color="#EF4444" />
          </View>
        )}
      </Animated.View>

      {/* Rhyme Popover */}
      <RhymePopover
        visible={showRhymePopover}
        word={selectedWord}
        rhymes={rhymes}
        loading={rhymesLoading}
        position={rhymePopoverPosition}
        onClose={() => setShowRhymePopover(false)}
        onSelectRhyme={handleInsertRhyme}
      />
    </>
  );
}
