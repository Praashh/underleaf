import { create } from 'zustand';

export interface ProjectMeta {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

type Page = 'dashboard' | 'editor';

interface ProjectState {
  projects: ProjectMeta[];
  currentProject: ProjectMeta | null;
  currentPage: Page;
  isLoading: boolean;

  setProjects: (projects: ProjectMeta[]) => void;
  setCurrentProject: (project: ProjectMeta | null) => void;
  setCurrentPage: (page: Page) => void;
  setIsLoading: (loading: boolean) => void;
  addProject: (project: ProjectMeta) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<ProjectMeta>) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  currentPage: 'dashboard',
  isLoading: false,

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
}));
