import { createFileRoute, redirect } from "@tanstack/react-router";

/** MVP1: no public registration — redirect to login */
export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
