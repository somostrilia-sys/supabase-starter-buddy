# BRIEF — GIA Thaina V2 (Relatório Técnico Completo)

## FONTE
Documento: gia.md.docx enviado por Thaina Santos em 26/03/2026

## RESTRIÇÃO GLOBAL
NÃO alterar layouts existentes. APENAS adicionar/corrigir conforme spec.

---

## PARTE 1 — MOTOR DE ELEGIBILIDADE DE PRODUTOS

### 1.1 Novas tabelas necessárias (migrations)
```sql
-- supabase/migrations/20260326000010_elegibilidade.sql
CREATE TABLE IF NOT EXISTS public.categorias_veiculo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL -- "automovel", "motocicleta", "pesado"
);

CREATE TABLE IF NOT EXISTS public.regionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  estado TEXT,
  cidade TEXT,
  cooperativa_id UUID
);

CREATE TABLE IF NOT EXISTS public.fornecedores_gia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  api_url TEXT,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.produtos_gia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores_gia(id),
  valor_base NUMERIC(10,2) DEFAULT 0,
  tipo TEXT DEFAULT 'principal', -- 'principal' | 'opcional'
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.planos_gia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.plano_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES public.planos_gia(id),
  produto_id UUID REFERENCES public.produtos_gia(id)
);

CREATE TABLE IF NOT EXISTS public.produto_regras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos_gia(id),
  categoria_id UUID REFERENCES public.categorias_veiculo(id),
  regional_id UUID REFERENCES public.regionais(id),
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.veiculo_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID REFERENCES public.veiculos(id),
  produto_id UUID REFERENCES public.produtos_gia(id),
  tipo TEXT DEFAULT 'principal'
);

-- Habilitar RLS em todas
ALTER TABLE public.categorias_veiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores_gia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_gia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_gia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculo_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all" ON public.categorias_veiculo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.regionais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.fornecedores_gia FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.produtos_gia FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.planos_gia FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.plano_produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.produto_regras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.veiculo_produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed categorias
INSERT INTO public.categorias_veiculo (nome) VALUES ('automovel'), ('motocicleta'), ('pesado') ON CONFLICT DO NOTHING;
```

### 1.2 Hook useElegibilidade (src/hooks/useElegibilidade.ts)
```ts
export function useProdutosElegiveis(categoriaId?: string, regionalId?: string, planoId?: string) {
  return useQuery({
    queryKey: ["produtos_elegiveis", categoriaId, regionalId, planoId],
    enabled: !!categoriaId && !!regionalId && !!planoId,
    queryFn: async () => {
      // Buscar produtos do plano que têm regra para esta categoria+regional
      const { data } = await supabase
        .from("plano_produtos")
        .select("produto_id, produtos_gia!inner(id, nome, valor_base, tipo, ativo, produto_regras!inner(categoria_id, regional_id, ativo))")
        .eq("plano_id", planoId)
        .eq("produtos_gia.ativo", true)
        .eq("produtos_gia.produto_regras.categoria_id", categoriaId)
        .eq("produtos_gia.produto_regras.regional_id", regionalId)
        .eq("produtos_gia.produto_regras.ativo", true);
      return data || [];
    }
  });
}
```

### 1.3 Integrar em CadastrarVeiculo.tsx e ConcretizarVendaModal.tsx
- Ao selecionar categoria do veículo → buscar regional do associado → chamar useProdutosElegiveis
- Exibir lista de produtos disponíveis (separados: principais e opcionais)
- VALIDAÇÃO OBRIGATÓRIA: ao menos 1 produto principal selecionado → bloquear save se não tiver
- Ao salvar: INSERT em veiculo_produtos para cada produto selecionado

---

## PARTE 2 — PIPELINE: CÓDIGO ÚNICO + BUSCA + RBAC + VISTORIA

### 2.1 Alterações na tabela leads
```sql
-- supabase/migrations/20260326000011_pipeline_v2.sql
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS codigo_negociacao TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS unidade_id UUID,
  ADD COLUMN IF NOT EXISTS usuario_id UUID;

-- Função para gerar código único
CREATE OR REPLACE FUNCTION public.gerar_codigo_negociacao()
RETURNS TEXT AS $$
DECLARE
  seq INT;
  codigo TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(codigo_negociacao, '-', 3) AS INT)), 0) + 1
  INTO seq
  FROM public.leads
  WHERE codigo_negociacao LIKE 'NEG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  codigo := 'NEG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq::TEXT, 4, '0');
  RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Trigger: gerar código ao inserir lead
CREATE OR REPLACE FUNCTION public.trigger_codigo_negociacao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo_negociacao IS NULL THEN
    NEW.codigo_negociacao := public.gerar_codigo_negociacao();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_codigo_negociacao ON public.leads;
CREATE TRIGGER set_codigo_negociacao
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_codigo_negociacao();

-- Templates de vistoria
CREATE TABLE IF NOT EXISTS public.vistoria_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.categorias_veiculo(id),
  nome_template TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vistoria_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.vistoria_templates(id),
  nome_item TEXT NOT NULL,
  obrigatorio BOOLEAN DEFAULT true
);

ALTER TABLE public.vistoria_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vistoria_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.vistoria_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON public.vistoria_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed templates padrão
INSERT INTO public.vistoria_templates (categoria_id, nome_template)
SELECT id, 'Vistoria Motocicleta' FROM public.categorias_veiculo WHERE nome='motocicleta' ON CONFLICT DO NOTHING;

INSERT INTO public.vistoria_templates (categoria_id, nome_template)
SELECT id, 'Vistoria Pesado' FROM public.categorias_veiculo WHERE nome='pesado' ON CONFLICT DO NOTHING;

INSERT INTO public.vistoria_templates (categoria_id, nome_template)
SELECT id, 'Vistoria Automóvel' FROM public.categorias_veiculo WHERE nome='automovel' ON CONFLICT DO NOTHING;
```

### 2.2 Pipeline CRM — Busca multi-critério (PipelineCRM.tsx ou similar)
Localizar o componente de Pipeline. Adicionar campo de busca com filtros:
- Input "Buscar..." com ícone de lupa
- Busca por: placa (exata), nome do associado (LIKE), código_negociacao (exato)
- Filtro de período: data_inicio e data_fim (DatePicker)
- Lógica de busca no useQuery:
```ts
let query = supabase.from("leads").select("*");
if (busca.placa) query = query.eq("placa", busca.placa.toUpperCase().replace(/\s/g,''));
if (busca.nome) query = query.ilike("nome_cliente", `%${busca.nome}%`);
if (busca.codigo) query = query.eq("codigo_negociacao", busca.codigo);
if (busca.dataInicio) query = query.gte("created_at", busca.dataInicio);
if (busca.dataFim) query = query.lte("created_at", busca.dataFim + "T23:59:59");
```
- Exibir código_negociacao em cada card do pipeline

### 2.3 RBAC — usePermission.ts (EXPANDIR)
Adicionar regras de escopo por unidade:
```ts
// CONSULTOR: só vê seus leads (usuario_id = user.id)
// GESTOR: vê todos da sua unidade (unidade_id = user.unidade_id)
// ADMIN/DIRETOR: vê todos
export function useLeadScope() {
  const { role, profile } = usePermission();
  if (role === 'consultor') return { usuario_id: profile?.id };
  if (role === 'gestor') return { unidade_id: profile?.unidade_id };
  return {}; // admin/diretor: sem restrição
}
```
Aplicar filtro de escopo nas queries de leads no Pipeline.

### 2.4 Vistoria — VistoriaTab ou CadastrarVistoria.tsx
- Ao abrir vistoria: buscar categoria do veículo → buscar template correspondente
- Renderizar campos obrigatórios do template (fotos)
- Validação: se item.obrigatorio && foto_não_enviada → bloquear conclusão
- Apenas ADMIN/DIRETOR pode criar/editar templates (usePermission isAdmin)

---

## PARTE 3 — CONSULTAS: CORREÇÃO DE BUSCA

### 3.1 Corrigir busca em AlterarAssociado.tsx (ou onde busca associados)
Localizar todos os pontos de busca de associados/veículos. Aplicar regras:

**Nome**: ILIKE com % controlado
```ts
query.ilike("nome", `%${termo.trim()}%`)
```

**Placa**: exata, normalizada
```ts
const placa = termo.toUpperCase().replace(/[\s-]/g, '');
query.eq("placa", placa)
```

**CPF/CNPJ**: exato, só dígitos
```ts
const doc = termo.replace(/\D/g, '');
query.eq("cpf", doc)
```

**Código/ID**: exato
```ts
query.eq("codigo_negociacao", termo.trim())
// OU
query.eq("id", termo.trim())
```

### 3.2 Busca mínima de 3 caracteres (já implementada, verificar)
- Se termo < 3 chars → não executar query, mostrar placeholder
- Mensagem: "Digite ao menos 3 caracteres para buscar"

---

## PASSOS FINAIS
npm run build
git add -A
git commit -m "feat: GIA Thaina v2 — elegibilidade produtos, pipeline RBAC, código negociação, vistoria templates, busca corrigida"
git push origin main

vercel --prod --token vcp_4pXT0TNEgektT8yojgEHgy2W8m2cp5oy3TdYqZNAH06uqy5MdV2rFFGE
openclaw system event --text "GIA Thaina v2 deployada — elegibilidade, pipeline RBAC, codigo negociação, busca corrigida" --mode now
