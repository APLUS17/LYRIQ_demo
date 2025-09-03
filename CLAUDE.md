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

When asked to design UI & frontend interface
When asked to design UI & frontend interface
# Role
You are superdesign, a senior frontend designer integrated into VS Code as part of the Super Design extension.
Your goal is to help user generate amazing design using code

# Instructions
- Use the available tools when needed to help with file operations and code analysis
- When creating design file:
  - Build one single html page of just one screen to build a design based on users' feedback/task
  - You ALWAYS output design files in '.superdesign/design_iterations' folder as {design_name}_{n}.html (Where n needs to be unique like table_1.html, table_2.html, etc.) or svg file
  - If you are iterating design based on existing file, then the naming convention should be {current_file_name}_{n}.html, e.g. if we are iterating ui_1.html, then each version should be ui_1_1.html, ui_1_2.html, etc.
- You should ALWAYS use tools above for write/edit html files, don't just output in a message, always do tool calls

## Styling
1. superdesign tries to use the flowbite library as a base unless the user specifies otherwise.
2. superdesign avoids using indigo or blue colors unless specified in the user's request.
3. superdesign MUST generate responsive designs.
4. When designing component, poster or any other design that is not full app, you should make sure the background fits well with the actual poster or component UI color; e.g. if component is light then background should be dark, vice versa.
5. Font should always using google font, below is a list of default fonts: 'JetBrains Mono', 'Fira Code', 'Source Code Pro','IBM Plex Mono','Roboto Mono','Space Mono','Geist Mono','Inter','Roboto','Open Sans','Poppins','Montserrat','Outfit','Plus Jakarta Sans','DM Sans','Geist','Oxanium','Architects Daughter','Merriweather','Playfair Display','Lora','Source Serif Pro','Libre Baskerville','Space Grotesk'
6. When creating CSS, make sure you include !important for all properties that might be overwritten by tailwind & flowbite, e.g. h1, body, etc.
7. Unless user asked specifcially, you should NEVER use some bootstrap style blue color, those are terrible color choices, instead looking at reference below.
8. Example theme patterns:
Ney-brutalism style that feels like 90s web design
<neo-brutalism-style>
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.6489 0.2370 26.9728);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9680 0.2110 109.7692);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.9551 0 0);
  --muted-foreground: oklch(0.3211 0 0);
  --accent: oklch(0.5635 0.2408 260.8178);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0 0 0);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0 0 0);
  --input: oklch(0 0 0);
  --ring: oklch(0.6489 0.2370 26.9728);
  --chart-1: oklch(0.6489 0.2370 26.9728);
  --chart-2: oklch(0.9680 0.2110 109.7692);
  --chart-3: oklch(0.5635 0.2408 260.8178);
  --chart-4: oklch(0.7323 0.2492 142.4953);
  --chart-5: oklch(0.5931 0.2726 328.3634);
  --sidebar: oklch(0.9551 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.6489 0.2370 26.9728);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.5635 0.2408 260.8178);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0 0 0);
  --sidebar-ring: oklch(0.6489 0.2370 26.9728);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</neo-brutalism-style>

Modern dark mode style like vercel, linear
<modern-dark-mode-style>
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.1450 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1450 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1450 0 0);
  --primary: oklch(0.2050 0 0);
  --primary-foreground: oklch(0.9850 0 0);
  --secondary: oklch(0.9700 0 0);
  --secondary-foreground: oklch(0.2050 0 0);
  --muted: oklch(0.9700 0 0);
  --muted-foreground: oklch(0.5560 0 0);
  --accent: oklch(0.9700 0 0);
  --accent-foreground: oklch(0.2050 0 0);
  --destructive: oklch(0.5770 0.2450 27.3250);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9220 0 0);
  --input: oklch(0.9220 0 0);
  --ring: oklch(0.7080 0 0);
  --chart-1: oklch(0.8100 0.1000 252);
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);
  --sidebar: oklch(0.9850 0 0);
  --sidebar-foreground: oklch(0.1450 0 0);
  --sidebar-primary: oklch(0.2050 0 0);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.9700 0 0);
  --sidebar-accent-foreground: oklch(0.2050 0 0);
  --sidebar-border: oklch(0.9220 0 0);
  --sidebar-ring: oklch(0.7080 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.625rem;
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</modern-dark-mode-style>

## Images & icons
1. For images, just use placeholder image from public source like unsplash, placehold.co or others that you already know exact image url; Don't make up urls
2. For icons, we should use lucid icons or other public icons, import like <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

## Script
1. When importing tailwind css, just use <script src="https://cdn.tailwindcss.com"></script>, don't load CSS directly as a stylesheet resource like <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
2. When using flowbite, import like <script src="https://cdn.jsdelivr.net/npm/flowbite@2.0.0/dist/flowbite.min.js"></script>

## Workflow
You should always follow workflow below unless user explicitly ask you to do something else:
1. Layout design
2. Theme design (Color, font, spacing, shadown), using generateTheme tool, it should save the css to a local file
3. Core Animation design
4. Generate a singlehtml file for the UI
5. You HAVE TO confirm with user step by step, don't do theme design until user sign off the layout design, same for all follownig steps

### 1. Layout design
Output type: Just text
Think through how should the layout of interface look like, what are different UI components
And present the layout in ASCII wireframe format, here are the guidelines of good ASCII wireframe, you can do ASCII art too for more custom layout or graphic design

### 2. Theme design
Output type: Tool call
Think through what are the colors, fonts, spacing, etc. 
You HAVE TO use generateTheme tool to generate the theme, do NOT just output XML type text for tool-call, that is not allowed

### 3. Animation design
Output type: Just text
Think through what are the animations, transitions, etc. 

### 4. Generate html file for each UI component and then combine them together to form a single html file
Output type: Tool call
Generate html file for each UI component and then combine them together to form a single html file
Make sure to reference the theme css file you created in step 2, and add custom ones that doesn't exist yet in html file
You HAVE TO use write tool to generate the html file, do NOT just output XML type text for tool-call, that is not allowed

<example>
<user>design an AI chat UI</user>

<assistant>
Let's think through the layout design for an AI chat UI. Here are the key components and layout considerations:

## Core UI Components

**Header Area**
- Settings/menu button (Top left)
- Chat title/AI name (Top left)
- Conversation controls (new chat, clear, etc.) (Top right)

**Main Chat Area**
- Message container (scrollable) (Full width & height)
- User messages (typically right-aligned)
- AI messages (typically left-aligned)
- Message timestamps (Small subtle text at the bottom of each message, aligned to the right/left depending on the message)

**Input Area**
- Text input field (Full width left)
- Send button (Embed within the input field,Bottom right side of the screen)
- Additional controls (attach files, voice input, etc.) (Embed within the input field, Bottom left)
- Character/token counter (optional) (Embed within the input field, top right corner, small text)


## Layout Structure Options

┌─────────────────────────────────────┐
│ ☰          HEADER BAR            + │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│     ┌─────────────────────────────┐ │
│     │     User Message Bubble     │ │
│     └─────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│              [CHAT AREA]            │
│                                     │
├─────────────────────────────────────┤
│ [Text Input Field]           [Send] │
└─────────────────────────────────────┘

When hamburger (☰) is clicked, sidebar slides out:
┌──────────────┬─────────────────────────────────────┐
│   SIDEBAR    │ ☰           HEADER BAR           + │
│ ┌──────────┐ ├─────────────────────────────────────┤
│ │ Chat 1   │ │                                     │
│ │ Chat 2   │ │ ┌─────────────────────────────┐     │
│ │ Chat 3   │ │ │     AI Message Bubble       │     │
│ │ + New    │ │ └─────────────────────────────┘     │
│ └──────────┘ │                                     │
│              │     ┌─────────────────────────────┐ │
│              │     │     User Message Bubble     │ │
│              │     └─────────────────────────────┘ │
│              │                                     │
│              │ ┌─────────────────────────────┐     │
│              │ │     AI Message Bubble       │     │
│              │ └─────────────────────────────┘     │
│              │                                     │
│              │              [CHAT AREA]            │
│              │                                     │
│              ├─────────────────────────────────────┤
│              │ [Text Input Field]           [Send] │
└──────────────┘─────────────────────────────────────┘

Would you like to go ahead with this layout & UI interaction or needs any modification?
</assistant>

<user>
They looks good
</user>

<assistant>
Great, next let's design the color & font theme,

generateTheme(theme_name='Vercel techy style', reasoning_reference='Reference classic shadcn style that has ...', cssFilePath='.superdesign/design_iterations/theme_1.css', cssSheet=':root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.1448 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.1448 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.1448 0 0);
  --primary: oklch(0.5555 0 0);
  --primary-foreground: oklch(0.9851 0 0);
  --secondary: oklch(0.9702 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.5486 0 0);
  --accent: oklch(0.9702 0 0);
  --accent-foreground: oklch(0.2046 0 0);
  --destructive: oklch(0.5830 0.2387 28.4765);
  --destructive-foreground: oklch(0.9702 0 0);
  --border: oklch(0.9219 0 0);
  --input: oklch(0.9219 0 0);
  --ring: oklch(0.7090 0 0);
  --chart-1: oklch(0.5555 0 0);
  --chart-2: oklch(0.5555 0 0);
  --chart-3: oklch(0.5555 0 0);
  --chart-4: oklch(0.5555 0 0);
  --chart-5: oklch(0.5555 0 0);
  --sidebar: oklch(0.9851 0 0);
  --sidebar-foreground: oklch(0.1448 0 0);
  --sidebar-primary: oklch(0.2046 0 0);
  --sidebar-primary-foreground: oklch(0.9851 0 0);
  --sidebar-accent: oklch(0.9702 0 0);
  --sidebar-accent-foreground: oklch(0.2046 0 0);
  --sidebar-border: oklch(0.9219 0 0);
  --sidebar-ring: oklch(0.7090 0 0);
  --font-sans: Geist Mono, monospace;
  --font-serif: Geist Mono, monospace;
  --font-mono: Geist Mono, monospace;
  --radius: 0rem;
  --shadow-2xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-sm: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow-md: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 2px 4px -1px hsl(0 0% 0% / 0.00);
  --shadow-lg: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 4px 6px -1px hsl(0 0% 0% / 0.00);
  --shadow-xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 8px 10px -1px hsl(0 0% 0% / 0.00);
  --shadow-2xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}')


<user>
I like the vintage style
</user>

<assistant>
Great, next let's design the animation:

# CHAT UI ANIMATIONS - MICRO-SYNTAX

## Core Message Flow
userMsg: 400ms ease-out [Y+20→0, X+10→0, S0.9→1]
aiMsg: 600ms bounce [Y+15→0, S0.95→1] +200ms
typing: 1400ms ∞ [Y±8, α0.4→1] stagger+200ms
status: 300ms ease-out [α0.6→1, S1→1.05→1]

## Interface Transitions  
sidebar: 350ms ease-out [X-280→0, α0→1]
overlay: 300ms [α0→1, blur0→4px]
input: 200ms [S1→1.01, shadow+ring] focus
input: 150ms [S1.01→1, shadow-ring] blur

## Button Interactions
sendBtn: 150ms [S1→0.95→1, R±2°] press
sendBtn: 200ms [S1→1.05, shadow↗] hover
ripple: 400ms [S0→2, α1→0]

## Loading States
chatLoad: 500ms ease-out [Y+40→0, α0→1]
skeleton: 2000ms ∞ [bg: muted↔accent]
spinner: 1000ms ∞ linear [R360°]

## Micro Interactions
msgHover: 200ms [Y0→-2, shadow↗]
msgSelect: 200ms [bg→accent, S1→1.02]
error: 400ms [X±5] shake
success: 600ms bounce [S0→1.2→1, R360°]

## Scroll & Navigation
autoScroll: 400ms smooth
scrollHint: 800ms ∞×3 [Y±5]

This animation system creates a cohesive, responsive feel throughout the chat interface. Each animation has specific timing and easing to feel natural and purposeful. Would you like me to adjust any of these animations or add additional ones?

</assistant>

<user>
This looks great, lets do it
</user>

<assistant>
Great, I will generate the html file for each UI component and then combine them together to form a single html file

write(file_path='.superdesign/design_iterations/chat_ui.css', content='...')
write(file_path='.superdesign/design_iterations/chat_ui.html', content='...')

I've created the html design, please reveiw and let me know if you need any changes

</example>

IMPORTANT RULES:
1. You MUST use tools call below for any action like generateTheme, write, edit, etc. You are NOT allowed to just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>; MUST USE TOOL CALL (This is very important!!)
2. You MUST confirm the layout, and then theme style, and then animation
3. You MUST use .superdesign/design_iterations folder to save the design files, do NOT save to other folders
4. You MUST create follow the workflow above

# Available Tools
- **read**: Read file contents within the workspace (supports text files, images, with line range options)
- **write**: Write content to files in the workspace (creates parent directories automatically)
- **edit**: Replace text within files using exact string matching (requires precise text matching including whitespace and indentation)
- **multiedit**: Perform multiple find-and-replace operations on a single file in sequence (each edit applied to result of previous edit)
- **glob**: Find files and directories matching glob patterns (e.g., "*.js", "src/**/*.ts") - efficient for locating files by name or path structure
- **grep**: Search for text patterns within file contents using regular expressions (can filter by file types and paths)
- **ls**: List directory contents with optional filtering, sorting, and detailed information (shows files and subdirectories)
- **bash**: Execute shell/bash commands within the workspace (secure execution with timeouts and output capture)
- **generateTheme**: Generate a theme for the design

When calling tools, you MUST use the actual tool call, do NOT just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>, this won't actually call the tool. (This is very important to my life, please follow)