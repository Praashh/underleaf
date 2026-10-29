use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectMeta {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ProjectFile {
    pub name: String,
    pub content: String,
}

/// Get the base directory for all Underleaf projects
fn get_projects_dir() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    let projects_dir = home.join("underleaf").join("projects");
    fs::create_dir_all(&projects_dir).ok();
    projects_dir
}

/// Get a specific project directory
fn get_project_dir(project_id: &str) -> PathBuf {
    get_projects_dir().join(project_id)
}

#[tauri::command]
pub async fn list_projects() -> Result<Vec<ProjectMeta>, String> {
    let projects_dir = get_projects_dir();
    let mut projects = Vec::new();

    if let Ok(entries) = fs::read_dir(&projects_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let meta_path = path.join("project.json");
                if meta_path.exists() {
                    if let Ok(content) = fs::read_to_string(&meta_path) {
                        if let Ok(meta) = serde_json::from_str::<ProjectMeta>(&content) {
                            projects.push(meta);
                        }
                    }
                }
            }
        }
    }

    // Sort by updated_at descending
    projects.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(projects)
}

#[tauri::command]
pub async fn create_project(name: String, template_content: Option<String>) -> Result<ProjectMeta, String> {
    let id = Uuid::new_v4().to_string();
    let project_dir = get_project_dir(&id);
    
    fs::create_dir_all(&project_dir)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    let now: DateTime<Utc> = Utc::now();
    let now_str = now.to_rfc3339();

    let meta = ProjectMeta {
        id: id.clone(),
        name: name.clone(),
        created_at: now_str.clone(),
        updated_at: now_str,
    };

    // Write project metadata
    let meta_json = serde_json::to_string_pretty(&meta)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    fs::write(project_dir.join("project.json"), &meta_json)
        .map_err(|e| format!("Failed to write project metadata: {}", e))?;

    // Write initial main.tex
    let default_content = template_content.unwrap_or_else(|| {
        r#"\documentclass[letterpaper,11pt]{article}

\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage[usenames,dvipsnames]{color}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-0.5in}
\addtolength{\textheight}{1.0in}

\begin{document}

%----------HEADING----------
\begin{center}
    {\Huge \scshape Your Name} \\ \vspace{1pt}
    \small your.email@example.com $|$ 
    \href{https://linkedin.com/in/yourprofile}{linkedin.com/in/yourprofile} $|$
    \href{https://github.com/yourgithub}{github.com/yourgithub}
\end{center}

%-----------EDUCATION-----------
\section{Education}
  \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
      \textbf{Your University} \hfill City, State \\
      \textit{Bachelor of Science in Computer Science} \hfill Aug. 2020 -- May 2024 \\
    }}
  \end{itemize}

%-----------EXPERIENCE-----------
\section{Experience}
  \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
      \textbf{Software Engineer} \hfill Company Name \\
      \textit{Full-time} \hfill Jun. 2024 -- Present \\
      \begin{itemize}
        \item Developed and maintained web applications using React and Node.js
        \item Collaborated with cross-functional teams to deliver features on schedule
      \end{itemize}
    }}
  \end{itemize}

%-----------PROJECTS-----------
\section{Projects}
  \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
      \textbf{Project Name} $|$ \emph{React, TypeScript, Node.js} \hfill 2024 \\
      \begin{itemize}
        \item Built a full-stack application with modern web technologies
        \item Implemented responsive design and real-time features
      \end{itemize}
    }}
  \end{itemize}

%-----------SKILLS-----------
\section{Technical Skills}
  \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
      \textbf{Languages}{: JavaScript, TypeScript, Python, Java, SQL} \\
      \textbf{Frameworks}{: React, Node.js, Express, Next.js} \\
      \textbf{Tools}{: Git, Docker, VS Code, Linux}
    }}
  \end{itemize}

\end{document}"#.to_string()
    });

    fs::write(project_dir.join("main.tex"), &default_content)
        .map_err(|e| format!("Failed to write main.tex: {}", e))?;

    Ok(meta)
}

#[tauri::command]
pub async fn read_project_file(project_id: String, filename: String) -> Result<String, String> {
    let file_path = get_project_dir(&project_id).join(&filename);
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file '{}': {}", filename, e))
}

#[tauri::command]
pub async fn save_project_file(
    project_id: String,
    filename: String,
    content: String,
) -> Result<(), String> {
    let project_dir = get_project_dir(&project_id);
    
    // Update the file
    fs::write(project_dir.join(&filename), &content)
        .map_err(|e| format!("Failed to save file '{}': {}", filename, e))?;

    // Update project metadata timestamp
    let meta_path = project_dir.join("project.json");
    if let Ok(meta_content) = fs::read_to_string(&meta_path) {
        if let Ok(mut meta) = serde_json::from_str::<ProjectMeta>(&meta_content) {
            let now: DateTime<Utc> = Utc::now();
            meta.updated_at = now.to_rfc3339();
            if let Ok(updated_json) = serde_json::to_string_pretty(&meta) {
                fs::write(&meta_path, &updated_json).ok();
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_project(project_id: String) -> Result<(), String> {
    let project_dir = get_project_dir(&project_id);
    if project_dir.exists() {
        fs::remove_dir_all(&project_dir)
            .map_err(|e| format!("Failed to delete project: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn rename_project(project_id: String, new_name: String) -> Result<(), String> {
    let project_dir = get_project_dir(&project_id);
    let meta_path = project_dir.join("project.json");
    
    let content = fs::read_to_string(&meta_path)
        .map_err(|e| format!("Failed to read project metadata: {}", e))?;
    
    let mut meta: ProjectMeta = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse project metadata: {}", e))?;
    
    meta.name = new_name;
    let now: DateTime<Utc> = Utc::now();
    meta.updated_at = now.to_rfc3339();
    
    let updated = serde_json::to_string_pretty(&meta)
        .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
    
    fs::write(&meta_path, &updated)
        .map_err(|e| format!("Failed to write metadata: {}", e))?;
    
    Ok(())
}
