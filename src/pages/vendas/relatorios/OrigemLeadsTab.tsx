import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const origens = [
  { canal: "Site", qtd: 32, pct: 24.1, conversao: 28.1 },
  { canal: "WhatsApp", qtd: 28, pct: 21.1, conversao: 35.7 },
  { canal: "Powerlink", qtd: 22, pct: 16.5, conversao: 22.7 },
  { canal: "Formulário Dinâmico", qtd: 18, pct: 13.5, conversao: 33.3 },
  { canal: "Indicação Afiliado", qtd: 15, pct: 11.3, conversao: 40.0 },
  { canal: "Importação Lista", qtd: 10, pct: 7.5, conversao: 10.0 },
  { canal: "Pipeline Manual", qtd: 8, pct: 6.0, conversao: 25.0 },
];

const COLORS = ["#3B82F6", "#22C55E", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#F97316"];

export default function OrigemLeadsTab() {
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Distribuição por Canal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={origens} dataKey="qtd" nameKey="canal" cx="50%" cy="50%" outerRadius={100} label={({ canal, pct }) => `${pct}%`} fontSize={10}>
                  {origens.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend fontSize={11} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Análise ROI por Canal</h3>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Canal</TableHead>
                <TableHead className="text-xs text-right">Qtd</TableHead>
                <TableHead className="text-xs text-right">%</TableHead>
                <TableHead className="text-xs text-right">Conversão</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {origens.map((o, i) => (
                  <TableRow key={o.canal}>
                    <TableCell className="text-sm">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[i] }} />{o.canal}
                    </TableCell>
                    <TableCell className="text-sm text-right">{o.qtd}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">{o.pct}%</TableCell>
                    <TableCell className="text-sm text-right font-medium">{o.conversao}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
