import { useEffect, useState } from "react";
import { Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelInviteServerFn, resendInviteServerFn } from "@/lib/invite-agent.fn";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Agent } from "@/types";

const RESEND_COOLDOWN_MS = 60_000;

function secondsUntilResend(sentAt: string | null | undefined) {
  if (!sentAt) return 0;
  const left = RESEND_COOLDOWN_MS - (Date.now() - new Date(sentAt).getTime());
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

export function PendingInviteActions({
  agent,
  onResent,
  onCancelled,
}: {
  agent: Agent;
  onResent: (agentId: string, invitationSentAt: string) => void;
  onCancelled: (agentId: string) => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntilResend(agent.invitationSentAt));
  const [busy, setBusy] = useState<"resend" | "cancel" | null>(null);

  useEffect(() => {
    setSecondsLeft(secondsUntilResend(agent.invitationSentAt));
    const id = window.setInterval(() => {
      setSecondsLeft(secondsUntilResend(agent.invitationSentAt));
    }, 1000);
    return () => window.clearInterval(id);
  }, [agent.invitationSentAt]);

  const getAccessToken = async () => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Supabase belum dikonfigurasi");
    const { data } = await client.auth.getSession();
    if (!data.session) throw new Error("Sesi habis — silakan login ulang");
    return data.session.access_token;
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setBusy("resend");
    try {
      const accessToken = await getAccessToken();
      const result = await resendInviteServerFn({
        data: {
          accessToken,
          agentId: agent.id,
          appOrigin: window.location.origin,
        },
      });
      onResent(result.agentId, result.invitationSentAt);
      toast.success(`Undangan dikirim ulang ke ${agent.email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal kirim ulang");
    } finally {
      setBusy(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Batalkan undangan untuk ${agent.name}?`)) return;
    setBusy("cancel");
    try {
      const accessToken = await getAccessToken();
      await cancelInviteServerFn({
        data: {
          accessToken,
          agentId: agent.id,
          appOrigin: window.location.origin,
        },
      });
      onCancelled(agent.id);
      toast.success("Undangan dibatalkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={secondsLeft > 0 || busy !== null}
        onClick={handleResend}
        className="h-7 gap-1 px-2 text-xs"
      >
        {busy === "resend" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RotateCcw className="h-3 w-3" />
        )}
        {secondsLeft > 0 ? `${secondsLeft}s` : "Kirim ulang"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy !== null}
        onClick={handleCancel}
        className="h-7 gap-1 px-2 text-xs text-red-600 hover:text-red-700"
      >
        {busy === "cancel" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <X className="h-3 w-3" />
        )}
        Batal
      </Button>
    </div>
  );
}
