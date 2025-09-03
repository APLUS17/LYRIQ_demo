import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';

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

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
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
    onEnd: (event) => {
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
  });

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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  /* 🚨 Hooks: ALWAYS top-level, same order every render */
  const insets = useSafeAreaInsets();
  const [showProjectsSidebar, setShowProjectsSidebar] = useState(false);
  const [showIdeasScreen, setShowIdeasScreen] = useState(false);
  const [showTakesScreen, setShowTakesScreen] = useState(false);
  const [showChatScreen, setShowChatScreen] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showAddToast, setShowAddToast] = useState(false);
  const [freewrite, setFreewrite] = useState(false);
  
  // Use memoized selectors to prevent fresh references
  const currentProjectId = useLyricStore(s => s.currentProjectId);
  const sectionsByProject = useLyricStore(s => s.sectionsByProject);
  const recordingsByProject = useLyricStore(s => s.recordingsByProject);
  const projects = useLyricStore(s => s.projects);
  
  const sections = useMemo(() => {
    const pid = currentProjectId ?? '__unassigned__';
    return sectionsByProject[pid] ?? [];
  }, [currentProjectId, sectionsByProject]);
  
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === currentProjectId) ?? null;
  }, [projects, currentProjectId]);
  
  const recordings = useMemo(() => {
    const pid = currentProjectId ?? '__unassigned__';
    return recordingsByProject[pid] ?? [];
  }, [currentProjectId, recordingsByProject]);
  
  const addSection = useLyricStore(s => s.addSection);
  const updateSectionOriginal = useLyricStore(s => s.updateSection);
  const updateSectionType = useLyricStore(s => s.updateSectionType);
  const removeSection = useLyricStore(s => s.removeSection);
  const toggleRecordingModal = useLyricStore(s => s.toggleRecordingModal);
  const isPerformanceMode = useLyricStore(s => s.isPerformanceMode);
  const togglePerformanceMode = useLyricStore(s => s.togglePerformanceMode);
  const saveCurrentProject = useLyricStore(s => s.saveCurrentProject);
  const toggleStarSection = useLyricStore(s => s.toggleStarSection);
  const renameProject = useLyricStore(s => s.renameProject);
  const freewriteText = useLyricStore(s => {
    const pid = s.currentProjectId ?? '__unassigned__';
    return s.freewriteTextByProject[pid] ?? '';
  });
  const updateFreewriteTextOriginal = useLyricStore(s => s.updateFreewriteText);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const lastTitleTapRef = useRef<number>(0);
  
  // Auto-save debouncing
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced auto-save function
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveCurrentProject();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [saveCurrentProject]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  
  // Enhanced updateSection with auto-save
  const updateSection = useCallback((id: string, content: string) => {
    updateSectionOriginal(id, content);
    // Trigger debounced auto-save only if content is not empty
    if (content.trim()) {
      debouncedAutoSave();
    }
  }, [updateSectionOriginal, debouncedAutoSave]);
  
  // Enhanced updateFreewriteText with auto-save
  const updateFreewriteText = useCallback((text: string) => {
    updateFreewriteTextOriginal(text);
    // Trigger debounced auto-save only if content is not empty
    if (text.trim()) {
      debouncedAutoSave();
    }
  }, [updateFreewriteTextOriginal, debouncedAutoSave]);

  // Scroll and input refs for focusing on add
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Record<string, React.RefObject<TextInput | null>>>({});
  const getInputRef = useCallback((id: string) => {
    if (!inputRefs.current[id]) inputRefs.current[id] = React.createRef<TextInput | null>();
    return inputRefs.current[id];
  }, []);

  const displayedTitle = currentProject?.name || "Untitled";

  const commitTitle = useCallback(async () => {
    const newName = titleInput.trim();
    setIsEditingTitle(false);
    if (!newName || newName === displayedTitle) return;
    // Ensure a project exists, then rename
    if (!currentProject) {
      saveCurrentProject();
    }
    const state = useLyricStore.getState();
    const proj = state.projects.find(p => p.id === state.currentProjectId);
    if (proj) {
      renameProject(proj.id, newName);
      // Auto-save after title change
      setTimeout(() => saveCurrentProject(), 500);
    }
  }, [titleInput, displayedTitle, currentProject, renameProject, saveCurrentProject]);


  /* callback to open modal */
  const openRecorder = useCallback(() => toggleRecordingModal(true), [toggleRecordingModal]);

  /* ✅ ALWAYS call this hook - logic inside handler, not around hook */
  const swipeUpGestureHandler = useAnimatedGestureHandler({
    onEnd: (event) => {
      // Detect upward swipe from bottom area with safe bounds
      const screenHeight = 800; // approximate screen height
      const isFromBottom = event.absoluteY > screenHeight * 0.6; // bottom 40% of screen
      const isUpwardSwipe = event.translationY < -50 && event.velocityY < -500;
      
      if (isUpwardSwipe && isFromBottom) {
        runOnJS(toggleRecordingModal)(true);
      }
    },
  });

  // Conditional rendering based on view mode
  if (isPerformanceMode) {
    return <PerformanceView />;
  }

  return (
    <View className="flex-1" style={{ 
      backgroundColor: '#000000',
      paddingTop: insets.top + 20 
    }}>
      {/* Header with Controls */}
      <View className="flex-row items-center justify-between px-6 mb-6">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Projects Menu Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowProjectsSidebar(true);
            }}
            className="w-12 h-12 rounded-lg items-center justify-center"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            accessible={true}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
          >
            <Ionicons name="menu" size={24} color="#9CA3AF" />
          </Pressable>

          {/* Title: double-tap to rename */}
          {isEditingTitle ? (
            <TextInput
              value={titleInput}
              onChangeText={setTitleInput}
              autoFocus
              onBlur={commitTitle}
              onSubmitEditing={commitTitle}
              placeholder="Untitled"
              placeholderTextColor="#9CA3AF"
              className="text-4xl font-light text-white"
              style={{ minWidth: 120 }}
            />
          ) : (
            <Pressable
              onPress={() => {
                const now = Date.now();
                if (now - (lastTitleTapRef.current || 0) < 300) {
                  setIsEditingTitle(true);
                  setTitleInput(displayedTitle);
                }
                lastTitleTapRef.current = now;
              }}
            >
              <Text className="text-4xl font-light text-white" numberOfLines={1}>
                {displayedTitle}
              </Text>
            </Pressable>
          )}
        </View>
        
        <View className="flex-row items-center" style={{ gap: 12 }}>
           {/* Freewrite Toggle */}
           <Pressable
             onPress={() => {
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
               
               if (freewrite) {
                 // Switching FROM freewrite TO cards - parse and sync to sections
                 if (freewriteText.trim()) {
                   const parseSections = (text: string) => {
                     const lines = text.split('\n');
                     const parsedSections: { type: string, title?: string, content: string }[] = [];
                     let currentSection: { type: string, title?: string, content: string } | null = null;
                     
                     for (const line of lines) {
                       const trimmedLine = line.trim();
                       const sectionMatch = trimmedLine.match(/^\[([^\]]+)\]$/);
                       
                       if (sectionMatch) {
                         // Save previous section if exists
                         if (currentSection && currentSection.content.trim()) {
                           parsedSections.push(currentSection);
                         }
                         // Start new section
                         const sectionLabel = sectionMatch[1].toLowerCase();
                         const knownTypes = ['verse', 'chorus', 'hook', 'bridge'];
                         const type = knownTypes.includes(sectionLabel) ? sectionLabel : 'verse';
                         const title = !knownTypes.includes(sectionLabel) ? sectionMatch[1] : undefined;
                         currentSection = { type, title, content: '' };
                       } else if (currentSection) {
                         currentSection.content += (currentSection.content ? '\n' : '') + line;
                       } else if (trimmedLine) {
                         // Content without section header - create default verse
                         if (!currentSection) {
                           currentSection = { type: 'verse', content: '' };
                         }
                         currentSection.content += (currentSection.content ? '\n' : '') + line;
                       }
                     }
                     
                     // Add final section
                     if (currentSection && currentSection.content.trim()) {
                       parsedSections.push(currentSection);
                     }
                     
                     return parsedSections;
                   };
                   
                   const parsedSections = parseSections(freewriteText);
                   const currentSections = sections;
                   
                   // Update/create sections based on parsed content
                   parsedSections.forEach((parsed, index) => {
                     if (index < currentSections.length) {
                       // Update existing section
                       const existing = currentSections[index];
                       updateSection(existing.id, parsed.content.trim());
                       if (parsed.title && existing.title !== parsed.title) {
                         updateSectionType(existing.id, parsed.type);
                       }
                     } else {
                       // Create new section
                       const id = addSection(parsed.type);
                       setTimeout(() => {
                         updateSection(id, parsed.content.trim());
                         if (parsed.title) {
                           // Note: would need updateSectionTitle function for custom titles
                         }
                       }, 100 * (index + 1));
                     }
                   });
                   
                   // Clear freewrite text after parsing
                   updateFreewriteTextOriginal('');
                 }
               } else {
                 // Switching FROM cards TO freewrite - load sections into freewrite
                 const currentSections = sections;
                 if (currentSections.length > 0) {
                   // Combine all section content into freewrite
                   const combinedContent = currentSections
                     .map(section => {
                       const title = section.title ? `[${section.title}]` : `[${section.type.toUpperCase()}]`;
                       const content = section.content || '';
                       return content ? `${title}\n${content}` : '';
                     })
                     .filter(content => content.trim())
                     .join('\n\n');
                   
                   if (combinedContent.trim()) {
                     updateFreewriteTextOriginal(combinedContent);
                   }
                 }
               }
               
               setFreewrite(f => !f);
             }}
             className="w-12 h-12 rounded-lg items-center justify-center"
             style={{ backgroundColor: freewrite ? '#374151' : 'rgba(255, 255, 255, 0.05)' }}
             accessible={true}
             accessibilityLabel="Toggle Freewrite View"
             accessibilityRole="button"
           >
             <Ionicons name={freewrite ? 'eye-off' : 'eye'} size={20} color="white" />
           </Pressable>

           {/* Save Button */}
           <Pressable
             onPress={() => {
               Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
               saveCurrentProject();
               setShowSaveToast(true);
               setTimeout(() => setShowSaveToast(false), 2000);
             }}
             className="px-4 py-2 rounded-lg flex-row items-center"
             style={{
               backgroundColor: '#0084FF',
               shadowColor: '#0084FF',
               shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 0.3,
               shadowRadius: 8,
               elevation: 4,
             }}
             accessible={true}
             accessibilityLabel="Save project"
             accessibilityRole="button"
           >
             <Ionicons name="save" size={16} color="white" />
             <Text className="text-white font-medium ml-2 text-sm">save</Text>
           </Pressable>

            {/* Performance View Toggle */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                togglePerformanceMode(true);
              }}
              className="w-12 h-12 rounded-lg items-center justify-center"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              accessible={true}
              accessibilityLabel="Open performance mode"
              accessibilityRole="button"
            >
              <Ionicons name="play" size={24} color="#9CA3AF" />
            </Pressable>
        </View>
      </View>

      {/* Recordings Accordion */}
      {!freewrite && <RecordingsAccordion recordings={recordings} />}

      {/* Conditional Content: Freewrite or Sections */}
      {freewrite ? (
        <View className="flex-1 px-6">
          <TextInput
            style={{
              flex: 1,
              color: '#fff',
              fontSize: 22,
              fontWeight: '300',
              backgroundColor: 'transparent',
              minHeight: 400,
              padding: 16,
              margin: 0,
              borderWidth: 0,
              textAlignVertical: 'top',
            }}
            value={freewriteText}
            onChangeText={updateFreewriteText}
            placeholder="Start writing freely..."
            placeholderTextColor="#666"
            multiline
            autoFocus
            selectionColor="#fff"
          />
        </View>
      ) : (
        <PanGestureHandler onGestureEvent={swipeUpGestureHandler} activeOffsetY={[-40, 40]}>
          <Animated.View className="flex-1">
          <ScrollView 
            ref={scrollRef}
            className="flex-1 px-6" 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* Section Cards */}
            {sections.map((section) => (
              <SectionCard 
                key={section.id} 
                section={section}
                updateSection={updateSection}
                updateSectionType={updateSectionType}
                removeSection={removeSection}
                toggleStarSection={toggleStarSection}
                inputRef={getInputRef(section.id)}
              />
            ))}

            {/* Add Section Button */}
            <AddSectionButton onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const id = addSection("verse");
              requestAnimationFrame(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
                setTimeout(() => {
                  inputRefs.current[id]?.current?.focus?.();
                }, 250);
              });
              setShowAddToast(true);
              setTimeout(() => setShowAddToast(false), 1200);
            }} />

            {sections.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-gray-500 text-center">
                  Tap "add section" to start writing
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Recording Launch Button */}
          <View className="absolute bottom-4 left-0 right-0 items-center">
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                openRecorder();
              }}
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{
                backgroundColor: '#0084FF',
                shadowColor: '#0084FF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
              accessible={true}
              accessibilityLabel="Record"
              accessibilityRole="button"
            >
              <Ionicons name="mic" size={24} color="white" />
            </Pressable>
            <Text className="text-gray-400 text-xs mt-2">Swipe up to record</Text>
          </View>
        </Animated.View>
        </PanGestureHandler>
      )}

      {/* Recording Modal */}
      <RecordingModal />


       {/* Save Toast */}
       {showSaveToast && (
         <View 
           className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-green-600 px-4 py-2 rounded-lg z-50"
           style={{
             shadowColor: '#000',
             shadowOffset: { width: 0, height: 2 },
             shadowOpacity: 0.3,
             shadowRadius: 4,
             elevation: 8,
           }}
         >
           <Text className="text-white font-medium">Project saved!</Text>
         </View>
       )}

       {/* Add Toast */}
       {showAddToast && (
         <View 
           className="absolute top-36 left-1/2 transform -translate-x-1/2 bg-gray-700 px-4 py-2 rounded-lg z-50"
           style={{
             shadowColor: '#000',
             shadowOffset: { width: 0, height: 2 },
             shadowOpacity: 0.3,
             shadowRadius: 4,
             elevation: 8,
           }}
         >
           <Text className="text-white font-medium">Section added</Text>
         </View>
       )}

       {/* Projects Sidebar */}

      <ProjectsSidebar
        visible={showProjectsSidebar}
        onClose={() => setShowProjectsSidebar(false)}
        onNavigateToIdeas={() => setShowIdeasScreen(true)}
        onNavigateToTakes={() => setShowTakesScreen(true)}
        onNavigateToChat={() => setShowChatScreen(true)}
      />

      {/* Ideas Screen */}
      {showIdeasScreen && (
        <View className="absolute inset-0 z-50">
          <IdeasScreen onBack={() => setShowIdeasScreen(false)} />
        </View>
      )}

      {/* Takes Screen */}
      {showTakesScreen && (
        <View className="absolute inset-0 z-50">
          <TakesScreen onBack={() => setShowTakesScreen(false)} />
        </View>
      )}

      {/* Chat Screen */}
      {showChatScreen && (
        <View className="absolute inset-0 z-50">
          <ChatEditorScreen onBack={() => setShowChatScreen(false)} />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <NavigationContainer>
          <MainScreen />
          <StatusBar style="dark" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}