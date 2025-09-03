import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useLyricStore } from '../state/lyricStore';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onSelectTool: (tool: string) => void;
  onSelectProject: (project: string) => void;
  onNewSong: () => void;
}

export function Sidebar({ visible, onClose, onSelectTool, onSelectProject, onNewSong }: SidebarProps) {
  const insets = useSafeAreaInsets();
  const projects = useLyricStore(s => s.projects);
  const currentProjectId = useLyricStore(s => s.currentProjectId);
  const createProject = useLyricStore(s => s.createProject);
  const loadProject = useLyricStore(s => s.loadProject);
  
  const translateX = useSharedValue(-100);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateX.value = withTiming(-100, { duration: 250 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value}%` }],
  }));

  const tools = [
    { id: 'mumbl', name: 'MUMBL', icon: '🎙️', description: 'Auto-humming & melody gen' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row">
        {/* Backdrop */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            },
            backdropStyle,
          ]}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View
          style={[
            {
              width: 260,
              backgroundColor: '#171717',
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
            sidebarStyle,
          ]}
        >
          {/* Header with LYRIQ branding */}
          <View className="px-4 py-6 border-b border-gray-800">
            <Text className="text-white text-xl font-bold tracking-wide">LYRIQ</Text>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* New Chat Button */}
            <View className="px-3 py-4">
              <Pressable
                onPress={() => {
                  createProject(`Song ${projects.length + 1}`);
                  onClose();
                }}
                className="flex-row items-center justify-center p-3 rounded-lg border border-gray-600 bg-transparent active:bg-gray-800"
              >
                <Ionicons name="add" size={16} color="white" />
                <Text className="text-white font-medium ml-2">New song</Text>
              </Pressable>
            </View>

            {/* Recent Songs List */}
            <View className="px-3">
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => {
                    loadProject(project.id);
                    onClose();
                  }}
                  className="flex-row items-center p-3 rounded-lg mb-1 hover:bg-gray-800 active:bg-gray-800"
                  style={{ backgroundColor: currentProjectId === project.id ? '#374151' : undefined }}
                >
                  <Ionicons name="musical-notes-outline" size={16} color="#9CA3AF" />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-200 text-sm" numberOfLines={1}>
                      {project.name}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {project.savedAt ? new Date(project.savedAt).toLocaleDateString() : 'Unsaved'}
                    </Text>
                  </View>
                  {currentProjectId === project.id && (
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  )}
                </Pressable>
              ))}

              {tools.map((tool) => (
                <Pressable
                  key={tool.id}
                  onPress={() => {
                    onSelectTool(tool.id);
                    onClose();
                  }}
                  className="flex-row items-center p-3 rounded-lg mb-1 hover:bg-gray-800 active:bg-gray-800"
                >
                  <Ionicons name="construct-outline" size={16} color="#9CA3AF" />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-200 text-sm" numberOfLines={1}>
                      {tool.name}
                    </Text>
                  </View>
                </Pressable>
              ))}

              {projects.length === 0 && (
                <View className="px-3 py-8">
                  <Text className="text-gray-400 text-center text-sm">
                    No songs yet. Create your first song above!
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* User Profile */}
          <View className="px-3 pb-2 border-t border-gray-800 mt-4">
            <Pressable className="flex-row items-center p-3 rounded-lg hover:bg-gray-800 active:bg-gray-800 mt-2">
              <View className="w-7 h-7 bg-orange-500 rounded-full items-center justify-center">
                <Text className="text-white font-bold text-xs">A</Text>
              </View>
              <Text className="text-gray-200 text-sm ml-3 flex-1" numberOfLines={1}>ayo omoloja</Text>
              <Ionicons name="ellipsis-horizontal" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}