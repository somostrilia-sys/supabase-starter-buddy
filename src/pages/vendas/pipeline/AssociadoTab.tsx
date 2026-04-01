import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PipelineDeal } from "./mockData";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const cidadesPorUF: Record<string, string[]> = {
  SP: ["São Paulo", "Campinas", "Ribeirão Preto", "Santos", "Sorocaba", "São José dos Campos"],
  RJ: ["Rio de Janeiro", "Niterói", "Petrópolis", "Volta Redonda", "Campos dos Goytacazes"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim"],
  PR: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel"],
  RS: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria"],
  SC: ["Florianópolis", "Joinville", "Blumenau", "Chapecó", "Itajaí"],
  GO: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde"],
  BA: ["Salvador", "Feira de Santana", "Vitória da Conquista"],
  DF: ["Brasília"],
};

const CATEGORIAS_CNH = ["A", "B", "AB", "C", "D", "E"];

// Converte datas OCR (DD/MM/YYYY ou DD-MM-YYYY) para YYYY-MM-DD (input date)
function formatDateOcr(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  // Já está no formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // DD/MM/YYYY ou DD-MM-YYYY
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3 && parts[0].length <= 2) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return dateStr;
}

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

interface Props {
  deal: PipelineDeal;
  dadosCnh?: Record<string, any> | null;
}

export default function AssociadoTab({ deal, dadosCnh }: Props) {
  const [form, setForm] = useState({
    nome: deal.lead_nome || "",
    cpf: deal.cpf_cnpj || "",
    rg: "",
    orgaoExpedidor: "",
    dataExpedicao: "",
    cnh: "",
    categoriaCNH: "",
    dataPrimeiraHab: "",
    validadeHab: "",
    dataNascimento: "",
    sexo: "",
    telefone: deal.telefone || "",
    telefone2: "",
    email: deal.email || "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    estado: "",
    cidade: "",
  });

  // Carregar dados reais da negociação (incluindo OCR)
  useEffect(() => {
    if (!deal.id || deal.id.startsWith("p")) return;
    supabase.from("negociacoes" as any).select("*").eq("id", deal.id).single()
      .then(({ data }) => {
        if (!data) return;
        const n = data as any;
        setForm(prev => ({
          ...prev,
          nome: n.lead_nome || prev.nome,
          cpf: n.cpf_cnpj || prev.cpf,
          rg: n.rg || prev.rg,
          cnh: n.cnh || prev.cnh,
          categoriaCNH: n.cnh_categoria || prev.categoriaCNH,
          validadeHab: n.cnh_validade || prev.validadeHab,
          dataNascimento: n.data_nascimento || prev.dataNascimento,
          telefone: n.telefone || prev.telefone,
          email: n.email || prev.email,
          estado: n.estado_circulacao || prev.estado,
          cidade: n.cidade_circulacao || prev.cidade,
        }));
      });
  }, [deal.id]);

  // Auto-fill quando dados da CNH chegam via OCR
  useEffect(() => {
    if (!dadosCnh) return;
    setForm(prev => ({
      ...prev,
      nome: dadosCnh.nome || prev.nome,
      cpf: dadosCnh.cpf ? maskCPF(dadosCnh.cpf.replace(/\D/g, "")) : prev.cpf,
      rg: dadosCnh.rg || prev.rg,
      orgaoExpedidor: dadosCnh.orgao_emissor || prev.orgaoExpedidor,
      cnh: dadosCnh.numero_registro || prev.cnh,
      categoriaCNH: dadosCnh.categoria || prev.categoriaCNH,
      dataPrimeiraHab: formatDateOcr(dadosCnh.primeira_habilitacao) || prev.dataPrimeiraHab,
      validadeHab: formatDateOcr(dadosCnh.validade) || prev.validadeHab,
      dataNascimento: formatDateOcr(dadosCnh.data_nascimento) || prev.dataNascimento,
      estado: dadosCnh.uf || prev.estado,
    }));
    toast.success("Dados do associado preenchidos automaticamente");
  }, [dadosCnh]);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const cidades = cidadesPorUF[form.estado] || [];

  const handleCEPBlur = () => {
    // Auto-fill CEP via ViaCEP
    const cepClean = form.cep.replace(/\D/g, "");
    if (cepClean.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepClean}/json/`)
        .then(r => r.json())
        .then(data => {
          if (!data.erro) {
            setForm(prev => ({
              ...prev,
              rua: data.logradouro || prev.rua,
              bairro: data.bairro || prev.bairro,
              estado: data.uf || prev.estado,
              cidade: data.localidade || prev.cidade,
            }));
          }
        })
        .catch(() => {});
    }
  };

  const handleSalvar = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      toast.error("Nome e Telefone são obrigatórios.");
      return;
    }
    const { error } = await supabase.from("negociacoes").update({
      lead_nome: form.nome,
      cpf_cnpj: form.cpf,
      telefone: form.telefone,
      email: form.email,
      rg: form.rg,
      cnh: form.cnh,
      cnh_categoria: form.categoriaCNH,
      cnh_validade: form.validadeHab,
      data_nascimento: form.dataNascimento,
      cidade_circulacao: form.cidade,
      estado_circulacao: form.estado,
    } as any).eq("id", deal.id);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Dados do associado salvos!");
    }
  };

  const lbl = "text-sm font-semibold";
  const reqMark = <span className="text-destructive ml-0.5">*</span>;

  return (
    <div className="space-y-6">
      {/* DADOS PESSOAIS */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">DADOS PESSOAIS</legend>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <div className="col-span-2 space-y-1">
            <Label className={lbl}>Nome{reqMark}</Label>
            <Input className="rounded-none border border-gray-300" value={form.nome} onChange={e => set("nome", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>CPF</Label>
            <Input className="rounded-none border border-gray-300" value={form.cpf} onChange={e => set("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>RG</Label>
            <Input className="rounded-none border border-gray-300" value={form.rg} onChange={e => set("rg", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Órgão Expedidor</Label>
            <Input className="rounded-none border border-gray-300" value={form.orgaoExpedidor} onChange={e => set("orgaoExpedidor", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Data Expedição</Label>
            <Input className="rounded-none border border-gray-300" type="date" value={form.dataExpedicao} onChange={e => set("dataExpedicao", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>CNH</Label>
            <Input className="rounded-none border border-gray-300" value={form.cnh} onChange={e => set("cnh", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Categoria CNH</Label>
            <Select value={form.categoriaCNH} onValueChange={v => set("categoriaCNH", v)}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIAS_CNH.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Data 1ª Habilitação</Label>
            <Input className="rounded-none border border-gray-300" type="date" value={form.dataPrimeiraHab} onChange={e => set("dataPrimeiraHab", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Validade Habilitação</Label>
            <Input className="rounded-none border border-gray-300" type="date" value={form.validadeHab} onChange={e => set("validadeHab", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Data Nascimento</Label>
            <Input className="rounded-none border border-gray-300" type="date" value={form.dataNascimento} onChange={e => set("dataNascimento", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className={lbl}>Sexo</Label>
            <RadioGroup value={form.sexo} onValueChange={v => set("sexo", v)} className="flex gap-6 pt-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="M" id="sexo-m" />
                <Label htmlFor="sexo-m" className="font-normal cursor-pointer">Masculino</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="F" id="sexo-f" />
                <Label htmlFor="sexo-f" className="font-normal cursor-pointer">Feminino</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </fieldset>

      {/* DADOS DE CONTATO */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">DADOS DE CONTATO</legend>
        <div className="p-2.5 rounded bg-blue-50 border border-blue-200 mb-2">
          <p className="text-xs text-blue-700"><strong>Atenção:</strong> O WhatsApp principal será utilizado para envio de boletos, contratos e notificações.</p>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label className={lbl}>WhatsApp Principal{reqMark}</Label>
            <Input className="rounded-none border border-gray-300" value={form.telefone} onChange={e => set("telefone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Telefone 2</Label>
            <Input className="rounded-none border border-gray-300" value={form.telefone2} onChange={e => set("telefone2", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Email</Label>
            <Input className="rounded-none border border-gray-300" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* ENDEREÇO */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#1A3A5C] border-b-2 border-[#747474] pb-1 w-full">ENDEREÇO</legend>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          <div className="space-y-1">
            <Label className={lbl}>CEP</Label>
            <Input className="rounded-none border border-gray-300" value={form.cep} onChange={e => set("cep", maskCEP(e.target.value))} onBlur={handleCEPBlur} placeholder="00000-000" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className={lbl}>Rua</Label>
            <Input className="rounded-none border border-gray-300" value={form.rua} onChange={e => set("rua", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Número</Label>
            <Input className="rounded-none border border-gray-300" value={form.numero} onChange={e => set("numero", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Complemento</Label>
            <Input className="rounded-none border border-gray-300" value={form.complemento} onChange={e => set("complemento", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Bairro</Label>
            <Input className="rounded-none border border-gray-300" value={form.bairro} onChange={e => set("bairro", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Estado</Label>
            <Select value={form.estado} onValueChange={v => { set("estado", v); set("cidade", ""); }}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue /></SelectTrigger>
              <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className={lbl}>Cidade</Label>
            <Select value={form.cidade} onValueChange={v => set("cidade", v)}>
              <SelectTrigger className="rounded-none border border-gray-300"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end pt-2">
        <Button className="rounded-none bg-[#1A3A5C] hover:bg-[#15304D] text-white px-8" onClick={handleSalvar}>Salvar</Button>
      </div>
    </div>
  );
}
