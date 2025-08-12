import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useLyricStore } from '../state/lyricStore';

interface ProjectsSidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToIdeas?: () => void;
}

export default function ProjectsSidebar({ visible, onClose, onNavigateToIdeas }: ProjectsSidebarProps) {
  const insets = useSafeAreaInsets();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const translateX = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const {
    projects,
    currentProject,
    createProject,
    loadProject,
    deleteProject,
    renameProject,
    recordings,
    getStarredSections,
  } = useLyricStore();

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

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectModal(false);
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProject(projectId),
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const starredSections = getStarredSections();

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View className="flex-1 flex-row">
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
              {/* New Song Button */}
              <View className="px-3 py-4">
                <Pressable
                  onPress={() => setShowNewProjectModal(true)}
                  className="flex-row items-center justify-center p-3 rounded-lg border border-gray-600 bg-transparent active:bg-gray-800"
                >
                  <Ionicons name="add" size={16} color="white" />
                  <Text className="text-white font-medium ml-2">New song</Text>
                </Pressable>
              </View>

              {/* Explore LYRIQs */}
              <View className="px-3 pb-4">
                <Pressable 
                  onPress={() => {
                    onNavigateToIdeas?.();
                    onClose();
                  }}
                  className="flex-row items-center p-3 rounded-lg hover:bg-gray-800 active:bg-gray-800"
                >
                  <Ionicons name="compass-outline" size={16} color="#9CA3AF" />
                  <Text className="text-gray-200 text-sm ml-3">Explore LYRIQs</Text>
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
                  >
                    <Ionicons name="musical-notes-outline" size={16} color="#9CA3AF" />
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-200 text-sm" numberOfLines={1}>
                        {project.name}
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

      {/* New Project Modal */}
      <Modal
        visible={showNewProjectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewProjectModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            className="bg-gray-900 rounded-t-3xl p-6"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <Text className="text-xl font-medium text-white mb-4">
              Create New Project
            </Text>
            
            <TextInput
              value={newProjectName}
              onChangeText={setNewProjectName}
              placeholder="Enter project name..."
              placeholderTextColor="#6B7280"
              className="bg-gray-800 text-white p-4 rounded-xl mb-6 text-base"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateProject}
            />
            
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowNewProjectModal(false)}
                className="flex-1 bg-gray-700 p-4 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleCreateProject}
                className="flex-1 bg-blue-600 p-4 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Create
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}