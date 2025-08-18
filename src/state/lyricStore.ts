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
  savedAt?: string;
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
  
  // Performance Mode State
  isPerformanceMode: boolean;
  togglePerformanceMode: (value?: boolean) => void;
  
  // Project Actions
  createProject: (name: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  saveCurrentProject: () => void;

  // Section Actions (project-scoped)
  addSection: (type: string) => string;
  updateSection: (id: string, content: string) => void;
  updateSectionType: (id: string, type: string) => void;
  updateSectionCount: (id: string, count: number) => void;
  updateSectionTitle: (id: string, title: string) => void;
  removeSection: (id: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  toggleStarSection: (id: string) => void;
  
  // Recording Actions (project-scoped)
  addRecording: (rec: Omit<Recording, 'id' | 'createdAt'>) => void;
  removeRecording: (id: string) => void;
  updateRecordingName: (id: string, name: string) => void;
  
  // Selector Helpers
  getSections: () => Section[];
  getRecordings: () => Recording[];
  getStarredSections: () => Section[];
  getSectionsForProject: (projectId: string) => Section[];
  
  // Additional selector helper
  getCurrentProject: () => Project | null;
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
      toggleRecordingModal: (value?: boolean) =>
        set((state: LyricState) => ({
          isRecordingModalVisible: value ?? !state.isRecordingModalVisible,
        })),

      // --- Toast State ---
      toastVisible: false,
      toastMessage: '',
      toastType: 'success',
      showToast: (message: string, type: 'success' | 'error' | 'info' = 'success') =>
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

      // --- Performance Mode State ---
      isPerformanceMode: false,
      togglePerformanceMode: (value?: boolean) =>
        set((state: LyricState) => ({
          isPerformanceMode: value ?? !state.isPerformanceMode,
        })),

      // --- Project Actions ---
      createProject: (name: string) => {
        const id = crypto.randomUUID?.() || String(Date.now());
        const now = new Date().toISOString();
        set((s: LyricState) => ({
          projects: [{ id, name, createdAt: now }, ...s.projects],
          sectionsByProject: { ...s.sectionsByProject, [id]: [] },
          recordingsByProject: { ...s.recordingsByProject, [id]: [] },
          currentProjectId: id,
        }));
      },
      loadProject: (id: string) => set({ currentProjectId: id }),
      deleteProject: (id: string) => set((s: LyricState) => {
        const { [id]: _, ...sectionsRest } = s.sectionsByProject;
        const { [id]: __, ...recordingsRest } = s.recordingsByProject;
        return {
          projects: s.projects.filter((p: Project) => p.id !== id),
          currentProjectId: s.currentProjectId === id ? null : s.currentProjectId,
          sectionsByProject: sectionsRest,
          recordingsByProject: recordingsRest,
        };
      }),
      renameProject: (id: string, name: string) => set((s: LyricState) => ({
        projects: s.projects.map((p: Project) => p.id === id ? { ...p, name } : p),
      })),
      saveCurrentProject: () => {
        const s = get();
        const currentProject = s.projects.find((p: Project) => p.id === s.currentProjectId);
        if (currentProject) {
          const now = new Date().toISOString();
          set((state: LyricState) => ({
            projects: state.projects.map((p: Project) =>
              p.id === currentProject.id ? { ...currentProject, savedAt: now } : p
            ),
          }));
        }
      },

      // --- Section Actions ---
      addSection: (type: string) => {
        const s = get();
        let pid = s.currentProjectId;
        
        // If no current project, create one first
        if (!pid) {
          const newProjectId = crypto.randomUUID?.() || String(Date.now());
          const now = new Date().toISOString();
          set((state: LyricState) => ({
            projects: [{ id: newProjectId, name: 'Untitled', createdAt: now }, ...state.projects],
            currentProjectId: newProjectId,
            sectionsByProject: { ...state.sectionsByProject, [newProjectId]: [] },
            recordingsByProject: { ...state.recordingsByProject, [newProjectId]: [] },
          }));
          pid = newProjectId;
        }
        
        const next: Section = {
          id: crypto.randomUUID?.() || String(Date.now()),
          type,
          createdAt: new Date().toISOString(),
        };
        
        set((state: LyricState) => ({
          sectionsByProject: {
            ...state.sectionsByProject,
            [pid!]: [...(state.sectionsByProject[pid!] || []), next],
          },
        }));
        
        // Return id for focusing
        return next.id;
      },
      updateSection: (id: string, content: string) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: (s.sectionsByProject[pid] || []).map((sec: Section) => sec.id === id ? { ...sec, content } : sec),
          },
        });
      },
      updateSectionType: (id: string, type: string) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: (s.sectionsByProject[pid] || []).map((sec: Section) => sec.id === id ? { ...sec, type } : sec),
          },
        });
      },
      updateSectionTitle: (id: string, title: string) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: (s.sectionsByProject[pid] || []).map((sec: Section) => sec.id === id ? { ...sec, title } : sec),
          },
        });
      },
      updateSectionCount: (id: string, count: number) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: (s.sectionsByProject[pid] || []).map((sec: Section) => sec.id === id ? { ...sec, count } : sec),
          },
        });
      },
      removeSection: (id: string) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          sectionsByProject: {
            ...s.sectionsByProject,
            [pid]: (s.sectionsByProject[pid] || []).filter((sec: Section) => sec.id !== id),
          },
        });
      },
      reorderSections: (fromIndex: number, toIndex: number) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set((state: LyricState) => {
          const sections = [...state.sectionsByProject[pid] || []];
          const [movedSection] = sections.splice(fromIndex, 1);
          sections.splice(toIndex, 0, movedSection);
          return {
            sectionsByProject: {
              ...state.sectionsByProject,
              [pid]: sections,
            },
          };
        });
      },
      toggleStarSection: (id: string) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set((state: LyricState) => {
          const sections = [...state.sectionsByProject[pid] || []];
          const sectionIndex = sections.findIndex((sec: Section) => sec.id === id);
          if (sectionIndex !== -1) {
            const updatedSections = [...sections];
            updatedSections[sectionIndex] = {
              ...updatedSections[sectionIndex],
              isStarred: !updatedSections[sectionIndex].isStarred,
            };
            return {
              sectionsByProject: {
                ...state.sectionsByProject,
                [pid]: updatedSections,
              },
            };
          }
          return state;
        });
      },

      // --- Recording Actions ---
      addRecording: (rec: Omit<Recording, 'id' | 'createdAt'>) => {
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
      removeRecording: (id: string) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          recordingsByProject: {
            ...s.recordingsByProject,
            [pid]: (s.recordingsByProject[pid] || []).filter((r: Recording) => r.id !== id),
          },
        });
      },
      updateRecordingName: (id: string, name: string) => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        set({
          recordingsByProject: {
            ...s.recordingsByProject,
            [pid]: (s.recordingsByProject[pid] || []).map((r: Recording) => r.id === id ? { ...r, name } : r),
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
      getCurrentProject: () => {
        const s = get();
        return s.projects.find((p: Project) => p.id === s.currentProjectId) || null;
      },
      getStarredSections: () => {
        const s = get();
        const pid = s.currentProjectId ?? '__unassigned__';
        const list = (s.sectionsByProject[pid] || []).filter(Boolean);
        return list.filter((sec: any) => sec && (sec as any).isStarred === true);
      },
      getSectionsForProject: (projectId: string) => {
        return get().sectionsByProject[projectId] || [];
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
      onRehydrateStorage: () => (state: any) => {
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