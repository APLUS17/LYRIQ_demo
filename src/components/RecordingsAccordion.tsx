import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

// Platform-specific imports
let Haptics: any = null;
let Audio: any = null;

if ((Platform.OS as string) !== 'web') {
  Haptics = require('expo-haptics');
  const ExpoAV = require('expo-av');
  Audio = ExpoAV.Audio;
}

type Recording = {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: string;
};


function RecordingPlayer({ recording, isActive, onSelect }: {
  recording: Recording;
  isActive: boolean;
  onSelect: () => void;
}) {
  const [sound, setSound] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const seekTo = useCallback(async (seconds: number) => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if ('isLoaded' in status && status.isLoaded && status.durationMillis != null) {
      const preciseSeconds = Math.round(seconds); // Align to 1s precision
      const positionMs = Math.max(0, Math.min(preciseSeconds * 1000, status.durationMillis));
      await sound.setPositionAsync(positionMs);
    }
  }, [sound]);

  const togglePlayback = useCallback(async () => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if ('isLoaded' in status && status.isLoaded) {
      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  }, [sound]);

  const seekBy = useCallback(async (deltaSec: number) => {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if ('isLoaded' in status && status.isLoaded && status.durationMillis != null) {
      const nextMs = Math.max(0, Math.min((status.positionMillis ?? 0) + deltaSec * 1000, status.durationMillis));
      await sound.setPositionAsync(nextMs);
    }
  }, [sound]);

  // Load audio when this recording becomes active
  useEffect(() => {
    if (!isActive) {
      if (sound) {
        sound.unloadAsync().catch(console.log);
        setSound(null);
        setIsPlaying(false);
        setCurrentTime(0);
      }
      return;
    }
    
    let cancelled = false;
    const loadAudio = async () => {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
        
        if (!Audio) {
          console.log('Audio not available on web platform');
          return;
        }
        
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: recording.uri },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 }
        );
        
        if (cancelled) {
          await newSound.unloadAsync();
          return;
        }
        
        newSound.setOnPlaybackStatusUpdate((s: any) => {
          if (!s || !s.isLoaded) return;
          setIsPlaying(Boolean(s.isPlaying));
          const currentSec = (s.positionMillis ?? 0) / 1000;
          const totalSec = (s.durationMillis ?? 0) / 1000;
          setCurrentTime(Math.round(currentSec)); // Round to 1s precision
          setTotalTime(Math.round(totalSec));
        });
        
        setSound(newSound);
        const duration = (status as any)?.durationMillis ?? (recording.duration * 1000) ?? 0;
        setTotalTime(Math.round(duration / 1000));
        setCurrentTime(0);
      } catch (error) {
        console.log('Error loading recording:', error);
      }
    };
    
    loadAudio();
    return () => {
      cancelled = true;
      if (sound) {
        sound.unloadAsync().catch(console.log);
      }
    };
  }, [recording.uri, recording.id, isActive]);

  // Update scrub value when currentTime changes
  useEffect(() => {
    if (!isScrubbing) {
      setScrubValue(currentTime);
    }
  }, [currentTime, isScrubbing]);

  const formatTime = (seconds: number) => {
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isSameDay = date.toDateString() === now.toDateString();
    
    if (isSameDay) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <View>
      {/* Recording Row */}
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web' && Haptics) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onSelect();
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: isActive ? '#1A1A1A' : 'transparent',
          borderRadius: 8,
          marginVertical: 2,
        }}
        accessible={true}
        accessibilityLabel={`${recording.name}, recorded ${formatDate(recording.createdAt)}`}
        accessibilityRole="button"
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
            {recording.name}
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
            {formatDate(recording.createdAt)} • {formatTime(recording.duration)}
          </Text>
        </View>
        {isActive && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                togglePlayback();
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#0084FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessible={true}
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
              accessibilityRole="button"
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={16} 
                color="white" 
                style={{ marginLeft: isPlaying ? 0 : 1 }}
              />
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Expanded Controls for Active Recording */}
      {isActive && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {/* Time Display */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, opacity: 0.8 }}>
              {formatTime(currentTime)}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 12, opacity: 0.8 }}>
              {formatTime(totalTime)}
            </Text>
          </View>

          {/* Scrubber Slider */}
          <View style={{ marginBottom: 16 }}>
            <Slider
              style={{ height: 40 }}
              minimumValue={0}
              maximumValue={Math.floor(totalTime) || 1}
              value={Math.floor(scrubValue)}
              onValueChange={(value) => {
                setScrubValue(value);
                if (Platform.OS !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              onSlidingStart={() => {
                setIsScrubbing(true);
                if (Platform.OS !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              onSlidingComplete={(value) => {
                setIsScrubbing(false);
                if (Platform.OS !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                seekTo(Math.round(value));
              }}
              minimumTrackTintColor="#0084FF"
              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
              thumbTintColor="#0084FF"
              accessible={true}
              accessibilityLabel="Playback position"
              accessibilityRole="adjustable"
              accessibilityValue={{ min: 0, max: totalTime, now: currentTime }}
            />
          </View>

          {/* Full Playback Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                seekBy(-15);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessible={true}
              accessibilityLabel="Rewind 15 seconds"
              accessibilityRole="button"
            >
              <Ionicons name="play-back" size={20} color="#E5E7EB" />
            </Pressable>
            
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                togglePlayback();
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessible={true}
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
              accessibilityRole="button"
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color="#111827" 
                style={{ marginLeft: isPlaying ? 0 : 2 }}
              />
            </Pressable>
            
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web' && Haptics) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                seekBy(15);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessible={true}
              accessibilityLabel="Fast forward 15 seconds"
              accessibilityRole="button"
            >
              <Ionicons name="play-forward" size={20} color="#E5E7EB" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export default function RecordingsAccordion({ recordings }: { recordings: Recording[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);

  const toggleAccordion = useCallback(() => {
    setIsExpanded(prev => {
      const newExpanded = !prev;
      if (!newExpanded) {
        setActiveRecordingId(null);
      }
      return newExpanded;
    });
  }, []);

  const selectRecording = useCallback((recordingId: string) => {
    setActiveRecordingId(prev => prev === recordingId ? null : recordingId);
  }, []);


  if (recordings.length === 0) return null;

  // Sort recordings by newest first
  const sortedRecordings = [...recordings].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isSameDay = date.toDateString() === now.toDateString();
    
    if (isSameDay) {
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };


  return (
    <View style={{ marginHorizontal: 24, marginBottom: 16 }}>
      {/* Main Container */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header - Always Visible */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web' && Haptics) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            toggleAccordion();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          accessible={true}
          accessibilityLabel={`${recordings.length} mumble takes`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="musical-notes" size={16} color="#9CA3AF" />
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
              {recordings.length} mumble{recordings.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
              Latest: {formatDate(sortedRecordings[0]?.createdAt)}
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#9CA3AF" 
            />
          </View>
        </Pressable>

        {/* Expandable Content */}
        {isExpanded && (
          <View 
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: Math.floor(Math.min(recordings.length * 80 + (activeRecordingId ? 140 : 0), 400)) }}
            >
            {sortedRecordings.map((recording, index) => (
              <View key={recording.id}>
                {index > 0 && (
                  <View style={{ height: 1, backgroundColor: '#2A2A2A', marginHorizontal: 16 }} />
                )}
                <RecordingPlayer
                  recording={recording}
                  isActive={activeRecordingId === recording.id}
                  onSelect={() => selectRecording(recording.id)}
                />
              </View>
            ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}