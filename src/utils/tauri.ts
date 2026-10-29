import { invoke } from '@tauri-apps/api/core';
import type { ProjectMeta } from '../store/projectStore';

/* ========================================
   COMPILE
   ======================================== */
export interface CompileResult {
  success: boolean;
  pdf_base64: string | null;
  errors: string[];
  warnings: string[];
}

export async function compileLatex(
  latexCode: string,
  projectId: string
): Promise<CompileResult> {
  return invoke<CompileResult>('compile_latex', {
    latexCode,
    projectId,
  });
}

/* ========================================
   PROJECTS
   ======================================== */
export async function listProjects(): Promise<ProjectMeta[]> {
  return invoke<ProjectMeta[]>('list_projects');
}

export async function createProject(
  name: string,
  templateContent?: string
): Promise<ProjectMeta> {
  return invoke<ProjectMeta>('create_project', {
    name,
    templateContent: templateContent ?? null,
  });
}

export async function readProjectFile(
  projectId: string,
  filename: string
): Promise<string> {
  return invoke<string>('read_project_file', { projectId, filename });
}

export async function saveProjectFile(
  projectId: string,
  filename: string,
  content: string
): Promise<void> {
  return invoke<void>('save_project_file', {
    projectId,
    filename,
    content,
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  return invoke<void>('delete_project', { projectId });
}

export async function renameProject(
  projectId: string,
  newName: string
): Promise<void> {
  return invoke<void>('rename_project', { projectId, newName });
}

/* ========================================
   EXPORT
   ======================================== */
export async function exportPdf(
  projectId: string,
  exportPath: string
): Promise<void> {
  return invoke<void>('export_pdf', { projectId, exportPath });
}
