import React, { useEffect, useState } from 'react';
import {
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  Edit3,
  Clock,
  Search,
  Leaf,
} from 'lucide-react';
import { useProjectStore, ProjectMeta } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import {
  listProjects,
  createProject,
  deleteProject as deleteProjectApi,
  renameProject as renameProjectApi,
} from '../utils/tauri';
import './Dashboard.css';

// Resume templates
const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a basic document structure',
    icon: '📄',
  },
  {
    id: 'jake-resume',
    name: "Jake's Resume",
    description: 'Classic single-column professional resume',
    icon: '📋',
  },
  {
    id: 'modern-cv',
    name: 'Modern CV',
    description: 'Clean two-column layout with sidebar',
    icon: '✨',
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    description: 'Publication-focused academic curriculum vitae',
    icon: '🎓',
  },
];

const TEMPLATE_CONTENT: Record<string, string> = {
  'jake-resume': `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\begin{document}

\\begin{center}
    {\\Huge \\scshape Jake Gutierrez} \\\\ \\vspace{1pt}
    \\small +91-XXXXXXXXXX $|$
    \\href{mailto:jake@example.com}{\\underline{jake@example.com}} $|$
    \\href{https://linkedin.com/in/jake}{\\underline{linkedin.com/in/jake}} $|$
    \\href{https://github.com/jake}{\\underline{github.com/jake}}
\\end{center}

%-----------EDUCATION-----------
\\section{Education}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
      \\textbf{Chaudhary Charan Singh University} \\hfill Uttar Pradesh, Meerut \\\\
      \\textit{Bachelor's of Computer Applications} \\hfill Aug. 2021 -- May 2024 \\\\
    }}
  \\end{itemize}

%-----------CAREER OBJECTIVES-----------
\\section{Career Objectives}
  To Work in an Organization Where I Can Apply my expertise to Learn continuously in the Maximum Job Satisfaction

%-----------PROJECTS-----------
\\section{Projects}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
      \\textbf{Dragon Game} $|$ \\emph{HTML, CSS, and JavaScript} \\hfill December 2022 \\\\
      \\begin{itemize}
        \\item Created an interesting web application using JavaScript
        \\item Implemented the logic of moving objects in game using JavaScript
        \\item Developed animations components using CSS animations
      \\end{itemize}
    }}
    \\vspace{4pt}
    \\small{\\item{
      \\textbf{Snake Game} $|$ \\emph{HTML, CSS, and JavaScript} \\hfill December 2022 \\\\
      \\begin{itemize}
        \\item Developed a web application with HTML, CSS and JavaScript
        \\item Implemented the logic of moving objects in game using JavaScript
        \\item Developed animations components using CSS animations
      \\end{itemize}
    }}
  \\end{itemize}

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
  \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
      \\textbf{Languages}{: C/C++, HTML/CSS} \\\\
      \\textbf{Operating System}{: Window 10 and Window 11} \\\\
      \\textbf{Developer Tools}{: Git, VS Code, GitHub} \\\\
      \\textbf{Tools}{: Ms Word, MS E, GitHub}
    }}
  \\end{itemize}

\\end{document}`,

  'modern-cv': `\\documentclass[11pt,a4paper]{article}

\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-0.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\begin{document}

\\begin{center}
    {\\Huge\\scshape Your Name Here} \\\\ \\vspace{2pt}
    \\small City, State $|$ 
    \\href{mailto:email@example.com}{email@example.com} $|$ 
    \\href{https://linkedin.com/in/profile}{LinkedIn} $|$
    \\href{https://github.com/username}{GitHub} $|$
    \\href{https://yourportfolio.com}{Portfolio}
\\end{center}

\\section{Summary}
Experienced software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, user experience, and emerging technologies.

\\section{Experience}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item \\textbf{Senior Software Engineer} \\hfill Company Name \\\\
  \\textit{Full-time} \\hfill Jan 2022 -- Present
  \\begin{itemize}
    \\item Led development of microservices architecture serving 1M+ users
    \\item Mentored junior developers and conducted code reviews
    \\item Reduced API response times by 40\\% through optimization
  \\end{itemize}
  \\vspace{4pt}
  \\item \\textbf{Software Engineer} \\hfill Another Company \\\\
  \\textit{Full-time} \\hfill Jun 2019 -- Dec 2021
  \\begin{itemize}
    \\item Built responsive web applications using React and TypeScript
    \\item Implemented CI/CD pipelines reducing deployment time by 60\\%
  \\end{itemize}
\\end{itemize}

\\section{Education}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item \\textbf{University Name} \\hfill City, State \\\\
  \\textit{B.S. in Computer Science, GPA: 3.8} \\hfill 2015 -- 2019
\\end{itemize}

\\section{Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item \\textbf{Languages:} TypeScript, Python, Go, Rust, SQL \\\\
  \\textbf{Technologies:} React, Node.js, PostgreSQL, Docker, Kubernetes, AWS \\\\
  \\textbf{Practices:} Agile, TDD, CI/CD, System Design
\\end{itemize}

\\end{document}`,

  'academic-cv': `\\documentclass[11pt,a4paper]{article}

\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-0.5in}
\\addtolength{\\textheight}{1.0in}

\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\color{black}\\titlerule\\vspace{-5pt}]

\\begin{document}

\\begin{center}
    {\\Huge\\scshape Dr. Academic Researcher} \\\\ \\vspace{2pt}
    \\small Department of Computer Science $|$
    \\href{mailto:researcher@university.edu}{researcher@university.edu} $|$
    \\href{https://scholar.google.com}{Google Scholar}
\\end{center}

\\section{Research Interests}
Machine Learning, Natural Language Processing, Computer Vision, Deep Learning

\\section{Education}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item \\textbf{Ph.D. in Computer Science} \\hfill University Name \\\\
  \\textit{Dissertation: \`\`Advanced Methods in Neural Architecture Search''} \\hfill 2018 -- 2022
  \\vspace{4pt}
  \\item \\textbf{M.S. in Computer Science} \\hfill University Name \\\\
  \\textit{Thesis: \`\`Efficient Transformer Models for NLP''} \\hfill 2016 -- 2018
  \\vspace{4pt}
  \\item \\textbf{B.S. in Mathematics} \\hfill University Name \\\\
  \\textit{Summa Cum Laude} \\hfill 2012 -- 2016
\\end{itemize}

\\section{Publications}
\\begin{enumerate}
  \\item \\textbf{Researcher, A.}, Co-author, B. (2023). \`\`Novel Approach to Large Language Models.'' \\textit{Conference on AI}, pp. 1--15.
  \\item \\textbf{Researcher, A.}, et al. (2022). \`\`Scaling Laws for Neural Networks.'' \\textit{Journal of ML Research}, 23(1), 1--30.
  \\item \\textbf{Researcher, A.}, Co-author, C. (2021). \`\`Efficient Fine-tuning Methods.'' \\textit{NeurIPS 2021}.
\\end{enumerate}

\\section{Teaching}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item \\textbf{CS 401: Machine Learning} \\hfill Fall 2022, Spring 2023 \\\\
  \\item \\textbf{CS 201: Data Structures} \\hfill Fall 2021
\\end{itemize}

\\section{Awards}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item Best Paper Award, ICML 2023
  \\item Outstanding Teaching Award, 2022
  \\item NSF Graduate Research Fellowship, 2018
\\end{itemize}

\\end{document}`,
};

const Dashboard: React.FC = () => {
  const {
    projects,
    setProjects,
    setCurrentProject,
    setCurrentPage,
    removeProject,
    isLoading,
    setIsLoading,
  } = useProjectStore();

  const { setPdfData, setCompileStatus, setCompileErrors } =
    useEditorStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    projectId: string;
    x: number;
    y: number;
  } | null>(null);
  const [renameModal, setRenameModal] = useState<ProjectMeta | null>(null);
  const [renameName, setRenameName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await listProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const templateContent =
        selectedTemplate !== 'blank'
          ? TEMPLATE_CONTENT[selectedTemplate]
          : undefined;

      const project = await createProject(
        newProjectName.trim(),
        templateContent
      );

      setShowNewProject(false);
      setNewProjectName('');
      setSelectedTemplate('blank');
      await loadProjects();

      // Open the new project
      openProject(project);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const openProject = (project: ProjectMeta) => {
    setCurrentProject(project);
    setPdfData(null);
    setCompileStatus('idle');
    setCompileErrors([]);
    setCurrentPage('editor');
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProjectApi(id);
      removeProject(id);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
    setContextMenu(null);
  };

  const handleRename = async () => {
    if (!renameModal || !renameName.trim()) return;
    try {
      await renameProjectApi(renameModal.id, renameName.trim());
      await loadProjects();
    } catch (err) {
      console.error('Failed to rename project:', err);
    }
    setRenameModal(null);
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-logo-icon">
            <Leaf size={18} />
          </div>
          <span className="brand-title">Underleaf</span>
        </div>
      </header>

      {/* Body with Sidebar and Main View */}
      <div className="dashboard-body">
        {/* Overleaf Sidebar */}
        <aside className="dashboard-sidebar">
          <button
            className="btn btn-primary sidebar-new-btn"
            onClick={() => setShowNewProject(true)}
          >
            <Plus size={16} />
            New Project
          </button>

          <nav className="sidebar-nav">
            <button className="sidebar-nav-item active">
              <span className="sidebar-nav-icon">
                <FileText size={16} />
                All Projects
              </span>
              <span className="sidebar-badge">{projects.length}</span>
            </button>
            <button className="sidebar-nav-item">
              <span className="sidebar-nav-icon">
                <Clock size={16} />
                Recent Projects
              </span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <span>Storage: ~/underleaf/projects</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="dashboard-container">
            {/* Toolbar */}
            <div className="dashboard-toolbar">
              <div className="dashboard-title-group">
                <h1>All Projects</h1>
              </div>

              <div className="dashboard-search-bar">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Projects Table / Empty State */}
            {isLoading ? (
              <div className="projects-table-container">
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Loading projects…
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="projects-empty">
                <div className="empty-icon-wrap">
                  <FileText size={28} />
                </div>
                <h2>{searchQuery ? 'No matching projects' : 'No projects yet'}</h2>
                <p>
                  {searchQuery
                    ? 'Try searching with a different keyword.'
                    : 'Create your first document or start with a resume template.'}
                </p>
                {!searchQuery && (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowNewProject(true)}
                  >
                    <Plus size={16} />
                    New Project
                  </button>
                )}
              </div>
            ) : (
              <div className="projects-table-container">
                <table className="projects-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Title</th>
                      <th style={{ width: '20%' }}>Owner</th>
                      <th style={{ width: '20%' }}>Last Modified</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="project-row"
                        onClick={() => openProject(project)}
                      >
                        <td>
                          <div className="project-title-cell">
                            <div className="project-file-icon">
                              <FileText size={16} />
                            </div>
                            <span className="project-title-text">{project.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="project-owner-badge">You</span>
                        </td>
                        <td className="project-date-cell tabular-nums">
                          {formatDate(project.updated_at)}
                        </td>
                        <td
                          className="project-actions-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => {
                              setContextMenu(
                                contextMenu?.projectId === project.id
                                  ? null
                                  : { projectId: project.id, x: 0, y: 0 }
                              );
                            }}
                            title="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {contextMenu?.projectId === project.id && (
                            <div className="context-menu">
                              <button
                                className="context-menu-item"
                                onClick={() => {
                                  setRenameName(project.name);
                                  setRenameModal(project);
                                  setContextMenu(null);
                                }}
                              >
                                <Edit3 size={14} />
                                Rename
                              </button>
                              <button
                                className="context-menu-item danger"
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowNewProject(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. My Resume"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Choose a Template</label>
                <div className="template-grid">
                  {TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className={`template-card ${selectedTemplate === tmpl.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                    >
                      <div className="template-icon">{tmpl.icon}</div>
                      <div className="template-name">{tmpl.name}</div>
                      <div className="template-desc">{tmpl.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewProject(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal && (
        <div className="modal-overlay" onClick={() => setRenameModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rename Project</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setRenameModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">New Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setRenameModal(null)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleRename}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
