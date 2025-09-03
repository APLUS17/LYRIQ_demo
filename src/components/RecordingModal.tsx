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
const RECORD_BUTTON_SIZE = 60
const RECORD_BUTTON_BACKGROUND_SIZE = RECORD_BUTTON_SIZE + 16
const RECORDING_INDICATOR_COLOR = '#d72d66'
const RECORDING_INDICATOR_SCALE = 0.5
const COMPACT_HEIGHT = 280
const EXPANDED_HEIGHT = height * 0.9

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [recordingName, setRecordingName] = useState('Record Mumble')

  const recorderRef = useRef<RecorderRef>(null)

  const backgroundColor = '#2A2A2A'
  const progressBackgroundColor = '#444'
  const iconColor = '#FFFFFF'
  const tintColor = '#d72d66'
  const timelineColor = '#666'
  const positionColor = '#FFFFFF'
  const recordBorderColor = 'rgba(255,255,255,0.3)'
  const recorderBackgroundColor = '#1A1A1A'
  const waveformInactiveColor = '#555'

  const scale = useSharedValue(1)
  const sheetHeight = useSharedValue(COMPACT_HEIGHT)

  useEffect(() => {
    if (isRecordingModalVisible) {
      sheetHeight.value = withSpring(COMPACT_HEIGHT, { damping: 20, stiffness: 300 })
      setIsExpanded(false)
    } else {
      sheetHeight.value = withSpring(0, { damping: 20, stiffness: 300 })
      setIsExpanded(false)
    }
  }, [isRecordingModalVisible])

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startHeight = sheetHeight.value
    },
    onActive: (event, context: any) => {
      const deltaY = -event.translationY
      const newHeight = Math.max(0, Math.min(EXPANDED_HEIGHT, context.startHeight + deltaY))
      sheetHeight.value = newHeight
    },
    onEnd: (event) => {
      const velocity = -event.velocityY
      const currentHeight = sheetHeight.value
      
      if (velocity > 1000 || currentHeight > COMPACT_HEIGHT + 100) {
        sheetHeight.value = withSpring(EXPANDED_HEIGHT, { damping: 20, stiffness: 300 })
        runOnJS(setIsExpanded)(true)
      } else if (velocity < -1000 || currentHeight < COMPACT_HEIGHT - 100) {
        sheetHeight.value = withSpring(0, { damping: 20, stiffness: 300 })
        runOnJS(toggleRecordingModal)(false)
        runOnJS(setIsExpanded)(false)
      } else {
        sheetHeight.value = withSpring(COMPACT_HEIGHT, { damping: 20, stiffness: 300 })
        runOnJS(setIsExpanded)(false)
      }
    },
  })

    const handleRecordStop = async (record?: RecordInfo) => {
      scale.value = withSpring(1, SPRING_SHORT_CONFIG)
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
        } catch (error) {
          console.error('Error processing recording:', error)
        }
      }

      recorderRef.current?.startPlayback()
    }

    const toggleRecording = async () => {
      const permissionStatus = await Audio.getPermissionsAsync()
      if (!permissionStatus.granted) return

      Haptics.selectionAsync()
      if (isRecording) {
        const record = await recorderRef.current?.stopRecording()
        handleRecordStop(record)
      } else {
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
          [RECORD_BUTTON_SIZE / 2, 8],
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
      statusBarTranslucent={isExpanded}
      onRequestClose={() => {
        setIsExpanded(false)
        toggleRecordingModal(false)
      }}
    >
      <Pressable style={$backdrop} onPress={() => {
        setIsExpanded(false)
        toggleRecordingModal(false)
      }} />
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[
          $sheet, 
          animatedSheetStyle,
          { paddingBottom: Math.max(insets.bottom, 20) },
          isExpanded && $expandedSheet
        ]}>
          {/* Drag Handle */}
          <View style={$dragHandle} />
          
          {/* Compact Header */}
          {!isExpanded && (
            <View style={$compactHeader}>
              <TouchableOpacity 
                style={$headerTouchArea}
                onPress={() => {
                  setIsExpanded(true)
                  sheetHeight.value = withSpring(EXPANDED_HEIGHT, { damping: 20, stiffness: 300 })
                }}
                onLongPress={() => setIsRenaming(true)}
              >
                {isRenaming ? (
                  <TextInput
                    style={[$headerTitle, { color: positionColor }]}
                    value={recordingName}
                    onChangeText={setRecordingName}
                    onBlur={() => setIsRenaming(false)}
                    onSubmitEditing={() => setIsRenaming(false)}
                    autoFocus
                    selectTextOnFocus
                  />
                ) : (
                  <Text style={[$headerTitle, { color: positionColor }]}>{recordingName}</Text>
                )}
                <Text style={$headerSubtitle}>
                  Capture your melody ideas • {formatTimer(Math.round(position / 100) * 100, false)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Expanded Header */}
          {isExpanded && (
            <View style={$header}>
              <TouchableOpacity 
                style={$closeButton} 
                onPress={() => {
                  setIsExpanded(false)
                  sheetHeight.value = withSpring(COMPACT_HEIGHT, { damping: 20, stiffness: 300 })
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={24} color={iconColor} />
              </TouchableOpacity>
              
              {isRenaming ? (
                <TextInput
                  style={[$headerTitle, { color: positionColor, flex: 1, textAlign: 'center' }]}
                  value={recordingName}
                  onChangeText={setRecordingName}
                  onBlur={() => setIsRenaming(false)}
                  onSubmitEditing={() => setIsRenaming(false)}
                  autoFocus
                  selectTextOnFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setIsRenaming(true)} style={{ flex: 1 }}>
                  <Text style={[$headerTitle, { color: positionColor }]}>{recordingName}</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={$confirmButton} 
                onPress={() => {
                  setIsExpanded(false)
                  toggleRecordingModal(false)
                }}
              >
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={isExpanded ? $expandedContent : $compactContent}>
            {/* Single Timer Above Waveform */}
            <View style={$timerContainer}>
              <Text style={[$timerText, { color: positionColor }]}>
                {formatTimer(Math.round(position / 100) * 100, true)}
              </Text>
            </View>
            
            {/* Waveform Card */}
            <View style={$waveformCard}>
              <View style={isExpanded ? $expandedWaveformContainer : $compactWaveformContainer}>
                <Recorder
                  ref={recorderRef}
                  tintColor={tintColor}
                  waveformInactiveColor={waveformInactiveColor}
                  progressInterval={50}
                  timelineColor={timelineColor}
                  backgroundColor={recorderBackgroundColor}
                  progressBackgroundColor={progressBackgroundColor}
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
              
              {/* Controls inside card */}
              {!isRecording && (
                <View style={$cardControls}>
                  <TouchableOpacity style={$cardControlButton}>
                    <Ionicons name="play-skip-back" size={24} color={iconColor} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={$cardPlayButton} onPress={togglePlayback}>
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={28}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={$cardControlButton}>
                    <Ionicons name="play-skip-forward" size={24} color={iconColor} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Show record button only when recording or in compact mode */}
            {(isRecording || !isExpanded) && (
              <View style={$compactRecordContainer}>
                <View style={$recordButtonContainer}>
                  <View style={[$recordButtonBackground, { borderColor: recordBorderColor }]} />
                  <Pressable style={$recordButton} onPress={toggleRecording}>
                    <Animated.View style={$recordIndicatorStyles} />
                  </Pressable>
                </View>
              </View>
            )}
            
            {/* Bottom Actions - Only in expanded mode */}
            {isExpanded && (
              <View style={$bottomActions}>
                <TouchableOpacity style={$actionButton}>
                  <Ionicons name="chatbubble-outline" size={24} color={iconColor} />
                </TouchableOpacity>
                
                <TouchableOpacity style={$resumeButton} onPress={toggleRecording}>
                  <Text style={$resumeText}>{isRecording ? 'PAUSE' : 'RESUME'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={$actionButton}>
                  <Ionicons name="options-outline" size={24} color={iconColor} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  )
}

const $backdrop: ViewStyle = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
}

const $sheet: ViewStyle = {
  position: 'absolute',
  bottom: 0,
  width: '100%',
  backgroundColor: '#2A2A2A',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  paddingTop: 12,
  paddingHorizontal: 16,
}

const $expandedSheet: ViewStyle = {
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  paddingTop: 60,
}

const $dragHandle: ViewStyle = {
  alignSelf: 'center',
  width: 40,
  height: 5,
  borderRadius: 2.5,
  backgroundColor: '#666',
  marginBottom: 12,
}

const $header: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingBottom: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#444',
  marginBottom: 20,
}

const $headerTitle: TextStyle = {
  fontSize: 18,
  fontWeight: '600',
  textAlign: 'center',
}

const $closeButton: ViewStyle = {
  padding: 8,
}

const $confirmButton: ViewStyle = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#007AFF',
  alignItems: 'center',
  justifyContent: 'center',
}


const $compactWaveformContainer: ViewStyle = {
  height: 80,
}

const $expandedWaveformContainer: ViewStyle = {
  height: 200,
  marginVertical: 40,
}


const $bottomActions: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 32,
  marginTop: 60,
}

const $actionButton: ViewStyle = {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: 'rgba(255,255,255,0.1)',
  alignItems: 'center',
  justifyContent: 'center',
}

const $resumeButton: ViewStyle = {
  backgroundColor: '#DC2626',
  paddingHorizontal: 40,
  paddingVertical: 16,
  borderRadius: 25,
}

const $resumeText: TextStyle = {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
}

const $compactHeader: ViewStyle = {
  alignItems: 'center',
  paddingHorizontal: 16,
  marginBottom: 20,
}

const $headerTouchArea: ViewStyle = {
  alignItems: 'center',
  paddingVertical: 8,
}

const $headerSubtitle: TextStyle = {
  fontSize: 12,
  color: '#888',
  fontWeight: '400',
  marginTop: 4,
  textAlign: 'center',
}

const $timerContainer: ViewStyle = {
  alignItems: 'center',
  marginBottom: 16,
}

const $timerText: TextStyle = {
  fontSize: 16,
  fontWeight: '500',
  fontFamily: 'System',
}

const $waveformCard: ViewStyle = {
  backgroundColor: '#1A1A1A',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#333',
  padding: 12,
  marginHorizontal: 4,
  marginBottom: 8,
}

const $cardControls: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 12,
  gap: 20,
}

const $cardControlButton: ViewStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(255,255,255,0.1)',
  alignItems: 'center',
  justifyContent: 'center',
}

const $cardPlayButton: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#007AFF',
  alignItems: 'center',
  justifyContent: 'center',
}

const $compactRecordContainer: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  paddingVertical: 16,
}

const $compactContent: ViewStyle = {
  flex: 1,
  paddingTop: 12,
}

const $expandedContent: ViewStyle = {
  flex: 1,
  justifyContent: 'center',
  paddingVertical: 40,
}


const $recordButtonContainer: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: 32,
}

const $recordButtonBackground: ViewStyle = {
  borderRadius: RECORD_BUTTON_BACKGROUND_SIZE / 2,
  height: RECORD_BUTTON_BACKGROUND_SIZE,
  width: RECORD_BUTTON_BACKGROUND_SIZE,
  borderWidth: 2,
  borderColor: 'white',
}

const $recordButton: ViewStyle = {
  position: 'absolute',
}

const $recordIndicator: ViewStyle = {
  backgroundColor: RECORDING_INDICATOR_COLOR,
  borderRadius: RECORD_BUTTON_SIZE / 2,
  height: RECORD_BUTTON_SIZE,
  width: RECORD_BUTTON_SIZE,
}

