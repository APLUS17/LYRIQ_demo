import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
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
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [barHeights, setBarHeights] = useState(Array(visualizerBars).fill(4));
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  
  // Keep a single Recording instance
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Block re-entry while preparing
  const isPreparingRef = useRef(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Clean up on unmount
  useEffect(() => {
    setupAudio();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) clearInterval(animationRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      
      if (status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    } catch (error) {
      console.error('Failed to setup audio:', error);
      setPermissionGranted(false);
    }
  };

  const startRecording = useCallback(async () => {
    // Guard: if we're already preparing or recording, ignore
    if (isPreparingRef.current || isRecording) return;

    // If a previous instance leaked, unload it first
    if (recordingRef.current) {
      try { 
        await recordingRef.current.stopAndUnloadAsync(); 
      } catch {} 
      recordingRef.current = null;
    }

    isPreparingRef.current = true;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone access is needed to record.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      recordingRef.current = rec;
      setIsRecording(true);
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
      setIsRecording(false);
    } finally {
      isPreparingRef.current = false;
    }
  }, [isRecording, onStart]);

  const stopRecording = useCallback(async () => {
    try {
      const rec = recordingRef.current;
      if (!rec) return;
      
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const status = await rec.getStatusAsync();
      
      recordingRef.current = null; // Critical: release instance
      setIsRecording(false);
      
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
      
      // Call onStop callback
      if (uri && status.isLoaded && status.durationMillis) {
        const duration = Math.floor(status.durationMillis / 1000);
        onStop?.(duration, uri);
      }
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording');
      setIsRecording(false);
    }
  }, [visualizerBars, buttonScale, onStop]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (permissionGranted === null) {
    return (
      <View className="items-center py-4">
        <Text className="text-gray-400">Setting up microphone...</Text>
      </View>
    );
  }

  if (permissionGranted === false) {
    return (
      <View className="items-center py-4">
        <View className="items-center gap-4">
          <Ionicons name="mic-off" size={48} color="#9CA3AF" />
          <Text className="text-gray-400 text-center">
            Microphone access required{'\n'}Please enable in device settings
          </Text>
          <Pressable
            onPress={setupAudio}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Try Again</Text>
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
              backgroundColor: isRecording ? '#EF4444' : '#EF4444',
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
          {isRecording ? (
            <Ionicons name="stop" size={28} color="white" />
          ) : (
            <Ionicons name="mic" size={28} color="white" />
          )}
        </AnimatedPressable>

        {/* Timer */}
        <Text className="font-mono text-lg font-medium" style={{ 
          color: isRecording ? '#F3F4F6' : '#9CA3AF' 
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
                height: isRecording ? height : 4,
                backgroundColor: isRecording ? '#EF4444' : '#4B5563',
              }}
            />
          ))}
        </View>

        {/* Status Text */}
        <Text className="text-sm font-medium" style={{ color: '#9CA3AF' }}>
          {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
        </Text>
      </View>
    </View>
  );
}