-- Contas a Receber
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  cliente TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Outros',
  data_vencimento DATE NOT NULL,
  data_recebimento DATE NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, recebido, atrasado
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_contas_receber" ON public.contas_receber FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contas a Pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  fornecedor TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Operacional',
  data_vencimento DATE NOT NULL,
  data_pagamento DATE NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, atrasado
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_contas_pagar" ON public.contas_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
