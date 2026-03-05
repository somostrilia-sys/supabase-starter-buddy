import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, ChevronRight, Upload, User, Phone, MapPin, Shield } from "lucide-react";

const steps = [
  { label: "Dados Pessoais", icon: User },
  { label: "Contato", icon: Phone },
  { label: "Endereço", icon: MapPin },
  { label: "Plano", icon: Shield },
];

const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export default function CadastrarAssociado() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    nome: "", cpf: "", rg: "", dataNascimento: "", sexo: "", estadoCivil: "", cnh: "",
    telefone: "", email: "", telComercial: "",
    cep: "", endereco: "", bairro: "", cidade: "", estado: "",
    cooperativa: "", regional: "", plano: "", diaVencimento: "",
  });

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const maskCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  };

  const maskTel = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };

  const canNext = () => {
    if (step === 0) return form.nome && form.cpf.replace(/\D/g, "").length === 11;
    if (step === 1) return form.telefone.replace(/\D/g, "").length >= 10;
    if (step === 2) return form.cidade && form.estado;
    if (step === 3) return form.plano && form.diaVencimento;
    return false;
  };

  const handleSubmit = () => {
    toast.success("Associado cadastrado com sucesso!", { description: `${form.nome} - ${form.cpf}` });
    setStep(0);
    setForm({ nome: "", cpf: "", rg: "", dataNascimento: "", sexo: "", estadoCivil: "", cnh: "", telefone: "", email: "", telComercial: "", cep: "", endereco: "", bairro: "", cidade: "", estado: "", cooperativa: "", regional: "", plano: "", diaVencimento: "" });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Cadastrar Novo Associado</h2>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                i === step ? "bg-primary text-primary-foreground font-semibold" :
                i < step ? "bg-primary/10 text-primary cursor-pointer" :
                "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{steps[step].label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Nome Completo *</Label>
                  <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo do associado" />
                </div>
                <div>
                  <Label>CPF *</Label>
                  <Input value={form.cpf} onChange={e => set("cpf", maskCpf(e.target.value))} placeholder="000.000.000-00" />
                </div>
                <div>
                  <Label>RG</Label>
                  <Input value={form.rg} onChange={e => set("rg", e.target.value)} placeholder="00.000.000-0" />
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.dataNascimento} onChange={e => set("dataNascimento", e.target.value)} />
                </div>
                <div>
                  <Label>Sexo</Label>
                  <Select value={form.sexo} onValueChange={v => set("sexo", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado Civil</Label>
                  <Select value={form.estadoCivil} onValueChange={v => set("estadoCivil", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)"].map(ec => (
                        <SelectItem key={ec} value={ec}>{ec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CNH</Label>
                  <Input value={form.cnh} onChange={e => set("cnh", e.target.value)} placeholder="Número da CNH" />
                </div>
              </div>
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground mb-2 block">Documentos (opcional)</Label>
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-3.5 w-3.5" /> Comprovante de Endereço
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="h-3.5 w-3.5" /> Documento do Veículo
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Celular / WhatsApp *</Label>
                <Input value={form.telefone} onChange={e => set("telefone", maskTel(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>Telefone Comercial</Label>
                <Input value={form.telComercial} onChange={e => set("telComercial", maskTel(e.target.value))} placeholder="(11) 3333-3333" />
              </div>
              {form.telefone && (
                <div className="flex items-end">
                  <Button variant="outline" size="sm" className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50" asChild>
                    <a href={`https://wa.me/55${form.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>CEP</Label>
                <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Rua, número, complemento" />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" />
              </div>
              <div>
                <Label>Cidade *</Label>
                <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
              </div>
              <div>
                <Label>Estado *</Label>
                <Select value={form.estado} onValueChange={v => set("estado", v)}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cooperativa</Label>
                <Select value={form.cooperativa} onValueChange={v => set("cooperativa", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul", "Cooperativa Centro-Oeste"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Regional</Label>
                <Select value={form.regional} onValueChange={v => set("regional", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Regional Capital", "Regional Interior", "Regional Litoral", "Regional Metropolitana"].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plano *</Label>
                <Select value={form.plano} onValueChange={v => set("plano", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Básico">Básico - R$ 89,90</SelectItem>
                    <SelectItem value="Intermediário">Intermediário - R$ 139,90</SelectItem>
                    <SelectItem value="Completo">Completo - R$ 189,90</SelectItem>
                    <SelectItem value="Premium">Premium - R$ 249,90</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dia do Vencimento *</Label>
                <Select value={form.diaVencimento} onValueChange={v => set("diaVencimento", v)}>
                  <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 25].map(d => (
                      <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              Voltar
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Próximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canNext()} className="bg-emerald-600 hover:bg-emerald-700">
                Cadastrar Associado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
