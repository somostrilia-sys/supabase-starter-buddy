import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Filter, Clock, Car, Wallet } from "lucide-react";
import { mockVeiculos } from "./mockVeiculos";
import { toast } from "sonner";

function exportCsv(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success("Relatório exportado!");
}

export default function RelatoriosVeiculo() {
  const [tab, setTab] = useState("alteracoes");
  const [cooperativa, setCooperativa] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [categoria, setCategoria] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Flat alteration list
  const alteracoes = mockVeiculos.flatMap(v =>
    v.alteracoes.map(alt => ({
      placa: v.placa, modelo: `${v.marca} ${v.modelo}`, associado: v.associadoNome,
      cooperativa: v.cooperativa, regional: v.regional,
      ...alt,
    }))
  ).sort((a, b) => b.data.localeCompare(a.data));

  const filteredAlt = alteracoes.filter(a => {
    if (cooperativa !== "todos" && a.cooperativa !== cooperativa) return false;
    if (dataInicio && a.data < dataInicio) return false;
    if (dataFim && a.data > dataFim + " 23:59") return false;
    return true;
  });

  const filteredVeic = mockVeiculos.filter(v => {
    if (cooperativa !== "todos" && v.cooperativa !== cooperativa) return false;
    if (tipo !== "todos" && v.tipo !== tipo) return false;
    if (categoria !== "todos" && v.categoria !== categoria) return false;
    return true;
  });

  // Boletos mock
  const boletos = mockVeiculos.slice(0, 15).map((v, i) => ({
    placa: v.placa, modelo: `${v.marca} ${v.modelo}`, associado: v.associadoNome,
    cooperativa: v.cooperativa,
    valorMensal: [89.90, 139.90, 189.90, 249.90][i % 4],
    statusBoleto: i % 5 === 0 ? "Atrasado" : i % 3 === 0 ? "Pendente" : "Pago",
    vencimento: `2025-${String((i % 12) + 1).padStart(2, "0")}-10`,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Relatórios de Veículo</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg mb-6">
          <TabsTrigger value="alteracoes">Alterações</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="boletos">Boletos</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(tab === "alteracoes" || tab === "geral" || tab === "boletos") && (
                <div>
                  <Label className="text-xs">Cooperativa</Label>
                  <Select value={cooperativa} onValueChange={setCooperativa}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {["Cooperativa São Paulo","Cooperativa Rio","Cooperativa Minas","Cooperativa Sul","Cooperativa Centro-Oeste"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {tab === "alteracoes" && (
                <>
                  <div>
                    <Label className="text-xs">Data Início</Label>
                    <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Data Fim</Label>
                    <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                  </div>
                </>
              )}
              {(tab === "geral") && (
                <>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {["Automóvel","Moto","Caminhão","Van/Utilitário"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        {["Passeio","Trabalho","Frota","Especial"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alterações */}
        <TabsContent value="alteracoes">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{filteredAlt.length} registro(s)</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCsv(
              ["Placa","Modelo","Associado","Data","Campo","De","Para","Usuário"],
              filteredAlt.map(a => [a.placa, a.modelo, a.associado, a.data, a.campo, a.de, a.para, a.usuario]),
              "relatorio_alteracoes_veiculos.csv"
            )}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>De</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlt.slice(0, 30).map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{a.data}</TableCell>
                      <TableCell className="font-mono text-xs">{a.placa}</TableCell>
                      <TableCell className="text-sm">{a.modelo}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-primary/60/10 text-blue-600">{a.campo}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.de}</TableCell>
                      <TableCell className="text-xs">{a.para}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.usuario}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geral */}
        <TabsContent value="geral">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{filteredVeic.length} veículo(s)</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCsv(
              ["Placa","Marca","Modelo","Ano","Tipo","Categoria","Cota","Status","Valor FIPE","Associado","Cooperativa"],
              filteredVeic.map(v => [v.placa, v.marca, v.modelo, String(v.ano), v.tipo, v.categoria, v.cota, v.status, String(v.valorFipe), v.associadoNome, v.cooperativa]),
              "relatorio_geral_veiculos.csv"
            )}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Cota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor FIPE</TableHead>
                    <TableHead>Associado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVeic.slice(0, 30).map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.placa}</TableCell>
                      <TableCell className="text-sm">{v.marca} {v.modelo}</TableCell>
                      <TableCell className="text-sm">{v.ano}</TableCell>
                      <TableCell className="text-xs">{v.tipo}</TableCell>
                      <TableCell className="text-xs">{v.categoria}</TableCell>
                      <TableCell className="text-xs">{v.cota}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          v.status === "Ativo" ? "bg-emerald-500/10 text-emerald-600" :
                          v.status === "Cancelado" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/80/10 text-amber-600"
                        }>{v.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">R$ {v.valorFipe.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{v.associadoNome}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Boletos */}
        <TabsContent value="boletos">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{boletos.length} registro(s)</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCsv(
              ["Placa","Modelo","Associado","Valor Mensal","Status Boleto","Vencimento"],
              boletos.map(b => [b.placa, b.modelo, b.associado, String(b.valorMensal), b.statusBoleto, b.vencimento]),
              "relatorio_veiculos_boletos.csv"
            )}>
              <Download className="h-4 w-4" /> Exportar
            </Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Associado</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boletos.map((b, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{b.placa}</TableCell>
                      <TableCell className="text-sm">{b.modelo}</TableCell>
                      <TableCell className="text-sm">{b.associado}</TableCell>
                      <TableCell className="text-sm">R$ {b.valorMensal.toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{new Date(b.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          b.statusBoleto === "Pago" ? "bg-emerald-500/10 text-emerald-600" :
                          b.statusBoleto === "Atrasado" ? "bg-destructive/10 text-destructive" :
                          "bg-warning/80/10 text-amber-600"
                        }>{b.statusBoleto}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
