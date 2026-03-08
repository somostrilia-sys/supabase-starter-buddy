import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, FileText, Handshake, DollarSign, TrendingUp, Trophy, ArrowRightLeft,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";

const cooperativas = ["Todas", "Central SP", "Central RJ", "Norte MG", "Oeste PR", "Sul RS"];
const consultores = ["Todos", "Lucas Ferreira", "Ana Souza", "Marcos Lima", "Juliana Costa", "Pedro Santos", "Carla Oliveira"];

const funilData = [
  { etapa: "Leads", valor: 320 },
  { etapa: "Qualificados", valor: 215 },
  { etapa: "Proposta", valor: 142 },
  { etapa: "Negociação", valor: 87 },
  { etapa: "Fechado", valor: 52 },
];

const evolucaoMensal = [
  { mes: "Jul", vendas: 28, faturamento: 42000 },
  { mes: "Ago", vendas: 34, faturamento: 51000 },
  { mes: "Set", vendas: 31, faturamento: 46500 },
  { mes: "Out", vendas: 38, faturamento: 57000 },
  { mes: "Nov", vendas: 42, faturamento: 63000 },
  { mes: "Dez", vendas: 35, faturamento: 52500 },
  { mes: "Jan", vendas: 40, faturamento: 60000 },
  { mes: "Fev", vendas: 45, faturamento: 67500 },
  { mes: "Mar", vendas: 39, faturamento: 58500 },
  { mes: "Abr", vendas: 48, faturamento: 72000 },
  { mes: "Mai", vendas: 52, faturamento: 78000 },
  { mes: "Jun", vendas: 55, faturamento: 82500 },
];

const rankingConsultores = [
  { nome: "Lucas Ferreira", contratos: 18, faturamento: 27000, meta: 25000, avatar: "LF" },
  { nome: "Ana Souza", contratos: 15, faturamento: 22500, meta: 22000, avatar: "AS" },
  { nome: "Marcos Lima", contratos: 12, faturamento: 18000, meta: 20000, avatar: "ML" },
  { nome: "Juliana Costa", contratos: 10, faturamento: 15000, meta: 18000, avatar: "JC" },
  { nome: "Pedro Santos", contratos: 8, faturamento: 12000, meta: 15000, avatar: "PS" },
  { nome: "Carla Oliveira", contratos: 6, faturamento: 9000, meta: 15000, avatar: "CO" },
];

const distribuicaoCooperativa = [
  { name: "Central SP", value: 38 },
  { name: "Central RJ", value: 24 },
  { name: "Norte MG", value: 18 },
  { name: "Oeste PR", value: 12 },
  { name: "Sul RS", value: 8 },
];

const PIE_COLORS = [
  "hsl(212, 55%, 40%)",
  "hsl(142, 50%, 40%)",
  "hsl(38, 90%, 50%)",
  "hsl(0, 65%, 50%)",
  "hsl(262, 50%, 50%)",
];

const FUNNEL_COLORS = [
  "hsl(212, 55%, 55%)",
  "hsl(212, 55%, 45%)",
  "hsl(212, 55%, 38%)",
  "hsl(212, 55%, 30%)",
  "hsl(142, 50%, 40%)",
];

const formatCurrency = (v: number) => `R$ ${(v / 1000).toFixed(0)}k`;

export default function DashboardVendas() {
  const [periodo, setPeriodo] = useState("mes");
  const [consultor, setConsultor] = useState("Todos");
  const [cooperativa, setCooperativa] = useState("Todas");

  const totalLeads = 320;
  const propostas = 142;
  const contratos = 52;
  const faturamento = 82500;
  const conversao = ((contratos / totalLeads) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div>
          <Label className="text-xs font-semibold">Período</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Consultor</Label>
          <Select value={consultor} onValueChange={setConsultor}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{consultores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Cooperativa</Label>
          <Select value={cooperativa} onValueChange={setCooperativa}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{cooperativas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-semibold">Data Início</Label>
          <Input type="date" className="w-full" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Data Fim</Label>
          <Input type="date" className="w-full" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total Leads", value: totalLeads.toString(), icon: Users, color: "text-[hsl(212,55%,40%)]", bg: "bg-[hsl(212,55%,95%)]" },
          { label: "Propostas Enviadas", value: propostas.toString(), icon: FileText, color: "text-[hsl(38,90%,45%)]", bg: "bg-[hsl(38,90%,95%)]" },
          { label: "Contratos Fechados", value: contratos.toString(), icon: Handshake, color: "text-[hsl(142,50%,35%)]", bg: "bg-[hsl(142,50%,95%)]" },
          { label: "Faturamento Total", value: `R$ ${faturamento.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-[hsl(212,35%,25%)]", bg: "bg-[hsl(210,30%,94%)]" },
          { label: "Taxa de Conversão", value: `${conversao}%`, icon: TrendingUp, color: "text-[hsl(142,50%,35%)]", bg: "bg-[hsl(142,50%,95%)]" },
          { label: "Comissões do Mês", value: "R$ 7.950", icon: ArrowRightLeft, color: "text-[hsl(152,50%,35%)]", bg: "bg-[hsl(152,50%,95%)]" },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funil + Evolução */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Funil de Vendas</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funilData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="etapa" tick={{ fontSize: 12 }} width={75} />
                <Tooltip formatter={(v: number) => [v, "Negociações"]} />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {funilData.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Evolução Mensal de Vendas (12 meses)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number, name: string) => [name === "faturamento" ? `R$ ${v.toLocaleString("pt-BR")}` : v, name === "faturamento" ? "Faturamento" : "Vendas"]} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="vendas" stroke="hsl(212, 55%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Vendas" />
                <Line yAxisId="right" type="monotone" dataKey="faturamento" stroke="hsl(142, 50%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Faturamento" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking + Pizza */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-[hsl(38,90%,50%)]" />
              <h3 className="font-semibold text-sm">Ranking de Consultores</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase w-8">#</TableHead>
                  <TableHead className="text-xs font-bold uppercase">Consultor</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-center">Contratos</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-right">Faturamento</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-right">Meta</TableHead>
                  <TableHead className="text-xs font-bold uppercase w-40">% Atingimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingConsultores.map((c, i) => {
                  const pct = Math.min((c.faturamento / c.meta) * 100, 100);
                  const pctColor = pct >= 100 ? "text-[hsl(142,50%,35%)]" : pct >= 70 ? "text-[hsl(38,90%,45%)]" : "text-[hsl(0,65%,50%)]";
                  return (
                    <TableRow key={c.nome}>
                      <TableCell className="font-bold text-muted-foreground">{i + 1}º</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-[hsl(212,55%,92%)] text-[hsl(212,55%,35%)]">{c.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{c.nome}</span>
                          {i === 0 && <Badge className="bg-[hsl(38,90%,50%)] text-white text-[9px] px-1.5 py-0">🏆</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{c.contratos}</TableCell>
                      <TableCell className="text-right">R$ {c.faturamento.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right text-muted-foreground">R$ {c.meta.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className={`text-xs font-bold ${pctColor} w-10 text-right`}>{pct.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Distribuição por Cooperativa</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distribuicaoCooperativa}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {distribuicaoCooperativa.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} contratos`, "Contratos"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
