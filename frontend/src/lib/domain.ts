// checking if email is correct domain

export function schoolDomain(): string {
  return (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "hdsb.ca")
    .replace(/^@/, "")
    .toLowerCase();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSchoolEmail(email: string): boolean {
  return normalizeEmail(email).endsWith(`@${schoolDomain()}`) || email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "");
}
