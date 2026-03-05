import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { consultores } from "../pipeline/mockData";

const motivos = [
  { motivo: "Preço alto", qtd: 28, pct: 25.2 },
  { motivo: "Já tem proteção", qtd: 22, pct: 19.8 },
  { motivo: "Desistiu", qtd: 18, pct: 16.2 },
  { motivo: "Não retornou", qtd: 15, pct: 13.5 },
  { motivo: "Veículo não aceito", qtd: 10, pct: 9.0 },
  { motivo: "Mudou de cidade", qtd: 7, pct: 6.3 },
  { motivo: "Escolheu concorrente", qtd: 6, pct: 5.4 },
  { motivo: "Outros", qtd: 5, pct: 4.5 },
];

export default function MotivosTab() {
  const [consultor, setConsultor] = useState("all");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={consultor} onValueChange={setConsultor}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Consultor" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos Consultores</SelectItem>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Motivos de Perda</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={motivos} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="motivo" tick={{ fontSize: 11 }} width={95} />
                <Tooltip />
                <Bar dataKey="qtd" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Detalhamento</h3>
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Motivo</TableHead><TableHead className="text-xs text-right">Qtd</TableHead><TableHead className="text-xs text-right">%</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {motivos.map(m => (
                  <TableRow key={m.motivo}>
                    <TableCell className="text-sm">{m.motivo}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{m.qtd}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">{m.pct}%</TableCell>
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
