import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BrandProvider } from "@/hooks/useBrand";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleLayout } from "@/components/ModuleLayout";

// Eager imports — small, frequently used, first-paint critical
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Alertas from "./pages/Alertas";
import NotFound from "./pages/NotFound";

// Loading spinner for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

// --- Lazy imports: heavy pages split into separate chunks ---

// Gestão - New module
const GestaoModule = React.lazy(() => import("./pages/gestao/GestaoModule"));

// Financeiro - New module
const FinanceiroModule = React.lazy(() => import("./pages/financeiro-module/FinanceiroModule"));

// Gestão (legacy)
const Associados = React.lazy(() => import("./pages/Associados"));
const Veiculos = React.lazy(() => import("./pages/Veiculos"));
const Sinistros = React.lazy(() => import("./pages/Sinistros"));
const Regionais = React.lazy(() => import("./pages/Regionais"));
const Cooperativas = React.lazy(() => import("./pages/Cooperativas"));
const Documentacao = React.lazy(() => import("./pages/Documentacao"));
const Vistorias = React.lazy(() => import("./pages/Vistorias"));
const Produtos = React.lazy(() => import("./pages/Produtos"));
const Usuarios = React.lazy(() => import("./pages/Usuarios"));
const Parametros = React.lazy(() => import("./pages/Parametros"));

// Financeiro
const FluxoDiario = React.lazy(() => import("./pages/financeiro/FluxoDiario"));
const Boletos = React.lazy(() => import("./pages/financeiro/Boletos"));
const Conciliacao = React.lazy(() => import("./pages/financeiro/Conciliacao"));
const RelatoriosFinanceiro = React.lazy(() => import("./pages/financeiro/RelatoriosFinanceiro"));

// Vendas
const DashboardVendas = React.lazy(() => import("./pages/vendas/DashboardVendas"));
const Pipeline = React.lazy(() => import("./pages/vendas/Pipeline"));
const VendasLista = React.lazy(() => import("./pages/vendas/VendasLista"));
const Contatos = React.lazy(() => import("./pages/vendas/Contatos"));
const NegociacaoDetalhe = React.lazy(() => import("./pages/vendas/NegociacaoDetalhe"));
const Atividades = React.lazy(() => import("./pages/vendas/Atividades"));
const Calendario = React.lazy(() => import("./pages/vendas/Calendario"));
const Afiliados = React.lazy(() => import("./pages/vendas/Afiliados"));
const VistoriasVendas = React.lazy(() => import("./pages/vendas/VistoriasVendas"));
const LandingPages = React.lazy(() => import("./pages/vendas/LandingPages"));
const RelatoriosVendas = React.lazy(() => import("./pages/vendas/RelatoriosVendas"));
const FinanceiroVendas = React.lazy(() => import("./pages/vendas/Financeiro"));
const FerramentasVendas = React.lazy(() => import("./pages/vendas/FerramentasVendas"));
const Metas = React.lazy(() => import("./pages/vendas/Metas"));
const Tags = React.lazy(() => import("./pages/vendas/Tags"));
const ImportarLeads = React.lazy(() => import("./pages/vendas/ImportarLeads"));
const MinhaEmpresa = React.lazy(() => import("./pages/vendas/MinhaEmpresa"));
const MinhaConta = React.lazy(() => import("./pages/vendas/MinhaConta"));
const ConfigComissoes = React.lazy(() => import("./pages/vendas/ConfigComissoes"));

// Public pages
const LandingPagePublica = React.lazy(() => import("./pages/public/LandingPagePublica"));
const VistoriaPublica = React.lazy(() => import("./pages/public/VistoriaPublica"));
const CotacaoPublica = React.lazy(() => import("./pages/public/CotacaoPublica"));
const CotacaoFormPublica = React.lazy(() => import("./pages/public/CotacaoFormPublica"));
const PlanoComparativo = React.lazy(() => import("./pages/public/PlanoComparativo"));
const ConsultorLanding = React.lazy(() => import("./pages/public/ConsultorLanding"));
const ExcecaoAprovacao = React.lazy(() => import("./pages/public/ExcecaoAprovacao"));
const PortalAfiliado = React.lazy(() => import("./pages/public/PortalAfiliado"));
const AuditLog = React.lazy(() => import("./pages/gestao/AuditLog"));
const WhatsAppConversas = React.lazy(() => import("./pages/gestao/whatsapp/Conversas"));

const queryClient = new QueryClient();

// Dashboard layout - simple, no sidebar
const D = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="min-h-screen bg-background">
      <main className="p-6">{children}</main>
    </div>
  </ProtectedRoute>
);

// Module layout - top nav bar
const M = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <ModuleLayout>{children}</ModuleLayout>
  </ProtectedRoute>
);

// Gestão layout - protected for admin/diretor only
const G = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute permission="canViewGestao">
    <ModuleLayout>{children}</ModuleLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BrandProvider>
          <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/lp/:slug" element={<LandingPagePublica />} />
            <Route path="/vistoria/:token" element={<VistoriaPublica />} />
            <Route path="/cotacao" element={<CotacaoFormPublica />} />
            <Route path="/cotacao/:id" element={<CotacaoPublica />} />
            <Route path="/planos/:id" element={<PlanoComparativo />} />
            <Route path="/c/:slug" element={<ConsultorLanding />} />
            <Route path="/aprovacao/:token" element={<ExcecaoAprovacao />} />
            <Route path="/excecao/:token" element={<ExcecaoAprovacao />} />
            <Route path="/afiliado/:token" element={<PortalAfiliado />} />
            <Route path="/" element={<D><Dashboard /></D>} />
            <Route path="/alertas" element={<D><Alertas /></D>} />

            {/* Gestão (legacy) — admin/diretor only */}
            <Route path="/associados" element={<G><Associados /></G>} />
            <Route path="/veiculos" element={<G><Veiculos /></G>} />
            <Route path="/sinistros" element={<G><Sinistros /></G>} />
            <Route path="/regionais" element={<G><Regionais /></G>} />
            <Route path="/cooperativas" element={<G><Cooperativas /></G>} />
            <Route path="/documentacao" element={<G><Documentacao /></G>} />
            <Route path="/vistorias" element={<G><Vistorias /></G>} />
            <Route path="/produtos" element={<G><Produtos /></G>} />
            <Route path="/usuarios" element={<G><Usuarios /></G>} />
            <Route path="/parametros" element={<G><Parametros /></G>} />
            <Route path="/gestao/auditoria" element={<G><AuditLog /></G>} />
            <Route path="/gestao/whatsapp" element={<G><WhatsAppConversas /></G>} />

            {/* Financeiro — specific routes before wildcard */}
            <Route path="/financeiro/fluxo-diario" element={<G><FluxoDiario /></G>} />
            <Route path="/financeiro/boletos" element={<G><Boletos /></G>} />
            <Route path="/financeiro/conciliacao" element={<G><Conciliacao /></G>} />
            <Route path="/financeiro/relatorios" element={<G><RelatoriosFinanceiro /></G>} />

            {/* Gestão & Financeiro modules (wildcard — must come after specific routes) */}
            <Route path="/gestao/*" element={<ProtectedRoute permission="canViewGestao"><GestaoModule /></ProtectedRoute>} />
            <Route path="/financeiro/*" element={<ProtectedRoute permission="canVerFinanceiro"><FinanceiroModule /></ProtectedRoute>} />

            {/* Vendas */}
            <Route path="/vendas/dashboard" element={<M><DashboardVendas /></M>} />
            <Route path="/vendas/pipeline" element={<M><Pipeline /></M>} />
            <Route path="/vendas/negociacoes" element={<M><VendasLista /></M>} />
            <Route path="/vendas/negociacao/:id" element={<M><NegociacaoDetalhe /></M>} />
            <Route path="/vendas/contatos" element={<M><Contatos /></M>} />
            <Route path="/vendas/atividades" element={<M><Atividades /></M>} />
            <Route path="/vendas/calendario" element={<M><Calendario /></M>} />
            <Route path="/vendas/metas" element={<M><Metas /></M>} />
            <Route path="/vendas/tags" element={<M><Tags /></M>} />
            <Route path="/vendas/importar" element={<M><ImportarLeads /></M>} />
            <Route path="/vendas/afiliados" element={<M><Afiliados /></M>} />
            <Route path="/vendas/vistorias" element={<M><VistoriasVendas /></M>} />
            <Route path="/vendas/landing-pages" element={<M><LandingPages /></M>} />
            <Route path="/vendas/relatorios" element={<M><RelatoriosVendas /></M>} />
            <Route path="/vendas/financeiro" element={<M><FinanceiroVendas /></M>} />
            <Route path="/vendas/ferramentas" element={<M><FerramentasVendas /></M>} />
            <Route path="/vendas/minha-empresa" element={<M><MinhaEmpresa /></M>} />
            <Route path="/vendas/minha-conta" element={<M><MinhaConta /></M>} />
            <Route path="/vendas/comissoes" element={<M><ConfigComissoes /></M>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </BrandProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
