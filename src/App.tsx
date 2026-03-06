import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Gestão - New module
import GestaoModule from "./pages/gestao/GestaoModule";

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
import Pipeline from "./pages/vendas/Pipeline";
import VendasLista from "./pages/vendas/VendasLista";
import Contatos from "./pages/vendas/Contatos";
import NegociacaoDetalhe from "./pages/vendas/NegociacaoDetalhe";
import Atividades from "./pages/vendas/Atividades";
import Calendario from "./pages/vendas/Calendario";
import Afiliados from "./pages/vendas/Afiliados";
import RelatoriosVendas from "./pages/vendas/RelatoriosVendas";
import FinanceiroVendas from "./pages/vendas/Financeiro";
import FerramentasVendas from "./pages/vendas/FerramentasVendas";
import Metas from "./pages/vendas/Metas";
import Tags from "./pages/vendas/Tags";
import Formularios from "./pages/vendas/Formularios";
import ImportarLeads from "./pages/vendas/ImportarLeads";
import MinhaEmpresa from "./pages/vendas/MinhaEmpresa";

const queryClient = new QueryClient();

const L = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<L><Dashboard /></L>} />

            {/* Gestão - New */}
            <Route path="/gestao/*" element={<ProtectedRoute><AppLayout><GestaoModule /></AppLayout></ProtectedRoute>} />

            {/* Gestão (legacy) */}
            <Route path="/associados" element={<L><Associados /></L>} />
            <Route path="/veiculos" element={<L><Veiculos /></L>} />
            <Route path="/sinistros" element={<L><Sinistros /></L>} />
            <Route path="/regionais" element={<L><Regionais /></L>} />
            <Route path="/cooperativas" element={<L><Cooperativas /></L>} />
            <Route path="/documentacao" element={<L><Documentacao /></L>} />
            <Route path="/vistorias" element={<L><Vistorias /></L>} />
            <Route path="/produtos" element={<L><Produtos /></L>} />
            <Route path="/usuarios" element={<L><Usuarios /></L>} />
            <Route path="/parametros" element={<L><Parametros /></L>} />

            {/* Financeiro */}
            <Route path="/financeiro/fluxo-diario" element={<L><FluxoDiario /></L>} />
            <Route path="/financeiro/boletos" element={<L><Boletos /></L>} />
            <Route path="/financeiro/conciliacao" element={<L><Conciliacao /></L>} />
            <Route path="/financeiro/relatorios" element={<L><RelatoriosFinanceiro /></L>} />

            {/* Vendas */}
            <Route path="/vendas/pipeline" element={<L><Pipeline /></L>} />
            <Route path="/vendas/negociacoes" element={<L><VendasLista /></L>} />
            <Route path="/vendas/negociacao/:id" element={<L><NegociacaoDetalhe /></L>} />
            <Route path="/vendas/contatos" element={<L><Contatos /></L>} />
            <Route path="/vendas/atividades" element={<L><Atividades /></L>} />
            <Route path="/vendas/calendario" element={<L><Calendario /></L>} />
            <Route path="/vendas/metas" element={<L><Metas /></L>} />
            <Route path="/vendas/tags" element={<L><Tags /></L>} />
            <Route path="/vendas/formularios" element={<L><Formularios /></L>} />
            <Route path="/vendas/importar" element={<L><ImportarLeads /></L>} />
            <Route path="/vendas/afiliados" element={<L><Afiliados /></L>} />
            <Route path="/vendas/relatorios" element={<L><RelatoriosVendas /></L>} />
            <Route path="/vendas/financeiro" element={<L><FinanceiroVendas /></L>} />
            <Route path="/vendas/ferramentas" element={<L><FerramentasVendas /></L>} />
            <Route path="/vendas/minha-empresa" element={<L><MinhaEmpresa /></L>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
