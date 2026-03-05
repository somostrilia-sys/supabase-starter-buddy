import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Clock } from "lucide-react";
import { mockAssociados } from "./mockAssociados";
import { toast } from "sonner";

interface Alteracao {
  associadoCodigo: string;
  associadoNome: string;
  data: string;
  campo: string;
  de: string;
  para: string;
  usuario: string;
  cooperativa: string;
  regional: string;
}

// Build flat list from mock
const todasAlteracoes: Alteracao[] = mockAssociados.flatMap(a =>
  a.alteracoes.map(alt => ({
    associadoCodigo: a.codigo,
    associadoNome: a.nome,
    data: alt.data,
    campo: alt.campo,
    de: alt.de,
    para: alt.para,
    usuario: alt.usuario,
    cooperativa: a.cooperativa,
    regional: a.regional,
  }))
);

// Add some beneficiário-specific alterations
const benefAlteracoes: Alteracao[] = [
  { associadoCodigo: "A01000", associadoNome: "Carlos Alberto Silva", data: "2025-02-10 11:20", campo: "Beneficiário Adicionado", de: "-", para: "Maria Silva (Cônjuge)", usuario: "admin@gia.com", cooperativa: "Cooperativa São Paulo", regional: "Regional Capital" },
  { associadoCodigo: "A01003", associadoNome: "Ana Paula Ferreira", data: "2025-01-28 16:45", campo: "Beneficiário Removido", de: "Pedro Ferreira (Filho)", para: "-", usuario: "operador@gia.com", cooperativa: "Cooperativa Rio", regional: "Regional Litoral" },
  { associadoCodigo: "A01007", associadoNome: "Adriana Souza Rodrigues", data: "2025-01-05 09:30", campo: "Beneficiário Alterado", de: "Parentesco: Irmão", para: "Parentesco: Cônjuge", usuario: "admin@gia.com", cooperativa: "Cooperativa Minas", regional: "Regional Interior" },
  { associadoCodigo: "A01012", associadoNome: "Patricia de Lourdes Gomes", data: "2024-12-20 14:10", campo: "Beneficiário Adicionado", de: "-", para: "Lucas Gomes (Filho)", usuario: "admin@gia.com", cooperativa: "Cooperativa Sul", regional: "Regional Metropolitana" },
  { associadoCodigo: "A01018", associadoNome: "Diego Fernando Cardoso", data: "2024-12-15 10:00", campo: "Beneficiário Alterado", de: "CPF: 111.222.333-44", para: "CPF: 555.666.777-88", usuario: "operador@gia.com", cooperativa: "Cooperativa Centro-Oeste", regional: "Regional Capital" },
];

const allData = [...benefAlteracoes, ...todasAlteracoes].sort((a, b) => b.data.localeCompare(a.data));

export default function RelatorioAlteracoes() {
  const [cooperativa, setCooperativa] = useState("todos");
  const [regional, setRegional] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const filtered = allData.filter(a => {
    if (cooperativa !== "todos" && a.cooperativa !== cooperativa) return false;
    if (regional !== "todos" && a.regional !== regional) return false;
    if (dataInicio && a.data < dataInicio) return false;
    if (dataFim && a.data > dataFim + " 23:59") return false;
    return true;
  });

  const handleExport = () => {
    const csv = [
      "Código,Associado,Data,Campo,De,Para,Usuário,Cooperativa,Regional",
      ...filtered.map(a =>
        `${a.associadoCodigo},"${a.associadoNome}",${a.data},"${a.campo}","${a.de}","${a.para}",${a.usuario},${a.cooperativa},${a.regional}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio_alteracoes_beneficiarios.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado com sucesso!");
  };

  const campoColor = (campo: string) => {
    if (campo.includes("Adicionado")) return "bg-emerald-500/10 text-emerald-600";
    if (campo.includes("Removido")) return "bg-destructive/10 text-destructive";
    return "bg-blue-500/10 text-blue-600";
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Relatório de Alterações de Beneficiário</h2>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Cooperativa</Label>
              <Select value={cooperativa} onValueChange={setCooperativa}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul", "Cooperativa Centro-Oeste"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Regional</Label>
              <Select value={regional} onValueChange={setRegional}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {["Regional Capital", "Regional Interior", "Regional Litoral", "Regional Metropolitana"].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {filtered.length} registro(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Associado</TableHead>
                  <TableHead>Alteração</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">{a.data}</TableCell>
                    <TableCell className="font-mono text-xs">{a.associadoCodigo}</TableCell>
                    <TableCell className="text-sm font-medium">{a.associadoNome}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={campoColor(a.campo)}>
                        {a.campo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{a.de}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{a.para}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.usuario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
