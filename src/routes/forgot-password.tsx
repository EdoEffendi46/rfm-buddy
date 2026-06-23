import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authErrorMessage, useAuthContext } from "@/lib/auth/AuthProvider";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/schemas/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Lupa Password — ChatCRM" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setSubmitting(true);
    try {
      await resetPassword(values.email);
      setSent(true);
      toast.success("Link reset password telah dikirim.");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Cek email Anda"
        subtitle="Kami mengirim link reset password jika email terdaftar."
      >
        <div className="rounded-2xl border border-[#16A34A]/20 bg-[#16A34A]/5 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-[#16A34A]" />
          <p className="mt-3 text-sm text-slate-600">
            Buka email <strong>{form.getValues("email")}</strong> dan ikuti instruksi reset
            password. Link berlaku 1 jam.
          </p>
        </div>
        <Link to="/" className="mt-6 inline-flex items-center text-sm font-medium text-[#15803D]">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Kembali ke login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Lupa password?"
      subtitle="Masukkan email terdaftar. Kami kirim link reset ke inbox Anda."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full bg-[#16A34A] text-base font-semibold text-white hover:bg-[#15803D]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim…
              </>
            ) : (
              "Kirim link reset"
            )}
          </Button>
        </form>
      </Form>

      <Link
        to="/"
        className="mt-6 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Kembali ke login
      </Link>
    </AuthLayout>
  );
}
