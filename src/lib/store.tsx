import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
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
} from "@/types";
import { AGENTS } from "@/data/agents";
import { CUSTOMERS } from "@/data/customers";
import { INITIAL_MESSAGES } from "@/data/conversations";
import { DEFAULT_TAGS, DEFAULT_TEMPLATES, SERVICES } from "@/data/services";
import { INITIAL_AUDIT_LOG } from "@/data/auditLog";
import { INITIAL_EXPORT_REQUESTS } from "@/data/exportRequests";
import { DEFAULT_FIELD_RULES } from "@/lib/fieldVisibility";

interface StoreState {
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

  login: (agentId: string) => void;
  logout: () => void;

  sendMessage: (customerId: string, content: string, type?: "text" | "internal_note") => void;
  markRead: (customerId: string) => void;

  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomer: (c: Omit<Customer, "id" | "purchases" | "segmentHistory" | "conversationTags">) => Customer;

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

  // Audit
  logAudit: (entry: Omit<AuditLogEntry, "id" | "timestamp" | "actorId" | "actorName" | "actorRole">) => void;

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
  changeAgentRole: (id: string, newRole: Role) => void;
  deleteAgent: (id: string) => void;
}

const StoreContext = createContext<StoreState | null>(null);

function genId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [tags, setTags] = useState<Tag[]>(DEFAULT_TAGS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>(INITIAL_EXPORT_REQUESTS);
  const [fieldRules, setFieldRules] = useState<FieldVisibilityRule[]>(DEFAULT_FIELD_RULES);

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === currentAgentId) ?? null,
    [agents, currentAgentId],
  );

  const logAuditRaw = useCallback((actor: Agent | null, entry: Omit<AuditLogEntry, "id" | "timestamp" | "actorId" | "actorName" | "actorRole">) => {
    setAuditLog((prev) => [
      {
        ...entry,
        id: genId("al"),
        timestamp: new Date().toISOString(),
        actorId: actor?.id ?? "system",
        actorName: actor?.name ?? "Sistem",
        actorRole: actor?.role ?? "cs",
      },
      ...prev,
    ]);
  }, []);

  const logAudit = useCallback(
    (entry: Omit<AuditLogEntry, "id" | "timestamp" | "actorId" | "actorName" | "actorRole">) => {
      logAuditRaw(currentAgent, entry);
    },
    [currentAgent, logAuditRaw],
  );

  const login = useCallback((agentId: string) => {
    setCurrentAgentId(agentId);
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
  }, [agents, logAuditRaw]);
  const logout = useCallback(() => setCurrentAgentId(null), []);

  const sendMessage = useCallback(
    (customerId: string, content: string, type: "text" | "internal_note" = "text") => {
      setMessages((prev) => {
        const agentId = currentAgentId ?? "rina";
        const agent = agents.find((a) => a.id === agentId);
        return [
          ...prev,
          {
            id: genId("m"),
            customerId,
            senderId: agentId,
            senderName: agent?.name ?? "Agent",
            content,
            timestamp: new Date().toISOString(),
            readStatus: "sent",
            type,
          },
        ];
      });
    },
    [agents, currentAgentId],
  );

  const markRead = useCallback((customerId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.customerId === customerId && m.senderId === customerId
          ? { ...m, readStatus: "read" }
          : m,
      ),
    );
  }, []);

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const addCustomer = useCallback(
    (c: Omit<Customer, "id" | "purchases" | "segmentHistory" | "conversationTags">) => {
      const newC: Customer = {
        ...c,
        id: genId("c"),
        purchases: [],
        segmentHistory: [
          { date: new Date().toISOString(), fromSegment: null, toSegment: "new", reason: "Customer baru ditambahkan" },
        ],
        conversationTags: [],
      };
      setCustomers((p) => [newC, ...p]);
      return newC;
    },
    [],
  );

  const setConversationStatus = useCallback(
    (id: string, status: ConversationStatus, snoozeUntil?: string) => {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, conversationStatus: status, snoozeUntil: status === "snoozed" ? snoozeUntil : undefined }
            : c,
        ),
      );
    },
    [],
  );
  const setOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setCustomers((p) => p.map((c) => (c.id === id ? { ...c, orderStatus: status } : c)));
  }, []);
  const setPriority = useCallback((id: string, pr: Priority) => {
    setCustomers((p) => p.map((c) => (c.id === id ? { ...c, priority: pr } : c)));
  }, []);
  const assignCustomer = useCallback((id: string, agentId: string) => {
    setCustomers((p) => {
      const cust = p.find((c) => c.id === id);
      const oldAg = agents.find((a) => a.id === cust?.assignedAgentId);
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
      return p.map((c) => (c.id === id ? { ...c, assignedAgentId: agentId } : c));
    });
  }, [agents, currentAgent, logAuditRaw]);

  const addConversationTag = useCallback((id: string, tag: string) => {
    setCustomers((p) =>
      p.map((c) =>
        c.id === id && !c.conversationTags.includes(tag)
          ? { ...c, conversationTags: [...c.conversationTags, tag] }
          : c,
      ),
    );
  }, []);
  const removeConversationTag = useCallback((id: string, tag: string) => {
    setCustomers((p) =>
      p.map((c) =>
        c.id === id ? { ...c, conversationTags: c.conversationTags.filter((t) => t !== tag) } : c,
      ),
    );
  }, []);
  const addCustomerTag = useCallback((id: string, tag: string) => {
    setCustomers((p) =>
      p.map((c) => (c.id === id && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c)),
    );
  }, []);
  const removeCustomerTag = useCallback((id: string, tag: string) => {
    setCustomers((p) =>
      p.map((c) => (c.id === id ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c)),
    );
  }, []);

  const saveNotes = useCallback((id: string, notes: string) => {
    setCustomers((p) => p.map((c) => (c.id === id ? { ...c, notes } : c)));
  }, []);

  const setCadenceOverride = useCallback((id: string, days: number | null) => {
    setCustomers((p) =>
      p.map((c) =>
        c.id === id ? { ...c, cadenceOverrideDays: days ?? undefined } : c,
      ),
    );
  }, []);

  const addTemplate = useCallback((text: string) => {
    setTemplates((p) => (p.length >= 20 ? p : [...p, { id: genId("t"), text }]));
  }, []);
  const updateTemplate = useCallback((id: string, text: string) => {
    setTemplates((p) => p.map((t) => (t.id === id ? { ...t, text } : t)));
  }, []);
  const deleteTemplate = useCallback((id: string) => {
    setTemplates((p) => p.filter((t) => t.id !== id));
  }, []);

  const addService = useCallback((s: Omit<Service, "id">) => {
    setServices((p) => [...p, { ...s, id: genId("svc") }]);
  }, []);
  const updateService = useCallback((id: string, patch: Partial<Service>) => {
    setServices((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);
  const deleteService = useCallback((id: string) => {
    setServices((p) => p.filter((s) => s.id !== id));
  }, []);

  const addTag = useCallback((t: Omit<Tag, "id">) => {
    setTags((p) => [...p, { ...t, id: genId("tag") }]);
  }, []);
  const deleteTag = useCallback((id: string) => {
    setTags((p) => p.filter((t) => t.id !== id));
  }, []);

  const toggleAgentOnline = useCallback((id: string) => {
    setAgents((p) => p.map((a) => (a.id === id ? { ...a, isOnline: !a.isOnline } : a)));
  }, []);
  const updateAgent = useCallback((id: string, patch: Partial<Agent>) => {
    setAgents((p) =>
      p.map((a) =>
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
      ),
    );
  }, []);
  const addAgent = useCallback((a: Omit<Agent, "id" | "initials">) => {
    const initials = a.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const newAg = { ...a, id: genId("ag"), initials };
    setAgents((p) => [...p, newAg]);
    logAuditRaw(currentAgent, {
      action: "agent_created",
      targetType: "agent",
      targetId: newAg.id,
      targetLabel: newAg.name,
      details: `Agent baru ditambahkan dengan role ${newAg.role}`,
    });
  }, [currentAgent, logAuditRaw]);

  const changeAgentRole = useCallback((id: string, newRole: Role) => {
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
      return prev.map((a) => (a.id === id ? { ...a, role: newRole } : a));
    });
  }, [currentAgent, logAuditRaw]);

  const deleteAgent = useCallback((id: string) => {
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
      return prev.filter((a) => a.id !== id);
    });
  }, [currentAgent, logAuditRaw]);

  // Manual Shares
  const createManualShare = useCallback((input: Omit<ManualShare, "id" | "createdAt" | "sharedByAgentId">) => {
    if (!currentAgent) return;
    const share: ManualShare = {
      ...input,
      id: genId("ms"),
      createdAt: new Date().toISOString(),
      sharedByAgentId: currentAgent.id,
    };
    setCustomers((p) =>
      p.map((c) =>
        c.id === input.customerId
          ? { ...c, manualShares: [...(c.manualShares ?? []), share] }
          : c,
      ),
    );
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
  }, [currentAgent, customers, agents, logAuditRaw]);

  const revokeManualShare = useCallback((customerId: string, shareId: string) => {
    setCustomers((p) =>
      p.map((c) => {
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
      }),
    );
  }, [agents, currentAgent, logAuditRaw]);

  // Export
  const createExportRequest = useCallback((dataType: ExportRequest["dataType"], reason: string) => {
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
    setExportRequests((p) => [req, ...p]);
    logAuditRaw(currentAgent, {
      action: "export_requested",
      targetType: "system",
      targetId: req.id,
      targetLabel: `Export ${dataType}`,
      details: reason,
    });
  }, [currentAgent, logAuditRaw]);

  const approveExportRequest = useCallback((id: string, note?: string) => {
    if (!currentAgent) return;
    setExportRequests((p) =>
      p.map((r) => {
        if (r.id !== id) return r;
        logAuditRaw(currentAgent, {
          action: "export_approved",
          targetType: "system",
          targetId: id,
          targetLabel: `Export ${r.dataType}`,
          details: note ?? "Disetujui Owner",
        });
        return { ...r, status: "approved", reviewedByAgentId: currentAgent.id, reviewedByName: currentAgent.name, reviewedAt: new Date().toISOString(), reviewNote: note };
      }),
    );
  }, [currentAgent, logAuditRaw]);

  const denyExportRequest = useCallback((id: string, note: string) => {
    if (!currentAgent) return;
    setExportRequests((p) =>
      p.map((r) => {
        if (r.id !== id) return r;
        logAuditRaw(currentAgent, {
          action: "export_denied",
          targetType: "system",
          targetId: id,
          targetLabel: `Export ${r.dataType}`,
          details: note,
        });
        return { ...r, status: "denied", reviewedByAgentId: currentAgent.id, reviewedByName: currentAgent.name, reviewedAt: new Date().toISOString(), reviewNote: note };
      }),
    );
  }, [currentAgent, logAuditRaw]);

  const exportDataDirect = useCallback((dataType: ExportRequest["dataType"]) => {
    logAuditRaw(currentAgent, {
      action: "data_exported",
      targetType: "system",
      targetId: "direct-" + Date.now(),
      targetLabel: `Export ${dataType}`,
      details: "File CSV diunduh (akses langsung Owner)",
    });
  }, [currentAgent, logAuditRaw]);

  // Field rules
  const addFieldRule = useCallback((rule: Omit<FieldVisibilityRule, "id">) => {
    setFieldRules((p) => [...p, { ...rule, id: genId("fvr") }]);
    logAuditRaw(currentAgent, {
      action: "settings_changed",
      targetType: "system",
      targetId: "field-visibility",
      targetLabel: "Visibilitas Field",
      details: `Aturan baru: field ${rule.fieldName} disembunyikan dari ${rule.hiddenForRoles.join(", ")}`,
    });
  }, [currentAgent, logAuditRaw]);

  const deleteFieldRule = useCallback((id: string) => {
    setFieldRules((p) => p.filter((r) => r.id !== id || r.locked));
  }, []);

  const value: StoreState = {
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
    sendMessage,
    markRead,
    updateCustomer,
    addCustomer,
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
    changeAgentRole,
    deleteAgent,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}