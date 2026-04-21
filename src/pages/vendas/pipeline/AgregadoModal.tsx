import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export interface AgregadoData {
  id?: string;
  nome: string;
  placa: string;
  chassi: string;
  renavam: string;
  valor_protegido: number;
  tabela_precos_id?: string;
  plano?: string;
  cota?: number;
  cota_pct?: number;
  mensalidade?: number;
  adesao?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  negociacaoId: string;
  existing?: AgregadoData | null;
  onSaved: (agregado: AgregadoData) => void;
}

export default function AgregadoModal({ open, onClose, negociacaoId, existing, onSaved }: Props) {
  const [nome, setNome] = useState("");
  const [placa, setPlaca] = useState("");
  const [chassi, setChassi] = useState("");
  const [renavam, setRenavam] = useState("");
  const [valorProtegido, setValorProtegido] = useState("");
  const [tabelaPrecosId, setTabelaPrecosId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setNome(existing.nome || "");
      setPlaca(existing.placa || "");
      setChassi(existing.chassi || "");
      setRenavam(existing.renavam || "");
      setValorProtegido(String(existing.valor_protegido || ""));
      setTabelaPrecosId(existing.tabela_precos_id || "");
    } else {
      setNome(""); setPlaca(""); setChassi(""); setRenavam("");
      setValorProtegido(""); setTabelaPrecosId("");
    }
  }, [existing, open]);

  const valorNum = Number(valorProtegido) || 0;
  const valorValido = valorNum > 0;

  // Buscar tabelas de preço compatíveis (só planos "agregado") com o valor protegido
  const [tabelasDisponiveis, setTabelasDisponiveis] = useState<any[]>([]);
  const [loadingTabelas, setLoadingTabelas] = useState(false);

  useEffect(() => {
    if (!valorValido) { setTabelasDisponiveis([]); setTabelaPrecosId(""); return; }
    setLoadingTabelas(true);
    supabase.from("tabela_precos" as any)
      .select("id, plano, plano_normalizado, cota, valor_menor, valor_maior, tipo_franquia, valor_franquia, adesao, regional")
      .ilike("plano_normalizado", "%agregado%")
      .lte("valor_menor", valorNum)
      .gte("valor_maior", valorNum)
      .order("cota")
      .then(({ data }: any) => {
        setTabelasDisponiveis(data || []);
        setLoadingTabelas(false);
      });
  }, [valorNum, valorValido]);

  const tabelaSelecionada = useMemo(
    () => tabelasDisponiveis.find((t: any) => t.id === tabelaPrecosId),
    [tabelasDisponiveis, tabelaPrecosId]
  );

  const precoCalculado = useMemo(() => {
    if (!tabelaSelecionada) return null;
    return {
      cota: Number(tabelaSelecionada.cota) || 0,
      adesao: Number(tabelaSelecionada.adesao) || 0,
      plano: tabelaSelecionada.plano_normalizado || tabelaSelecionada.plano,
      participacao: tabelaSelecionada.tipo_franquia === "%"
        ? `${tabelaSelecionada.valor_franquia}% FIPE (R$ ${(valorNum * Number(tabelaSelecionada.valor_franquia) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`
        : `R$ ${Number(tabelaSelecionada.valor_franquia || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    };
  }, [tabelaSelecionada, valorNum]);

  async function salvar() {
    if (!nome.trim()) { toast.error("Informe o nome do agregado"); return; }
    if (!valorValido) { toast.error("Informe o valor protegido"); return; }
    if (!tabelaPrecosId) { toast.error("Selecione a tabela de preços"); return; }

    setSaving(true);
    const data = {
      negociacao_id: negociacaoId,
      nome: nome.trim(),
      placa: placa.toUpperCase().trim() || null,
      chassi: chassi.trim() || null,
      renavam: renavam.trim() || null,
      valor_protegido: valorNum,
      tabela_precos_id: tabelaPrecosId,
      plano: precoCalculado?.plano || null,
      cota: precoCalculado?.cota || null,
      mensalidade: precoCalculado?.cota || null,
      adesao: precoCalculado?.adesao || 0,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing?.id) {
      result = await supabase.from("negociacao_agregados" as any).update(data).eq("id", existing.id).select().single();
    } else {
      result = await supabase.from("negociacao_agregados" as any).insert(data).select().single();
    }
    setSaving(false);

    if (result.error) {
      toast.error(`Erro ao salvar: ${result.error.message}`);
      return;
    }

    toast.success(existing ? "Agregado atualizado" : "Agregado cadastrado");
    onSaved(result.data as AgregadoData);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregado</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">Nome do agregado <span className="text-destructive">*</span></Label>
            <Input className="rounded-none" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Carreta Sider 3 Eixos" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Placa</Label>
              <Input className="rounded-none" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="ABC1D23" maxLength={8} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Renavam</Label>
              <Input className="rounded-none" value={renavam} onChange={e => setRenavam(e.target.value.replace(/\D/g, ""))} placeholder="00000000000" maxLength={11} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Chassi</Label>
            <Input className="rounded-none" value={chassi} onChange={e => setChassi(e.target.value.toUpperCase())} placeholder="9ADG1243BCM340073" maxLength={17} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Valor Protegido <span className="text-destructive">*</span></Label>
            <Input
              className="rounded-none"
              type="number"
              value={valorProtegido}
              onChange={e => { setValorProtegido(e.target.value); setTabelaPrecosId(""); }}
              placeholder="Ex: 65000"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tabela de preços <span className="text-destructive">*</span></Label>
            <Select
              value={tabelaPrecosId}
              onValueChange={setTabelaPrecosId}
              disabled={!valorValido || loadingTabelas}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder={
                  !valorValido ? "Insira antes o valor protegido" :
                  loadingTabelas ? "Buscando tabelas..." :
                  tabelasDisponiveis.length === 0 ? "Nenhuma tabela compatível" :
                  "Selecione a tabela"
                } />
              </SelectTrigger>
              <SelectContent>
                {tabelasDisponiveis.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.plano_normalizado || t.plano} — R$ {Number(t.cota).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                    {t.regional && <span className="text-muted-foreground text-[10px]"> ({t.regional})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {precoCalculado && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Plano:</span><strong>{precoCalculado.plano}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mensalidade:</span><strong className="text-[#1A3A5C]">R$ {precoCalculado.cota.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Adesão:</span><strong>R$ {precoCalculado.adesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Participação:</span><span>{precoCalculado.participacao}</span></div>
            </div>
          )}

          <Button
            className="w-full rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white"
            onClick={salvar}
            disabled={saving || !nome.trim() || !valorValido || !tabelaPrecosId}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
