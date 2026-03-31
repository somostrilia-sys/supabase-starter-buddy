import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, BarChart3, History } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://yrjiegtqfngdliwclpzo.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyamllZ3RxZm5nZGxpd2NscHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTY3MzMsImV4cCI6MjA5MDI5MjczM30.yZWSOqQwWhG_OcF-uNLvvy_ZwRYd2OC_Jjr5R_9Gucw";

const TIPOS_RELATORIO = [
  { value: "associados_ativos", label: "Associados Ativos" },
  { value: "inadimplentes", label: "Inadimplentes" },
  { value: "novos_cadastros", label: "Novos Cadastros" },
  { value: "sinistros", label: "Sinistros" },
  { value: "financeiro_mensal", label: "Financeiro Mensal" },
];

const REGIONAIS = [
  "1 - OBJETIVO PATRIMONIAL MUTUALISTA",
  "2 - MATO GROSSO DO SUL",
  "3 - REGIONAL NORTE",
  "4 - REGIONAL ALAGOAS",
  "5 - REGIONAL NORTE, MINAS E SUL",
  "6 - REGIONAL SP INTERIOR",
  "7 - REGIONAL CEARÁ",
  "8 - REGIONAL NATAL",
  "9 - REGIONAL MINAS INTERIOR",
  "10 - REGIONAL BAHIA",
  "11 - REGIONAL PARANÁ",
  "12 - REGIONAL SUL (INTERIOR)",
];

const FORMATOS = [
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF (mock)" },
  { value: "excel", label: "Excel (mock)" },
];

const INCLUIR_OPCOES = [
  { key: "dados_pessoais", label: "Dados Pessoais" },
  { key: "dados_veiculo", label: "Dados do Veículo" },
  { key: "dados_financeiros", label: "Dados Financeiros" },
  { key: "historico", label: "Histórico" },
];

// CSV headers/rows per report type
const CSV_TEMPLATES: Record<string, { headers: string; rows: string[] }> = {
  associados_ativos: {
    headers: "CPF;Nome;Placa;Plano;Regional;Status;Data Cadastro",
    rows: [
      "123.456.789-00;João Silva;ABC-1234;PLANO OURO;1 - OBJETIVO PATRIMONIAL MUTUALISTA;ATIVO;2024-01-15",
      "987.654.321-00;Maria Santos;DEF-5678;PLANO PRATA;2 - MATO GROSSO DO SUL;ATIVO;2024-02-20",
      "456.789.123-00;Carlos Oliveira;GHI-9012;PLANO BRONZE;3 - REGIONAL NORTE;ATIVO;2024-03-10",
    ],
  },
  inadimplentes: {
    headers: "CPF;Nome;Placa;Plano;Regional;Parcelas Em Atraso;Valor Total;Último Pagamento",
    rows: [
      "111.222.333-44;Ana Costa;JKL-3456;PLANO OURO;4 - REGIONAL ALAGOAS;3;R$ 450,00;2024-10-05",
      "555.666.777-88;Pedro Lima;MNO-7890;PLANO PRATA;5 - REGIONAL NORTE, MINAS E SUL;2;R$ 280,00;2024-11-10",
      "999.000.111-22;Lucia Ferreira;PQR-1234;PLANO BRONZE;6 - REGIONAL SP INTERIOR;5;R$ 620,00;2024-09-15",
    ],
  },
  novos_cadastros: {
    headers: "CPF;Nome;Placa;Plano;Regional;Data Cadastro;Consultor",
    rows: [
      "222.333.444-55;Roberto Alves;STU-5678;PLANO OURO;7 - REGIONAL CEARÁ;2025-01-02;Carlos Vendedor",
      "666.777.888-99;Fernanda Souza;VWX-9012;PLANO PRATA;8 - REGIONAL NATAL;2025-01-08;Ana Consultora",
      "000.111.222-33;Marcos Rocha;YZA-3456;PLANO BRONZE;9 - REGIONAL MINAS INTERIOR;2025-01-14;João Agente",
    ],
  },
  sinistros: {
    headers: "Protocolo;CPF;Nome;Placa;Tipo Sinistro;Data Ocorrência;Status;Valor Estimado",
    rows: [
      "SIN-2025-001;333.444.555-66;Juliana Melo;BCD-7890;COLISÃO;2025-01-03;EM ANÁLISE;R$ 12.500,00",
      "SIN-2025-002;777.888.999-00;Thiago Nunes;EFG-1234;FURTO;2025-01-09;APROVADO;R$ 45.000,00",
      "SIN-2025-003;111.333.555-77;Camila Dias;HIJ-5678;ROUBO;2025-01-11;PAGO;R$ 38.000,00",
    ],
  },
  financeiro_mensal: {
    headers: "Mês/Ano;Regional;Total Associados;Receita Bruta;Inadimplência;Sinistros Pagos;Resultado",
    rows: [
      "01/2025;1 - OBJETIVO PATRIMONIAL MUTUALISTA;1250;R$ 187.500,00;R$ 8.400,00;R$ 45.000,00;R$ 134.100,00",
      "01/2025;2 - MATO GROSSO DO SUL;890;R$ 133.500,00;R$ 5.200,00;R$ 28.000,00;R$ 100.300,00",
      "01/2025;3 - REGIONAL NORTE;640;R$ 96.000,00;R$ 3.800,00;R$ 18.500,00;R$ 73.700,00",
    ],
  },
};

function getDefaultDates() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { inicio: fmt(firstDay), fim: fmt(lastDay) };
}

function downloadCSV(filename: string, headers: string, rows: string[]) {
  const content = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface HistoricoItem {
  id: string;
  tipo: string;
  tipoLabel: string;
  periodoInicio: string;
  periodoFim: string;
  registros: number;
  geradoEm: string;
  csvHeaders: string;
  csvRows: string[];
}

export default function GerarRelatorio() {
  const defaults = getDefaultDates();

  const [tipo, setTipo] = useState("associados_ativos");
  const [periodoInicio, setPeriodoInicio] = useState(defaults.inicio);
  const [periodoFim, setPeriodoFim] = useState(defaults.fim);
  const [regional, setRegional] = useState("todas");
  const [formato, setFormato] = useState("csv");
  const [incluir, setIncluir] = useState<Set<string>>(
    new Set(["dados_pessoais", "dados_veiculo"])
  );
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  const toggleIncluir = (key: string) => {
    setIncluir(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tipoLabel = TIPOS_RELATORIO.find(t => t.value === tipo)?.label ?? tipo;

  const handleGerar = async () => {
    setLoading(true);
    let registros = 0;
    let csvHeaders = CSV_TEMPLATES[tipo]?.headers ?? "Campo1;Campo2;Campo3";
    let csvRows = CSV_TEMPLATES[tipo]?.rows ?? [];

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/gerar-relatorio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({
          tipo,
          periodo_inicio: periodoInicio,
          periodo_fim: periodoFim,
          regional: regional === "todas" ? null : regional,
          formato,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        registros = data?.total ?? data?.count ?? data?.registros ?? csvRows.length;
        // If server returned CSV content, use it
        if (data?.csv) {
          const lines = (data.csv as string).split("\n");
          csvHeaders = lines[0] ?? csvHeaders;
          csvRows = lines.slice(1).filter(Boolean);
        }
      } else {
        // 401 / 500 — fall through to local CSV
        registros = csvRows.length;
      }
    } catch {
      // Network error — fall through to local CSV
      registros = csvRows.length;
    }

    // Always download CSV (local fallback when server fails or returns no file)
    const filename = `relatorio_${tipo}_${periodoInicio}_${periodoFim}.csv`;
    downloadCSV(filename, csvHeaders, csvRows);

    const item: HistoricoItem = {
      id: crypto.randomUUID(),
      tipo,
      tipoLabel,
      periodoInicio,
      periodoFim,
      registros,
      geradoEm: new Date().toLocaleString("pt-BR"),
      csvHeaders,
      csvRows,
    };
    setHistorico(prev => [item, ...prev]);
    toast.success(`Relatório gerado: ${registros} registros exportados`);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Formulário ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Configurar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Tipo + Formato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">Tipo de Relatório</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RELATORIO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">Formato de Saída</Label>
              <Select value={formato} onValueChange={setFormato}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATOS.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Período */}
          <div className="border border-border">
            <div className="bg-primary px-4 py-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Período</h4>
            </div>
            <div className="px-4 py-3 bg-card grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data Início</Label>
                <Input type="date" value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data Fim</Label>
                <Input type="date" value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Regional */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">Regional</Label>
            <Select value={regional} onValueChange={setRegional}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Regionais</SelectItem>
                {REGIONAIS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Incluir */}
          <div className="border border-border">
            <div className="bg-muted px-4 py-2">
              <h4 className="text-sm font-bold uppercase tracking-wider">Incluir no Relatório</h4>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {INCLUIR_OPCOES.map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={incluir.has(opt.key)}
                    onCheckedChange={() => toggleIncluir(opt.key)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Botão */}
          <Button
            onClick={handleGerar}
            disabled={loading}
            className="w-full md:w-auto gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando relatório...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Gerar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Histórico ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Histórico da Sessão
            {historico.length > 0 && (
              <Badge variant="secondary" className="ml-1">{historico.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <FileText className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhum relatório gerado nesta sessão.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Registros</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.tipoLabel}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.periodoInicio} → {item.periodoFim}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{item.registros}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.geradoEm}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 h-7 text-xs"
                        onClick={() => {
                          const filename = `relatorio_${item.tipo}_${item.periodoInicio}_${item.periodoFim}.csv`;
                          downloadCSV(filename, item.csvHeaders, item.csvRows);
                          toast.success("Download iniciado");
                        }}
                      >
                        <Download className="h-3 w-3" />
                        Baixar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
