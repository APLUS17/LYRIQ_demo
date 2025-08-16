import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---
export type Section = {
  id: string;
  type: 'verse' | 'hook' | 'bridge' | string;
  title?: string;
  content?: string;
  isStarred?: boolean;
  createdAt: string;
};

export type Recording = {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

interface LyricState {
  // Project Management
  projects: Project[];
  currentProjectId: string | null;
  sectionsByProject: Record<string, Section[]>;
  recordingsByProject: Record<string, Recording[]>;

  // Recording Modal State
  isRecordingModalVisible: boolean;
  toggleRecordingModal: (value?: boolean) => void;
  
  // Toast State
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  
  // Project Actions
  createProject: (name: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;

  // Section Actions (project-scoped)
  addSection: (type: string) => void;
  updateSection: (id: string, content: string) => void;
  removeSection: (id: string) => void;
  
  // Recording Actions (project-scoped)
  addRecording: (rec: Omit<Recording, 'id' | 'createdAt'>) => void;
  removeRecording: (id: string) => void;
  updateRecordingName: (id: string, name: string) => void;
  
  // Selector Helpers
  getSections: () => Section[];
  getRecordings: () => Recording[];
}

export const useLyricStore = create<LyricState>()(
  persist(
    (set, get) => ({
      // --- Project Management ---
      projects: [],
      currentProjectId: null,
      sectionsByProject: {},
      recordingsByProject: {},

      // --- Recording Modal State ---
      isRecordingModalVisible: false,
      toggleRecordingModal: (value) =>
        set((state) => ({
          isRecordingModalVisible: value ?? !state.isRecordingModalVisible,
        })),

      // --- Toast State ---
      toastVisible: false,
      toastMessage: '',
      toastType: 'success',
      showToast: (message, type = 'success') =>
        set({
          toastVisible: true,
          toastMessage: message,
          toastType: type,
        }),
      hideToast: () =>
        set({
          toastVisible: false,
          toastMessage: '',
        }),

      // --- Project Actions ---
      createProject: (name) => {
        const id = crypto.randomUUID?.() || String(Date.now());
        const now = new Date().toISOString();
        set((s) => ({
          projects: [{ id, name, createdAt: now }, ...s.projects],
          sectionsByProject: { ...s.sectionsByProject, [id]: [] },
          recordingsByProject: { ...s.recordingsByProject, [id]: [] },
          currentProjectId: id,
        }));
      },
      loadProject: (id) => set({ currentProjectId: id }),
      deleteProject: (id) => set((s) => {
        const { [id]: _, ...sectionsRest } = s.sectionsByProject;
        const { [id]: __, ...recordingsRest } = s.recordingsByProject;
        return {
          projects: s.projects.filter(p => p.id !== id),
          currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
          sectionsByProject: sectionsRest,
          recordingsByProject: recordingsRest,
        };
      }),
      renameProject: (id, name) => set((s) => ({
        projects: s.projects.map(p => p.id === id ? { ...p, name } : p),
      })),

      // --- Section Actions ---
      addSection: (type) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        const next: Section = {
          id: crypto.randomUUID?.() || String(Date.now()),
          type: type as any,
          createdAt: new Date().toISOString(),
        };
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: [...(s.sectionsByProject[pid] || []), next],
          },
        });
      },
      updateSection: (id, content) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: (s.sectionsByProject[pid] || []).map(sec => sec.id === id ? { ...sec, content } : sec),
          },
        });
      },
      removeSection: (id) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: (s.sectionsByProject[pid] || []).filter(sec => sec.id !== id),
          },
        });
      },

      // --- Recording Actions ---
      addRecording: (rec) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        const next: Recording = {
          id: crypto.randomUUID?.() || String(Date.now()),
          createdAt: new Date().toISOString(),
          ...rec,
        };
        set({
          recordingsByProject: {
            ...s.recordingsByProject,
            [pid]: [next, ...(s.recordingsByProject[pid] || [])],
          },
        });
      },
      removeRecording: (id) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          recordingsByProject: {
            ...s.recordingsByProject,
            [pid]: (s.recordingsByProject[pid] || []).filter(r => r.id !== id),
          },
        });
      },
      updateRecordingName: (id, name) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          recordingsByProject: {
            ...s.recordingsByProject,
            [pid]: (s.recordingsByProject[pid] || []).map(r => r.id === id ? { ...r, name } : r),
          },
        });
      },

      // --- Selector Helpers ---
      getSections: () => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        return s.sectionsByProject[pid] || [];
      },
      getRecordings: () => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        return s.recordingsByProject[pid] || [];
      },
    }),
    {
      name: 'lyriq-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        projects: state.projects,
        currentProjectId: state.currentProjectId,
        sectionsByProject: state.sectionsByProject,
        recordingsByProject: state.recordingsByProject,
      }),
      // One-time migration for old flat arrays
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.sections && !state.sectionsByProject) {
            state.sectionsByProject = { '__unassigned__': state.sections };
          }
          if (state.recordings && !state.recordingsByProject) {
            state.recordingsByProject = { '__unassigned__': state.recordings };
          }
          if (!state.currentProjectId && Object.keys(state.sectionsByProject || {}).length > 0) {
            state.currentProjectId = '__unassigned__';
          }
        }
      },
    }
  )
);