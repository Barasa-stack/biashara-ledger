export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: unknown): { valid: boolean; error?: string } {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  return { valid: true };
}

export function validateRequired(value: unknown, name: string): { valid: boolean; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${name} is required` };
  }
  return { valid: true };
}

export function validateString(value: unknown, name: string, maxLength = 500): { valid: boolean; error?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${name} must be a string` };
  }
  if (value.length > maxLength) {
    return { valid: false, error: `${name} must be at most ${maxLength} characters` };
  }
  return { valid: true };
}

export function validateNumber(value: unknown, name: string): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${name} must be a number` };
  }
  return { valid: true };
}
