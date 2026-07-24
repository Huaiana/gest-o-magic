import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  X,
} from "lucide-react";
import { deleteProduct, getProducts, seedInitialData } from "@/lib/stock.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { buildProductCodes } from "@/lib/product-code";

const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

export const Route = createFileRoute("/produtos/")({
  head: () => ({
    meta: [
      { title: "Produtos - EstoqueSync" },
      { name: "description", content: "Gerencie produtos, estoque e movimentações." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsQueryOptions());
    await seedInitialData();
  },
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      setDeleteId(null);
    },
  });

  const categories = Array.from(new Set(products.map((p) => p.categoria))).sort();

  const filtered = products.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? p.categoria === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cadastre, edite e controle seu estoque
          </p>
        </div>
        <Link
          to="/produtos/novo"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {(search || categoryFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("");
            }}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 font-medium">Quantidade</th>
                <th className="text-left px-4 py-3 font-medium">Unidade</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.categoria}</td>
                    <td className="px-4 py-3 text-foreground">{p.quantidade}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.unidade}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          (p.quantidade ?? 0) > 5
                            ? "bg-status-success/10 text-status-success"
                            : (p.quantidade ?? 0) > 0
                            ? "bg-status-warning/10 text-status-warning"
                            : "bg-status-danger/10 text-status-danger"
                        }`}
                      >
                        {(p.quantidade ?? 0) > 5
                          ? "Em estoque"
                          : (p.quantidade ?? 0) > 0
                          ? "Estoque baixo"
                          : "Esgotado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/produtos/$id"
                          params={{ id: p.id }}
                          search={{ action: "entrada" }}
                          className="p-2 rounded-lg bg-status-success/10 text-status-success hover:bg-status-success/20 transition"
                          title="Registrar entrada"
                        >
                          <ArrowDownCircle className="w-4 h-4" />
                        </Link>
                        <Link
                          to="/produtos/$id"
                          params={{ id: p.id }}
                          search={{ action: "saida" }}
                          className="p-2 rounded-lg bg-status-danger/10 text-status-danger hover:bg-status-danger/20 transition"
                          title="Registrar saída"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </Link>
                        <Link
                          to="/produtos/$id"
                          params={{ id: p.id }}
                          className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-2 rounded-lg bg-status-danger/10 text-status-danger hover:bg-status-danger/20 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Confirmar exclusão</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate({ data: { id: deleteId } })}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-status-danger text-white hover:bg-status-danger/90 transition disabled:opacity-70"
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
