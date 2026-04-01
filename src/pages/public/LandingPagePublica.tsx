import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Phone, CheckCircle, Car, Users, Clock } from "lucide-react";

export default function LandingPagePublica() {
  const { slug } = useParams<{ slug: string }>();
  const [lp, setLp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", veiculo: "" });
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from("landing_pages" as any).select("*, profiles:consultor_id(nome, avatar_url, phone)")
      .eq("slug", slug).eq("ativa", true).maybeSingle()
      .then(({ data }) => { setLp(data); setLoading(false); });

    // Incrementar visualizações
    supabase.rpc("increment_visualizacoes" as any, { slug_param: slug }).catch(() => {});
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.telefone) return;

    // Verificar ref de afiliado na URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    await supabase.from("negociacoes" as any).insert({
      lead_nome: form.nome,
      telefone: form.telefone,
      email: form.email || null,
      veiculo_modelo: form.veiculo || null,
      stage: "novo_lead",
      consultor_id: lp?.consultor_id,
      origem: `landing_page_${slug}`,
    } as any);

    if (ref) {
      const { data: afiliado } = await supabase.from("afiliados" as any).select("id").eq("codigo", ref).maybeSingle();
      if (afiliado) {
        // Registrar indicação (simplificado)
      }
    }

    setEnviado(true);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#1A3A5C]"><p className="text-white">Carregando...</p></div>;
  if (!lp) return <div className="min-h-screen flex items-center justify-center"><p>Página não encontrada</p></div>;

  const cor = (lp.cores as any)?.primaria || "#1A3A5C";

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: cor }}>
        <Card className="max-w-md w-full mx-4 rounded-none">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-xl font-bold">Recebemos seus dados!</h2>
            <p className="text-muted-foreground">Um consultor entrará em contato em breve.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: cor }}>
      {/* Header */}
      <div className="text-white text-center py-12 px-4">
        <h1 className="text-3xl font-bold mb-2">{lp.titulo || "Proteção Veicular"}</h1>
        <p className="text-white/80 max-w-lg mx-auto">{lp.descricao || "Proteja seu veículo com quem entende do assunto"}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12 grid md:grid-cols-2 gap-8">
        {/* Benefícios */}
        <div className="space-y-4">
          {[
            { icon: Shield, text: "Proteção contra colisão, roubo e furto" },
            { icon: Clock, text: "Assistência 24h em todo território nacional" },
            { icon: Car, text: "Carro reserva incluso" },
            { icon: Users, text: "Mais de 30 unidades pelo Brasil" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-white">
              <b.icon className="h-6 w-6 shrink-0" />
              <span>{b.text}</span>
            </div>
          ))}

          {/* Consultor */}
          <Card className="rounded-none mt-6">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#1A3A5C] flex items-center justify-center text-white text-xl font-bold">
                {((lp.profiles as any)?.nome || "C")[0]}
              </div>
              <div>
                <p className="font-semibold">{(lp.profiles as any)?.nome || "Consultor"}</p>
                {lp.whatsapp && (
                  <a href={`https://wa.me/55${lp.whatsapp.replace(/\D/g, "")}`} className="text-success text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />{lp.whatsapp}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        <Card className="rounded-none">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">Solicite sua cotação gratuita</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Seu nome *" required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="rounded-none" />
              <Input placeholder="Telefone / WhatsApp *" required value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className="rounded-none" />
              <Input placeholder="E-mail" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-none" />
              <Input placeholder="Veículo (ex: Honda Civic 2024)" value={form.veiculo} onChange={e => setForm(f => ({ ...f, veiculo: e.target.value }))} className="rounded-none" />
              <Button type="submit" className="w-full rounded-none text-white" style={{ backgroundColor: cor }}>
                Solicitar Cotação Gratuita
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">Seus dados estão seguros. Não compartilhamos com terceiros.</p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
