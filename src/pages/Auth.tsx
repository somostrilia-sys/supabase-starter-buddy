import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, LogIn, UserPlus, BarChart3, Users, Car, FileText, Zap, Lock, Globe } from "lucide-react";

const features = [
  { icon: Users, title: "Gestão de Associados", desc: "Cadastro completo com planos e mensalidades integradas" },
  { icon: Car, title: "Controle de Veículos", desc: "Frota, vistorias e sinistros em uma única plataforma" },
  { icon: BarChart3, title: "Pipeline de Vendas", desc: "CRM completo com Kanban, metas e comissões" },
  { icon: FileText, title: "Financeiro Inteligente", desc: "Fluxo de caixa, boletos e conciliação automática" },
  { icon: Zap, title: "Suporte 24 horas", desc: "Atendimento especializado disponível a qualquer momento" },
];

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
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
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

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* CARDS — painel esquerdo, faixa 55vh-90vh, centralizado em 0-57% da largura */}
      <div style={{
        position: 'absolute',
        top: '55vh',
        bottom: '8vh',
        left: 0,
        width: '57%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 6%',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div className="grid grid-cols-2 gap-2">
            {features.slice(0, 4).map((f) => (
              <div key={f.title} className="rounded-xl p-3 space-y-1.5" style={{
                backgroundColor: 'rgba(5,15,35,0.75)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(6px)',
              }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
                  <f.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="font-semibold text-xs text-white leading-tight">{f.title}</h3>
                <p className="text-[11px] text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-2" style={{ width: '47%' }}>
            <div className="rounded-xl p-3 space-y-1.5" style={{
              backgroundColor: 'rgba(5,15,35,0.75)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(6px)',
            }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2563EB' }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="font-semibold text-xs text-white leading-tight">Suporte 24 horas</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">Atendimento especializado disponível a qualquer momento</p>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO — painel direito, abaixo da logo GIA (50vh), centralizado em 57-100% da largura */}
      <div style={{
        position: 'absolute',
        top: '50vh',
        bottom: '4vh',
        left: '57%',
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5%',
      }}>
        <div className="w-full rounded-2xl p-6 space-y-4" style={{
          maxWidth: '320px',
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
        }}>
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: '#1a1a2e' }}>
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h2>
            <p className="text-xs" style={{ color: '#888' }}>
              {isLogin ? "Acesse o sistema com suas credenciais" : "Preencha os dados para começar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-600">Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required className="h-9 bg-white border-gray-200 text-sm" />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600">E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="h-9 bg-white border-gray-200 text-sm" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600">Senha</Label>
                {isLogin && <button type="button" className="text-[11px] text-blue-600 hover:underline">Esqueceu?</button>}
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-9 bg-white border-gray-200 text-sm" />
            </div>
            <Button type="submit" className="w-full h-9 font-semibold text-white text-sm" style={{ backgroundColor: '#003870' }} disabled={loading}>
              {loading ? "Aguarde..." : isLogin
                ? <><LogIn className="mr-2 h-3.5 w-3.5" /> Entrar</>
                : <><UserPlus className="mr-2 h-3.5 w-3.5" /> Criar conta</>}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400">ou</span>
            </div>
          </div>

          <div className="text-center">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs text-blue-600 hover:underline font-medium">
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-[11px] text-gray-400"><Lock className="w-3 h-3" /><span>SSL</span></div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400"><Shield className="w-3 h-3" /><span>LGPD</span></div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400"><Globe className="w-3 h-3" /><span>Cloud</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
