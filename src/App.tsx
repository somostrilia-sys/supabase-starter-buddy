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
import Associados from "./pages/Associados";
import Veiculos from "./pages/Veiculos";
import Financeiro from "./pages/Financeiro";
import Sinistros from "./pages/Sinistros";
import Regionais from "./pages/Regionais";
import Cooperativas from "./pages/Cooperativas";
import Documentacao from "./pages/Documentacao";
import Vistorias from "./pages/Vistorias";
import Produtos from "./pages/Produtos";
import Usuarios from "./pages/Usuarios";
import Parametros from "./pages/Parametros";
import NotFound from "./pages/NotFound";

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
            <Route path="/associados" element={<P><Associados /></P>} />
            <Route path="/veiculos" element={<P><Veiculos /></P>} />
            <Route path="/financeiro" element={<P><Financeiro /></P>} />
            <Route path="/sinistros" element={<P><Sinistros /></P>} />
            <Route path="/regionais" element={<P><Regionais /></P>} />
            <Route path="/cooperativas" element={<P><Cooperativas /></P>} />
            <Route path="/documentacao" element={<P><Documentacao /></P>} />
            <Route path="/vistorias" element={<P><Vistorias /></P>} />
            <Route path="/produtos" element={<P><Produtos /></P>} />
            <Route path="/usuarios" element={<P><Usuarios /></P>} />
            <Route path="/parametros" element={<P><Parametros /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
