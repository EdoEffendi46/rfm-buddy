import type { Message } from "@/types";

export type Sentiment = "positive" | "neutral" | "negative" | "urgent";

export interface SentimentResult {
  sentiment: Sentiment;
  score: number; // -1..1
  matchedKeywords: string[];
  urgent: boolean;
}

// Indonesian keyword dictionaries (lowercase). Deterministic — no external API.
const POSITIVE = [
  "terima kasih",
  "makasih",
  "thanks",
  "bagus",
  "mantap",
  "puas",
  "keren",
  "top",
  "recommended",
  "hebat",
  "cepat sekali",
  "ramah",
  "membantu",
  "suka",
  "oke sip",
  "sip",
  "ok banget",
];

const NEGATIVE = [
  "kecewa",
  "lambat",
  "lama sekali",
  "buruk",
  "jelek",
  "rusak",
  "salah",
  "keluhan",
  "komplain",
  "kotor",
  "hilang",
  "belum datang",
  "belum sampai",
  "tidak sesuai",
  "gak sesuai",
  "ga sesuai",
  "mahal",
  "parah",
];

const URGENT = [
  "urgent",
  "penting",
  "cepat",
  "segera",
  "sekarang",
  "asap",
  "buru buru",
  "buru-buru",
  "hari ini",
  "malam ini",
  "besok pagi",
];

function countMatches(text: string, dict: string[]) {
  const matches: string[] = [];
  for (const kw of dict) {
    if (text.includes(kw)) matches.push(kw);
  }
  return matches;
}

/** Analyze last N customer messages. Weighted so recent messages count more. */
export function analyzeSentiment(messages: Message[], customerId: string): SentimentResult {
  const recent = messages
    .filter((m) => m.senderId === customerId)
    .slice(-5);
  if (recent.length === 0) {
    return { sentiment: "neutral", score: 0, matchedKeywords: [], urgent: false };
  }
  let pos = 0;
  let neg = 0;
  const matched: string[] = [];
  let urgent = false;
  recent.forEach((m, i) => {
    const weight = (i + 1) / recent.length; // newer = more weight
    const text = m.content.toLowerCase();
    const p = countMatches(text, POSITIVE);
    const n = countMatches(text, NEGATIVE);
    const u = countMatches(text, URGENT);
    if (u.length > 0) urgent = true;
    pos += p.length * weight;
    neg += n.length * weight;
    matched.push(...p, ...n, ...u);
  });
  const raw = pos - neg;
  const total = pos + neg;
  const score = total === 0 ? 0 : Math.max(-1, Math.min(1, raw / (total + 1)));
  let sentiment: Sentiment = "neutral";
  if (urgent && neg >= pos) sentiment = "urgent";
  else if (score > 0.15) sentiment = "positive";
  else if (score < -0.15) sentiment = "negative";
  return { sentiment, score, matchedKeywords: Array.from(new Set(matched)), urgent };
}

export const SENTIMENT_META: Record<
  Sentiment,
  { label: string; icon: string; color: string; bg: string }
> = {
  positive: { label: "Positif", icon: "😊", color: "text-emerald-700", bg: "bg-emerald-50" },
  neutral: { label: "Netral", icon: "😐", color: "text-slate-600", bg: "bg-slate-50" },
  negative: { label: "Negatif", icon: "😟", color: "text-red-700", bg: "bg-red-50" },
  urgent: { label: "Mendesak", icon: "🚨", color: "text-amber-800", bg: "bg-amber-50" },
};