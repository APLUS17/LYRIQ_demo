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
}

export default function ProjectsSidebar({ visible, onClose }: ProjectsSidebarProps) {
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
                width: '85%',
                backgroundColor: '#1C1C1E',
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              },
              sidebarStyle,
            ]}
          >
            {/* Header */}
            <View className="px-4 py-4 border-b border-gray-700">
              <Text className="text-white text-lg font-semibold">Projects</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* New Project Button */}
              <View className="px-4 py-3">
                <Pressable
                  onPress={() => setShowNewProjectModal(true)}
                  className="flex-row items-center p-3 rounded-lg bg-gray-800"
                >
                  <Ionicons name="add" size={20} color="#007AFF" />
                  <Text className="text-blue-500 font-medium ml-3">New Project</Text>
                </Pressable>
              </View>

              {/* Projects List */}
              <View className="px-4">
                <Text className="text-gray-400 text-sm mb-3 px-3">Recent Projects</Text>
                
                {projects.map((project) => (
                  <Pressable
                    key={project.id}
                    onPress={() => {
                      loadProject(project.id);
                      onClose();
                    }}
                    className={`p-3 rounded-lg mb-2 ${
                      project.isCurrent ? 'bg-blue-900 border border-blue-700' : 'bg-gray-800'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-medium mb-1" numberOfLines={1}>
                          {project.name}
                        </Text>
                        <Text className="text-gray-400 text-sm mb-1">
                          {project.sections.length} sections • {project.recordings.length} takes
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {formatDate(project.updatedAt)}
                        </Text>
                      </View>
                      
                      {project.isCurrent && (
                        <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                      )}
                    </View>
                  </Pressable>
                ))}

                {projects.length === 0 && (
                  <View className="items-center py-8">
                    <Ionicons name="folder-outline" size={48} color="#4B5563" />
                    <Text className="text-gray-400 text-center mt-4">
                      No projects yet.{'\n'}Create your first project above.
                    </Text>
                  </View>
                )}
              </View>

              {/* Takes Section */}
              <View className="px-4 mt-6">
                <Text className="text-gray-400 text-sm mb-3 px-3">Takes ({recordings.length})</Text>
                
                {recordings.slice(0, 3).map((recording) => (
                  <View
                    key={recording.id}
                    className="p-3 rounded-lg mb-2 bg-gray-800"
                  >
                    <Text className="text-white font-medium mb-1" numberOfLines={1}>
                      {recording.name}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                ))}

                {recordings.length > 3 && (
                  <Pressable className="p-3 rounded-lg">
                    <Text className="text-blue-500 text-sm">View all {recordings.length} takes...</Text>
                  </Pressable>
                )}
              </View>

              {/* VERSES Section (Starred) */}
              {starredSections.length > 0 && (
                <View className="px-4 mt-6">
                  <Text className="text-gray-400 text-sm mb-3 px-3">VERSES ({starredSections.length})</Text>
                  
                  {starredSections.slice(0, 5).map((section) => (
                    <View
                      key={section.id}
                      className="p-3 rounded-lg mb-2 bg-gray-800"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-yellow-500 font-medium mb-1" numberOfLines={1}>
                            {section.title}
                          </Text>
                          <Text className="text-gray-400 text-sm" numberOfLines={2}>
                            {section.content || 'Empty section'}
                          </Text>
                        </View>
                        <Ionicons name="star" size={16} color="#FBBF24" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* User Profile */}
            <View className="px-4 py-4 border-t border-gray-700">
              <Pressable className="flex-row items-center p-3 rounded-lg">
                <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                  <Text className="text-white font-bold text-sm">L</Text>
                </View>
                <Text className="text-white font-medium ml-3">LYRIQ User</Text>
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