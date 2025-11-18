/**
 * Enhanced Lyriq App - Integrated with Geminiv3 Features
 *
 * This is a simplified App.tsx that uses the enhanced components.
 * To use this, rename your current App.tsx to App_Original.tsx
 * and rename this file to App.tsx
 *
 * Features:
 * - Dark theme design system
 * - Gemini AI rhyme suggestions
 * - Syllable counter
 * - Swipe-to-delete gestures
 * - View mode toggle
 * - Per-section audio takes
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EnhancedLyricPadScreen } from './src/screens/EnhancedLyricPadScreen';
import { useLyricStore } from './src/state/lyricStore';
import './global.css';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <EnhancedLyricPadScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
