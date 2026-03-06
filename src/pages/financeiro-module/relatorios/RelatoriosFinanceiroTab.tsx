import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileBarChart, Monitor, Printer, FileSpreadsheet, FileText, Download } from "lucide-react";
import { useState } from "react";

const relatorios = [
  { id: "fluxo-caixa", titulo: "Fluxo de Caixa", desc: "Entradas e saídas por período", icon: FileBarChart },
  { id: "dre-mensal", titulo: "DRE Mensal", desc: "Demonstrativo de resultados", icon: FileText },
  { id: "inadimplencia", titulo: "Inadimplência", desc: "Análise de inadimplência por cooperativa", icon: FileBarChart },
  { id: "conciliacao", titulo: "Conciliação Bancária", desc: "Extrato vs lançamentos do sistema", icon: FileSpreadsheet },
  { id: "custos-centro", titulo: "Custos por Centro", desc: "Despesas agrupadas por centro de custo", icon: FileBarChart },
  { id: "receitas-categoria", titulo: "Receitas por Categoria", desc: "Recebimentos agrupados por tipo", icon: FileBarChart },
  { id: "consultores", titulo: "Performance Consultores", desc: "Faturamento e custo por consultor", icon: FileBarChart },
  { id: "cooperativas", titulo: "Análise Cooperativas", desc: "Indicadores financeiros por cooperativa", icon: FileBarChart },
  { id: "projecao", titulo: "Projeção Financeira", desc: "Projeção de despesas e receitas", icon: FileBarChart },
];

export default function RelatoriosFinanceiroTab() {
  const [periodo, setPeriodo] = useState("jul-2025");

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><FileBarChart className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
        <div><h1 className="text-xl font-bold text-foreground">Relatórios Financeiros</h1><p className="text-sm text-muted-foreground">Geração e exportação de relatórios</p></div>
      </div>

      <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><div className="grid sm:grid-cols-2 gap-3 items-end">
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Período</Label><Select value={periodo} onValueChange={setPeriodo}><SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="jul-2025">Julho 2025</SelectItem><SelectItem value="jun-2025">Junho 2025</SelectItem><SelectItem value="q2-2025">2º Trimestre 2025</SelectItem><SelectItem value="s1-2025">1º Semestre 2025</SelectItem></SelectContent></Select></div>
      </div></CardContent></Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatorios.map(r => (
          <Card key={r.id} className="border-[hsl(210_30%_88%)] hover:border-[hsl(212_35%_50%)] transition-colors cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[hsl(210_40%_95%)] flex items-center justify-center group-hover:bg-[hsl(212_35%_18%)] transition-colors">
                  <r.icon className="h-5 w-5 text-[hsl(212_35%_30%)] group-hover:text-[hsl(210_55%_70%)] transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{r.titulo}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="gap-1 text-xs border-[hsl(210_30%_85%)] flex-1"><Monitor className="h-3 w-3" />Tela</Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs border-[hsl(210_30%_85%)] flex-1"><Printer className="h-3 w-3" />Imprimir</Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs border-[hsl(210_30%_85%)] flex-1"><FileSpreadsheet className="h-3 w-3" />Excel</Button>
                <Button variant="outline" size="sm" className="gap-1 text-xs border-[hsl(210_30%_85%)] flex-1"><Download className="h-3 w-3" />PDF</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
