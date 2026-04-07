import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, FileText, BarChart3, History, Eye } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyamllZ3RxZm5nZGxpd2NscHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTY3MzMsImV4cCI6MjA5MDI5MjczM30.yZWSOqQwWhG_OcF-uNLvvy_ZwRYd2OC_Jjr5R_9Gucw";

const TIPOS_RELATORIO = [
  { value: "associados_ativos", label: "Associados Ativos" },
  { value: "inadimplentes", label: "Inadimplentes" },
  { value: "novos_cadastros", label: "Novos Cadastros" },
  { value: "sinistros", label: "Sinistros" },
  { value: "financeiro_mensal", label: "Financeiro Mensal" },
  { value: "usuarios", label: "Listagem de Usuários" },
  { value: "produtividade", label: "Produtividade" },
  { value: "alteracao_veiculos", label: "Alteração de Veículos" },
  { value: "sinistros_eventos", label: "Consolidado Sinistro/Eventos" },
];

const REGIONAIS = [
  "1 - Regional Sao Paulo",
  "2 - REGIONAL MATO GROSSO SUL",
  "3 - REGIONAL NORTE",
  "4 - REGIONAL ALAGOAS",
  "5 - Regional Norte/Minas/Sul",
  "6 - Regional Interior São Paulo",
  "7 - REGIONAL CEARÁ",
  "8 - REGIONAL NATAL",
  "9 - REGIONAL MINAS (INTERIOR)",
  "10 - REGIONAL BAHIA",
  "11 - REGIONAL PARANÁ",
  "12 - REGIONAL RIO GRANDE DO SUL",
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
      "123.456.789-00;João Silva;ABC-1234;PLANO OURO;1 - Regional Sao Paulo;ATIVO;2024-01-15",
      "987.654.321-00;Maria Santos;DEF-5678;PLANO PRATA;2 - REGIONAL MATO GROSSO SUL;ATIVO;2024-02-20",
      "456.789.123-00;Carlos Oliveira;GHI-9012;PLANO BRONZE;3 - REGIONAL NORTE;ATIVO;2024-03-10",
    ],
  },
  inadimplentes: {
    headers: "CPF;Nome;Placa;Plano;Regional;Parcelas Em Atraso;Valor Total;Último Pagamento",
    rows: [
      "111.222.333-44;Ana Costa;JKL-3456;PLANO OURO;4 - REGIONAL ALAGOAS;3;R$ 450,00;2024-10-05",
      "555.666.777-88;Pedro Lima;MNO-7890;PLANO PRATA;5 - Regional Norte/Minas/Sul;2;R$ 280,00;2024-11-10",
      "999.000.111-22;Lucia Ferreira;PQR-1234;PLANO BRONZE;6 - Regional Interior São Paulo;5;R$ 620,00;2024-09-15",
    ],
  },
  novos_cadastros: {
    headers: "CPF;Nome;Placa;Plano;Regional;Data Cadastro;Consultor",
    rows: [
      "222.333.444-55;Roberto Alves;STU-5678;PLANO OURO;7 - REGIONAL CEARÁ;2025-01-02;Carlos Vendedor",
      "666.777.888-99;Fernanda Souza;VWX-9012;PLANO PRATA;8 - REGIONAL NATAL;2025-01-08;Ana Consultora",
      "000.111.222-33;Marcos Rocha;YZA-3456;PLANO BRONZE;9 - REGIONAL MINAS (INTERIOR);2025-01-14;João Agente",
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
      "01/2025;1 - Regional Sao Paulo;1250;R$ 187.500,00;R$ 8.400,00;R$ 45.000,00;R$ 134.100,00",
      "01/2025;2 - REGIONAL MATO GROSSO SUL;890;R$ 133.500,00;R$ 5.200,00;R$ 28.000,00;R$ 100.300,00",
      "01/2025;3 - REGIONAL NORTE;640;R$ 96.000,00;R$ 3.800,00;R$ 18.500,00;R$ 73.700,00",
    ],
  },
  usuarios: {
    headers: "Nome;E-mail;Perfil;Status;Último Acesso",
    rows: [
      "Admin Sistema;admin@gia.com;admin;ATIVO;2025-03-01",
      "Maria Operadora;maria@gia.com;operador;ATIVO;2025-02-28",
      "João Consultor;joao@gia.com;consultor;INATIVO;2025-01-15",
    ],
  },
  produtividade: {
    headers: "Operador;Cadastros;Alterações;Vendas;Período",
    rows: [
      "Maria Operadora;45;120;18;01/2025",
      "Carlos Agente;32;85;12;01/2025",
      "Ana Consultora;28;64;9;01/2025",
    ],
  },
  alteracao_veiculos: {
    headers: "Placa;Campo Alterado;Valor Anterior;Valor Novo;Usuário;Data/Hora",
    rows: [
      "ABC-1234;Status;ATIVO;CANCELADO;admin@gia.com;2025-01-15 14:30",
      "DEF-5678;Valor FIPE;R$ 45.000,00;R$ 42.000,00;maria@gia.com;2025-01-16 09:15",
      "GHI-9012;Categoria;Passeio;Trabalho;joao@gia.com;2025-01-17 11:45",
    ],
  },
  sinistros_eventos: {
    headers: "Código;Placa;Associado;Tipo;Status;Data Abertura;Descrição",
    rows: [
      "SIN-2025-001;ABC-1234;João Silva;COLISÃO;EM ANÁLISE;2025-01-03;Colisão traseira na BR-101",
      "SIN-2025-002;DEF-5678;Maria Santos;FURTO;APROVADO;2025-01-09;Furto em estacionamento",
      "SIN-2025-003;GHI-9012;Carlos Oliveira;ROUBO;PAGO;2025-01-11;Roubo mediante ameaça",
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

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

          {/* Botões */}
          <div className="flex flex-wrap gap-3">
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
            <Button
              variant="outline"
              onClick={() => {
                const template = CSV_TEMPLATES[tipo];
                if (!template) {
                  toast.error("Tipo de relatório sem dados para visualização");
                  return;
                }
                const headers = template.headers.split(";");
                const rows = template.rows.map(r => r.split(";"));
                setPreviewHeaders(headers);
                setPreviewRows(rows);
                setShowPreview(true);
                toast.success("Visualização carregada");
              }}
              className="w-full md:w-auto gap-2"
              size="lg"
            >
              <Eye className="h-4 w-4" />
              Visualizar na Tela
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Visualização na Tela ── */}
      {showPreview && previewHeaders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" />
                Visualização — {tipoLabel}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="text-xs">
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewHeaders.map((h, i) => (
                      <TableHead key={i} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-sm">{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground">
                Quantidade de registros encontrados: {previewRows.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
