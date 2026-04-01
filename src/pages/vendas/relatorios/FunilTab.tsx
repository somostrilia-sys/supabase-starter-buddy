import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STAGES_ORDER = [
  { key: "novo_lead", label: "Novo Lead" },
  { key: "em_contato", label: "Em Contato" },
  { key: "em_negociacao", label: "Em Negociação" },
  { key: "aguardando_vistoria", label: "Ag. Vistoria" },
  { key: "liberado_cadastro", label: "Lib. Cadastro" },
  { key: "concluido", label: "Concluído" },
];

export default function FunilTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["funil-negociacoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("negociacoes")
        .select("id, stage");
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando funil...</span>
      </div>
    );
  }

  const negociacoes = data || [];

  // Count by stage following funnel order
  const funilData = STAGES_ORDER.map((s) => ({
    etapa: s.label,
    qtd: negociacoes.filter((n: any) => n.stage === s.key).length,
  }));

  // Conversion rates between consecutive stages
  const conversoes = STAGES_ORDER.slice(0, -1).map((s, i) => {
    const current = funilData[i].qtd;
    const next = funilData[i + 1].qtd;
    const taxa = current > 0 ? (next / current) * 100 : 0;
    return {
      de: `${funilData[i].etapa} → ${funilData[i + 1].etapa}`,
      taxa,
    };
  });

  const gargalo = conversoes.length > 0
    ? conversoes.reduce((min, c) => c.taxa < min.taxa ? c : min, conversoes[0])
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-4">Funil de Vendas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funilData} margin={{ left: 10 }}>
              <XAxis dataKey="etapa" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="qtd" position="top" fontSize={12} fontWeight="bold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {conversoes.map((c) => (
          <Card key={c.de} className={gargalo && c.de === gargalo.de ? "border-red-300 bg-destructive/50 dark:bg-red-950/20" : ""}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">{c.de}</p>
              <p className={`text-xl font-bold ${gargalo && c.de === gargalo.de ? "text-destructive" : ""}`}>{c.taxa.toFixed(1)}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {gargalo && (
        <Card className="border-red-200 bg-destructive/30 dark:bg-red-950/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">Gargalo Identificado</p>
              <p className="text-xs text-muted-foreground">{gargalo.de} — Menor taxa de conversão ({gargalo.taxa.toFixed(1)}%)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
