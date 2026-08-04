CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  quantidade integer NOT NULL DEFAULT 0,
  unidade text NOT NULL,
  estoque boolean NOT NULL DEFAULT false,
  data_entrada timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  categoria text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade integer NOT NULL,
  unidade text NOT NULL,
  data_movimento timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  datahora timestamptz NOT NULL DEFAULT now(),
  total_movimentos integer NOT NULL DEFAULT 0,
  total_entrada integer NOT NULL DEFAULT 0,
  total_saida integer NOT NULL DEFAULT 0,
  estoque_atual integer NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.movements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movements TO authenticated;
GRANT ALL ON public.movements TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access on products" ON public.products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access on movements" ON public.movements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on movements" ON public.movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access on reports" ON public.reports FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on reports" ON public.reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
