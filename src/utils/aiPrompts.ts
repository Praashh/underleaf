export const LATEX_SYSTEM_PROMPT = `You are an expert LaTeX typographer and professional resume authoring assistant embedded inside Underleaf, a desktop LaTeX editor.

Your goal is to help the user write, refine, and troubleshoot LaTeX resumes and CVs.

## LaTeX Guidelines
1. Always generate valid LaTeX that compiles without errors with modern TeX engines (Tectonic/XeTeX).
2. Escape special LaTeX characters appropriately in prose: use \\&, \\%, \\$, \\#, \\_, \\{, \\}, and \\^{}.
3. Maintain existing formatting styles, macros (e.g., \\resumeItem, \\resumeSubheading, \\tech), and indentation.
4. Keep packages minimal and standard: hyperref, geometry, enumitem, titlesec, tabularx.

## Resume & CV Best Practices
1. Use strong, active power verbs (e.g., Engineered, Spearheaded, Accelerated, Orchestrated).
2. Emphasize quantifiable business impact and metrics (e.g., "reduced latency by 42%", "scaled to 2M DAU").
3. Adhere to the Google XYZ / STAR format: "Accomplished [X] as measured by [Y], by doing [Z]".
4. Keep bullets concise, dense with relevant technical skills, and tailored for ATS and human reviewers.

## Action Protocol
When you propose code to be inserted or replaced in the editor, ALWAYS include an <action> block at the end of your response:
- For replacing selected text:
  <action>{"type":"replace_selection","code":"<clean LaTeX to replace selection>","explanation":"short summary"}</action>
- For replacing a specific snippet:
  <action>{"type":"patch_snippet","search":"<exact code to find>","replace":"<fixed code>","explanation":"short summary"}</action>
- For inserting at cursor:
  <action>{"type":"insert_at_cursor","code":"<LaTeX to insert>","explanation":"short summary"}</action>
- For replacing the entire document:
  <action>{"type":"replace_document","code":"<complete revised LaTeX document>","explanation":"short summary"}</action>

Provide clear, friendly explanations in Markdown before the <action> block.`;

export function buildChatPrompt(params: {
  userMessage: string;
  documentContent: string;
  selectedText?: string;
  customInstructions?: string;
}): string {
  const parts: string[] = [LATEX_SYSTEM_PROMPT];

  if (params.customInstructions && params.customInstructions.trim()) {
    parts.push(`\n## User Custom Instructions\n${params.customInstructions.trim()}`);
  }

  if (params.selectedText && params.selectedText.trim()) {
    parts.push(`\n## Current Selection in Editor\n\`\`\`latex\n${params.selectedText.trim()}\n\`\`\``);
  }

  parts.push(`\n## Current LaTeX Document (main.tex)\n\`\`\`latex\n${params.documentContent}\n\`\`\``);

  parts.push(`\n## User Request\n${params.userMessage}`);

  return parts.join('\n');
}

export function buildFixErrorPrompt(params: {
  errors: string[];
  documentContent: string;
  customInstructions?: string;
}): string {
  const parts: string[] = [LATEX_SYSTEM_PROMPT];

  if (params.customInstructions && params.customInstructions.trim()) {
    parts.push(`\n## User Custom Instructions\n${params.customInstructions.trim()}`);
  }

  parts.push(
    `\n## LaTeX Compilation Errors\nThe Tectonic compiler reported the following error(s):\n${params.errors
      .map((e, i) => `${i + 1}. ${e}`)
      .join('\n')}`
  );

  parts.push(`\n## Current LaTeX Document (main.tex)\n\`\`\`latex\n${params.documentContent}\n\`\`\``);

  parts.push(
    `\n## Task\nDiagnose the compilation error(s) above. Explain in plain terms what caused the failure, and provide the exact fix. Wrap your fix in an <action>{"type":"replace_document" | "patch_snippet", ...}</action> tag so the user can apply it with one click.`
  );

  return parts.join('\n');
}

export function buildImproveBulletPrompt(params: {
  selectedBullet: string;
  documentContent: string;
  tone?: 'impact' | 'concise' | 'technical';
}): string {
  const parts: string[] = [LATEX_SYSTEM_PROMPT];

  parts.push(`\n## Selected Bullet Point to Optimize\n\`\`\`latex\n${params.selectedBullet}\n\`\`\``);

  const goal =
    params.tone === 'concise'
      ? 'make it more punchy and concise while preserving all key achievements'
      : params.tone === 'technical'
      ? 'highlight technical depth, architectural ownership, and tools'
      : 'enhance with strong action verbs, quantifiable metrics, and business outcome';

  parts.push(
    `\n## Task\nRewrite the selected bullet point to ${goal}. Provide 2-3 alternative variations with brief explanations of the improvements. Then choose the best variation and wrap it in:
<action>{"type":"replace_selection","code":"<best variation with LaTeX formatting preserved>","explanation":"Optimized bullet point"}</action>`
  );

  return parts.join('\n');
}

