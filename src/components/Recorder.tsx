import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, usePermissions } from 'expo-audio';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';

interface RecorderProps {
  onStart?: () => void;
  onStop?: (duration: number, uri: string) => void;
  visualizerBars?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Recorder({ 
  onStart, 
  onStop, 
  visualizerBars = 48 
}: RecorderProps) {
  const [time, setTime] = useState(0);
  const [barHeights, setBarHeights] = useState(Array(visualizerBars).fill(4));
  
  // Use modern expo-audio hooks
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [permission, requestPermission] = usePermissions();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const isPreparingRef = useRef(false);
  
  // Animation values
  const buttonScale = useSharedValue(1);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) clearInterval(animationRef.current);
      // Modern hook handles cleanup automatically
    };
  }, []);

  const startRecording = useCallback(async () => {
    // Guard: if we're already preparing or recording, ignore
    if (isPreparingRef.current || audioRecorder.isRecording) return;

    isPreparingRef.current = true;
    try {
      // Check and request permissions using modern hook
      if (!permission?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert('Permission required', 'Microphone access is needed to record.');
          return;
        }
      }

      console.log('Starting recording with modern expo-audio...');
      
      // Use modern recording hook - this handles all the audio session setup
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      setTime(0);
      onStart?.();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
      
      // Start visualizer animation
      animationRef.current = setInterval(() => {
        setBarHeights(prevHeights => 
          prevHeights.map(() => 4 + Math.random() * 20)
        );
      }, 100);
      
      // Start button animations
      buttonScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    } finally {
      isPreparingRef.current = false;
    }
  }, [audioRecorder, permission, requestPermission, onStart]);

  const stopRecording = useCallback(async () => {
    try {
      if (!audioRecorder.isRecording) return;
      
      console.log('Stopping recording with modern expo-audio...');
      
      // Use modern hook to stop and get URI
      const uri = await audioRecorder.stop();
      
      // Clear timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      
      // Reset visualizer
      setBarHeights(Array(visualizerBars).fill(4));
      
      // Stop animations
      cancelAnimation(buttonScale);
      buttonScale.value = withTiming(1);
      
      // Validate the recording URI
      console.log('Recording completed with URI:', uri);
      
      if (uri && typeof uri === 'string' && uri.trim() !== '') {
        const duration = time; // We track time in our component
        console.log('Recording completed successfully:', { uri, duration });
        onStop?.(duration, uri);
      } else {
        console.warn('Recording validation failed:', { uri });
        Alert.alert('Recording Issue', 'Recording completed but could not save the file. Please try again.');
      }
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording');
    }
  }, [audioRecorder, time, visualizerBars, buttonScale, onStop]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePress = () => {
    if (audioRecorder.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Handle permission states
  if (permission === null) {
    return (
      <View className="items-center py-4">
        <Text className="text-gray-400">Setting up microphone...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="items-center py-4">
        <View className="items-center gap-4">
          <Ionicons name="mic-off" size={48} color="#9CA3AF" />
          <Text className="text-gray-400 text-center">
            Microphone access required{'\n'}Please enable permissions to record
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="items-center py-4">
      <View className="items-center gap-4">
        {/* Main Button */}
        <AnimatedPressable
          onPress={handlePress}
          disabled={isPreparingRef.current}
          style={[
            {
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: audioRecorder.isRecording ? '#EF4444' : '#EF4444',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: isPreparingRef.current ? 0.6 : 1,
            },
            buttonStyle,
          ]}
        >
          {audioRecorder.isRecording ? (
            <Ionicons name="stop" size={28} color="white" />
          ) : (
            <Ionicons name="mic" size={28} color="white" />
          )}
        </AnimatedPressable>

        {/* Timer */}
        <Text className="font-mono text-lg font-medium" style={{ 
          color: audioRecorder.isRecording ? '#F3F4F6' : '#9CA3AF' 
        }}>
          {formatTime(time)}
        </Text>

        {/* Visualizer Bars */}
        <View className="h-6 w-80 flex-row items-center justify-center">
          {barHeights.map((height, i) => (
            <View
              key={i}
              className="w-1 rounded-full mx-0.5"
              style={{
                height: audioRecorder.isRecording ? height : 4,
                backgroundColor: audioRecorder.isRecording ? '#EF4444' : '#4B5563',
              }}
            />
          ))}
        </View>

        {/* Status Text */}
        <Text className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
          {audioRecorder.isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
        </Text>
      </View>
    </View>
  );
}