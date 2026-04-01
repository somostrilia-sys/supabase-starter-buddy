import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, LogIn, UserPlus, Lock, Globe } from "lucide-react";
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
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {/* Imagem cobre tudo sem distorção */}
      <img
        src="/login-bg.png"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />

      {/* Formulário sobreposto no painel direito */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '43%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
      }}>
        {brand.logoUrl && (
          <img src={brand.logoUrl} alt={brand.name} style={{ height: '48px', objectFit: 'contain', marginBottom: '24px' }} />
        )}

        <div style={{
          width: '100%',
          maxWidth: '310px',
          borderRadius: '16px',
          padding: '28px 24px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}>
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>
              {isLogin ? "Bem-vindo de volta" : "Criar sua conta"}
            </h2>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {isLogin ? "Acesse o sistema com suas credenciais" : "Preencha os dados para começar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isLogin && (
              <div>
                <Label className="text-xs font-medium text-gray-600">Nome completo</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required className="h-10 bg-white border-gray-200 text-sm mt-1" />
              </div>
            )}
            <div>
              <Label className="text-xs font-medium text-gray-600">E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="h-10 bg-white border-gray-200 text-sm mt-1" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <Label className="text-xs font-medium text-gray-600">Senha</Label>
                {isLogin && <button type="button" style={{ fontSize: '11px', color: '#2563EB' }}>Esqueceu?</button>}
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10 bg-white border-gray-200 text-sm" />
            </div>
            <Button type="submit" className="w-full h-10 font-semibold text-white text-sm" style={{ backgroundColor: '#003870' }} disabled={loading}>
              {loading ? "Aguarde..." : isLogin
                ? <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
                : <><UserPlus className="mr-2 h-4 w-4" /> Criar conta</>}
            </Button>
          </form>

          <div style={{ position: 'relative', margin: '14px 0', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #e5e7eb' }} />
            <span style={{ position: 'relative', background: 'white', padding: '0 10px', fontSize: '10px', color: '#bbb', textTransform: 'uppercase' }}>ou</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ fontSize: '12px', color: '#2563EB' }}>
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            {[{ icon: Lock, label: 'SSL' }, { icon: Shield, label: 'LGPD' }, { icon: Globe, label: 'Cloud' }].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#bbb' }}>
                <Icon style={{ width: '12px', height: '12px' }} />{label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
