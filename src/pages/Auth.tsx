import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, LogIn, UserPlus, BarChart3, Users, Car, FileText, ChevronRight, Zap, Lock, Globe } from "lucide-react";
import { useBrand } from "@/hooks/useBrand";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { brand } = useBrand();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, title: "Gestão de Associados", desc: "Cadastro completo com planos e mensalidades integradas" },
    { icon: Car, title: "Controle de Veículos", desc: "Frota, vistorias e sinistros em uma única plataforma" },
    { icon: BarChart3, title: "Pipeline de Vendas", desc: "CRM completo com Kanban, metas e comissões" },
    { icon: FileText, title: "Financeiro Inteligente", desc: "Fluxo de caixa, boletos e conciliação automática" },
  ];

  const differentials = [
    { icon: Zap, title: "Suporte 24 horas", desc: "Atendimento especializado disponível a qualquer momento" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Imagem GIA */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden" style={{ minHeight: '100vh' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/login-bg.png')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left center',
        }} />
      </div>

            {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-10 relative overflow-hidden">
        {/* Subtle orbs on right side too */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
        <div className="w-full max-w-[380px] space-y-8 relative z-10 login-glow">
          {/* Mobile logo */}
          <div className="text-center space-y-3">
            {brand.logoUrl && (
              <img src={brand.logoUrl} alt={brand.name} className="h-12 mx-auto object-contain" />
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{brand.name}</h1>
              <p className="text-sm text-muted-foreground">{brand.subtitle}</p>
            </div>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Acesse o sistema com suas credenciais" : "Preencha os dados para começar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="h-11"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {isLogin && (
                  <button type="button" className="text-xs text-accent hover:underline">
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 gradient-accent border-0 text-white font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all btn-shimmer" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? (
                <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Criar conta</>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-accent hover:underline font-medium"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span>SSL Seguro</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>LGPD</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span>Cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
