import { AlertTriangle, Crown, Flame, Moon, Sprout, UserPlus, type LucideIcon } from "lucide-react";
import type { RFMSegment } from "@/types";

/** Lucide icons for RFM segments — use via `SegmentIcon`, not emoji. */
export const SEGMENT_ICONS: Record<RFMSegment, LucideIcon> = {
  champions: Crown,
  loyal: Flame,
  promising: Sprout,
  at_risk: AlertTriangle,
  new: UserPlus,
  dormant: Moon,
};
