import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeft,
  Printer,
  Save,
} from "lucide-react";
import { getProducts, getMovements, generateReport } from "@/lib/stock.functions";
import { buildProductCodes } from "@/lib/product-code";

export const productsQueryOptions = () =>
  queryOptions({ queryKey: ["products"], queryFn: () => getProducts() });

export const movementsQueryOptions = () =>
  queryOptions({ queryKey: ["movements"], queryFn: () => getMovements() });

const searchSchema = z.object({
  tipo: z.enum(["entrada", "saida"]).catch("entrada"),
});

export const Route = createFileRoute("/movimentos/$id")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Histórico de movimentações - EstoqueSync" },
      {
        name: "description",
        content:
          "Veja todas as entradas e saídas registradas de um produto, com data, hora e quantidade.",
      },
      { property: "og:title", content: "Histórico de movimentações - EstoqueSync" },
      {
        property: "og:description",
        content: "Entradas e saídas de um produto com data, hora e quantidade.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions()),
      context.queryClient.ensureQueryData(movementsQueryOptions()),
    ]);
  },
  component: ProductMovementsPage,
});

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    data: d.toLocaleDateString("pt-BR"),
    hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function ProductMovementsPage() {
  const { id } = Route.useParams();
  const { tipo } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());

  const product = products.find((p) => p.id === id);
  const codes = buildProductCodes(products);

  const all = movements.filter((m) => m.product_id === id);
  const list = all
    .filter((m) => m.tipo === tipo)
    .sort(
      (a, b) =>
        new Date(b.data_movimento).getTime() - new Date(a.data_movimento).getTime(),
    );

  const totalTipo = list.reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const totalEntradas = all
    .filter((m) => m.tipo === "entrada")
    .reduce((s, m) => s + (m.quantidade ?? 0), 0);
  const totalSaidas = all
    .filter((m) => m.tipo === "saida")
    .reduce((s, m) => s + (m.quantidade ?? 0), 0);

  const saveFn = useServerFn(generateReport);
  const saveMutation = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      navigate({ to: "/relatorios" });
    },
  });

  const isEntrada = tipo === "entrada";

  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/produtos" className="text-primary hover:underline">
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const datas = all.map((m) => new Date(m.data_movimento).getTime());
  const inicio = datas.length ? new Date(Math.min(...datas)).toISOString() : undefined;
  const fim = datas.length ? new Date(Math.max(...datas)).toISOString() : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <Link
            to="/produtos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para produtos
          </Link>
          <h1 className="text-3xl font-bold text-foreground mt-2">
            {isEntrada ? "Entradas" : "Saídas"} — {product.nome}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Histórico completo, mantido mesmo após novas reposições.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              saveMutation.mutate({
                data: {
                  tipo: "Diário",
                  product_id: id,
                  periodo_inicio: inicio,
                  periodo_fim: fim,
                  observacao: `Histórico de ${isEntrada ? "entradas" : "saídas"} — ${product.nome}`,
                },
              })
            }
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? "Salvando..." : "Salvar no relatório"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-border text-foreground hover:bg-secondary px-4 py-2 rounded-lg font-medium transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="flex gap-2 no-print">
        <Link
          to="/movimentos/$id"
          params={{ id }}
          search={{ tipo: "entrada" }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            isEntrada
              ? "bg-status-success/15 text-status-success"
              : "border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Entradas ({totalEntradas})
        </Link>
        <Link
          to="/movimentos/$id"
          params={{ id }}
          search={{ tipo: "saida" }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            !isEntrada
              ? "bg-status-danger/15 text-status-danger"
              : "border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          Saídas ({totalSaidas})
        </Link>
      </div>

      <div className="print-area bg-card border border-border rounded-xl p-8">
        <div className="flex items-start justify-between border-b border-border pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              EstoqueSync Soluções Ltda.
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEntrada ? "Relatório de entradas" : "Relatório de saídas"} —{" "}
              {product.nome} ({codes.get(product.id)})
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Emitido em {new Date().toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <SummaryCard
            label="Quantidade em estoque"
            value={`${product.quantidade ?? 0} ${product.unidade}`}
          />
          <SummaryCard
            label={isEntrada ? "Total de entradas" : "Total de saídas"}
            value={`${totalTipo} ${product.unidade}`}
          />
          <SummaryCard label="Registros" value={String(list.length)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Hora</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">Quantidade</th>
                <th className="text-left px-4 py-3 font-medium">Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma {isEntrada ? "entrada" : "saída"} registrada.
                  </td>
                </tr>
              ) : (
                list.map((m) => {
                  const { data, hora } = formatDateTime(m.data_movimento);
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-foreground">{data}</td>
                      <td className="px-4 py-3 text-muted-foreground">{hora}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            m.tipo === "entrada"
                              ? "bg-status-success/10 text-status-success"
                              : "bg-status-danger/10 text-status-danger"
                          }`}
                        >
                          {m.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {m.quantidade}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.unidade}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/30 border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground mt-1">{value}</p>
    </div>
  );
}
