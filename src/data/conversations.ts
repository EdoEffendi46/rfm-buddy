import type { Message } from "@/types";
import { isoHoursAgo, isoDaysAgo } from "@/lib/format";

let mid = 1;
const m = (
  customerId: string,
  senderId: string,
  senderName: string,
  content: string,
  hoursAgo: number,
  opts: Partial<Message> = {},
): Message => ({
  id: `m${mid++}`,
  customerId,
  senderId,
  senderName,
  content,
  timestamp: isoHoursAgo(hoursAgo),
  readStatus: opts.readStatus ?? "read",
  type: opts.type ?? "text",
});

export const INITIAL_MESSAGES: Message[] = [
  // Dewi (champion, unread)
  m("c-dewi", "rina", "Rina", "Halo kak Dewi, creambath kemarin gimana hasilnya? 😊", 28),
  m("c-dewi", "c-dewi", "Dewi Lestari", "Bagus banget kak, makasih!", 27),
  m("c-dewi", "rina", "Rina", "Sama-sama kak 🙏 Mau booking lagi minggu ini?", 26),
  m("c-dewi", "c-dewi", "Dewi Lestari", "Iya kak, hari Sabtu ya, jam 10 pagi", 2),
  m("c-dewi", "c-dewi", "Dewi Lestari", "Sekalian smoothing juga ya 🙏", 1, { readStatus: "delivered" }),

  // Andi (champion, dalam_proses)
  m("c-andi", "budi", "Budi", "Halo pak Andi, dry cleaning sudah kami terima 4 item jas", 30),
  m("c-andi", "c-andi", "Andi Wijaya", "Oke, estimasi selesai kapan?", 29),
  m("c-andi", "budi", "Budi", "Hari Jumat sore ya pak, kami kabari kalau sudah siap 🙏", 28),
  m("c-andi", "c-andi", "Andi Wijaya", "Siap, makasih", 28),
  m("c-andi", "admin", "Admin", "Customer VIP — prioritas pengerjaan ya tim", 26, { type: "internal_note" }),

  // Siti (loyal)
  m("c-siti", "c-siti", "Siti Nurhaliza", "Mbak Sari, jadwal creambath aku bulan ini masih kosong nggak?", 50),
  m("c-siti", "sari", "Sari", "Halo kak Siti! Masih ada slot tanggal 22 & 24 Juni 😊", 49),
  m("c-siti", "c-siti", "Siti Nurhaliza", "Booking tgl 24 jam 2 siang ya", 48),
  m("c-siti", "sari", "Sari", "Noted kak, sudah saya catat 🙏", 47),

  // Rahmat (loyal, unread)
  m("c-rahmat", "sari", "Sari", "Pak Rahmat, laundry 12 kg sudah siap diambil ya 🙏", 6),
  m("c-rahmat", "c-rahmat", "Rahmat Hidayat", "Bisa diantar nggak ke rumah?", 3),
  m("c-rahmat", "c-rahmat", "Rahmat Hidayat", "Halo mbak?", 1, { readStatus: "delivered" }),

  // Maya (promising)
  m("c-maya", "c-maya", "Maya Putri", "Mbak, paket bundling laundry+setrika ada nggak?", 100),
  m("c-maya", "rina", "Rina", "Ada kak! 10kg cuci setrika Rp 70.000 saja 😊", 99),
  m("c-maya", "c-maya", "Maya Putri", "Oke besok aku setor ya", 98),
  m("c-maya", "rina", "Rina", "Ditunggu kak 🙏", 97),

  // Kevin (promising)
  m("c-kevin", "c-kevin", "Kevin Pratama", "Bro, blow dry brapa lama biasanya?", 150),
  m("c-kevin", "budi", "Budi", "Sekitar 30 menit kak", 149),
  m("c-kevin", "c-kevin", "Kevin Pratama", "Sip", 148),
  m("c-kevin", "budi", "Budi", "Pesanan kak Kevin dalam antrian, estimasi selesai 11.30", 4),

  // Bambang (at risk, unread urgent)
  m("c-bambang", "rina", "Rina", "Pak Bambang, sudah lama nggak laundry di tempat kami 😊 Ada promo diskon 15% nih khusus pelanggan lama!", 72),
  m("c-bambang", "c-bambang", "Bambang Sutejo", "Wah baru sempet baca", 5),
  m("c-bambang", "c-bambang", "Bambang Sutejo", "Boleh detailnya seperti apa?", 4, { readStatus: "delivered" }),
  m("c-bambang", "admin", "Admin", "At Risk customer — tolong dibantu retensi ya 🙏", 24, { type: "internal_note" }),

  // Lina (snoozed)
  m("c-lina", "budi", "Budi", "Halo mbak Lina, sudah lama nggak ke salon. Ada promo creambath nih 🌷", 200),
  m("c-lina", "c-lina", "Lina Marlina", "Aku lagi luar kota, minggu depan ya", 100),
  m("c-lina", "budi", "Budi", "Siap mbak, saya snooze percakapan ya", 99),

  // Iwan (resolved)
  m("c-iwan", "c-iwan", "Iwan Setiawan", "Sepatuku udah selesai belum?", 500),
  m("c-iwan", "sari", "Sari", "Sudah kak, bisa diambil hari ini", 499),
  m("c-iwan", "c-iwan", "Iwan Setiawan", "Oke makasih", 498),

  // Nina (resolved)
  m("c-nina", "c-nina", "Nina Anggraini", "Haircut sudah selesai ya, makasih", 700),
  m("c-nina", "budi", "Budi", "Sama-sama kak, ditunggu kunjungan berikutnya 🙏", 699),

  // Farhan (new)
  m("c-farhan", "c-farhan", "Farhan Maulana", "Halo, mau laundry 7 kg, hari ini bisa?", 48),
  m("c-farhan", "rina", "Rina", "Bisa kak, sini diantar saja 😊", 47),
  m("c-farhan", "c-farhan", "Farhan Maulana", "Oke sudah saya antar", 46),
  m("c-farhan", "rina", "Rina", "Diterima kak, estimasi selesai besok sore 🙏", 45),

  // Putri (new, unread)
  m("c-putri", "sari", "Sari", "Selamat datang kak Putri! Promo hari ini diskon 10% untuk Creambath 🌸", 150),
  m("c-putri", "c-putri", "Putri Ramadhani", "Aku mau coba creambath", 148),
  m("c-putri", "sari", "Sari", "Mantap kak! Bisa langsung datang ya 😊", 147),
  m("c-putri", "c-putri", "Putri Ramadhani", "Tadi udah selesai, hasilnya bagus banget", 2),
  m("c-putri", "c-putri", "Putri Ramadhani", "Next mau coba smoothing juga", 1, { readStatus: "delivered" }),
];