import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Receipt, Search, Download, FileDown, Printer, DollarSign, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

// Mapa status SGA → label + cor. Status SGA: 1=BAIXADO, 2=ABERTO, 999=EXCLUIDO
type Opt = { label: string; cor: string };
const statusMap: Record<string, Opt> = {
  pago:      { label: "Baixado",   cor: "bg-success/10 text-success border-success/20" },
  baixado:   { label: "Baixado",   cor: "bg-success/10 text-success border-success/20" },
  aberto:    { label: "Aberto",    cor: "bg-amber-100 text-amber-800 border-amber-200" },
  pendente:  { label: "Pendente",  cor: "bg-amber-100 text-amber-800 border-amber-200" },
  atrasado:  { label: "Vencido",   cor: "bg-destructive/10 text-destructive border-destructive/20" },
  vencido:   { label: "Vencido",   cor: "bg-destructive/10 text-destructive border-destructive/20" },
  excluido:  { label: "Excluído",  cor: "bg-gray-200 text-gray-700 border-gray-300" },
  cancelado: { label: "Excluído",  cor: "bg-gray-200 text-gray-700 border-gray-300" },
};

const situacaoSgaLabel = (b: any) => {
  const cod = String(b.codigo_situacao_sga || "");
  if (cod === "1") return "baixado";
  if (cod === "2") return "aberto";
  if (cod === "999") return "excluido";
  if (b.data_pagamento) return "baixado";
  if (b.status === "baixado" || b.status === "pago") return "baixado";
  const hoje = new Date().toISOString().slice(0, 10);
  if (b.vencimento && b.vencimento < hoje) return "vencido";
  return "aberto";
};

const brl = (v: number | null | undefined) => (Number(v ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dtBr = (d: string | null | undefined) => d ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR") : "-";

const PAGE_SIZE = 100;

export default function Boletos() {
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiroDiaAno = `${new Date().getFullYear()}-01-01`;

  const [status, setStatus] = useState<string>("todos");
  const [de, setDe] = useState(primeiroDiaAno);
  const [ate, setAte] = useState(hoje);
  const [regional, setRegional] = useState("todas");
  const [cooperativa, setCooperativa] = useState("todas");
  const [associado, setAssociado] = useState("");
  const [placa, setPlaca] = useState("");
  const [nossoNumero, setNossoNumero] = useState("");
  const [page, setPage] = useState(1);

  const { data: regionais = [] } = useQuery({
    queryKey: ["regionais-lista"],
    queryFn: async () => {
      const { data } = await supabase.from("regionais").select("id, nome").eq("ativo", true).order("nome");
      return data ?? [];
    },
  });
  const { data: cooperativas = [] } = useQuery({
    queryKey: ["cooperativas-lista"],
    queryFn: async () => {
      const { data } = await supabase.from("cooperativas").select("id, nome").eq("ativo", true).order("nome");
      return data ?? [];
    },
  });

  const filtros = { status, de, ate, regional, cooperativa, associado, placa, nossoNumero };

  const buildQuery = (countOnly = false) => {
    let q: any = supabase
      .from("boletos")
      .select(
        countOnly
          ? "id"
          : "id, nosso_numero, valor, vencimento, data_pagamento, valor_pagamento, status, codigo_situacao_sga, situacao_descricao, referencia, codigo_banco, nome_banco, tipo, linha_digitavel, pix_copia_cola, pdf_storage_path, link_boleto, data_emissao, associado_nome, cpf_associado, regional_id, cooperativa_id, veiculos:veiculo_id(placa, modelo, marca)",
        { count: "exact", head: countOnly },
      )
      .gte("vencimento", de)
      .lte("vencimento", ate);

    if (status === "baixado") q = q.or("status.eq.baixado,status.eq.pago,data_pagamento.not.is.null");
    else if (status === "aberto") q = q.is("data_pagamento", null).gte("vencimento", hoje).not("status", "in", "(baixado,pago,excluido,cancelado)");
    else if (status === "vencido") q = q.is("data_pagamento", null).lt("vencimento", hoje).not("status", "in", "(baixado,pago,excluido,cancelado)");
    else if (status === "excluido") q = q.or("status.eq.excluido,status.eq.cancelado,codigo_situacao_sga.eq.999");

    if (regional !== "todas") q = q.eq("regional_id", regional);
    if (cooperativa !== "todas") q = q.eq("cooperativa_id", cooperativa);
    if (placa.trim()) q = q.eq("veiculos.placa", placa.trim().toUpperCase());
    if (nossoNumero.trim()) q = q.eq("nosso_numero", nossoNumero.trim());
    if (associado.trim()) {
      const t = associado.trim();
      q = q.or(`associado_nome.ilike.%${t}%,cpf_associado.ilike.%${t.replace(/\D/g, "")}%`);
    }
    return q;
  };

  const { data: boletos = [], isLoading, isFetching } = useQuery({
    queryKey: ["relatorio-boletos", filtros, page],
    queryFn: async () => {
      const q = buildQuery(false)
        .order("vencimento", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: total = 0 } = useQuery({
    queryKey: ["relatorio-boletos-count", filtros],
    queryFn: async () => {
      const { count } = await buildQuery(true);
      return count ?? 0;
    },
  });

  const { data: somas } = useQuery({
    queryKey: ["relatorio-boletos-somas", filtros],
    queryFn: async () => {
      // Agregações no Postgres via RPC seriam ideais; por ora, somamos via query leve
      const { data } = await buildQuery(false).limit(10000).select("valor, valor_pagamento, data_pagamento, vencimento, status, codigo_situacao_sga");
      const rows = (data ?? []) as any[];
      let emitido = 0, pago = 0, aberto = 0, vencido = 0, excluido = 0;
      const h = new Date().toISOString().slice(0, 10);
      for (const b of rows) {
        emitido += Number(b.valor ?? 0);
        const sit = situacaoSgaLabel(b);
        if (sit === "baixado") pago += Number(b.valor_pagamento ?? b.valor ?? 0);
        else if (sit === "aberto") aberto += Number(b.valor ?? 0);
        else if (sit === "vencido") vencido += Number(b.valor ?? 0);
        else if (sit === "excluido") excluido += Number(b.valor ?? 0);
      }
      return { emitido, pago, aberto, vencido, excluido, rows: rows.length };
    },
  });

  const pages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const abrirPdf = async (b: any) => {
    if (b.pdf_storage_path) {
      const { data, error } = await supabase.storage.from("sga-boletos").createSignedUrl(b.pdf_storage_path, 3600);
      if (error || !data?.signedUrl) { toast.error("Falha ao abrir PDF"); return; }
      window.open(data.signedUrl, "_blank");
    } else if (b.link_boleto) {
      window.open(b.link_boleto, "_blank");
    } else {
      toast.info("Sem PDF disponível. Gere uma 2ª via via Cora na aba Financeiro do associado.");
    }
  };

  const exportarCsv = async () => {
    toast.info("Exportando até 10.000 linhas...");
    const { data } = await buildQuery(false).order("vencimento", { ascending: false }).limit(10000);
    const rows = (data ?? []) as any[];
    const headers = ["Nº Título","Associado","CPF","Placa","Regional","Cooperativa","Emissão","Vencimento","Pagamento","Valor","Valor Pago","Status","Banco","Tipo"];
    const csv = [headers.join(";")].concat(rows.map(b => [
      b.nosso_numero ?? "",
      (b.associado_nome ?? "").replace(/;/g, ","),
      b.cpf_associado ?? "",
      b.veiculos?.placa ?? "",
      regionais.find((r: any) => r.id === b.regional_id)?.nome ?? "",
      cooperativas.find((c: any) => c.id === b.cooperativa_id)?.nome ?? "",
      b.data_emissao ?? "",
      b.vencimento ?? "",
      b.data_pagamento ?? "",
      String(b.valor ?? 0).replace(".", ","),
      String(b.valor_pagamento ?? "").replace(".", ","),
      statusMap[situacaoSgaLabel(b)]?.label ?? "-",
      b.nome_banco ?? "",
      b.tipo ?? "",
    ].join(";"))).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `boletos_${de}_${ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center"><Receipt className="h-5 w-5 text-accent" /></div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Relatório de Boletos</h1>
          <p className="text-sm text-muted-foreground">Histórico completo do SGA — baixados, abertos, vencidos, excluídos</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportarCsv}>
          <FileDown className="h-3.5 w-3.5" /> Exportar CSV
        </Button>
      </div>

      <Card><CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="baixado">Baixado</SelectItem>
                <SelectItem value="aberto">Aberto (a vencer)</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="excluido">Excluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Regional</Label>
            <Select value={regional} onValueChange={(v) => { setRegional(v); setPage(1); }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {regionais.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cooperativa</Label>
            <Select value={cooperativa} onValueChange={(v) => { setCooperativa(v); setPage(1); }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {cooperativas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Vencimento de</Label>
            <Input type="date" value={de} onChange={(e) => { setDe(e.target.value); setPage(1); }} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">até</Label>
            <Input type="date" value={ate} onChange={(e) => { setAte(e.target.value); setPage(1); }} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Nosso Número</Label>
            <Input value={nossoNumero} onChange={(e) => setNossoNumero(e.target.value)} className="mt-1" placeholder="123456" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Associado (nome ou CPF)</Label>
            <Input value={associado} onChange={(e) => setAssociado(e.target.value)} className="mt-1" placeholder="Nome ou CPF" />
          </div>
          <div>
            <Label className="text-xs">Placa</Label>
            <Input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} className="mt-1" placeholder="ABC1D23" />
          </div>
          <div className="flex items-end">
            <Button className="w-full gap-1.5" onClick={() => setPage(1)}>
              <Search className="h-3.5 w-3.5" /> Aplicar
            </Button>
          </div>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Boletos</p><p className="text-lg font-bold">{total.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Emitido</p><p className="text-lg font-bold text-primary">{brl(somas?.emitido ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Baixado</p><p className="text-lg font-bold text-success">{brl(somas?.pago ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">A vencer</p><p className="text-lg font-bold text-amber-600">{brl(somas?.aberto ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Vencido</p><p className="text-lg font-bold text-destructive">{brl(somas?.vencido ?? 0)}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Carregando boletos...</div>
        ) : (
          <ScrollArea className="w-full">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nº Título</TableHead>
                <TableHead>Associado</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {boletos.length === 0 ? (
                  <TableRow><TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-12">Nenhum boleto nos filtros selecionados.</TableCell></TableRow>
                ) : boletos.map((b: any) => {
                  const sit = situacaoSgaLabel(b);
                  const style = statusMap[sit] ?? { label: sit, cor: "" };
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="text-xs font-mono">{b.nosso_numero ?? "-"}</TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{b.associado_nome ?? "-"}</div>
                        <div className="text-muted-foreground">{b.cpf_associado ?? ""}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{b.veiculos?.placa ?? "-"}</TableCell>
                      <TableCell className="text-xs">{dtBr(b.data_emissao)}</TableCell>
                      <TableCell className="text-xs">{dtBr(b.vencimento)}</TableCell>
                      <TableCell className="text-xs">{dtBr(b.data_pagamento)}</TableCell>
                      <TableCell className="text-xs font-medium">{brl(b.valor)}</TableCell>
                      <TableCell className="text-xs">{b.valor_pagamento ? brl(b.valor_pagamento) : "-"}</TableCell>
                      <TableCell><Badge variant="outline" className={`${style.cor} text-xs`}>{style.label}</Badge></TableCell>
                      <TableCell className="text-xs">{b.nome_banco ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {b.linha_digitavel && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Copiar linha digitável"
                              onClick={() => { navigator.clipboard.writeText(b.linha_digitavel); toast.success("Linha copiada"); }}>
                              <Receipt className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {b.pix_copia_cola && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Copiar Pix"
                              onClick={() => { navigator.clipboard.writeText(b.pix_copia_cola); toast.success("Pix copiado"); }}>
                              <DollarSign className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Abrir PDF"
                            disabled={!b.pdf_storage_path && !b.link_boleto}
                            onClick={() => abrirPdf(b)}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent></Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isFetching ? "Atualizando..." : `Mostrando ${(boletos.length ? (page-1)*PAGE_SIZE+1 : 0).toLocaleString("pt-BR")}–${((page-1)*PAGE_SIZE+boletos.length).toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")}`}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs">Página {page} de {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
