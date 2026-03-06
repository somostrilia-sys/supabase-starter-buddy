import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileBarChart, Download } from "lucide-react";
import { useState } from "react";

const dreData = [
  { grupo: "RECEITA OPERACIONAL BRUTA", items: [
    { desc: "Mensalidades", valor: 185400 },
    { desc: "Taxas de adesão", valor: 12600 },
    { desc: "Taxas de vistoria", valor: 4800 },
  ]},
  { grupo: "(-) DEDUÇÕES DA RECEITA", items: [
    { desc: "Devoluções e cancelamentos", valor: -3200 },
    { desc: "Inadimplência provisionada", valor: -8500 },
  ]},
  { grupo: "CUSTOS OPERACIONAIS", items: [
    { desc: "Sinistros pagos", valor: -62400 },
    { desc: "Rastreamento veicular", valor: -18900 },
    { desc: "Vistorias terceirizadas", valor: -6200 },
  ]},
  { grupo: "DESPESAS ADMINISTRATIVAS", items: [
    { desc: "Folha de pagamento", valor: -45000 },
    { desc: "Aluguel e condomínio", valor: -8500 },
    { desc: "Tecnologia e sistemas", valor: -5800 },
    { desc: "Energia e telecomunicações", valor: -2140 },
    { desc: "Material de escritório", valor: -890 },
  ]},
  { grupo: "RESULTADO FINANCEIRO", items: [
    { desc: "Receitas financeiras", valor: 3200 },
    { desc: "Despesas financeiras", valor: -1800 },
    { desc: "Tarifas bancárias", valor: -1070 },
  ]},
];

export default function DRETab() {
  const [periodo, setPeriodo] = useState("jul-2025");

  const totalReceita = dreData[0].items.reduce((s, i) => s + i.valor, 0);
  const totalDeducoes = dreData[1].items.reduce((s, i) => s + i.valor, 0);
  const receitaLiquida = totalReceita + totalDeducoes;
  const totalCustos = dreData[2].items.reduce((s, i) => s + i.valor, 0);
  const lucroBruto = receitaLiquida + totalCustos;
  const totalDespesas = dreData[3].items.reduce((s, i) => s + i.valor, 0);
  const totalFinanceiro = dreData[4].items.reduce((s, i) => s + i.valor, 0);
  const lucroLiquido = lucroBruto + totalDespesas + totalFinanceiro;

  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString()}`;

  return (
    <div className="p-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md"><FileBarChart className="h-5 w-5 text-[hsl(210_55%_70%)]" /></div>
          <div><h1 className="text-xl font-bold text-foreground">DRE - Demonstrativo de Resultados</h1><p className="text-sm text-muted-foreground">Análise de receitas, custos e resultado operacional</p></div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 border-[hsl(210_30%_85%)]"><Download className="h-4 w-4" />Exportar PDF</Button>
      </div>

      <Card className="border-[hsl(210_30%_88%)]"><CardContent className="p-4"><div className="grid sm:grid-cols-2 gap-3 items-end">
        <div><Label className="text-xs font-medium text-[hsl(212_35%_25%)]">Período</Label><Select value={periodo} onValueChange={setPeriodo}><SelectTrigger className="mt-1 border-[hsl(210_30%_85%)]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="jul-2025">Julho 2025</SelectItem><SelectItem value="jun-2025">Junho 2025</SelectItem><SelectItem value="mai-2025">Maio 2025</SelectItem></SelectContent></Select></div>
      </div></CardContent></Card>

      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table><TableHeader><TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Descrição</TableHead>
            <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Valor (R$)</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {dreData.map((grupo) => (
              <>
                <TableRow key={grupo.grupo} className="bg-[hsl(210_30%_95%)] border-b border-[hsl(210_30%_90%)]">
                  <TableCell colSpan={2} className="font-bold text-[hsl(212_35%_25%)] text-sm">{grupo.grupo}</TableCell>
                </TableRow>
                {grupo.items.map(item => (
                  <TableRow key={item.desc} className="hover:bg-[hsl(210_40%_94%)] border-b border-[hsl(210_30%_90%)]">
                    <TableCell className="pl-8 text-sm">{item.desc}</TableCell>
                    <TableCell className={`text-right font-semibold ${item.valor >= 0 ? "text-green-600" : "text-red-500"}`}>{item.valor < 0 ? "-" : ""} {fmt(item.valor)}</TableCell>
                  </TableRow>
                ))}
              </>
            ))}
            <TableRow className="bg-[hsl(210_30%_93%)] border-t-2 border-[hsl(212_35%_18%)]">
              <TableCell className="font-bold text-[hsl(212_35%_18%)]">= RECEITA LÍQUIDA</TableCell>
              <TableCell className="text-right font-bold text-[hsl(212_35%_18%)]">{fmt(receitaLiquida)}</TableCell>
            </TableRow>
            <TableRow className="bg-[hsl(210_30%_93%)]">
              <TableCell className="font-bold text-[hsl(212_35%_18%)]">= LUCRO BRUTO</TableCell>
              <TableCell className="text-right font-bold text-[hsl(212_35%_18%)]">{fmt(lucroBruto)}</TableCell>
            </TableRow>
            <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)]">
              <TableCell className="font-bold text-white text-base">= RESULTADO LÍQUIDO</TableCell>
              <TableCell className={`text-right font-bold text-base ${lucroLiquido >= 0 ? "text-green-300" : "text-red-300"}`}>{fmt(lucroLiquido)}</TableCell>
            </TableRow>
          </TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
