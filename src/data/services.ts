import type { Service, Template, Tag } from "@/types";

export const SERVICES: Service[] = [
  { id: "svc-cuci-setrika", name: "Cuci Setrika", defaultPrice: 7000, category: "laundry" },
  { id: "svc-laundry-kiloan", name: "Laundry Kiloan", defaultPrice: 6000, category: "laundry" },
  { id: "svc-setrika", name: "Setrika Saja", defaultPrice: 4000, category: "laundry" },
  { id: "svc-cuci-sepatu", name: "Cuci Sepatu", defaultPrice: 35000, category: "laundry" },
  { id: "svc-dry-cleaning", name: "Dry Cleaning", defaultPrice: 50000, category: "laundry" },
  { id: "svc-haircut", name: "Haircut", defaultPrice: 35000, category: "salon" },
  { id: "svc-creambath", name: "Creambath", defaultPrice: 85000, category: "salon" },
  { id: "svc-smoothing", name: "Smoothing", defaultPrice: 250000, category: "salon" },
  { id: "svc-blow", name: "Blow Dry", defaultPrice: 45000, category: "salon" },
  { id: "svc-cat", name: "Cat Rambut", defaultPrice: 150000, category: "salon" },
];

export const DEFAULT_TEMPLATES: Template[] = [
  { id: "t1", text: "Laundry Anda sudah siap diambil ya kak! 🙏" },
  { id: "t2", text: "Terima kasih sudah order di tempat kami 😊" },
  { id: "t3", text: "Mohon maaf kak, sedang kami proses dulu ya" },
  { id: "t4", text: "Total biaya [nominal], bisa transfer ke rekening kami ya kak" },
  { id: "t5", text: "Hari ini kami libur, besok buka kembali jam 08.00 🙏" },
  { id: "t6", text: "Halo kak! Ada yang bisa kami bantu? 😊" },
  { id: "t7", text: "Pesanan kak dalam antrian, estimasi selesai [waktu]" },
  { id: "t8", text: "Selamat datang kak! Promo hari ini diskon 10% untuk Creambath" },
];

export const DEFAULT_TAGS: Tag[] = [
  { id: "tag-vip", name: "VIP", color: "#7C3AED", scope: "customer" },
  { id: "tag-langganan", name: "Langganan", color: "#22C55E", scope: "customer" },
  { id: "tag-salon", name: "Salon Reguler", color: "#EC4899", scope: "customer" },
  { id: "tag-laundry", name: "Laundry Reguler", color: "#0EA5E9", scope: "customer" },
  { id: "ctag-urgent", name: "urgent", color: "#EF4444", scope: "conversation" },
  { id: "ctag-followup", name: "follow up", color: "#F59E0B", scope: "conversation" },
  { id: "ctag-promo", name: "promo", color: "#22C55E", scope: "conversation" },
  { id: "ctag-komplain", name: "komplain", color: "#EF4444", scope: "conversation" },
  { id: "ctag-vip", name: "VIP", color: "#7C3AED", scope: "conversation" },
  { id: "ctag-baru", name: "baru masuk", color: "#3B82F6", scope: "conversation" },
];