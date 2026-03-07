import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PipelineDeal } from "./mockData";
import { MessageSquare, Mail, Link2, CreditCard, CheckCircle, Shield, ShieldCheck, ShieldPlus } from "lucide-react";

/* ─── FIPE mock data ─── */
const marcas = ["Chevrolet", "Hyundai", "Honda", "Toyota", "Volkswagen", "Fiat", "Jeep", "Nissan", "Renault", "Ford"];

const modelosPorMarca: Record<string, { modelo: string; codFipe: string; valorFipe: number }[]> = {
  Chevrolet: [
    { modelo: "Onix Plus 1.0 Turbo", codFipe: "015267-0", valorFipe: 95000 },
    { modelo: "Tracker Premier 1.2T", codFipe: "015312-9", valorFipe: 142000 },
    { modelo: "S10 High Country 2.8", codFipe: "015401-0", valorFipe: 265000 },
  ],
  Hyundai: [
    { modelo: "HB20 1.0 Comfort", codFipe: "037101-4", valorFipe: 82000 },
    { modelo: "Creta Ultimate 2.0", codFipe: "037205-3", valorFipe: 158000 },
  ],
  Honda: [
    { modelo: "Civic EXL 2.0", codFipe: "021176-0", valorFipe: 135000 },
    { modelo: "HR-V EXL", codFipe: "021190-6", valorFipe: 155000 },
  ],
  Toyota: [
    { modelo: "Corolla XEi 2.0", codFipe: "059210-1", valorFipe: 148000 },
    { modelo: "Corolla Cross XRE", codFipe: "059222-5", valorFipe: 170000 },
  ],
  Volkswagen: [
    { modelo: "Polo Highline 1.0 TSI", codFipe: "005580-2", valorFipe: 98000 },
    { modelo: "T-Cross Highline 1.4 TSI", codFipe: "005612-4", valorFipe: 145000 },
  ],
  Fiat: [
    { modelo: "Argo Drive 1.3", codFipe: "001423-8", valorFipe: 78000 },
    { modelo: "Pulse Impetus 1.0T", codFipe: "001440-8", valorFipe: 105000 },
  ],
  Jeep: [
    { modelo: "Compass Limited T270", codFipe: "064112-3", valorFipe: 185000 },
    { modelo: "Renegade Sport 1.3T", codFipe: "064095-0", valorFipe: 120000 },
  ],
  Nissan: [
    { modelo: "Kicks Advance", codFipe: "050030-2", valorFipe: 115000 },
  ],
  Renault: [
    { modelo: "Kwid Outsider 1.0", codFipe: "044015-9", valorFipe: 68000 },
  ],
  Ford: [
    { modelo: "Ranger Limited 3.0 V6", codFipe: "015780-0", valorFipe: 310000 },
  ],
};

const cores = ["Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Marrom"];
const cambios = ["Automático", "Manual", "CVT", "Automatizado"];
const combustiveis = ["Flex", "Gasolina", "Etanol", "Diesel", "Elétrico", "Híbrido"];
const tiposVeiculo = ["Automóvel", "Motocicleta", "Caminhão", "Van/Utilitário", "Ônibus"];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
const cidadesPorUF: Record<string, string[]> = {
  SP: ["São Paulo", "Campinas", "Ribeirão Preto", "Santos", "Sorocaba"],
  RJ: ["Rio de Janeiro", "Niterói", "Petrópolis"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem"],
  PR: ["Curitiba", "Londrina", "Maringá"],
  GO: ["Goiânia", "Anápolis"],
  DF: ["Brasília"],
};

function maskPlaca(v: string) {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)
    .replace(/^([A-Z]{3})(\d)/, "$1-$2");
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─── Planos com cálculo baseado no valor FIPE ─── */
interface PlanoConfig {
  nome: string;
  icon: React.ElementType;
  cor: string;
  percentual: number; // % do valor FIPE como mensalidade
  coberturas: string[];
}

const planosConfig: PlanoConfig[] = [
  {
    nome: "Básico", icon: Shield, cor: "border-blue-200 bg-blue-50",
    percentual: 0.028,
    coberturas: ["Roubo/Furto", "Perda Total", "Assistência 24h", "Carro Reserva 7 dias"],
  },
  {
    nome: "Completo", icon: ShieldCheck, cor: "border-emerald-200 bg-emerald-50",
    percentual: 0.038,
    coberturas: ["Roubo/Furto", "Perda Total", "Colisão", "Assistência 24h", "Carro Reserva 15 dias", "Vidros", "Terceiros R$50k"],
  },
  {
    nome: "Premium", icon: ShieldPlus, cor: "border-amber-200 bg-amber-50",
    percentual: 0.052,
    coberturas: ["Roubo/Furto", "Perda Total", "Colisão", "Assistência 24h", "Carro Reserva 30 dias", "Vidros", "Faróis", "Terceiros R$100k", "APP Passageiros", "Rastreador incluso"],
  },
];

interface Props { deal: PipelineDeal; }

export default function CotacaoTab({ deal }: Props) {
  // Infer initial marca/modelo from deal
  const inferredMarca = marcas.find(m => {
    const models = modelosPorMarca[m];
    return models?.some(mod => deal.veiculo_modelo?.includes(mod.modelo.split(" ")[0]));
  }) || "Honda";

  const [marca, setMarca] = useState(inferredMarca);
  const [modeloIdx, setModeloIdx] = useState(0);
  const [form, setForm] = useState({
    tipoVeiculo: "Automóvel",
    placa: deal.veiculo_placa || "ABC-1D23",
    chassi: "9BWZZZ377VT004251",
    renavam: "01234567890",
    anoFab: "2023",
    cor: "Prata",
    cambio: "Automático",
    combustivel: "Flex",
    quilometragem: "25000",
    numMotor: "HRV2024EXL001",
    estadoCirc: "SP",
    cidadeCirc: "São Paulo",
    diaVencimento: "10",
    veiculoTrabalho: false,
    taxi: false,
    chassiRemarcado: false,
    leilao: false,
    depreciacao: false,
    implemento: "",
    obsContrato: "",
    obsInterna: "",
  });
  const [planoSelecionado, setPlanoSelecionado] = useState("Completo");

  const modelos = modelosPorMarca[marca] || [];
  const modeloAtual = modelos[modeloIdx] || modelos[0];
  const valorFipe = modeloAtual?.valorFipe || 0;
  const codFipe = modeloAtual?.codFipe || "";

  const cidades = cidadesPorUF[form.estadoCirc] || [];

  const set = (field: string, value: string | boolean) => setForm(prev => ({ ...prev, [field]: value }));

  const handleEnviar = (tipo: string) => toast.success(`Cotação enviada via ${tipo}!`);

  const lbl = "text-sm font-semibold font-['Source_Serif_4']";

  const anosDisp = useMemo(() => {
    const cur = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => String(cur - i));
  }, []);

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1 - DADOS DO VEÍCULO */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold font-['Source_Serif_4'] text-[#1A3A5C] border-b pb-1 w-full">DADOS DO VEÍCULO</legend>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label className={lbl}>Tipo do Veículo</Label>
            <Select value={form.tipoVeiculo} onValueChange={v => set("tipoVeiculo", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{tiposVeiculo.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Placa</Label>
            <Input className="rounded-none font-mono" value={form.placa} onChange={e => set("placa", maskPlaca(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Chassi</Label>
            <Input className="rounded-none font-mono text-xs" value={form.chassi} onChange={e => set("chassi", e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Renavam</Label>
            <Input className="rounded-none" value={form.renavam} onChange={e => set("renavam", e.target.value.replace(/\D/g, "").slice(0, 11))} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Marca (FIPE)</Label>
            <Select value={marca} onValueChange={v => { setMarca(v); setModeloIdx(0); }}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{marcas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Modelo (FIPE)</Label>
            <Select value={String(modeloIdx)} onValueChange={v => setModeloIdx(Number(v))}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{modelos.map((m, i) => <SelectItem key={i} value={String(i)}>{m.modelo}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Ano Fabricação</Label>
            <Select value={form.anoFab} onValueChange={v => set("anoFab", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{anosDisp.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Código FIPE</Label>
            <Input className="rounded-none font-mono bg-muted" value={codFipe} readOnly />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Valor FIPE</Label>
            <Input className="rounded-none font-mono bg-muted" value={formatCurrency(valorFipe)} readOnly />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Cor</Label>
            <Select value={form.cor} onValueChange={v => set("cor", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{cores.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Câmbio</Label>
            <Select value={form.cambio} onValueChange={v => set("cambio", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{cambios.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Combustível</Label>
            <Select value={form.combustivel} onValueChange={v => set("combustivel", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{combustiveis.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Quilometragem</Label>
            <Input className="rounded-none" type="number" value={form.quilometragem} onChange={e => set("quilometragem", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Nº do Motor</Label>
            <Input className="rounded-none font-mono text-xs" value={form.numMotor} onChange={e => set("numMotor", e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Estado Circulação</Label>
            <Select value={form.estadoCirc} onValueChange={v => { set("estadoCirc", v); set("cidadeCirc", ""); }}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Cidade Circulação</Label>
            <Select value={form.cidadeCirc} onValueChange={v => set("cidadeCirc", v)}>
              <SelectTrigger className="rounded-none"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Dia Vencimento</Label>
            <Select value={form.diaVencimento} onValueChange={v => set("diaVencimento", v)}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 28 }, (_, i) => String(i + 1)).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Toggles e Checkboxes */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Switch checked={form.veiculoTrabalho} onCheckedChange={v => set("veiculoTrabalho", v)} />
            <span className="text-sm font-['Source_Serif_4']">Veículo de trabalho / Táxi / Uber</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.depreciacao} onCheckedChange={v => set("depreciacao", v)} />
            <span className="text-sm font-['Source_Serif_4']">Depreciação</span>
          </div>
        </div>
        <div className="flex gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm font-['Source_Serif_4'] cursor-pointer">
            <Checkbox checked={form.taxi} onCheckedChange={v => set("taxi", !!v)} />Táxi
          </label>
          <label className="flex items-center gap-2 text-sm font-['Source_Serif_4'] cursor-pointer">
            <Checkbox checked={form.chassiRemarcado} onCheckedChange={v => set("chassiRemarcado", !!v)} />Chassi remarcado
          </label>
          <label className="flex items-center gap-2 text-sm font-['Source_Serif_4'] cursor-pointer">
            <Checkbox checked={form.leilao} onCheckedChange={v => set("leilao", !!v)} />Leilão
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <Label className={lbl}>Implemento / Agregado (opcional)</Label>
            <Input className="rounded-none" value={form.implemento} onChange={e => set("implemento", e.target.value)} placeholder="Ex: Baú, Guincho..." />
          </div>
        </div>
        <div className="space-y-1 pt-1">
          <Label className={lbl}>Observações no Termo (cliente vê)</Label>
          <Textarea className="rounded-none" rows={2} value={form.obsContrato} onChange={e => set("obsContrato", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className={lbl}>Observações Internas (somente equipe)</Label>
          <Textarea className="rounded-none" rows={2} value={form.obsInterna} onChange={e => set("obsInterna", e.target.value)} />
        </div>
      </fieldset>

      {/* SEÇÃO 2 - PLANOS E ENVIO */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-bold font-['Source_Serif_4'] text-[#1A3A5C] border-b pb-1 w-full">PLANOS E ENVIO</legend>

        <div className="grid grid-cols-3 gap-3">
          {planosConfig.map(p => {
            const mensal = Math.round(valorFipe * p.percentual);
            const selected = planoSelecionado === p.nome;
            return (
              <Card
                key={p.nome}
                onClick={() => setPlanoSelecionado(p.nome)}
                className={`rounded-none cursor-pointer transition-all border-2 ${selected ? "border-[#1A3A5C] ring-2 ring-[#1A3A5C]/20" : p.cor} hover:shadow-md`}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-2">
                    <p.icon className={`h-5 w-5 ${selected ? "text-[#1A3A5C]" : "text-muted-foreground"}`} />
                    <CardTitle className="text-sm font-['Source_Serif_4']">{p.nome}</CardTitle>
                    {selected && <CheckCircle className="h-4 w-4 text-[#1A3A5C] ml-auto" />}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="text-2xl font-bold font-['Source_Serif_4'] text-[#1A3A5C]">{formatCurrency(mensal)}<span className="text-xs font-normal text-muted-foreground">/mês</span></div>
                  <ul className="space-y-1">
                    {p.coberturas.map(c => (
                      <li key={c} className="text-[11px] text-muted-foreground flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />{c}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-sm text-muted-foreground font-['Source_Serif_4']">Plano selecionado:</span>
          <Badge className="rounded-none bg-[#1A3A5C] text-white">{planoSelecionado}</Badge>
          <span className="text-sm font-semibold font-['Source_Serif_4']">
            {formatCurrency(Math.round(valorFipe * (planosConfig.find(p => p.nome === planoSelecionado)?.percentual || 0)))}/mês
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => handleEnviar("PDF")}>
            <Mail className="h-3.5 w-3.5 mr-1" />Enviar PDF
          </Button>
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => handleEnviar("Link")}>
            <Link2 className="h-3.5 w-3.5 mr-1" />Enviar Link
          </Button>
          <Button size="sm" className="rounded-none bg-green-600 hover:bg-green-700 text-white" onClick={() => handleEnviar("WhatsApp")}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" />Enviar WhatsApp
          </Button>
          <Button size="sm" className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white" onClick={() => toast.success("Link de pagamento gerado!")}>
            <CreditCard className="h-3.5 w-3.5 mr-1" />Enviar Link de Pagamento
          </Button>
        </div>
      </fieldset>
    </div>
  );
}
