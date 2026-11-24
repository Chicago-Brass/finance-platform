interface Invoice {
  id: string;
  value(field: string): unknown;
}

// Allocate once by invoice so disjoint category filters cannot claim the same rounding cent.
export function allocateInvoicePaymentCents(amount: unknown, invoices: readonly Invoice[], matching: readonly Invoice[], proportionField: string): number {
  if (!matching.length) return 0;
  if (typeof amount !== "number" || !Number.isFinite(amount)) throw new Error("Payment Amount is missing or invalid.");
  const [digits, exponent = "0"] = String(Math.abs(amount)).split("e");
  const total = Math.sign(amount) * Math.round(Number(`${digits}e${Number(exponent) + 2}`));
  const checked = (value: number) => {
    if (!Number.isSafeInteger(value)) throw new Error("Payment allocation exceeds safe cent precision.");
    return value;
  };
  checked(total);
  if (!total) return 0;
  const selected = new Set(matching.map(invoice => invoice.id));
  const unique = [...new Map(invoices.map(invoice => [invoice.id, invoice])).values()];
  if ([...selected].some(id => !unique.some(invoice => invoice.id === id))) throw new Error("Allocated invoice is not linked to this payment.");
  const shares = unique.map(invoice => {
    const share = invoice.value(proportionField);
    if (typeof share !== "number" || !Number.isFinite(share)) throw new Error("Invoices.Payment Proportion For Batch Allocation is missing or invalid.");
    const [digits, exponent = "0"] = String(Math.abs(share)).split("e");
    const [integer, fraction = ""] = digits.split(".");
    return { id: invoice.id, share, units: BigInt(integer + fraction) * BigInt(Math.sign(share)), scale: fraction.length - Number(exponent) };
  });
  const totalShare = shares.reduce((sum, invoice) => sum + invoice.share, 0);
  if (!Number.isFinite(totalShare) || Math.abs(totalShare - 1) > 1e-9) throw new Error("Invoice payment proportions must total 100% for the same invoice batch.");
  const scale = Math.max(0, ...shares.map(invoice => invoice.scale));
  const weights = shares.map(invoice => ({ id: invoice.id, units: invoice.units * 10n ** BigInt(scale - invoice.scale) }));
  const weightTotal = weights.reduce((sum, invoice) => sum + invoice.units, 0n), magnitude = BigInt(Math.abs(total));
  const parts = weights.map(invoice => {
    const numerator = magnitude * invoice.units;
    let cents = numerator / weightTotal, remainder = numerator % weightTotal;
    // Floor negative credit shares too; truncation can hide opposing one-cent errors.
    if (remainder < 0n) { cents--; remainder += weightTotal; }
    checked(Number(cents));
    return { id: invoice.id, cents, remainder };
  });
  let remaining = magnitude - parts.reduce((sum, invoice) => sum + invoice.cents, 0n);
  if (remaining < 0n || remaining > BigInt(parts.length)) throw new Error("Payment allocation exceeds safe cent precision.");
  for (const part of [...parts].sort((a, b) => a.remainder === b.remainder ? a.id.localeCompare(b.id) : a.remainder > b.remainder ? -1 : 1)) {
    if (!remaining) break;
    part.cents++;
    remaining--;
  }
  return checked(Number(parts.filter(invoice => selected.has(invoice.id)).reduce((sum, invoice) => sum + invoice.cents, 0n)) * Math.sign(total));
}
