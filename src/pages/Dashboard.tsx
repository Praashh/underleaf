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
    <div className="flex flex-col h-screen bg-bg-app">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-[52px] bg-brand-green text-text-inverse shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-white/[0.18] rounded-md text-white">
            <Leaf size={18} />
          </div>
          <span className="text-[17px] font-bold -tracking-[0.02em] text-white">Underleaf</span>
        </div>
      </header>

      {/* Body with Sidebar and Main View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Overleaf Sidebar */}
        <aside className="w-60 bg-bg-surface border-r border-border-subtle flex flex-col p-4 px-3 shrink-0">
          <button
            className="btn btn-primary w-full py-2.5 px-4 text-[13.5px] font-semibold mb-5 justify-center"
            onClick={() => setShowNewProject(true)}
          >
            <Plus size={16} />
            New Project
          </button>

          <nav className="flex flex-col gap-0.5 flex-1">
            <button className="flex items-center justify-between py-2 px-3 rounded-md text-brand-green text-[12.5px] font-semibold cursor-pointer border-none bg-brand-green-light w-full text-left transition-all duration-[120ms]">
              <span className="flex items-center gap-2.5">
                <FileText size={16} />
                All Projects
              </span>
              <span className="text-[11px] px-[7px] py-0.5 bg-brand-green rounded-full text-white">
                {projects.length}
              </span>
            </button>
            <button className="flex items-center justify-between py-2 px-3 rounded-md text-text-secondary text-[12.5px] font-medium cursor-pointer border-none bg-transparent w-full text-left transition-all duration-[120ms] hover:bg-bg-subtle hover:text-text-primary">
              <span className="flex items-center gap-2.5">
                <Clock size={16} />
                Recent Projects
              </span>
            </button>
          </nav>

          <div className="pt-3 border-t border-border-subtle text-[11px] text-text-muted">
            <span>Storage: ~/underleaf/projects</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-7 py-5 bg-bg-app">
          <div className="max-w-[1120px] mx-auto">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h1 className="text-[20px] font-bold text-text-primary -tracking-[0.01em]">All Projects</h1>
              </div>

              <div className="flex items-center relative w-[300px]">
                <Search size={14} className="absolute left-2.5 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  className="w-full py-[7px] pr-3 pl-[34px] bg-bg-surface border border-border-medium rounded-md text-[12.5px] text-text-primary transition-all duration-[120ms] focus:outline-none focus:border-brand-green focus:shadow-[0_0_0_3px_rgba(2,96,70,0.12)]"
                  placeholder="Search projects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Projects Table / Empty State */}
            {isLoading ? (
              <div className="bg-bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden">
                <div className="p-8 text-center text-text-muted">
                  Loading projects…
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-10 px-5 text-center bg-bg-surface rounded-lg border border-dashed border-border-medium">
                <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-brand-green-light text-brand-green rounded-full">
                  <FileText size={28} />
                </div>
                <h2 className="text-[17px] font-semibold text-text-primary mb-1.5">
                  {searchQuery ? 'No matching projects' : 'No projects yet'}
                </h2>
                <p className="text-text-muted text-[12.5px] max-w-[380px] mx-auto mb-5">
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
              <div className="bg-bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden">
                <table className="w-full border-collapse text-left text-[12.5px]">
                  <thead>
                    <tr>
                      <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted bg-bg-sidebar border-b border-border-subtle w-[50%]">Title</th>
                      <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted bg-bg-sidebar border-b border-border-subtle w-[20%]">Owner</th>
                      <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted bg-bg-sidebar border-b border-border-subtle w-[20%]">Last Modified</th>
                      <th className="py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted bg-bg-sidebar border-b border-border-subtle w-[10%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="cursor-pointer transition-colors duration-[120ms] hover:bg-[#f8fafc] border-b border-border-subtle last:border-b-0"
                        onClick={() => openProject(project)}
                      >
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-[#ecfdf5] text-brand-green rounded shrink-0">
                              <FileText size={16} />
                            </div>
                            <span className="font-semibold text-text-primary text-[13.5px] hover:text-brand-green">{project.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className="inline-flex items-center px-2 py-0.5 bg-bg-subtle rounded-full text-[11.5px] text-text-secondary">You</span>
                        </td>
                        <td className="py-3 px-4 align-middle text-text-muted text-[12.5px] tabular-nums">
                          {formatDate(project.updated_at)}
                        </td>
                        <td
                          className="py-3 px-4 align-middle text-right relative"
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
                            <div className="absolute right-4 top-full bg-bg-surface border border-border-subtle rounded-md shadow-md z-50 min-w-[150px] overflow-hidden">
                              <button
                                className="flex items-center gap-2 w-full py-2 px-3 border-none bg-transparent text-[12.5px] text-text-primary cursor-pointer text-left hover:bg-bg-subtle"
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
                                className="flex items-center gap-2 w-full py-2 px-3 border-none bg-transparent text-[12.5px] text-error cursor-pointer text-left hover:bg-error-bg"
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
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[4px] flex items-center justify-center z-[100] animate-modal-fade-in" onClick={() => setShowNewProject(false)}>
          <div
            className="bg-bg-surface rounded-xl shadow-modal border border-border-subtle w-[90%] max-w-[580px] max-h-[85vh] flex flex-col overflow-hidden animate-modal-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <h2 className="text-[17px] font-semibold text-text-primary">New Project</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowNewProject(false)}
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-5 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5">Project Name</label>
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-bg-surface border border-border-medium rounded-md text-[13.5px] text-text-primary transition-all duration-[120ms] focus:outline-none focus:border-brand-green focus:shadow-[0_0_0_3px_rgba(2,96,70,0.15)] placeholder:text-text-muted"
                  placeholder="e.g. My Resume"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5">Choose a Template</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className={`p-3 border-[1.5px] rounded-lg cursor-pointer bg-bg-surface text-left transition-all duration-[120ms] hover:border-brand-green-border hover:bg-bg-sidebar ${
                        selectedTemplate === tmpl.id
                          ? 'border-brand-green bg-brand-green-light shadow-[0_0_0_2px_var(--color-brand-green)]'
                          : 'border-border-subtle'
                      }`}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                    >
                      <div className="text-[22px] mb-2">{tmpl.icon}</div>
                      <div className="font-semibold text-[12.5px] text-text-primary mb-[3px]">{tmpl.name}</div>
                      <div className="text-[11.5px] text-text-muted leading-[1.4]">{tmpl.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle bg-bg-sidebar">
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
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[4px] flex items-center justify-center z-[100] animate-modal-fade-in" onClick={() => setRenameModal(null)}>
          <div className="bg-bg-surface rounded-xl shadow-modal border border-border-subtle w-[90%] max-w-[580px] max-h-[85vh] flex flex-col overflow-hidden animate-modal-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <h2 className="text-[17px] font-semibold text-text-primary">Rename Project</h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setRenameModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-5 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5">New Name</label>
                <input
                  type="text"
                  className="w-full py-2 px-3 bg-bg-surface border border-border-medium rounded-md text-[13.5px] text-text-primary transition-all duration-[120ms] focus:outline-none focus:border-brand-green focus:shadow-[0_0_0_3px_rgba(2,96,70,0.15)] placeholder:text-text-muted"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border-subtle bg-bg-sidebar">
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
