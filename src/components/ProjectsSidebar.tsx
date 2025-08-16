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
  const [newProjectName, setNewProjectName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  
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
    sections,
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

  const handleLongPress = (project: any) => {
    setSelectedProject(project);
    setEditingProjectName(project.name);
    setShowOptionsModal(true);
  };

  const handleRename = () => {
    if (editingProjectName.trim() && selectedProject) {
      renameProject(selectedProject.id, editingProjectName.trim());
      setShowOptionsModal(false);
      setSelectedProject(null);
      setEditingProjectName("");
    }
  };

  const handleDelete = () => {
    if (selectedProject) {
      handleDeleteProject(selectedProject.id, selectedProject.name);
      setShowOptionsModal(false);
      setSelectedProject(null);
      setEditingProjectName("");
    }
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
  const sortedProjects = React.useMemo(() => {
    return [...projects].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [projects]);

  const filteredProjects = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedProjects;
    return sortedProjects.filter(p => p.name.toLowerCase().includes(q));
  }, [sortedProjects, searchQuery]);

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
              {/* Search + Pen */}
              <View className="px-3 py-4">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="flex-1">
                    <View className="relative">
                      <Ionicons 
                        name="search" 
                        size={16} 
                        color="#9CA3AF" 
                        style={{ 
                          position: "absolute", 
                          left: 12, 
                          top: "50%",
                          marginTop: -8,
                          zIndex: 1
                        }} 
                      />
                      <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search"
                        placeholderTextColor="#9CA3AF"
                        className="bg-gray-800 text-white rounded-xl px-10 py-3"
                        accessibilityLabel="Search projects"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        style={{ textAlignVertical: 'center' }}
                      />
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      const { createProject, addSection, saveCurrentProject } = useLyricStore.getState();
                      createProject("Untitled");
                      addSection("verse");
                      saveCurrentProject();
                      onClose();
                    }}
                    className="w-11 h-11 rounded-xl items-center justify-center border border-gray-700"
                    accessibilityLabel="Create blank project"
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Ionicons name="create-outline" size={18} color="#9CA3AF" />
                  </Pressable>
                </View>
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
                {filteredProjects.map((project) => (
                  <Pressable
                    key={project.id}
                    onPress={() => {
                      loadProject(project.id);
                      onClose();
                    }}
                    onLongPress={() => handleLongPress(project)}
                    className={`flex-row items-center p-3 rounded-lg mb-1 ${project.id === currentProject?.id ? "bg-gray-800" : "hover:bg-gray-800 active:bg-gray-800"}`}
                    style={{ paddingLeft: 8 }}
                  >
                    {/* Removed music note icon */}
                    <View className="flex-1">
                      <Text className="text-gray-200 text-sm" numberOfLines={1} style={{ marginLeft: 0 }}>
                        {project.name}
                      </Text>
                      {/* Lyrics snippet */}
                      {!!project.sections?.length && (
                        <Text className="text-gray-500 text-xs mt-1" numberOfLines={1} style={{ marginLeft: 0 }}>
                          {project.sections.map(s => s.content).join(' ').slice(0, 80)}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}

                {projects.length === 0 && searchQuery.trim() === "" && (
                  <View className="px-3 py-8">
                    <Text className="text-gray-400 text-center text-sm">
                      No songs yet. Create your first song above!
                    </Text>
                  </View>
                )}
                {searchQuery.trim() !== "" && filteredProjects.length === 0 && (
                  <View className="px-3 py-8">
                    <Text className="text-gray-400 text-center text-sm">
                      No results for "{searchQuery}"
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

      {/* Project Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            className="bg-gray-900 rounded-t-3xl p-6"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <Text className="text-xl font-medium text-white mb-4">
              Project Options
            </Text>
            
            <TextInput
              value={editingProjectName}
              onChangeText={setEditingProjectName}
              placeholder="Project name..."
              placeholderTextColor="#6B7280"
              className="bg-gray-800 text-white p-4 rounded-xl mb-6 text-base"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            
            <View className="flex-row gap-3 mb-4">
              <Pressable
                onPress={handleRename}
                className="flex-1 bg-blue-600 p-4 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Rename
                </Text>
              </Pressable>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowOptionsModal(false)}
                className="flex-1 bg-gray-700 p-4 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleDelete}
                className="flex-1 bg-red-600 p-4 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}