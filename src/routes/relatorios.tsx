import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Plus, Printer, Download, ArrowLeft, Calendar } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReports, getMovements, getProducts, generateReport } from "@/lib/stock.functions";

const reportsQueryOptions = () =>
  queryOptions({
    queryKey: ["reports"],
    queryFn: () => getReports(),
  });

const movementsQueryOptions = () =>
  queryOptions({
    queryKey: ["movements"],
    queryFn: () => getMovements(),
  });

const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios - EstoqueSync" },
      { name: "description", content: "Relatórios de movimentação e estoque." },
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
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: generateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const totalEntrada = movements
    .filter((m) => m.tipo === "entrada")
    .reduce((sum, m) => sum + (m.quantidade ?? 0), 0);
  const totalSaida = movements
    .filter((m) => m.tipo === "saida")
    .reduce((sum, m) => sum + (m.quantidade ?? 0), 0);
  const activeStock = products.filter((p) => (p.estoque ?? false)).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe a movimentação e gere relatórios do estoque
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-70"
        >
          <Plus className="w-4 h-4" />
          {generateMutation.isPending ? "Gerando..." : "Gerar relatório"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Total de entradas</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalEntrada}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Total de saídas</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalSaida}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground">Produtos em estoque</div>
          <div className="text-2xl font-bold text-foreground mt-1">{activeStock}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden print-area">
        <div className="p-6 border-b border-border flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Relatórios gerados</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-secondary transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Data/Hora</th>
                <th className="text-right px-4 py-3 font-medium">Movimentações</th>
                <th className="text-right px-4 py-3 font-medium">Entradas</th>
                <th className="text-right px-4 py-3 font-medium">Saídas</th>
                <th className="text-right px-4 py-3 font-medium">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum relatório gerado. Clique em "Gerar relatório" para começar.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-secondary/20 transition cursor-pointer"
                    onClick={() => setSelectedReport(r.id)}
                  >
                    <td className="px-4 py-3 text-foreground font-medium">#{String(r.id).slice(0, 8)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.tipo}</td>
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

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Detalhes do relatório</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">ID:</span>{" "}
                <span className="text-foreground">#{String(selectedReport).slice(0, 8)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Gerado em:</span>{" "}
                <span className="text-foreground">
                  {new Date(
                    reports.find((r) => r.id === selectedReport)?.datahora ?? "",
                  ).toLocaleString("pt-BR")}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
