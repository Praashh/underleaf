export type AiAction =
  | { type: 'replace_document'; code: string; explanation?: string }
  | { type: 'replace_selection'; code: string; explanation?: string }
  | { type: 'insert_at_cursor'; code: string; explanation?: string }
  | { type: 'patch_snippet'; search: string; replace: string; explanation?: string };

export interface ParsedAiResponse {
  /** The clean markdown/prose explanation for the user with action tags removed */
  prose: string;
  /** Action blocks discovered in the response */
  actions: AiAction[];
}

const TAG_REGEX = /<action>\s*([\s\S]*?)<\/action>/g;
const CODEBLOCK_REGEX = /```(?:action|json)\s*\n([\s\S]*?)\n```/g;

function tryParseAction(raw: string): AiAction | null {
  try {
    const obj = JSON.parse(raw.trim());
    if (!obj || typeof obj !== 'object') return null;

    if (obj.type === 'replace_document' && typeof obj.code === 'string') {
      return {
        type: 'replace_document',
        code: obj.code,
        explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
      };
    }

    if (obj.type === 'replace_selection' && typeof obj.code === 'string') {
      return {
        type: 'replace_selection',
        code: obj.code,
        explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
      };
    }

    if (obj.type === 'insert_at_cursor' && typeof obj.code === 'string') {
      return {
        type: 'insert_at_cursor',
        code: obj.code,
        explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
      };
    }

    if (
      obj.type === 'patch_snippet' &&
      typeof obj.search === 'string' &&
      typeof obj.replace === 'string'
    ) {
      return {
        type: 'patch_snippet',
        search: obj.search,
        replace: obj.replace,
        explanation: typeof obj.explanation === 'string' ? obj.explanation : undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function parseAiActions(response: string): ParsedAiResponse {
  const actions: AiAction[] = [];

  // 1. Try explicit <action>...</action> tags
  let prose = response.replace(TAG_REGEX, (_, inner) => {
    const action = tryParseAction(inner);
    if (action) {
      actions.push(action);
    }
    return '';
  });

  // 2. If no <action> tags found, look for ```action / ```json codeblocks containing action objects
  if (actions.length === 0) {
    prose = prose.replace(CODEBLOCK_REGEX, (match, inner) => {
      const action = tryParseAction(inner);
      if (action) {
        actions.push(action);
        return '';
      }
      return match;
    });
  }

  return {
    prose: prose.trim(),
    actions,
  };
}

