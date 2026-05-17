import type { ApiMeta, AuditLogEntry } from "@/types/monitoring";

const auditEntries: AuditLogEntry[] = [];

export function recordAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
  const auditEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${auditEntries.length + 1}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  auditEntries.unshift(auditEntry);
  auditEntries.splice(50);
  return auditEntry;
}

export function listAuditEntries(role: ApiMeta["role"]) {
  if (role === "admin") {
    return auditEntries;
  }

  return auditEntries.slice(0, 10).map((entry) => ({
    ...entry,
    actor: entry.actor === "anonymous" ? "anonymous" : "redacted"
  }));
}
