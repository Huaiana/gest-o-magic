ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ultima_reposicao timestamptz;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS periodo_inicio timestamptz;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS periodo_fim timestamptz;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS observacao text;

-- Backfill ultima_reposicao from last entrada movement per product
UPDATE public.products p
SET ultima_reposicao = sub.last_in
FROM (
  SELECT product_id, MAX(data_movimento) AS last_in
  FROM public.movements
  WHERE tipo = 'entrada'
  GROUP BY product_id
) sub
WHERE p.id = sub.product_id AND p.ultima_reposicao IS NULL;