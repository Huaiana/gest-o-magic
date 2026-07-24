import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Trash2, Save, X, Pencil } from "lucide-react";
import {
  getMovements,
  deleteMovement,
  updateMovement,
} from "@/lib/stock.functions";

const movementsQueryOptions = () =>
  queryOptions({
    queryKey: ["movements"],
    queryFn: () => getMovements(),
  });

export const Route = createFileRoute("/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações - EstoqueSync" },
      { name: "description", content: "Edite ou exclua entradas e saídas do seu estoque." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(movementsQueryOptions());
  },
  component: MovementsPage,
});

type Movement = {
  id: string;
  product_id: string;
  categoria: string;
  tipo: string;
  quantidade: number;
  unidade: string;
  data_movimento: string;
  products?: { nome: string } | null;
};

function MovementsPage() {
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteMovement);
  const updateFn = useServerFn(updateMovement);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editType, setEditType] = useState<"entrada" | "saida">("entrada");
  const [editDate, setEditDate] = useState("");
  const [error, setError] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["movements"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const startEdit = (m: Movement) => {
    setError("");
    setEditing(m);
    setEditQty(String(m.quantidade));
    setEditType(m.tipo as "entrada" | "saida");
    setEditDate(new Date(m.data_movimento).toISOString().slice(0, 16));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Movimentações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edite ou exclua entradas e saídas registradas
        </p>
      </div>

      {error && (
        <div className="bg-status-danger/10 text-status-danger text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-left px-4 py-3 font-medium">Produto</th>
                <th className="text-left px-4 py-3 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Qtd</th>
                <th className="text-right px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              ) : (
                (movements as Movement[]).map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/20 transition">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(m.data_movimento).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {m.products?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.categoria}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          m.tipo === "entrada"
                            ? "bg-status-success/10 text-status-success"
                            : "bg-status-danger/10 text-status-danger"
                        }`}
                      >
                        {m.tipo === "entrada" ? (
                          <ArrowDownCircle className="w-3 h-3" />
                        ) : (
                          <ArrowUpCircle className="w-3 h-3" />
                        )}
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {m.quantidade} {m.unidade}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(m)}
                          className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(m.id)}
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

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Editar movimentação</h3>
              <button
                onClick={() => setEditing(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{editing.products?.nome}</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditType("entrada")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition ${
                  editType === "entrada"
                    ? "border-status-success bg-status-success/10 text-status-success"
                    : "border-border text-muted-foreground"
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setEditType("saida")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition ${
                  editType === "saida"
                    ? "border-status-danger bg-status-danger/10 text-status-danger"
                    : "border-border text-muted-foreground"
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" /> Saída
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Quantidade</label>
              <input
                type="number"
                min="1"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Data</label>
              <input
                type="datetime-local"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition"
              >
                Cancelar
              </button>
              <button
                disabled={updateMutation.isPending}
                onClick={() =>
                  updateMutation.mutate({
                    data: {
                      id: editing.id,
                      quantidade: Number(editQty),
                      tipo: editType,
                      data_movimento: editDate
                        ? new Date(editDate).toISOString()
                        : undefined,
                    },
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Excluir movimentação?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              O estoque do produto será revertido. Esta ação não pode ser desfeita.
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
