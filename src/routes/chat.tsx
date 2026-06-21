import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ChatPage } from "@/components/chat/ChatPage";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat Inbox — ChatCRM" }] }),
  component: () => (
    <AppShell noPadding>
      <ChatPage />
    </AppShell>
  ),
});
