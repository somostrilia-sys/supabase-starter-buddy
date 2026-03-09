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
      {/* Left side - Hero with gradient */}
      <div className="hidden lg:flex lg:w-[58%] relative gradient-hero overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/6 blur-3xl translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-accent/5 blur-2xl -translate-x-1/2 -translate-y-1/2" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Top - Logo */}
          <div className="flex items-center gap-3">
            {brand.logoUrl && (
              <img src={brand.logoUrl} alt={brand.name} className="h-10 object-contain brightness-0 invert" />
            )}
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{brand.name}</h1>
              <p className="text-xs text-white/40 uppercase tracking-wider">{brand.subtitle}</p>
            </div>
          </div>

          {/* Center - Main content */}
          <div className="space-y-10 max-w-xl">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-accent font-medium">
                <Zap className="w-3.5 h-3.5" />
                Plataforma Inteligente de Gestão
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                Software completo para
                <span className="text-accent"> proteção veicular</span>
              </h2>
              <p className="text-base text-white/50 leading-relaxed max-w-md">
                Unifique vendas, financeiro e gestão com uma plataforma moderna, segura e escalável.
              </p>
            </div>

            {/* Feature cards - 2x2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="glass rounded-xl p-4 space-y-2.5 hover:bg-white/10 transition-colors group cursor-default">
                  <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
                    <f.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Differential highlight */}
            <div className="flex items-center gap-4 pt-2">
              {differentials.map((d) => (
                <div key={d.title} className="flex items-center gap-3 glass rounded-xl px-5 py-3">
                  <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                    <d.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{d.title}</p>
                    <p className="text-xs text-white/50">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          {/* Bottom */}
          <p className="text-xs text-white/20">
            © 2026 {brand.name} — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-[380px] space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:hidden space-y-3">
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
            <Button type="submit" className="w-full h-11 gradient-accent border-0 text-white font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all" disabled={loading}>
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
