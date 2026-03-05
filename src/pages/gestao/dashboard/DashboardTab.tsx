import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, FileText, CheckCircle, CalendarCheck, Users, Snowflake } from "lucide-react";

const kpis = [
  { title: "Veículos Cadastrados Hoje", value: 12, icon: Car, color: "text-primary" },
  { title: "Boletos Gerados no Mês", value: 847, icon: FileText, color: "text-blue-500" },
  { title: "Boletos Recebidos no Mês", value: 623, icon: CheckCircle, color: "text-green-500" },
  { title: "Boletos Recebidos Hoje", value: 18, icon: CalendarCheck, color: "text-emerald-500" },
  { title: "Veículos no Fechamento", value: 1342, subtitle: "Participantes com boleto gerado", icon: Users, color: "text-amber-500" },
  { title: "Veículos Congelados", value: 89, subtitle: "Não participam do fechamento", icon: Snowflake, color: "text-sky-400" },
];

export default function DashboardTab() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold">Painel de Controle</h2>
        <p className="text-sm text-muted-foreground">Resumo operacional do dia e do mês</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{kpi.value.toLocaleString("pt-BR")}</p>
                  {kpi.subtitle && <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>}
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
