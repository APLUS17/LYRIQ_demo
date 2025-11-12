import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text, Pressable, TextInput, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

// Platform-specific imports
let Haptics: any = null;
let Audio: any = null;
let PanGestureHandler: any = null;
let GestureHandlerRootView: any = View; // Fallback to regular View for web
let useAnimatedGestureHandler: any = null;

if ((Platform.OS as string) !== 'web') {
  Haptics = require('expo-haptics');
  const ExpoAV = require('expo-av');
  Audio = ExpoAV.Audio;
  const GestureHandler = require('react-native-gesture-handler');
  PanGestureHandler = GestureHandler.PanGestureHandler;
  GestureHandlerRootView = GestureHandler.GestureHandlerRootView;
  const Reanimated = require('react-native-reanimated');
  useAnimatedGestureHandler = Reanimated.useAnimatedGestureHandler;
}

// Import the new modular components
import { useLyricStore } from './src/state/lyricStore';
import RecordingModal from './src/components/RecordingModal';
// import Toast from './src/components/Toast';
import PerformanceView from './src/components/PerformanceView';
import ProjectsSidebar from './src/components/ProjectsSidebar';
import IdeasScreen from './src/screens/IdeasScreen';
import TakesScreen from './src/screens/TakesScreen';
import ChatEditorScreen from './src/screens/ChatEditorScreen';
import RecordingsAccordion from './src/components/RecordingsAccordion';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { LyricPadScreen } from './src/screens/LyricPadScreen';


// Enhanced Section Card Component with Swipe-to-Delete
const AnimatedView = Animated.createAnimatedComponent(View);

function SectionCard({ section, updateSection, updateSectionType, removeSection, toggleStarSection, inputRef }: {
  section: any;
  updateSection: (id: string, content: string) => void;
  updateSectionType: (id: string, type: string) => void;
  removeSection: (id: string) => void;
  toggleStarSection: (id: string) => void;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);
  
  const sectionTypes = [
    'verse', 'chorus', 'bridge', 'pre-chorus', 'outro', 'tag', 'intro'
  ];

  const gestureHandler = useAnimatedGestureHandler ? useAnimatedGestureHandler({
    onStart: (_: any, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event: any, context: any) => {
      const isHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY);
      
      if (isHorizontal && context.startX !== undefined) {
        // Horizontal swipe - only allow left swipe for delete
        translateX.value = Math.min(0, context.startX + event.translationX);
      } else if (context.startY !== undefined) {
        // Vertical drag for reordering - constrain to Y-axis only
        translateY.value = context.startY + event.translationY;
        translateX.value = withSpring(0); // Always snap back to center horizontally
        isDragging.value = true;
      }
    },
    onEnd: (event: any) => {
      const isHorizontal = Math.abs(event.translationX) > Math.abs(event.translationY);
      
      if (isHorizontal && translateX.value < -100) {
        // Swipe left to delete
        translateX.value = withTiming(-400, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(removeSection)(section.id);
          }
        });
      } else {
        // Snap back to original position
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        isDragging.value = false;
      }
    },
  }) : null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ] as any,
    opacity: opacity.value,
    zIndex: isDragging.value ? 999 : 1,
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -50 ? 1 : 0,
  }));

  return (
    <View className="mb-4">
      {/* Delete Background */}
      <AnimatedView 
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 100,
            backgroundColor: '#EF4444',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 0,
          },
          backgroundStyle
        ]}
      >
        <Ionicons name="trash" size={24} color="white" />
      </AnimatedView>

      {/* Card */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <AnimatedView 
          style={[
            {
              backgroundColor: '#0A0A0A',
              borderRadius: 12,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 4,
              zIndex: 1,
            },
            animatedStyle
          ]}
        >
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        {/* Section Type Dropdown */}
        <Pressable
          onPress={() => {
            if ((Platform.OS as string) !== 'web' && Haptics) {
              if ((Platform.OS as string) !== 'web' && Haptics) {
                if ((Platform.OS as string) !== 'web' && Haptics) {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
               }
              }
            }
            setShowDropdown(!showDropdown);
          }}
          className="flex-row items-center bg-gray-700 px-3 py-2 rounded-lg"
          accessible={true}
          accessibilityLabel="Change section type"
          accessibilityRole="button"
        >
          <Ionicons name="menu" size={12} color="#9CA3AF" />
           <Text className="ml-2 text-sm font-medium text-gray-200">
             {(section.title && section.title.length > 0) ? section.title : (section.type?.charAt(0).toUpperCase() + section.type?.slice(1) || 'Section')}
           </Text>
          <Ionicons name="chevron-down" size={12} color="#9CA3AF" className="ml-1" />
        </Pressable>

        {/* Controls */}
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {/* Star Button */}
          <Pressable 
            onPress={() => {
              if ((Platform.OS as string) !== 'web' && Haptics) {
              if ((Platform.OS as string) !== 'web' && Haptics) {
                if ((Platform.OS as string) !== 'web' && Haptics) {
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
               }
              }
            }
              toggleStarSection(section.id);
            }}
            className="p-2"
            accessible={true}
            accessibilityLabel={section.isStarred ? "Remove from favorites" : "Add to favorites"}
            accessibilityRole="button"
          >
            <Ionicons 
              name={section.isStarred ? "star" : "star-outline"} 
              size={16} 
              color={section.isStarred ? "#FBBF24" : "#9CA3AF"} 
            />
          </Pressable>
          
          {/* Drag Handle */}
          <Pressable className="p-2">
            <Ionicons name="grid" size={16} color="#9CA3AF" />
          </Pressable>
        </View>
      </View>

      {/* Dropdown Menu */}
      {showDropdown && (
        <View 
          className="absolute top-12 left-4 bg-gray-800 rounded-lg z-10"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            minWidth: 120,
          }}
        >
          {sectionTypes.map((type, index) => (
            <Pressable
              key={type}
              onPress={() => {
                if ((Platform.OS as string) !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                updateSectionType(section.id, type);
                setShowDropdown(false);
              }}
              className="px-3 py-2.5"
              style={{
                borderBottomWidth: index < sectionTypes.length - 1 ? 1 : 0,
                borderBottomColor: '#4B5563',
              }}
            >
              <Text className="text-sm text-gray-200 capitalize font-medium">
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Lyrics Text Area */}
      <TextInput
        ref={inputRef}
        multiline
        placeholder={`Write your ${section.type} here...`}
        value={section.content}
        onChangeText={(text) => updateSection(section.id, text)}
        className="min-h-[100px] text-base leading-6"
        style={{ 
          fontFamily: 'Georgia', 
          textAlignVertical: 'top',
          color: '#F3F4F6'
        }}
        placeholderTextColor="#6B7280"
      />
        </AnimatedView>
      </PanGestureHandler>
    </View>
  );
}

// Add Section Button Component
function AddSectionButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-center px-4 py-4 rounded-2xl mb-6"
      style={{ 
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}
      accessible={true}
      accessibilityLabel="Add section"
      accessibilityRole="button"
    >
      <Text className="text-gray-300 font-medium mr-3">add section</Text>
      <Text className="text-gray-300 text-xl">+</Text>
    </Pressable>
  );
}

// Main App
function MainScreen() {
  const [currentTab, setCurrentTab] = useState<'editor'|'lyric'>("lyric");
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ backgroundColor: '#000', paddingTop: insets.top }}>
      <View className="flex-row items-center justify-center mb-6 gap-x-6 mt-4">
        <Pressable onPress={() => setCurrentTab('lyric')}>
          <Text style={{ color: currentTab === 'lyric' ? '#FFF' : '#666', fontWeight: 'bold', fontSize: 18 }}>Lyric Pad</Text>
        </Pressable>
        <Pressable onPress={() => setCurrentTab('editor')}>
          <Text style={{ color: currentTab === 'editor' ? '#FFF' : '#666', fontWeight: 'bold', fontSize: 18 }}>Editor</Text>
        </Pressable>
      </View>
      {currentTab === 'lyric' ? <LyricPadScreen /> : <ChatEditorScreen onBack={() => setCurrentTab('lyric')} />}  
    </View>
  );
}

export default function App() {
  const hasCompletedOnboarding = useLyricStore(state => state.hasCompletedOnboarding);
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <NavigationContainer>
          {hasCompletedOnboarding ? (
            <MainScreen />
          ) : (
            <OnboardingScreen />
          )}
          <StatusBar style="dark" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}