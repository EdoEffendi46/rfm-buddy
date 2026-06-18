import { useMemo } from "react";
import { useStore } from "@/lib/store";
import type { Customer, Message } from "@/types";

export interface ConversationView {
  customer: Customer;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
}

export function useConversations() {
  const store = useStore();
  const conversations = useMemo<ConversationView[]>(() => {
    return store.customers.map((c) => {
      const msgs = store.messages
        .filter((m) => m.customerId === c.id)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const last = msgs[msgs.length - 1];
      const unreadCount = msgs.filter(
        (m) => m.senderId === c.id && m.type === "text" && m.readStatus !== "read",
      ).length;
      return { customer: c, messages: msgs, lastMessage: last, unreadCount };
    });
  }, [store.customers, store.messages]);

  return { conversations, ...store };
}