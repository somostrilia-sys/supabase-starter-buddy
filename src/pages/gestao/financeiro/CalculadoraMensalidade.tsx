import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase, callEdge } from "@/integrations/supabase/client";

interface Props { onBack: () => void; }

function fmt(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function CalculadoraMensalidade({ onBack }: Props) {
  const [valorFipe, setValorFipe] = useState("");
  const [tipoVeiculo, setTipoVeiculo] = useState("");
  const [regionalId, setRegionalId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [cep, setCep] = useState("");
  const [cepResult, setCepResult] = useState<any>(null);

  // Buscar regionais reais
  const { data: regionais = [] } = useQuery({
    queryKey: ["regionais-calc"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("regionais").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  // Buscar grupos (planos)
  const { data: grupos = [] } = useQuery({
    queryKey: ["grupos-calc"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("grupos_produtos").select("id, nome").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  // Buscar produtos disponíveis (filtrados por regional se selecionada)
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos-calc", regionalId],
    queryFn: async () => {
      if (regionalId) {
        const { data: regras } = await (supabase as any).from("produto_regras").select("produto_id, produtos_gia(id, nome, valor, valor_base, tipo)").eq("regional_id", regionalId).eq("ativo", true);
        return (regras || []).map((r: any) => r.produtos_gia).filter(Boolean);
      }
      const { data } = await (supabase as any).from("produtos_gia").select("id, nome, valor, valor_base, tipo").eq("ativo", true).order("nome").limit(100);
      return data || [];
    },
  });

  // Lookup CEP
  async function buscarCep() {
    if (cep.replace(/\D/g, "").length !== 8) return;
    try {
      const res = await callEdge("gia-cep-regional", { cep });
      if (res.sucesso) {
        setCepResult(res);
        setRegionalId(res.regional_id || "");
      }
    } catch {}
  }

  // Calcular mensalidade dinâmica
  async function calcular() {
    setLoading(true);
    try {
      const res = await callEdge("gia-calculo-mensalidade", {
        grupo_id: grupoId || undefined,
        produtos_ids: produtosSelecionados.length > 0 ? produtosSelecionados : undefined,
        regional_id: regionalId || undefined,
        valor_fipe: Number(valorFipe) || 0,
        categoria: tipoVeiculo || "automovel",
      });
      if (res.sucesso) setResultado(res);
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  }

  function toggleProduto(id: string) {
    setProdutosSelecionados(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  return (
    <div className="p-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5"><ArrowLeft className="h-4 w-4" />Financeiro</Button>
        <span className="text-muted-foreground">/</span>
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Calculadora de Mensalidade Dinâmica</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Formulário */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados do Veículo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* CEP lookup */}
              <div className="space-y-1.5">
                <Label>CEP (identifica regional automaticamente)</Label>
                <div className="flex gap-2">
                  <Input placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={buscarCep}>Buscar</Button>
                </div>
                {cepResult && <p className="text-xs text-muted-foreground">{cepResult.cidade}/{cepResult.uf} → Regional: <strong>{cepResult.regional_nome}</strong></p>}
              </div>

              <div className="space-y-1.5">
                <Label>Valor FIPE</Label>
                <Input type="number" placeholder="Ex: 45000" value={valorFipe} onChange={e => setValorFipe(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de Veículo</Label>
                <Select value={tipoVeiculo} onValueChange={setTipoVeiculo}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automovel">Automóvel</SelectItem>
                    <SelectItem value="motocicleta">Motocicleta</SelectItem>
                    <SelectItem value="pesado">Pesados</SelectItem>
                    <SelectItem value="utilitarios">Utilitários</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Regional</Label>
                <Select value={regionalId} onValueChange={setRegionalId}>
                  <SelectTrigger><SelectValue placeholder="Selecione ou busque por CEP" /></SelectTrigger>
                  <SelectContent>
                    {regionais.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Grupo / Plano</Label>
                <Select value={grupoId} onValueChange={setGrupoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione (ou escolha produtos abaixo)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem grupo (produtos avulsos)</SelectItem>
                    {grupos.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card>
            <CardHeader><CardTitle className="text-base">Produtos Disponíveis ({produtos.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {produtos.map((p: any) => (
                  <label key={p.id} className="flex items-center justify-between py-1 px-2 hover:bg-muted/30 rounded cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={produtosSelecionados.includes(p.id)} onCheckedChange={() => toggleProduto(p.id)} />
                      <span className="text-xs">{p.nome}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{fmt(Number(p.valor || p.valor_base || 0))}</span>
                  </label>
                ))}
              </div>
              {produtosSelecionados.length > 0 && (
                <div className="mt-2 pt-2 border-t flex justify-between">
                  <span className="text-xs font-medium">{produtosSelecionados.length} selecionados</span>
                  <Button size="sm" variant="ghost" className="text-xs h-6" onClick={() => setProdutosSelecionados([])}>Limpar</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" onClick={calcular} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
            {loading ? "Calculando..." : "Calcular Mensalidade"}
          </Button>
        </div>

        {/* Resultado */}
        <div>
          {resultado ? (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Resultado
                  <Badge className="text-lg px-3 py-1">{fmt(resultado.total_mensalidade)}/mês</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Composição */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Composição ({resultado.qtd_produtos} produtos)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Produto</TableHead>
                        <TableHead className="text-xs text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.composicao?.map((p: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{p.nome}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmt(p.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totais */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal Produtos</span>
                    <span className="font-mono">{fmt(resultado.subtotal_produtos)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa Administrativa</span>
                    <span className="font-mono">{fmt(resultado.taxa_administrativa)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Rateio</span>
                    <span className="font-mono">{fmt(resultado.rateio)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t">
                    <span>TOTAL MENSALIDADE</span>
                    <span className="text-primary font-mono text-lg">{fmt(resultado.total_mensalidade)}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setResultado(null)}>Nova Simulação</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Preencha os dados e clique em calcular</p>
                <p className="text-xs mt-1">Mensalidade = Σ Produtos + Taxa Admin + Rateio</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
