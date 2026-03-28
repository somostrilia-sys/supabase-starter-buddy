import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import { AlertTriangle } from "lucide-react";

const funilData = [
  { etapa: "Novo Lead", qtd: 112, color: "#3B82F6" },
  { etapa: "Em Negociação", qtd: 78, color: "#F59E0B" },
  { etapa: "Ag. Vistoria", qtd: 52, color: "#F97316" },
  { etapa: "Lib. Cadastro", qtd: 38, color: "#84CC16" },
  { etapa: "Concretizadas", qtd: 45, color: "#22C55E" },
];

const conversoes = [
  { de: "Novo Lead → Em Negociação", taxa: 69.6 },
  { de: "Em Negociação → Ag. Vistoria", taxa: 66.7 },
  { de: "Ag. Vistoria → Lib. Cadastro", taxa: 73.1 },
  { de: "Lib. Cadastro → Concretizadas", taxa: 118.4 },
];

export default function FunilTab() {
  const gargalo = conversoes.reduce((min, c) => c.taxa < min.taxa ? c : min, conversoes[0]);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {conversoes.map(c => (
          <Card key={c.de} className={c.de === gargalo.de ? "border-red-300 bg-destructive/8/50 dark:bg-red-950/20" : ""}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">{c.de}</p>
              <p className={`text-xl font-bold ${c.de === gargalo.de ? "text-red-600" : ""}`}>{c.taxa.toFixed(1)}%</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-red-200 bg-destructive/8/30 dark:bg-red-950/10">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Gargalo Identificado</p>
            <p className="text-xs text-muted-foreground">{gargalo.de} — Menor taxa de conversão ({gargalo.taxa.toFixed(1)}%)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
