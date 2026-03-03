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

// Gestão
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
import Contatos from "./pages/vendas/Contatos";
import DealDetail from "./pages/vendas/DealDetail";
import Atividades from "./pages/vendas/Atividades";
import Calendario from "./pages/vendas/Calendario";
import Afiliados from "./pages/vendas/Afiliados";
import RelatoriosVendas from "./pages/vendas/RelatoriosVendas";
import Metas from "./pages/vendas/Metas";
import Tags from "./pages/vendas/Tags";
import Formularios from "./pages/vendas/Formularios";
import ImportarLeads from "./pages/vendas/ImportarLeads";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
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
            <Route path="/" element={<P><Dashboard /></P>} />

            {/* Gestão */}
            <Route path="/associados" element={<P><Associados /></P>} />
            <Route path="/veiculos" element={<P><Veiculos /></P>} />
            <Route path="/sinistros" element={<P><Sinistros /></P>} />
            <Route path="/regionais" element={<P><Regionais /></P>} />
            <Route path="/cooperativas" element={<P><Cooperativas /></P>} />
            <Route path="/documentacao" element={<P><Documentacao /></P>} />
            <Route path="/vistorias" element={<P><Vistorias /></P>} />
            <Route path="/produtos" element={<P><Produtos /></P>} />
            <Route path="/usuarios" element={<P><Usuarios /></P>} />
            <Route path="/parametros" element={<P><Parametros /></P>} />

            {/* Financeiro */}
            <Route path="/financeiro/fluxo-diario" element={<P><FluxoDiario /></P>} />
            <Route path="/financeiro/boletos" element={<P><Boletos /></P>} />
            <Route path="/financeiro/conciliacao" element={<P><Conciliacao /></P>} />
            <Route path="/financeiro/relatorios" element={<P><RelatoriosFinanceiro /></P>} />

            {/* Vendas */}
            <Route path="/vendas/pipeline" element={<P><Pipeline /></P>} />
            <Route path="/vendas/negociacao/:id" element={<P><DealDetail /></P>} />
            <Route path="/vendas/contatos" element={<P><Contatos /></P>} />
            <Route path="/vendas/atividades" element={<P><Atividades /></P>} />
            <Route path="/vendas/calendario" element={<P><Calendario /></P>} />
            <Route path="/vendas/metas" element={<P><Metas /></P>} />
            <Route path="/vendas/tags" element={<P><Tags /></P>} />
            <Route path="/vendas/formularios" element={<P><Formularios /></P>} />
            <Route path="/vendas/importar" element={<P><ImportarLeads /></P>} />
            <Route path="/vendas/afiliados" element={<P><Afiliados /></P>} />
            <Route path="/vendas/relatorios" element={<P><RelatoriosVendas /></P>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
