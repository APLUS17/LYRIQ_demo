import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useAIAssistantStore, aiPresets } from '../state/aiAssistantStore';
import { useLyricStore } from '../state/lyricStore';
import { getOpenAIChatResponse } from '../api/chat-service';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AIAssistantModal() {
  const insets = useSafeAreaInsets();
  const { isVisible, isLoading, currentResponse, hideModal, setLoading, setResponse } = useAIAssistantStore();
  const sections = useLyricStore(s => {
    const pid = s.currentProjectId ?? '__unassigned__';
    return s.sectionsByProject[pid] ?? [];
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(400, { duration: 250 });
    }
  }, [isVisible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleClose = () => {
    Keyboard.dismiss();
    hideModal();
    setCustomPrompt('');
    setSelectedPreset(null);
    setResponse('');
  };

  const getCurrentLyrics = () => {
    return sections
      .map(section => `${section.title}:\n${section.content}`)
      .join('\n\n')
      .trim();
  };

  const handlePresetPress = async (preset: typeof aiPresets[0]) => {
    if (isLoading) return; // Prevent duplicate calls
    
    setSelectedPreset(preset.id);
    setLoading(true);

    try {
      const currentLyrics = getCurrentLyrics();
      const contextPrompt = currentLyrics 
        ? `${preset.prompt}\n\nCurrent lyrics:\n${currentLyrics}`
        : `${preset.prompt}\n\nNote: No lyrics written yet, provide general guidance.`;

      const response = await getOpenAIChatResponse(contextPrompt);
      setResponse(response.content);
    } catch (error) {
      setResponse("I'm having trouble connecting right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim() || isLoading) return; // Prevent duplicate calls

    setLoading(true);
    try {
      const currentLyrics = getCurrentLyrics();
      const fullPrompt = currentLyrics
        ? `${customPrompt}\n\nCurrent lyrics:\n${currentLyrics}`
        : customPrompt;

      const response = await getOpenAIChatResponse(fullPrompt);
      setResponse(response.content);
      setCustomPrompt('');
    } catch (error) {
      setResponse("I'm having trouble connecting right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View className="flex-1">
        {/* Backdrop */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
            },
            backdropStyle,
          ]}
        >
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Modal Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <Animated.View
            style={[
              {
                backgroundColor: 'white',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '80%',
                paddingBottom: insets.bottom,
              },
              modalStyle,
            ]}
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-8 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text className="text-xl font-medium text-gray-900">
                AI Assistant
              </Text>
              <Pressable onPress={handleClose} className="p-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
              {/* Preset Options */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-600 mb-3">
                  Quick Actions
                </Text>
                <View className="gap-3">
                  {aiPresets.map((preset) => (
                    <Pressable
                      key={preset.id}
                      onPress={() => handlePresetPress(preset)}
                      disabled={isLoading}
                      className={`flex-row items-center p-4 rounded-xl border ${
                        selectedPreset === preset.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Ionicons
                        name={preset.icon as any}
                        size={20}
                        color={selectedPreset === preset.id ? '#3B82F6' : '#6B7280'}
                      />
                      <Text
                        className={`ml-3 text-base ${
                          selectedPreset === preset.id ? 'text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {preset.title}
                      </Text>
                      {isLoading && selectedPreset === preset.id && (
                        <View className="ml-auto">
                          <Ionicons name="hourglass" size={16} color="#3B82F6" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Response */}
              {currentResponse && (
                <View className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Text className="text-base text-gray-800 leading-6">
                    {currentResponse}
                  </Text>
                </View>
              )}

              {/* Custom Prompt */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-600 mb-3">
                  Ask Anything
                </Text>
                <View className="flex-row gap-3">
                  <TextInput
                    ref={inputRef}
                    placeholder="Ask me anything about your lyrics..."
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl text-base"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={200}
                    onSubmitEditing={handleCustomPrompt}
                    returnKeyType="send"
                  />
                  <Pressable
                    onPress={handleCustomPrompt}
                    disabled={!customPrompt.trim() || isLoading}
                    className={`w-12 h-12 rounded-xl items-center justify-center ${
                      customPrompt.trim() && !isLoading
                        ? 'bg-black'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Ionicons
                      name="send"
                      size={18}
                      color={customPrompt.trim() && !isLoading ? 'white' : '#9CA3AF'}
                    />
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}