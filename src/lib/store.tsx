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
} from "@/types";
import { AGENTS } from "@/data/agents";
import { CUSTOMERS } from "@/data/customers";
import { INITIAL_MESSAGES } from "@/data/conversations";
import { DEFAULT_TAGS, DEFAULT_TEMPLATES, SERVICES } from "@/data/services";

interface StoreState {
  agents: Agent[];
  currentAgentId: string | null;
  currentAgent: Agent | null;
  customers: Customer[];
  messages: Message[];
  services: Service[];
  templates: Template[];
  tags: Tag[];

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

  const currentAgent = useMemo(
    () => agents.find((a) => a.id === currentAgentId) ?? null,
    [agents, currentAgentId],
  );

  const login = useCallback((agentId: string) => setCurrentAgentId(agentId), []);
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
    setCustomers((p) => p.map((c) => (c.id === id ? { ...c, assignedAgentId: agentId } : c)));
  }, []);

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
    setAgents((p) => [...p, { ...a, id: genId("ag"), initials }]);
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}