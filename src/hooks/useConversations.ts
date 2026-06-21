import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { canAccessCustomer } from "@/lib/permissions";
import type { Customer, Message } from "@/types";

export interface ConversationView {
  customer: Customer;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

export function useConversations() {
  const store = useStore();
  const agent = store.currentAgent;
  const conversations = useMemo<ConversationView[]>(() => {
    return store.customers
      .filter((c) => canAccessCustomer(agent, c))
      .map((c) => {
        const msgs = store.messages
          .filter((m) => m.customerId === c.id)
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const last = msgs[msgs.length - 1];
        const unreadCount = msgs.filter(
          (m) => m.senderId === c.id && m.type === "text" && m.readStatus !== "read",
        ).length;
        return { customer: c, messages: msgs, lastMessage: last, unreadCount };
      });
  }, [store.customers, store.messages, agent]);

  return { conversations, ...store };
}
