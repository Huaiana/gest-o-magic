import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import {
  Boxes,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  TrendingUp,
  Plus,
} from "lucide-react";
import {
  getDashboardStats,
  getProducts,
  seedInitialData,
} from "@/lib/stock.functions";
import { useServerFn } from "@tanstack/react-start";

export const dashboardStatsQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  });

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard - EstoqueSync" },
      { name: "description", content: "Visão geral do estoque, movimentações e alertas." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(dashboardStatsQueryOptions());
    await context.queryClient.ensureQueryData(productsQueryOptions());
    await seedInitialData();
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { data: stats } = useSuspenseQuery(dashboardStatsQueryOptions());
  const { data: products } = useSuspenseQuery(productsQueryOptions());

  const lowStockProducts = products.filter((p) => (p.quantidade ?? 0) <= 5);

  const chartData = [
    { name: "Entradas", value: stats.totalEntrada, color: "#22c55e" },
    { name: "Saídas", value: stats.totalSaida, color: "#ef4444" },
  ];
  const maxChart = Math.max(1, stats.totalEntrada + stats.totalSaida);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão geral do estoque e movimentações
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/produtos/novo"
            search={{ modo: "reposicao" }}
            className="inline-flex items-center gap-2 border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Reposição
          </Link>
          <Link
            to="/produtos/novo"
            search={{ modo: "novo" }}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </Link>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Boxes className="w-6 h-6 text-primary" />}
          label="Total de Produtos"
          value={stats.totalProducts}
          trend="+2"
        />
        <StatCard
          icon={<ArrowDownCircle className="w-6 h-6 text-status-success" />}
          label="Total de Entradas"
          value={stats.totalEntrada}
          trend="+12"
        />
        <StatCard
          icon={<ArrowUpCircle className="w-6 h-6 text-status-danger" />}
          label="Total de Saídas"
          value={stats.totalSaida}
          trend="-5"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-status-warning" />}
          label="Estoque Baixo"
          value={stats.lowStock}
          alert={stats.lowStock > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Movimentações</h2>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {chartData.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(item.value / maxChart) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-status-warning" />
            <h2 className="text-lg font-semibold text-foreground">Alertas de Estoque</h2>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.categoria}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-status-danger/10 text-status-danger">
                    {p.quantidade} {p.unidade}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: string;
  alert?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="bg-secondary/50 p-2 rounded-lg">{icon}</div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend.startsWith("+") ? "bg-status-success/10 text-status-success" : "bg-status-danger/10 text-status-danger"
            }`}
          >
            {trend}
          </span>
        )}
        {alert && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-status-warning/10 text-status-warning">
            Atenção
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
