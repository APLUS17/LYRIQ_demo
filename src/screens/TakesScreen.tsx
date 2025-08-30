import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, Platform, AccessibilityInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
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
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: "#232326" }}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text className="text-3xl font-bold text-white" style={{ flex: 1, fontSize: 28 }}>All MUMBLs</Text>
      </View>
      {/* Content */}
      {items.length === 0 ? (
        <View className="items-center py-20 px-6">
          <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
          <Text className="text-gray-300 text-lg mt-3">No recordings yet</Text>
          <Text className="text-gray-500 text-sm mt-1 text-center">Record your first MUMBL from the editor</Text>
        </View>
      ) : (
        <ScrollView style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "#0B0B0B", marginHorizontal: 12 }}>
          {items.map((r, idx) => (
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
            />
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
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
      {/* Record New Button */}
      <View style={{ position: "absolute", bottom: 32, left: 0, right: 0, alignItems: "center", pointerEvents: "box-none" }} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Record new take"
          className="flex-row items-center gap-3 px-8 py-4 rounded-2xl"
          style={{ backgroundColor: "#3B82F6", shadowColor: "#3B82F6", shadowOpacity: 0.3, shadowRadius: 12 }}
          onPress={() => Alert.alert("Record New", "Recording new take (not implemented)")}
        >
          <Ionicons name="mic-outline" size={24} color="#FFF" />
          <Text className="text-white font-semibold text-lg">Record New</Text>
        </Pressable>
      </View>
    </View>
  );
}
