import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BrandProvider } from "@/hooks/useBrand";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ModuleLayout } from "@/components/ModuleLayout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Gestão - New module
import GestaoModule from "./pages/gestao/GestaoModule";

// Financeiro - New module
import FinanceiroModule from "./pages/financeiro-module/FinanceiroModule";

// Gestão (legacy)
import Associados from "./pages/Associados";
import Veiculos from "./pages/Veiculos";
import Sinistros from "./pages/Sinistros";
import Regionais from "./pages/Regionais";
import Cooperativas from "./pages/Cooperativas";
import Documentacao from "./pages/Documentacao";
import Vistorias from "./pages/Vistorias";
import Produtos from "./pages/Produtos";
import Usuarios from "./pages/Usuarios";
import Parametros from "./pages/Parametros";

// Financeiro
import FluxoDiario from "./pages/financeiro/FluxoDiario";
import Boletos from "./pages/financeiro/Boletos";
import Conciliacao from "./pages/financeiro/Conciliacao";
import RelatoriosFinanceiro from "./pages/financeiro/RelatoriosFinanceiro";

// Vendas
import DashboardVendas from "./pages/vendas/DashboardVendas";
import Pipeline from "./pages/vendas/Pipeline";
import VendasLista from "./pages/vendas/VendasLista";
import Contatos from "./pages/vendas/Contatos";

import NegociacaoDetalhe from "./pages/vendas/NegociacaoDetalhe";
import Atividades from "./pages/vendas/Atividades";
import Calendario from "./pages/vendas/Calendario";
import Afiliados from "./pages/vendas/Afiliados";
import VistoriasVendas from "./pages/vendas/VistoriasVendas";
import LandingPages from "./pages/vendas/LandingPages";
import RelatoriosVendas from "./pages/vendas/RelatoriosVendas";
import FinanceiroVendas from "./pages/vendas/Financeiro";
import FerramentasVendas from "./pages/vendas/FerramentasVendas";
import Metas from "./pages/vendas/Metas";
import Tags from "./pages/vendas/Tags";
import ImportarLeads from "./pages/vendas/ImportarLeads";
import MinhaEmpresa from "./pages/vendas/MinhaEmpresa";
import MinhaConta from "./pages/vendas/MinhaConta";
import ConfigComissoes from "./pages/vendas/ConfigComissoes";
import LandingPagePublica from "./pages/public/LandingPagePublica";
import VistoriaPublica from "./pages/public/VistoriaPublica";
import CotacaoPublica from "./pages/public/CotacaoPublica";
import CotacaoFormPublica from "./pages/public/CotacaoFormPublica";
import PlanoComparativo from "./pages/public/PlanoComparativo";
import ConsultorLanding from "./pages/public/ConsultorLanding";
import ExcecaoAprovacao from "./pages/public/ExcecaoAprovacao";
import PortalAfiliado from "./pages/public/PortalAfiliado";
import AuditLog from "./pages/gestao/AuditLog";

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

            {/* Gestão - New */}
            <Route path="/gestao/*" element={<ProtectedRoute permission="canViewGestao"><GestaoModule /></ProtectedRoute>} />
            <Route path="/financeiro/*" element={<ProtectedRoute permission="canVerFinanceiro"><FinanceiroModule /></ProtectedRoute>} />

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

            {/* Financeiro — admin/diretor only */}
            <Route path="/financeiro/fluxo-diario" element={<G><FluxoDiario /></G>} />
            <Route path="/financeiro/boletos" element={<G><Boletos /></G>} />
            <Route path="/financeiro/conciliacao" element={<G><Conciliacao /></G>} />
            <Route path="/financeiro/relatorios" element={<G><RelatoriosFinanceiro /></G>} />

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
          </BrandProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
