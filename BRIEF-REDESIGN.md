# BRIEF — GIA Redesign UI/UX 2025

## Objetivo
Transformar o GIA de "amador com botões piscando" para um SaaS B2B profissional nível Intercom/HubSpot/Linear.

## Repo & Stack
- Repo local: `/Users/alexanderdonato/.openclaw-bolt2/workspace/gia`
- Stack: React 18 + TypeScript + Tailwind + shadcn/ui + Lucide
- Lovable project: `f1e10329-c68a-4fab-a7e2-d65789e03cb4`
- Supabase GIA: `fdtyxpgozbftxgsljbsu`

## Diagnóstico Atual (O que está ERRADO)

### 1. Animações excessivas / "piscando"
- `badge-glow`: `animation: badge-pulse 2.5s ease-in-out infinite` → **REMOVER COMPLETAMENTE**
- `animate-bg-circle`: círculos concêntricos girando no background do dashboard → **REMOVER**
- `animate-light-drift`, `animate-light-drift-2`, `animate-light-drift-3` → **REMOVER**
- `BackgroundEffects.tsx`: canvas animado com paths flutuantes no dashboard → **REMOVER COMPLETAMENTE** ou substituir por pattern estático
- Botões com hover state `btn-shimmer` (shimmer infinito) → manter apenas no hover, não infinito

### 2. Design genérico / amador
- Cards sem hierarquia visual clara
- Sidebar com muitos itens sem agrupamento visual sólido
- Pipeline kanban com cards sem polish (border-left colorida está ok, mas falta profundidade)
- Dashboard com gráficos "placeholder" e dados fake demais
- Tipografia inconsistente (mistura Source Serif 4 nos cards do Kanban com Inter no resto)
- Floating button (Nova Negociação) - posição pode conflitar em telas menores

### 3. CSS legado
- ~60 linhas de `/* ═══ Legacy color remapping ═══ */` com overrides `!important` → **LIMPAR**

---

## O que fazer (Prioridades)

### PRIORIDADE 1 — Matar animações desnecessárias (index.css + BackgroundEffects.tsx)

**Em `src/index.css`:**
1. Remover `.badge-glow { animation: badge-pulse... }` — manter a classe mas sem animação (só deixa a cor)
2. Remover `@keyframes badge-pulse` — não é mais necessário
3. Remover `.animate-bg-circle { animation: bg-circle-rotate... }` 
4. Remover `@keyframes bg-circle-rotate`
5. Remover `.animate-light-drift`, `.animate-light-drift-2`, `.animate-light-drift-3`
6. Remover `@keyframes light-drift`, `light-drift-2`, `light-drift-3`
7. Manter `.animate-fade-in-up` (entrada suave dos cards — isso é bom)
8. Manter `.btn-shimmer` mas tornar `transition` só no hover (já está assim — verificar)

**Em `src/components/BackgroundEffects.tsx`:**
- Substituir por um background estático elegante: dot pattern + gradiente sutil no canto
- NÃO usar canvas animado
- Manter apenas um gradiente radial estático muito suave no top-right

```tsx
// NOVO BackgroundEffects.tsx — estático, limpo
export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Dot grid pattern */}
      <div className="absolute inset-0 dot-pattern opacity-[0.4]" />
      {/* Top-right glow estático */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle at 70% 20%, hsl(217 90% 55% / 0.06) 0%, transparent 60%)",
        }}
      />
      {/* Bottom-left subtle */}
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 80%, hsl(222 70% 32% / 0.04) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
```

---

### PRIORIDADE 2 — Redesign do Sistema de Design (index.css)

**Nova paleta light mode (mais profissional, menos flat):**
```css
:root {
  /* Background levemente quente, não puro branco */
  --background: 220 14% 97%;
  --foreground: 222 47% 11%;

  /* Cards: branco puro com sombra sutil (não fundo cinza) */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  /* Primary: azul profundo da marca */
  --primary: 214 70% 32%;
  --primary-foreground: 0 0% 100%;

  /* Secondary: cinza frio */
  --secondary: 220 20% 94%;
  --secondary-foreground: 222 30% 25%;

  /* Muted */
  --muted: 220 16% 95%;
  --muted-foreground: 220 14% 52%;

  /* Accent: azul mais vivo para CTAs */
  --accent: 214 85% 50%;
  --accent-foreground: 0 0% 100%;

  /* Status */
  --destructive: 3 72% 54%;
  --warning: 36 92% 50%;
  --success: 142 71% 45%;

  /* Borders mais sutis */
  --border: 220 16% 91%;
  --input: 220 16% 91%;
  --ring: 214 85% 50%;
  --radius: 0.5rem;

  /* Sidebar: dark navy elegante */
  --sidebar-background: 220 40% 10%;
  --sidebar-foreground: 220 18% 72%;
  --sidebar-primary: 214 80% 60%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 35% 15%;
  --sidebar-accent-foreground: 220 18% 90%;
  --sidebar-border: 220 30% 14%;
}
```

**Nova paleta dark mode:**
```css
.dark {
  --background: 220 40% 7%;
  --foreground: 220 14% 92%;
  --card: 220 35% 11%;
  --card-foreground: 220 14% 92%;
  --primary: 214 80% 58%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 30% 17%;
  --secondary-foreground: 220 14% 92%;
  --muted: 220 28% 16%;
  --muted-foreground: 220 12% 55%;
  --accent: 214 80% 62%;
  --accent-foreground: 0 0% 100%;
  --border: 220 28% 18%;
  --input: 220 28% 18%;
  --ring: 214 80% 58%;
  --sidebar-background: 220 45% 6%;
  --sidebar-foreground: 220 14% 70%;
  --sidebar-primary: 214 80% 62%;
  --sidebar-accent: 220 35% 12%;
  --sidebar-border: 220 35% 10%;
}
```

**Remover todo o bloco `/* ═══ Legacy color remapping ═══ */`** (linhas com `!important` para cores antigas `hsl(212_35%...)`).

**Atualizar utilitários:**
```css
/* MANTER */
.dot-pattern { /* igual */ }
.glass { /* igual */ }
.animate-fade-in-up { /* igual */ }
.btn-shimmer { /* igual — só no hover */ }

/* REMOVER */
/* .badge-glow */
/* .animate-bg-circle */
/* .animate-light-drift* */
/* todo bloco legacy remapping */
/* .orb, .orb-1, .orb-2, .orb-3 */  /* só usado na tela de login — avaliar manter ou não */
```

---

### PRIORIDADE 3 — AppSidebar (AppSidebar.tsx)

**Problemas:**
- `ModuleGroup` abre/fecha mas visual não é polido o suficiente
- Hover e active state pouco distintos

**Melhorias:**
1. Adicionar separador visual (`hr` ou `div h-px`) entre grupos (Gestão / Financeiro / Vendas)
2. O label do grupo (GESTÃO, FINANCEIRO, VENDAS) deve ter ícone de módulo no lado e ficar com texto `uppercase tracking-[0.12em]` size `[9px]`
3. Items ativos: adicionar `rounded-md` no active ao invés de só `border-l-[3px]` (fica mais moderno)
4. Sidebar footer: melhorar visual do email e botão logout
5. Manter a estrutura dos itens — NÃO remover, NÃO reordenar

```tsx
// Active className melhorado:
activeClassName="bg-sidebar-accent/80 text-sidebar-primary font-medium rounded-md"

// Remover o border-l-[3px] lateral — fica agressivo demais
// Substituir por: indicador à esquerda via pseudo-elemento no CSS ou simplesmente background mais sólido
```

---

### PRIORIDADE 4 — Pipeline Kanban Cards (Pipeline.tsx)

**O card atual tem fonte `font-['Source_Serif_4']` no nome do lead** — inconsistente com o resto.

**Melhorias nos cards:**
1. **Remover `font-['Source_Serif_4']`** de todos os cards — usar Inter/sistema
2. **Melhorar rounded:** `rounded-lg` ao invés de padrão quadrado
3. **Sombra mais pronunciada no hover:** `hover:shadow-lg hover:-translate-y-0.5`
4. **Header do card:** 
   - Nome do lead em `text-sm font-semibold` (sem serif)
   - Código em `text-[10px] font-mono text-muted-foreground/60`
5. **Footer do consultor:**
   - Avatar circular mais polido: adicionar `ring-1 ring-primary/20`
6. **Floating button "Nova Negociação":**
   - Adicionar `shadow-2xl shadow-primary/20`
   - Adicionar `transition-all hover:scale-105`
7. **Column header:**
   - Aumentar padding do label para `px-4 pt-4 pb-3`
   - Badge de contagem: usar solid color do módulo ao invés de outline

**Column backgrounds (mais sutis e profissionais):**
- Ao invés de `bg-X-50/80`, usar `bg-muted/30` (light) ou `bg-card/50` (dark) com borda colorida no topo apenas

---

### PRIORIDADE 5 — StatCard (StatCard.tsx)

Ver o arquivo e garantir:
1. Shadow `shadow-sm hover:shadow-md` com transição suave
2. Sem animação de pulse ou blink
3. Ícone do card com background colorido sutil (`bg-primary/8 rounded-lg p-2`)
4. Trend indicator (▲/▼) com cor verde/vermelho limpa, sem glow

---

### PRIORIDADE 6 — Tipografia unificada

1. Remover todas as classes `font-['Source_Serif_4']` e `font-listing` dos componentes de dados (cards kanban, tabelas, badges)
2. Manter Source Serif 4 APENAS se houver títulos decorativos grandes (h1 de módulo hero)
3. Padronizar: Inter para tudo operacional

---

### PRIORIDADE 7 — Melhorias de polish global

**Badges (StatusBadge.tsx / badges inline):**
- Remover `.badge-glow` de todos os lugares
- Usar apenas cor sólida suave: `bg-green-500/12 text-green-700 border-green-500/20`

**Modals:**
- Header com `border-b pb-4` mais claro
- Botão primário no footer: padding `px-6`

**Forms:**
- Input focus ring: `focus-visible:ring-2 focus-visible:ring-ring/50` (não o anel grosso atual)

---

## Referências Visuais

Inspiração para cada elemento:

| Elemento | Referência |
|----------|-----------|
| Sidebar | Linear.app — dark navy, grupos colapsáveis, sem borda ativa pesada |
| Kanban | Leantime.io — cards limpos, shadow no hover, sem animação excessiva |
| Dashboard KPIs | Intercom Pulse — ícone em background colorido suave, number bold |
| Status badges | GitHub Issues — solid color subtle, sem pulse |
| Background | Vercel Dashboard — dot pattern estático, sem canvas animado |
| Tipografia | Notion, Linear — Inter ou system-ui, sem serif em dados |

---

## Workflow

1. Editar `src/index.css`:
   - Remover todas animações desnecessárias
   - Atualizar tokens CSS (light + dark)
   - Remover bloco legacy remapping

2. Editar `src/components/BackgroundEffects.tsx`:
   - Substituir canvas animado por versão estática

3. Editar `src/components/AppSidebar.tsx`:
   - Melhorar active state dos itens
   - Adicionar separadores entre grupos

4. Editar `src/components/StatCard.tsx`:
   - Remover badge-glow
   - Melhorar shadow/hover

5. Editar `src/pages/vendas/Pipeline.tsx`:
   - Remover Source Serif 4 dos cards
   - Melhorar kanban cards visual
   - Melhorar floating button

6. Buscar e remover **todas as ocorrências** de:
   - `badge-glow`
   - `font-['Source_Serif_4']`
   - `font-listing`
   - `animate-bg-circle`
   - `animate-light-drift`
   - `<BackgroundEffects />` nos módulos que não sejam o dashboard principal

7. Commit com mensagem: `design: polish UI - remove excessive animations, unify typography, improve kanban cards`

8. **NÃO alterar lógica de negócio, queries Supabase, ou estrutura de rotas**
9. **NÃO alterar o schema do banco ou Edge Functions**
10. **NÃO criar novos arquivos além dos editados acima**

---

## Git
- Remote: `https://github.com/somostrilia-sys/supabase-starter-buddy`
- Token: `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`
- Branch: `main`
- Ao final: `git add -A && git commit -m "design: polish UI - remove excessive animations, unify typography, improve kanban cards" && git push`
