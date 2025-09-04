import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Platform-specific imports
let Audio: any = null;
let AVPlaybackStatusSuccess: any = null;

if ((Platform.OS as string) !== 'web') {
  const ExpoAV = require('expo-av');
  Audio = ExpoAV.Audio;
  AVPlaybackStatusSuccess = ExpoAV.AVPlaybackStatusSuccess;
}

export type Track = { 
  uri: string; 
  name: string; 
  duration?: number; 
};

// Web Audio Player class
class WebAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private onStatusUpdate: ((status: any) => void) | null = null;
  private updateInterval: number | null = null;

  async load(uri: string, volume: number = 0.8): Promise<void> {
    if (this.audio) {
      this.cleanup();
    }

    this.audio = new Audio(uri);
    if (this.audio) {
      this.audio.volume = volume;
      this.audio.preload = 'metadata';
    }

    return new Promise((resolve, reject) => {
      if (!this.audio) return reject(new Error('Audio element not created'));

      this.audio.onloadedmetadata = () => {
        if (this.audio) {
          this.startStatusUpdates();
          resolve();
        }
      };

      this.audio.onerror = (e) => {
        reject(new Error('Failed to load audio'));
      };
    });
  }

  async play(): Promise<void> {
    if (this.audio) {
      await this.audio.play();
    }
  }

  async pause(): Promise<void> {
    if (this.audio) {
      this.audio.pause();
    }
  }

  async seek(timeSeconds: number): Promise<void> {
    if (this.audio) {
      this.audio.currentTime = timeSeconds;
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  setOnPlaybackStatusUpdate(callback: ((status: any) => void) | null): void {
    this.onStatusUpdate = callback;
  }

  private startStatusUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = window.setInterval(() => {
      if (this.audio && this.onStatusUpdate) {
        this.onStatusUpdate({
          isLoaded: true,
          positionMillis: Math.floor(this.audio.currentTime * 1000),
          durationMillis: Math.floor(this.audio.duration * 1000),
          isPlaying: !this.audio.paused && !this.audio.ended,
        });
      }
    }, 250);
  }

  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.onStatusUpdate = null;
  }

  getDuration(): number {
    return this.audio ? Math.floor(this.audio.duration * 1000) : 0;
  }

  getPosition(): number {
    return this.audio ? Math.floor(this.audio.currentTime * 1000) : 0;
  }

  getIsPlaying(): boolean {
    return this.audio ? !this.audio.paused && !this.audio.ended : false;
  }
}

interface PlayerState {
  track?: Track;
  sound?: any; // Can be Audio.Sound or WebAudioPlayer
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
          if (Platform.OS === 'web' && prev instanceof WebAudioPlayer) {
            prev.cleanup();
          } else if ((Platform.OS as string) !== 'web' && prev) {
            prev.setOnPlaybackStatusUpdate(null);
            await prev.unloadAsync().catch(() => {});
          }
        }

        if ((Platform.OS as string) === 'web') {
          // Web Audio implementation
          try {
            const webPlayer = new WebAudioPlayer();
            await webPlayer.load(t.uri, get().volume);
            
            webPlayer.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded) {
                set({
                  position: status.positionMillis ?? 0,
                  duration: status.durationMillis ?? get().duration,
                  isPlaying: !!status.isPlaying,
                });
              }
            });

            const duration = webPlayer.getDuration();
            set({ 
              sound: webPlayer, 
              track: t, 
              duration: duration || 1,
              position: 0,
              isPlaying: false
            });
            console.log('Web track loaded successfully:', t.name, 'Duration:', duration);
          } catch (error) {
            console.log('Error loading web track:', error);
            throw error;
          }
        } else {
          // Native Audio implementation
          if (!Audio) {
            console.log('Audio not available on this platform');
            return;
          }

          // Set audio mode for playback
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
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
            
            sound.setOnPlaybackStatusUpdate((status: any) => {
              if ('isLoaded' in status && status.isLoaded) {
                const st = status;
                set({
                  position: st.positionMillis ?? 0,
                  duration: st.durationMillis ?? get().duration,
                  isPlaying: !!st.isPlaying,
                });
              }
            });
            
            const status = await sound.getStatusAsync();
            if ('isLoaded' in status && status.isLoaded) {
              const loadedStatus = status;
              await sound.setVolumeAsync(get().volume);
              set({ 
                sound, 
                track: t, 
                duration: loadedStatus.durationMillis ?? 1,
                position: 0,
                isPlaying: false
              });
              console.log('Native track loaded successfully:', t.name, 'Duration:', loadedStatus.durationMillis, 'Volume:', get().volume);
            } else {
              console.log('Audio failed to load:', status);
            }
          } catch (error) {
            console.log('Error loading native track:', error);
            throw error;
          }
        }
      },

      playPause: async () => {
        const s = get().sound;
        if (!s) {
          console.log('No sound loaded');
          return;
        }

        try {
          if (Platform.OS === 'web' && s instanceof WebAudioPlayer) {
            // Web Audio
            if (s.getIsPlaying()) {
              console.log('Pausing web audio');
              await s.pause();
            } else {
              console.log('Playing web audio');
              await s.play();
            }
          } else if ((Platform.OS as string) !== 'web') {
            // Native Audio
            const status = await s.getStatusAsync();
            if ('isLoaded' in status && status.isLoaded) {
              const st = status;
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
          }
        } catch (error) {
          console.log('Error playing/pausing:', error);
        }
      },

      seek: async (ms) => {
        const s = get().sound;
        if (!s) return;
        
        try {
          if (Platform.OS === 'web' && s instanceof WebAudioPlayer) {
            await s.seek(Math.max(0, ms / 1000)); // Convert to seconds
          } else if ((Platform.OS as string) !== 'web') {
            await s.setPositionAsync(Math.max(0, ms));
          }
        } catch (error) {
          console.log('Error seeking:', error);
        }
      },

      setVolume: async (vol) => {
        const s = get().sound;
        set({ volume: vol });
        
        if (s) {
          try {
            if (Platform.OS === 'web' && s instanceof WebAudioPlayer) {
              await s.setVolume(vol);
            } else if ((Platform.OS as string) !== 'web') {
              await s.setVolumeAsync(vol);
            }
          } catch (error) {
            console.log('Error setting volume:', error);
          }
        }
      },

      unload: async () => {
        const s = get().sound;
        if (s) {
          if (Platform.OS === 'web' && s instanceof WebAudioPlayer) {
            s.cleanup();
          } else if ((Platform.OS as string) !== 'web') {
            s.setOnPlaybackStatusUpdate(null);
            await s.unloadAsync().catch(() => {});
          }
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