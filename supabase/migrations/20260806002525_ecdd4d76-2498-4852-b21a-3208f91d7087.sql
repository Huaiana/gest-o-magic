ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS quilos numeric;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS total_quilos numeric NOT NULL DEFAULT 0;