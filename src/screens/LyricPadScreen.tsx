import React, { useState } from 'react';
import { View, ScrollView, Text, Pressable, Keyboard, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLyricStore } from '../state/lyricStore';
import { LyricSection } from '../components/LyricSection';
import { Sidebar } from '../components/Sidebar';
import { MumbleRecorder } from '../components/MumbleRecorder';

interface LyricPadScreenProps {
  onBack?: () => void;
}

export function LyricPadScreen({ onBack }: LyricPadScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const sections = useLyricStore(s => {
    const pid = s.currentProjectId ?? '__unassigned__';
    return s.sectionsByProject[pid] ?? [];
  });
  const addSection = useLyricStore(s => s.addSection);
  const updateSection = useLyricStore(s => s.updateSection);
  const freewriteText = useLyricStore(s => {
    const pid = s.currentProjectId ?? '__unassigned__';
    return s.freewriteTextByProject[pid] ?? '';
  });
  const updateFreewriteText = useLyricStore(s => s.updateFreewriteText);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [freewrite, setFreewrite] = useState(false); // Freewrite view toggle

  const sectionTypes = [
    { type: 'verse' as const, label: 'Verse', icon: 'musical-note' },
    { type: 'chorus' as const, label: 'Chorus', icon: 'repeat' },
    { type: 'bridge' as const, label: 'Bridge', icon: 'git-branch' },
  ];

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-6"
        style={{ paddingTop: insets.top + 20, backgroundColor: freewrite ? '#000' : undefined }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable
            onPress={() => setShowSidebar(true)}
            className="p-2 -ml-2 rounded-lg"
          >
            <Ionicons name="menu" size={24} color={freewrite ? '#fff' : '#1F2937'} />
          </Pressable>
          
          <View className="flex-1 ml-4">
            <Text className="text-2xl font-light" style={{ color: freewrite ? '#fff' : '#1F2937' }}>
              Lyric Pad
            </Text>
          </View>
          
          <Pressable
            onPress={() => setFreewrite(f => !f)}
            className="p-2 bg-gray-100 rounded-lg"
            style={{ backgroundColor: freewrite ? '#374151' : '#F3F4F6' }}
            accessibilityLabel="Toggle Freewrite View"
          >
            <Ionicons name={freewrite ? 'eye-off' : 'eye'} size={20} color={freewrite ? '#fff' : '#1F2937'} />
          </Pressable>
        </View>

        {/* Freewrite View */}
        {freewrite ? (
          <View style={{ flex: 1, minHeight: 400, justifyContent: 'flex-start' }}>
            <TextInput
              style={{
                color: '#fff',
                fontSize: 22,
                fontWeight: '300',
                backgroundColor: 'transparent',
                minHeight: 300,
                padding: 0,
                margin: 0,
                borderWidth: 0,
              }}
              value={freewriteText}
              onChangeText={updateFreewriteText}
              placeholder="Start writing..."
              placeholderTextColor="#666"
              multiline
              autoFocus
              selectionColor="#fff"
              cursorColor="#fff"
            />
          </View>
        ) : (
          <>
            {/* Sections */}
            {sections.map((section) => (
              <LyricSection key={section.id} section={section} />
            ))}
            {/* Add Section Buttons */}
            <View className="mb-8">
              <Text className="text-sm font-medium text-gray-600 mb-3">
                Add Section
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {sectionTypes.map(({ type, label, icon }) => (
                  <Pressable
                    key={type}
                    onPress={() => addSection(type)}
                    className="flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-3"
                  >
                    <Ionicons name={icon as any} size={16} color="#6B7280" />
                    <Text className="ml-2 text-sm text-gray-700">
                      + {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {/* Empty State */}
            {sections.length === 0 && (
              <View className="items-center justify-center py-12">
                <Ionicons name="musical-notes" size={64} color="#E5E7EB" />
                <Text className="text-gray-400 text-center mt-4 text-base">
                  Your lyrics will appear here.{"\n"}Tap a button above to get started.
                </Text>
              </View>
            )}
          </>
        )}
        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Mumble Recorder (always accessible) */}
      <MumbleRecorder />

      {/* Sidebar */}
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectTool={(tool) => {
          console.log('Selected tool:', tool);
          // Handle tool selection (e.g., open mumble recorder)
        }}
        onSelectProject={(project) => {
          console.log('Selected project:', project);
          // Project selection is now handled directly in Sidebar
        }}
        onNewSong={() => {
          console.log('New song');
          // Project creation is now handled directly in Sidebar
        }}
      />
    </View>
  );
}