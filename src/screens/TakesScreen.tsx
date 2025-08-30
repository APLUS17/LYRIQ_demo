import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, Platform, AccessibilityInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from 'expo-haptics';
import { useLyricStore } from "../state/lyricStore";
import type { Recording } from "../state/lyricStore";
import MumbleRow from "../components/MumbleRow";

export default function TakesScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  // Use optimized selectors
  const recordings = useLyricStore(s => {
    const currentProjectId = s.currentProjectId ?? "__unassigned__";
    return s.recordingsByProject[currentProjectId] ?? [];
  });
  const removeRecording = useLyricStore(s => s.removeRecording);
  const updateRecordingName = useLyricStore(s => s.updateRecordingName);

  // Playback state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameInput, setRenameInput] = useState("");

  const validRecordings = useMemo(
    () => recordings.filter(r => r.uri && typeof r.uri === "string" && r.uri.trim() !== ""),
    [recordings]
  );

  // Load sound when selection changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!selectedId) return;
        const rec = validRecordings.find(r => r.id === selectedId);
        if (!rec?.uri) return;
        if (sound) {
          try { await sound.unloadAsync(); } catch {}
          setSound(null);
        }
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: rec.uri },
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
        const dur = (status as any)?.durationMillis ?? (rec.duration * 1000) ?? 0;
        setTotalTime(Math.floor(dur / 1000));
        setCurrentTime(0);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [selectedId, validRecordings.map(r => r.id).join(","), validRecordings.map(r => r.uri).join(",")]);

  // Select first valid on mount if none selected
  useEffect(() => {
    if (selectedId == null && validRecordings.length > 0) {
      setSelectedId(validRecordings[0].id);
    }
  }, [validRecordings, selectedId]);

  const togglePlayPause = useCallback(async () => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if ("isLoaded" in st && st.isLoaded) {
      if (st.isPlaying) { await sound.pauseAsync(); } else { await sound.playAsync(); }
    }
  }, [sound]);

  const seekBy = useCallback(async (deltaSec: number) => {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if ("isLoaded" in st && st.isLoaded && st.durationMillis != null) {
      const nextMs = Math.max(0, Math.min((st.positionMillis ?? 0) + deltaSec * 1000, st.durationMillis));
      await sound.setPositionAsync(nextMs);
    }
  }, [sound]);

  // Sorting: newest first
  const items = useMemo(() => (
    validRecordings.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  ), [validRecordings]);

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-6 pb-6">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-4xl font-light text-white tracking-wide" style={{ flex: 1 }}>All MUMBLs</Text>
      </View>
      {/* Content */}
      {items.length === 0 ? (
        <View className="items-center py-20 px-6">
          <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
          <Text className="text-gray-300 text-lg mt-3">No recordings yet</Text>
          <Text className="text-gray-500 text-sm mt-1 text-center">Record your first MUMBL from the editor</Text>
        </View>
      ) : (
        <ScrollView 
          className="px-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {items.map((r, idx) => (
            <View 
              key={r.id}
              style={{
                backgroundColor: '#0A0A0A',
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}
            >
              <MumbleRow
                r={r}
                isSelected={selectedId === r.id}
                onSelect={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedId(r.id);
                }}
                onEllipsis={() => { 
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedId(r.id); 
                  setActionsId(r.id); 
                  setRenameInput(r.name); 
                }}
                onToggle={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  togglePlayPause();
                }}
                onDelete={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  removeRecording(r.id);
                }}
                currentTime={selectedId === r.id ? currentTime : 0}
                totalTime={selectedId === r.id ? totalTime : Math.floor(r.duration || 0)}
                isPlaying={selectedId === r.id ? isPlaying : false}
                onSeekBy={seekBy}
              />
            </View>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
      {/* Actions Sheet */}
      <Modal visible={actionsId != null} transparent animationType="fade" onRequestClose={() => setActionsId(null)}>
        <Pressable className="flex-1 bg-black/80" onPress={() => setActionsId(null)} />
        <View style={{ 
          position: 'absolute', 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: '#0A0A0A', 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24, 
          padding: 16,
          borderTopWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <Pressable 
            onPress={() => { 
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRenameVisible(true); 
            }} 
            style={{ 
              padding: 16, 
              borderRadius: 16, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              marginBottom: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }}
            accessible={true}
            accessibilityLabel="Rename recording"
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-medium">Rename</Text>
          </Pressable>
          <Pressable 
            onPress={() => { 
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              if (actionsId) removeRecording(actionsId); 
              setActionsId(null); 
            }} 
            style={{ 
              padding: 16, 
              borderRadius: 16, 
              backgroundColor: '#DC2626' 
            }}
            accessible={true}
            accessibilityLabel="Delete recording"
            accessibilityRole="button"
          >
            <Text className="text-white text-center font-medium">Delete</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="slide" onRequestClose={() => setRenameVisible(false)}>
        <View className="flex-1 justify-center bg-black/80 p-6">
          <View style={{ 
            backgroundColor: '#0A0A0A', 
            borderRadius: 16, 
            padding: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
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
      {/* Record New Button */}
      <View style={{ position: "absolute", bottom: 32, left: 0, right: 0, alignItems: "center", pointerEvents: "box-none" }} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Record new take"
          className="flex-row items-center gap-3 px-8 py-4 rounded-2xl"
          style={{ 
            backgroundColor: '#0084FF', 
            shadowColor: '#0084FF', 
            shadowOpacity: 0.4, 
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 }
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            const { toggleRecordingModal } = useLyricStore.getState();
            toggleRecordingModal(true);
          }}
        >
          <Ionicons name="mic-outline" size={24} color="#FFF" />
          <Text className="text-white font-semibold text-lg">Record New</Text>
        </Pressable>
      </View>
    </View>
  );
}
