import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLyricStore } from '../state/lyricStore';
import type { Section, Recording } from '../state/lyricStore';
import { Audio } from 'expo-av';
import MumbleRow from "../components/MumbleRow";

interface IdeaCard {
  id: string;
  title: string;
  content: string;
  type: 'lyric' | 'verse' | 'take';
}

export default function IdeasScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'lyrics' | 'verses' | 'takes'>('lyrics');
  const [editingIdea, setEditingIdea] = useState<IdeaCard | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Debug: Add render counter to identify re-renders
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`[IdeasScreen] Render #${renderCount.current}`);

  // ✅ Use store directly to avoid selector loops
  const store = useLyricStore();
  
  // ✅ Memoize store data to prevent unnecessary recalculations
  const recordings = useMemo(() => {
    const currentProjectId = store.currentProjectId ?? '__unassigned__';
    return store.recordingsByProject[currentProjectId] || [];
  }, [store.currentProjectId, store.recordingsByProject]);

  const sections = useMemo(() => {
    const currentProjectId = store.currentProjectId ?? '__unassigned__';
    return store.sectionsByProject[currentProjectId] || [];
  }, [store.currentProjectId, store.sectionsByProject]);

  // ✅ Use ref for store access to avoid subscription loops
  const storeRef = useRef(useLyricStore.getState());
  useEffect(() => {
    const unsubscribe = useLyricStore.subscribe((s) => {
      storeRef.current = s;
    });
    return unsubscribe;
  }, []);

  // --- Takes player state (voice memos style) ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameInput, setRenameInput] = useState("");

  // ✅ Memoize selected recording to prevent unnecessary recalculations
  const selectedRecording = useMemo(() => 
    recordings.find(r => r.id === selectedId) || null, 
    [recordings, selectedId]
  );

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatWhen = (d: Date) => {
    const dt = new Date(d);
    const now = new Date();
    const isSameDay = dt.toDateString() === now.toDateString();
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const isYesterday = dt.toDateString() === yest.toDateString();
    if (isSameDay) return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (isYesterday) return "Yesterday";
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // ✅ Load sound when selected changes - guard against unnecessary updates
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!selectedRecording?.uri || typeof selectedRecording.uri !== 'string') return;
        if (sound) {
          try { await sound.unloadAsync(); } catch {}
          setSound(null);
        }
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: selectedRecording.uri },
          { shouldPlay: false, progressUpdateIntervalMillis: 250 }
        );
        if (cancelled) { try { await newSound.unloadAsync(); } catch {}; return; }
        newSound.setOnPlaybackStatusUpdate((s: any) => {
          if (!s || !s.isLoaded) return;
          setIsPlaying(Boolean(s.isPlaying));
          const pos = s.positionMillis ?? 0; const dur = s.durationMillis ?? 0;
          setCurrentTime(Math.floor(pos / 1000));
          setTotalTime(Math.floor(dur / 1000));
        });
        setSound(newSound);
        const dur = (status as any)?.durationMillis ?? (selectedRecording.duration * 1000) ?? 0;
        setTotalTime(Math.floor(dur / 1000));
        setCurrentTime(0);
      } catch (e) {
        // noop
      }
    };
    load();
    return () => { cancelled = true; if (statusIntervalRef.current) { clearInterval(statusIntervalRef.current); statusIntervalRef.current = null; } };
  }, [selectedId, selectedRecording?.uri, selectedRecording?.duration]);

  // ✅ Fix the problematic effect - only set selectedId when recordings change, not when selectedId changes
  useEffect(() => {
    // Only set selectedId if it's null and we have valid recordings
    if (selectedId == null && recordings.length > 0) {
      const valid = recordings.filter(r => r.uri && typeof r.uri === 'string' && r.uri.trim() !== '');
      if (valid.length > 0) {
        setSelectedId(valid[0].id);
      }
    }
  }, [recordings]); // ✅ Remove selectedId from dependency array

  // ✅ Stabilize handlers to prevent unnecessary re-renders
  const togglePlayPause = useCallback(async () => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded) {
      if (st.isPlaying) { await sound.pauseAsync(); } else { await sound.playAsync(); }
    }
  }, [sound]);

  const seekBy = useCallback(async (deltaSec: number) => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded && st.durationMillis != null) {
      const nextMs = Math.max(0, Math.min((st.positionMillis ?? 0) + deltaSec * 1000, st.durationMillis));
      await sound.setPositionAsync(nextMs);
    }
  }, [sound]);

  const formatRemaining = (current: number, total: number) => {
    const remain = Math.max(0, total - current);
    const m = Math.floor(remain / 60);
    const s = remain % 60;
    return `-${m}:${s.toString().padStart(2, '0')}`;
  };

  // ✅ Use state for local ideas that can be edited
  const [localIdeas, setLocalIdeas] = useState<IdeaCard[]>([
    {
      id: '1',
      title: 'Past vs Future Self',
      content: `A conversation between past and future you.

- Split-screen convo: past vs. future self.
- Tone: emotional or funny contrast.
- Hook: start with a surprising line ("We made it...")`,
      type: 'lyric'
    },
    {
      id: '2',
      title: 'Creative Process',
      content: `Behind the scenes of your creative process.

- Show the messy first drafts
- Time-lapse of writing/recording
- Compare initial idea vs final result`,
      type: 'lyric'
    },
    {
      id: '3',
      title: 'Lyric Breakdown',
      content: `Lyric breakdown series.

- Pick one powerful line
- Explain the story behind it
- Show alternative versions you tried`,
      type: 'lyric'
    },
  ]);

  // ✅ Memoize ideas to prevent recreation on every render
  const ideas = useMemo(() => localIdeas, [localIdeas]);

  // ✅ Memoize derived ideas to prevent recreation on every render
  const recordingIdeas: IdeaCard[] = useMemo(() => 
    recordings.map((recording: Recording) => ({
      id: recording.id,
      title: recording.name,
      content: `Duration: ${Math.floor((recording.duration || 0) / 60)}m\nRecorded: ${new Date(recording.createdAt).toLocaleDateString()}`,
      type: 'take' as const
    })), [recordings]
  );

  const verseIdeas: IdeaCard[] = useMemo(() => 
    sections
      .filter((section: Section) => section.isStarred)
      .map((section: Section) => ({
        id: section.id,
        title: section.title || `${section.type} Section`,
        content: section.content || 'Empty section',
        type: 'verse' as const
      })), [sections]
  );

  // ✅ Memoize combined and filtered ideas
  const allIdeas = useMemo(() => [...ideas, ...recordingIdeas, ...verseIdeas], [ideas, recordingIdeas, verseIdeas]);
  
  const filteredIdeas = useMemo(() => 
    allIdeas.filter(idea => idea.type === (activeTab === 'lyrics' ? 'lyric' : activeTab.slice(0, -1))),
    [allIdeas, activeTab]
  );

  // ✅ Stabilize RecordingRow component with useCallback
  const RecordingRow = useCallback(({
    r,
    isSelected,
    onSelect,
    onEllipsis,
    onToggle,
    onDelete,
    currentTime,
    totalTime,
    isPlaying,
  }: {
    r: { id: string; name: string; createdAt: any; duration?: number };
    isSelected: boolean;
    onSelect: () => void;
    onEllipsis: () => void;
    onToggle: () => void;
    onDelete: () => void;
    currentTime: number;
    totalTime: number;
    isPlaying: boolean;
  }) => {
    return (
      <View>
        {/* List row */}
        <Pressable
          onPress={onSelect}
          className="flex-row items-center justify-between px-4"
          style={{ height: 64, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-white" style={{ fontSize: 17, fontWeight: '600' }} numberOfLines={1}>
              {r.name || 'New Recording'}
            </Text>
            <Text style={{ color: '#9DA3AF', fontSize: 13, marginTop: 2 }}>
              {formatWhen(r.createdAt as any)}
            </Text>
          </View>

          <Text style={{ color: '#9DA3AF', fontSize: 13, marginRight: 6 }}>
            {formatClock(Math.floor(r.duration || 0))}
          </Text>

          <Pressable onPress={onEllipsis} className="w-8 h-8 rounded-full items-center justify-center">
            <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
          </Pressable>
        </Pressable>

        {/* Expanded player under the selected row */}
        {isSelected && (
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: '#0C0C0C' }}>
            {/* Scrubber */}
            <Pressable
              onPress={(e) => {
                const w = (e.nativeEvent as any).source?.width ?? 1;
                const x = (e.nativeEvent as any).locationX ?? 0;
                const ratio = Math.max(0, Math.min(1, x / Math.max(1, w)));
                // Handle seek logic here
              }}
              className="h-6 justify-center"
            >
              <View className="h-1 rounded-full" style={{ backgroundColor: '#2C2C2E' }}>
                <View
                  className="h-1 rounded-full"
                  style={{
                    width: `${totalTime ? (currentTime / totalTime) * 100 : 0}%`,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              </View>
              <View className="flex-row justify-between mt-4">
                <Text style={{ color: '#9DA3AF', fontSize: 12 }}>{formatClock(currentTime)}</Text>
                <Text style={{ color: '#9DA3AF', fontSize: 12 }}>{formatRemaining(currentTime, totalTime)}</Text>
              </View>
            </Pressable>

            {/* Controls */}
            <View className="flex-row items-center justify-between mt-10">
              <Pressable
                onPress={() => seekBy(-15)}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E' }}
                className="items-center justify-center"
              >
                <Ionicons name="play-back" size={18} color="#E5E7EB" />
              </Pressable>

              <Pressable
                onPress={onToggle}
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' }}
                className="items-center justify-center"
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#111827" />
              </Pressable>

              <Pressable
                onPress={() => seekBy(15)}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E' }}
                className="items-center justify-center"
              >
                <Ionicons name="play-forward" size={18} color="#E5E7EB" />
              </Pressable>

              <Pressable
                onPress={onDelete}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E' }}
                className="items-center justify-center"
              >
                <Ionicons name="trash" size={18} color="#3B82F6" />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  }, [seekBy]);

  // ✅ Memoize renderTakes function
  const renderTakes = useCallback(() => {
    const items = recordings
      .filter(r => r.uri && typeof r.uri === 'string' && r.uri.trim() !== '')
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (items.length === 0) {
      return (
        <View className="items-center py-20">
          <Text className="text-gray-300 text-lg mb-2">No recordings yet</Text>
          <Text className="text-gray-500 text-sm">Record your first MUMBL from the editor</Text>
        </View>
      );
    }

    return (
      <View style={{ width: '100%' }}>
        {/* Large iOS title */}
        <Text className="text-white font-bold mb-2" style={{ fontSize: 34 }}>All Recordings</Text>

        <ScrollView style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#0B0B0B' }}>
          {items.map((r) => (
            <MumbleRow
              key={r.id}
              r={r}
              isSelected={selectedId === r.id}
              onSelect={() => setSelectedId(r.id)}
              onEllipsis={() => { setSelectedId(r.id); setActionsId(r.id); setRenameInput(r.name); }}
              onToggle={togglePlayPause}
              onDelete={() => store.removeRecording(r.id)}
              currentTime={selectedId === r.id ? currentTime : 0}
              totalTime={selectedId === r.id ? totalTime : Math.floor(r.duration || 0)}
              isPlaying={selectedId === r.id ? isPlaying : false}
              onSeekBy={seekBy}
            />
          ))}
        </ScrollView>

        {/* Spacer so the red button doesn't cover last row */}
        <View style={{ height: 120 }} />
      </View>
    );
  }, [recordings, selectedId, togglePlayPause, store, currentTime, totalTime, isPlaying, RecordingRow]);

  // ✅ Stabilize all handlers with useCallback
  const openProjectFromIdea = useCallback((idea: IdeaCard) => {
    const { projects, createProject, loadProject } = storeRef.current;
    // Find by name
    const existing = projects.find(p => p.name === idea.title);
    if (existing) {
      loadProject(existing.id);
    } else {
      createProject(idea.title);
      // After creation, just load the most recent project
      const newProjects = useLyricStore.getState().projects;
      if (newProjects.length > 0) {
        loadProject(newProjects[0].id);
      }
    }
    onBack();
  }, [onBack]);

  const handleEditIdea = useCallback((idea: IdeaCard) => {
    if (idea.type === 'take') {
      Alert.alert('Cannot Edit Recording', 'Recordings cannot be edited. You can delete and record again.');
      return;
    }
    // For local ideas, open edit modal
    if (idea.type === 'lyric') {
      setEditingIdea(idea);
      setEditTitle(idea.title);
      setEditContent(idea.content);
    } else {
      // For verses, open in editor as requested
      openProjectFromIdea(idea);
    }
  }, [openProjectFromIdea]);

  const handleSaveEdit = useCallback(() => {
    if (!editingIdea) return;

    setLocalIdeas(prevIdeas => 
      prevIdeas.map(idea => 
        idea.id === editingIdea.id 
          ? { ...idea, title: editTitle.trim(), content: editContent.trim() }
          : idea
      )
    );
    setEditingIdea(null);
    setEditTitle('');
    setEditContent('');
  }, [editingIdea, editTitle, editContent]);

  const handleDeleteIdea = useCallback((ideaId: string, ideaTitle: string, ideaType: 'lyric' | 'verse' | 'take') => {
    Alert.alert(
      'Delete Idea',
      `Are you sure you want to delete "${ideaTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (ideaType === 'take') {
              // Delete recording from store
              store.removeRecording(ideaId);
            } else if (ideaType === 'verse') {
              // Delete section from store
              const { removeSection } = useLyricStore.getState();
              removeSection(ideaId);
            } else {
              // Delete local idea
              setLocalIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));
            }
          },
        },
      ]
    );
  }, [store]);

  // ✅ Stabilize FAB handlers
  const handleFabRecord = useCallback(() => {
    const s = useLyricStore.getState();
    if (!s.currentProjectId) s.createProject?.('Untitled');
    s.toggleRecordingModal?.(true);
  }, []);
  
  const handleFabNewVerse = useCallback(() => useLyricStore.getState().addSection?.('verse'), []);
  const handleFabConvert = useCallback(() => {/* No-op: saveCurrentProject is not in project-scoped API */}, []);
  const handleFabNewProject = useCallback(() => {
    const s = useLyricStore.getState();
    const name = 'Untitled ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    s.createProject?.(name);
    // optionally route to editor here
  }, []);

  // ✅ Stabilize tab change handler
  const handleTabChange = useCallback((tab: 'lyrics' | 'verses' | 'takes') => {
    setActiveTab(tab);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-900" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-6">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-full items-center justify-center mr-2" style={{ backgroundColor: "#1F2937" }}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text className="text-4xl font-bold text-white" style={{ fontSize: 34, fontWeight: '700', flex: 1 }}>Ideas</Text>
        <View className="w-10 h-10 bg-gray-600 rounded-full items-center justify-center">
          <Text className="text-white font-bold text-sm">A</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-4 mb-8 justify-center">
        {[
          { key: 'lyrics', label: 'LYRIQS', icon: 'document-outline' },
          { key: 'verses', label: 'VERSES', icon: 'list-outline' },
          { key: 'takes', label: 'MUMBLs', icon: 'mic-outline' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key as any)}
            className="items-center mx-2"
            style={{ flex: 1 }}
          >
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: activeTab === tab.key ? '#fff' : '#E5E7EB',
              backgroundColor: activeTab === tab.key ? '#fff1' : '#fff0',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}>
              <Ionicons
                name={tab.icon as any}
                size={28}
                color={activeTab === tab.key ? '#fff' : '#E5E7EB'}
                style={{ fontWeight: '300' }}
              />
            </View>
            <Text style={{ color: activeTab === tab.key ? '#fff' : '#E5E7EB', fontSize: 14, fontWeight: '500', marginTop: 2 }}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}
      >
        {activeTab !== 'takes' && filteredIdeas.length > 0 && (
          <View
            key={filteredIdeas[0].id}
            style={{
              backgroundColor: '#FEF08A',
              borderRadius: 24,
              padding: 24,
              marginTop: 12,
              marginBottom: 32,
              minWidth: 280,
              maxWidth: 340,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.10,
              shadowRadius: 8,
              elevation: 3,
              alignItems: 'flex-start',
              position: 'relative',
            }}
          >
            <Text style={{ color: '#222', fontWeight: '600', fontSize: 17, marginBottom: 8 }}>{filteredIdeas[0].title}</Text>
            <Text style={{ color: '#222', fontSize: 15, lineHeight: 22 }}>{filteredIdeas[0].content}</Text>
            
            {/* Action buttons */}
            <View className="flex-row gap-2 mt-4">
              <Pressable
                onPress={() => handleEditIdea(filteredIdeas[0])}
                className="px-3 py-2 bg-blue-600 rounded-lg"
              >
                <Text className="text-white text-sm font-medium">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => handleDeleteIdea(filteredIdeas[0].id, filteredIdeas[0].title, filteredIdeas[0].type)}
                className="px-3 py-2 bg-red-600 rounded-lg"
              >
                <Text className="text-white text-sm font-medium">Delete</Text>
              </Pressable>
            </View>
            
            {/* Folded corner */}
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 0,
              height: 0,
              borderLeftWidth: 28,
              borderBottomWidth: 28,
              borderLeftColor: 'transparent',
              borderBottomColor: '#FDE047',
              borderBottomRightRadius: 8,
            }} />
          </View>
        )}
        {activeTab !== 'takes' && filteredIdeas.length === 0 && (
          <View className="items-center py-20">
            <Text className="text-gray-300 text-lg mb-2">No {activeTab} yet</Text>
            <Text className="text-gray-500 text-sm">
              {activeTab === 'verses'
                ? 'Star some sections in the editor to see them here'
                : 'Tap the + button to create your first idea'}
            </Text>
          </View>
        )}
        {activeTab === 'takes' && renderTakes()}
      </ScrollView>
 
      {/* Actions Sheet */}
      <Modal visible={actionsId != null} transparent animationType="fade" onRequestClose={() => setActionsId(null)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setActionsId(null)} />
        <View className="absolute left-0 right-0 bottom-0 bg-gray-900 rounded-t-3xl p-4">
          <Pressable onPress={() => { setRenameVisible(true); }} className="p-4 rounded-2xl bg-gray-800 mb-2">
            <Text className="text-white text-center">Rename</Text>
          </Pressable>
          <Pressable onPress={() => { if (actionsId) store.removeRecording(actionsId); setActionsId(null); }} className="p-4 rounded-2xl bg-red-600">
            <Text className="text-white text-center">Delete</Text>
          </Pressable>
        </View>
      </Modal>
 
      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="slide" onRequestClose={() => setRenameVisible(false)}>
        <View className="flex-1 justify-center bg-black/50 p-6">
          <View className="bg-gray-800 rounded-2xl p-6">
            <Text className="text-white text-xl font-bold mb-4">Rename Recording</Text>
            <TextInput value={renameInput} onChangeText={setRenameInput} placeholder="Enter name" placeholderTextColor="#6B7280" className="bg-gray-700 text-white p-4 rounded-xl mb-4" />
            <View className="flex-row gap-3">
              <Pressable onPress={() => { setRenameVisible(false); setActionsId(null); }} className="flex-1 bg-gray-600 p-4 rounded-xl">
                <Text className="text-white text-center">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { if (actionsId) store.updateRecordingName(actionsId, renameInput.trim() || "MUMBL"); setRenameVisible(false); setActionsId(null); }} className="flex-1 bg-blue-600 p-4 rounded-xl">
                <Text className="text-white text-center">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
 
      {/* Edit Modal */}
      <Modal
        visible={!!editingIdea}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingIdea(null)}
      >
        <View className="flex-1 justify-center bg-black/50 p-6">
          <View className="bg-gray-800 rounded-2xl p-6 max-h-96">
            <Text className="text-white text-xl font-bold mb-4">Edit Idea</Text>
            
            <Text className="text-gray-300 text-sm mb-2">Title</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter title..."
              placeholderTextColor="#6B7280"
              className="bg-gray-700 text-white p-4 rounded-xl mb-4 text-base"
              autoFocus
            />
            
            <Text className="text-gray-300 text-sm mb-2">Content</Text>
            <TextInput
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Enter content..."
              placeholderTextColor="#6B7280"
              className="bg-gray-700 text-white p-4 rounded-xl mb-6 text-base"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setEditingIdea(null)}
                className="flex-1 bg-gray-600 p-4 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={handleSaveEdit}
                className="flex-1 bg-blue-600 p-4 rounded-xl"
              >
                <Text className="text-white text-center font-medium">
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}