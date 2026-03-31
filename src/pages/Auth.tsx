import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, LogIn, UserPlus, BarChart3, Users, Car, FileText, Zap, Lock, Globe } from "lucide-react";
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
        toast({ title: "Cadastro realizado!", description: "Verifique seu e-mail para confirmar a conta." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, title: "Gestão de Associados", desc: "Cadastro completo com planos e mensalidades integradas" },
    { icon: Car, title: "Controle de Veículos", desc: "Frota, vistorias e sinistros em uma única plataforma" },
    { icon: BarChart3, title: "Pipeline de Vendas", desc: "CRM completo com Kanban, metas e comissões" },
    { icon: FileText, title: "Financeiro Inteligente", desc: "Fluxo de caixa, boletos e conciliação automática" },
    { icon: Zap, title: "Suporte 24 horas", desc: "Atendimento especializado disponível a qualquer momento" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Esquerda — imagem + cards */}
      <div className="hidden lg:flex lg:w-[58%] flex-col">
        {/* Imagem fullscreen sem corte */}
        <div className="flex-1 min-h-0">
          <img
            src="/login-bg.png"
            alt="GIA"
            className="w-full h-full object-contain"
            style={{ display: 'block' }}
          />
        </div>

        {/* Cards de funcionalidades */}
        <div className="bg-[#0a1628] px-8 py-6">
          <div className="grid grid-cols-2 gap-3">
            {features.slice(0, 4).map((f) => (
              <div key={f.title} className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-sm text-white">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          {/* Card suporte — largura metade */}
          <div className="mt-3 w-1/2 pr-1.5">
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-sm text-white">Suporte 24 horas</h3>
              <p className="text-xs text-white/40 leading-relaxed">Atendimento especializado disponível a qualquer momento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Direita — fundo claro, logo + form */}
      <div className="flex-1 flex flex-col items-center justify-between p-8 sm:p-12 bg-gray-50">
        {/* Logo centralizada no topo */}
        <div className="w-full flex justify-center pt-4">
          {brand.logoUrl && (
            <img src={brand.logoUrl} alt={brand.name} className="h-16 object-contain" />
          )}
        </div>

        {/* Formulário centralizado */}
        <div className="w-full max-w-[360px] space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h2>
            <p className="text-sm text-gray-500">
              {isLogin ? "Acesse o sistema com suas credenciais" : "Preencha os dados para começar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm text-gray-700">Nome completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required className="h-11 bg-white border-gray-200" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-gray-700">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="h-11 bg-white border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm text-gray-700">Senha</Label>
                {isLogin && (
                  <button type="button" className="text-xs text-blue-600 hover:underline">Esqueceu a senha?</button>
                )}
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 bg-white border-gray-200" />
            </div>
            <Button type="submit" className="w-full h-11 font-semibold text-white" style={{ backgroundColor: '#003870' }} disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? <><LogIn className="mr-2 h-4 w-4" /> Entrar</> : <><UserPlus className="mr-2 h-4 w-4" /> Criar conta</>}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-3 text-gray-400">ou</span>
            </div>
          </div>

          <div className="text-center">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 hover:underline font-medium">
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Lock className="w-3.5 h-3.5" /><span>SSL Seguro</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Shield className="w-3.5 h-3.5" /><span>LGPD</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Globe className="w-3.5 h-3.5" /><span>Cloud</span>
            </div>
          </div>
        </div>

        <div className="w-full" /> {/* spacer bottom */}
      </div>
    </div>
  );
}
