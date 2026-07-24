import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Package } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { addProduct } from "@/lib/stock.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const addFn = useServerFn(addProduct);

  const mutation = useMutation({
    mutationFn: addFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      navigate({ to: "/produtos" });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate({
      data: {
        nome: form.nome,
        categoria: form.categoria,
        quantidade: Number(form.quantidade),
        unidade: form.unidade,
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
        <span className="text-foreground">Novo</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Produto</h1>
          <p className="text-sm text-muted-foreground">Preencha os dados do produto</p>
        </div>
      </div>

      {error && (
        <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Nome do produto</label>
          <input
            type="text"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ex: Arroz Integral 5kg"
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
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Grãos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Unidade</label>
            <input
              type="text"
              required
              value={form.unidade}
              onChange={(e) => setForm({ ...form, unidade: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: un, kg, litros"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Quantidade inicial</label>
          <input
            type="number"
            required
            min="0"
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
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-semibold transition disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? "Salvando..." : "Salvar Produto"}
          </button>
        </div>
      </form>
    </div>
  );
}
