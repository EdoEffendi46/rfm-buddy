import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteAgentServerFn } from "@/lib/invite-agent.fn";
import { inviteAgentFormSchema, type InviteAgentFormInput } from "@/lib/schemas/invite";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Agent, Role } from "@/types";

const AVATAR_COLORS = ["#0EA5E9", "#8B5CF6", "#EC4899", "#F59E0B", "#22C55E", "#EF4444"];

export function InviteAgentForm({
  onInvited,
}: {
  onInvited: (agent: Agent) => void;
}) {
  const form = useForm<InviteAgentFormInput>({
    resolver: zodResolver(inviteAgentFormSchema),
    defaultValues: { name: "", email: "", role: "cs", color: "#0EA5E9" },
    mode: "onChange",
  });

  const color = form.watch("color");
  const inviting = form.formState.isSubmitting;

  const onSubmit = async (values: InviteAgentFormInput) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      toast.error("Supabase belum dikonfigurasi");
      return;
    }
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      toast.error("Sesi habis — silakan login ulang");
      return;
    }

    try {
      const result = await inviteAgentServerFn({
        data: {
          ...values,
          accessToken: sessionData.session.access_token,
          appOrigin: window.location.origin,
        },
      });
      onInvited({
        id: result.agentId,
        name: result.name,
        role: result.role as Role,
        initials: result.name
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: values.color,
        isOnline: false,
        email: result.email,
        invitationStatus: "pending",
      });
      toast.success(`Undangan dikirim ke ${result.email}`);
      form.reset({ name: "", email: "", role: "cs", color: "#0EA5E9" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim undangan");
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-[#25D366]/20 bg-[#25D366]/5 p-3">
      <div className="mb-1 text-sm font-semibold text-slate-900">+ Undang anggota tim</div>
      <p className="mb-3 text-xs text-slate-500">
        Kirim email undangan. Penerima mengatur password lewat link di inbox.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-start gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-40">
                <FormControl>
                  <Input placeholder="Nama lengkap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-52">
                <FormControl>
                  <Input type="email" placeholder="email@perusahaan.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="w-32">
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cs">CS</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-1">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => field.onChange(c)}
                      className={cn(
                        "h-7 w-7 rounded-full border-2",
                        color === c ? "border-slate-700" : "border-transparent",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={inviting || !form.formState.isValid}
            className="bg-[#25D366] text-white hover:bg-[#128C7E]"
          >
            <Plus className="h-4 w-4" /> {inviting ? "Mengirim…" : "Kirim undangan"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
