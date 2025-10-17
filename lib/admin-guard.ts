export function isAdminEmail(email?: string | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const list = raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}
