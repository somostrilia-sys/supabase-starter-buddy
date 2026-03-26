import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, ChevronRight, User, Car, FileText, ClipboardCheck } from "lucide-react";

const assocSchema = z.object({
  cpf: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  nome: z.string().min(3, "Nome obrigatório"),
  data_nascimento: z.string().optional(),
  telefone: z.string().min(10, "Telefone obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

const veicSchema = z.object({
  placa: z.string().min(7, "Placa inválida").max(8, "Placa inválida"),
  chassi: z.string().optional(),
  marca: z.string().min(1, "Marca obrigatória"),
  modelo: z.string().min(1, "Modelo obrigatório"),
  ano: z.string().optional(),
  valor_fipe: z.string().optional(),
  categoria_uso: z.string().min(1, "Categoria de uso obrigatória"),
  classificacao_uso: z.string().min(1, "Classificação obrigatória"),
});

const contratoSchema = z.object({
  plano_id: z.string().min(1, "Selecione um plano"),
  valor_mensal: z.string().min(1, "Valor obrigatório"),
});

type AssocForm = z.infer<typeof assocSchema>;
type VeicForm = z.infer<typeof veicSchema>;
type ContratoForm = z.infer<typeof contratoSchema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadNome?: string;
  leadTelefone?: string;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, label: "Associado", icon: User },
  { id: 2, label: "Veículo", icon: Car },
  { id: 3, label: "Contrato", icon: FileText },
  { id: 4, label: "Confirmar", icon: ClipboardCheck },
];

const CATEGORIAS_USO = ["Passeio", "Trabalho", "Aluguel", "Frota", "Uso do Associado"];
const CLASSIFICACOES_USO = ["Rastreador Sim", "Rastreador Não"];

export default function ConcretizarVendaModal({ open, onOpenChange, leadNome = "", leadTelefone = "", onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [successContrato, setSuccessContrato] = useState<string | null>(null);

  const assocForm = useForm<AssocForm>({
    resolver: zodResolver(assocSchema),
    defaultValues: { cpf: "", nome: leadNome, telefone: leadTelefone, email: "", endereco: "", cidade: "", estado: "", cep: "" },
  });

  const veicForm = useForm<VeicForm>({
    resolver: zodResolver(veicSchema),
    defaultValues: { placa: "", chassi: "", marca: "", modelo: "", ano: "", valor_fipe: "", categoria_uso: "", classificacao_uso: "" },
  });

  const contratoForm = useForm<ContratoForm>({
    resolver: zodResolver(contratoSchema),
    defaultValues: { plano_id: "", valor_mensal: "" },
  });

  const { data: planos } = useQuery({
    queryKey: ["planos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("planos").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  async function handleNextStep1() {
    const ok = await assocForm.trigger();
    if (ok) setStep(2);
  }

  async function handleNextStep2() {
    const ok = await veicForm.trigger();
    if (ok) setStep(3);
  }

  async function handleNextStep3() {
    const ok = await contratoForm.trigger();
    if (ok) setStep(4);
  }

  async function handleConfirm() {
    setSaving(true);
    const assocData = assocForm.getValues();
    const veicData = veicForm.getValues();
    const contratoData = contratoForm.getValues();

    try {
      // 1. Insert associado
      const { data: assoc, error: e1 } = await supabase
        .from("associados")
        .insert({
          cpf: assocData.cpf.replace(/\D/g, ""),
          nome: assocData.nome,
          data_nascimento: assocData.data_nascimento || null,
          telefone: assocData.telefone,
          email: assocData.email || null,
          endereco: assocData.endereco || null,
          cidade: assocData.cidade || null,
          estado: assocData.estado || null,
          cep: assocData.cep || null,
          status: "ativo",
        })
        .select()
        .single();

      if (e1) throw new Error(`Erro ao cadastrar associado: ${e1.message}`);

      // 2. Insert veiculo
      const { data: veic, error: e2 } = await supabase
        .from("veiculos")
        .insert({
          associado_id: assoc.id,
          placa: veicData.placa.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          chassi: veicData.chassi || null,
          marca: veicData.marca,
          modelo: veicData.modelo,
          ano: veicData.ano ? parseInt(veicData.ano) : null,
          valor_fipe: veicData.valor_fipe ? parseFloat(veicData.valor_fipe.replace(/[^0-9.,]/g, "").replace(",", ".")) : null,
          categoria_uso: veicData.categoria_uso,
          classificacao_uso: veicData.classificacao_uso,
        } as any)
        .select()
        .single();

      if (e2) {
        await supabase.from("associados").delete().eq("id", assoc.id);
        throw new Error(`Erro ao cadastrar veículo: ${e2.message}`);
      }

      // 3. Generate contract number
      const { count } = await supabase.from("contratos").select("*", { count: "exact", head: true });
      const numero = `CONT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(5, "0")}`;

      // 4. Insert contrato
      const { data: contrato, error: e3 } = await supabase
        .from("contratos")
        .insert({
          numero,
          associado_id: assoc.id,
          veiculo_id: veic.id,
          plano_id: contratoData.plano_id || null,
          valor_mensal: parseFloat(contratoData.valor_mensal.replace(/[^0-9.,]/g, "").replace(",", ".")),
          status: "ativo",
          data_inicio: new Date().toISOString().split("T")[0],
        } as any)
        .select()
        .single();

      if (e3) {
        await supabase.from("veiculos").delete().eq("id", veic.id);
        await supabase.from("associados").delete().eq("id", assoc.id);
        throw new Error(`Erro ao criar contrato: ${e3.message}`);
      }

      // 5. Generate first proportional mensalidade
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - today.getDate() + 1;
      const valorMensal = parseFloat(contratoData.valor_mensal.replace(/[^0-9.,]/g, "").replace(",", "."));
      const valorProporcional = parseFloat(((valorMensal / 30) * daysRemaining).toFixed(2));

      const vencimento = new Date(today.getFullYear(), today.getMonth() + 1, 10);

      await supabase.from("mensalidades").insert({
        associado_id: assoc.id,
        valor: valorProporcional,
        data_vencimento: vencimento.toISOString().split("T")[0],
        status: "pendente",
        referencia: `${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()} (proporcional)`,
        observacoes: `Proporcional: ${daysRemaining} dias de ${daysInMonth}`,
      });

      // 6. Create vistoria
      await supabase.from("vistorias").insert({
        associado_id: assoc.id,
        veiculo_id: veic.id,
        contrato_id: contrato.id,
        status: "pendente",
        observacoes: "Vistoria criada automaticamente na concretização da venda",
      } as any);

      // 7. Audit log
      await supabase.from("audit_log").insert({
        acao: "concretizar_venda",
        tabela: "contratos",
        registro_id: contrato.id,
        dados_novos: { associado_id: assoc.id, veiculo_id: veic.id, numero },
      } as any);

      await queryClient.invalidateQueries({ queryKey: ["associados"] });
      await queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      await queryClient.invalidateQueries({ queryKey: ["contratos"] });
      await queryClient.invalidateQueries({ queryKey: ["mensalidades"] });

      setSuccessContrato(numero);
      onSuccess?.();
      toast.success(`Venda concretizada! Contrato ${numero} criado.`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao concretizar venda");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) {
      setStep(1);
      setSuccessContrato(null);
      assocForm.reset({ cpf: "", nome: leadNome, telefone: leadTelefone, email: "" });
      veicForm.reset();
      contratoForm.reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Concretizar Venda</DialogTitle>
        </DialogHeader>

        {successContrato ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <h3 className="text-xl font-bold text-green-700">Venda Concretizada!</h3>
              <p className="text-muted-foreground mt-1">Contrato <strong>{successContrato}</strong> criado com sucesso.</p>
              <p className="text-sm text-muted-foreground mt-1">Associado, veículo, mensalidade proporcional e vistoria criados.</p>
            </div>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center gap-1 mb-6">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    step === s.id ? "bg-primary text-primary-foreground" :
                    step > s.id ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s.id ? <CheckCircle2 className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
              ))}
            </div>

            {/* Step 1: Associado */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Dados do Associado</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>CPF *</Label>
                    <Input {...assocForm.register("cpf")} placeholder="000.000.000-00" />
                    {assocForm.formState.errors.cpf && <p className="text-xs text-destructive">{assocForm.formState.errors.cpf.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Nome Completo *</Label>
                    <Input {...assocForm.register("nome")} placeholder="Nome completo" />
                    {assocForm.formState.errors.nome && <p className="text-xs text-destructive">{assocForm.formState.errors.nome.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" {...assocForm.register("data_nascimento")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone *</Label>
                    <Input {...assocForm.register("telefone")} placeholder="(00) 00000-0000" />
                    {assocForm.formState.errors.telefone && <p className="text-xs text-destructive">{assocForm.formState.errors.telefone.message}</p>}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Email</Label>
                    <Input {...assocForm.register("email")} type="email" placeholder="email@exemplo.com" />
                    {assocForm.formState.errors.email && <p className="text-xs text-destructive">{assocForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Endereço</Label>
                    <Input {...assocForm.register("endereco")} placeholder="Rua, número, complemento" />
                  </div>
                  <div className="space-y-1">
                    <Label>Cidade</Label>
                    <Input {...assocForm.register("cidade")} />
                  </div>
                  <div className="space-y-1">
                    <Label>Estado</Label>
                    <Input {...assocForm.register("estado")} placeholder="SP" maxLength={2} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNextStep1}>Próximo <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </div>
            )}

            {/* Step 2: Veículo */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Dados do Veículo</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Placa *</Label>
                    <Input {...veicForm.register("placa")} placeholder="ABC1D23" className="uppercase" />
                    {veicForm.formState.errors.placa && <p className="text-xs text-destructive">{veicForm.formState.errors.placa.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Chassi</Label>
                    <Input {...veicForm.register("chassi")} placeholder="9BWZZZ377VT004251" />
                  </div>
                  <div className="space-y-1">
                    <Label>Marca *</Label>
                    <Input {...veicForm.register("marca")} placeholder="Ex: Volkswagen" />
                    {veicForm.formState.errors.marca && <p className="text-xs text-destructive">{veicForm.formState.errors.marca.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Modelo *</Label>
                    <Input {...veicForm.register("modelo")} placeholder="Ex: Gol 1.0" />
                    {veicForm.formState.errors.modelo && <p className="text-xs text-destructive">{veicForm.formState.errors.modelo.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Ano</Label>
                    <Input {...veicForm.register("ano")} placeholder="2024" type="number" min="1990" max="2030" />
                  </div>
                  <div className="space-y-1">
                    <Label>Valor FIPE</Label>
                    <Input {...veicForm.register("valor_fipe")} placeholder="R$ 0,00" />
                  </div>
                  <div className="space-y-1">
                    <Label>Categoria de Uso *</Label>
                    <Select onValueChange={v => veicForm.setValue("categoria_uso", v, { shouldValidate: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_USO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {veicForm.formState.errors.categoria_uso && <p className="text-xs text-destructive">{veicForm.formState.errors.categoria_uso.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Classificação de Uso *</Label>
                    <Select onValueChange={v => veicForm.setValue("classificacao_uso", v, { shouldValidate: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSIFICACOES_USO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {veicForm.formState.errors.classificacao_uso && <p className="text-xs text-destructive">{veicForm.formState.errors.classificacao_uso.message}</p>}
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                  <Button onClick={handleNextStep2}>Próximo <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </div>
            )}

            {/* Step 3: Contrato */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Dados do Contrato</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label>Plano *</Label>
                    <Select onValueChange={v => {
                      contratoForm.setValue("plano_id", v, { shouldValidate: true });
                      const plano = planos?.find(p => p.id === v);
                      if (plano) contratoForm.setValue("valor_mensal", String(plano.valor_mensal));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {planos?.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} — R$ {p.valor_mensal.toFixed(2).replace(".", ",")}
                          </SelectItem>
                        ))}
                        {(!planos || planos.length === 0) && (
                          <SelectItem value="no-plans" disabled>Nenhum plano cadastrado</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {contratoForm.formState.errors.plano_id && <p className="text-xs text-destructive">{contratoForm.formState.errors.plano_id.message}</p>}
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Valor Mensal *</Label>
                    <Input {...contratoForm.register("valor_mensal")} placeholder="R$ 0,00" />
                    {contratoForm.formState.errors.valor_mensal && <p className="text-xs text-destructive">{contratoForm.formState.errors.valor_mensal.message}</p>}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
                  <strong>Cálculo proporcional:</strong> O primeiro boleto será calculado proporcionalmente aos dias restantes do mês atual.
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Voltar</Button>
                  <Button onClick={handleNextStep3}>Próximo <ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmar */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Confirmar e Concretizar</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-1 text-sm">
                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Associado</p>
                    <p><strong>{assocForm.getValues("nome")}</strong> — CPF: {assocForm.getValues("cpf")}</p>
                    <p>{assocForm.getValues("telefone")} {assocForm.getValues("email") && `| ${assocForm.getValues("email")}`}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-1 text-sm">
                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Veículo</p>
                    <p><strong>{veicForm.getValues("marca")} {veicForm.getValues("modelo")}</strong> — Placa: {veicForm.getValues("placa")}</p>
                    <p>{veicForm.getValues("categoria_uso")} | {veicForm.getValues("classificacao_uso")}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-1 text-sm">
                    <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Contrato</p>
                    <p>Valor mensal: <strong>R$ {contratoForm.getValues("valor_mensal")}</strong></p>
                    <p className="text-xs text-muted-foreground">Número gerado automaticamente | Vistoria: Pendente</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)} disabled={saving}>Voltar</Button>
                  <Button onClick={handleConfirm} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {saving ? "Concretizando..." : "Concretizar Venda"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
