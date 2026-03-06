import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, LogIn, UserPlus, BarChart3, Users, Car, FileText } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    { icon: Users, title: "Gestão de Associados", desc: "Cadastro completo, planos e mensalidades" },
    { icon: Car, title: "Controle de Veículos", desc: "Frota, vistorias e sinistros integrados" },
    { icon: BarChart3, title: "Pipeline de Vendas", desc: "CRM completo com Kanban e metas" },
    { icon: FileText, title: "Financeiro Inteligente", desc: "Fluxo de caixa e categorização automática" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Banner / Propaganda - lado esquerdo */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-primary overflow-hidden">
        {/* Padrão de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-primary-foreground">
          {/* Topo */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">GIA</h1>
                <p className="text-sm opacity-80">Gestão Integrada de Associações</p>
              </div>
            </div>
          </div>

          {/* Centro - destaque */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight max-w-md">
                Tudo que sua associação precisa em um só lugar.
              </h2>
              <p className="mt-4 text-lg opacity-80 max-w-lg">
                Unifique vendas, financeiro e gestão com uma plataforma moderna e completa.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-lg">
              {features.map((f) => (
                <div key={f.title} className="bg-white/10 backdrop-blur rounded-xl p-4 space-y-2">
                  <f.icon className="w-6 h-6" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs opacity-70 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-xs opacity-50">© 2026 GIA — Gestão Integrada de Associações</p>
        </div>
      </div>

      {/* Login - lado direito */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo mobile */}
          <div className="text-center lg:hidden space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">GIA</h1>
            <p className="text-sm text-muted-foreground">Gestão Integrada de Associações</p>
          </div>

          {/* Cabeçalho do form */}
          <div className="hidden lg:block space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? (
                <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
              ) : (
                <><UserPlus className="mr-2 h-4 w-4" /> Criar conta</>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
