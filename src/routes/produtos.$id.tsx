import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Package, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getProducts,
  updateProduct,
  addMovement,
} from "@/lib/stock.functions";

const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

export const Route = createFileRoute("/produtos/$id")({
  head: () => ({
    meta: [
      { title: "Editar Produto - EstoqueSync" },
      { name: "description", content: "Edite produto ou registre movimentação." },
    ],
  }),
  validateSearch: z.object({
    action: z.enum(["entrada", "saida"]).optional(),
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsQueryOptions());
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const product = products.find((p) => p.id === id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateFn = useServerFn(updateProduct);
  const moveFn = useServerFn(addMovement);

  const [activeTab, setActiveTab] = useState<"edit" | "movement">(
    search.action ? "movement" : "edit",
  );
  const [form, setForm] = useState({
    nome: product?.nome ?? "",
    categoria: product?.categoria ?? "",
    quantidade: String(product?.quantidade ?? 0),
    unidade: product?.unidade ?? "",
    data_entrada: product?.data_entrada
      ? new Date(product.data_entrada).toISOString().slice(0, 16)
      : "",
  });
  const [movementQty, setMovementQty] = useState("");
  const [movementDate, setMovementDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [movementType, setMovementType] = useState<"entrada" | "saida">(
    search.action ?? "entrada",
  );
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      navigate({ to: "/produtos" });
    },
    onError: (err: Error) => setError(err.message),
  });

  const moveMutation = useMutation({
    mutationFn: moveFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      navigate({ to: "/produtos" });
    },
    onError: (err: Error) => setError(err.message),
  });

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/produtos" className="text-primary hover:underline text-sm mt-2 inline-block">
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    updateMutation.mutate({
      data: {
        id,
        nome: form.nome,
        categoria: form.categoria,
        quantidade: Number(form.quantidade),
        unidade: form.unidade,
      },
    });
  };

  const handleMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    moveMutation.mutate({
      data: {
        product_id: id,
        tipo: movementType,
        quantidade: Number(movementQty),
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/produtos" className="hover:text-foreground transition flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Produtos
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{product.nome}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {product.categoria} &bull; Estoque atual: {product.quantidade} {product.unidade}
          </p>
        </div>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "edit"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Editar produto
        </button>
        <button
          onClick={() => setActiveTab("movement")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "movement"
              ? "text-foreground border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Movimentação
        </button>
      </div>

      {error && (
        <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {activeTab === "edit" ? (
        <form onSubmit={handleUpdate} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Categoria</label>
              <input
                type="text"
                required
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Unidade</label>
              <input
                type="text"
                required
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Quantidade</label>
            <input
              type="number"
              required
              min="0"
              value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/produtos"
              className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-semibold transition disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleMovement} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMovementType("entrada")}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition ${
                movementType === "entrada"
                  ? "border-status-success bg-status-success/10 text-status-success"
                  : "border-border text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <ArrowDownCircle className="w-6 h-6" />
              <span className="font-medium">Entrada</span>
            </button>
            <button
              type="button"
              onClick={() => setMovementType("saida")}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition ${
                movementType === "saida"
                  ? "border-status-danger bg-status-danger/10 text-status-danger"
                  : "border-border text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <ArrowUpCircle className="w-6 h-6" />
              <span className="font-medium">Saída</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Quantidade a {movementType === "entrada" ? "adicionar" : "remover"}
            </label>
            <input
              type="number"
              required
              min="1"
              value={movementQty}
              onChange={(e) => setMovementQty(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: 5"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              to="/produtos"
              className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={moveMutation.isPending}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white transition disabled:opacity-70 ${
                movementType === "entrada"
                  ? "bg-status-success hover:bg-status-success/90"
                  : "bg-status-danger hover:bg-status-danger/90"
              }`}
            >
              {movementType === "entrada" ? (
                <ArrowDownCircle className="w-4 h-4" />
              ) : (
                <ArrowUpCircle className="w-4 h-4" />
              )}
              {moveMutation.isPending ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
