// Apple Music-style Performance View
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useLyricStore } from '../state/lyricStore';
import { usePlayerStore } from '../state/playerStore';

const { height: screenHeight } = Dimensions.get('window');

type Section = {
  id: string;
  type: 'verse' | 'hook' | 'bridge' | string;
  title?: string;
  content?: string;
  isStarred?: boolean;
  createdAt: string;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeNegative = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `−${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function PerformanceViewApple() {
  const insets = useSafeAreaInsets();
  
  // Store connections
  const togglePerformanceMode = useLyricStore(s => s.togglePerformanceMode);
  const currentProject = useLyricStore(s => s.getCurrentProject());
  const sections = useLyricStore(s => {
    const pid = s.currentProjectId ?? '__unassigned__';
    return s.sectionsByProject[pid] ?? [];
  });
  const updateSection = useLyricStore(s => s.updateSection);
  
  // Navigation callback - go back to card view
  const goBack = () => {
    togglePerformanceMode(false);
  };

  // Player store integration
  const { 
    track, 
    position, 
    duration, 
    isPlaying, 
    volume,
    loadTrack, 
    playPause, 
    seek, 
    setVolume: setPlayerVolume 
  } = usePlayerStore();
  
  const [isScrubbing, setIsScrubbing] = useState(false);
  
  // Convert milliseconds to seconds for display
  const currentTime = Math.floor(position / 1000);
  const durationSecs = Math.floor(duration / 1000);
  
  // Lyric editing state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);

  // Convert sections to lyric lines
  const lyricLines = useMemo(() => {
    if (sections.length === 0) {
      return ["If I could drink whiskey in reverse"];
    }
    
    const lines: string[] = [];
    sections.forEach(section => {
      if (section.content?.trim()) {
        const contentLines = section.content.trim().split('\n').filter(line => line.trim());
        lines.push(...contentLines);
      }
    });
    return lines.length > 0 ? lines : ["If I could drink whiskey in reverse"];
  }, [sections]);
  
  // Add audio file function
  const onAddAudio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/aac', 'public.audio'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) return;
      
      const file = result.assets[0];
      console.log('Selected audio file:', file.name, file.uri);
      
      // Copy to app documents so it persists
      const dest = FileSystem.documentDirectory + file.name.replace(/\s+/g, '_');
      
      try {
        await FileSystem.copyAsync({ from: file.uri, to: dest });
        console.log('Copied to:', dest);
        await loadTrack({ uri: dest, name: file.name });
      } catch {
        // Fallback: use temp uri
        console.log('Using temp uri:', file.uri);
        await loadTrack({ uri: file.uri, name: file.name });
      }
    } catch (error) {
      console.log('Error adding audio file:', error);
    }
  };
  
  // Auto-advance lyrics based on audio time
  useEffect(() => {
    if (lyricLines.length > 1 && durationSecs > 0) {
      const lineIndex = Math.floor((currentTime / durationSecs) * lyricLines.length);
      setCurrentLyricIndex(Math.max(0, Math.min(lineIndex, lyricLines.length - 1)));
    }
  }, [currentTime, durationSecs, lyricLines.length]);
  
  const onStartEdit = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setEditingSectionId(sectionId);
      setEditingText(section.content || '');
    }
  };

  const onCommitEdit = () => {
    if (editingSectionId && editingText !== undefined) {
      updateSection(editingSectionId, editingText);
    }
    setEditingSectionId(null);
    setEditingText('');
  };

  const progress = durationSecs > 0 ? currentTime / durationSecs : 0;
  const remainingTime = durationSecs - currentTime;
  
  const togglePlayback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playPause();
  };
  
  const seekBackward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTime = Math.max(0, position - 15000);
    seek(newTime);
  };
  
  const seekForward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTime = Math.min(duration, position + 15000);
    seek(newTime);
  };
  
  const onSeek = (value: number) => {
    const newTimeMs = Math.round(value * duration);
    seek(newTimeMs);
  };
  
  const onVolumeChange = (vol: number) => {
    setPlayerVolume(vol);
  };

  return (
    <LinearGradient
      colors={["#8B7355", "#6B5B47", "#4A3F35"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.screen, { paddingTop: insets.top }]}
    >
      {/* Song Header */}
      <View style={styles.songHeader}>
        <Pressable onPress={onAddAudio} style={styles.albumArt}>
          <Text style={styles.albumText}>WHISKEY{"\n"}IN{"\n"}REVERSE</Text>
        </Pressable>
        <View style={styles.songInfo}>
          <View style={styles.songTitleRow}>
            <Text style={styles.songTitle}>{track?.name || currentProject?.name || "Whiskey In Reverse"}</Text>
            <Pressable style={styles.starButton}>
              <Ionicons name="star-outline" size={24} color="white" />
            </Pressable>
            <Pressable 
              onPress={goBack}
              style={styles.moreButton}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </Pressable>
          </View>
          <Text style={styles.artistName}>Morgan Wallen</Text>
        </View>
      </View>

      {/* Main Lyrics Display */}
      <ScrollView 
        style={styles.lyricsContainer}
        contentContainerStyle={styles.lyricsContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.length > 0 ? (
          sections.map((section, sectionIndex) => (
            <View key={section.id} style={styles.sectionContainer}>
              {section.content?.split('\n').map((line, lineIndex) => {
                const globalIndex = sectionIndex * 10 + lineIndex; // rough estimate
                const isCurrent = globalIndex === currentLyricIndex;
                const isPast = globalIndex < currentLyricIndex;
                const isEditing = editingSectionId === section.id;
                
                return (
                  <Pressable
                    key={`${section.id}-${lineIndex}`}
                    onPress={() => !isEditing && onStartEdit(section.id)}
                    style={styles.lyricLineContainer}
                  >
                    {isEditing ? (
                      <Pressable onPress={(e) => e.stopPropagation()}>
                        <TextInput
                          value={editingText}
                          onChangeText={setEditingText}
                          onSubmitEditing={onCommitEdit}
                          multiline
                          autoFocus
                          blurOnSubmit={false}
                          style={[styles.lyricLine, styles.lyricEditing]}
                        />
                      </Pressable>
                    ) : (
                      <Text 
                        style={[
                          styles.lyricLine,
                          isPast && styles.lyricPast,
                          isCurrent && styles.lyricCurrent,
                        ]}
                      >
                        {line.trim() || ' '}
                      </Text>
                    )}
                  </Pressable>
                );
              }) || []}
            </View>
          ))
        ) : (
          <Text style={[styles.lyricLine, styles.lyricCurrent]}>
            If I could drink whiskey in reverse
          </Text>
        )}
        <Text style={styles.creditsText}>
          Written By: Ernest Keith Smith,{"\n"}Michael Hardy, Morgan Wallen,{"\n"}Ryan Vojtesak
        </Text>
      </ScrollView>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.progressSlider}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onValueChange={(value) => {
            if (isScrubbing) {
              const newTimeMs = value * duration;
              seek(newTimeMs);
            }
          }}
          onSlidingStart={() => setIsScrubbing(true)}
          onSlidingComplete={(value) => {
            setIsScrubbing(false);
            onSeek(value);
          }}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
          thumbTintColor="#FFFFFF"
        />
      </View>

      {/* Time Display */}
      <View style={styles.timeRow}>
        <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
        <Text style={styles.remainingTime}>{formatTimeNegative(remainingTime)}</Text>
      </View>

      {/* Main Transport Controls */}
      <View style={styles.transportControls}>
        <Pressable onPress={seekBackward} style={styles.skipButton}>
          <Ionicons name="play-skip-back" size={36} color="white" />
        </Pressable>
        
        <Pressable onPress={togglePlayback} style={styles.mainPlayButton}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={48} 
            color="white"
            style={{ marginLeft: isPlaying ? 0 : 4 }}
          />
        </Pressable>
        
        <Pressable onPress={seekForward} style={styles.skipButton}>
          <Ionicons name="play-skip-forward" size={36} color="white" />
        </Pressable>
      </View>

      {/* Volume Control */}
      <View style={styles.volumeContainer}>
        <Ionicons name="volume-low" size={16} color="rgba(255,255,255,0.6)" />
        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={onVolumeChange}
          minimumTrackTintColor="rgba(255,255,255,0.8)"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#FFFFFF"
        />
        <Ionicons name="volume-high" size={16} color="rgba(255,255,255,0.6)" />
      </View>


      {/* Home Indicator */}
      <View style={[styles.homeIndicator, { marginBottom: Math.max(insets.bottom, 8) }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
  },

  // Song Header
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  albumArt: {
    width: 120,
    height: 120,
    backgroundColor: '#D4B896',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  albumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2D1810',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  starButton: {
    padding: 8,
    marginLeft: 8,
  },
  moreButton: {
    padding: 8,
    marginLeft: 4,
  },
  artistName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },

  // Main Lyrics
  lyricsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lyricsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: screenHeight * 0.4,
    paddingVertical: 40,
  },
  sectionContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  lyricLineContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lyricLine: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 42,
    paddingHorizontal: 20,
  },
  lyricCurrent: {
    fontSize: 36,
    fontWeight: '700',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  lyricPast: {
    fontSize: 28,
    opacity: 0.5,
    color: 'rgba(255,255,255,0.6)',
  },
  lyricEditing: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  creditsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 60,
    lineHeight: 20,
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  progressSlider: {
    width: '100%',
    height: 40,
  },

  // Time Row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  currentTime: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    minWidth: 40,
  },
  remainingTime: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
  },

  // Transport Controls
  transportControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 60,
  },
  skipButton: {
    padding: 12,
  },
  mainPlayButton: {
    padding: 16,
  },

  // Volume Control
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
    gap: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },

  // Home Indicator
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.4)",
    marginBottom: 8,
  },
});