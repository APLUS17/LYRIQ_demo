import React, { useState, useEffect, useRef } from 'react';
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
import { Audio } from 'expo-av';

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
  
  // Get recordings from the store
  const { recordings, sections, removeRecording, updateRecordingName } = useLyricStore();
  const storeRef = useRef(useLyricStore.getState());
  useEffect(() => useLyricStore.subscribe((s) => (storeRef.current = s)), []);

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

  const selectedRecording = recordings.find(r => r.id === selectedId) || null;

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
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

  // Load sound when selected changes
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
  }, [selectedId]);

  useEffect(() => {
    // default select most recent valid recording on tab open
    if (selectedId == null && recordings.length > 0) {
      const valid = recordings.filter(r => r.uri && typeof r.uri === 'string' && r.uri.trim() !== '');
      if (valid.length > 0) setSelectedId(valid[0].id);
    }
  }, [recordings, selectedId]);

  const togglePlayPause = async () => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded) {
      if (st.isPlaying) { await sound.pauseAsync(); } else { await sound.playAsync(); }
    }
  };

  const seekBy = async (deltaSec: number) => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded && st.durationMillis != null) {
      const nextMs = Math.max(0, Math.min((st.positionMillis ?? 0) + deltaSec * 1000, st.durationMillis));
      await sound.setPositionAsync(nextMs);
    }
  };

  const [ideas, setIdeas] = useState<IdeaCard[]>([
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

  // Convert recordings to idea format for takes tab
  const recordingIdeas: IdeaCard[] = recordings.map(recording => ({
    id: recording.id,
    title: recording.name,
    content: `Duration: ${Math.floor((recording.duration || 0) / 60)}m\nRecorded: ${new Date(recording.createdAt).toLocaleDateString()}`,
    type: 'take' as const
  }));


  // Convert sections to idea format for verses tab  
  const verseIdeas: IdeaCard[] = sections
    .filter(section => section.isStarred)
    .map(section => ({
      id: section.id,
      title: section.title || `${section.type} Section`,
      content: section.content || 'Empty section',
      type: 'verse' as const
    }));

  // Combine all ideas
  const allIdeas = [...ideas, ...recordingIdeas, ...verseIdeas];
  
  const filteredIdeas = allIdeas.filter(idea => idea.type === (activeTab === 'lyrics' ? 'lyric' : activeTab.slice(0, -1)));

  const renderTakes = () => {
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
      <>
        {/* Large Title */}
        <Text className="text-white font-bold mb-4" style={{ fontSize: 34 }}>All Recordings</Text>

        {/* Recording Rows */}
        <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111" }}>
          {items.map((r, idx) => (
            <Pressable
              key={r.id}
              onPress={() => setSelectedId(r.id)}
              className={`flex-row items-center justify-between px-4 ${idx !== items.length - 1 ? "border-b border-gray-800" : ""}`}
              style={{ height: 56 }}
            >
              <View className="flex-1 pr-3">
                <Text className="text-white text-base font-medium" numberOfLines={1}>{r.name}</Text>
                <Text className="text-gray-500 text-xs mt-1">{formatWhen(r.createdAt as any)}</Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Text className="text-gray-400 text-sm">{formatClock(Math.floor(r.duration || 0))}</Text>
                <Pressable onPress={() => { setSelectedId(r.id); setActionsId(r.id); setRenameInput(r.name); }} className="w-8 h-8 rounded-full items-center justify-center">
                  <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Spacer for bottom dock */}
        <View style={{ height: 120 }} />
      </>
    );
  };

  const tabs = [
    { key: 'lyrics', label: 'Lyrics', icon: 'musical-notes-outline' },
    { key: 'verses', label: 'Verses', icon: 'list-outline' },
    { key: 'takes', label: 'Takes', icon: 'mic-outline' },
  ];

  const openProjectFromIdea = (idea: IdeaCard) => {
    const { projects, createProject, loadProject } = storeRef.current;
    // Find by name
    const existing = projects.find(p => p.name === idea.title);
    if (existing) {
      loadProject(existing.id);
    } else {
      createProject(idea.title);
      const newProject = useLyricStore.getState().currentProject;
      if (newProject) {
        loadProject(newProject.id);
      }
    }
    onBack();
  };

  const handleEditIdea = (idea: IdeaCard) => {
    if (idea.type === 'take') {
      Alert.alert('Cannot Edit Recording', 'Recordings cannot be edited. You can delete and record again.');
      return;
    }
    // For lyrics and verses, open in editor as requested
    openProjectFromIdea(idea);
  };

  const handleSaveEdit = () => {
    if (!editingIdea) return;

    setIdeas(prevIdeas => 
      prevIdeas.map(idea => 
        idea.id === editingIdea.id 
          ? { ...idea, title: editTitle.trim(), content: editContent.trim() }
          : idea
      )
    );
    setEditingIdea(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleDeleteIdea = (ideaId: string, ideaTitle: string, ideaType: 'lyric' | 'verse' | 'take') => {
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
              const { removeRecording } = useLyricStore.getState();
              removeRecording(ideaId);
            } else if (ideaType === 'verse') {
              // Delete section from store
              const { removeSection } = useLyricStore.getState();
              removeSection(ideaId);
            } else {
              // Delete local idea
              setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-6">
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-4xl font-bold text-white" style={{ fontSize: 34, fontWeight: '700' }}>Ideas</Text>
        <View className="w-10 h-10 bg-gray-600 rounded-full items-center justify-center">
          <Text className="text-white font-bold text-sm">A</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-4 mb-8">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            className={`flex-1 items-center py-4 mx-2 rounded-2xl ${
              activeTab === tab.key ? 'bg-gray-700' : 'bg-gray-800'
            }`}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-2 ${
              activeTab === tab.key ? 'bg-white' : 'bg-gray-700'
            }`}>
              <Ionicons 
                name={tab.icon as any} 
                size={20} 
                color={activeTab === tab.key ? '#111827' : '#9CA3AF'} 
              />
            </View>
            <Text className={`text-sm font-medium ${
              activeTab === tab.key ? 'text-white' : 'text-gray-400'
            }`}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {activeTab === 'takes' ? (
          renderTakes()
        ) : filteredIdeas.map((idea) => (
          <View
            key={idea.id}
            className="bg-yellow-200 p-6 rounded-3xl mb-5 relative"
            style={{ 
              marginHorizontal: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}
          >
            {/* Action Buttons */}
            <View className="absolute top-4 right-4 flex-row gap-2">
              <Pressable
                onPress={() => handleEditIdea(idea)}
                className="w-7 h-7 bg-yellow-300 rounded-full items-center justify-center"
              >
                <Ionicons name="pencil" size={14} color="#000" />
              </Pressable>
              <Pressable
                onPress={() => handleDeleteIdea(idea.id, idea.title, idea.type)}
                className="w-7 h-7 bg-red-400 rounded-full items-center justify-center"
              >
                <Ionicons name="trash" size={14} color="#fff" />
              </Pressable>
            </View>

            <Text className="text-black text-lg font-semibold mb-3 pr-16" style={{ lineHeight: 24 }}>
              {idea.title}
            </Text>
            <Text className="text-black text-base leading-6" style={{ lineHeight: 22 }}>
              {idea.content}
            </Text>
            {/* Corner fold effect */}
            <View className="absolute bottom-0 right-0" style={{
              width: 0,
              height: 0,
              borderLeftWidth: 20,
              borderBottomWidth: 20,
              borderLeftColor: 'transparent',
              borderBottomColor: '#FDE047'
            }} />
          </View>
        ))}

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
      </ScrollView>

      {/* Bottom Player Dock (Takes only) */}
      {activeTab === 'takes' && (
        <View className="absolute left-0 right-0" style={{ bottom: Math.max(insets.bottom, 16) }}>
          <View className="px-4">
            {/* Scrubber */}
            <Pressable
              onPress={(e) => {
                const width = 320; // approx
                const x = (e.nativeEvent as any).locationX || 0;
                const next = Math.max(0, Math.min(1, x / width));
                const newSec = Math.floor((totalTime || 0) * next);
                setCurrentTime(newSec);
                setTimeout(() => seekBy(0), 0);
              }}
              className="h-6 justify-center"
            >
              <View className="h-1 rounded-full bg-gray-700 overflow-hidden">
                <View style={{ width: `${Math.min(100, Math.max(0, (totalTime ? (currentTime / totalTime) : 0) * 100))}%` }} className="h-1 bg-emerald-500" />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-gray-400 text-xs">{formatClock(currentTime)}</Text>
                <Text className="text-gray-400 text-xs">{formatClock(totalTime)}</Text>
              </View>
            </Pressable>

            {/* Controls */}
            <View className="flex-row items-center justify-between mt-3">
              <Ionicons name="analytics-outline" size={20} color="#9CA3AF" />
              <Pressable onPress={() => seekBy(-15)} className="w-11 h-11 rounded-full bg-gray-800 items-center justify-center">
                <Ionicons name="play-back" size={18} color="#E5E7EB" />
              </Pressable>
              <Pressable onPress={togglePlayPause} className="w-14 h-14 rounded-full bg-white items-center justify-center">
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#111827" />
              </Pressable>
              <Pressable onPress={() => seekBy(15)} className="w-11 h-11 rounded-full bg-gray-800 items-center justify-center">
                <Ionicons name="play-forward" size={18} color="#E5E7EB" />
              </Pressable>
              <Pressable onPress={() => { if (selectedRecording) removeRecording(selectedRecording.id); }} className="w-11 h-11 rounded-full bg-gray-800 items-center justify-center">
                <Ionicons name="trash" size={18} color="#3B82F6" />
              </Pressable>
            </View>
          </View>
        </View>
      )}

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
        <View className="flex-1 justify-center bg-black/50 p-6">
          <View className="bg-gray-800 rounded-2xl p-6">
            <Text className="text-white text-xl font-bold mb-4">Rename Recording</Text>
            <TextInput value={renameInput} onChangeText={setRenameInput} placeholder="Enter name" placeholderTextColor="#6B7280" className="bg-gray-700 text-white p-4 rounded-xl mb-4" />
            <View className="flex-row gap-3">
              <Pressable onPress={() => { setRenameVisible(false); setActionsId(null); }} className="flex-1 bg-gray-600 p-4 rounded-xl">
                <Text className="text-white text-center">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => { if (actionsId) updateRecordingName(actionsId, renameInput.trim() || "MUMBL"); setRenameVisible(false); setActionsId(null); }} className="flex-1 bg-blue-600 p-4 rounded-xl">
                <Text className="text-white text-center">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Add Button */}
      <View className="absolute bottom-8 right-6">


        <Pressable 
          onPress={onBack}
          className="w-16 h-16 bg-gray-800 rounded-3xl items-center justify-center"
          style={{ 
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}
        >
          <Ionicons name="add" size={32} color="white" />
        </Pressable>
      </View>

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