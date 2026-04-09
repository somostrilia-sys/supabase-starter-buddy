import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Filter, Download, Plus, ChevronLeft, ChevronRight, Phone, Mail,
  MapPin, Car, CreditCard, User, MessageSquare, ExternalLink, Shield,
  ArrowRight, Check, Loader2, DatabaseZap, Upload, FileSpreadsheet, AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";

const BUSCA_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gia-associado-buscar`;
const BUSCA_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface BuscaResult {
  nome?: string;
  cpf?: string;
  veiculo?: string;
  situacao?: string;
  valorFipe?: string | number;
  [key: string]: unknown;
}

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const statusMap: Record<string, { label: string; class: string }> = {
  ativo: { label: "Ativo", class: "bg-emerald-500/15 text-emerald-400 border-0" },
  inativo: { label: "Inativo", class: "bg-muted text-muted-foreground border-0" },
  suspenso: { label: "Suspenso", class: "bg-warning/10 text-warning border-0" },
  cancelado: { label: "Cancelado", class: "bg-destructive/15 text-destructive border-0" },
};

const planos = ["Básico", "Intermediário", "Completo", "Premium"];

interface Associado {
  id: string; codigo: string; nome: string; cpf: string; rg: string; nascimento: string; sexo: string;
  estadoCivil: string; telefone: string; email: string; cidade: string; estado: string; cep: string;
  endereco: string; bairro: string; plano: string; status: string; dataAdesao: string; diaVencimento: number;
  veiculos: number; inadimplente: boolean;
}

const now = Date.now();
const day = 86400000;

export default function Associados() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("todos");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<Associado | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [associados, setAssociados] = useState<Associado[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [veiculosDoAssociado, setVeiculosDoAssociado] = useState<{placa: string; modelo: string; marca: string; status: string}[]>([]);

  // Carregar associados do banco
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("associados").select("*, veiculos(id, placa, modelo, marca, status)").order("nome").limit(500);
      const mapped: Associado[] = (data || []).map((a: any) => ({
        id: a.id, codigo: a.codigo || a.id.slice(0, 8).toUpperCase(),
        nome: a.nome || "—", cpf: a.cpf || "", rg: a.rg || "",
        nascimento: a.data_nascimento || "", sexo: a.sexo || "", estadoCivil: a.estado_civil || "",
        telefone: a.telefone || "", email: a.email || "",
        cidade: a.cidade || "", estado: a.uf || "", cep: a.cep || "",
        endereco: a.endereco || "", bairro: a.bairro || "",
        plano: a.plano || "—", status: (a.status || "ativo").toLowerCase(),
        dataAdesao: a.data_adesao || a.created_at?.split("T")[0] || "",
        diaVencimento: a.dia_vencimento || 10,
        veiculos: a.veiculos?.length || 0,
        inadimplente: a.inadimplente || false,
      }));
      setAssociados(mapped);
      setDbLoading(false);
    })();
  }, []);

  // Carregar veículos ao selecionar um associado
  useEffect(() => {
    if (!selected) { setVeiculosDoAssociado([]); return; }
    (async () => {
      const { data } = await supabase.from("veiculos").select("placa, modelo, marca, status").eq("associado_id", selected.id);
      setVeiculosDoAssociado((data || []).map((v: any) => ({ placa: v.placa || "", modelo: v.modelo || "", marca: v.marca || "", status: v.status || "Ativo" })));
    })();
  }, [selected?.id]);

  // Consulta externa state
  const [buscaOpen, setSgaOpen] = useState(false);
  const [buscaTerm, setSgaTerm] = useState("");
  const [buscaLoading, setSgaLoading] = useState(false);
  const [buscaResult, setBuscaResult] = useState<BuscaResult | null>(null);
  const [buscaError, setSgaError] = useState<string | null>(null);

  async function handleBuscar() {
    if (!buscaTerm.trim()) return;
    setSgaLoading(true);
    setBuscaResult(null);
    setSgaError(null);
    try {
      const res = await fetch(BUSCA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${BUSCA_KEY}`,
          "apikey": BUSCA_KEY,
        },
        body: JSON.stringify({ term: buscaTerm.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ${res.status}: ${text}`);
      }
      const json = await res.json();
      setBuscaResult(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setSgaError(msg);
      toast.error("Erro ao consultar:" + msg);
    } finally {
      setSgaLoading(false);
    }
  }

  // === Importar XLS state ===
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    total: number;
    cpfsUnicos: number;
    duplicados: number;
    statusMap: Record<string, number>;
    regionais: Record<string, number>;
    placas: number;
    amostra: Record<string, string>[];
  } | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ inseridos: number; atualizados: number; veiculos: number; erros: string[] } | null>(null);

  const STATUS_MAP: Record<string, string> = {
    "ATIVO": "ativo",
    "ATIVO - (MIGRADO)": "ativo",
    "INATIVO": "inativo",
    "INATIVO - RETIRADA RASTREADOR": "inativo",
    "INATIVO - COM PENDENCIA": "inativo_pendencia",
    "INADIMPLENTE": "inativo_pendencia",
    "INADIMPLENTE - (MIGRADO)": "inativo_pendencia",
    "PENDENTE": "pendente",
    "NEGADO": "cancelado",
  };

  function parseDate(raw: string | undefined): string | null {
    if (!raw || raw === "00/00/0000") return null;
    // Handle DD/MM/YYYY or DD/MM/YY
    const parts = raw.split("/");
    if (parts.length !== 3) return null;
    let [d, m, y] = parts;
    if (y.length === 2) y = Number(y) > 50 ? `19${y}` : `20${y}`;
    const date = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    if (isNaN(date.getTime())) return null;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  function cleanCpf(raw: string): string {
    return (raw || "").replace(/[.\-\/\s]/g, "");
  }

  function cleanPhone(raw: string | undefined): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10) return null;
    return digits;
  }

  async function handleImportFile(file: File) {
    setImportFile(file);
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

    // Row 0 is the title, row 1 is headers, data starts at row 2
    const headers = rows[1] || [];
    const data = rows.slice(2).filter(r => r && r.length > 5);

    // Index columns
    const col = {
      nome: 0, placa: 1, rg: 3, telefone: 10, telCelular: 32,
      email: 15, logradouro: 17, cidade: 18, regional: 20,
      dataCadastro: 22, matricula: 24, dataNasc: 28,
      cpf: 31, bairro: 38, estado: 39, situacao: 41,
    };

    // Deduplicate by CPF — keep most recent by data cadastro
    const cpfMap = new Map<string, string[]>();
    for (const row of data) {
      const cpf = cleanCpf(row[col.cpf]);
      if (!cpf || cpf.length < 11) continue;
      const existing = cpfMap.get(cpf);
      if (!existing) { cpfMap.set(cpf, row); continue; }
      const existDate = parseDate(existing[col.dataCadastro]);
      const newDate = parseDate(row[col.dataCadastro]);
      if (newDate && (!existDate || newDate > existDate)) cpfMap.set(cpf, row);
    }

    // Stats
    const statusCount: Record<string, number> = {};
    const regionalCount: Record<string, number> = {};
    let placaCount = 0;
    const placasSeen = new Set<string>();

    // Count all rows (not just deduplicated) for placas
    for (const row of data) {
      const placa = (row[col.placa] || "").trim();
      if (placa && !placasSeen.has(placa)) { placasSeen.add(placa); placaCount++; }
    }

    for (const [, row] of cpfMap) {
      const sit = (row[col.situacao] || "N/A").trim();
      statusCount[sit] = (statusCount[sit] || 0) + 1;
      const reg = (row[col.regional] || "N/A").trim();
      regionalCount[reg] = (regionalCount[reg] || 0) + 1;
    }

    // Sample 3 records
    const amostra: Record<string, string>[] = [];
    let count = 0;
    for (const [cpf, row] of cpfMap) {
      if (count >= 3) break;
      amostra.push({ nome: row[col.nome], cpf, cidade: row[col.cidade], status: row[col.situacao], regional: row[col.regional] });
      count++;
    }

    setImportPreview({
      total: data.length,
      cpfsUnicos: cpfMap.size,
      duplicados: data.length - cpfMap.size,
      statusMap: statusCount,
      regionais: regionalCount,
      placas: placaCount,
      amostra,
    });
    setImportStep("preview");
  }

  async function handleImportConfirm() {
    if (!importFile) return;
    setImportStep("importing");
    setImportProgress(0);

    const ab = await importFile.arrayBuffer();
    const wb = XLSX.read(ab, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
    const data = rows.slice(2).filter(r => r && r.length > 5);

    const col = {
      nome: 0, placa: 1, rg: 3, telefone: 10, telCelular: 32,
      email: 15, logradouro: 17, cidade: 18, regional: 20,
      dataCadastro: 22, dataNasc: 28, cpf: 31, bairro: 38,
      estado: 39, situacao: 41,
    };

    // Deduplicate
    const cpfMap = new Map<string, string[]>();
    const cpfPlacas = new Map<string, Set<string>>();
    for (const row of data) {
      const cpf = cleanCpf(row[col.cpf]);
      if (!cpf || cpf.length < 11) continue;
      // Track all placas per CPF
      const placa = (row[col.placa] || "").trim();
      if (placa) {
        if (!cpfPlacas.has(cpf)) cpfPlacas.set(cpf, new Set());
        cpfPlacas.get(cpf)!.add(placa);
      }
      const existing = cpfMap.get(cpf);
      if (!existing) { cpfMap.set(cpf, row); continue; }
      const existDate = parseDate(existing[col.dataCadastro]);
      const newDate = parseDate(row[col.dataCadastro]);
      if (newDate && (!existDate || newDate > existDate)) cpfMap.set(cpf, row);
    }

    // Load regionais from DB
    const { data: regData } = await supabase.from("regionais").select("id, nome");
    const regMap = new Map<string, string>();
    for (const r of regData || []) {
      regMap.set((r.nome || "").toUpperCase().trim(), r.id);
    }

    const entries = Array.from(cpfMap.entries());
    const total = entries.length;
    let inseridos = 0, atualizados = 0, veiculosCount = 0;
    const erros: string[] = [];
    const BATCH = 50;

    for (let i = 0; i < total; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      const associadosBatch = batch.map(([cpf, row]) => {
        const endereco = [row[col.logradouro], row[col.bairro]].filter(Boolean).join(", ");
        const situacao = (row[col.situacao] || "").trim();
        const status = STATUS_MAP[situacao] || "ativo";
        const regionalNome = (row[col.regional] || "").toUpperCase().trim();
        const regional_id = regMap.get(regionalNome) || null;
        const telefone = cleanPhone(row[col.telCelular]) || cleanPhone(row[col.telefone]);

        return {
          cpf,
          nome: (row[col.nome] || "").trim(),
          rg: (row[col.rg] || "").trim() || null,
          email: (row[col.email] || "").trim() || null,
          telefone: telefone || null,
          endereco: endereco || null,
          cidade: (row[col.cidade] || "").trim() || null,
          estado: (row[col.estado] || "").trim() || null,
          data_nascimento: parseDate(row[col.dataNasc]),
          data_adesao: parseDate(row[col.dataCadastro]) || new Date().toISOString().split("T")[0],
          status,
          regional_id,
        };
      });

      // Upsert associados
      const { data: upserted, error } = await supabase
        .from("associados")
        .upsert(associadosBatch, { onConflict: "cpf", ignoreDuplicates: false })
        .select("id, cpf");

      if (error) {
        erros.push(`Batch ${i}-${i + BATCH}: ${error.message}`);
        setImportProgress(Math.round(((i + BATCH) / total) * 100));
        continue;
      }

      // Map CPF → associado_id for veiculos
      const cpfIdMap = new Map<string, string>();
      for (const u of upserted || []) cpfIdMap.set(u.cpf, u.id);

      // Check which were inserts vs updates (we count based on upsert result)
      for (const a of associadosBatch) {
        if (cpfIdMap.has(a.cpf)) atualizados++;
      }

      // Insert veiculos for this batch
      const veiculosBatch: { placa: string; associado_id: string; marca: string; modelo: string }[] = [];
      for (const [cpf] of batch) {
        const assocId = cpfIdMap.get(cpf);
        if (!assocId) continue;
        const placas = cpfPlacas.get(cpf);
        if (!placas) continue;
        for (const placa of placas) {
          veiculosBatch.push({ placa, associado_id: assocId, marca: "A DEFINIR", modelo: "A DEFINIR" });
        }
      }

      if (veiculosBatch.length > 0) {
        const { error: vErr, count: vCount } = await supabase
          .from("veiculos")
          .upsert(veiculosBatch, { onConflict: "placa", ignoreDuplicates: true, count: "exact" });
        if (vErr) {
          erros.push(`Veículos batch ${i}: ${vErr.message}`);
        } else {
          veiculosCount += vCount || veiculosBatch.length;
        }
      }

      setImportProgress(Math.round(((i + BATCH) / total) * 100));
    }

    setImportResult({ inseridos, atualizados, veiculos: veiculosCount, erros });
    setImportStep("done");
    setImportProgress(100);

    // Reload associados
    const { data: reloadData } = await supabase.from("associados").select("*, veiculos(id, placa, modelo, marca, status)").order("nome").limit(500);
    const mapped: Associado[] = (reloadData || []).map((a: any) => ({
      id: a.id, codigo: a.codigo || a.id.slice(0, 8).toUpperCase(),
      nome: a.nome || "—", cpf: a.cpf || "", rg: a.rg || "",
      nascimento: a.data_nascimento || "", sexo: a.sexo || "", estadoCivil: a.estado_civil || "",
      telefone: a.telefone || "", email: a.email || "",
      cidade: a.cidade || "", estado: a.uf || "", cep: a.cep || "",
      endereco: a.endereco || "", bairro: a.bairro || "",
      plano: a.plano || "—", status: (a.status || "ativo").toLowerCase(),
      dataAdesao: a.data_adesao || a.created_at?.split("T")[0] || "",
      diaVencimento: a.dia_vencimento || 10,
      veiculos: a.veiculos?.length || 0,
      inadimplente: a.inadimplente || false,
    }));
    setAssociados(mapped);
    toast.success(`Importação concluída: ${atualizados} associados, ${veiculosCount} veículos`);
  }

  function resetImport() {
    setImportStep("upload");
    setImportFile(null);
    setImportPreview(null);
    setImportProgress(0);
    setImportResult(null);
  }

  const filtered = useMemo(() => {
    let list = associados;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => c.nome.toLowerCase().includes(s) || c.cpf.includes(s) || c.codigo.toLowerCase().includes(s));
    }
    if (tab === "ativos") list = list.filter(c => c.status === "ativo");
    if (tab === "inativos") list = list.filter(c => c.status !== "ativo");
    if (tab === "inadimplentes") list = list.filter(c => c.inadimplente);
    if (tab === "novos") list = list.filter(c => (now - new Date(c.dataAdesao).getTime()) < 30 * day);
    return list;
  }, [search, tab]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  const stepLabels = ["Dados Pessoais", "Contato", "Endereço", "Plano"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associados</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} associados · {associados.filter(a=>a.status==="ativo").length} ativos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>

          {/* Importar XLS */}
          <Dialog open={importOpen} onOpenChange={o => { setImportOpen(o); if (!o) resetImport(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10">
                <Upload className="h-4 w-4 mr-1" /> Importar XLS
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Importar Relatório de Associados
                </DialogTitle>
              </DialogHeader>

              {importStep === "upload" && (
                <div className="space-y-4 mt-2">
                  <p className="text-xs text-muted-foreground">Selecione o arquivo .xls com os dados dos associados.</p>
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/60 rounded-lg p-8 cursor-pointer hover:border-emerald-500/40 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clique para selecionar ou arraste o arquivo</span>
                    <span className="text-[10px] text-muted-foreground">.xls ou .xlsx</span>
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
                    />
                  </label>
                </div>
              )}

              {importStep === "preview" && importPreview && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
                      <p className="text-lg font-bold text-emerald-400">{importPreview.cpfsUnicos.toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-muted-foreground">CPFs únicos</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
                      <p className="text-lg font-bold text-sky-400">{importPreview.placas.toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-muted-foreground">Placas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
                      <p className="text-lg font-bold text-orange-400">{importPreview.duplicados.toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-muted-foreground">Linhas duplicadas</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Mapeamento de Status</p>
                    <div className="space-y-1">
                      {Object.entries(importPreview.statusMap).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/30">
                          <span>{k}</span>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge className="text-[9px]">{STATUS_MAP[k.trim()] || "ativo"}</Badge>
                            <span className="text-muted-foreground font-mono text-[10px]">{v}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Regionais</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(importPreview.regionais).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/30">
                          <span className="truncate">{k}</span>
                          <span className="text-muted-foreground font-mono text-[10px]">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Amostra</p>
                    {importPreview.amostra.map((a, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-muted/30 mb-1">
                        <span className="font-medium">{a.nome}</span> · <span className="font-mono">{a.cpf}</span> · {a.cidade} · {a.status}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={resetImport}>Cancelar</Button>
                    <Button size="sm" onClick={handleImportConfirm} className="bg-emerald-600 hover:bg-emerald-700">
                      <Check className="h-4 w-4 mr-1" /> Confirmar Importação
                    </Button>
                  </div>
                </div>
              )}

              {importStep === "importing" && (
                <div className="space-y-4 mt-4 py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <p className="text-sm font-medium">Importando associados...</p>
                    <p className="text-xs text-muted-foreground">{importProgress}% concluído</p>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}

              {importStep === "done" && importResult && (
                <div className="space-y-4 mt-2">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="h-6 w-6 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium">Importação concluída!</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
                      <p className="text-lg font-bold text-emerald-400">{importResult.atualizados.toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-muted-foreground">Associados processados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/40 text-center">
                      <p className="text-lg font-bold text-sky-400">{importResult.veiculos.toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] text-muted-foreground">Veículos vinculados</p>
                    </div>
                  </div>

                  {importResult.erros.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {importResult.erros.length} erro(s)
                      </p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {importResult.erros.map((e, i) => (
                          <p key={i} className="text-[10px] text-destructive/80">{e}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => { setImportOpen(false); resetImport(); }}>Fechar</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Consultar Associado */}
          <Dialog open={buscaOpen} onOpenChange={o => { setSgaOpen(o); if (!o) { setSgaTerm(""); setBuscaResult(null); setSgaError(null); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10">
                <DatabaseZap className="h-4 w-4 mr-1" /> Consultar Associado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><DatabaseZap className="h-4 w-4 text-sky-400" /> Consultar Associado</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <p className="text-xs text-muted-foreground">Informe CPF, placa ou telefone para consultar.</p>
                <div className="flex gap-2">
                  <Input
                    className="h-9 text-xs flex-1"
                    placeholder="CPF, placa ou telefone..."
                    value={buscaTerm}
                    onChange={e => setSgaTerm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleBuscar()}
                  />
                  <Button size="sm" onClick={handleBuscar} disabled={buscaLoading || !buscaTerm.trim()}>
                    {buscaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {buscaError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                    {buscaError}
                  </div>
                )}

                {buscaResult && !buscaError && (
                  <div className="p-3 rounded-lg border border-border/50 bg-card space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Resultado</p>
                    {buscaResult.nome && (
                      <div className="flex items-center gap-2 text-xs">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{String(buscaResult.nome)}</span>
                      </div>
                    )}
                    {buscaResult.cpf && (
                      <div className="flex items-center gap-2 text-xs">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono">{String(buscaResult.cpf)}</span>
                      </div>
                    )}
                    {buscaResult.veiculo && (
                      <div className="flex items-center gap-2 text-xs">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{String(buscaResult.veiculo)}</span>
                      </div>
                    )}
                    {buscaResult.situacao && (
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border-0">{String(buscaResult.situacao)}</Badge>
                      </div>
                    )}
                    {buscaResult.valorFipe != null && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">FIPE:</span>
                        <span className="font-mono text-emerald-400">
                          {typeof buscaResult.valorFipe === "number"
                            ? `R$ ${buscaResult.valorFipe.toLocaleString("pt-BR")}`
                            : String(buscaResult.valorFipe)}
                        </span>
                      </div>
                    )}
                    {/* fallback: show all keys if standard fields are missing */}
                    {!buscaResult.nome && !buscaResult.cpf && !buscaResult.veiculo && (
                      <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
                        {JSON.stringify(buscaResult, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                {buscaLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
                    <span className="ml-2 text-xs text-muted-foreground">Consultando...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={modalOpen} onOpenChange={o => { setModalOpen(o); if (!o) setStep(1); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Associado</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Associado</DialogTitle></DialogHeader>
              <div className="flex items-center gap-2 mb-4">
                {stepLabels.map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step > i + 1 ? "bg-emerald-500/20 text-emerald-400" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className="text-[10px] hidden sm:inline text-muted-foreground">{l}</span>
                    {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              {step === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2"><Label className="text-xs">Nome Completo *</Label><Input className="h-9 text-xs" placeholder="Nome completo" /></div>
                    <div className="space-y-1"><Label className="text-xs">CPF *</Label><Input className="h-9 text-xs" placeholder="000.000.000-00" /></div>
                    <div className="space-y-1"><Label className="text-xs">RG</Label><Input className="h-9 text-xs" placeholder="00.000.000-0" /></div>
                    <div className="space-y-1"><Label className="text-xs">Data Nascimento</Label><Input type="date" className="h-9 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Sexo</Label>
                      <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Feminino</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Estado Civil</Label>
                      <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{["Solteiro","Casado","Divorciado","Viúvo"].map(e=><SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Celular *</Label><Input className="h-9 text-xs" placeholder="(11) 99999-9999" /></div>
                  <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-9 text-xs" placeholder="email@exemplo.com" /></div>
                  <div className="space-y-1"><Label className="text-xs">Telefone Comercial</Label><Input className="h-9 text-xs" placeholder="(11) 3333-3333" /></div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">CEP</Label><Input className="h-9 text-xs" placeholder="00000-000" /></div>
                    <div className="space-y-1 col-span-2"><Label className="text-xs">Endereço</Label><Input className="h-9 text-xs" placeholder="Rua, número" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-xs">Bairro</Label><Input className="h-9 text-xs" /></div>
                    <div className="space-y-1"><Label className="text-xs">Estado</Label>
                      <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>{ufs.map(u=><SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Cidade</Label><Input className="h-9 text-xs" /></div>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent><SelectItem value="sp">Cooperativa Central SP</SelectItem><SelectItem value="rj">Cooperativa Central RJ</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Regional</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent><SelectItem value="capital">Capital</SelectItem><SelectItem value="interior">Interior</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Plano</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{planos.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Dia de Vencimento</Label>
                    <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{[5,10,15,20,25].map(d=><SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-4">
                <Button variant="outline" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Voltar</Button>
                {step < 4 ? (
                  <Button onClick={() => setStep(s => s + 1)}>Próximo <ArrowRight className="h-4 w-4 ml-1" /></Button>
                ) : (
                  <Button onClick={() => { setModalOpen(false); setStep(1); }}>Cadastrar Associado</Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(0); }}>
        <TabsList>
          <TabsTrigger value="todos" className="text-xs">Todos ({associados.length})</TabsTrigger>
          <TabsTrigger value="ativos" className="text-xs">Ativos</TabsTrigger>
          <TabsTrigger value="inativos" className="text-xs">Inativos</TabsTrigger>
          <TabsTrigger value="inadimplentes" className="text-xs">Inadimplentes</TabsTrigger>
          <TabsTrigger value="novos" className="text-xs">Novos (30d)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou código..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild><Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Plano</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{planos.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Período Adesão</Label>
                <div className="grid grid-cols-2 gap-2"><Input type="date" className="text-xs h-9" /><Input type="date" className="text-xs h-9" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Inadimplente</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => setFilterOpen(false)}>Aplicar</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b-2 border-[#747474] bg-muted/30">
                {["Código","Nome","CPF","Status","Telefone","Cidade/UF","Plano","Adesão","Venc.","Veíc."].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pageData.map(a => (
                  <tr key={a.id} className="border-b-2 border-[#747474] hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setSelected(a)}>
                    <td className="p-3 text-xs font-mono text-primary">{a.codigo}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/20 text-primary">{a.nome.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                        <div>
                          <span className="text-xs font-medium">{a.nome}</span>
                          {a.inadimplente && <Badge className="ml-2 text-[8px] bg-destructive/15 text-destructive border-0">INADIMPLENTE</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono text-muted-foreground">{a.cpf}</td>
                    <td className="p-3"><Badge className={`text-[9px] ${statusMap[a.status].class}`}>{statusMap[a.status].label}</Badge></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        {a.telefone}
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-400 cursor-pointer" />
                      </div>
                    </td>
                    <td className="p-3 text-xs">{a.cidade}/{a.estado}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[9px]">{a.plano}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(a.dataAdesao).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-xs text-center">{a.diaVencimento}</td>
                    <td className="p-3"><Badge variant="secondary" className="text-[9px]">{a.veiculos}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Por página:</span>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{page*perPage+1}-{Math.min((page+1)*perPage, filtered.length)} de {filtered.length}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages-1} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-[420px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Avatar className="h-16 w-16"><AvatarFallback className="text-lg bg-primary text-primary-foreground">{selected.nome.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <h3 className="font-bold text-lg">{selected.nome}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] font-mono">{selected.codigo}</Badge>
                  <Badge className={`text-[10px] ${statusMap[selected.status].class}`}>{statusMap[selected.status].label}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><User className="h-3 w-3" /> Dados Pessoais</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">CPF:</span> <span className="font-mono">{selected.cpf}</span></div>
                  <div><span className="text-muted-foreground">RG:</span> {selected.rg}</div>
                  <div><span className="text-muted-foreground">Nascimento:</span> {new Date(selected.nascimento).toLocaleDateString("pt-BR")}</div>
                  <div><span className="text-muted-foreground">Sexo:</span> {selected.sexo}</div>
                  <div><span className="text-muted-foreground">Estado Civil:</span> {selected.estadoCivil}</div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Phone className="h-3 w-3" /> Contato</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selected.telefone}<MessageSquare className="h-3.5 w-3.5 text-emerald-400 ml-auto cursor-pointer" /></div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selected.email}</div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> Endereço</p>
                <p className="text-xs">{selected.endereco} - {selected.bairro}</p>
                <p className="text-xs text-muted-foreground">{selected.cidade}/{selected.estado} - CEP {selected.cep}</p>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Plano & Adesão</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Plano:</span> <Badge variant="outline" className="text-[9px]">{selected.plano}</Badge></div>
                  <div><span className="text-muted-foreground">Adesão:</span> {new Date(selected.dataAdesao).toLocaleDateString("pt-BR")}</div>
                  <div><span className="text-muted-foreground">Vencimento:</span> Dia {selected.diaVencimento}</div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Car className="h-3 w-3" /> Veículos ({veiculosDoAssociado.length})</p>
                {veiculosDoAssociado.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum veículo vinculado.</p>
                ) : veiculosDoAssociado.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card text-xs mb-1.5">
                    <div>
                      <p className="font-medium">{v.marca} {v.modelo}</p>
                      <Badge variant="secondary" className="text-[8px] font-mono mt-0.5">{v.placa}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => navigate(`/gestao/veiculos?placa=${v.placa}`)}><ExternalLink className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1"><CreditCard className="h-3 w-3" /> Informações</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Veículos:</span> {veiculosDoAssociado.length}</div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge className={`text-[8px] ${statusMap[selected.status]?.class || ""}`}>{statusMap[selected.status]?.label || selected.status}</Badge></div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
