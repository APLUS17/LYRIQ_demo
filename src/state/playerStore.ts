import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';

export type Track = { 
  uri: string; 
  name: string; 
  duration?: number; 
};

interface PlayerState {
  track?: Track;
  sound?: Audio.Sound;
  position: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  
  // Actions
  loadTrack: (t: Track) => Promise<void>;
  playPause: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (vol: number) => Promise<void>;
  unload: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      track: undefined,
      sound: undefined,
      position: 0,
      duration: 1,
      isPlaying: false,
      volume: 0.8,

      loadTrack: async (t) => {
        const prev = get().sound;
        if (prev) {
          prev.setOnPlaybackStatusUpdate(null);
          await prev.unloadAsync().catch(() => {});
        }
        
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
        
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: t.uri },
            { 
              shouldPlay: false, 
              progressUpdateIntervalMillis: 250,
              volume: get().volume,
              isLooping: false,
            }
          );
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if ('isLoaded' in status && status.isLoaded) {
              const st = status as AVPlaybackStatusSuccess;
              set({
                position: st.positionMillis ?? 0,
                duration: st.durationMillis ?? get().duration,
                isPlaying: !!st.isPlaying,
              });
            }
          });
          
          const status = await sound.getStatusAsync();
          if ('isLoaded' in status && status.isLoaded) {
            const loadedStatus = status as AVPlaybackStatusSuccess;
            await sound.setVolumeAsync(get().volume);
            set({ 
              sound, 
              track: t, 
              duration: loadedStatus.durationMillis ?? 1,
              position: 0,
              isPlaying: false
            });
            console.log('Track loaded successfully:', t.name, 'Duration:', loadedStatus.durationMillis, 'Volume:', get().volume);
          } else {
            console.log('Audio failed to load:', status);
          }
        } catch (error) {
          console.log('Error loading track:', error);
          throw error;
        }
      },

      playPause: async () => {
        const s = get().sound;
        if (!s) {
          console.log('No sound loaded');
          return;
        }
        
        try {
          const status = await s.getStatusAsync();
          if ('isLoaded' in status && status.isLoaded) {
            const st = status as AVPlaybackStatusSuccess;
            if (st.isPlaying) {
              console.log('Pausing audio');
              await s.pauseAsync();
            } else {
              console.log('Playing audio');
              await s.playAsync();
            }
          } else {
            console.log('Sound not loaded properly', status);
          }
        } catch (error) {
          console.log('Error playing/pausing:', error);
        }
      },

      seek: async (ms) => {
        const s = get().sound;
        if (!s) return;
        
        try {
          await s.setPositionAsync(Math.max(0, ms));
        } catch (error) {
          console.log('Error seeking:', error);
        }
      },

      setVolume: async (vol) => {
        const s = get().sound;
        set({ volume: vol });
        
        if (s) {
          try {
            await s.setVolumeAsync(vol);
          } catch (error) {
            console.log('Error setting volume:', error);
          }
        }
      },

      unload: async () => {
        const s = get().sound;
        if (s) {
          s.setOnPlaybackStatusUpdate(null);
          await s.unloadAsync().catch(() => {});
        }
        set({ 
          sound: undefined, 
          track: undefined, 
          position: 0, 
          duration: 1, 
          isPlaying: false 
        });
      },
    }),
    {
      name: 'lyriq-player-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        track: state.track,
        volume: state.volume,
      }),
    }
  )
);