import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  ClipboardCheck, Search, Plus, X, Eraser, Save, Upload, Car, FileText, Trash2, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SelectWithAdd = ({ label, value, onValueChange, options, placeholder }: {
  label: string; value: string; onValueChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) => {
  const [items, setItems] = useState(options);
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="flex-1"><SelectValue placeholder={placeholder || "Selecione"} /></SelectTrigger>
          <SelectContent>{items.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      {adding && (
        <div className="flex gap-1 mt-1">
          <Input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Novo valor" className="h-8 text-xs" />
          <Button size="sm" className="h-8 text-xs" onClick={() => { if (newVal.trim()) { setItems(p => [...p, newVal.trim()]); onValueChange(newVal.trim()); } setAdding(false); setNewVal(""); }}>OK</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setAdding(false); setNewVal(""); }}><X className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );
};

const avariasItems = [
  "Para-choque dianteiro", "Para-choque traseiro", "Capô", "Porta-malas",
  "Porta dianteira esquerda", "Porta dianteira direita", "Porta traseira esquerda", "Porta traseira direita",
  "Para-lama dianteiro esquerdo", "Para-lama dianteiro direito", "Para-lama traseiro esquerdo", "Para-lama traseiro direito",
  "Teto", "Retrovisor esquerdo", "Retrovisor direito", "Para-brisa", "Vidro traseiro",
];

const acessoriosItems = [
  "Ar condicionado", "Vidro elétrico", "Trava elétrica", "Alarme", "Som/Multimídia",
  "Câmera de ré", "Sensor de estacionamento", "Airbag", "ABS", "Direção hidráulica",
  "Direção elétrica", "Piloto automático", "Banco de couro", "Rodas de liga leve",
  "Farol de milha", "Teto solar", "GPS integrado",
];

interface VeiculoDB {
  id: string;
  placa: string;
  chassi: string | null;
  marca: string;
  modelo: string;
  associado_id: string | null;
  associados: { nome: string } | null;
}

export default function CadastrarVistoria() {
  const [searchPlaca, setSearchPlaca] = useState("");
  const [searchChassi, setSearchChassi] = useState("");
  const [zeroKm, setZeroKm] = useState(false);
  const [selectedVeic, setSelectedVeic] = useState<VeiculoDB | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingVeic, setSearchingVeic] = useState(false);

  const [form, setForm] = useState({
    tipo: "", data: new Date().toISOString().split("T")[0], vistoriador: "",
    situacao: "Pendente", dataRecebimento: new Date().toISOString().split("T")[0], observacoes: "",
    tipoLocal: "",
    marcaPneu: "", codMarca: "", medidaPneu: "", estadoPneu: "",
    tipoDocumento: "",
  });

  const [avarias, setAvarias] = useState<string[]>([]);
  const [acessorios, setAcessorios] = useState<string[]>([]);
  const [showAvarias, setShowAvarias] = useState(false);
  const [showAcessorios, setShowAcessorios] = useState(false);
  const [fotos, setFotos] = useState<{ nome: string; tipo: string; data: string; file?: File; preview?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!form.tipoDocumento) {
      toast.error("Selecione o tipo de documento antes de adicionar arquivos.");
      return;
    }
    const newFotos = Array.from(files).map((file) => ({
      nome: file.name,
      tipo: form.tipoDocumento,
      data: new Date().toLocaleDateString("pt-BR"),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setFotos(f => [...f, ...newFotos]);
    toast.success(`${files.length} arquivo(s) adicionado(s)!`);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const buscarVeiculo = async () => {
    if (!searchPlaca && !searchChassi) return toast.error("Informe placa ou chassi");
    setSearchingVeic(true);
    try {
      let q = supabase
        .from("veiculos")
        .select("id, placa, chassi, marca, modelo, associado_id, associados(nome)")
        .limit(1);
      if (searchPlaca) q = q.ilike("placa", `%${searchPlaca.replace("-", "")}%`);
      else q = q.ilike("chassi", `%${searchChassi}%`);
      const { data, error } = await q;
      if (error) throw error;
      if (!data || data.length === 0) { toast.error("Veículo não encontrado."); return; }
      setSelectedVeic(data[0] as unknown as VeiculoDB);
      toast.success("Veículo encontrado!");
    } catch (e: any) {
      toast.error(e.message || "Veículo não encontrado.");
    } finally {
      setSearchingVeic(false);
    }
  };

  const salvar = async () => {
    if (!selectedVeic) { toast.error("Selecione um veículo."); return; }
    if (!form.tipo) { toast.error("Selecione o tipo de vistoria."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("vistorias").insert({
        veiculo_id: selectedVeic.id,
        associado_id: selectedVeic.associado_id,
        tipo: form.tipo,
        status: "pendente",
        data_vistoria: form.data || null,
        vistoriador: form.vistoriador || null,
        observacoes: form.observacoes || null,
      } as any);
      if (error) throw error;
      toast.success("Vistoria salva com sucesso!", { description: `${form.tipo} - ${selectedVeic.placa}` });
      limpar();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const limpar = () => {
    setSelectedVeic(null); setSearchPlaca(""); setSearchChassi(""); setZeroKm(false);
    setForm({ tipo: "", data: new Date().toISOString().split("T")[0], vistoriador: "", situacao: "Pendente", dataRecebimento: new Date().toISOString().split("T")[0], observacoes: "", tipoLocal: "", marcaPneu: "", codMarca: "", medidaPneu: "", estadoPneu: "", tipoDocumento: "" });
    setAvarias([]); setAcessorios([]); setFotos([]);
  };

  const situacaoColor = (s: string) => {
    switch (s) {
      case "Pendente": return "bg-warning/10 text-warning";
      case "Aprovada": return "bg-success/10 text-success";
      case "Reprovada": return "bg-destructive/8 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Cadastrar Vistoria</h2>

      <Accordion type="multiple" defaultValue={["s1", "s2"]} className="space-y-2">
        {/* Seção 1: Selecionar Veículo */}
        <AccordionItem value="s1" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Car className="h-4 w-4 text-primary" /> 1. Selecionar Veículo</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <Label className="text-xs">Placa</Label>
                <Input value={searchPlaca} onChange={e => setSearchPlaca(e.target.value.toUpperCase())} placeholder="PLACA" />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox checked={zeroKm} onCheckedChange={v => setZeroKm(!!v)} id="zeroKmVist" />
                <Label htmlFor="zeroKmVist" className="text-xs">Veículo 0 KM</Label>
              </div>
              <div>
                <Label className="text-xs">Chassi</Label>
                <Input value={searchChassi} onChange={e => setSearchChassi(e.target.value.toUpperCase())} placeholder="Chassi" />
              </div>
              <Button onClick={buscarVeiculo} disabled={searchingVeic} className="gap-1"><Search className="h-4 w-4" /> {searchingVeic ? "Buscando..." : "Buscar"}</Button>
            </div>
            {selectedVeic && (
              <Card className="border-primary">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Cód. Veículo</span><p className="font-medium">{selectedVeic.id}</p></div>
                    <div><span className="text-muted-foreground text-xs">Placa</span><p className="font-medium font-mono">{selectedVeic.placa}</p></div>
                    <div><span className="text-muted-foreground text-xs">Modelo</span><p className="font-medium">{selectedVeic.marca} {selectedVeic.modelo}</p></div>
                    <div><span className="text-muted-foreground text-xs">Associado</span><p className="font-medium">{selectedVeic.associados?.nome ?? "—"}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Seção 2: Dados da Vistoria */}
        <AccordionItem value="s2" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> 2. Dados da Vistoria</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tipo de Vistoria *</Label>
                <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adesão">Adesão</SelectItem>
                    <SelectItem value="Revistoria">Revistoria</SelectItem>
                    <SelectItem value="Sinistro">Sinistro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Data da Vistoria</Label><Input type="date" value={form.data} onChange={e => set("data", e.target.value)} /></div>
              <SelectWithAdd label="Vistoriador" value={form.vistoriador} onValueChange={v => set("vistoriador", v)} options={["João Ferreira", "André Costa", "Luciana Almeida", "Roberto Dias"]} />
              <div>
                <Label className="text-xs">Situação Vistoria</Label>
                <Select value={form.situacao} onValueChange={v => set("situacao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Aprovada">Aprovada</SelectItem>
                    <SelectItem value="Reprovada">Reprovada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Data Recebimento</Label><Input type="date" value={form.dataRecebimento} onChange={e => set("dataRecebimento", e.target.value)} /></div>
              <div className="flex items-center pt-5">
                <Badge className={situacaoColor(form.situacao)}>{form.situacao}</Badge>
              </div>
            </div>
            <div className="mt-3"><Label className="text-xs">Observações</Label><Textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Observações da vistoria..." rows={3} /></div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 3: Local */}
        <AccordionItem value="s3" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> 3. Local Vistoria</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <SelectWithAdd label="Tipo Local Vistoria" value={form.tipoLocal} onValueChange={v => set("tipoLocal", v)} options={["Sede", "Domicílio", "Oficina Parceira", "Ponto de Atendimento"]} />
          </AccordionContent>
        </AccordionItem>

        {/* Seção 4: Acessórios / Avarias */}
        <AccordionItem value="s4" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 4. Acessórios / Avarias</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            <div>
              <Label className="text-xs">Imagem Vistoria</Label>
              <Select>
                <SelectTrigger className="w-64"><SelectValue placeholder="Tipo de imagem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="frente">Frente</SelectItem>
                  <SelectItem value="traseira">Traseira</SelectItem>
                  <SelectItem value="lateral-e">Lateral Esquerda</SelectItem>
                  <SelectItem value="lateral-d">Lateral Direita</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button variant="outline" size="sm" onClick={() => setShowAvarias(!showAvarias)} className="gap-1 mb-2">
                <Plus className="h-3.5 w-3.5" /> Avarias {avarias.length > 0 && `(${avarias.length})`}
              </Button>
              {showAvarias && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                  {avariasItems.map(a => (
                    <div key={a} className="flex items-center gap-2">
                      <Checkbox checked={avarias.includes(a)} onCheckedChange={c => setAvarias(p => c ? [...p, a] : p.filter(x => x !== a))} />
                      <Label className="text-xs">{a}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Button variant="outline" size="sm" onClick={() => setShowAcessorios(!showAcessorios)} className="gap-1 mb-2">
                <Plus className="h-3.5 w-3.5" /> Acessórios {acessorios.length > 0 && `(${acessorios.length})`}
              </Button>
              {showAcessorios && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                  {acessoriosItems.map(a => (
                    <div key={a} className="flex items-center gap-2">
                      <Checkbox checked={acessorios.includes(a)} onCheckedChange={c => setAcessorios(p => c ? [...p, a] : p.filter(x => x !== a))} />
                      <Label className="text-xs">{a}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 5: Pneus */}
        <AccordionItem value="s5" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> 5. Pneus</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex gap-1 items-end">
                <div className="flex-1"><Label className="text-xs">Marca Pneu</Label><Input value={form.marcaPneu} onChange={e => set("marcaPneu", e.target.value)} placeholder="Pirelli, Goodyear..." /></div>
                <Button variant="outline" size="icon" className="h-10 w-10"><Plus className="h-3.5 w-3.5" /></Button>
              </div>
              <div><Label className="text-xs">Código Marca</Label><Input value={form.codMarca} onChange={e => set("codMarca", e.target.value)} /></div>
              <SelectWithAdd label="Medida Pneu" value={form.medidaPneu} onValueChange={v => set("medidaPneu", v)} options={["185/65 R15", "195/55 R16", "205/55 R16", "225/45 R17", "235/60 R18"]} />
              <div>
                <Label className="text-xs">Estado Pneu</Label>
                <Select value={form.estadoPneu} onValueChange={v => set("estadoPneu", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Meia-vida">Meia-vida</SelectItem>
                    <SelectItem value="Careca">Careca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 6: Fotos/Documentos */}
        <AccordionItem value="s6" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
            <span className="flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> 6. Fotos / Documentos Veículo</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs">Tipo Documento</Label>
                <Select value={form.tipoDocumento} onValueChange={v => set("tipoDocumento", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Foto Frente">Foto Frente</SelectItem>
                    <SelectItem value="Foto Traseira">Foto Traseira</SelectItem>
                    <SelectItem value="Foto Lateral">Foto Lateral</SelectItem>
                    <SelectItem value="Foto Motor">Foto Motor</SelectItem>
                    <SelectItem value="Foto Interior">Foto Interior</SelectItem>
                    <SelectItem value="CRLV">CRLV</SelectItem>
                    <SelectItem value="Laudo">Laudo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleFileSelect}
              />
              <Button className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                if (!form.tipoDocumento) {
                  toast.error("Selecione o tipo de documento primeiro.");
                  return;
                }
                fileInputRef.current?.click();
              }}>
                <Plus className="h-4 w-4" /> Adicionar imagens/documentos...
              </Button>
            </div>

            {fotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fotos.map((f, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      {f.preview ? (
                        <img src={f.preview} alt={f.nome} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{f.nome}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{f.tipo}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFotos(fs => fs.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background border-t-2 border-[#747474] py-3 flex justify-end gap-3 -mx-6 px-6">
        <Button variant="outline" className="gap-1"><X className="h-4 w-4" /> Voltar</Button>
        <Button variant="outline" onClick={limpar} className="gap-1"><Eraser className="h-4 w-4" /> Limpar</Button>
        <Button onClick={salvar} disabled={loading} className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"><Save className="h-4 w-4" /> {loading ? "Salvando..." : "Salvar Vistoria"}</Button>
      </div>
    </div>
  );
}

function Settings(props: any) {
  return <ClipboardCheck {...props} />;
}
