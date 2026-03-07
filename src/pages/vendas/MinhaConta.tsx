import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Landmark, Save, Info, CheckCircle, Clock, User, KeyRound,
} from "lucide-react";

const bancos = [
  "001 - Banco do Brasil",
  "033 - Santander",
  "104 - Caixa Econômica Federal",
  "237 - Bradesco",
  "341 - Itaú Unibanco",
  "260 - Nubank",
  "077 - Inter",
  "336 - C6 Bank",
  "756 - Sicoob",
  "748 - Sicredi",
  "212 - Original",
  "422 - Safra",
  "070 - BRB",
  "246 - ABC Brasil",
  "745 - Citibank",
  "399 - HSBC",
  "041 - Banrisul",
  "085 - Ailos",
  "403 - Cora",
  "290 - PagSeguro",
  "380 - PicPay",
  "323 - Mercado Pago",
];

const tiposConta = [
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Conta Poupança" },
  { value: "pj", label: "Pessoa Jurídica" },
];

function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskAgencia(value: string): string {
  return value.replace(/\D/g, "").slice(0, 6);
}

function maskConta(value: string): string {
  return value.replace(/\D/g, "").slice(0, 12);
}

function maskDigito(value: string): string {
  return value.replace(/\D/g, "").slice(0, 2);
}

export default function MinhaConta() {
  const [tipoConta, setTipoConta] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [digito, setDigito] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [titular, setTitular] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [saved, setSaved] = useState(false);
  const [verificado, setVerificado] = useState(false);

  function handleSave() {
    if (!tipoConta || !banco || !agencia || !conta || !digito || !cpfCnpj || !titular) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const cpfCnpjDigits = cpfCnpj.replace(/\D/g, "");
    if (cpfCnpjDigits.length !== 11 && cpfCnpjDigits.length !== 14) {
      toast({ title: "CPF ou CNPJ inválido", variant: "destructive" });
      return;
    }
    setSaved(true);
    setVerificado(false);
    toast({ title: "Dados bancários salvos com sucesso!", description: "Pendente de verificação pela equipe financeira." });
    // Simulate verification after 3s
    setTimeout(() => setVerificado(true), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais e dados bancários</p>
      </div>

      {/* Conta Bancária */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              Dados Bancários
            </CardTitle>
            {saved && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  verificado
                    ? "bg-green-500/15 text-green-700 border-green-300"
                    : "bg-amber-500/15 text-amber-700 border-amber-300"
                )}
              >
                {verificado ? (
                  <><CheckCircle className="h-3 w-3 mr-1" />Conta verificada</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" />Pendente de verificação</>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
              Seus dados bancários serão utilizados para recebimento de comissões. Certifique-se de que as informações estão corretas.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Conta */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de Conta <span className="text-destructive">*</span></Label>
              <Select value={tipoConta} onValueChange={setTipoConta}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {tiposConta.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Banco */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Banco <span className="text-destructive">*</span></Label>
              <Select value={banco} onValueChange={setBanco}>
                <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                <SelectContent>
                  {bancos.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agência */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Agência <span className="text-destructive">*</span></Label>
              <Input
                placeholder="0001"
                value={agencia}
                onChange={e => setAgencia(maskAgencia(e.target.value))}
                maxLength={6}
              />
            </div>

            {/* Conta + Dígito */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Número da Conta <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  placeholder="12345678"
                  value={conta}
                  onChange={e => setConta(maskConta(e.target.value))}
                  className="flex-1"
                  maxLength={12}
                />
                <span className="flex items-center text-muted-foreground font-bold">-</span>
                <Input
                  placeholder="0"
                  value={digito}
                  onChange={e => setDigito(maskDigito(e.target.value))}
                  className="w-16 text-center"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPF/CNPJ do Titular */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <User className="h-3 w-3" />CPF/CNPJ do Titular <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="000.000.000-00"
                value={cpfCnpj}
                onChange={e => setCpfCnpj(maskCpfCnpj(e.target.value))}
                maxLength={18}
              />
            </div>

            {/* Nome do Titular */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome do Titular <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Nome completo do titular"
                value={titular}
                onChange={e => setTitular(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chave PIX */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1">
                <KeyRound className="h-3 w-3" />Chave Pix <span className="text-muted-foreground text-[10px]">(opcional)</span>
              </Label>
              <Input
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                value={chavePix}
                onChange={e => setChavePix(e.target.value)}
                maxLength={100}
              />
              <p className="text-[10px] text-muted-foreground">Pode ser CPF/CNPJ, e-mail, telefone ou chave aleatória</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} className="min-w-[200px]">
              <Save className="h-4 w-4 mr-2" />Salvar Dados Bancários
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
