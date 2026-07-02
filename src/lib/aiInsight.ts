import type { Customer, Message } from "@/types";
import type { CadenceResult } from "./cadence";
import { calculateRFM } from "./rfm";
import { analyzeSentiment, type SentimentResult } from "./aiSentiment";

export interface InsightResult {
  intent: string;
  narrative: string;
  suggestions: string[];
  autoTags: string[];
  sentiment: SentimentResult;
}

const INTENT_KEYWORDS: { intent: string; kws: string[] }[] = [
  { intent: "Cek Status Order", kws: ["status", "sudah selesai", "kapan siap", "udah beres", "sudah beres"] },
  { intent: "Booking / Pesan Baru", kws: ["mau pesan", "booking", "jadwal", "order", "pesan"] },
  { intent: "Komplain", kws: ["komplain", "kecewa", "rusak", "salah", "kotor", "hilang"] },
  { intent: "Tanya Harga", kws: ["harga", "berapa", "biaya", "tarif", "price"] },
  { intent: "Pengambilan / Antar", kws: ["ambil", "antar", "kirim", "jemput", "kurir"] },
];

function detectIntent(messages: Message[], customerId: string): string {
  const recent = messages.filter((m) => m.senderId === customerId).slice(-4);
  const text = recent.map((m) => m.content.toLowerCase()).join(" ");
  for (const { intent, kws } of INTENT_KEYWORDS) {
    if (kws.some((k) => text.includes(k))) return intent;
  }
  return "Percakapan Umum";
}

export function generateInsight(
  customer: Customer,
  messages: Message[],
  cadence: CadenceResult,
): InsightResult {
  const rfm = calculateRFM(customer);
  const sentiment = analyzeSentiment(messages, customer.id);
  const intent = detectIntent(messages, customer.id);

  const suggestions: string[] = [];
  const autoTags: string[] = [];

  // Sentiment-driven suggestions
  if (sentiment.sentiment === "negative") {
    suggestions.push("Tunjukkan empati dan tawarkan solusi konkret dalam balasan pertama.");
    autoTags.push("komplain");
  } else if (sentiment.sentiment === "urgent") {
    suggestions.push("Prioritaskan balasan segera — customer menunjukkan urgensi.");
    autoTags.push("urgent");
  } else if (sentiment.sentiment === "positive") {
    suggestions.push("Manfaatkan momentum positif — tawarkan repeat order atau layanan tambahan.");
  }

  // Intent-driven suggestions
  if (intent === "Cek Status Order") {
    suggestions.push("Kirim update status order + estimasi waktu selesai.");
    autoTags.push("cek-status");
  } else if (intent === "Komplain") {
    autoTags.push("komplain");
  } else if (intent === "Booking / Pesan Baru") {
    suggestions.push("Konfirmasi jenis layanan, tanggal, dan alamat pickup.");
    autoTags.push("booking");
  } else if (intent === "Tanya Harga") {
    suggestions.push("Sertakan daftar harga singkat dan tawarkan bundle.");
    autoTags.push("tanya-harga");
  }

  // RFM / cadence driven
  if (rfm.segment === "champions" || rfm.segment === "loyal") {
    suggestions.push(`Customer ${rfm.segment.toUpperCase()} — pertimbangkan perlakuan VIP / diskon loyalitas.`);
  }
  if (rfm.segment === "at_risk") {
    suggestions.push("Customer At Risk — kirim penawaran reaktivasi khusus.");
    autoTags.push("reaktivasi");
  }
  if (cadence.daysUntilPredicted !== null && cadence.daysUntilPredicted < 0) {
    suggestions.push(
      `Sudah ${Math.abs(cadence.daysUntilPredicted)} hari melewati siklus normal (~${cadence.avgDaysBetweenOrders}d) — waktunya proaktif follow up.`,
    );
  }

  // Narrative
  const parts: string[] = [];
  parts.push(`Intent utama: ${intent}.`);
  if (sentiment.sentiment !== "neutral") {
    parts.push(`Sentimen: ${sentiment.sentiment}.`);
  }
  if (rfm.segment) parts.push(`Segment RFM: ${rfm.segment.toUpperCase()}.`);
  const narrative = parts.join(" ");

  return {
    intent,
    narrative,
    suggestions: suggestions.slice(0, 4),
    autoTags: Array.from(new Set(autoTags)),
    sentiment,
  };
}