// PerformanceViewGlass.ios.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLyricStore } from '../state/lyricStore';

type LyricLine = { time: string; text: string };

const WAVE_HEIGHTS = [
  8, 16, 12, 24, 32, 20, 28, 36, 18, 22, 40, 26, 14, 30, 38, 16,
  24, 34, 42, 28, 20, 32, 18, 26, 36, 22, 44, 30, 16, 38, 24, 14,
];

const DUMMY_LYRICS: LyricLine[] = [
  { time: "0:05", text: "I've been thinking 'bout the way you smile" },
  { time: "0:12", text: "When you think nobody's watching" },
  { time: "0:18", text: "Got me feeling like a child" },
  { time: "0:25", text: "With a secret worth protecting" }, // current
  { time: "0:32", text: "[Chorus]" },
  { time: "0:38", text: "And I just can't get you outta my head" },
  { time: "0:45", text: "Boy your lovin' is all I think about" },
  { time: "0:52", text: "I just can't get you outta my head" },
  { time: "0:58", text: "Boy your lovin' is all I think about" },
  { time: "1:05", text: "Every night and every day" },
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function PerformanceViewGlass() {
  const insets = useSafeAreaInsets();
  const [containerH, setContainerH] = useState(0);
  
  // Get the toggle function from the store
  const togglePerformanceMode = useLyricStore(s => s.togglePerformanceMode);
  
  // Navigation callback - go back to card view
  const goBack = () => {
    togglePerformanceMode(false);
  };

  // Player sizing / drag
  const MIN_PLAYER = 80;
  const MAX_PLAYER = useMemo(() => Math.max(320, Math.min(400, containerH * 0.6 || 0)), [containerH]);
  const playerHeight = useRef(new Animated.Value(MAX_PLAYER || 320)).current;
  const [compressed, setCompressed] = useState(false);

  useEffect(() => {
    const id = playerHeight.addListener(({ value }) => setCompressed(value <= 150));
    return () => playerHeight.removeListener(id);
  }, [playerHeight]);

  const startVal = useRef(0);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        playerHeight.stopAnimation((val) => (startVal.current = val));
      },
      onPanResponderMove: (_, g) => {
        const next = startVal.current + g.dy;
        // elastic resistance at edges
        let v = next;
        if (next < MIN_PLAYER) v = MIN_PLAYER - (MIN_PLAYER - next) * 0.3;
        if (next > MAX_PLAYER) v = MAX_PLAYER + (next - MAX_PLAYER) * 0.3;
        playerHeight.setValue(v);
      },
      onPanResponderRelease: () => {
        playerHeight.stopAnimation((val) => {
          const midpoint = (MIN_PLAYER + MAX_PLAYER) / 2;
          const target = val < midpoint ? MIN_PLAYER : MAX_PLAYER;
          Animated.timing(playerHeight, {
            toValue: target,
            duration: 280,
            useNativeDriver: false,
          }).start();
        });
      },
    })
  ).current;

  // Fake progress + time (no audio)
  const [isPlaying, setIsPlaying] = useState(true);
  const totalSecs = 154; // 2:34
  const [currentSecs, setCurrentSecs] = useState(65);
  const progress = totalSecs ? currentSecs / totalSecs : 0;

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setCurrentSecs((s) => (s + 1 > totalSecs ? totalSecs : s + 1)), 1000);
    return () => clearInterval(id);
  }, [isPlaying, totalSecs]);

  // Lyrics (auto-advance + editing)
  const listRef = useRef<FlatList<LyricLine>>(null);
  const [lines, setLines] = useState<LyricLine[]>(DUMMY_LYRICS);
  const [currentIndex, setCurrentIndex] = useState(3);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Auto-advance every 7s (UI only)
  useEffect(() => {
    const id = setInterval(() => {
      if (editingIndex !== null) return;
      setCurrentIndex((i) => Math.min(i + 1, lines.length - 1));
    }, 7000);
    return () => clearInterval(id);
  }, [editingIndex, lines.length]);

  useEffect(() => {
    // center current line
    try {
      listRef.current?.scrollToIndex({ index: currentIndex, animated: true, viewPosition: 0.5 });
    } catch {
      // first layout might throw until measured; ignore
    }
  }, [currentIndex]);

  const onStartEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditValue(lines[idx].text);
  };

  const onCommitEdit = () => {
    if (editingIndex === null) return;
    const next = [...lines];
    next[editingIndex] = { ...next[editingIndex], text: editValue || next[editingIndex].text };
    setLines(next);
    setEditingIndex(null);
  };

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerH(e.nativeEvent.layout.height);
    if (!MAX_PLAYER) {
      playerHeight.setValue(320);
    }
  };

  const playerStyle = { height: playerHeight };
  const lyricHeight = Animated.subtract(new Animated.Value(containerH ? containerH : 0), Animated.add(playerHeight, new Animated.Value(20)));

  const activeBars = Math.round(progress * WAVE_HEIGHTS.length);

  return (
    <LinearGradient
      colors={["#1a1a1c", "#0d0d0e", "#000000"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.screen, { paddingTop: insets.top + 8 }]}
    >
      {/* Back button */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Main container */}
      <View style={styles.mainContainer} onLayout={onContainerLayout}>
        {/* Player card (glass) */}
        <Animated.View style={[styles.playerWrapper, playerStyle]}>
          <BlurView intensity={40} tint="dark" style={styles.playerGlass}>
            {/* Top hairline shimmer */}
            <View style={styles.cardHairline} />

            {!compressed && (
              <View style={styles.trackInfo}>
                <Text style={styles.trackTitle}>EV</Text>
                <Text style={styles.trackSubtitle}>+Beats • ntes</Text>
              </View>
            )}

            {/* Waveform */}
            <View style={[styles.waveform, compressed && { marginBottom: 0, height: 48 }]}>
              {WAVE_HEIGHTS.map((h, i) => {
                const active = i < activeBars;
                return (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: h,
                        backgroundColor: active ? "rgba(120,160,255,0.8)" : "rgba(200,200,205,0.4)",
                        shadowOpacity: active ? 0.3 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {!compressed && (
              <>
                {/* Time display */}
                <Text style={styles.timeDisplay}>
                  {formatTime(currentSecs)} / {formatTime(totalSecs)}
                </Text>

                {/* Controls (UI only) */}
                <View style={styles.controls}>
                  <Pressable
                    style={styles.controlBtn}
                    onPress={() => setCurrentSecs((s) => clamp(s - 10, 0, totalSecs))}
                  >
                    <Ionicons name="play-back" size={20} color="#fff" />
                  </Pressable>

                  <Pressable
                    style={styles.playBtn}
                    onPress={() => setIsPlaying((p) => !p)}
                  >
                    <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#000" style={{ marginLeft: isPlaying ? 0 : 2 }} />
                  </Pressable>

                  <Pressable
                    style={styles.controlBtn}
                    onPress={() => setCurrentSecs((s) => clamp(s + 10, 0, totalSecs))}
                  >
                    <Ionicons name="play-forward" size={20} color="#fff" />
                  </Pressable>
                </View>
              </>
            )}
          </BlurView>
        </Animated.View>

        {/* Drag handle */}
        <View {...pan.panHandlers} style={styles.dragHandle}>
          <View style={styles.dragPill} />
        </View>

        {/* Lyric editor card */}
        <Animated.View style={[styles.lyricCard, { height: lyricHeight }]}>
          <BlurView intensity={40} tint="dark" style={styles.lyricGlass}>
            <View style={styles.cardHairline} />
            <FlatList
              ref={listRef}
              data={lines}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={styles.lyricContainer}
              showsVerticalScrollIndicator
              indicatorStyle="white"
              getItemLayout={(_, index) => ({
                length: 64, // approximate height for smooth scrollToIndex
                offset: 64 * index,
                index,
              })}
              renderItem={({ item, index }) => {
                const state: "past" | "current" | "future" =
                  index < currentIndex ? "past" : index === currentIndex ? "current" : "future";
                const isEditing = editingIndex === index;

                return (
                  <Pressable
                    onPress={() => onStartEdit(index)}
                    style={[
                      styles.lyricLine,
                      state === "past" && styles.lyricPast,
                      state === "current" && styles.lyricCurrent,
                      state === "future" && styles.lyricFuture,
                      isEditing && styles.lyricEditing,
                    ]}
                  >
                                         {isEditing ? (
                       <TextInput
                         value={editValue}
                         onChangeText={setEditValue}
                         onBlur={onCommitEdit}
                         onSubmitEditing={onCommitEdit}
                         returnKeyType="done"
                         autoFocus
                         style={styles.lyricInput}
                       />
                     ) : (
                       <Text
                         style={[
                           styles.lyricText,
                           state === "past" && { fontSize: 16, color: "#888" },
                           state === "current" && { fontSize: 22, fontWeight: "500", color: "#fff", textShadowColor: "rgba(255,255,255,0.3)", textShadowRadius: 10 },
                         ]}
                       >
                         {item.text}
                       </Text>
                     )}
                  </Pressable>
                );
              }}
            />
          </BlurView>
        </Animated.View>
      </View>

      {/* Bottom nav */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable style={styles.navBtn}>
          <Ionicons name="document-text-outline" size={26} color="#8e8e93" />
          <Text style={styles.navLabel}>notes</Text>
        </Pressable>
        <Pressable style={styles.navBtn}>
          <Ionicons name="pencil-outline" size={26} color="#8e8e93" />
          <Text style={styles.navLabel}>edit</Text>
        </Pressable>
      </View>

      {/* Home indicator */}
      <View style={[styles.homeIndicator, { marginBottom: insets.bottom ? 0 : 6 }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
  },

  // Header with back button
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // Main container
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Player card
  playerWrapper: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  playerGlass: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 24,
    backgroundColor: "rgba(44,44,46,0.35)",
  },
  cardHairline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    opacity: 0.7,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  trackInfo: { alignItems: "center" },
  trackTitle: {
    fontSize: 36,
    fontWeight: "200",
    letterSpacing: 0.5,
    color: "#fff",
  },
  trackSubtitle: {
    marginTop: 6,
    marginBottom: 48,
    fontSize: 17,
    color: "#a0a0a3",
    fontWeight: "400",
  },

  waveform: {
    height: 64,
    marginBottom: 32,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  waveBar: {
    width: 3,
    marginHorizontal: 0.5,
    borderRadius: 1,
    backgroundColor: "rgba(200,200,205,0.4)",
    shadowColor: "rgba(100,140,255,1)",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  timeDisplay: {
    fontSize: 17,
    color: "#a0a0a3",
    fontWeight: "500",
    letterSpacing: 0.3,
    textAlign: "center",
    marginBottom: 24,
  },

  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40 as any,
  },
  controlBtn: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  // Drag handle
  dragHandle: {
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  // Lyric editor
  lyricCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  lyricGlass: {
    flex: 1,
    backgroundColor: "rgba(44,44,46,0.35)",
  },
  lyricContainer: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 24 as any,
    minHeight: "100%",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  lyricLine: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 280,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  lyricPast: {
    opacity: 0.4,
  },
  lyricCurrent: {
    backgroundColor: "rgba(255,255,255,0.10)",
    shadowColor: "#fff",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  lyricFuture: {
    opacity: 0.6,
  },
  lyricEditing: {
    backgroundColor: "rgba(120,160,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(120,160,255,0.30)",
    shadowColor: "rgba(120,160,255,0.20)",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  lyricText: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontFamily: "Georgia",
    fontSize: 18,
    lineHeight: 24,
  },
  lyricInput: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontFamily: "Georgia",
    fontSize: 22,
    fontWeight: "500",
  },



  // Bottom nav + home indicator
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  navBtn: { alignItems: "center", gap: 6 as any, padding: 8, borderRadius: 12 },
  navLabel: { fontSize: 12, color: "#8e8e93", fontWeight: "500" },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    marginTop: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});