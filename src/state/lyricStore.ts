import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LyricSection {
  id: string;
  type: string;
  title: string;
  content: string;
  count: number;
  isStarred: boolean;
  projectId?: string;
  collapsed?: boolean;
}

export interface Recording {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: Date;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  sections: LyricSection[];
  recordings: Recording[];
  isCurrent: boolean;
}

interface LyricState {
  // Recording Modal State
  isRecordingModalVisible: boolean;
  toggleRecordingModal: (value?: boolean) => void;
  
  // View Mode State
  isPerformanceMode: boolean;
  togglePerformanceMode: (value?: boolean) => void;
  
  // Toast State
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  
  // Project Management
  projects: Project[];
  currentProject: Project | null;
  createProject: (name: string) => void;
  saveCurrentProject: () => void;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  
  // Current Session (working sections)
  sections: LyricSection[];
  addSection: (type: string) => void;
  updateSection: (id: string, content: string) => void;
  updateSectionType: (id: string, type: string) => void;
  updateSectionCount: (id: string, count: number) => void;
  removeSection: (id: string) => void;
  reorderSections: (draggedId: string, direction: string, currentIndex: number) => void;
  toggleStarSection: (id: string) => void;
  toggleCollapse: (id: string) => void;
  
  // Recordings/Takes Management
  recordings: Recording[];
  addRecording: (recording: Omit<Recording, 'id' | 'createdAt'>) => void;
  removeRecording: (id: string) => void;
  updateRecordingName: (id: string, name: string) => void;
  
  // Starred Sections (VERSES section)
  getStarredSections: () => LyricSection[];
}


export const useLyricStore = create<LyricState>()(
  persist(
    (set, get) => ({
      // Recording Modal State
      isRecordingModalVisible: false,
      toggleRecordingModal: (value) =>
        set((state) => ({
          isRecordingModalVisible: value ?? !state.isRecordingModalVisible,
        })),

      // View Mode State
      isPerformanceMode: false,
      togglePerformanceMode: (value) =>
        set((state) => ({
          isPerformanceMode: value ?? !state.isPerformanceMode,
        })),

      // Toast State
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

      // Project Management
      projects: [],
      currentProject: null,
      
      createProject: (name) => set((state) => {
        const newProject: Project = {
          id: Date.now().toString(),
          name: name || `Project ${state.projects.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          sections: [...state.sections],
          recordings: [...state.recordings],
          isCurrent: true,
        };
        
        const updatedProjects = state.projects.map(p => ({ ...p, isCurrent: false }));
        
        return {
          projects: [...updatedProjects, newProject],
          currentProject: newProject,
          sections: [],
          recordings: [],
        };
      }),
      
      saveCurrentProject: () => {
        const state = useLyricStore.getState();
        const { showToast } = state;
        
        set((state) => {
          if (!state.currentProject) {
            // Create a new project if none exists
            const newProject: Project = {
              id: Date.now().toString(),
              name: `Untitled ${state.projects.length + 1}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              sections: [...state.sections],
              recordings: [...state.recordings],
              isCurrent: true,
            };
            
            // Show success toast
            setTimeout(() => showToast(`Created "${newProject.name}"`, 'success'), 100);
            
            return {
              projects: [...state.projects.map(p => ({ ...p, isCurrent: false })), newProject],
              currentProject: newProject,
            };
          } else {
            // Update existing project
            const updatedProject = {
              ...state.currentProject,
              sections: [...state.sections],
              recordings: [...state.recordings],
              updatedAt: new Date(),
            };
            
            // Show success toast
            setTimeout(() => showToast(`Saved "${updatedProject.name}"`, 'success'), 100);
          
            return {
              projects: state.projects.map(p => 
                p.id === state.currentProject?.id ? updatedProject : p
              ),
              currentProject: updatedProject,
            };
          }
        });
      },
      
      loadProject: (projectId) => set((state) => {
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return state;
        
        const updatedProjects = state.projects.map(p => ({
          ...p,
          isCurrent: p.id === projectId
        }));
        
        return {
          projects: updatedProjects,
          currentProject: project,
          sections: [...project.sections],
          recordings: [...project.recordings],
        };
      }),
      
      deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      })),
      
      renameProject: (projectId, name) => set((state) => {
        const updatedProjects = state.projects.map(p =>
          p.id === projectId ? { ...p, name, updatedAt: new Date() } : p
        );
        
        return {
          projects: updatedProjects,
          currentProject: state.currentProject?.id === projectId 
            ? { ...state.currentProject, name, updatedAt: new Date() }
            : state.currentProject,
        };
      }),

      

      // Current Session Sections
      sections: [],
      
      addSection: (type) => set((state) => {
        const newSection: LyricSection = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: type || 'verse',
          title: (type || 'verse').charAt(0).toUpperCase() + (type || 'verse').slice(1),
          content: '',
          count: 1,
          isStarred: false,
          projectId: state.currentProject?.id,
          collapsed: false,
        };
        return { sections: [...state.sections, newSection] };
      }),

      updateSection: (id, content) => set((state) => ({
        sections: state.sections.map((section) =>
          section.id === id ? { ...section, content } : section
        ),
      })),

      updateSectionType: (id, type) => set((state) => ({
        sections: state.sections.map((section) =>
          section.id === id
            ? { ...section, type, title: type.charAt(0).toUpperCase() + type.slice(1) }
            : section
        ),
      })),

      updateSectionCount: (id, count) => set((state) => ({
        sections: state.sections.map((section) =>
          section.id === id ? { ...section, count: Math.max(1, count) } : section
        ),
      })),

      removeSection: (id) => set((state) => ({
        sections: state.sections.filter((section) => section.id !== id),
      })),

      reorderSections: (draggedId, direction, currentIndex) => set((state) => {
        const newSections = [...state.sections];
        const draggedIndex = newSections.findIndex((s) => s.id === draggedId);

        if (draggedIndex === -1) return state;

        const targetIndex =
          direction === 'down'
            ? Math.min(draggedIndex + 1, newSections.length - 1)
            : Math.max(draggedIndex - 1, 0);

        if (targetIndex === draggedIndex) return state;

        const [draggedSection] = newSections.splice(draggedIndex, 1);
        newSections.splice(targetIndex, 0, draggedSection);

        return { sections: newSections };
      }),
      
      toggleStarSection: (id) => set((state) => ({
        sections: state.sections.map((section) =>
          section.id === id ? { ...section, isStarred: !section.isStarred } : section
        ),
      })),

      toggleCollapse: (id) => set((state) => ({
        sections: state.sections.map((section) =>
          section.id === id ? { ...section, collapsed: !section.collapsed } : section
        ),
      })),

      // Recordings/Takes Management
      recordings: [],
      
      addRecording: (recording) => set((state) => {
        const newRecording: Recording = {
          ...recording,
          id: Date.now().toString(),
          createdAt: new Date(),
          projectId: state.currentProject?.id,
        };
        return { recordings: [...state.recordings, newRecording] };
      }),
      
      removeRecording: (id) => set((state) => ({
        recordings: state.recordings.filter((recording) => recording.id !== id),
      })),

      updateRecordingName: (id, name) => set((state) => ({
        recordings: state.recordings.map((r) => r.id === id ? { ...r, name } : r),
      })),
      
      // Starred Sections (VERSES section)
      getStarredSections: () => {
        const state = get();
        const allSections = [
          ...state.sections,
          ...state.projects.flatMap(p => p.sections)
        ];
        return allSections.filter(section => section.isStarred);
      },
    }),
    {
      name: 'lyriq-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        projects: state.projects,
        currentProject: state.currentProject,
        sections: state.sections,
        recordings: state.recordings,
      }),
    }
  )
);