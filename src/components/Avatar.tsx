import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface Props {
  name: string;
  color?: string;
  initials?: string;
  size?: number;
  ringColor?: string;
  className?: string;
  online?: boolean;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({
  name,
  color = "#64748B",
  initials,
  size = 40,
  ringColor,
  className,
  online,
}: Props) {
  const label = initials ?? initialsOf(name);
  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
        style={{
          backgroundColor: color,
          boxShadow: ringColor ? `0 0 0 2px white, 0 0 0 4px ${ringColor}` : undefined,
          fontSize: size * 0.38,
        }}
      >
        {label}
      </div>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
            online ? "bg-emerald-500" : "bg-slate-400",
          )}
        />
      )}
    </div>
  );
}

export function AgentAvatar({
  agent,
  size = 32,
  online,
}: {
  agent: Agent;
  size?: number;
  online?: boolean;
}) {
  return (
    <Avatar
      name={agent.name}
      initials={agent.initials}
      color={agent.color}
      size={size}
      online={online ?? agent.isOnline}
    />
  );
}
