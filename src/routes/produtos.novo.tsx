import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Package } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { addProduct, getProducts, addMovement } from "@/lib/stock.functions";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";


export const Route = createFileRoute("/produtos/novo")({
  head: () => ({
    meta: [
      { title: "Novo Produto - EstoqueSync" },
      { name: "description", content: "Cadastre um novo produto no estoque." },
    ],
  }),
  component: NewProductPage,
});

function NewProductPage() {
  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    quantidade: "",
    unidade: "",
    data_reposicao: new Date().toISOString().slice(0, 10),
    tipo: "entrada" as "entrada" | "saida",
  });

  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const addFn = useServerFn(addProduct);
  const addMovementFn = useServerFn(addMovement);
  const getProductsFn = useServerFn(getProducts);
  const { data: existingProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProductsFn(),
  });
  const nameOptions = Array.from(new Set(existingProducts.map((p) => p.nome))).sort();
  const categoryOptions = Array.from(new Set(existingProducts.map((p) => p.categoria))).sort();
  const unitOptions = Array.from(new Set(existingProducts.map((p) => p.unidade))).sort();

  const existingMatch = existingProducts.find((p) => p.nome === form.nome);
  const isRestock = Boolean(existingMatch);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["movements"] });
  };

  const addMutation = useMutation({
    mutationFn: addFn,
    onSuccess: () => {
      invalidate();
      navigate({ to: "/produtos" });
    },
    onError: (err: Error) => setError(err.message),
  });

  const movMutation = useMutation({
    mutationFn: addMovementFn,
    onSuccess: () => {
      invalidate();
      navigate({ to: "/produtos" });
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending = addMutation.isPending || movMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const qtd = Number(form.quantidade);
    if (isRestock && existingMatch) {
      const when = new Date(form.data_reposicao + "T12:00:00").toISOString();
      movMutation.mutate({
        data: {
          product_id: existingMatch.id,
          tipo: "entrada",
          quantidade: qtd,
          data_movimento: when,
        },
      });
    } else {
      addMutation.mutate({
        data: {
          nome: form.nome,
          categoria: form.categoria,
          quantidade: qtd,
          unidade: form.unidade,
        },
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/produtos" className="hover:text-foreground transition flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Produtos
        </Link>
        <span>/</span>
        <span className="text-foreground">Novo</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isRestock ? "Repor Produto" : "Novo Produto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRestock
              ? "Registre uma nova reposição para este produto"
              : "Preencha os dados do produto"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Nome do produto
          </label>
          <input
            type="text"
            required
            list="product-names"
            value={form.nome}
            onChange={(e) => {
              const nome = e.target.value;
              const match = existingProducts.find((p) => p.nome === nome);
              setForm((f) => ({
                ...f,
                nome,
                categoria: match ? match.categoria : f.categoria,
                unidade: match ? match.unidade : f.unidade,
              }));
            }}
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Selecione um cadastrado ou digite um novo"
          />
          <datalist id="product-names">
            {nameOptions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          {nameOptions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Dica: comece a digitar para ver sugestões dos produtos já cadastrados.
            </p>
          )}
        </div>

        {!isRestock && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Categoria</label>
              <input
                type="text"
                required
                list="product-categories"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ex: Grãos"
              />
              <datalist id="product-categories">
                {categoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Unidade</label>
              <input
                type="text"
                required
                list="product-units"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ex: un, kg, litros"
              />
              <datalist id="product-units">
                {unitOptions.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        {isRestock && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Data da reposição
            </label>
            <input
              type="date"
              required
              value={form.data_reposicao}
              onChange={(e) => setForm({ ...form, data_reposicao: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {isRestock ? "Quantidade a repor" : "Quantidade inicial"}
          </label>
          <input
            type="number"
            required
            min={isRestock ? "1" : "0"}
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ex: 10"
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
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-semibold transition disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Salvando..." : isRestock ? "Registrar Reposição" : "Salvar Produto"}
          </button>
        </div>
      </form>
    </div>
  );
}
