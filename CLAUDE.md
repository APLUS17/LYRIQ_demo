CLAUDE – Project Overview for LYRIQ_demo

This document provides context and guidance for collaborating on the Lyriq project. Lyriq is a mobile‑first, AI‑assisted lyric‑writing application built with React Native and Expo. It allows songwriters to create, organise and refine lyrics, capture melodic ideas as audio "mumbles" and integrate AI‑powered suggestions. Use the information below to understand the project's goals, architecture and workflows. Additional details can be gathered from the source code and project documents.

Project Purpose & Domain

Main purpose – Lyriq is designed to help songwriters capture and organise their lyrical ideas. The app provides a clean lyric editor with serif fonts, lets users organise sections into verses, choruses and bridges, and automatically saves content using persistent storage
GitHub
. It also includes optional features such as a "mumble recorder" for capturing melodies, AI assistants (OpenAI, Anthropic and Grok) for lyric suggestions and a chat‑style sidebar for navigation
GitHub
.

Domain entities – The app revolves around three core data types defined in the Zustand store:

Project – Represents a song or session; each project has an id, a name and timestamps for creation and saving
GitHub
. A user can create, rename, delete and switch between projects
GitHub
.

Section – A portion of lyrics such as verse, chorus or bridge. Each section has an id, a type (e.g., 'verse', 'hook', 'bridge' or custom), optional title and content, an optional isStarred flag for favourites and a createdAt timestamp
GitHub
. Users can add, edit, reorder and remove sections and mark them as starred
GitHub
.

Recording (Take) – An audio "mumble" recorded to capture melodies. Each recording stores an id, name, uri to the audio file, its duration and a createdAt timestamp
GitHub
. Users can record multiple takes, rename them, delete them and play them back within the "Takes" screen
GitHub
.

Additional concepts – The state also tracks UI states such as whether the recording modal is visible, toast messages for success/error/info feedback and a performance mode flag (hides editing UI during performance)
GitHub
. These features improve user experience without complicating the core domain.

Tech Stack & Architecture

Frameworks & libraries – Lyriq uses React Native 0.76.7 (monorepo uses v0.79 for some dependencies) with TypeScript. It leverages Expo SDK 53 for development and building, NativeWind with Tailwind CSS for styling, Zustand for state management, AsyncStorage for persistence, React Navigation for screen transitions, React Native Reanimated v3 for animations and Expo Vector Icons for icons
GitHub
. The project also depends on expo-audio for modern audio hooks and numerous Expo modules as listed in package.json
GitHub
GitHub
.

Architecture & project structure – The code follows a modular architecture. At the root, App.tsx bootstraps the application. Under src/ you will find:

components/ – Reusable UI components (e.g., lyric sections, audio controls).

screens/ – Screen components like the lyric editor (LyricPadScreen) and audio recorder/manager (TakesScreen)
GitHub
.

state/ – The central Zustand store (lyricStore.ts) containing the project/section/recording state and actions
GitHub
.

api/ – Pre‑built API integrations for AI chat, transcription and image generation (see ReadMeKen.md for details)
GitHub
.

types/ – TypeScript type definitions.

utils/ – Utility functions.

assets/ – Static images and icons
GitHub
.

State management pattern – The app uses Zustand with the persist middleware and AsyncStorage for local persistence. The store defines the entire state shape (projects, sections and recordings) and exposes functions to manipulate it: creating projects, adding sections, updating section content and toggling star status, adding/removing recordings and retrieving current project data
GitHub
GitHub
. This pattern keeps state logic centralised and decoupled from UI components.

Audio subsystem – Audio recording/playback recently migrated to the modern expo-audio package. The new implementation uses hooks (useAudioRecorder, useAudioPlayer) for recording and playback, automatic audio session management, improved permission handling and comprehensive file validation
GitHub
. The change eliminates manual Audio.Recording/Audio.Sound management and improves performance and reliability
GitHub
.

AI integration – AI features are optional and include connectors for OpenAI GPT‑4, Anthropic Claude and Grok. These features can provide lyric suggestions and creative assistance when enabled by configuring environment variables
GitHub
.

Design system – Colours and typography are defined in the README to ensure consistent UI. Primary, secondary and accent colours and font choices (Georgia for lyrics, system fonts for UI) are specified
GitHub
.

Development Workflow

Prerequisites – Node.js v16+ and Bun as the package manager, along with Expo CLI and device simulators
GitHub
.

Installing & running – Clone the repository, install dependencies with bun install and start the development server using bun start
GitHub
. You can then run the app on iOS or Android simulators via bun run ios and bun run android
GitHub
.

Commands – Key commands listed in the README include:

bun start – start the Expo development server
GitHub
.

bun start --clear – clear cache and restart
GitHub
.

bun test – run tests (currently there are no test files, but you can add Jest tests)
GitHub
.

bun run build – build for production
GitHub
.

bun run ios / bun run android / bun run web – launch the app on specific platforms
GitHub
.

Linting & type‑checking – The project uses ESLint with the Expo configuration and TypeScript. While no dedicated lint or typecheck scripts are defined, you can run npx eslint . to lint the code and npx tsc --noEmit for type checks. A Prettier configuration (.prettierrc) enforces formatting. Follow these tools to maintain consistent code style.

State management – The central store lives in src/state/lyricStore.ts. Use the provided actions (e.g., createProject, addSection, addRecording) rather than manipulating state directly. Components should subscribe to specific slices of the store using selectors to avoid unnecessary re‑renders
GitHub
GitHub
.

Audio recording & playback – Use the Recorder component (modern expo-audio hooks) for recording and the PerformanceView or audio player hooks for playback. Avoid the deprecated expo-av API; the new hooks handle permissions and lifecycle automatically
GitHub
.

Code style preferences – The UI uses Tailwind via NativeWind; prefer using className strings with tailwind classes rather than inline style props. Avoid editing global.css unless absolutely necessary; update tailwind.config.js to customise styling. Keep components small and functional and leverage hooks for state.

Domain Knowledge & Business Logic

Creating and managing projects – When the user first adds a section or recording and no project exists, a new project with default name "Untitled" is automatically created
GitHub
. Projects can be renamed, deleted or saved; the saveCurrentProject function adds a savedAt timestamp
GitHub
. Projects are listed in the sidebar and can be switched.

Section actions – Sections are stored per project. Functions exist to add a new section of a chosen type, update its content, title or type, reorder sections, remove a section and toggle a starred flag
GitHub
. This enables complex song structures to be built dynamically.

Recording actions – Recordings (mumbles) are saved per project. Users can record a new take, play it back, rename it and delete it. The TakesScreen manages playback state and uses expo-audio to load and control sound
GitHub
. Multiple recordings are sorted by creation date, and each row shows the recording name, creation time and duration
GitHub
. Selecting a row reveals a scrubber and playback controls for seeking and playing/pausing
GitHub
.

Performance mode – A boolean flag in the store toggles a simplified UI for live performance situations (e.g., hide editing controls)
GitHub
.

Toast notifications – Functions showToast and hideToast manage temporary messages (success, error or info) to provide feedback to the user
GitHub
.

Audio validation – The audio subsystem validates recorded files (size, format, existence) before saving them, ensuring reliability and preventing corrupt data
GitHub
.

Future Plans & Roadmap

The README outlines several features planned for future development:

Audio recording integration – Although basic recording exists, more robust recording and playback controls are planned
GitHub
.

AI assistant features – Enable AI suggestions and integration with GPT‑4, Claude and Grok once environment variables and API keys are configured
GitHub
.

Cloud sync and backup – Allow syncing projects across devices
GitHub
.

Collaboration features – Share projects with collaborators and possibly co‑edit lyrics
GitHub
.

Export formats – Provide options to export lyrics to various formats (e.g., PDF, text)
GitHub
.

Rhyme dictionary & chord suggestions – Integrate external services for rhymes and chord progressions to aid songwriting
GitHub
.

Feel free to discuss with the team before starting new major features or refactoring existing code. Areas that may require attention include the audio recording components (to fully adopt modern Expo audio hooks) and the AI integration layer (ensuring API keys are handled securely and rate limits are respected).

Collaboration Preferences & Guidelines

Communication style – Please let me know whether you prefer cautious changes (e.g., only minimal modifications with explicit approval) or proactive improvements (e.g., refactoring and optimising without prior approval). I can adjust my approach accordingly.

Tooling – Avoid reinventing the wheel: use the existing transcribe-audio.ts for audio transcription, image-generation.ts for image generation and chat-service.ts for AI chat, as highlighted in the template's ReadMeKen.md
GitHub
. These modules are ready‑to‑use and rely on the latest APIs. For image generation, use the provided script rather than external libraries.

Styling – Stick to Tailwind classes via NativeWind and avoid unnecessary inline styles. Do not modify global CSS or tailwind configuration unless there's a clear reason.

Camera & permissions – If implementing camera features, use CameraView and related hooks from expo-camera rather than the deprecated Camera component, and adhere to the safe‑area handling guidelines from the template
GitHub
.

Audio & transcription – Use the modern expo-audio hooks for recording/playback and the transcribeAudio function for transcription (which wraps OpenAI's latest gpt-4o-transcribe model)
GitHub
GitHub
.

This CLAUDE document should give any collaborator enough context to understand the purpose and architecture of the Lyriq app, follow established patterns and make informed decisions about future development. If you have additional questions or need clarification on specific modules, please feel free to ask.

## Important Technical Notes

### React Native Version Discrepancy
- **Package.json declares**: React Native 0.79.2 
- **Documentation states**: React Native 0.76.7
- **Current reality**: Uses 0.79.2 with patches (see `/patches/react-native@0.79.2.patch`)
- Always use `bun` as package manager, not npm or yarn

### Modern Audio Implementation
The project recently migrated from `expo-av` to modern `expo-audio` hooks:
- **Recording**: Uses `useAudioRecorder` hook in `/src/components/Recorder.tsx`
- **Playback**: Uses `useAudioPlayer` hook in `/src/components/PerformanceView.tsx`
- **Audio Validation**: Comprehensive validation in `/src/utils/audioValidation.ts`
- **Avoid**: Old `Audio.Recording` and `Audio.Sound` classes (deprecated)

### State Management Architecture Deep Dive

The Zustand store (`/src/state/lyricStore.ts`) uses a sophisticated project-scoped pattern:

**Key Data Structures:**
```typescript
// Project-scoped storage pattern
sectionsByProject: Record<string, Section[]>
recordingsByProject: Record<string, Recording[]>
currentProjectId: string | null
```

**Critical Patterns:**
- **Automatic Project Creation**: When first section/recording is added without a current project, one is auto-created
- **Migration Logic**: Store includes one-time migration from old flat arrays to project-scoped structure
- **Unassigned Bucket**: Uses `'__unassigned__'` key for pre-project data
- **Optimized Selectors**: Use memoized selectors to prevent unnecessary re-renders

### Component Architecture Patterns

**Animation System:**
- Uses `react-native-reanimated` v3 throughout
- Swipe gestures for section deletion and modal dismissal
- Shared values for performance-optimized animations
- Complex gesture handling with `useAnimatedGestureHandler`

**Performance Optimizations:**
- Memoized selectors: `const sections = useMemo(() => { ... }, [dependencies])`
- Input refs management: `const inputRefs = useRef<Record<string, React.RefObject<TextInput | null>>>({})`
- Controlled re-renders: Subscribe to specific store slices, not entire state

### API Integration Strategy

**Three AI Providers Ready:**
- **Anthropic**: `/src/api/anthropic.ts` (Claude 3.5 Sonnet, Claude 4)
- **OpenAI**: `/src/api/openai.ts` (GPT-4o for chat and image analysis)
- **Grok**: `/src/api/grok.ts` (Grok-3-beta)

**Key API Files:**
- **Chat Service**: `/src/api/chat-service.ts` - Unified interface for all AI providers
- **Transcription**: `/src/api/transcribe-audio.ts` - Uses OpenAI's gpt-4o-transcribe model
- **Image Generation**: `/src/api/image-generation.ts` - Uses OpenAI's gpt-image-1 model

**Environment Variables Required:**
```bash
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=sk-ant-api03-...
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_PROJECT_ID=your-project-id
```

### Development Commands & Scripts

**Package.json Scripts (Current Reality):**
```bash
bun start              # Expo development server
bun run android        # Launch on Android
bun run ios           # Launch on iOS  
bun run web           # Launch in browser
```

**Missing but Referenced Commands:**
- `bun test` - No test files exist yet
- `bun run build` - No build script defined
- `bun start --clear` - Standard Expo command (works but not in scripts)

**Linting & Type Checking:**
```bash
npx eslint .          # ESLint with Expo config
npx tsc --noEmit      # TypeScript checking
```

### Critical File Locations & Purposes

**Core Architecture:**
- `/App.tsx` - Main app entry (currently monolithic, could be refactored)
- `/src/state/lyricStore.ts` - Central Zustand store with persistence
- `/src/components/RecordingModal.tsx` - Audio recording with modern expo-audio
- `/src/components/PerformanceView.tsx` - Performance mode with audio playback

**Key Screens:**
- `/src/screens/TakesScreen.tsx` - Audio recording management and playback
- `/src/screens/IdeasScreen.tsx` - Ideas exploration
- `/src/components/ProjectsSidebar.tsx` - Project navigation with search

**Configuration:**
- `/babel.config.js` - NativeWind integration with jsx source transform
- `/metro.config.js` - NativeWind Metro integration
- `/tailwind.config.js` - Custom font sizes and space utilities
- `/app.json` - Expo config with audio permissions

### Common Pitfalls & Solutions

**Audio Recording Issues:**
- **DO**: Use modern `useAudioRecorder()` and `useAudioPlayer()` hooks
- **DON'T**: Manually manage `Audio.Recording` instances (causes memory leaks)
- **Validation**: Always validate audio files with `/src/utils/audioValidation.ts`

**State Management Gotchas:**
- **DO**: Use project-scoped actions: `addSection()`, `addRecording()`
- **DON'T**: Manipulate `sectionsByProject` directly
- **Performance**: Use memoized selectors, not full state subscriptions

**Styling Conventions:**
- **DO**: Use NativeWind className strings: `className="bg-gray-800 text-white"`
- **DON'T**: Use inline styles unless absolutely necessary
- **Typography**: Georgia serif for lyrics, system fonts for UI
- **Colors**: Dark theme with grays, accent colors sparingly

### Architecture Insights

**Project-Scoped Data Pattern:**
The store design allows multiple songs/projects with isolated sections and recordings. This supports future collaboration features and better organization than a flat structure.

**Performance Mode:**
The `isPerformanceMode` flag completely changes the UI to a performer-friendly view with large text, waveform visualization, and minimal controls.

**Audio Pipeline:**
Recording → Validation → Storage → Playback uses a robust pipeline that prevents corrupted audio files and ensures reliable playback across devices.

**Future Architecture Considerations:**
- Consider extracting App.tsx monolith into smaller screen components
- Navigation system could be formalized with React Navigation
- Store could be split into domain-specific stores (audio, projects, UI)

### Development Workflow Recommendations

1. **Before Adding Features**: Check if AI services, audio hooks, or validation utilities already exist
2. **Testing Audio**: Use physical device - simulators have limited audio capabilities
3. **State Updates**: Always use store actions, never direct state manipulation
4. **Styling**: Stick to established Tailwind patterns, avoid custom CSS
5. **Performance**: Profile with React DevTools, watch for unnecessary re-renders