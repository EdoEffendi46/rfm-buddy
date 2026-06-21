import type { Service, Template, Tag } from "@/types";

export const SERVICES: Service[] = [
  {
    id: "svc-cuci-setrika",
    name: "Paket Cuci Lengkap",
    defaultPrice: 7000,
    category: "Pembersihan",
  },
  { id: "svc-laundry-kiloan", name: "Cuci Standar", defaultPrice: 6000, category: "Pembersihan" },
  { id: "svc-setrika", name: "Finishing Express", defaultPrice: 4000, category: "Pembersihan" },
  { id: "svc-cuci-sepatu", name: "Deep Clean Item", defaultPrice: 35000, category: "Pembersihan" },
  { id: "svc-dry-cleaning", name: "Treatment Premium", defaultPrice: 50000, category: "Perawatan" },
  { id: "svc-haircut", name: "Konsultasi Singkat", defaultPrice: 35000, category: "Konsultasi" },
  { id: "svc-creambath", name: "Paket Reguler", defaultPrice: 85000, category: "Perawatan" },
  { id: "svc-smoothing", name: "Paket Premium", defaultPrice: 250000, category: "Membership" },
  { id: "svc-blow", name: "Layanan Tambahan", defaultPrice: 45000, category: "Perawatan" },
  { id: "svc-cat", name: "Upgrade Layanan", defaultPrice: 150000, category: "Perawatan" },
];

export const DEFAULT_TEMPLATES: Template[] = [
  { id: "t1", text: "Pesanan Anda sudah siap diambil ya kak! 🙏" },
  { id: "t2", text: "Terima kasih sudah order di tempat kami 😊" },
  { id: "t3", text: "Mohon maaf kak, sedang kami proses dulu ya" },
  { id: "t4", text: "Total biaya [nominal], bisa transfer ke rekening kami ya kak" },
  { id: "t5", text: "Hari ini kami libur, besok buka kembali jam 08.00 🙏" },
  { id: "t6", text: "Halo kak! Ada yang bisa kami bantu? 😊" },
  { id: "t7", text: "Pesanan kak dalam antrian, estimasi selesai [waktu]" },
  { id: "t8", text: "Selamat datang kak! Promo hari ini diskon 10% untuk Paket Reguler" },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: "tag-vip", name: "VIP", color: "#7C3AED", scope: "customer" },
  { id: "tag-langganan", name: "Langganan", color: "#22C55E", scope: "customer" },
  { id: "tag-reguler", name: "Pelanggan Reguler", color: "#EC4899", scope: "customer" },
  { id: "tag-mingguan", name: "Langganan Mingguan", color: "#0EA5E9", scope: "customer" },
  { id: "ctag-urgent", name: "urgent", color: "#EF4444", scope: "conversation" },
  { id: "ctag-followup", name: "follow up", color: "#F59E0B", scope: "conversation" },
  { id: "ctag-promo", name: "promo", color: "#22C55E", scope: "conversation" },
  { id: "ctag-komplain", name: "komplain", color: "#EF4444", scope: "conversation" },
  { id: "ctag-vip", name: "VIP", color: "#7C3AED", scope: "conversation" },
  { id: "ctag-baru", name: "baru masuk", color: "#3B82F6", scope: "conversation" },
];
