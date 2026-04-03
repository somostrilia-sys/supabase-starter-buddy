import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Filter, Clock, Car, Wallet, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { exportCSV, exportExcel, exportPDF, type ExportColumn } from "@/utils/exportUtils";

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
  const [cooperativasList, setCooperativasList] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("cooperativas").select("nome").eq("ativo", true).then(({ data }) => {
      if (data) setCooperativasList(data.map((c: any) => c.nome));
    });
  }, []);

  const [veiculosData, setVeiculosData] = useState<any[]>([]);
  const [boletosData, setBoletosData] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: veics } = await supabase.from("veiculos")
        .select("id, placa, marca, modelo, ano_modelo, cor, valor_fipe, status, categoria_uso, associado_id, associados(nome)")
        .order("created_at", { ascending: false }).limit(200);
      setVeiculosData(veics || []);

      const { data: bols } = await supabase.from("boletos")
        .select("id, associado_nome, nosso_numero, valor, vencimento, status, data_pagamento")
        .order("vencimento", { ascending: false }).limit(200);
      setBoletosData(bols || []);

      const { data: audit } = await supabase
        .from("audit_log")
        .select("*")
        .eq("tabela", "veiculos")
        .order("created_at", { ascending: false });
      setAuditData(audit || []);

      setLoading(false);
    };
    fetchData();
  }, []);

  const alteracoes = auditData.map((a: any) => ({
    placa: a.registro_id || "—",
    modelo: "",
    associado: "",
    data: a.created_at ? new Date(a.created_at).toLocaleString("pt-BR") : "—",
    campo: a.campo || a.field || "—",
    de: a.valor_anterior || a.old_value || "—",
    para: a.valor_novo || a.new_value || "—",
    usuario: a.usuario || a.user_email || "—",
  }));

  const filteredAlt = alteracoes.filter((a: any) => {
    if (cooperativa !== "todos") return false; // filter by cooperativa if needed
    if (dataInicio && a.data < dataInicio) return false;
    if (dataFim && a.data > dataFim) return false;
    return true;
  });

  const filteredVeic = veiculosData.filter((v: any) => {
    if (tipo !== "todos" && v.categoria_uso !== tipo) return false;
    return true;
  });

  const boletos = boletosData.map((b: any) => ({
    placa: "", modelo: "", associado: b.associado_nome || "—",
    cooperativa: "",
    valorMensal: b.valor || 0,
    statusBoleto: b.status === "baixado" ? "Pago" : b.status === "aberto" ? "Pendente" : "Atrasado",
    vencimento: b.vencimento || "",
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
                      {cooperativasList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const cols: ExportColumn[] = [
                  { key: "placa", label: "Placa" },
                  { key: "campo", label: "Campo Alterado" },
                  { key: "de", label: "Valor Anterior" },
                  { key: "para", label: "Valor Novo" },
                  { key: "usuario", label: "Usuário" },
                  { key: "data", label: "Data/Hora" },
                ];
                exportCSV(filteredAlt, "relatorio_alteracoes_veiculos", cols);
              }}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const cols: ExportColumn[] = [
                  { key: "placa", label: "Placa" },
                  { key: "campo", label: "Campo Alterado" },
                  { key: "de", label: "Valor Anterior" },
                  { key: "para", label: "Valor Novo" },
                  { key: "usuario", label: "Usuário" },
                  { key: "data", label: "Data/Hora" },
                ];
                exportExcel(filteredAlt, "relatorio_alteracoes_veiculos", cols);
              }}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                const cols: ExportColumn[] = [
                  { key: "placa", label: "Placa" },
                  { key: "campo", label: "Campo Alterado" },
                  { key: "de", label: "Valor Anterior" },
                  { key: "para", label: "Valor Novo" },
                  { key: "usuario", label: "Usuário" },
                  { key: "data", label: "Data/Hora" },
                ];
                exportPDF(filteredAlt, "relatorio_alteracoes_veiculos", cols, "Relatório de Alterações de Veículos", `Período: ${dataInicio || "—"} a ${dataFim || "—"}`);
              }}>
                <FileTextIcon className="h-4 w-4" /> PDF
              </Button>
            </div>
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
                  {filteredAlt.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma alteração encontrada no audit_log para veículos.
                      </TableCell>
                    </TableRow>
                  ) : filteredAlt.slice(0, 30).map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{a.data}</TableCell>
                      <TableCell className="font-mono text-xs">{a.placa}</TableCell>
                      <TableCell className="text-sm">{a.modelo}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-primary/10 text-blue-600">{a.campo}</Badge></TableCell>
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
                          "bg-warning/8 text-warning"
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
                          "bg-warning/8 text-warning"
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
