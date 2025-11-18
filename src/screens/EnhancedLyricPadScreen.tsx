import React, { useState } from 'react';
import { View, ScrollView, Text, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLyricStore } from '../state/lyricStore';
import { EnhancedLyricSection } from '../components/EnhancedLyricSection';
import { Sidebar } from '../components/Sidebar';

interface EnhancedLyricPadScreenProps {
  onBack?: () => void;
}

export function EnhancedLyricPadScreen({ onBack }: EnhancedLyricPadScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const sections = useLyricStore(s => {
    const pid = s.currentProjectId ?? '__unassigned__';
    return s.sectionsByProject[pid] ?? [];
  });
  const currentProject = useLyricStore(s => s.getCurrentProject());
  const addSection = useLyricStore(s => s.addSection);
  const viewMode = useLyricStore(s => s.viewMode);
  const syllableCountEnabled = useLyricStore(s => s.syllableCountEnabled);
  const toggleViewMode = useLyricStore(s => s.toggleViewMode);
  const toggleSyllableCount = useLyricStore(s => s.toggleSyllableCount);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const sectionTypes = [
    { type: 'intro', label: 'Intro', icon: 'play-circle' },
    { type: 'verse', label: 'Verse', icon: 'musical-note' },
    { type: 'chorus', label: 'Chorus', icon: 'repeat' },
    { type: 'bridge', label: 'Bridge', icon: 'git-branch' },
    { type: 'outro', label: 'Outro', icon: 'stop-circle' },
  ];

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            onPress={() => setShowSidebar(true)}
            className="p-2 -ml-2 rounded-lg active:bg-gray-800"
          >
            <Ionicons name="menu" size={24} color="#E5E7EB" />
          </Pressable>

          <View className="flex-1 ml-4">
            <Text
              className="text-2xl font-light text-gray-200 mb-1"
              style={{ fontFamily: 'Inter' }}
            >
              {currentProject?.name || 'Untitled'}
            </Text>
            <Text className="text-sm text-gray-500">
              {sections.length === 0
                ? 'Start writing your song'
                : `${sections.length} section${sections.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 rounded-lg active:bg-gray-800"
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#E5E7EB" />
          </Pressable>
        </View>

        {/* Options Menu */}
        {showOptionsMenu && (
          <View className="bg-[#1c1c1e] rounded-lg p-2 mb-4 border border-gray-700">
            <Pressable
              onPress={() => {
                toggleViewMode();
                setShowOptionsMenu(false);
              }}
              className="flex-row items-center justify-between p-3 rounded-lg active:bg-gray-700"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={viewMode === 'structured' ? 'grid' : 'list'}
                  size={20}
                  color="#9CA3AF"
                />
                <Text className="ml-3 text-gray-200">
                  {viewMode === 'structured' ? 'Structured View' : 'Compact View'}
                </Text>
              </View>
              <Ionicons name="checkmark" size={20} color="#FACC15" />
            </Pressable>

            <Pressable
              onPress={() => {
                toggleSyllableCount();
                setShowOptionsMenu(false);
              }}
              className="flex-row items-center justify-between p-3 rounded-lg active:bg-gray-700"
            >
              <View className="flex-row items-center">
                <Ionicons name="calculator" size={20} color="#9CA3AF" />
                <Text className="ml-3 text-gray-200">Syllable Counter</Text>
              </View>
              {syllableCountEnabled && (
                <Ionicons name="checkmark" size={20} color="#FACC15" />
              )}
            </Pressable>
          </View>
        )}

        {/* Sections */}
        {sections.map((section, index) => (
          <EnhancedLyricSection key={section.id} section={section} index={index} />
        ))}

        {/* Add Section Buttons */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-400 mb-3">
            Add Section
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {sectionTypes.map(({ type, label, icon }) => (
              <Pressable
                key={type}
                onPress={() => addSection(type)}
                className="flex-row items-center bg-[#2a2a2e] border border-gray-700 rounded-full px-4 py-3 active:bg-gray-700"
              >
                <Ionicons name={icon as any} size={16} color="#9CA3AF" />
                <Text className="ml-2 text-sm text-gray-300">+ {label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Empty State */}
        {sections.length === 0 && (
          <View className="items-center justify-center py-16">
            <Ionicons name="musical-notes" size={64} color="#374151" />
            <Text className="text-gray-500 text-center mt-4 text-base">
              Your lyrics will appear here.{'\n'}Tap a button above to get started.
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sidebar */}
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectTool={(tool) => {
          console.log('Selected tool:', tool);
          setShowSidebar(false);
        }}
        onSelectProject={(project) => {
          console.log('Selected project:', project);
          setShowSidebar(false);
        }}
        onNewSong={() => {
          console.log('New song');
          setShowSidebar(false);
        }}
      />
    </View>
  );
}
