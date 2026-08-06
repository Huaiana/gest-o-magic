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
  const [nameMode, setNameMode] = useState<"select" | "new">("select");
  const normalizedNome = form.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const isContraFile = normalizedNome.includes("contra file");
  const isFileMignon = normalizedNome.includes("file mignon") || normalizedNome.includes("mignon");
  const isFileFrango = normalizedNome.includes("frango");
  const showBifeHelper = isContraFile || isFileMignon || isFileFrango;
  const meatUnitLabel = isFileFrango ? "filés" : "bifes";
  const ratioOptions = isFileFrango ? [1, 2, 4] : isFileMignon ? [2] : [3, 4];
  const [bifesPorAlmocoState, setBifesPorAlmoco] = useState(3);
  const bifesPorAlmoco = ratioOptions.includes(bifesPorAlmocoState)
    ? bifesPorAlmocoState
    : ratioOptions[0];
  const showPecaHelper = isContraFile || isFileMignon;
  

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
          tipo: form.tipo,
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
            {isRestock ? "Movimentar Produto" : "Novo Produto"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRestock
              ? "Registre uma entrada (reposição) ou saída deste produto"
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
          <select
            value={nameMode === "new" ? "__new__" : form.nome}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "__new__") {
                setNameMode("new");
                setForm((f) => ({ ...f, nome: "", categoria: "", unidade: "" }));
                return;
              }
              setNameMode("select");
              const match = existingProducts.find((p) => p.nome === value);
              setForm((f) => ({
                ...f,
                nome: value,
                categoria: match ? match.categoria : f.categoria,
                unidade: match ? match.unidade : f.unidade,
              }));
            }}
            className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Selecione um produto cadastrado</option>
            {nameOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="__new__">+ Cadastrar novo produto</option>
          </select>
          {nameMode === "new" && (
            <input
              type="text"
              required
              autoFocus
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="mt-2 w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Digite o nome do novo produto"
            />
          )}
          <p className="text-xs text-muted-foreground mt-1.5">
            Clique na seta para ver todos os produtos cadastrados ou escolha "Cadastrar novo
            produto".
          </p>
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
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Tipo de movimentação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: "entrada" })}
                  className={`px-3 py-2.5 rounded-lg border font-medium transition ${
                    form.tipo === "entrada"
                      ? "bg-status-success/20 border-status-success text-status-success"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Entrada (reposição)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: "saida" })}
                  className={`px-3 py-2.5 rounded-lg border font-medium transition ${
                    form.tipo === "saida"
                      ? "bg-status-danger/20 border-status-danger text-status-danger"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Saída
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {form.tipo === "entrada" ? "Data da reposição" : "Data da saída"}
              </label>
              <input
                type="date"
                required
                value={form.data_reposicao}
                onChange={(e) => setForm({ ...form, data_reposicao: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {isRestock
              ? form.tipo === "entrada"
                ? "Quantidade a repor"
                : "Quantidade de saída"
              : "Quantidade inicial"}
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
          {showBifeHelper && (
            <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3 space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Porção por almoço
              </label>
              <div className={`grid gap-2 ${ratioOptions.length === 3 ? "grid-cols-3" : ratioOptions.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {ratioOptions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setBifesPorAlmoco(n)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                      bifesPorAlmoco === n
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {n} {meatUnitLabel} = 1 almoço
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Quantidade de almoços
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    Number(form.quantidade) > 0
                      ? String(Number(form.quantidade) / bifesPorAlmoco)
                      : ""
                  }
                  onChange={(e) => {
                    const almocos = Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      quantidade: e.target.value === "" ? "" : String(almocos * bifesPorAlmoco),
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: 10 almoços"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Digite os almoços para preencher a quantidade em unidades ({meatUnitLabel})
                  automaticamente — ou digite as unidades acima.
                </p>
              </div>
              {showPecaHelper && (
                <div className="border-t border-border pt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Quantidade de peças (apenas informativo)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pecas}
                      onChange={(e) => setPecas(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Ex: 2 peças"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {Number(pecas) > 0 && Number(form.quantidade) > 0 ? (
                        <>
                          Com {Number(pecas)} peça{Number(pecas) === 1 ? "" : "s"} foram feitos{" "}
                          {Math.floor(Number(form.quantidade) / bifesPorAlmoco)} almoços.
                        </>
                      ) : (
                        "Registro de referência: não altera a quantidade de almoços nem a quantidade a repor."
                      )}
                    </p>
                  </div>
                </div>
              )}



              <p className="text-sm text-muted-foreground">
                {Number(form.quantidade) > 0 ? (
                  <>
                    <span className="text-foreground font-semibold">
                      {Number(form.quantidade)} un ({meatUnitLabel})
                    </span>{" "}
                    ={" "}
                    <span className="text-foreground font-semibold">
                      {Math.floor(Number(form.quantidade) / bifesPorAlmoco)} almoço
                      {Math.floor(Number(form.quantidade) / bifesPorAlmoco) === 1 ? "" : "s"}
                    </span>
                    {Number(form.quantidade) % bifesPorAlmoco > 0 && (
                      <> (sobram {Number(form.quantidade) % bifesPorAlmoco} {meatUnitLabel})</>
                    )}
                  </>
                ) : (
                  "Informe os almoços ou as unidades (filés/bifes)."
                )}
              </p>
            </div>
          )}

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
            {isPending ? "Salvando..." : isRestock ? (form.tipo === "entrada" ? "Registrar Reposição" : "Registrar Saída") : "Salvar Produto"}
          </button>
        </div>
      </form>
    </div>
  );
}
