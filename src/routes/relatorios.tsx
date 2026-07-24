import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Plus, Printer, Filter } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReports, getMovements, getProducts, generateReport } from "@/lib/stock.functions";
import { buildProductCodes } from "@/lib/product-code";

const reportsQueryOptions = () =>
  queryOptions({ queryKey: ["reports"], queryFn: () => getReports() });
const movementsQueryOptions = () =>
  queryOptions({ queryKey: ["movements"], queryFn: () => getMovements() });
const productsQueryOptions = () =>
  queryOptions({ queryKey: ["products"], queryFn: () => getProducts() });

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios - EstoqueSync" },
      { name: "description", content: "Relatórios de movimentação e estoque, com filtros por data, categoria e impressão em A4." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(reportsQueryOptions());
    await context.queryClient.ensureQueryData(movementsQueryOptions());
    await context.queryClient.ensureQueryData(productsQueryOptions());
  },
  component: ReportsPage,
});

function ReportsPage() {
  const { data: reports } = useSuspenseQuery(reportsQueryOptions());
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const queryClient = useQueryClient();
  const generateFn = useServerFn(generateReport);

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [category, setCategory] = useState("");
  const [productId, setProductId] = useState("");

  const codes = useMemo(() => buildProductCodes(products), [products]);
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoria))).sort(),
    [products],
  );
  const productsForSelect = useMemo(
    () =>
      (category ? products.filter((p) => p.categoria === category) : products)
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome)),
    [products, category],
  );

  const generateMutation = useMutation({
    mutationFn: () => generateFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const filteredMovements = useMemo(() => {
    const startTs = dateStart ? new Date(dateStart + "T00:00:00").getTime() : -Infinity;
    const endTs = dateEnd ? new Date(dateEnd + "T23:59:59").getTime() : Infinity;
    return movements.filter((m) => {
      const t = new Date(m.data_movimento).getTime();
      if (t < startTs || t > endTs) return false;
      if (category && m.categoria !== category) return false;
      if (productId && m.product_id !== productId) return false;
      return true;
    });
  }, [movements, dateStart, dateEnd, category, productId]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (category) list = list.filter((p) => p.categoria === category);
    if (productId) list = list.filter((p) => p.id === productId);
    return list;
  }, [products, category, productId]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const totalEntrada = filteredMovements
    .filter((m) => m.tipo === "entrada")
    .reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const totalSaida = filteredMovements
    .filter((m) => m.tipo === "saida")
    .reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const totalItens = filteredProducts.length;
  const volumeTotal = filteredProducts.reduce((s, p) => s + (p.quantidade ?? 0), 0);

  // Per-product breakdown (entradas / saídas / estoque atual)
  const perProduct = useMemo(() => {
    return filteredProducts
      .map((p) => {
        const movs = filteredMovements.filter((m) => m.product_id === p.id);
        const entradas = movs.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.quantidade, 0);
        const saidas = movs.filter((m) => m.tipo === "saida").reduce((s, m) => s + m.quantidade, 0);
        return { product: p, entradas, saidas, movs: movs.length };
      })
      .sort((a, b) => a.product.nome.localeCompare(b.product.nome));
  }, [filteredProducts, filteredMovements]);


  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Módulo de Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Filtre por período e categoria, imprima em A4 ou exporte em PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-70"
          >
            <Plus className="w-4 h-4" />
            {generateMutation.isPending ? "Gerando..." : "Gerar relatório"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-border text-foreground hover:bg-secondary px-4 py-2 rounded-lg font-medium transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir (A4)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 no-print">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Data Inicial</label>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Data Final</label>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Categoria</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setProductId(""); }}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Produto</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
          >
            <option value="">Todos</option>
            {productsForSelect.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setDateStart(""); setDateEnd(""); setCategory(""); setProductId(""); }}
            className="w-full px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition"
          >
            Limpar filtros
          </button>
        </div>
      </div>


      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
        <SummaryCard label="Total de entradas" value={totalEntrada} />
        <SummaryCard label="Total de saídas" value={totalSaida} />
        <SummaryCard label="Total de itens" value={totalItens} />
        <SummaryCard label="Volume total" value={volumeTotal} />
      </div>

      {/* Printable A4 area */}
      <div className="print-area bg-card border border-border rounded-xl p-8">
        <div className="flex items-start justify-between border-b border-border pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Relatório de Estoque</h2>
            <p className="text-sm text-muted-foreground mt-1">EstoqueSync Soluções Ltda.</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Data: {today}</p>
            <p>Emissão: Automática</p>
            {(dateStart || dateEnd) && (
              <p className="mt-1">Período: {dateStart || "—"} a {dateEnd || "—"}</p>
            )}
            {category && <p>Categoria: {category}</p>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Código</th>
                <th className="text-left px-3 py-2 font-medium">Produto</th>
                <th className="text-left px-3 py-2 font-medium">Categoria</th>
                <th className="text-right px-3 py-2 font-medium">Qtd</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhum produto no filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const status =
                    (p.quantidade ?? 0) > 5 ? "Normal" : (p.quantidade ?? 0) > 0 ? "Baixo" : "Esgotado";
                  return (
                    <tr key={p.id}>
                      <td className="px-3 py-2 font-mono text-xs">{codes.get(p.id)}</td>
                      <td className="px-3 py-2 text-foreground">{p.nome}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.categoria}</td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {p.quantidade} {p.unidade}
                      </td>
                      <td className="px-3 py-2">{status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap gap-6 text-sm border-t border-border pt-4">
          <div><span className="text-muted-foreground">Total de Itens:</span> <strong className="text-foreground">{totalItens}</strong></div>
          <div><span className="text-muted-foreground">Volume Total:</span> <strong className="text-foreground">{volumeTotal} un.</strong></div>
          <div><span className="text-muted-foreground">Entradas:</span> <strong className="text-foreground">{totalEntrada}</strong></div>
          <div><span className="text-muted-foreground">Saídas:</span> <strong className="text-foreground">{totalSaida}</strong></div>
        </div>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden no-print">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Histórico de relatórios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
                <th className="text-right px-4 py-3 font-medium">Movs.</th>
                <th className="text-right px-4 py-3 font-medium">Entradas</th>
                <th className="text-right px-4 py-3 font-medium">Saídas</th>
                <th className="text-right px-4 py-3 font-medium">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum relatório gerado ainda.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/20 transition">
                    <td className="px-4 py-3 text-foreground">{r.tipo}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.datahora).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">{r.total_movimentos}</td>
                    <td className="px-4 py-3 text-right text-status-success">{r.total_entrada}</td>
                    <td className="px-4 py-3 text-right text-status-danger">{r.total_saida}</td>
                    <td className="px-4 py-3 text-right text-foreground">{r.estoque_atual}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}
