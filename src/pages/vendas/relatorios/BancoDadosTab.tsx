import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLeadScope } from "@/hooks/usePermission";
import { toast } from "sonner";

const campos = [
  { key: "lead_nome", label: "Nome" },
  { key: "cpf_cnpj", label: "CPF/CNPJ" },
  { key: "email", label: "Email" },
  { key: "telefone", label: "Telefone" },
  { key: "veiculo_placa", label: "Placa" },
  { key: "veiculo_modelo", label: "Modelo" },
  { key: "plano", label: "Plano" },
  { key: "valor_plano", label: "Valor" },
  { key: "stage", label: "Etapa" },
  { key: "consultor", label: "Consultor" },
  { key: "cooperativa", label: "Cooperativa" },
  { key: "origem", label: "Origem" },
  { key: "created_at", label: "Data Criacao" },
];

export default function BancoDadosTab() {
  const scope = useLeadScope();
  const [selected, setSelected] = useState<string[]>(["lead_nome", "telefone", "email", "stage", "consultor"]);

  const { data: preview = [], isLoading } = useQuery({
    queryKey: ["banco-dados-preview", scope?.consultor, scope?.cooperativas?.join(",")],
    queryFn: async () => {
      let q = (supabase as any).from("negociacoes")
        .select(campos.map(c => c.key).join(","))
        .order("created_at", { ascending: false }).limit(10);
      if (scope?.consultor) q = q.eq("consultor", scope.consultor);
      if (scope?.cooperativas && scope.cooperativas.length > 0) q = q.in("cooperativa", scope.cooperativas);
      const { data } = await q;
      return data || [];
    },
  });

  function toggle(key: string) {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function exportCSV() {
    if (selected.length === 0) { toast.error("Selecione pelo menos 1 campo"); return; }
    toast.info("Exportando...");
    let q = (supabase as any).from("negociacoes")
      .select(selected.join(",")).order("created_at", { ascending: false });
    if (scope?.consultor) q = q.eq("consultor", scope.consultor);
    if (scope?.cooperativas && scope.cooperativas.length > 0) q = q.in("cooperativa", scope.cooperativas);
    const { data } = await q;
    if (!data || data.length === 0) { toast.error("Nenhum dado"); return; }
    const headers = selected.map(k => campos.find(c => c.key === k)?.label || k);
    const rows = data.map((r: any) => selected.map(k => String(r[k] ?? "").replace(/[,\n]/g, " ")));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `gia_export_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${data.length} registros exportados`);
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Database className="h-5 w-5" /><span className="font-semibold">Exportar Dados</span></div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelected(campos.map(c => c.key))}>Todos</Button>
          <Button size="sm" variant="outline" onClick={() => setSelected([])}>Limpar</Button>
          <Button size="sm" onClick={exportCSV} disabled={selected.length === 0}><Download className="h-4 w-4 mr-1" />Exportar CSV</Button>
        </div>
      </div>
      <Card><CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {campos.map(c => (
            <label key={c.key} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/30">
              <Checkbox checked={selected.includes(c.key)} onCheckedChange={() => toggle(c.key)} />
              <span className="text-xs">{c.label}</span>
            </label>
          ))}
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-0 overflow-x-auto">
        <p className="text-xs text-muted-foreground p-3">Preview (10 registros)</p>
        {isLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : (
          <Table>
            <TableHeader><TableRow className="bg-muted/60">
              {selected.map(k => <TableHead key={k} className="text-[10px] uppercase">{campos.find(c => c.key === k)?.label}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {preview.slice(0, 10).map((r: any, i: number) => (
                <TableRow key={i}>{selected.map(k => <TableCell key={k} className="text-xs">{String(r[k] ?? "—").slice(0, 30)}</TableCell>)}</TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
