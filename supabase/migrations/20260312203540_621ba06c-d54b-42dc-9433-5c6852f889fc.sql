
CREATE TABLE public.member_statuses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo serial NOT NULL UNIQUE,
  descricao text NOT NULL,
  modulo text NOT NULL DEFAULT 'Associado',
  participa_fechamento boolean NOT NULL DEFAULT false,
  participa_rateio boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.member_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage member_statuses" ON public.member_statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read member_statuses" ON public.member_statuses FOR SELECT TO authenticated USING (true);

INSERT INTO public.member_statuses (descricao, modulo, participa_fechamento, participa_rateio, ativo) VALUES
  ('Ativo', 'Associado', true, true, true),
  ('Inativo', 'Associado', false, false, true),
  ('Pendente', 'Associado', false, false, true),
  ('Inadimplente', 'Associado', true, true, true),
  ('Negado', 'Associado', false, false, true),
  ('Inativo com Pendência', 'Associado', false, false, true),
  ('Pendente de Revistoria', 'Associado', false, false, true);
