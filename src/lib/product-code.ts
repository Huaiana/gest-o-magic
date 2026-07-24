// Deterministic PRD-XXX code derived from insertion order (data_entrada asc).
export type WithEntry = { id: string; data_entrada: string };

export function buildProductCodes<T extends WithEntry>(products: T[]): Map<string, string> {
  const sorted = [...products].sort(
    (a, b) => new Date(a.data_entrada).getTime() - new Date(b.data_entrada).getTime(),
  );
  const map = new Map<string, string>();
  sorted.forEach((p, i) => {
    map.set(p.id, `PRD-${String(i + 1).padStart(3, "0")}`);
  });
  return map;
}

export function productCode(id: string, codes: Map<string, string>): string {
  return codes.get(id) ?? "PRD-—";
}
