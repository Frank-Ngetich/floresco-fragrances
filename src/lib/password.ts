/* Shared password-strength policy — used by every place a customer or
   staff member sets a password (register, reset, change), client and
   server side, so the rule is defined once and can't drift out of sync. */

export const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'lower',  label: 'One lowercase letter',   test: (p: string) => /[a-z]/.test(p) },
  { key: 'upper',  label: 'One uppercase letter',   test: (p: string) => /[A-Z]/.test(p) },
  { key: 'number', label: 'One number',             test: (p: string) => /[0-9]/.test(p) },
] as const;

export function passwordChecklist(password: string) {
  return PASSWORD_REQUIREMENTS.map((r) => ({ key: r.key, label: r.label, met: r.test(password) }));
}

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(password));
}

export function validatePassword(password: string): string {
  for (const req of PASSWORD_REQUIREMENTS) {
    if (!req.test(password)) return `Password must include ${req.label.toLowerCase()}.`;
  }
  return '';
}
