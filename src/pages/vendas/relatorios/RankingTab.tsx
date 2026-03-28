import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

const ranking = [
  { pos: 1, nome: "Ana Silva", vendas: 18, valor: 28450, taxa: 42.5, tempo: 5 },
  { pos: 2, nome: "Carlos Souza", vendas: 15, valor: 22800, taxa: 38.2, tempo: 7 },
  { pos: 3, nome: "Maria Lima", vendas: 12, valor: 19600, taxa: 35.1, tempo: 6 },
  { pos: 4, nome: "João Pedro", vendas: 9, valor: 14200, taxa: 28.7, tempo: 9 },
  { pos: 5, nome: "Fernanda Alves", vendas: 7, valor: 11500, taxa: 24.3, tempo: 11 },
  { pos: 6, nome: "Ricardo Santos", vendas: 5, valor: 8900, taxa: 19.8, tempo: 14 },
];

const medalColors = ["text-amber-500", "text-slate-400", "text-amber-700"];
const podiumBg = ["border-amber-300 bg-warning/8/50 dark:bg-amber-950/20", "border-slate-300 bg-slate-50/50 dark:bg-slate-950/20", "border-amber-600/30 bg-warning/8/30 dark:bg-amber-950/10"];

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function RankingTab() {
  return (
    <div className="space-y-4">
      {/* Podium */}
      <div className="grid grid-cols-3 gap-3">
        {ranking.slice(0, 3).map((r, i) => (
          <Card key={r.nome} className={podiumBg[i]}>
            <CardContent className="p-4 text-center">
              <Trophy className={`h-8 w-8 mx-auto mb-2 ${medalColors[i]}`} />
              <p className="font-bold text-lg">{r.nome}</p>
              <p className="text-2xl font-bold">{r.vendas} vendas</p>
              <p className="text-sm text-muted-foreground">{fmt(r.valor)}</p>
              <Badge variant="outline" className="mt-2 text-[10px]">{r.taxa}% conversão</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs w-16">#</TableHead>
              <TableHead className="text-xs">Consultor</TableHead>
              <TableHead className="text-xs text-right">Vendas</TableHead>
              <TableHead className="text-xs text-right">Valor Adesões</TableHead>
              <TableHead className="text-xs text-right">Taxa Conversão</TableHead>
              <TableHead className="text-xs text-right">Tempo Médio (dias)</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {ranking.map(r => (
                <TableRow key={r.pos}>
                  <TableCell className="font-bold">
                    {r.pos <= 3 ? <Trophy className={`h-4 w-4 inline ${medalColors[r.pos - 1]}`} /> : r.pos}
                  </TableCell>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right font-bold">{r.vendas}</TableCell>
                  <TableCell className="text-right">{fmt(r.valor)}</TableCell>
                  <TableCell className="text-right">{r.taxa}%</TableCell>
                  <TableCell className="text-right">{r.tempo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
