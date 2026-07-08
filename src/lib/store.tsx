import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Agent,
  Customer,
  Message,
  Service,
  Tag,
  Template,
  ConversationStatus,
  OrderStatus,
  Priority,
  AuditLogEntry,
  AuditAction,
  ExportRequest,
  FieldVisibilityRule,
  ManualShare,
  Role,
  Branch,
  GoogleContactsSettings,
  GoogleContactsSyncHistory,
  Collaborator,
  CollaboratorAccessLevel,
} from "@/types";
import { AGENTS } from "@/data/agents";
import { CUSTOMERS } from "@/data/customers";
import { INITIAL_MESSAGES } from "@/data/conversations";
import { DEFAULT_TAGS, DEFAULT_TEMPLATES, SERVICES } from "@/data/services";
import { INITIAL_AUDIT_LOG } from "@/data/auditLog";
import { INITIAL_EXPORT_REQUESTS } from "@/data/exportRequests";
import { BRANCHES } from "@/data/branches";
import { DEFAULT_FIELD_RULES } from "@/lib/fieldVisibility";
import * as db from "@/lib/supabase/persist";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type BusinessProfile,
  DEFAULT_BUSINESS_PROFILE,
  loadBusinessProfile,
  saveBusinessProfile,
} from "@/lib/businessProfile";
import type { Purchase } from "@/types";

const USE_SUPABASE = db.isSupabaseConfigured();

interface StoreState {
  isLoading: boolean;
  usesSupabase: boolean;
  agents: Agent[];
  currentAgentId: string | null;
  currentAgent: Agent | null;
  customers: Customer[];
  messages: Message[];
  services: Service[];
  templates: Template[];
  tags: Tag[];
  auditLog: AuditLogEntry[];
  exportRequests: ExportRequest[];
  fieldRules: FieldVisibilityRule[];
  businessProfile: BusinessProfile;
  setBusinessProfile: (p: BusinessProfile) => void;

  // Branches
  branches: Branch[];
  selectedBranchId: string | "all";
  setSelectedBranchId: (id: string | "all") => void;
  addBranch: (b: Omit<Branch, "id" | "createdAt">) => Branch;
  updateBranch: (id: string, patch: Partial<Branch>) => void;
  toggleBranchActive: (id: string) => void;
  setAgentBranch: (agentId: string, branchId: string | undefined) => void;
  setAgentBranches: (agentId: string, branchIds: string[]) => void;
  addCollaborator: (
    customerId: string,
    agentId: string,
    accessLevel?: CollaboratorAccessLevel,
    addedByAgentId?: string,
  ) => void;
  removeCollaborator: (customerId: string, agentId: string) => void;
  updateCollaboratorAccessLevel: (
    customerId: string,
    agentId: string,
    newAccessLevel: CollaboratorAccessLevel,
  ) => void;

  // Google Contacts (placeholder integration)
  googleContacts: GoogleContactsSettings;
  setGoogleContactsAutoSync: (v: boolean) => void;
  markCustomerGoogleSynced: (customerId: string, customerName: string) => void;

  login: (agentId: string) => void;
  logout: () => void;
  setAgentSession: (agentId: string) => void;
  clearAgentSession: () => void;
  logAuthLogin: (agent: Agent) => void;

  sendMessage: (
    customerId: string,
    content: string,
    type?: "text" | "internal_note",
    accessToken?: string,
  ) => Promise<void>;
  markRead: (customerId: string) => void;

  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomer: (
    c: Omit<Customer, "id" | "purchases" | "segmentHistory" | "conversationTags">,
  ) => Customer;
  bulkAddCustomers: (
    rows: Omit<Customer, "id" | "purchases" | "segmentHistory" | "conversationTags">[],
    batchTag: string,
  ) => { created: number; skipped: number };

  setConversationStatus: (id: string, status: ConversationStatus, snoozeUntil?: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  setPriority: (id: string, p: Priority) => void;
  assignCustomer: (id: string, agentId: string) => void;

  addConversationTag: (id: string, tag: string) => void;
  removeConversationTag: (id: string, tag: string) => void;
  addCustomerTag: (id: string, tag: string) => void;
  removeCustomerTag: (id: string, tag: string) => void;

  saveNotes: (id: string, notes: string) => void;

  setCadenceOverride: (id: string, days: number | null) => void;

  addPurchase: (customerId: string, purchase: Omit<Purchase, "id">) => Purchase;

  // Audit
  logAudit: (
    entry: Omit<AuditLogEntry, "id" | "timestamp" | "actorId" | "actorName" | "actorRole">,
  ) => void;

  // Manual shares
  createManualShare: (input: Omit<ManualShare, "id" | "createdAt" | "sharedByAgentId">) => void;
  revokeManualShare: (customerId: string, shareId: string) => void;

  // Export workflow
  createExportRequest: (dataType: ExportRequest["dataType"], reason: string) => void;
  approveExportRequest: (id: string, note?: string) => void;
  denyExportRequest: (id: string, note: string) => void;
  exportDataDirect: (dataType: ExportRequest["dataType"]) => void;

  // Field rules
  addFieldRule: (rule: Omit<FieldVisibilityRule, "id">) => void;
  deleteFieldRule: (id: string) => void;

  // Templates
  addTemplate: (text: string) => void;
  updateTemplate: (id: string, text: string) => void;
  deleteTemplate: (id: string) => void;

  // Services
  addService: (s: Omit<Service, "id">) => void;
  updateService: (id: string, patch: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Tags
  addTag: (t: Omit<Tag, "id">) => void;
  deleteTag: (id: string) => void;

  // Agents
  toggleAgentOnline: (id: string) => void;
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  addAgent: (a: Omit<Agent, "id" | "initials">) => void;
  registerInvitedAgent: (agent: Agent) => void;
  changeAgentRole: (id: string, newRole: Role) => void;
  deleteAgent: (id: string) => void;

  // Granular permission overrides
  setAgentPermissionOverrides: (
    id: string,
    overrides: Partial<import("@/types").PermissionFlags>,
    summary?: string,
  ) => void;
  resetAgentPermissionOverrides: (id: string) => void;
}

const StoreContext = createContext<StoreState | null>(null);

function genId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(USE_SUPABASE);
  const [agents, setAgents] = useState<Agent[]>(USE_SUPABASE ? [] : AGENTS);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(() =>
    USE_SUPABASE ? null : db.loadSessionAgentId(),
  );
  const [customers, setCustomers] = useState<Customer[]>(USE_SUPABASE ? [] : CUSTOMERS);
  const [messages, setMessages] = useState<Message[]>(USE_SUPABASE ? [] : INITIAL_MESSAGES);
  const [services, setServices] = useState<Service[]>(USE_SUPABASE ? [] : SERVICES);
  const [templates, setTemplates] = useState<Template[]>(USE_SUPABASE ? [] : DEFAULT_TEMPLATES);
  const [tags, setTags] = useState<Tag[]>(USE_SUPABASE ? [] : DEFAULT_TAGS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(USE_SUPABASE ? [] : INITIAL_AUDIT_LOG);
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>(
    USE_SUPABASE ? [] : INITIAL_EXPORT_REQUESTS,
  );
  const [fieldRules, setFieldRules] = useState<FieldVisibilityRule[]>(
    USE_SUPABASE ? [] : DEFAULT_FIELD_RULES,
  );
  const [businessProfile, setBusinessProfileState] = useState<BusinessProfile>(() =>
    typeof window !== "undefined" ? loadBusinessProfile() : DEFAULT_BUSINESS_PROFILE,
  );
  const [branches, setBranches] = useState<Branch[]>(BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string | "all">("all");
  const [googleContacts, setGoogleContacts] = useState<GoogleContactsSettings>({
    connected: false,
    autoSync: false,
    history: [],
  });

  const addBranch = useCallback((b: Omit<Branch, "id" | "createdAt">) => {
    const branch: Branch = { ...b, id: genId("br"), createdAt: new Date().toISOString() };
    setBranches((p) => [...p, branch]);
    return branch;
  }, []);
  const updateBranch = useCallback((id: string, patch: Partial<Branch>) => {
    setBranches((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, []);
  const toggleBranchActive = useCallback((id: string) => {
    setBranches((p) => p.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)));
  }, []);
  const setAgentBranch = useCallback((agentId: string, branchId: string | undefined) => {
    setAgents((p) =>
      p.map((a) =>
        a.id === agentId
          ? { ...a, branchId, branchIds: branchId ? [branchId] : [] }
          : a,
      ),
    );
  }, []);
  const setAgentBranches = useCallback((agentId: string, branchIds: string[]) => {
    setAgents((p) =>
      p.map((a) =>
        a.id === agentId ? { ...a, branchIds, branchId: branchIds[0] ?? undefined } : a,
      ),
    );
  }, []);
  const addCollaborator = useCallback(
    (
      customerId: string,
      agentId: string,
      accessLevel: CollaboratorAccessLevel = "view_note_reply",
      addedByAgentId: string = "system",
    ) => {
      setCustomers((p) =>
        p.map((c) => {
          if (c.id !== customerId) return c;
          const existing = c.collaborators ?? [];
          if (existing.some((col) => col.agentId === agentId)) return c;
          const nextCollabs: Collaborator[] = [
            ...existing,
            {
              agentId,
              accessLevel,
              addedAt: new Date().toISOString(),
              addedByAgentId,
            },
          ];
          return {
            ...c,
            collaborators: nextCollabs,
            collaboratorAgentIds: nextCollabs.map((col) => col.agentId),
          };
        }),
      );
    },
    [],
  );
  const removeCollaborator = useCallback((customerId: string, agentId: string) => {
    setCustomers((p) =>
      p.map((c) => {
        if (c.id !== customerId) return c;
        const nextCollabs = (c.collaborators ?? []).filter((col) => col.agentId !== agentId);
        return {
          ...c,
          collaborators: nextCollabs,
          collaboratorAgentIds: nextCollabs.map((col) => col.agentId),
        };
      }),
    );
  }, []);
  const updateCollaboratorAccessLevel = useCallback(
    (customerId: string, agentId: string, newAccessLevel: CollaboratorAccessLevel) => {
      setCustomers((p) =>
        p.map((c) => {
          if (c.id !== customerId) return c;
          const nextCollabs = (c.collaborators ?? []).map((col) =>
            col.agentId === agentId ? { ...col, accessLevel: newAccessLevel } : col,
          );
          return { ...c, collaborators: nextCollabs };
        }),
      );
    },
    [],
  );
  const setGoogleContactsAutoSync = useCallback((v: boolean) => {
    setGoogleContacts((s) => ({ ...s, autoSync: v }));
  }, []);
  const markCustomerGoogleSynced = useCallback(
    (customerId: string, customerName: string) => {
      const nowIso = new Date().toISOString();
      setCustomers((p) =>
        p.map((c) =>
          c.id === customerId
            ? { ...c, googleContactSynced: true, googleContactSyncedAt: nowIso }
            : c,
        ),
      );
      const entry: GoogleContactsSyncHistory = {
        id: genId("gsh"),
        customerId,
        customerName,
        syncedAt: nowIso,
        status: "success",
      };
      setGoogleContacts((s) => ({ ...s, history: [entry, ...s.history].slice(0, 50) }));
    },
    [],
  );

  const setBusinessProfile = useCallback((p: BusinessProfile) => {
    setBusinessProfileState(p);
    saveBusinessProfile(p);
  }, []);

  const addPurchase = useCallback((customerId: string, purchase: Omit<Purchase, "id">) => {
    const full: Purchase = { ...purchase, id: genId("p") };
    setCustomers((p) => {
      const next = p.map((c) =>
        c.id === customerId ? { ...c, purchases: [full, ...c.purchases] } : c,
      );
      const updated = next.find((c) => c.id === customerId);
      if (updated) db.persistCustomer(updated);
      return next;
    });
    return full;
  }, []);

  useEffect(() => {
    if (!USE_SUPABASE) return;
    const client = getSupabaseBrowserClient();
    if (!client) {
      setIsLoading(false);
      return;
    }
    db.fetchAppSnapshot(client)
      .then((snap) => {
        setAgents(snap.agents);
        setCustomers(snap.customers);
        setMessages(snap.messages);
        setServices(snap.services);
        setTemplates(snap.templates);
        setTags(snap.tags);
        setAuditLog(snap.auditLog);
        setExportRequests(snap.exportRequests);
        setFieldRules(snap.fieldRules.length ? snap.fieldRules : DEFAULT_FIELD_RULES);
      })
      .catch((err) => {
        console.warn("[store] Supabase load failed — fallback to seed data", err);
        setAgents(AGENTS);
        setCustomers(CUSTOMERS);
        setMessages(INITIAL_MESSAGES);
        setServices(SERVICES);
        setTemplates(DEFAULT_TEMPLATES);
        setTags(DEFAULT_TAGS);
        setAuditLog(INITIAL_AUDIT_LOG);
        setExportRequests(INITIAL_EXPORT_REQUESTS);
        setFieldRules(DEFAULT_FIELD_RULES);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === currentAgentId) ?? null,
    [agents, currentAgentId],
  );

  const logAuditRaw = useCallback(
    (
      actor: Agent | null,
      entry: Omit<AuditLogEntry, "id" | "timestamp" | "actorId" | "actorName" | "actorRole">,
    ) => {
      const full: AuditLogEntry = {
        ...entry,
        id: genId("al"),
        timestamp: new Date().toISOString(),
        actorId: actor?.id ?? "system",
        actorName: actor?.name ?? "Sistem",
        actorRole: actor?.role ?? "cs",
      };
      setAuditLog((prev) => [full, ...prev]);
      db.persistAudit(full);
    },
    [],
  );

  const logAudit = useCallback(
    (entry: Omit<AuditLogEntry, "id" | "timestamp" | "actorId" | "actorName" | "actorRole">) => {
      logAuditRaw(currentAgent, entry);
    },
    [currentAgent, logAuditRaw],
  );

  const login = useCallback(
    (agentId: string) => {
      setCurrentAgentId(agentId);
      db.saveSessionAgentId(agentId);
      const ag = agents.find((a) => a.id === agentId);
      if (ag) {
        logAuditRaw(ag, {
          action: "login",
          targetType: "system",
          targetId: "system",
          targetLabel: "Sistem",
          details: "Login dari workspace web",
        });
      }
    },
    [agents, logAuditRaw],
  );

  const setAgentSession = useCallback((agentId: string) => {
    setCurrentAgentId(agentId);
    db.saveSessionAgentId(agentId);
  }, []);

  const clearAgentSession = useCallback(() => {
    setCurrentAgentId(null);
    db.saveSessionAgentId(null);
  }, []);

  const logAuthLogin = useCallback(
    (agent: Agent) => {
      logAuditRaw(agent, {
        action: "login",
        targetType: "system",
        targetId: "system",
        targetLabel: "Sistem",
        details: "Login via autentikasi",
      });
    },
    [logAuditRaw],
  );

  const logout = useCallback(() => {
    clearAgentSession();
  }, [clearAgentSession]);

  const sendMessage = useCallback(
    async (
      customerId: string,
      content: string,
      type: "text" | "internal_note" = "text",
      accessToken?: string,
    ) => {
      const agentId = currentAgentId ?? "rina";
      const agent = agents.find((a) => a.id === agentId);

      if (type === "internal_note" || !USE_SUPABASE) {
        const msg: Message = {
          id: genId("m"),
          customerId,
          senderId: agentId,
          senderName: agent?.name ?? "Agent",
          content,
          timestamp: new Date().toISOString(),
          readStatus: "sent",
          type,
          channel: "internal",
        };
        setMessages((prev) => [...prev, msg]);
        db.persistMessage(msg);
        return;
      }

      const messageId = genId("m");
      const { sendWhatsappMessageServerFn } = await import("@/lib/whatsapp/send.fn");
      const saved = await sendWhatsappMessageServerFn({
        data: {
          customerId,
          content,
          messageId,
          senderId: agentId,
          senderName: agent?.name ?? "Agent",
          ...(accessToken ? { accessToken } : {}),
        },
      });
      setMessages((prev) => [...prev, saved]);
    },
    [agents, currentAgentId],
  );

  const markRead = useCallback((customerId: string) => {
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.customerId === customerId && m.senderId === customerId
          ? { ...m, readStatus: "read" as const }
          : m,
      );
      const updated = next.filter(
        (m, i) => m.readStatus === "read" && prev[i].readStatus !== "read",
      );
      if (updated.length) db.persistMessages(updated);
      return next;
    });
  }, []);

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => {
    setCustomers((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      const updated = next.find((c) => c.id === id);
      if (updated) db.persistCustomer(updated);
      return next;
    });
  }, []);

  const addCustomer = useCallback(
    (c: Omit<Customer, "id" | "purchases" | "segmentHistory" | "conversationTags">) => {
      const newC: Customer = {
        ...c,
        id: genId("c"),
        primaryAgentId: c.primaryAgentId ?? (c.assignedAgentId || undefined),
        assignedAgentId: c.assignedAgentId || c.primaryAgentId || "",
        purchases: [],
        segmentHistory: [
          {
            date: new Date().toISOString(),
            fromSegment: null,
            toSegment: "new",
            reason: "Customer baru ditambahkan",
          },
        ],
        conversationTags: [],
      };
      db.persistCustomer(newC);
      setCustomers((p) => [newC, ...p]);
      return newC;
    },
    [],
  );

  const setConversationStatus = useCallback(
    (id: string, status: ConversationStatus, snoozeUntil?: string) => {
      setCustomers((prev) => {
        const next = prev.map((c) =>
          c.id === id
            ? {
                ...c,
                conversationStatus: status,
                snoozeUntil: status === "snoozed" ? snoozeUntil : undefined,
              }
            : c,
        );
        const updated = next.find((c) => c.id === id);
        if (updated) db.persistCustomer(updated);
        return next;
      });
    },
    [],
  );
  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setCustomers((p) => {
      const prev = p.find((c) => c.id === id);
      const next = p.map((c) =>
        c.id === id
          ? { ...c, orderStatus: status, orderStatusChangedAt: new Date().toISOString() }
          : c,
      );
      const updated = next.find((c) => c.id === id);
      if (updated) db.persistCustomer(updated);
      if (prev && prev.orderStatus !== status) {
        logAuditRaw(currentAgent, {
          action: "order_status_changed",
          targetType: "customer",
          targetId: id,
          targetLabel: prev.name,
          oldValue: prev.orderStatus,
          newValue: status,
          details: `Status order: ${prev.orderStatus} → ${status}`,
        });
      }
      return next;
    });
  }, [currentAgent]); // eslint-disable-line react-hooks/exhaustive-deps

  const bulkAddCustomers = useCallback(
    (
      rows: Omit<Customer, "id" | "purchases" | "segmentHistory" | "conversationTags">[],
      batchTag: string,
    ) => {
      let created = 0;
      let skipped = 0;
      const nowIso = new Date().toISOString();
      setCustomers((prev) => {
        const existingPhones = new Set(prev.map((c) => c.phone.replace(/\D/g, "")));
        const additions: Customer[] = [];
        for (const row of rows) {
          const norm = row.phone.replace(/\D/g, "");
          if (!norm || existingPhones.has(norm)) {
            skipped++;
            continue;
          }
          existingPhones.add(norm);
          const newC: Customer = {
            ...row,
            id: genId("c"),
            purchases: [],
            segmentHistory: [
              { date: nowIso, fromSegment: null, toSegment: "new", reason: "Import CSV/Excel" },
            ],
            conversationTags: [],
            source: "imported",
            importBatchTag: batchTag,
          };
          db.persistCustomer(newC);
          additions.push(newC);
          created++;
        }
        return [...additions, ...prev];
      });
      logAuditRaw(currentAgent, {
        action: "customer_bulk_imported",
        targetType: "system",
        targetId: batchTag,
        targetLabel: `Import batch ${batchTag}`,
        details: `${created} customer di-import (skipped: ${skipped}) — batch ${batchTag}`,
      });
      return { created, skipped };
    },
    [currentAgent], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const setPriority = useCallback((id: string, pr: Priority) => {
    setCustomers((p) => {
      const next = p.map((c) => (c.id === id ? { ...c, priority: pr } : c));
      const updated = next.find((c) => c.id === id);
      if (updated) db.persistCustomer(updated);
      return next;
    });
  }, []);
  const assignCustomer = useCallback(
    (id: string, agentId: string) => {
      setCustomers((p) => {
        const cust = p.find((c) => c.id === id);
        const oldPrimaryId = cust?.primaryAgentId ?? cust?.assignedAgentId;
        const oldAg = agents.find((a) => a.id === oldPrimaryId);
        const newAg = agents.find((a) => a.id === agentId);
        if (cust) {
          logAuditRaw(currentAgent, {
            action: "customer_reassigned",
            targetType: "customer",
            targetId: id,
            targetLabel: cust.name,
            oldValue: oldAg?.name ?? "—",
            newValue: newAg?.name ?? "—",
            details: `Reassign dari ${oldAg?.name ?? "—"} ke ${newAg?.name ?? "—"}`,
          });
        }
        const next = p.map((c) =>
          c.id === id ? { ...c, assignedAgentId: agentId, primaryAgentId: agentId } : c,
        );
        const updated = next.find((c) => c.id === id);
        if (updated) db.persistCustomer(updated);
        return next;
      });
    },
    [agents, currentAgent, logAuditRaw],
  );

  const patchCustomer = useCallback((id: string, fn: (c: Customer) => Customer) => {
    setCustomers((p) => {
      const next = p.map((c) => (c.id === id ? fn(c) : c));
      const updated = next.find((c) => c.id === id);
      if (updated) db.persistCustomer(updated);
      return next;
    });
  }, []);

  const addConversationTag = useCallback(
    (id: string, tag: string) => {
      patchCustomer(id, (c) =>
        c.conversationTags.includes(tag)
          ? c
          : { ...c, conversationTags: [...c.conversationTags, tag] },
      );
    },
    [patchCustomer],
  );
  const removeConversationTag = useCallback(
    (id: string, tag: string) => {
      patchCustomer(id, (c) => ({
        ...c,
        conversationTags: c.conversationTags.filter((t) => t !== tag),
      }));
    },
    [patchCustomer],
  );
  const addCustomerTag = useCallback(
    (id: string, tag: string) => {
      patchCustomer(id, (c) => (c.tags.includes(tag) ? c : { ...c, tags: [...c.tags, tag] }));
    },
    [patchCustomer],
  );
  const removeCustomerTag = useCallback(
    (id: string, tag: string) => {
      patchCustomer(id, (c) => ({ ...c, tags: c.tags.filter((t) => t !== tag) }));
    },
    [patchCustomer],
  );

  const saveNotes = useCallback(
    (id: string, notes: string) => {
      patchCustomer(id, (c) => ({ ...c, notes }));
    },
    [patchCustomer],
  );

  const setCadenceOverride = useCallback(
    (id: string, days: number | null) => {
      patchCustomer(id, (c) => ({
        ...c,
        cadenceOverrideDays: days ?? undefined,
      }));
    },
    [patchCustomer],
  );

  const addTemplate = useCallback((text: string) => {
    setTemplates((p) => {
      if (p.length >= 20) return p;
      const t = { id: genId("t"), text };
      db.persistTemplate(t);
      return [...p, t];
    });
  }, []);
  const updateTemplate = useCallback((id: string, text: string) => {
    setTemplates((p) => {
      const next = p.map((t) => (t.id === id ? { ...t, text } : t));
      const updated = next.find((t) => t.id === id);
      if (updated) db.persistTemplate(updated);
      return next;
    });
  }, []);
  const deleteTemplate = useCallback((id: string) => {
    setTemplates((p) => p.filter((t) => t.id !== id));
    db.persistTemplateDelete(id);
  }, []);

  const addService = useCallback((s: Omit<Service, "id">) => {
    const svc = { ...s, id: genId("svc") };
    db.persistService(svc);
    setServices((p) => [...p, svc]);
  }, []);
  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((p) => {
      const next = p.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const updated = next.find((s) => s.id === id);
      if (updated) db.persistService(updated);
      return next;
    });
  }, []);
  const deleteService = useCallback((id: string) => {
    setServices((p) => p.filter((s) => s.id !== id));
    db.persistServiceDelete(id);
  }, []);

  const addTag = useCallback((t: Omit<Tag, "id">) => {
    const tag = { ...t, id: genId("tag") };
    db.persistTag(tag);
    setTags((p) => [...p, tag]);
  }, []);
  const deleteTag = useCallback((id: string) => {
    setTags((p) => p.filter((t) => t.id !== id));
    db.persistTagDelete(id);
  }, []);

  const toggleAgentOnline = useCallback((id: string) => {
    setAgents((p) => {
      const next = p.map((a) => (a.id === id ? { ...a, isOnline: !a.isOnline } : a));
      const updated = next.find((a) => a.id === id);
      if (updated) db.persistAgent(updated);
      return next;
    });
  }, []);
  const updateAgent = useCallback((id: string, patch: Partial<Agent>) => {
    setAgents((p) => {
      const next = p.map((a) =>
        a.id === id
          ? {
              ...a,
              ...patch,
              initials: patch.name
                ? patch.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : a.initials,
            }
          : a,
      );
      const updated = next.find((a) => a.id === id);
      if (updated) db.persistAgent(updated);
      return next;
    });
  }, []);
  const addAgent = useCallback(
    (a: Omit<Agent, "id" | "initials">) => {
      const initials = a.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const newAg = { ...a, id: genId("ag"), initials };
      db.persistAgent(newAg);
      setAgents((p) => [...p, newAg]);
      logAuditRaw(currentAgent, {
        action: "agent_created",
        targetType: "agent",
        targetId: newAg.id,
        targetLabel: newAg.name,
        details: `Agent baru ditambahkan dengan role ${newAg.role}`,
      });
    },
    [currentAgent, logAuditRaw],
  );

  const registerInvitedAgent = useCallback(
    (agent: Agent) => {
      db.persistAgent(agent);
      setAgents((p) => [...p, agent]);
      logAuditRaw(currentAgent, {
        action: "agent_created",
        targetType: "agent",
        targetId: agent.id,
        targetLabel: agent.name,
        details: `Undangan dikirim ke ${agent.email} (${agent.role})`,
      });
    },
    [currentAgent, logAuditRaw],
  );

  const changeAgentRole = useCallback(
    (id: string, newRole: Role) => {
      setAgents((prev) => {
        const ag = prev.find((a) => a.id === id);
        if (ag && ag.role !== newRole) {
          logAuditRaw(currentAgent, {
            action: "agent_role_changed",
            targetType: "agent",
            targetId: id,
            targetLabel: ag.name,
            oldValue: ag.role,
            newValue: newRole,
            details: `Role ${ag.name} diubah: ${ag.role} → ${newRole}`,
          });
        }
        const next = prev.map((a) => (a.id === id ? { ...a, role: newRole } : a));
        const updated = next.find((a) => a.id === id);
        if (updated) db.persistAgent(updated);
        return next;
      });
    },
    [currentAgent, logAuditRaw],
  );

  const deleteAgent = useCallback(
    (id: string) => {
      setAgents((prev) => {
        const ag = prev.find((a) => a.id === id);
        if (ag) {
          logAuditRaw(currentAgent, {
            action: "agent_deleted",
            targetType: "agent",
            targetId: id,
            targetLabel: ag.name,
            details: `Agent ${ag.name} dihapus`,
          });
        }
        db.persistAgentDelete(id);
        return prev.filter((a) => a.id !== id);
      });
    },
    [currentAgent, logAuditRaw],
  );

  const setAgentPermissionOverrides = useCallback(
    (id: string, overrides: Partial<import("@/types").PermissionFlags>, summary?: string) => {
      setAgents((prev) => {
        const ag = prev.find((a) => a.id === id);
        if (!ag) return prev;
        const before = ag.permissionOverrides ?? {};
        const next = prev.map((a) => (a.id === id ? { ...a, permissionOverrides: overrides } : a));
        logAuditRaw(currentAgent, {
          action: "permission_override_changed",
          targetType: "agent",
          targetId: id,
          targetLabel: ag.name,
          oldValue: JSON.stringify(before),
          newValue: JSON.stringify(overrides),
          details: summary ?? `Izin ${ag.name} diperbarui`,
        });
        const updated = next.find((a) => a.id === id);
        if (updated) db.persistAgent(updated);
        return next;
      });
    },
    [currentAgent, logAuditRaw],
  );

  const resetAgentPermissionOverrides = useCallback(
    (id: string) => {
      setAgents((prev) => {
        const ag = prev.find((a) => a.id === id);
        if (!ag) return prev;
        const before = ag.permissionOverrides ?? {};
        const next = prev.map((a) => (a.id === id ? { ...a, permissionOverrides: undefined } : a));
        logAuditRaw(currentAgent, {
          action: "permission_overrides_reset",
          targetType: "agent",
          targetId: id,
          targetLabel: ag.name,
          oldValue: JSON.stringify(before),
          newValue: "{}",
          details: `Semua izin ${ag.name} dikembalikan ke default role`,
        });
        const updated = next.find((a) => a.id === id);
        if (updated) db.persistAgent(updated);
        return next;
      });
    },
    [currentAgent, logAuditRaw],
  );

  // Manual Shares
  const createManualShare = useCallback(
    (input: Omit<ManualShare, "id" | "createdAt" | "sharedByAgentId">) => {
      if (!currentAgent) return;
      const share: ManualShare = {
        ...input,
        id: genId("ms"),
        createdAt: new Date().toISOString(),
        sharedByAgentId: currentAgent.id,
      };
      setCustomers((p) => {
        const next = p.map((c) =>
          c.id === input.customerId
            ? { ...c, manualShares: [...(c.manualShares ?? []), share] }
            : c,
        );
        const updated = next.find((c) => c.id === input.customerId);
        if (updated) db.persistCustomer(updated);
        return next;
      });
      const target = customers.find((c) => c.id === input.customerId);
      const sharedWith = agents.find((a) => a.id === input.sharedWithAgentId);
      logAuditRaw(currentAgent, {
        action: "manual_share_created",
        targetType: "customer",
        targetId: input.customerId,
        targetLabel: target?.name ?? input.customerId,
        newValue: `${sharedWith?.name ?? "—"} (${input.permission})`,
        details: input.reason,
      });
    },
    [currentAgent, customers, agents, logAuditRaw],
  );

  const revokeManualShare = useCallback(
    (customerId: string, shareId: string) => {
      setCustomers((p) => {
        const next = p.map((c) => {
          if (c.id !== customerId) return c;
          const share = c.manualShares?.find((s) => s.id === shareId);
          const sharedWith = agents.find((a) => a.id === share?.sharedWithAgentId);
          if (share) {
            logAuditRaw(currentAgent, {
              action: "manual_share_revoked",
              targetType: "customer",
              targetId: customerId,
              targetLabel: c.name,
              oldValue: `${sharedWith?.name ?? "—"} (${share.permission})`,
              details: "Akses dicabut",
            });
          }
          return { ...c, manualShares: (c.manualShares ?? []).filter((s) => s.id !== shareId) };
        });
        const updated = next.find((c) => c.id === customerId);
        if (updated) db.persistCustomer(updated);
        return next;
      });
    },
    [agents, currentAgent, logAuditRaw],
  );

  // Export
  const createExportRequest = useCallback(
    (dataType: ExportRequest["dataType"], reason: string) => {
      if (!currentAgent) return;
      const req: ExportRequest = {
        id: genId("exp"),
        requestedByAgentId: currentAgent.id,
        requestedByName: currentAgent.name,
        requestedAt: new Date().toISOString(),
        dataType,
        reason,
        status: "pending",
      };
      setExportRequests((p) => {
        const next = [req, ...p];
        db.persistExportRequest(req);
        return next;
      });
      logAuditRaw(currentAgent, {
        action: "export_requested",
        targetType: "system",
        targetId: req.id,
        targetLabel: `Export ${dataType}`,
        details: reason,
      });
    },
    [currentAgent, logAuditRaw],
  );

  const approveExportRequest = useCallback(
    (id: string, note?: string) => {
      if (!currentAgent) return;
      setExportRequests((p) => {
        const next = p.map((r) => {
          if (r.id !== id) return r;
          logAuditRaw(currentAgent, {
            action: "export_approved",
            targetType: "system",
            targetId: id,
            targetLabel: `Export ${r.dataType}`,
            details: note ?? "Disetujui Owner",
          });
          const updated = {
            ...r,
            status: "approved" as const,
            reviewedByAgentId: currentAgent.id,
            reviewedByName: currentAgent.name,
            reviewedAt: new Date().toISOString(),
            reviewNote: note,
          };
          db.persistExportRequest(updated);
          return updated;
        });
        return next;
      });
    },
    [currentAgent, logAuditRaw],
  );

  const denyExportRequest = useCallback(
    (id: string, note: string) => {
      if (!currentAgent) return;
      setExportRequests((p) => {
        const next = p.map((r) => {
          if (r.id !== id) return r;
          logAuditRaw(currentAgent, {
            action: "export_denied",
            targetType: "system",
            targetId: id,
            targetLabel: `Export ${r.dataType}`,
            details: note,
          });
          const updated = {
            ...r,
            status: "denied" as const,
            reviewedByAgentId: currentAgent.id,
            reviewedByName: currentAgent.name,
            reviewedAt: new Date().toISOString(),
            reviewNote: note,
          };
          db.persistExportRequest(updated);
          return updated;
        });
        return next;
      });
    },
    [currentAgent, logAuditRaw],
  );

  const exportDataDirect = useCallback(
    (dataType: ExportRequest["dataType"]) => {
      logAuditRaw(currentAgent, {
        action: "data_exported",
        targetType: "system",
        targetId: "direct-" + Date.now(),
        targetLabel: `Export ${dataType}`,
        details: "File CSV diunduh (akses langsung Owner)",
      });
    },
    [currentAgent, logAuditRaw],
  );

  // Field rules
  const addFieldRule = useCallback(
    (rule: Omit<FieldVisibilityRule, "id">) => {
      const full = { ...rule, id: genId("fvr") };
      db.persistFieldRule(full);
      setFieldRules((p) => [...p, full]);
      logAuditRaw(currentAgent, {
        action: "settings_changed",
        targetType: "system",
        targetId: "field-visibility",
        targetLabel: "Visibilitas Field",
        details: `Aturan baru: field ${rule.fieldName} disembunyikan dari ${rule.hiddenForRoles.join(", ")}`,
      });
    },
    [currentAgent, logAuditRaw],
  );

  const deleteFieldRule = useCallback((id: string) => {
    setFieldRules((p) => {
      const rule = p.find((r) => r.id === id);
      if (!rule || rule.locked) return p;
      db.persistFieldRuleDelete(id);
      return p.filter((r) => r.id !== id);
    });
  }, []);

  const value: StoreState = {
    isLoading,
    usesSupabase: USE_SUPABASE,
    agents,
    currentAgentId,
    currentAgent,
    customers,
    messages,
    services,
    templates,
    tags,
    auditLog,
    exportRequests,
    fieldRules,
    login,
    logout,
    setAgentSession,
    clearAgentSession,
    logAuthLogin,
    sendMessage,
    markRead,
    updateCustomer,
    addCustomer,
    bulkAddCustomers,
    setConversationStatus,
    setOrderStatus,
    setPriority,
    assignCustomer,
    addConversationTag,
    removeConversationTag,
    addCustomerTag,
    removeCustomerTag,
    saveNotes,
    setCadenceOverride,
    logAudit,
    createManualShare,
    revokeManualShare,
    createExportRequest,
    approveExportRequest,
    denyExportRequest,
    exportDataDirect,
    addFieldRule,
    deleteFieldRule,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addService,
    updateService,
    deleteService,
    addTag,
    deleteTag,
    toggleAgentOnline,
    updateAgent,
    addAgent,
    registerInvitedAgent,
    changeAgentRole,
    deleteAgent,
    setAgentPermissionOverrides,
    resetAgentPermissionOverrides,
    businessProfile,
    setBusinessProfile,
    addPurchase,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    addBranch,
    updateBranch,
    toggleBranchActive,
    setAgentBranch,
    setAgentBranches,
    addCollaborator,
    removeCollaborator,
    googleContacts,
    setGoogleContactsAutoSync,
    markCustomerGoogleSynced,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
