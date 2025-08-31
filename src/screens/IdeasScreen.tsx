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
import * as Haptics from 'expo-haptics';
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

  // Granular selectors to prevent broad subscriptions
  const currentProjectId = useLyricStore(s => s.currentProjectId ?? '__unassigned__');
  const recordingsByProject = useLyricStore(s => s.recordingsByProject);
  const sectionsByProject = useLyricStore(s => s.sectionsByProject);
  const removeRecording = useLyricStore(s => s.removeRecording);
  const updateRecordingName = useLyricStore(s => s.updateRecordingName);

  // Derive lists for current project
  const recordings = useMemo(() => recordingsByProject[currentProjectId] ?? [], [recordingsByProject, currentProjectId]);
  const sections = useMemo(() => sectionsByProject[currentProjectId] ?? [], [sectionsByProject, currentProjectId]);

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

  const seekTo = useCallback(async (seconds: number) => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded && st.durationMillis != null) {
      const targetMs = Math.max(0, Math.min(seconds * 1000, st.durationMillis));
      await sound.setPositionAsync(targetMs);
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
              onDelete={() => removeRecording(r.id)}
              currentTime={selectedId === r.id ? currentTime : 0}
              totalTime={selectedId === r.id ? totalTime : Math.floor(r.duration || 0)}
              isPlaying={selectedId === r.id ? isPlaying : false}
              onSeekBy={seekBy}
              onSeekTo={seekTo}
            />
          ))}
        </ScrollView>

        {/* Spacer so the red button doesn't cover last row */}
        <View style={{ height: 120 }} />
      </View>
    );
  }, [recordings, selectedId, togglePlayPause, currentTime, totalTime, isPlaying, RecordingRow]);

  // ✅ Stabilize all handlers with useCallback
  const openProjectFromIdea = useCallback((idea: IdeaCard) => {
    const s = useLyricStore.getState();
    const existing = s.projects.find((p: any) => p.name === idea.title);
    if (existing) {
      s.loadProject(existing.id);
    } else {
      s.createProject(idea.title);
      const after = useLyricStore.getState();
      if (after.projects.length > 0) {
        after.loadProject(after.projects[0].id);
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
                  removeRecording(ideaId);
                } else if (ideaType === 'verse') {
                  const { removeSection } = useLyricStore.getState();
                  removeSection(ideaId);
                } else {
                  setLocalIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));
                }
              },
        },
      ]
    );
  }, [removeRecording]);

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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#000000', paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-6">
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }} 
          className="w-12 h-12 rounded-full items-center justify-center mr-4" 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          accessible={true}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-4xl font-light text-white tracking-wide" style={{ flex: 1 }}>Ideas</Text>
        <View className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center">
          <Text className="text-white font-bold text-sm">A</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-6 mb-8 justify-center">
        {[
          { key: 'lyrics', label: 'LYRIQS', icon: 'document-outline' },
          { key: 'verses', label: 'VERSES', icon: 'list-outline' },
          { key: 'takes', label: 'MUMBLs', icon: 'mic-outline' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleTabChange(tab.key as any);
            }}
            className="items-center mx-2"
            style={{ flex: 1 }}
            accessible={true}
            accessibilityLabel={`${tab.label} tab`}
            accessibilityRole="tab"
          >
            <View style={{
              width: 96,
              height: 64,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: activeTab === tab.key ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
              backgroundColor: activeTab === tab.key ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={activeTab === tab.key ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
              />
            </View>
            <Text style={{ 
              color: activeTab === tab.key ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)', 
              fontSize: 12, 
              fontWeight: '500' 
            }}>{tab.label}</Text>
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
              backgroundColor: '#1A1A1A',
              borderRadius: 24,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              padding: 32,
              marginTop: 12,
              marginBottom: 32,
              minWidth: 280,
              maxWidth: 340,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 20, marginBottom: 16 }}>{filteredIdeas[0].title}</Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, lineHeight: 24 }}>{filteredIdeas[0].content}</Text>
            
            {/* Action buttons */}
            <View className="flex-row gap-3 mt-6">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleEditIdea(filteredIdeas[0]);
                }}
                style={{
                  backgroundColor: '#0084FF',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                accessible={true}
                accessibilityLabel="Edit idea"
                accessibilityRole="button"
              >
                <Text className="text-white text-sm font-medium">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openProjectFromIdea(filteredIdeas[0]);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                accessible={true}
                accessibilityLabel="Use idea"
                accessibilityRole="button"
              >
                <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }} className="text-sm font-medium">Use</Text>
              </Pressable>
            </View>
          </View>
        )}
        {activeTab !== 'takes' && filteredIdeas.length === 0 && (
          <View className="items-center py-20">
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 18, marginBottom: 8 }}>No {activeTab} yet</Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 14, textAlign: 'center' }}>
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
          <Pressable onPress={() => { if (actionsId) removeRecording(actionsId); setActionsId(null); }} className="p-4 rounded-2xl bg-red-600">
            <Text className="text-white text-center">Delete</Text>
          </Pressable>
        </View>
      </Modal>
 
      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="slide" onRequestClose={() => setRenameVisible(false)}>
        <View className="flex-1 justify-center bg-black/80 p-6">
          <View style={{ backgroundColor: '#0A0A0A', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Text className="text-white text-xl font-semibold mb-4">Rename Recording</Text>
            <TextInput 
              value={renameInput} 
              onChangeText={setRenameInput} 
              placeholder="Enter name" 
              placeholderTextColor="rgba(255, 255, 255, 0.4)" 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                color: '#FFFFFF', 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }} 
            />
            <View className="flex-row gap-3">
              <Pressable 
                onPress={() => { 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRenameVisible(false); 
                  setActionsId(null); 
                }} 
                style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 16, borderRadius: 12 }}
                accessible={true}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text className="text-white text-center font-medium">Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={() => { 
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  if (actionsId) updateRecordingName(actionsId, renameInput.trim() || "MUMBL"); 
                  setRenameVisible(false); 
                  setActionsId(null); 
                }} 
                style={{ flex: 1, backgroundColor: '#0084FF', padding: 16, borderRadius: 12 }}
                accessible={true}
                accessibilityLabel="Save"
                accessibilityRole="button"
              >
                <Text className="text-white text-center font-medium">Save</Text>
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
        <View className="flex-1 justify-center bg-black/80 p-6">
          <View style={{ backgroundColor: '#0A0A0A', borderRadius: 16, padding: 24, maxHeight: 400, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Text className="text-white text-xl font-semibold mb-6">Edit Idea</Text>
            
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginBottom: 8 }}>Title</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter title..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
              autoFocus
            />
            
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginBottom: 8 }}>Content</Text>
            <TextInput
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Enter content..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
                fontSize: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                minHeight: 120,
                textAlignVertical: 'top'
              }}
              multiline
            />
            
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingIdea(null);
                }}
                style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 16, borderRadius: 12 }}
                accessible={true}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text className="text-white text-center font-medium">
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  handleSaveEdit();
                }}
                style={{ flex: 1, backgroundColor: '#0084FF', padding: 16, borderRadius: 12 }}
                accessible={true}
                accessibilityLabel="Save"
                accessibilityRole="button"
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