import React, { useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  Pressable,
  View,
  Modal,
  Keyboard,
  Alert,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLyricStore } from '../state/lyricStore';
import { validateAudioFile } from '../utils/audioValidation';
import Recorder from './Recorder';

const { height } = Dimensions.get('window');
const SNAP_POINT = height * 0.4; // % of screen the modal should cover

export default function RecordingModal() {
  const insets = useSafeAreaInsets();
  const { isRecordingModalVisible, toggleRecordingModal } = useLyricStore();
  const translateY = useSharedValue(height);

  /* animate in/out whenever visibility changes */
  useEffect(() => {
    if (isRecordingModalVisible) {
      Keyboard.dismiss(); // Auto-dismiss keyboard when modal opens
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    } else {
      translateY.value = withSpring(height, { damping: 20, stiffness: 300 });
    }
  }, [isRecordingModalVisible]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startY = translateY.value;
    },
    onActive: (event, context: any) => {
      // Only allow downward swipe to dismiss
      if (context.startY !== undefined) {
        const newTranslateY = Math.max(0, context.startY + event.translationY);
        translateY.value = newTranslateY;
      }
    },
    onEnd: (event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Dismiss modal
        translateY.value = withSpring(height, { damping: 20, stiffness: 300 });
        runOnJS(toggleRecordingModal)(false);
      } else {
        // Snap back to open position
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={isRecordingModalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => toggleRecordingModal(false)}
    >
      {/* dimmed backdrop */}
      <Pressable style={styles.backdrop} onPress={() => toggleRecordingModal(false)} />

      {/* slide-up sheet */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }, sheetStyle]}>
          <View style={styles.dragHandle} />
          <Recorder 
            onStart={() => {
              // Recording started
            }}
            onStop={async (duration, uri) => {
              try {
                console.log('Validating recording:', { uri, duration });
                
                // Validate the recording using our utility
                const validation = await validateAudioFile(uri);
                
                if (!validation.isValid) {
                  console.error('Recording validation failed:', validation.error);
                  Alert.alert(
                    'Recording Error', 
                    `Recording could not be saved: ${validation.error}`
                  );
                  return;
                }

                console.log('Recording validation passed:', validation);
                
                const { addRecording, recordings, currentProject } = useLyricStore.getState();
                const currentProjectId = currentProject?.id;
                const countForProject = recordings.filter(r => r.projectId === currentProjectId).length;
                const nextIndex = countForProject + 1;
                addRecording({
                  name: `MUMBL ${nextIndex}`,
                  uri: uri,
                  duration: duration,
                });
                console.log('Recording saved successfully:', { uri, duration });
                
                // Auto-close modal after recording
                setTimeout(() => {
                  toggleRecordingModal(false);
                }, 500);
                
              } catch (error) {
                console.error('Error processing recording:', error);
                Alert.alert('Recording Error', 'Failed to save the recording. Please try again.');
              }
            }}
            visualizerBars={32}
          />
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    minHeight: 300,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 12,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#666',
    marginBottom: 12,
  },
});