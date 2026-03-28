import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UsersRound, Search, Plus, DollarSign, FileText, Users, TrendingUp } from "lucide-react";

const afiliados = [
  { id: 1, nome: "Roberto Ferreira", codigo: "AFI-001", indicacoes: 45, contratos: 18, comissao: 5400, taxa: 8, status: "ativo" as const },
  { id: 2, nome: "Luciana Barros", codigo: "AFI-002", indicacoes: 38, contratos: 14, comissao: 4200, taxa: 10, status: "ativo" as const },
  { id: 3, nome: "Eduardo Martins", codigo: "AFI-003", indicacoes: 32, contratos: 10, comissao: 3000, taxa: 8, status: "ativo" as const },
  { id: 4, nome: "Patrícia Nunes", codigo: "AFI-004", indicacoes: 28, contratos: 9, comissao: 2700, taxa: 10, status: "ativo" as const },
  { id: 5, nome: "Gustavo Rocha", codigo: "AFI-005", indicacoes: 22, contratos: 6, comissao: 1800, taxa: 8, status: "inativo" as const },
  { id: 6, nome: "Camila Dias", codigo: "AFI-006", indicacoes: 15, contratos: 5, comissao: 1500, taxa: 10, status: "ativo" as const },
];

const kpis = [
  { label: "Total Afiliados", value: afiliados.length, icon: UsersRound, color: "text-primary", bg: "bg-primary/8" },
  { label: "Total Indicações", value: afiliados.reduce((s, a) => s + a.indicacoes, 0), icon: Users, color: "text-blue-600", bg: "bg-primary/6" },
  { label: "Contratos Gerados", value: afiliados.reduce((s, a) => s + a.contratos, 0), icon: FileText, color: "text-success", bg: "bg-success/8" },
  { label: "Comissões Pagas", value: `R$ ${afiliados.reduce((s, a) => s + a.comissao, 0).toLocaleString()}`, icon: DollarSign, color: "text-purple-600", bg: "bg-primary/6" },
];

export default function Afiliados() {
  const [busca, setBusca] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const filtered = afiliados.filter(a => !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.codigo.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <UsersRound className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Afiliados</h1>
            <p className="text-sm text-muted-foreground">Rede de afiliados, indicações e comissões</p>
          </div>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4" />Novo Afiliado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Cadastrar Novo Afiliado</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label className="text-xs font-medium">Nome completo</Label><Input className="mt-1" placeholder="Nome do afiliado" /></div>
              <div><Label className="text-xs font-medium">Email</Label><Input className="mt-1" type="email" placeholder="email@exemplo.com" /></div>
              <div><Label className="text-xs font-medium">Telefone</Label><Input className="mt-1" placeholder="(00) 00000-0000" /></div>
              <div><Label className="text-xs font-medium">CPF/CNPJ</Label><Input className="mt-1" placeholder="000.000.000-00" /></div>
              <div>
                <Label className="text-xs font-medium">Comissão por contrato (%)</Label>
                <Input className="mt-1" type="number" placeholder="10" min={0} max={100} />
              </div>
              <div><Label className="text-xs font-medium">Chave PIX (para pagamento)</Label><Input className="mt-1" placeholder="Chave PIX" /></div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white" onClick={() => setModalOpen(false)}>Cadastrar Afiliado</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 border-border" placeholder="Buscar por nome ou código..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary hover:bg-primary border-b-0">
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Nome</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Código</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Indicações</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Contratos</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Taxa</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-right">Comissão Acum.</TableHead>
                <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a, i) => (
                <TableRow key={a.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b border-border/60`}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell><span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">{a.codigo}</span></TableCell>
                  <TableCell className="text-right font-semibold">{a.indicacoes}</TableCell>
                  <TableCell className="text-right font-semibold text-success">{a.contratos}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="border-primary/30 text-foreground bg-primary/8">{a.taxa}%</Badge></TableCell>
                  <TableCell className="text-right font-semibold text-primary">R$ {a.comissao.toLocaleString()}</TableCell>
                  <TableCell><Badge className={a.status === "ativo" ? "bg-success/10 text-success" : "bg-gray-100 text-gray-600"}>{a.status === "ativo" ? "Ativo" : "Inativo"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 bg-muted/30 border-t border-border/60">
            <span className="text-xs text-muted-foreground">{filtered.length} afiliado(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
