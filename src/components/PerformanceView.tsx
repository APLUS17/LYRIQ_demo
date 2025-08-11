import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Keyboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useLyricStore } from '../state/lyricStore';
import RecordingModal from './RecordingModal';

// Audio Player Component
function AudioPlayer() {
  const { recordings } = useLyricStore();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<any>(null);
  const positionUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fixed waveform heights to prevent re-render performance issues
  const waveHeights = React.useMemo(() => 
    Array.from({ length: 80 }, (_, i) => Math.sin(i * 0.2) * 12 + Math.sin(i * 0.5) * 6 + 8),
    []
  );

  // Initialize with the most recent recording if available
  useEffect(() => {
    if (recordings.length > 0 && !currentRecording) {
      setCurrentRecording(recordings[0]);
    }
  }, [recordings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (positionUpdateRef.current) {
        clearInterval(positionUpdateRef.current);
      }
    };
  }, [sound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    // If no recordings exist, show helpful message
    if (recordings.length === 0) {
      Alert.alert('No Recordings', 'Record some audio first by tapping the record button below.');
      return;
    }

    // If no current recording selected, use the first one
    if (!currentRecording && recordings.length > 0) {
      setCurrentRecording(recordings[0]);
      setTotalTime(recordings[0].duration || 0);
      return;
    }

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          if (positionUpdateRef.current) {
            clearInterval(positionUpdateRef.current);
          }
        } else {
          await sound.playAsync();
          setIsPlaying(true);
          startPositionUpdates();
        }
      } else {
        // Validate recording URI
        if (!currentRecording.uri) {
          Alert.alert('Invalid Recording', 'This recording file is corrupted. Please record a new one.');
          return;
        }

        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        // Load and play the recording
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: currentRecording.uri },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setIsPlaying(true);
        
        // Use recording metadata for duration if available
        if (currentRecording.duration) {
          setTotalTime(currentRecording.duration);
        }
        
        // Set up playback status updates
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.durationMillis && !currentRecording.duration) {
              setTotalTime(Math.floor(status.durationMillis / 1000));
            }
            
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentTime(0);
              setProgress(0);
              if (positionUpdateRef.current) {
                clearInterval(positionUpdateRef.current);
              }
            }
          }
        });
        
        startPositionUpdates();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Unable to play this recording. Please try recording new audio.');
      
      // Reset state on error
      setIsPlaying(false);
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    }
  };

  const startPositionUpdates = () => {
    positionUpdateRef.current = setInterval(async () => {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const currentTimeMs = status.positionMillis || 0;
          const currentTimeSec = Math.floor(currentTimeMs / 1000);
          const totalTimeSec = Math.floor((status.durationMillis || 1) / 1000);
          
          setCurrentTime(currentTimeSec);
          setProgress(totalTimeSec > 0 ? currentTimeSec / totalTimeSec : 0);
        }
      }
    }, 1000);
  };

  const handleSeek = async (newProgress: number) => {
    if (!sound || !currentRecording) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPositionMs = newProgress * (status.durationMillis || 0);
        await sound.setPositionAsync(newPositionMs);
        const newTime = Math.floor(newPositionMs / 1000);
        setCurrentTime(newTime);
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleSkipBack = async () => {
    const newTime = Math.max(0, currentTime - 15);
    const newProgress = totalTime > 0 ? newTime / totalTime : 0;
    await handleSeek(newProgress);
  };

  const handleSkipForward = async () => {
    const newTime = Math.min(totalTime, currentTime + 15);
    const newProgress = totalTime > 0 ? newTime / totalTime : 0;
    await handleSeek(newProgress);
  };

  if (recordings.length === 0) {
    return (
      <View className="bg-gray-800 rounded-2xl p-6 mx-6 mb-6">
        <View className="items-center py-8">
          <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
          <Text className="text-gray-400 text-center mt-4">
            No recordings available{'\n'}Record a take to enable playback
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-800 rounded-2xl p-6 mx-6 mb-6">
      {/* Track Info */}
      <View className="items-center mb-4">
        <Pressable 
          onPress={() => {
            if (recordings.length > 1) {
              // Cycle to next recording
              const currentIndex = recordings.findIndex(r => r.id === currentRecording?.id);
              const nextIndex = (currentIndex + 1) % recordings.length;
              setCurrentRecording(recordings[nextIndex]);
              setTotalTime(recordings[nextIndex].duration || 0);
              
              // Stop current playback
              if (sound) {
                sound.unloadAsync();
                setSound(null);
              }
              setIsPlaying(false);
              setCurrentTime(0);
              setProgress(0);
            }
          }}
          className="items-center"
        >
          <Text className="text-white text-xl font-medium mb-1" numberOfLines={1}>
            {currentRecording?.name || 'No Recording'}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-sm">
              Take • {recordings.length} available
            </Text>
            {recordings.length > 1 && (
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
            )}
          </View>
        </Pressable>
      </View>

      {/* Waveform/Progress Bar */}
      <View className="mb-6">
        <Pressable
          onPress={(event) => {
            const { locationX } = event.nativeEvent;
            const width = 300; // approximate width
            const newProgress = locationX / width;
            handleSeek(Math.max(0, Math.min(1, newProgress)));
          }}
          className="h-16 justify-center"
        >
          <View className="h-12 flex-row items-center justify-center" style={{ gap: 1 }}>
            {waveHeights.map((height, i) => (
              <View
                key={i}
                className="w-1 rounded-full"
                style={{
                  height: Math.max(4, height),
                  backgroundColor: i < progress * 80 ? '#FFFF00' : '#4B5563',
                }}
              />
            ))}
          </View>
        </Pressable>
        
        {/* Time Display */}
        <Text className="text-gray-300 text-center text-sm mt-2">
          {formatTime(currentTime)} / {formatTime(totalTime)}
        </Text>
      </View>

      {/* Control Buttons */}
      <View className="flex-row items-center justify-center"
        style={{ gap: 32 }}>
        <Pressable 
          onPress={() => {
            const currentIndex = recordings.findIndex(r => r.id === currentRecording?.id);
            if (currentIndex > 0) {
              const prevRecording = recordings[currentIndex - 1];
              setCurrentRecording(prevRecording);
              if (sound) {
                sound.unloadAsync();
                setSound(null);
                setIsPlaying(false);
                setCurrentTime(0);
                setProgress(0);
              }
            }
          }}
          className="p-2"
        >
          <Ionicons name="play-skip-back" size={28} color="white" />
        </Pressable>
        
        <Pressable 
          onPress={handleSkipBack}
          className="p-2"
        >
          <Ionicons name="play-back" size={24} color="#9CA3AF" />
        </Pressable>
        
        <Pressable
          onPress={handlePlayPause}
          className="w-16 h-16 rounded-full bg-white items-center justify-center"
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color="black"
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </Pressable>
        
        <Pressable 
          onPress={handleSkipForward}
          className="p-2"
        >
          <Ionicons name="play-forward" size={24} color="#9CA3AF" />
        </Pressable>
        
        <Pressable 
          onPress={() => {
            const currentIndex = recordings.findIndex(r => r.id === currentRecording?.id);
            if (currentIndex < recordings.length - 1) {
              const nextRecording = recordings[currentIndex + 1];
              setCurrentRecording(nextRecording);
              if (sound) {
                sound.unloadAsync();
                setSound(null);
                setIsPlaying(false);
                setCurrentTime(0);
                setProgress(0);
              }
            }
          }}
          className="p-2"
        >
          <Ionicons name="play-skip-forward" size={28} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

// Performance View Component
export default function PerformanceView() {
  const insets = useSafeAreaInsets();
  const { sections, togglePerformanceMode, toggleRecordingModal } = useLyricStore();

  // Disable keyboard in read-only mode
  React.useEffect(() => {
    Keyboard.dismiss();
  }, []);

  // Render structured lyrics with proper formatting
  const renderLyrics = () => {
    if (sections.length === 0) {
      return (
        <View className="items-center py-12">
          <Ionicons name="musical-notes-outline" size={48} color="#4B5563" />
          <Text className="text-gray-400 text-center mt-4 text-lg">
            No lyrics written yet.{'\n'}Tap "Edit" to start writing.
          </Text>
        </View>
      );
    }

    return sections.map((section, index) => {
      if (!section || !section.id) return null; // Safety check
      
      return (
        <View key={section.id} className="mb-8">
          {/* Section Header */}
          <View 
            className="mb-4 px-4 py-2 rounded-lg self-start"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
          >
            <Text 
              className="text-blue-300 font-semibold text-lg"
              style={{ fontFamily: 'System' }}
            >
              [{section.title || 'Untitled'}]
            </Text>
          </View>
          
          {/* Section Content */}
          <Text 
            className="text-gray-200 text-lg leading-8 pl-2"
            style={{ 
              fontFamily: 'Georgia',
              lineHeight: 32,
            }}
            selectable={false} // Prevent text selection and keyboard popup
          >
            {section.content || (
              <Text className="text-gray-500 italic">
                (No lyrics written for this section)
              </Text>
            )}
          </Text>
        </View>
      );
    }).filter(Boolean); // Remove null entries
  };

  return (
    <View className="flex-1" style={{ 
      backgroundColor: '#1A1A1A',
      paddingTop: insets.top + 20 
    }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-6">
        <Text className="text-4xl font-light text-white">LYRIQ</Text>
        <View className="w-10" />
      </View>

      {/* Audio Player */}
      <AudioPlayer />

      {/* Elevated Lyrics Card */}
      <View className="flex-1 mx-4 mb-4">
        <View 
          className="flex-1 bg-gray-800 rounded-3xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 16,
          }}
        >
          <ScrollView 
            className="flex-1 p-6"
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            contentContainerStyle={{ 
              paddingTop: 12,
              paddingBottom: 20,
            }}
            decelerationRate="normal"
            scrollEventThrottle={16}
          >
            {renderLyrics()}
          </ScrollView>
        </View>
      </View>

      {/* Bottom Button Bar */}
      <View 
        className="flex-row items-center justify-between px-8"
        style={{ 
          paddingBottom: Math.max(insets.bottom || 0, 20),
          paddingTop: 16,
        }}
      >
        {/* Record Button (left side - where "notes" is in screenshot) */}
        <Pressable
          onPress={() => toggleRecordingModal(true)}
          className="items-center"
        >
          <View className="w-12 h-12 bg-red-500 rounded-full items-center justify-center mb-2">
            <Ionicons name="mic" size={20} color="white" />
          </View>
          <Text className="text-gray-400 text-xs">record</Text>
        </Pressable>

        {/* Edit Button (right side - no label) */}
        <Pressable
          onPress={() => togglePerformanceMode(false)}
          className="p-2"
        >
          <Ionicons name="create" size={24} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Recording Modal */}
      <RecordingModal />
    </View>
  );
}