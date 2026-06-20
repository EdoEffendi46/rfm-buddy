import { SEGMENT_META } from "@/lib/rfm";
import { SEGMENT_ICONS } from "@/lib/segment-icons";
import type { RFMSegment } from "@/types";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
} as const;

export function SegmentIcon({
  segment,
  size = "sm",
  className,
}: {
  segment: RFMSegment;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
}) {
  const Icon = SEGMENT_ICONS[segment];
  return (
    <Icon
      className={cn("shrink-0", SIZE_CLASS[size], className)}
      style={{ color: SEGMENT_META[segment].color }}
      aria-hidden
    />
  );
}
