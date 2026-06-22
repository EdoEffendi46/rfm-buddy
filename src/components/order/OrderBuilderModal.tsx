import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  BUSINESS_TYPE_SHORT,
  generateOrderNumber,
  unitFor,
} from "@/lib/businessProfile";
import { Avatar } from "@/components/Avatar";
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Customer, Service, Purchase } from "@/types";

interface LineItem {
  rowId: string;
  serviceId: string; // "" = custom
  name: string;
  qty: number;
  unitPrice: number;
  unit?: string;
  variantSelections: Record<string, string>;
  taxable: boolean;
  custom: boolean;
  perItemDiscount: number;
}

interface ExtraFee {
  id: string;
  name: string;
  amount: number;
  taxable: boolean;
}

function rid() {
  return Math.random().toString(36).slice(2, 9);
}

export function OrderBuilderModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer;
}) {
  const { services, businessProfile, addPurchase, currentAgent, logAudit } = useStore();
  const [orderNumber] = useState(() => generateOrderNumber());
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transactionType, setTransactionType] = useState<Purchase["transactionType"]>(
    "pesanan_proses",
  );
  const [items, setItems] = useState<LineItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [poNumber, setPoNumber] = useState("");

  // advanced
  const [discountMode, setDiscountMode] = useState<"item" | "overall">("overall");
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(businessProfile.defaultTaxEnabled);
  const [taxRate, setTaxRate] = useState(businessProfile.defaultTaxRate);
  const [fees, setFees] = useState<ExtraFee[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [dueDate, setDueDate] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("Net 7");
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [deposit, setDeposit] = useState(0);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAt, setDeliveryAt] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  // preview screen state
  const [showPreview, setShowPreview] = useState(false);

  const findService = (id: string) => services.find((s) => s.id === id);

  function addServiceItem(svc: Service) {
    setItems((p) => [
      ...p,
      {
        rowId: rid(),
        serviceId: svc.id,
        name: svc.name,
        qty: 1,
        unitPrice: svc.defaultPrice,
        unit: unitFor(svc),
        variantSelections: {},
        taxable: svc.taxable !== false,
        custom: false,
        perItemDiscount: 0,
      },
    ]);
  }

  function addCustomItem() {
    setItems((p) => [
      ...p,
      {
        rowId: rid(),
        serviceId: "",
        name: "",
        qty: 1,
        unitPrice: 0,
        unit: "pcs",
        variantSelections: {},
        taxable: true,
        custom: true,
        perItemDiscount: 0,
      },
    ]);
  }

  function updateItem(rowId: string, patch: Partial<LineItem>) {
    setItems((p) => p.map((i) => (i.rowId === rowId ? { ...i, ...patch } : i)));
  }

  function removeItem(rowId: string) {
    setItems((p) => p.filter((i) => i.rowId !== rowId));
  }

  // === calculations ===
  const calc = useMemo(() => {
    const lineCalcs = items.map((i) => {
      const gross = i.qty * i.unitPrice;
      const net = Math.max(0, gross - (discountMode === "item" ? i.perItemDiscount : 0));
      return { ...i, gross, net };
    });
    const subtotal = lineCalcs.reduce((s, i) => s + i.gross, 0);
    const itemDiscount =
      discountMode === "item" ? items.reduce((s, i) => s + i.perItemDiscount, 0) : 0;
    const overall = discountMode === "overall" ? Math.min(overallDiscount, subtotal) : 0;
    const totalDiscount = itemDiscount + overall;
    const afterDiscount = Math.max(0, subtotal - totalDiscount);
    const feesTotal = fees.reduce((s, f) => s + f.amount, 0);
    // tax: only on taxable lines (after their share of overall discount) + taxable fees
    let taxableBase = 0;
    if (taxEnabled) {
      const taxableLinesGross = lineCalcs
        .filter((i) => i.taxable)
        .reduce((s, i) => s + (discountMode === "item" ? i.net : i.gross), 0);
      const taxableShareOfOverall =
        subtotal > 0 ? (taxableLinesGross / subtotal) * overall : 0;
      taxableBase += Math.max(0, taxableLinesGross - taxableShareOfOverall);
      taxableBase += fees.filter((f) => f.taxable).reduce((s, f) => s + f.amount, 0);
    }
    const tax = taxEnabled ? Math.round((taxableBase * taxRate) / 100) : 0;
    const total = afterDiscount + feesTotal + tax;
    const depAmt = depositEnabled ? Math.min(deposit, total) : 0;
    const remaining = Math.max(0, total - depAmt);
    return {
      lineCalcs,
      subtotal,
      totalDiscount,
      feesTotal,
      tax,
      total,
      depAmt,
      remaining,
    };
  }, [items, discountMode, overallDiscount, fees, taxEnabled, taxRate, depositEnabled, deposit]);

  // recent items from purchase history
  const recentChips = useMemo(() => {
    const map = new Map<string, { name: string; serviceId: string; price: number }>();
    for (const p of customer.purchases) {
      if (!map.has(p.serviceName)) {
        map.set(p.serviceName, {
          name: p.serviceName,
          serviceId: p.serviceId,
          price: p.price,
        });
      }
      if (map.size >= 5) break;
    }
    return Array.from(map.values());
  }, [customer.purchases]);

  function handleSave() {
    if (items.length === 0) {
      toast.error("Tambahkan minimal satu item");
      return;
    }
    if (items.some((i) => !i.name.trim())) {
      toast.error("Nama item belum diisi");
      return;
    }
    const itemsSnapshot = calc.lineCalcs.map((i) => ({
      serviceId: i.serviceId,
      name: i.name,
      qty: i.qty,
      unit: i.unit,
      unitPrice: i.unitPrice,
      variantSelections: Object.keys(i.variantSelections).length ? i.variantSelections : undefined,
      taxable: i.taxable,
      subtotal: i.net,
    }));
    const primary = items[0];
    const purchase: Omit<Purchase, "id"> = {
      serviceId: primary.serviceId,
      serviceName:
        items.length === 1
          ? primary.name
          : `${primary.name} +${items.length - 1} item lain`,
      date: new Date(orderDate).toISOString(),
      price: calc.total,
      qty: primary.qty,
      unit: primary.unit,
      orderNumber,
      transactionType,
      variantSelections: Object.keys(primary.variantSelections).length
        ? primary.variantSelections
        : undefined,
      discountAmount: calc.totalDiscount,
      taxAmount: calc.tax,
      additionalFees: fees.length ? fees.map((f) => ({ name: f.name, amount: f.amount, taxable: f.taxable })) : undefined,
      paymentMethod,
      paymentDueDate: paymentMethod === "Belum Dibayar (Tempo)" && dueDate ? dueDate : undefined,
      paymentTerm: paymentMethod === "Belum Dibayar (Tempo)" ? paymentTerm : undefined,
      depositPaid: depositEnabled ? calc.depAmt : undefined,
      remainingBalance: depositEnabled ? calc.remaining : undefined,
      deliveryRequired: deliveryEnabled || undefined,
      deliveryAddress: deliveryEnabled ? deliveryAddress : undefined,
      deliveryAt: deliveryEnabled && deliveryAt ? deliveryAt : undefined,
      customerFacingNote: customerNote || undefined,
      internalNote: internalNote || undefined,
      notes: customerNote || internalNote || undefined,
      source: "chat_generated",
      items: itemsSnapshot,
    };
    const saved = addPurchase(customer.id, purchase);
    logAudit({
      action: "customer_edited",
      targetType: "customer",
      targetId: customer.id,
      targetLabel: customer.name,
      newValue: `Pesanan ${orderNumber}`,
      details: `Pesanan dibuat oleh ${currentAgent?.name ?? "Sistem"} - total ${formatRupiah(calc.total)}`,
    });
    toast.success(`Pesanan ${saved.orderNumber ?? orderNumber} tersimpan`);
    onClose();
  }

  // ---- RENDER ----
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-3">
            <Avatar name={customer.name} size={36} />
            <div className="flex flex-col">
              <span>Buat Pesanan Baru</span>
              <span className="text-xs font-normal text-slate-500">
                Untuk {customer.name} ·{" "}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">
                  {BUSINESS_TYPE_SHORT[businessProfile.type]}
                </span>
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-5">
            {/* SECTION 1 — Info */}
            <section className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">No. Pesanan</label>
                <Input value={orderNumber} readOnly className="font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Tanggal</label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Jenis Transaksi</label>
                <Select
                  value={transactionType}
                  onValueChange={(v) => setTransactionType(v as Purchase["transactionType"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penjualan_langsung">Penjualan Langsung</SelectItem>
                    <SelectItem value="pesanan_proses">Pesanan (Proses Dulu)</SelectItem>
                    <SelectItem value="reservasi">Reservasi/Booking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* SECTION 2 — Items */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Item Pesanan</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={addCustomItem}>
                    <Plus className="h-3 w-3" /> Item Custom
                  </Button>
                </div>
              </div>

              {/* Quick chips */}
              {recentChips.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  <span className="text-[11px] text-slate-500">Pernah dibeli:</span>
                  {recentChips.map((c) => {
                    const svc = findService(c.serviceId);
                    return (
                      <button
                        key={c.serviceId + c.name}
                        type="button"
                        onClick={() => {
                          if (svc) addServiceItem(svc);
                          else
                            setItems((p) => [
                              ...p,
                              {
                                rowId: rid(),
                                serviceId: c.serviceId,
                                name: c.name,
                                qty: 1,
                                unitPrice: c.price,
                                unit: "pcs",
                                variantSelections: {},
                                taxable: true,
                                custom: false,
                                perItemDiscount: 0,
                              },
                            ]);
                        }}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-100"
                      >
                        + {c.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Item rows */}
              <div className="space-y-2">
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                    Belum ada item. Pilih layanan di bawah atau tambah custom.
                  </div>
                )}
                {items.map((i) => {
                  const svc = findService(i.serviceId);
                  const showStockWarn =
                    businessProfile.usesStock &&
                    svc?.stockQty != null &&
                    i.qty >= (svc.stockQty - (svc.lowStockThreshold ?? 0));
                  return (
                    <div
                      key={i.rowId}
                      className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[180px]">
                          <label className="text-[10px] font-medium text-slate-500">
                            {i.custom ? "Nama Item (Custom)" : "Layanan/Barang"}
                          </label>
                          {i.custom ? (
                            <Input
                              value={i.name}
                              onChange={(e) => updateItem(i.rowId, { name: e.target.value })}
                              placeholder="Mis. Hadiah ulang tahun"
                            />
                          ) : (
                            <Select
                              value={i.serviceId}
                              onValueChange={(v) => {
                                const s = findService(v);
                                if (!s) return;
                                updateItem(i.rowId, {
                                  serviceId: s.id,
                                  name: s.name,
                                  unitPrice: s.defaultPrice,
                                  unit: unitFor(s),
                                  taxable: s.taxable !== false,
                                  variantSelections: {},
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                    {businessProfile.usesSKU && s.sku ? ` (${s.sku})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="w-20">
                          <label className="text-[10px] font-medium text-slate-500">Qty</label>
                          <Input
                            type="number"
                            min={1}
                            value={i.qty}
                            onChange={(e) =>
                              updateItem(i.rowId, { qty: Math.max(1, Number(e.target.value)) })
                            }
                          />
                        </div>
                        <div className="w-12 pb-2 text-[11px] text-slate-500">{i.unit ?? "pcs"}</div>
                        <div className="w-28">
                          <label className="text-[10px] font-medium text-slate-500">
                            Harga Satuan
                          </label>
                          <Input
                            type="number"
                            value={i.unitPrice}
                            onChange={(e) =>
                              updateItem(i.rowId, { unitPrice: Number(e.target.value) })
                            }
                          />
                        </div>
                        <div className="w-28 pb-2 text-right text-xs font-semibold">
                          {formatRupiah(i.qty * i.unitPrice)}
                        </div>
                        <button
                          onClick={() => removeItem(i.rowId)}
                          className="pb-2 text-red-500 hover:text-red-700"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {/* Variants */}
                      {!i.custom &&
                        svc?.hasVariants &&
                        svc.variantOptions &&
                        svc.variantOptions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {svc.variantOptions.map((vo) => (
                              <div key={vo.name} className="text-xs">
                                <label className="mr-1 text-slate-500">{vo.name}:</label>
                                <Select
                                  value={i.variantSelections[vo.name] ?? ""}
                                  onValueChange={(v) =>
                                    updateItem(i.rowId, {
                                      variantSelections: {
                                        ...i.variantSelections,
                                        [vo.name]: v,
                                      },
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-7 w-32 text-xs">
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vo.choices.map((c) => (
                                      <SelectItem key={c} value={c}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                        {taxEnabled && i.taxable && (
                          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">
                            Kena PPN
                          </span>
                        )}
                        {showStockWarn && svc && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                            <AlertTriangle className="h-3 w-3" /> Stok: {svc.stockQty} tersisa
                          </span>
                        )}
                        {discountMode === "item" && (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-500">Diskon item:</span>
                            <Input
                              type="number"
                              value={i.perItemDiscount}
                              onChange={(e) =>
                                updateItem(i.rowId, { perItemDiscount: Number(e.target.value) })
                              }
                              className="h-6 w-20 text-[11px]"
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add from service catalog */}
              <div className="mt-3 flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-slate-500">
                    + Tambah Item dari Katalog
                  </label>
                  <Select
                    value=""
                    onValueChange={(v) => {
                      const s = findService(v);
                      if (s) addServiceItem(s);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih layanan/barang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {formatRupiah(s.defaultPrice)}
                          {businessProfile.usesStock && s.stockQty != null
                            ? ` · stok ${s.stockQty}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* SECTION 3 — Advanced */}
            <section className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-slate-700"
              >
                <span>Detail Lanjutan (diskon, pajak, pembayaran, pengiriman)</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showAdvanced && (
                <div className="space-y-4 border-t border-slate-200 p-3">
                  {/* PO Number */}
                  <div>
                    <label className="text-xs font-medium">No. PO Customer (jika ada)</label>
                    <Input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="PO-12345"
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="text-xs font-medium">Diskon</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Select
                        value={discountMode}
                        onValueChange={(v) => setDiscountMode(v as "item" | "overall")}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="overall">Diskon Keseluruhan</SelectItem>
                          <SelectItem value="item">Diskon per Item</SelectItem>
                        </SelectContent>
                      </Select>
                      {discountMode === "overall" && (
                        <Input
                          type="number"
                          value={overallDiscount}
                          onChange={(e) => setOverallDiscount(Number(e.target.value))}
                          placeholder="0"
                          className="w-32"
                        />
                      )}
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="flex items-center gap-3">
                    <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} />
                    <span className="text-xs font-medium">Kenakan PPN</span>
                    {taxEnabled && (
                      <>
                        <Input
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-xs text-slate-500">%</span>
                      </>
                    )}
                  </div>

                  {/* Fees */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium">Biaya Tambahan</label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setFees((p) => [
                            ...p,
                            { id: rid(), name: "", amount: 0, taxable: false },
                          ])
                        }
                      >
                        <Plus className="h-3 w-3" /> Biaya
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {fees.map((f) => (
                        <div key={f.id} className="flex items-center gap-2">
                          <Input
                            placeholder="Mis. Ongkos Kirim"
                            value={f.name}
                            onChange={(e) =>
                              setFees((p) =>
                                p.map((x) =>
                                  x.id === f.id ? { ...x, name: e.target.value } : x,
                                ),
                              )
                            }
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={f.amount}
                            onChange={(e) =>
                              setFees((p) =>
                                p.map((x) =>
                                  x.id === f.id ? { ...x, amount: Number(e.target.value) } : x,
                                ),
                              )
                            }
                            className="w-28"
                          />
                          <label className="flex items-center gap-1 text-[11px]">
                            <input
                              type="checkbox"
                              checked={f.taxable}
                              onChange={(e) =>
                                setFees((p) =>
                                  p.map((x) =>
                                    x.id === f.id ? { ...x, taxable: e.target.checked } : x,
                                  ),
                                )
                              }
                            />
                            PPN
                          </label>
                          <button
                            onClick={() => setFees((p) => p.filter((x) => x.id !== f.id))}
                            className="text-red-500"
                            title="Hapus biaya"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <label className="text-xs font-medium">Metode Pembayaran</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tunai">Tunai</SelectItem>
                        <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                        <SelectItem value="Kartu Debit/Kredit">Kartu Debit/Kredit</SelectItem>
                        <SelectItem value="Belum Dibayar (Tempo)">
                          Belum Dibayar (Tempo)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {paymentMethod === "Belum Dibayar (Tempo)" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-slate-500">
                            Jatuh Tempo
                          </label>
                          <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-slate-500">Termin</label>
                          <Select value={paymentTerm} onValueChange={setPaymentTerm}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Net 7">Net 7</SelectItem>
                              <SelectItem value="Net 14">Net 14</SelectItem>
                              <SelectItem value="Net 30">Net 30</SelectItem>
                              <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Deposit */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <Switch checked={depositEnabled} onCheckedChange={setDepositEnabled} />
                      Customer Bayar DP
                    </label>
                    {depositEnabled && (
                      <Input
                        type="number"
                        value={deposit}
                        onChange={(e) => setDeposit(Number(e.target.value))}
                        placeholder="Jumlah DP"
                        className="mt-1 w-40"
                      />
                    )}
                  </div>

                  {/* Delivery */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <Switch
                        checked={deliveryEnabled}
                        onCheckedChange={setDeliveryEnabled}
                      />
                      Perlu Pengiriman/Antar?
                    </label>
                    {deliveryEnabled && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          placeholder="Alamat pengiriman / pengambilan"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          rows={2}
                        />
                        <Input
                          type="datetime-local"
                          value={deliveryAt}
                          onChange={(e) => setDeliveryAt(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Catatan Internal (tim saja)</label>
                      <Textarea
                        value={internalNote}
                        onChange={(e) => setInternalNote(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">
                        Catatan di Struk (terlihat customer)
                      </label>
                      <Textarea
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 4 — Summary sticky */}
            <SummaryBox calc={calc} taxEnabled={taxEnabled} taxRate={taxRate} fees={fees} depositEnabled={depositEnabled} />
          </div>
        ) : (
          <ReceiptPreview
            customer={customer}
            orderNumber={orderNumber}
            orderDate={orderDate}
            transactionType={transactionType}
            items={calc.lineCalcs}
            calc={calc}
            taxEnabled={taxEnabled}
            taxRate={taxRate}
            fees={fees}
            paymentMethod={paymentMethod}
            depositEnabled={depositEnabled}
            customerNote={customerNote}
            agentName={currentAgent?.name ?? "Agent"}
            deliveryEnabled={deliveryEnabled}
            deliveryAddress={deliveryAddress}
          />
        )}

        <DialogFooter className="border-t border-slate-200 bg-white px-6 py-3">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          {!showPreview ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (items.length === 0) {
                    toast.error("Tambah item dulu");
                    return;
                  }
                  setShowPreview(true);
                }}
              >
                Preview Struk
              </Button>
              <Button onClick={handleSave} className="bg-[#25D366] text-white hover:bg-[#128C7E]">
                Simpan Pesanan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Kembali Edit
              </Button>
              <Button onClick={handleSave} className="bg-[#25D366] text-white hover:bg-[#128C7E]">
                Konfirmasi & Simpan
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryBox({
  calc,
  taxEnabled,
  taxRate,
  fees,
  depositEnabled,
}: {
  calc: { subtotal: number; totalDiscount: number; feesTotal: number; tax: number; total: number; depAmt: number; remaining: number };
  taxEnabled: boolean;
  taxRate: number;
  fees: ExtraFee[];
  depositEnabled: boolean;
}) {
  return (
    <section className="sticky bottom-0 -mx-6 border-t border-slate-200 bg-emerald-50/60 px-6 py-3 text-sm">
      <Row label="Subtotal" value={formatRupiah(calc.subtotal)} />
      {calc.totalDiscount > 0 && (
        <Row label="Diskon" value={`-${formatRupiah(calc.totalDiscount)}`} className="text-rose-600" />
      )}
      {fees.length > 0 && calc.feesTotal > 0 && (
        <Row label="Biaya Tambahan" value={formatRupiah(calc.feesTotal)} />
      )}
      {taxEnabled && calc.tax > 0 && (
        <Row label={`PPN (${taxRate}%)`} value={formatRupiah(calc.tax)} />
      )}
      <div className="my-1 border-t border-slate-300" />
      <Row label="Total" value={formatRupiah(calc.total)} className="text-base font-semibold" />
      {depositEnabled && calc.depAmt > 0 && (
        <>
          <Row label="DP Dibayar" value={`-${formatRupiah(calc.depAmt)}`} className="text-emerald-700" />
          <div className="my-1 border-t border-slate-300" />
          <Row
            label="Sisa Pembayaran"
            value={formatRupiah(calc.remaining)}
            className="text-base font-bold text-emerald-700"
          />
        </>
      )}
    </section>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function ReceiptPreview({
  customer,
  orderNumber,
  orderDate,
  transactionType,
  items,
  calc,
  taxEnabled,
  taxRate,
  fees,
  paymentMethod,
  depositEnabled,
  customerNote,
  agentName,
  deliveryEnabled,
  deliveryAddress,
}: {
  customer: Customer;
  orderNumber: string;
  orderDate: string;
  transactionType: Purchase["transactionType"];
  items: (LineItem & { gross: number; net: number })[];
  calc: { subtotal: number; totalDiscount: number; feesTotal: number; tax: number; total: number; depAmt: number; remaining: number };
  taxEnabled: boolean;
  taxRate: number;
  fees: ExtraFee[];
  paymentMethod: string;
  depositEnabled: boolean;
  customerNote: string;
  agentName: string;
  deliveryEnabled: boolean;
  deliveryAddress: string;
}) {
  const trxLabel =
    transactionType === "penjualan_langsung"
      ? "Penjualan Langsung"
      : transactionType === "reservasi"
        ? "Reservasi/Booking"
        : "Pesanan (Proses Dulu)";
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-2">
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-5 font-mono text-xs text-slate-800 shadow-sm">
        <div className="text-center">
          <div className="text-sm font-bold">ChatCRM</div>
          <div className="text-[10px] text-slate-500">Preview Struk Pesanan</div>
        </div>
        <div className="my-2 border-t border-dashed border-slate-300" />
        <div>No: {orderNumber}</div>
        <div>Customer: {customer.name}</div>
        <div>Tanggal: {formatDate(new Date(orderDate).toISOString())}</div>
        <div>CS: {agentName}</div>
        <div>Jenis: {trxLabel}</div>
        <div className="my-2 border-t border-dashed border-slate-300" />
        {items.map((i, idx) => (
          <div key={idx} className="flex justify-between">
            <div className="flex-1">
              {i.name}
              {Object.keys(i.variantSelections).length > 0 && (
                <span className="text-[10px] text-slate-500">
                  {" "}
                  ({Object.values(i.variantSelections).join(", ")})
                </span>
              )}
              <span className="ml-1 text-slate-500">
                {i.qty}
                {i.unit ?? ""}
              </span>
            </div>
            <div>{formatRupiah(i.net)}</div>
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-slate-300" />
        <Row label="Subtotal" value={formatRupiah(calc.subtotal)} />
        {calc.totalDiscount > 0 && (
          <Row label="Diskon" value={`-${formatRupiah(calc.totalDiscount)}`} />
        )}
        {fees.length > 0 &&
          fees
            .filter((f) => f.amount > 0)
            .map((f) => <Row key={f.id} label={f.name || "Biaya"} value={formatRupiah(f.amount)} />)}
        {taxEnabled && calc.tax > 0 && (
          <Row label={`PPN (${taxRate}%)`} value={formatRupiah(calc.tax)} />
        )}
        <Row label="Total" value={formatRupiah(calc.total)} className="font-bold" />
        <div>Metode Bayar: {paymentMethod}</div>
        {depositEnabled && calc.depAmt > 0 && (
          <>
            <Row label="DP" value={`-${formatRupiah(calc.depAmt)}`} />
            <Row label="Sisa" value={formatRupiah(calc.remaining)} className="font-bold" />
          </>
        )}
        {deliveryEnabled && deliveryAddress && (
          <>
            <div className="my-2 border-t border-dashed border-slate-300" />
            <div>Antar ke: {deliveryAddress}</div>
          </>
        )}
        {customerNote && (
          <>
            <div className="my-2 border-t border-dashed border-slate-300" />
            <div>Catatan: {customerNote}</div>
          </>
        )}
      </div>
    </div>
  );
}