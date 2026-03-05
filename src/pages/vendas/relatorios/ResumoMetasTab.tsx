import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cooperativas } from "../pipeline/mockData";

const metasData = [
  { nome: "Ana Silva", tipo: "Consultor", meta: 15, realizado: 18, pct: 120 },
  { nome: "Carlos Souza", tipo: "Consultor", meta: 15, realizado: 15, pct: 100 },
  { nome: "Maria Lima", tipo: "Consultor", meta: 15, realizado: 12, pct: 80 },
  { nome: "João Pedro", tipo: "Consultor", meta: 12, realizado: 9, pct: 75 },
  { nome: "Fernanda Alves", tipo: "Consultor", meta: 12, realizado: 7, pct: 58.3 },
  { nome: "Ricardo Santos", tipo: "Consultor", meta: 10, realizado: 5, pct: 50 },
  { nome: "Afiliado Marcos", tipo: "Afiliado", meta: 8, realizado: 10, pct: 125 },
  { nome: "Afiliado Carla", tipo: "Afiliado", meta: 8, realizado: 4, pct: 50 },
  { nome: "Afiliado Bruno", tipo: "Afiliado", meta: 0, realizado: 0, pct: 0 },
];

function MetaTable({ items }: { items: typeof metasData }) {
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead className="text-xs">Consultor/Afiliado</TableHead>
        <TableHead className="text-xs text-right">Meta</TableHead>
        <TableHead className="text-xs text-right">Realizado</TableHead>
        <TableHead className="text-xs text-right">%</TableHead>
        <TableHead className="text-xs w-32">Progresso</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {items.map(m => (
          <TableRow key={m.nome}>
            <TableCell className="font-medium text-sm">{m.nome}</TableCell>
            <TableCell className="text-right text-sm">{m.meta}</TableCell>
            <TableCell className="text-right text-sm font-bold">{m.realizado}</TableCell>
            <TableCell className="text-right text-sm">{m.pct.toFixed(1)}%</TableCell>
            <TableCell><Progress value={Math.min(m.pct, 100)} className="h-2" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ResumoMetasTab() {
  const [subTab, setSubTab] = useState("bateram");
  const [coop, setCoop] = useState("all");

  const bateram = metasData.filter(m => m.meta > 0 && m.pct >= 100);
  const naoBateram = metasData.filter(m => m.meta > 0 && m.pct < 100);
  const naoParticiparam = metasData.filter(m => m.meta === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={coop} onValueChange={setCoop}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Cooperativa" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas Cooperativas</SelectItem>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          <TabsTrigger value="bateram" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />Bateram a Meta ({bateram.length})
          </TabsTrigger>
          <TabsTrigger value="nao_bateram" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />Não Bateram ({naoBateram.length})
          </TabsTrigger>
          <TabsTrigger value="nao_participaram" className="text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />Não Participaram ({naoParticiparam.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bateram"><Card><CardContent className="p-0"><MetaTable items={bateram} /></CardContent></Card></TabsContent>
        <TabsContent value="nao_bateram"><Card><CardContent className="p-0"><MetaTable items={naoBateram} /></CardContent></Card></TabsContent>
        <TabsContent value="nao_participaram"><Card><CardContent className="p-0"><MetaTable items={naoParticiparam} /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
