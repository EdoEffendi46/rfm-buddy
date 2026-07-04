import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { canViewConversation, hasPermission } from "@/lib/permissions";
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
  const branchFilter = store.selectedBranchId;
  const canFilterBranch = hasPermission(agent, "branch_view_all");
  const conversations = useMemo<ConversationView[]>(() => {
    return store.customers
      .filter((c) => canViewConversation(agent, c))
      .filter((c) =>
        canFilterBranch && branchFilter !== "all" ? c.branchId === branchFilter : true,
      )
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
  }, [store.customers, store.messages, agent, branchFilter, canFilterBranch]);

  return { conversations, ...store };
}
