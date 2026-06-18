import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ChatPage } from "@/components/chat/ChatPage";

export const Route = createFileRoute("/chat/$customerId")({
  head: () => ({ meta: [{ title: "Chat — ChatCRM" }] }),
  component: ChatRoute,
});

function ChatRoute() {
  const { customerId } = Route.useParams();
  return (
    <AppShell noPadding>
      <ChatPage initialCustomerId={customerId} />
    </AppShell>
  );
}