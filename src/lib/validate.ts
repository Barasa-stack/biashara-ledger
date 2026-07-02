export function validateBody(body: any, rules: Record<string, { type: string; required?: boolean; min?: number }>): string[] {
  const errors: string[] = [];
  for (const [field, rule] of Object.entries(rules)) {
    const val = body?.[field];
    if (rule.required && (val === undefined || val === null || val === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    if (val === undefined || val === null) continue;
    if (rule.type === 'number' && isNaN(Number(val))) {
      errors.push(`${field} must be a number`);
    }
    if (rule.type === 'string' && typeof val !== 'string') {
      errors.push(`${field} must be a string`);
    }
    if (rule.min !== undefined && rule.type === 'number' && Number(val) < rule.min) {
      errors.push(`${field} must be at least ${rule.min}`);
    }
  }
  return errors;
}
