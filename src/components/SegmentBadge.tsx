import { SEGMENT_META } from "@/lib/rfm";
import { SegmentIcon } from "@/components/SegmentIcon";
import type { RFMSegment } from "@/types";
import { cn } from "@/lib/utils";

export function SegmentBadge({
  segment,
  size = "sm",
  className,
}: {
  segment: RFMSegment;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = SEGMENT_META[segment];
  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: meta.color + "1A", color: meta.color }}
    >
      <SegmentIcon segment={segment} size={size === "lg" ? "md" : "sm"} />
      <span>{meta.label}</span>
    </span>
  );
}