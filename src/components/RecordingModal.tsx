import React, { forwardRef, useRef, type Ref, useState, useEffect } from 'react'
import {
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
  TouchableOpacity,
  Text,
  type TextStyle,
  Modal,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native'
import { Audio } from 'expo-av'
import * as Haptics from 'expo-haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated'
import { PanGestureHandler } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Recorder, type RecordInfo, type RecorderRef } from '@lodev09/expo-recorder'

import { useLyricStore } from '../state/lyricStore'
import { validateAudioFile } from '../utils/audioValidation'

const { height } = Dimensions.get('window')
const RECORD_BUTTON_SIZE = 64
const RECORDING_INDICATOR_COLOR = '#DC2626'
const RECORDING_INDICATOR_SCALE = 0.8
const MODAL_HEIGHT = height * 0.45

const SPRING_SHORT_CONFIG: WithSpringConfig = {
  stiffness: 120,
  overshootClamping: true,
}

const formatTimer = (ms: number, showMs = false): string => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = Math.floor((ms % 1000) / 10)
  
  if (showMs) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function RecordingModal() {
  const insets = useSafeAreaInsets()
  const isRecordingModalVisible = useLyricStore(s => s.isRecordingModalVisible)
  const toggleRecordingModal = useLyricStore(s => s.toggleRecordingModal)

  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [recordingName, setRecordingName] = useState('Record Mumble')

  const recorderRef = useRef<RecorderRef>(null)

  const scale = useSharedValue(1)
  const sheetHeight = useSharedValue(0)

  useEffect(() => {
    if (isRecordingModalVisible) {
      sheetHeight.value = withSpring(MODAL_HEIGHT, { damping: 20, stiffness: 300 })
    } else {
      sheetHeight.value = withSpring(0, { damping: 20, stiffness: 300 })
    }
  }, [isRecordingModalVisible])

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startHeight = sheetHeight.value
    },
    onActive: (event, context: any) => {
      const deltaY = -event.translationY
      const newHeight = Math.max(0, Math.min(MODAL_HEIGHT, context.startHeight + deltaY))
      sheetHeight.value = newHeight
    },
    onEnd: (event) => {
      const velocity = -event.velocityY
      
      if (velocity < -500) {
        sheetHeight.value = withSpring(0, { damping: 20, stiffness: 300 })
        runOnJS(toggleRecordingModal)(false)
      } else {
        sheetHeight.value = withSpring(MODAL_HEIGHT, { damping: 20, stiffness: 300 })
      }
    },
  })

    const handleRecordStop = async (record?: RecordInfo) => {
      setIsRecording(false)

      if (record?.uri) {
        try {
          const validation = await validateAudioFile(record.uri)
          
          if (!validation.isValid) {
            console.error('Recording validation failed:', validation.error)
            return
          }

          const { addRecording, recordingsByProject, currentProjectId } = useLyricStore.getState()
          const projectRecordings = recordingsByProject[currentProjectId ?? '__unassigned__'] ?? []
          const countForProject = projectRecordings.length
          const nextIndex = countForProject + 1
          
          addRecording({
            name: `MUMBL ${nextIndex}`,
            uri: record.uri,
            duration: record.duration || 0,
          })
          
          console.log('Recording saved successfully:', record)
          
          // Close modal after successful save
          toggleRecordingModal(false)
        } catch (error) {
          console.error('Error processing recording:', error)
        }
      }
    }

    const toggleRecording = async () => {
      const permissionStatus = await Audio.getPermissionsAsync()
      if (!permissionStatus.granted) return

      Haptics.selectionAsync()
      if (isRecording) {
        // Stop recording and save
        const record = await recorderRef.current?.stopRecording()
        handleRecordStop(record)
        scale.value = withSpring(1, SPRING_SHORT_CONFIG)
      } else {
        // Start recording
        await recorderRef.current?.startRecording()
        scale.value = withSpring(RECORDING_INDICATOR_SCALE, SPRING_SHORT_CONFIG)
        setIsRecording(true)
      }
    }

    const resetRecording = async () => {
      if (isRecording) return

      Haptics.selectionAsync()
      await recorderRef.current?.resetRecording()
    }

    const togglePlayback = async () => {
      if (isRecording) return

      Haptics.selectionAsync()
      if (isPlaying) {
        await recorderRef.current?.stopPlayback()
      } else {
        await recorderRef.current?.startPlayback()
      }
    }

    const $recordIndicatorStyles: StyleProp<ViewStyle> = [
      $recordIndicator,
      useAnimatedStyle(() => ({
        borderRadius: interpolate(
          scale.value,
          [1, RECORDING_INDICATOR_SCALE],
          [6, 24],
          Extrapolation.CLAMP
        ),
        transform: [{ scale: scale.value }],
      })),
    ]

  const animatedSheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }))

  return (
    <Modal
      visible={isRecordingModalVisible}
      transparent
      animationType="none"
      onRequestClose={() => toggleRecordingModal(false)}
    >
      <Pressable style={$backdrop} onPress={() => toggleRecordingModal(false)} />
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[
          $sheet, 
          animatedSheetStyle,
          { paddingBottom: Math.max(insets.bottom, 20) }
        ]}>
          {/* Drag Handle */}
          <View style={$dragHandle} />
          
          {/* Header */}
          <View style={$header}>
            <Text style={$headerTitle}>{recordingName}</Text>
            <Text style={$headerSubtitle}>
              Capture your melody ideas • {formatTimer(Math.round(position / 100) * 100, false)}
            </Text>
          </View>
          
          {/* Timer */}
          <View style={$timerContainer}>
            <Text style={$timerText}>
              {formatTimer(Math.round(position / 100) * 100, true)}
            </Text>
          </View>
          
          {/* Waveform Display */}
          <View style={$waveformContainer}>
            <Recorder
              ref={recorderRef}
              tintColor="#DC2626"
              waveformInactiveColor="#555"
              progressInterval={50}
              timelineColor="#666"
              backgroundColor="transparent"
              progressBackgroundColor="transparent"
              onRecordStop={handleRecordStop}
              onRecordReset={() => {
                scale.value = 1
                setIsRecording(false)
                setIsPlaying(false)
              }}
              onPlaybackStart={() => setIsPlaying(true)}
              onPlaybackStop={() => setIsPlaying(false)}
              onPositionChange={(pos: number) => setPosition(pos)}
            />
          </View>
          
          {/* Record Button */}
          <View style={$recordContainer}>
            <Pressable style={$recordButton} onPress={toggleRecording}>
              <Animated.View style={$recordIndicatorStyles} />
            </Pressable>
          </View>
          
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  )
}

const $backdrop: ViewStyle = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.6)',
}

const $sheet: ViewStyle = {
  position: 'absolute',
  bottom: 0,
  width: '100%',
  backgroundColor: 'rgba(42, 42, 42, 0.95)',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingTop: 12,
  paddingHorizontal: 24,
  borderTopWidth: 1,
  borderTopColor: '#444',
}

const $dragHandle: ViewStyle = {
  alignSelf: 'center',
  width: 48,
  height: 6,
  borderRadius: 3,
  backgroundColor: '#666',
  marginBottom: 16,
}

const $header: ViewStyle = {
  alignItems: 'center',
  paddingBottom: 24,
}

const $headerTitle: TextStyle = {
  fontSize: 18,
  fontWeight: '600',
  color: '#FFFFFF',
  textAlign: 'center',
  marginBottom: 4,
}

const $headerSubtitle: TextStyle = {
  fontSize: 14,
  color: '#999',
  fontWeight: '400',
  textAlign: 'center',
}

const $timerContainer: ViewStyle = {
  alignItems: 'center',
  marginBottom: 24,
}

const $timerText: TextStyle = {
  fontSize: 20,
  fontWeight: '600',
  color: '#FFFFFF',
  fontFamily: 'System',
}

const $waveformContainer: ViewStyle = {
  backgroundColor: '#1A1A1A',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#333',
  marginBottom: 32,
  marginHorizontal: 8,
  height: 100,
}

const $recordContainer: ViewStyle = {
  alignItems: 'center',
  marginBottom: 24,
}

const $recordButton: ViewStyle = {
  width: RECORD_BUTTON_SIZE,
  height: RECORD_BUTTON_SIZE,
  borderRadius: RECORD_BUTTON_SIZE / 2,
  backgroundColor: RECORDING_INDICATOR_COLOR,
  alignItems: 'center',
  justifyContent: 'center',
}

const $recordIndicator: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 6,
  height: 24,
  width: 24,
}


