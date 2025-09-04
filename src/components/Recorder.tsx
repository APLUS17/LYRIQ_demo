import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';

// Platform-specific imports
let Audio: any = null;
let InterruptionModeAndroid: any = null;
let InterruptionModeIOS: any = null;

if (Platform.OS !== 'web') {
  const ExpoAV = require('expo-av');
  Audio = ExpoAV.Audio;
  InterruptionModeAndroid = ExpoAV.InterruptionModeAndroid;
  InterruptionModeIOS = ExpoAV.InterruptionModeIOS;
}

interface RecorderProps {
  onStart?: () => void;
  onStop?: (duration: number, uri: string) => void;
  visualizerBars?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Global guard to prevent multiple prepared Recording instances
let globalRecordingRef: any = null;

type Action = 'idle' | 'preparing' | 'recording' | 'stopping';

// Web Audio API fallback
class WebAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private onComplete: ((uri: string) => void) | null = null;

  async prepare() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.chunks = [];
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'audio/webm' });
      const uri = URL.createObjectURL(blob);
      this.onComplete?.(uri);
    };
  }

  async start() {
    if (this.mediaRecorder) {
      this.mediaRecorder.start();
    }
  }

  async stop(): Promise<string> {
    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.onComplete = resolve;
        this.mediaRecorder.stop();
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
      }
    });
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

export default function Recorder({
  onStart,
  onStop,
  visualizerBars = 48,
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [barHeights, setBarHeights] = useState(Array(visualizerBars).fill(4));
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const recordingRef = useRef<any>(null);
  const webRecorderRef = useRef<WebAudioRecorder | null>(null);
  const actionRef = useRef<Action>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  // Animation values
  const buttonScale = useSharedValue(1);

  // Platform-specific recording options
  const RECORDING_OPTIONS = Platform.OS !== 'web' ? {
    android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
    },
    ios: {
      extension: '.m4a',
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    },
    web: undefined as any,
    isMeteringEnabled: false,
  } : null;

  // Clean up everything, including any prepared/recording instance
  const resetRecorder = useCallback(async () => {
    // timers/animations first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    cancelAnimation(buttonScale);
    buttonScale.value = withTiming(1);
    setBarHeights(Array(visualizerBars).fill(4));

    if (Platform.OS === 'web') {
      // Web cleanup
      if (webRecorderRef.current) {
        webRecorderRef.current.cleanup();
        webRecorderRef.current = null;
      }
    } else {
      // Native cleanup
      const stop = async (rec: any) => {
        if (!rec) return;
        try {
          const st = await rec.getStatusAsync();
          if (st.canRecord || st.isRecording || !st.isDoneRecording) {
            await rec.stopAndUnloadAsync();
          }
        } catch {
          // best-effort cleanup
        }
      };

      await stop(recordingRef.current);
      await stop(globalRecordingRef);

      recordingRef.current = null;
      globalRecordingRef = null;

      // optionally release record mode so other audio can play later
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      } catch {}
    }
  }, [buttonScale, visualizerBars]);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          // Web permissions are handled on first recording attempt
          setPermissionGranted(true);
        } else {
          const { status } = await Audio.requestPermissionsAsync();
          setPermissionGranted(status === 'granted');
          if (status === 'granted') {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              interruptionModeIOS: InterruptionModeIOS.DoNotMix,
              shouldDuckAndroid: true,
              interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
              playThroughEarpieceAndroid: false,
              staysActiveInBackground: false,
            });
          }
        }
      } catch (e) {
        console.error('Failed to setup audio:', e);
        setPermissionGranted(false);
      }
    })();

    return () => {
      resetRecorder();
    };
  }, [resetRecorder]);

  const startRecording = useCallback(async () => {
    if (actionRef.current !== 'idle') return;
    actionRef.current = 'preparing';

    try {
      if (Platform.OS === 'web') {
        // Web Audio API
        await resetRecorder();
        
        const webRecorder = new WebAudioRecorder();
        await webRecorder.prepare();
        await webRecorder.start();
        
        webRecorderRef.current = webRecorder;
      } else {
        // Native Audio
        const perm = await Audio.getPermissionsAsync();
        if (perm.status !== 'granted') {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission required', 'Microphone access is needed to record.');
            actionRef.current = 'idle';
            return;
          }
        }

        // Make sure nothing is lingering
        await resetRecorder();

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
        // Avoid presets, use explicit options
        await rec.prepareToRecordAsync(RECORDING_OPTIONS);
        await rec.startAsync();

        recordingRef.current = rec;
        globalRecordingRef = rec;
      }

      setIsRecording(true);
      setTime(0);
      onStart?.();

      // timers / animation
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
      animationRef.current = setInterval(() => {
        setBarHeights((h) => h.map(() => 4 + Math.random() * 20));
      }, 100);
      buttonScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        false
      );

      actionRef.current = 'recording';
    } catch (e) {
      console.error('Failed to start recording:', e);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      await resetRecorder();
      setIsRecording(false);
      actionRef.current = 'idle';
    }
  }, [onStart, resetRecorder, buttonScale]);

  const stopRecording = useCallback(async () => {
    if (actionRef.current !== 'recording') return;
    if (Platform.OS === 'web' && !webRecorderRef.current) return;
    if (Platform.OS !== 'web' && !recordingRef.current) return;
    
    actionRef.current = 'stopping';

    try {
      let uri: string | null = null;

      if (Platform.OS === 'web') {
        // Web Audio API
        if (webRecorderRef.current) {
          uri = await webRecorderRef.current.stop();
        }
      } else {
        // Native Audio
        const rec = recordingRef.current;
        // make sure it actually started before stopping
        try {
          const st = await rec.getStatusAsync();
          if (!st.isRecording && !st.canRecord) {
            // not actually recording; bail safely
            await resetRecorder();
            setIsRecording(false);
            actionRef.current = 'idle';
            return;
          }
        } catch {}

        await rec.stopAndUnloadAsync();
        uri = rec.getURI();
      }

      setIsRecording(false);
      await resetRecorder();

      if (uri && typeof uri === 'string' && uri.trim() !== '') {
        const duration = time > 0 ? time : 0;
        onStop?.(duration, uri);
      } else {
        Alert.alert('Recording Issue', 'Recording completed but could not save the file. Please try again.');
      }
    } catch (e) {
      console.error('Failed to stop recording:', e);
      Alert.alert('Recording Error', 'Failed to stop recording.');
      setIsRecording(false);
      await resetRecorder();
    } finally {
      actionRef.current = 'idle';
    }
  }, [time, onStop, resetRecorder]);

  const handlePress = () => {
    // Debounce hard taps
    const now = Date.now();
    if (now - lastTapRef.current < 250) return;
    lastTapRef.current = now;

    if (actionRef.current === 'recording') {
      stopRecording();
    } else if (actionRef.current === 'idle') {
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
          <Pressable onPress={startRecording} className="bg-blue-600 px-4 py-2 rounded-lg">
            <Text className="text-white font-medium">Grant & Start</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const disabled =
    actionRef.current === 'preparing' || actionRef.current === 'stopping';

  return (
    <View className="items-center py-4">
      <View className="items-center gap-4">
        {/* Main Button */}
        <AnimatedPressable
          onPress={handlePress}
          disabled={disabled}
          style={[
            {
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#EF4444',
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: disabled ? 0.6 : 1,
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
        <Text
          className="font-mono text-lg font-medium"
          style={{ color: isRecording ? '#F3F4F6' : '#9CA3AF' }}
        >
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

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}