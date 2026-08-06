import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient } from "./stock.server";

const productSchema = z.object({
  nome: z.string().min(1),
  categoria: z.string().min(1),
  quantidade: z.coerce.number().int().min(0),
  unidade: z.string().min(1),
  data_entrada: z.string().datetime().optional(),
});

const movementSchema = z.object({
  product_id: z.string().uuid(),
  tipo: z.enum(["entrada", "saida"]),
  quantidade: z.coerce.number().int().min(1),
  data_movimento: z.string().datetime().optional(),
  pecas: z.coerce.number().int().min(0).optional(),
});

export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("data_entrada", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const addProduct = createServerFn({ method: "POST" })
  .inputValidator((input) => productSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const now = new Date().toISOString();
    const estoque = data.quantidade > 0;

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        nome: data.nome,
        categoria: data.categoria,
        quantidade: data.quantidade,
        unidade: data.unidade,
        estoque,
        data_entrada: now,
        ultima_reposicao: data.quantidade > 0 ? now : null,
      })
      .select()
      .single();

    if (error) throw error;

    if (data.quantidade > 0) {
      const { error: movError } = await supabase.from("movements").insert({
        product_id: product.id,
        categoria: data.categoria,
        tipo: "entrada",
        quantidade: data.quantidade,
        unidade: data.unidade,
        data_movimento: now,
      });
      if (movError) throw movError;
    }

    return product;
  });


export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
      })
      .merge(productSchema)
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const estoque = data.quantidade > 0;

    const updatePayload = {
      nome: data.nome,
      categoria: data.categoria,
      quantidade: data.quantidade,
      unidade: data.unidade,
      estoque,
      ...(data.data_entrada ? { data_entrada: data.data_entrada } : {}),
    };

    const { data: product, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    return product;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { error } = await supabase.from("products").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const getMovements = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("movements")
    .select("*, products(nome)")
    .order("data_movimento", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const addMovement = createServerFn({ method: "POST" })
  .inputValidator((input) => movementSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const when = data.data_movimento ?? new Date().toISOString();

    const { data: product, error: prodError } = await supabase
      .from("products")
      .select("*")
      .eq("id", data.product_id)
      .single();

    if (prodError || !product) throw new Error("Produto não encontrado");

    const qtdAtual = product.quantidade ?? 0;
    if (data.tipo === "saida" && qtdAtual < data.quantidade) {
      throw new Error("Estoque insuficiente");
    }

    const novaQtd =
      data.tipo === "entrada"
        ? qtdAtual + data.quantidade
        : qtdAtual - data.quantidade;
    const novoEstoque = novaQtd > 0;

    const productUpdate: {
      quantidade: number;
      estoque: boolean;
      ultima_reposicao?: string;
    } = { quantidade: novaQtd, estoque: novoEstoque };
    if (data.tipo === "entrada") productUpdate.ultima_reposicao = when;


    const { error: updateError } = await supabase
      .from("products")
      .update(productUpdate)
      .eq("id", data.product_id);

    if (updateError) throw updateError;


    const { error: movError } = await supabase.from("movements").insert({
      product_id: data.product_id,
      categoria: product.categoria,
      tipo: data.tipo,
      quantidade: data.quantidade,
      unidade: product.unidade,
      data_movimento: when,
    });

    if (movError) throw movError;

    return { success: true };
  });

export const deleteMovement = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: mov, error: fetchErr } = await supabase
      .from("movements")
      .select("*")
      .eq("id", data.id)
      .single();
    if (fetchErr || !mov) throw new Error("Movimentação não encontrada");

    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", mov.product_id)
      .single();

    if (product) {
      const qtdAtual = product.quantidade ?? 0;
      const revert =
        mov.tipo === "entrada"
          ? qtdAtual - mov.quantidade
          : qtdAtual + mov.quantidade;
      const nova = Math.max(0, revert);
      await supabase
        .from("products")
        .update({ quantidade: nova, estoque: nova > 0 })
        .eq("id", product.id);
    }

    const { error } = await supabase.from("movements").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const updateMovement = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        quantidade: z.coerce.number().int().min(1),
        tipo: z.enum(["entrada", "saida"]),
        data_movimento: z.string().datetime().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: old, error: fetchErr } = await supabase
      .from("movements")
      .select("*")
      .eq("id", data.id)
      .single();
    if (fetchErr || !old) throw new Error("Movimentação não encontrada");

    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", old.product_id)
      .single();

    if (product) {
      const qtdAtual = product.quantidade ?? 0;
      // revert old
      const reverted =
        old.tipo === "entrada"
          ? qtdAtual - old.quantidade
          : qtdAtual + old.quantidade;
      // apply new
      const applied =
        data.tipo === "entrada"
          ? reverted + data.quantidade
          : reverted - data.quantidade;
      if (applied < 0) throw new Error("Estoque insuficiente para esta alteração");
      await supabase
        .from("products")
        .update({ quantidade: applied, estoque: applied > 0 })
        .eq("id", product.id);
    }

    const payload = {
      quantidade: data.quantidade,
      tipo: data.tipo,
      ...(data.data_movimento ? { data_movimento: data.data_movimento } : {}),
    };
    const { error } = await supabase.from("movements").update(payload).eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const getReports = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("datahora", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const generateReport = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        tipo: z.enum(["Diário", "Semanal", "Mensal"]).default("Diário"),
        observacao: z.string().optional(),
        product_id: z.string().uuid().optional(),
        periodo_inicio: z.string().optional(),
        periodo_fim: z.string().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const now = new Date();
    const nowIso = now.toISOString();

    // Compute period window based on tipo (or explicit filter dates)
    let start: Date;
    let end = now;
    if (data.periodo_inicio) {
      start = new Date(data.periodo_inicio);
    } else {
      start = new Date(now);
      if (data.tipo === "Diário") start.setHours(0, 0, 0, 0);
      else if (data.tipo === "Semanal") start.setDate(start.getDate() - 7);
      else start.setMonth(start.getMonth() - 1);
    }
    if (data.periodo_fim) end = new Date(data.periodo_fim);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const { data: movementsAll, error: movError } = await supabase
      .from("movements")
      .select("*");
    if (movError) throw movError;

    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("*");
    if (prodError) throw prodError;

    const movements = (movementsAll ?? []).filter((m) => {
      const t = new Date(m.data_movimento).getTime();
      if (t < start.getTime() || t > end.getTime()) return false;
      if (data.product_id && m.product_id !== data.product_id) return false;
      return true;
    });

    const totalMov = movements.length;
    const totalEntrada = movements
      .filter((m) => m.tipo === "entrada")
      .reduce((sum, m) => sum + (m.quantidade ?? 0), 0);
    const totalSaida = movements
      .filter((m) => m.tipo === "saida")
      .reduce((sum, m) => sum + (m.quantidade ?? 0), 0);

    const selected = data.product_id
      ? products?.find((p) => p.id === data.product_id)
      : undefined;

    const estoqueAtual = selected
      ? (selected.quantidade ?? 0)
      : products?.reduce((s, p) => s + (p.quantidade ?? 0), 0) ?? 0;

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        tipo: data.tipo,
        datahora: nowIso,
        total_movimentos: totalMov,
        total_entrada: totalEntrada,
        total_saida: totalSaida,
        estoque_atual: estoqueAtual,
        periodo_inicio: startIso,
        periodo_fim: endIso,
        product_id: data.product_id ?? null,
        produto_nome: selected?.nome ?? null,
        observacao: data.observacao ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  });


export const deleteReport = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { error } = await supabase.from("reports").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });


export const getDashboardStats = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = createPublicClient();

    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("*");
    if (prodError) throw prodError;

    const { data: movements, error: movError } = await supabase
      .from("movements")
      .select("*");
    if (movError) throw movError;

    const totalProducts = products?.length ?? 0;
    const totalEntrada = movements
      ?.filter((m) => m.tipo === "entrada")
      .reduce((sum, m) => sum + (m.quantidade ?? 0), 0) ?? 0;
    const totalSaida = movements
      ?.filter((m) => m.tipo === "saida")
      .reduce((sum, m) => sum + (m.quantidade ?? 0), 0) ?? 0;
    const lowStock = products?.filter((p) => (p.quantidade ?? 0) <= 5).length ?? 0;

    return {
      totalProducts,
      totalEntrada,
      totalSaida,
      lowStock,
    };
  },
);

export const seedInitialData = createServerFn({ method: "POST" }).handler(
  async () => {
    const supabase = createPublicClient();

    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (countError) throw countError;
    if (count && count > 0) return { seeded: false };

    const now = new Date().toISOString();
    const seedProducts = [
      {
        nome: "Filé Mignon (Peça)",
        categoria: "Carne",
        quantidade: 42,
        unidade: "un",
        estoque: true,
        data_entrada: now,
      },
      {
        nome: "Petit Gateau",
        categoria: "Sobremesa",
        quantidade: 3,
        unidade: "un",
        estoque: true,
        data_entrada: now,
      },
      {
        nome: "Pimenta",
        categoria: "Tempero",
        quantidade: 5,
        unidade: "un",
        estoque: true,
        data_entrada: now,
      },
    ];

    const { data: inserted, error } = await supabase
      .from("products")
      .insert(seedProducts)
      .select();
    if (error) throw error;

    const movements = inserted?.flatMap((p) =>
      p.quantidade > 0
        ? [
            {
              product_id: p.id,
              categoria: p.categoria,
              tipo: "entrada" as const,
              quantidade: p.quantidade,
              unidade: p.unidade,
              data_movimento: now,
            },
          ]
        : [],
    );

    if (movements && movements.length > 0) {
      const { error: movError } = await supabase.from("movements").insert(movements);
      if (movError) throw movError;
    }

    return { seeded: true };
  },
);
