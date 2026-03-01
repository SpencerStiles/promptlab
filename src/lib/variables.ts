/**
 * Variable interpolation for prompt templates.
 *
 * Variables use {{varName}} syntax, e.g.:
 *   "Translate the following {{language}}: {{text}}"
 */

/** Extract all variable names from a template string */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  const names = matches.map((m) => m.slice(2, -2));
  return [...new Set(names)];
}

/** Resolve a template by replacing variables with values */
export function resolveTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    return variables[name] ?? match;
  });
}

/** Check if all variables in a template are provided */
export function validateVariables(
  template: string,
  variables: Record<string, string>,
): { valid: boolean; missing: string[] } {
  const required = extractVariables(template);
  const missing = required.filter((name) => !variables[name]?.trim());
  return { valid: missing.length === 0, missing };
}
