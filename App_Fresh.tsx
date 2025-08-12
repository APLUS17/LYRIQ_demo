import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Types and simple state management for this demo screen
type Section = {
  id: string;
  type: string;
  title: string;
  content: string;
  isStarred: boolean;
};

const useLyricStore = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  const addSection = (type: string) => {
    const safeType = type || 'verse';
    const newSection: Section = {
      id: Date.now().toString(),
      type: safeType,
      title: safeType.charAt(0).toUpperCase() + safeType.slice(1),
      content: '',
      isStarred: false,
    };
    setSections((prev) => [...prev, newSection]);
  };

  const updateSection = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, content } : section))
    );
  };

  const toggleStarSection = (id: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, isStarred: !section.isStarred } : section
      )
    );
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  const saveProject = () => {
    console.log('Project saved!', { sections: sections.length });
  };

  return {
    sections,
    addSection,
    updateSection,
    toggleStarSection,
    removeSection,
    saveProject,
    showSidebar,
    setShowSidebar,
  };
};

// Simple Section Card
type SectionCardProps = {
  section: Section;
  updateSection: (id: string, content: string) => void;
  toggleStarSection: (id: string) => void;
  removeSection: (id: string) => void;
};

function SectionCard({ section, updateSection, toggleStarSection, removeSection }: SectionCardProps) {
  return (
    <View style={{
      backgroundColor: '#2A2A2A',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 4,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: '#E5E7EB', fontSize: 16, fontWeight: '600' }}>
          {section.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={() => toggleStarSection(section.id)}>
            <Ionicons 
              name={section.isStarred ? "star" : "star-outline"} 
              size={16} 
              color={section.isStarred ? "#FBBF24" : "#9CA3AF"} 
            />
          </Pressable>
          <Pressable onPress={() => removeSection(section.id)}>
            <Ionicons name="trash" size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>
      
      {/* Content */}
      <Text 
        style={{ 
          color: '#9CA3AF', 
          fontSize: 14, 
          fontStyle: 'italic',
          minHeight: 60 
        }}
      >
        {section.content || `Write your ${section.type} here...`}
      </Text>
    </View>
  );
}

// Projects/Takes/VERSES Sidebar
type ProjectsSidebarProps = {
  visible: boolean;
  onClose: () => void;
};

function ProjectsSidebar({ visible, onClose }: ProjectsSidebarProps) {
  const insets = useSafeAreaInsets();
  const { sections } = useLyricStore();
  
  if (!visible) return null;

  const starredSections = sections.filter((s) => s.isStarred);

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
    }}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      
      <View style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '85%',
        backgroundColor: '#1C1C1E',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#374151' }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>LYRIQ</Text>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Projects Section */}
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 12 }}>PROJECTS</Text>
            <Pressable style={{
              backgroundColor: '#374151',
              padding: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="add" size={20} color="#3B82F6" />
              <Text style={{ color: '#3B82F6', marginLeft: 8, fontWeight: '500' }}>New Project</Text>
            </Pressable>
          </View>

          {/* Takes Section */}
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 12 }}>TAKES (0)</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>No recordings yet</Text>
          </View>

          {/* VERSES Section */}
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 12 }}>
              VERSES ({starredSections.length})
            </Text>
            {starredSections.map((section) => (
              <View key={section.id} style={{
                backgroundColor: '#374151',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FBBF24', fontWeight: '500', marginBottom: 4 }}>
                    {section.title}
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }} numberOfLines={2}>
                    {section.content || 'Empty section'}
                  </Text>
                </View>
                <Ionicons name="star" size={16} color="#FBBF24" />
              </View>
            ))}
            {starredSections.length === 0 && (
              <Text style={{ color: '#6B7280', fontSize: 12 }}>No starred sections yet</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// Main Screen
function MainScreen() {
  const insets = useSafeAreaInsets();
  const { 
    sections, 
    addSection, 
    updateSection, 
    toggleStarSection, 
    removeSection,
    saveProject,
    showSidebar,
    setShowSidebar
  } = useLyricStore();

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#1A1A1A',
      paddingTop: insets.top + 20 
    }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => setShowSidebar(true)} style={{ padding: 8 }}>
            <Ionicons name="menu" size={24} color="#9CA3AF" />
          </Pressable>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: '300' }}>LYRIQ</Text>
        </View>
        
        <Pressable
          onPress={saveProject}
          style={{
            backgroundColor: '#2563EB',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="save" size={16} color="white" />
          <Text style={{ color: 'white', marginLeft: 8, fontWeight: '500' }}>save</Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 24 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            updateSection={updateSection}
            toggleStarSection={toggleStarSection}
            removeSection={removeSection}
          />
        ))}

        {/* Add Section Button */}
        <Pressable
          onPress={() => addSection('verse')}
          style={{
            backgroundColor: '#374151',
            padding: 16,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#E5E7EB', fontWeight: '500' }}>add section</Text>
          <Text style={{ color: '#E5E7EB', marginLeft: 8, fontSize: 18 }}>+</Text>
        </Pressable>

        {sections.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: '#6B7280', textAlign: 'center' }}>
              Tap "add section" to start writing
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Projects Sidebar */}
      <ProjectsSidebar visible={showSidebar} onClose={() => setShowSidebar(false)} />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <MainScreen />
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}