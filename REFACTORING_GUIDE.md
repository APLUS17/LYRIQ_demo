# LYRIQ Refactoring Guide - Geminiv3 Integration

This document outlines the enhanced features integrated from LYRIQ_Geminiv3 into your Expo-based LYRIQ_demo application.

## What's New

### 1. **Gemini AI Integration**
- **Contextual Rhyme Suggestions**: Select a word in your lyrics to get AI-powered rhyming suggestions
- **Lyric Improvement Suggestions**: Get creative suggestions to enhance your lyrics
- **Writing Prompts**: Generate creative prompts based on themes and moods

**Files Added:**
- `src/api/gemini.ts` - Gemini API service

**Usage:**
```typescript
import { getRhymeSuggestions } from '../api/gemini';

const rhymes = await getRhymeSuggestions('night', 'Dancing through the night');
```

### 2. **Syllable Counter**
- **Real-time Syllable Counting**: See syllable counts for each line
- **Syllable Statistics**: View total, average, and range stats per section
- **Visual Display**: Monospace font display aligned with lyrics

**Files Added:**
- `src/utils/syllableCounter.ts` - Syllable counting utilities
- `src/components/SyllableDisplay.tsx` - Display components

**Usage:**
Toggle syllable counter from the options menu (three dots in header)

### 3. **Enhanced Gestures**
- **Swipe-to-Delete**: Swipe left on a section to delete it
- **Long-Press Drag-to-Reorder**: (Coming soon) Long-press and drag sections to reorder

**Implementation:**
- Uses `react-native-gesture-handler` for smooth animations
- Customizable swipe threshold (currently 1/3.5 of screen width)

### 4. **Rhyme Popover**
- **Word Selection Trigger**: Select a single word to trigger rhyme lookup
- **Beautiful UI**: Dark-themed modal with smooth animations
- **Quick Insert**: Tap any rhyme to replace the selected word

**Files Added:**
- `src/components/RhymePopover.tsx`

### 5. **Enhanced Lyric Editor**
- **Line-based Parsing**: Lyrics split into individual lines for better analysis
- **Rich Text Editing**: Georgia font for lyrics, improved readability
- **Integrated Syllable Display**: Optional syllable counter integrated into editor

**Files Added:**
- `src/components/EnhancedLyricSection.tsx`

### 6. **Per-Section Audio Takes**
- **Link Takes to Sections**: Record audio specifically for each section
- **Section-Specific Playback**: Play takes directly from section cards
- **Horizontal Scroll**: Swipe through multiple takes per section

**Files Added:**
- `src/components/SectionAudioTakes.tsx`

**Updated Types:**
```typescript
export type Recording = {
  id: string;
  name: string;
  uri: string;
  duration: number;
  sectionId?: string; // NEW: Link to specific section
  createdAt: string;
};
```

### 7. **View Modes**
- **Structured View**: Full cards with all features visible
- **Compact View**: Collapsible cards for quick overview

**Store Updates:**
```typescript
// New state properties
viewMode: 'structured' | 'compact';
syllableCountEnabled: boolean;
toggleViewMode: () => void;
toggleSyllableCount: () => void;
```

### 8. **Dark Theme Design System**
Based on Geminiv3's professional dark theme:

**Color Palette:**
- `#121212` - Main background (almost black)
- `#1c1c1e` - Container background (dark charcoal)
- `#2a2a2e` - Card background (dark slate)
- `#FACC15` - Accent yellow (waveforms, stars)
- `#60A5FA` - Accent blue (Gemini AI features)
- `#EF4444` - Accent red (destructive actions)

**Typography:**
- Inter - UI text and headings
- Georgia - Lyric content
- Monospace - Syllable counts and technical data

**Tailwind Config Updated:**
```javascript
colors: {
  primary: {
    bg: '#121212',
    container: '#1c1c1e',
    card: '#2a2a2e',
  },
  accent: {
    yellow: '#facc15',
    blue: '#60A5FA',
    red: '#EF4444',
  },
}
```

## Integration Guide

### Option 1: Use EnhancedLyricPadScreen Directly

Replace your current screen with the enhanced version:

```typescript
import { EnhancedLyricPadScreen } from './src/screens/EnhancedLyricPadScreen';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <EnhancedLyricPadScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### Option 2: Integrate Components Individually

Use enhanced components in your existing screens:

```typescript
import { EnhancedLyricSection } from './src/components/EnhancedLyricSection';
import { SectionAudioTakes } from './src/components/SectionAudioTakes';
import { SyllableDisplay } from './src/components/SyllableDisplay';

// In your screen
{sections.map((section, index) => (
  <EnhancedLyricSection key={section.id} section={section} index={index} />
))}
```

### Option 3: Keep Both Versions

You can keep both the original and enhanced screens and switch between them:

```typescript
const [useEnhanced, setUseEnhanced] = useState(true);

return useEnhanced
  ? <EnhancedLyricPadScreen />
  : <LyricPadScreen />;
```

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_key_here
```

Get a Gemini API key from: https://makersuite.google.com/app/apikey

### 2. Install Dependencies

Already installed:
- ✅ `@google/generative-ai` - Gemini AI SDK
- ✅ `react-native-gesture-handler` - Gestures
- ✅ `expo-audio` - Audio playback

### 3. Test the Features

1. Start the development server:
```bash
bun start
```

2. Run on your device:
```bash
bun run ios
# or
bun run android
```

3. Test features:
   - Create a new section
   - Write some lyrics
   - Select a word to see rhyme suggestions
   - Toggle syllable counter from options menu
   - Swipe left on a section to delete
   - Toggle between structured/compact views

## Feature Availability Matrix

| Feature | Original | Enhanced | Notes |
|---------|----------|----------|-------|
| Basic lyric editing | ✅ | ✅ | Enhanced has better UI |
| Dark theme | ❌ | ✅ | Professional Geminiv3 theme |
| Syllable counter | ❌ | ✅ | Toggle in options menu |
| Rhyme suggestions | ❌ | ✅ | Requires Gemini API key |
| Swipe to delete | ❌ | ✅ | Gesture-based |
| View modes | ❌ | ✅ | Structured/Compact |
| Per-section takes | ❌ | ✅ | Link recordings to sections |
| Audio recording | ✅ | ✅ | Both support expo-audio |
| Project management | ✅ | ✅ | Same Zustand store |

## Troubleshooting

### Rhyme Suggestions Not Working
1. Check `.env` file has `EXPO_PUBLIC_GEMINI_API_KEY`
2. Restart Expo dev server after adding env vars
3. Check console for API errors

### Gestures Not Working
1. Ensure `GestureHandlerRootView` wraps your app
2. Check that `react-native-gesture-handler` is installed
3. Rebuild app if on physical device

### Syllable Counter Inaccurate
- The algorithm is based on English pronunciation rules
- Some words may not count perfectly
- You can extend the special cases dictionary in `src/utils/syllableCounter.ts`

### Dark Theme Not Applied
1. Check that components use the new class names
2. Verify `tailwind.config.js` has been updated
3. Clear cache: `bun start --clear`

## Migration Path

If you want to migrate from the original to the enhanced version:

1. **Backup your data** - The store structure is backward compatible
2. **Test in parallel** - Keep both screens and switch between them
3. **Gradual migration** - Migrate one component at a time
4. **Full switch** - Once tested, update your main App.tsx

## API Costs

**Gemini API Pricing:**
- Free tier: 60 requests per minute
- Paid tier: Very affordable (~$0.00025 per request for Gemini 1.5 Flash)

**Estimated Usage:**
- Rhyme suggestion: ~1 request per word lookup
- Average song (30 words looked up): ~$0.0075

## Future Enhancements

Potential features to add:
- [ ] Drag-to-reorder sections (long-press gesture)
- [ ] Beat matching for takes
- [ ] Collaborative editing
- [ ] Export with syllable annotations
- [ ] Rhyme scheme visualization
- [ ] Custom syllable dictionary
- [ ] Offline rhyme database

## Support

For questions or issues:
1. Check this guide first
2. Review the source code comments
3. Check CLAUDE.md for general project info
4. Refer to LYRIQ_Geminiv3 repository for original implementation

## Credits

- Original Geminiv3 design: Dark theme and syllable counter inspiration
- Expo team: Modern audio APIs (expo-audio)
- Google: Gemini AI API for rhyme suggestions

---

**Last Updated:** 2025-01-18
**Version:** 1.0.0
**Compatibility:** Expo SDK 53, React Native 0.79
