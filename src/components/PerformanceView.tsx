import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Keyboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { useLyricStore } from '../state/lyricStore';
import RecordingModal from './RecordingModal';

// Audio Player Component
function AudioPlayer() {
  const { recordings } = useLyricStore();
  const [currentRecording, setCurrentRecording] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Use modern expo-audio hook - this handles all audio management
  const player = useAudioPlayer(currentRecording?.uri || null);
  const positionUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fixed waveform heights to prevent re-render performance issues
  const waveHeights = React.useMemo(() => 
    Array.from({ length: 80 }, (_, i) => Math.sin(i * 0.2) * 12 + Math.sin(i * 0.5) * 6 + 8),
    []
  );

  // Initialize with the most recent recording if available
  useEffect(() => {
    if (recordings.length > 0 && !currentRecording) {
      // Find the first recording with a valid URI
      const validRecording = recordings.find(rec => 
        rec.uri && typeof rec.uri === 'string' && rec.uri.trim() !== ''
      );
      
      if (validRecording) {
        setCurrentRecording(validRecording);
        setTotalTime(validRecording.duration || 0);
      }
    }
  }, [recordings]);

  // Handle playback status updates with modern hook
  useEffect(() => {
    if (player.playing) {
      // Start position updates when playing
      positionUpdateRef.current = setInterval(() => {
        const currentPos = player.currentTime || 0;
        const duration = player.duration || 1;
        
        setCurrentTime(Math.floor(currentPos));
        setProgress(duration > 0 ? currentPos / duration : 0);
        
        if (duration > 0 && !totalTime) {
          setTotalTime(Math.floor(duration));
        }
      }, 1000);
    } else {
      // Clear interval when not playing
      if (positionUpdateRef.current) {
        clearInterval(positionUpdateRef.current);
        positionUpdateRef.current = null;
      }
    }

    return () => {
      if (positionUpdateRef.current) {
        clearInterval(positionUpdateRef.current);
      }
    };
  }, [player.playing, player.currentTime, player.duration, totalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    // If no recordings exist, show helpful message
    if (recordings.length === 0) {
      Alert.alert('No Recordings', 'Record some audio first by tapping the record button below.');
      return;
    }

    // If no current recording selected, use the first one
    if (!currentRecording && recordings.length > 0) {
      const validRecording = recordings.find(rec => 
        rec.uri && typeof rec.uri === 'string' && rec.uri.trim() !== ''
      );
      
      if (validRecording) {
        setCurrentRecording(validRecording);
        setTotalTime(validRecording.duration || 0);
      }
      return;
    }

    try {
      // Validate recording URI
      if (!currentRecording?.uri || typeof currentRecording.uri !== 'string' || currentRecording.uri.trim() === '') {
        Alert.alert('Invalid Recording', 'This recording file is invalid. Please record a new one.');
        return;
      }

      // Use modern player controls
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Unable to play this recording. Please try recording new audio.');
    }
  };

  const handleSeek = (newProgress: number) => {
    if (!currentRecording || !player.duration) return;
    
    try {
      const newTime = newProgress * player.duration;
      player.seekTo(newTime);
      setCurrentTime(Math.floor(newTime));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 15);
    const newProgress = totalTime > 0 ? newTime / totalTime : 0;
    handleSeek(newProgress);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(totalTime, currentTime + 15);
    const newProgress = totalTime > 0 ? newTime / totalTime : 0;
    handleSeek(newProgress);
  };

  // Filter valid recordings
  const validRecordings = recordings.filter(rec => 
    rec.uri && typeof rec.uri === 'string' && rec.uri.trim() !== ''
  );

  if (validRecordings.length === 0) {
    return (
      <View className="bg-gray-900 rounded-3xl mx-4 mb-6" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
      }}>
        <View className="items-center py-12 px-6">
          <Ionicons name="musical-notes-outline" size={64} color="#4B5563" />
          <Text className="text-gray-300 text-center mt-6 text-lg font-medium">
            {recordings.length === 0 
              ? "No recordings available\nRecord a take to enable playback"
              : "No valid recordings found\nPlease record new audio"
            }
          </Text>
          {recordings.length > 0 && (
            <Text className="text-gray-500 text-sm mt-3">
              ({recordings.length} corrupted recording{recordings.length > 1 ? 's' : ''} found)
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-900 rounded-3xl mx-4 mb-6" style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 20,
    }}>
      {/* Track Info */}
      <View className="items-center pt-8 pb-6 px-6">
        <Pressable 
          onPress={() => {
            // Filter valid recordings only
            const validRecordings = recordings.filter(rec => 
              rec.uri && typeof rec.uri === 'string' && rec.uri.trim() !== ''
            );
            
            if (validRecordings.length > 1) {
              // Cycle to next valid recording
              const currentIndex = validRecordings.findIndex(r => r.id === currentRecording?.id);
              const nextIndex = (currentIndex + 1) % validRecordings.length;
              setCurrentRecording(validRecordings[nextIndex]);
              setTotalTime(validRecordings[nextIndex].duration || 0);
              
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
          <Text className="text-white text-2xl font-semibold mb-2" numberOfLines={1}>
            {currentRecording?.name || 'No Recording'}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-sm font-medium">
              Take • {validRecordings.length} available
            </Text>
            {validRecordings.length > 1 && (
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" style={{ marginLeft: 6 }} />
            )}
          </View>
        </Pressable>
      </View>

      {/* Waveform/Progress Bar */}
      <View className="mb-8 px-6">
        <Pressable
          onPress={(event) => {
            const { locationX } = event.nativeEvent;
            const width = 300; // approximate width
            const newProgress = locationX / width;
            handleSeek(Math.max(0, Math.min(1, newProgress)));
          }}
          className="h-20 justify-center"
        >
          <View className="h-16 flex-row items-center justify-center" style={{ gap: 2 }}>
            {waveHeights.map((height, i) => (
              <View
                key={i}
                className="w-1.5 rounded-full"
                style={{
                  height: Math.max(6, height * 1.2),
                  backgroundColor: i < progress * 80 ? '#10B981' : '#374151',
                }}
              />
            ))}
          </View>
        </Pressable>
        
        {/* Time Display */}
        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-gray-400 text-sm font-medium">
            {formatTime(currentTime)}
          </Text>
          <Text className="text-gray-400 text-sm font-medium">
            {formatTime(totalTime)}
          </Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View className="flex-row items-center justify-center pb-8"
        style={{ gap: 36 }}>
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
          className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="play-skip-back" size={24} color="white" />
        </Pressable>
        
        <Pressable 
          onPress={handleSkipBack}
          className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="play-back" size={20} color="#9CA3AF" />
        </Pressable>
        
        <Pressable
          onPress={handlePlayPause}
          className="w-20 h-20 rounded-full bg-white items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons
            name={player.playing ? "pause" : "play"}
            size={32}
            color="black"
            style={{ marginLeft: player.playing ? 0 : 3 }}
          />
        </Pressable>
        
        <Pressable 
          onPress={handleSkipForward}
          className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="play-forward" size={20} color="#9CA3AF" />
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
          className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="play-skip-forward" size={24} color="white" />
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

    return sections.map((section) => {
      if (!section || !section.id) return null; // Safety check
      
      return (
        <View key={section.id} className="mb-10">
          {/* Section Header */}
          <View 
            className="mb-5 px-5 py-3 rounded-xl self-start"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
          >
            <Text 
              className="text-emerald-300 font-bold text-base tracking-wide uppercase"
              style={{ fontFamily: 'System' }}
            >
              {section.title || 'Untitled'}
            </Text>
          </View>
          
          {/* Section Content */}
          <Text 
            className="text-gray-100 text-xl leading-10 pl-1"
            style={{ 
              fontFamily: 'Georgia',
              lineHeight: 40,
              fontWeight: '400',
            }}
            selectable={false} // Prevent text selection and keyboard popup
          >
            {section.content || (
              <Text className="text-gray-500 italic text-lg">
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
      backgroundColor: '#000000',
      paddingTop: insets.top + 16 
    }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 mb-8">
        <Text className="text-3xl font-bold text-white tracking-wide">LYRIQ</Text>
        <Pressable
          onPress={() => togglePerformanceMode(false)}
          className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="create" size={18} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Audio Player */}
      <AudioPlayer />

      {/* Elevated Lyrics Card */}
      <View className="flex-1 mx-4 mb-4">
        <View 
          className="flex-1 bg-gray-900 rounded-3xl"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          <ScrollView 
            className="flex-1 px-8 py-6"
            showsVerticalScrollIndicator={true}
            indicatorStyle="white"
            contentContainerStyle={{ 
              paddingTop: 16,
              paddingBottom: 24,
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
          paddingBottom: Math.max(insets.bottom || 0, 24),
          paddingTop: 20,
        }}
      >
        {/* Record Button */}
        <Pressable
          onPress={() => toggleRecordingModal(true)}
          className="items-center"
        >
          <View className="w-14 h-14 bg-red-500 rounded-full items-center justify-center mb-3" style={{
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Ionicons name="mic" size={22} color="white" />
          </View>
          <Text className="text-gray-400 text-sm font-medium">record</Text>
        </Pressable>

        {/* Edit Button */}
        <Pressable
          onPress={() => togglePerformanceMode(false)}
          className="w-12 h-12 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="create" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Recording Modal */}
      <RecordingModal />
    </View>
  );
}