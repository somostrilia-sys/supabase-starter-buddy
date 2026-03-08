import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Package, DollarSign, Car, AlertTriangle, Building2, ClipboardCheck,
  Plus, Edit, Trash2, Search, Download, Save, Loader2, ChevronRight,
  Eye, ArrowRightLeft, FileText,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──
type Group = "produtos" | "financeiros" | "veiculo" | "evento" | "cooperativa" | "vistoria";

const groups = [
  { id: "produtos" as Group, label: "Grupo de Produtos", icon: Package },
  { id: "financeiros" as Group, label: "Opcionais Financeiros", icon: DollarSign },
  { id: "veiculo" as Group, label: "Opcionais de Veículo", icon: Car },
  { id: "evento" as Group, label: "Opcionais de Evento", icon: AlertTriangle },
  { id: "cooperativa" as Group, label: "Cooperativa", icon: Building2 },
  { id: "vistoria" as Group, label: "Vistoria", icon: ClipboardCheck },
];

// ── Generic CRUD Table Component ──
function CrudTable({ title, columns, data, onAdd }: { title: string; columns: string[]; data: string[][]; onAdd?: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[hsl(212_35%_18%)]">{title}</h4>
        <Button size="sm" className="h-7 text-xs gap-1 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={onAdd || (() => toast.success("Registro adicionado"))}>
          <Plus className="h-3 w-3" />Adicionar
        </Button>
      </div>
      <div className="border rounded-lg border-border overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow className="bg-[hsl(210_40%_96%)]">
              {columns.map(c => <TableHead key={c} className="text-xs">{c}</TableHead>)}
              <TableHead className="text-xs w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => <TableCell key={j} className="text-sm">{cell}</TableCell>)}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Trash2 className="h-3 w-3 text-red-500" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function CadastroTab() {
  const [activeGroup, setActiveGroup] = useState<Group>("produtos");
  const [subView, setSubView] = useState(0);

  return (
    <div className="p-6 space-y-0">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[hsl(212_35%_18%)]">Cadastro</h2>
        <p className="text-sm text-muted-foreground">Configurações e cadastros operacionais do sistema</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[400px] md:min-h-[600px]">
        {/* Sidebar - horizontal scroll on mobile, vertical on desktop */}
        <div className="md:w-56 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveGroup(g.id); setSubView(0); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors text-left whitespace-nowrap ${
                  activeGroup === g.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <g.icon className="h-4 w-4 shrink-0" />
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {activeGroup === "produtos" && <GrupoProdutos subView={subView} setSubView={setSubView} />}
          {activeGroup === "financeiros" && <OpcionaisFinanceiros subView={subView} setSubView={setSubView} />}
          {activeGroup === "veiculo" && <OpcionaisVeiculo subView={subView} setSubView={setSubView} />}
          {activeGroup === "evento" && <OpcionaisEvento subView={subView} setSubView={setSubView} />}
          {activeGroup === "cooperativa" && <Cooperativa subView={subView} setSubView={setSubView} />}
          {activeGroup === "vistoria" && <VistoriaConfig subView={subView} setSubView={setSubView} />}
        </div>
      </div>
    </div>
  );
}

// ── SubNav component ──
function SubNav({ items, active, onChange }: { items: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex gap-1 border-b border-[hsl(210_30%_88%)] mb-5 overflow-x-auto">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
            i === active ? "border-[hsl(212_55%_40%)] text-[hsl(212_35%_18%)]" : "border-transparent text-muted-foreground hover:text-[hsl(212_35%_30%)]"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 1) GRUPO DE PRODUTOS
// ═══════════════════════════════════════════════════════════

function GrupoProdutos({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Grupo de Cadastros", "Classificação", "Substituição Fornecedor", "Relatórios"];
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[hsl(212_35%_18%)]">Grupos de Produtos</h4>
            <Button size="sm" className="h-7 text-xs gap-1 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => setShowModal(true)}><Plus className="h-3 w-3" />Novo Grupo</Button>
          </div>
          <div className="border rounded-lg border-border overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader><TableRow className="bg-[hsl(210_40%_96%)]"><TableHead className="text-xs">Grupo</TableHead><TableHead className="text-xs">Produtos</TableHead><TableHead className="text-xs text-right">Valor Mensal</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-[80px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {[
                  ["Plano Básico", "Rateio + Assistência 24h", "R$ 129,90", "Ativo"],
                  ["Plano Completo", "Rateio + Assistência + Rastreador + Carro Reserva", "R$ 219,90", "Ativo"],
                  ["Plano Premium", "Rateio + Assistência + Rastreador + Carro Reserva + Vidros", "R$ 289,90", "Ativo"],
                  ["Plano Moto", "Rateio + Assistência 24h Moto", "R$ 89,90", "Ativo"],
                  ["Plano Pesados", "Rateio + Assistência Pesados + Rastreador", "R$ 399,90", "Inativo"],
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{row[0]}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row[1]}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{row[2]}</TableCell>
                    <TableCell><Badge className={row[3] === "Ativo" ? "bg-green-100 text-green-800 text-xs" : "bg-gray-100 text-gray-800 text-xs"}>{row[3]}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit className="h-3 w-3" /></Button><Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Trash2 className="h-3 w-3 text-red-500" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
              <DialogHeader><DialogTitle className="text-[hsl(212_35%_18%)]">Novo Grupo de Produtos</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Nome do Grupo</Label><Input placeholder="Ex: Plano Especial" /></div>
                <div><Label className="text-xs">Produtos Inclusos</Label><Textarea placeholder="Descreva os produtos do grupo..." /></div>
                <div><Label className="text-xs">Valor Mensal (R$)</Label><Input placeholder="0,00" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowModal(false)} className="border-[hsl(210_30%_85%)]">Cancelar</Button>
                <Button className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => { toast.success("Grupo criado"); setShowModal(false); }}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {subView === 1 && (
        <CrudTable
          title="Classificação de Produtos"
          columns={["Classificação", "Descrição", "Status"]}
          data={[
            ["Rastreamento", "Equipamentos de rastreamento veicular", "Ativo"],
            ["Assistência 24h", "Serviço de assistência em emergências", "Ativo"],
            ["Carro Reserva", "Veículo substituto durante reparo", "Ativo"],
            ["Produto Adicional", "Coberturas extras opcionais", "Ativo"],
          ]}
        />
      )}

      {subView === 2 && (
        <Card className="border-[hsl(210_30%_88%)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[hsl(212_35%_18%)]">Substituição de Fornecedor</CardTitle>
            <CardDescription>Migrar todos os produtos de um fornecedor para outro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Fornecedor Atual</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
                  <SelectItem value="tracker-pro">Tracker Pro Rastreadores</SelectItem>
                  <SelectItem value="assist-brasil">Assist Brasil 24h</SelectItem>
                  <SelectItem value="car-reserve">CarReserve Locações</SelectItem>
                </SelectContent></Select>
              </div>
              <div>
                <Label className="text-xs">Novo Fornecedor</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
                  <SelectItem value="sat-track">SatTrack Rastreamento</SelectItem>
                  <SelectItem value="road-assist">Road Assist Nacional</SelectItem>
                  <SelectItem value="localiza">Localiza Frotas</SelectItem>
                </SelectContent></Select>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ Esta ação migrará todos os produtos e contratos vinculados ao fornecedor selecionado. A operação não pode ser desfeita.
            </div>
            <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => toast.success("Fornecedor migrado com sucesso")}>
              <ArrowRightLeft className="h-4 w-4" />Migrar Fornecedor
            </Button>
          </CardContent>
        </Card>
      )}

      {subView === 3 && <RelatoriosProdutos />}
    </>
  );
}

function RelatoriosProdutos() {
  const [relTab, setRelTab] = useState(0);
  const rels = ["Produtos por Fornecedor", "Utilização por Cooperativa", "Alterações de Produto"];
  return (
    <>
      <SubNav items={rels} active={relTab} onChange={setRelTab} />
      {relTab === 0 && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="outline" size="sm" className="gap-1 text-xs border-[hsl(210_30%_85%)]" onClick={() => toast.success("Exportado")}><Download className="h-3 w-3" />Exportar</Button></div>
          <CrudTable title="" columns={["Fornecedor", "Produto", "Qtde Contratos", "Valor Mensal"]} data={[
            ["Tracker Pro", "Rastreador Veicular", "342", "R$ 39,90"],
            ["Assist Brasil", "Assistência 24h", "847", "R$ 29,90"],
            ["CarReserve", "Carro Reserva", "215", "R$ 49,90"],
          ]} />
        </div>
      )}
      {relTab === 1 && (
        <CrudTable title="" columns={["Cooperativa", "Produto", "Qtde Utiliz.", "% do Total"]} data={[
          ["Central SP", "Assistência 24h", "425", "50.2%"],
          ["Campinas", "Rastreador", "180", "21.2%"],
          ["Litoral SP", "Carro Reserva", "98", "11.6%"],
        ]} />
      )}
      {relTab === 2 && (
        <CrudTable title="" columns={["Data", "Produto", "Alteração", "Usuário"]} data={[
          ["10/07/2025", "Plano Completo", "Valor atualizado R$ 199 → R$ 219", "Admin"],
          ["05/07/2025", "Rastreador", "Fornecedor alterado", "Gerente"],
          ["01/07/2025", "Plano Moto", "Status: Ativo → Inativo", "Admin"],
        ]} />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 2) OPCIONAIS FINANCEIROS
// ═══════════════════════════════════════════════════════════

function OpcionaisFinanceiros({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Conta Bancária", "Vencimento Boleto", "Tipo Boleto", "Situação Boleto", "Aprov. Mensagens", "Motivo Boleto", "Cartão de Crédito"];

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && (
        <CrudTable title="Contas Bancárias" columns={["Banco", "Agência", "Conta", "Tipo", "Status"]} data={[
          ["Banco do Brasil", "1234-5", "56789-0", "Corrente", "Ativa"],
          ["Itaú", "0987", "12345-6", "Corrente", "Ativa"],
          ["Bradesco", "4567", "98765-4", "Poupança", "Inativa"],
        ]} />
      )}

      {subView === 1 && (
        <CrudTable title="Datas de Vencimento" columns={["Dia", "Descrição", "Status"]} data={[
          ["05", "Vencimento dia 5", "Ativo"],
          ["10", "Vencimento dia 10", "Ativo"],
          ["15", "Vencimento dia 15", "Ativo"],
          ["20", "Vencimento dia 20", "Ativo"],
          ["25", "Vencimento dia 25", "Inativo"],
        ]} />
      )}

      {subView === 2 && (
        <CrudTable title="Tipos de Boleto" columns={["Tipo", "Descrição"]} data={[
          ["Mensalidade", "Cobrança mensal do associado"],
          ["Adesão", "Taxa de adesão inicial"],
          ["Avulso", "Cobrança avulsa"],
          ["Rateio", "Cobrança de rateio de evento"],
        ]} />
      )}

      {subView === 3 && (
        <CrudTable title="Situações de Boleto" columns={["Código", "Situação", "Cor"]} data={[
          ["01", "Pendente", "🟡 Amarelo"],
          ["02", "Pago", "🟢 Verde"],
          ["03", "Cancelado", "🔴 Vermelho"],
          ["04", "Pendente de vistoria", "🟠 Laranja"],
        ]} />
      )}

      {subView === 4 && (
        <Card className="border-[hsl(210_30%_88%)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[hsl(212_35%_18%)]">Mensagens Personalizadas para Boletos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs">Mensagem de Lembrete (Antes do Vencimento)</Label><Textarea defaultValue="Prezado(a) associado(a), sua mensalidade vence no dia {DATA_VENCIMENTO}. Valor: {VALOR}. Evite atrasos!" className="min-h-[80px]" /></div>
            <div><Label className="text-xs">Mensagem de Atraso</Label><Textarea defaultValue="Prezado(a), identificamos que a mensalidade ref. {REFERENCIA} encontra-se em atraso. Regularize sua situação." className="min-h-[80px]" /></div>
            <div><Label className="text-xs">Mensagem de Confirmação de Pagamento</Label><Textarea defaultValue="Pagamento confirmado! Mensalidade ref. {REFERENCIA} no valor de {VALOR} foi registrada com sucesso." className="min-h-[80px]" /></div>
            <Button className="gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => toast.success("Mensagens salvas")}><Save className="h-4 w-4" />Salvar Mensagens</Button>
          </CardContent>
        </Card>
      )}

      {subView === 5 && (
        <CrudTable title="Motivos de Boleto" columns={["Código", "Descrição", "Situação"]} data={[
          ["M01", "Mensalidade regular", "Ativo"],
          ["M02", "Adesão nova", "Ativo"],
          ["M03", "Cobrança de rateio", "Ativo"],
          ["M04", "Taxa administrativa", "Ativo"],
          ["M05", "Reembolso parcial", "Inativo"],
        ]} />
      )}

      {subView === 6 && <CartaoCreditoSub />}
    </>
  );
}

function CartaoCreditoSub() {
  const [ccTab, setCcTab] = useState(0);
  const tabs = ["Lista Ativos", "Lista Inativos", "Débito Automático", "Relatório"];
  return (
    <>
      <SubNav items={tabs} active={ccTab} onChange={setCcTab} />
      {ccTab === 0 && (
        <CrudTable title="Cartões Ativos" columns={["Associado", "Bandeira", "Final", "Validade", "Status"]} data={[
          ["Carlos E. Silva", "Visa", "4532", "12/2027", "Ativo"],
          ["Maria F. Oliveira", "Mastercard", "8891", "03/2026", "Ativo"],
          ["João P. Santos", "Elo", "2210", "08/2027", "Ativo"],
        ]} />
      )}
      {ccTab === 1 && (
        <CrudTable title="Cartões Inativos" columns={["Associado", "Bandeira", "Final", "Motivo"]} data={[
          ["Roberto Almeida", "Visa", "1123", "Expirado"],
          ["Ana Carolina F.", "Mastercard", "5567", "Cancelado pelo associado"],
        ]} />
      )}
      {ccTab === 2 && (
        <CrudTable title="Débito Automático" columns={["Associado", "Banco", "Agência", "Conta", "Status"]} data={[
          ["Fernanda Lima", "Banco do Brasil", "1234", "56789-0", "Ativo"],
          ["Lucas Martins", "Itaú", "0987", "12345-6", "Ativo"],
        ]} />
      )}
      {ccTab === 3 && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="outline" size="sm" className="gap-1 text-xs border-[hsl(210_30%_85%)]" onClick={() => toast.success("Exportado")}><Download className="h-3 w-3" />Exportar</Button></div>
          <CrudTable title="" columns={["Mês", "Cartão Ativo", "Cartão Inativo", "Débito Auto", "Total Recebido"]} data={[
            ["07/2025", "3", "2", "2", "R$ 1.430,00"],
            ["06/2025", "3", "1", "2", "R$ 1.380,00"],
          ]} />
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 3) OPCIONAIS DE VEÍCULO
// ═══════════════════════════════════════════════════════════

function OpcionaisVeiculo({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Tipo Veículo", "Categoria", "Cota Veículo", "Cor", "Montadora", "Modelo", "Combustível", "Alienação", "Tipo Carga", "Tipo Carroceria", "Cat. Assoc./Veíc."];

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && <CrudTable title="Tipos de Veículo" columns={["Tipo", "Descrição"]} data={[["Automóvel", "Veículos de passeio"],["Pesado", "Caminhões e ônibus"],["Moto", "Motocicletas"],["Utilitário", "Vans e pickups"]]} />}
      {subView === 1 && <CrudTable title="Categorias" columns={["Categoria", "Descrição", "Fator"]} data={[["Passeio", "Veículos particulares", "1.0x"],["Locador", "Veículos de locadora", "1.2x"],["Táxi/App", "Veículos de transporte", "1.3x"],["Frota", "Veículos corporativos", "1.1x"]]} />}
      {subView === 2 && (
        <CrudTable title="Cotas por Faixa FIPE" columns={["Faixa FIPE", "Cota", "Valor Mensal Base"]} data={[
          ["R$ 0 — R$ 30.000", "R$ 20-30 mil", "R$ 89,90"],
          ["R$ 30.001 — R$ 50.000", "R$ 30-50 mil", "R$ 129,90"],
          ["R$ 50.001 — R$ 70.000", "R$ 50-70 mil", "R$ 169,90"],
          ["R$ 70.001 — R$ 100.000", "R$ 70-100 mil", "R$ 219,90"],
          ["R$ 100.001 — R$ 150.000", "R$ 100-150 mil", "R$ 289,90"],
        ]} />
      )}
      {subView === 3 && <CrudTable title="Cores" columns={["Cor", "Código"]} data={[["Branco", "01"],["Preto", "02"],["Prata", "03"],["Vermelho", "04"],["Azul", "05"],["Cinza", "06"]]} />}
      {subView === 4 && <CrudTable title="Montadoras" columns={["Montadora", "País", "Status"]} data={[["Chevrolet", "EUA", "Ativo"],["Volkswagen", "Alemanha", "Ativo"],["Fiat", "Itália", "Ativo"],["Hyundai", "Coreia do Sul", "Ativo"],["Toyota", "Japão", "Ativo"],["Kia", "Coreia do Sul", "Ativo"],["Honda", "Japão", "Ativo"]]} />}
      {subView === 5 && <CrudTable title="Modelos (FIPE)" columns={["Montadora", "Modelo", "Código FIPE"]} data={[["Chevrolet", "Onix Plus 1.0 Turbo", "004459-0"],["Fiat", "Argo 1.0", "038003-2"],["Hyundai", "HB20 1.0", "037122-4"],["VW", "Polo 1.0 TSI", "005585-6"],["Toyota", "Corolla Cross XRE", "009317-2"]]} />}
      {subView === 6 && <CrudTable title="Combustíveis" columns={["Combustível", "Código"]} data={[["Gasolina", "G"],["Etanol", "E"],["Diesel", "D"],["Flex", "F"],["Híbrido", "H"],["Elétrico", "EL"]]} />}
      {subView === 7 && <CrudTable title="Alienação" columns={["Tipo", "Descrição"]} data={[["Alienado", "Veículo financiado com alienação fiduciária"],["Quitado", "Veículo sem gravame"],["Leasing", "Arrendamento mercantil"]]} />}
      {subView === 8 && <CrudTable title="Tipos de Carga" columns={["Tipo", "Descrição"]} data={[["Seca", "Carga geral não perecível"],["Refrigerada", "Produtos perecíveis"],["Granel", "Materiais a granel"],["Perigosa", "Produtos químicos/inflamáveis"]]} />}
      {subView === 9 && <CrudTable title="Tipos de Carroceria" columns={["Tipo", "Descrição"]} data={[["Baú", "Carroceria fechada"],["Sider", "Lonado lateral"],["Graneleiro", "Transporte de grãos"],["Tanque", "Transporte líquidos"],["Plataforma", "Carga aberta"]]} />}
      {subView === 10 && <CrudTable title="Categoria Associado/Veículo" columns={["Categoria", "Descrição", "Fator Rateio"]} data={[["PF - Passeio", "Pessoa Física com veículo de passeio", "1.0x"],["PF - Utilitário", "Pessoa Física com utilitário", "1.2x"],["PJ - Frota", "Pessoa Jurídica com frota", "1.1x"],["PF - Moto", "Pessoa Física com moto", "0.7x"]]} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 4) OPCIONAIS DE EVENTO
// ═══════════════════════════════════════════════════════════

function OpcionaisEvento({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Campo Adicional", "Envolvimento", "Motivo", "Situação", "Classificação", "Checklist Docs", "Peça/Serviço"];

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && <CrudTable title="Campos Adicionais" columns={["Campo", "Tipo", "Status"]} data={[["Fraude", "Flag", "Ativo"],["Perícia solicitada", "Flag", "Ativo"],["Foto obrigatória", "Flag", "Ativo"]]} />}
      {subView === 1 && <CrudTable title="Tipos de Envolvimento" columns={["Envolvimento", "Descrição"]} data={[["Causador", "Responsável pelo sinistro"],["Vítima", "Parte afetada"],["Terceiro", "Veículo/pessoa de terceiro"],["Testemunha", "Testemunha do evento"]]} />}
      {subView === 2 && <CrudTable title="Motivos de Evento" columns={["Motivo", "Categoria", "Status"]} data={[["Colisão", "Acidente", "Ativo"],["Fenômeno Natural", "Natureza", "Ativo"],["Furto", "Crime", "Ativo"],["Roubo", "Crime", "Ativo"],["Incêndio", "Acidente", "Ativo"],["Periférico", "Acessório", "Ativo"]]} />}
      {subView === 3 && <CrudTable title="Situações de Evento" columns={["Situação", "Descrição", "Cor"]} data={[["Aberto", "Evento registrado", "🔵 Azul"],["Em análise", "Sob avaliação técnica", "🟡 Amarelo"],["Sindicância", "Investigação em andamento", "🟠 Laranja"],["Aprovado", "Autorizado para reparo", "🟢 Verde"],["Negado", "Solicitação indeferida", "🔴 Vermelho"]]} />}
      {subView === 4 && <CrudTable title="Classificações" columns={["Classificação", "Descrição"]} data={[["Em andamento", "Evento em processamento"],["Concluído", "Evento finalizado"],["Cancelado", "Evento cancelado"],["Reaberto", "Evento reaberto para análise"]]} />}
      {subView === 5 && <CrudTable title="Checklist de Documentos" columns={["Documento", "Obrigatório", "Tipo Evento"]} data={[["Boletim de Ocorrência", "Sim", "Todos"],["CNH do Condutor", "Sim", "Colisão, Roubo"],["Fotos do Veículo", "Sim", "Todos"],["Laudo Pericial", "Não", "Roubo, Furto"],["Nota Fiscal Reparo", "Sim", "Colisão"]]} />}
      {subView === 6 && <CrudTable title="Peças e Serviços" columns={["Item", "Tipo", "Status"]} data={[["Acordo", "Serviço", "Ativo"],["Carro reserva", "Serviço", "Ativo"],["Indenização integral", "Serviço", "Ativo"],["Reparo funilaria", "Peça/Serviço", "Ativo"],["Troca de vidro", "Peça", "Ativo"]]} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 5) COOPERATIVA
// ═══════════════════════════════════════════════════════════

function Cooperativa({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Consulta Cooperativas", "Relatório", "Voluntários", "Comissões", "Rel. Alterações", "Indicação Externa"];
  const [filtro, setFiltro] = useState("Todos");

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && (
        <div className="space-y-3">
          <div className="flex gap-3 items-end">
            <div><Label className="text-xs">Status</Label>
              <Select value={filtro} onValueChange={setFiltro}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos</SelectItem><SelectItem value="Ativa">Ativas</SelectItem><SelectItem value="Inativa">Inativas</SelectItem></SelectContent></Select>
            </div>
          </div>
          <CrudTable title="Cooperativas" columns={["Nome", "CNPJ", "Regional", "Qtde Associados", "Status"]} data={[
            ["Central SP", "12.345.678/0001-90", "São Paulo", "320", "Ativa"],
            ["Campinas Proteção", "23.456.789/0001-01", "Campinas", "210", "Ativa"],
            ["Litoral Sul", "34.567.890/0001-12", "Santos", "130", "Ativa"],
            ["Ribeirão Preto", "45.678.901/0001-23", "Ribeirão", "95", "Ativa"],
            ["Norte PR", "56.789.012/0001-34", "Londrina", "45", "Inativa"],
          ]} />
        </div>
      )}

      {subView === 1 && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="outline" size="sm" className="gap-1 text-xs border-[hsl(210_30%_85%)]" onClick={() => toast.success("Exportado")}><Download className="h-3 w-3" />Exportar</Button></div>
          <CrudTable title="Relatório de Cooperativas" columns={["Cooperativa", "Status", "Vendas (mês)", "Voluntários"]} data={[
            ["Central SP", "Ativa", "45", "12"],
            ["Campinas", "Ativa", "28", "8"],
            ["Litoral Sul", "Ativa", "15", "5"],
            ["Ribeirão Preto", "Ativa", "12", "4"],
          ]} />
        </div>
      )}

      {subView === 2 && (
        <CrudTable title="Voluntários por Cooperativa" columns={["Nome", "Cooperativa", "Função", "Desde", "Status"]} data={[
          ["João Mendes", "Central SP", "Consultor", "01/2024", "Ativo"],
          ["Ana Costa", "Central SP", "Gerente", "03/2023", "Ativo"],
          ["Pedro Lima", "Campinas", "Consultor", "06/2024", "Ativo"],
          ["Maria Santos", "Litoral Sul", "Consultor", "09/2024", "Ativo"],
          ["Carlos Rocha", "Ribeirão Preto", "Gerente", "01/2023", "Ativo"],
        ]} />
      )}

      {subView === 3 && (
        <CrudTable title="Regras de Comissão" columns={["Cooperativa", "Meta Mínima", "Comissão (%)", "Bonificação"]} data={[
          ["Central SP", "30 contratos", "8%", "R$ 500 acima da meta"],
          ["Campinas", "20 contratos", "7%", "R$ 400 acima da meta"],
          ["Litoral Sul", "15 contratos", "9%", "R$ 300 acima da meta"],
        ]} />
      )}

      {subView === 4 && (
        <CrudTable title="Histórico de Alterações de Voluntários" columns={["Data", "Voluntário", "Ação", "Usuário"]} data={[
          ["10/07/2025", "João Mendes", "Cooperativa alterada: Campinas → Central SP", "Admin"],
          ["05/07/2025", "Pedro Lima", "Cadastro criado", "Gerente"],
          ["01/07/2025", "Maria Santos", "Status: Inativo → Ativo", "Admin"],
          ["28/06/2025", "Carlos Rocha", "Função: Consultor → Gerente", "Admin"],
        ]} />
      )}

      {subView === 5 && (
        <CrudTable title="Indicações Externas" columns={["Indicante", "Indicado", "Data", "Status", "Comissão"]} data={[
          ["Carlos E. Silva", "Marcos Pereira", "10/07/2025", "Convertido", "R$ 50,00"],
          ["Maria F. Oliveira", "Ana Beatriz", "08/07/2025", "Pendente", "-"],
          ["João P. Santos", "Roberto Neto", "05/07/2025", "Convertido", "R$ 50,00"],
        ]} />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 6) VISTORIA
// ═══════════════════════════════════════════════════════════

function VistoriaConfig({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Vistoriadores", "Imagens Obrigatórias", "Itens Vistoria", "Tipos Avaria", "Marca Pneus", "Tipo Vistoria", "Medida Pneus"];

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && (
        <CrudTable title="Cadastro de Vistoriadores" columns={["Nome", "CPF", "Região", "Vistorias (mês)", "Status"]} data={[
          ["Felipe Augusto", "111.222.333-44", "São Paulo", "32", "Ativo"],
          ["Luciana Ribeiro", "222.333.444-55", "Campinas", "28", "Ativo"],
          ["Marcos Oliveira", "333.444.555-66", "Santos", "15", "Ativo"],
          ["Patricia Fernandes", "444.555.666-77", "Ribeirão Preto", "20", "Inativo"],
        ]} />
      )}

      {subView === 1 && (
        <Card className="border-[hsl(210_30%_88%)] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-[hsl(212_35%_18%)]">Imagens Obrigatórias na Vistoria</CardTitle>
            <CardDescription>Configure quais fotos devem ser exigidas durante a vistoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { nome: "Step (Gravação do Chassi)", obrigatorio: true },
                { nome: "Painel / Hodômetro", obrigatorio: true },
                { nome: "Para-brisa Frontal", obrigatorio: true },
                { nome: "Lateral Esquerda", obrigatorio: true },
                { nome: "Lateral Direita", obrigatorio: true },
                { nome: "Traseira", obrigatorio: true },
                { nome: "Motor", obrigatorio: true },
                { nome: "Interior (Banco Dianteiro)", obrigatorio: false },
                { nome: "Interior (Banco Traseiro)", obrigatorio: false },
                { nome: "Porta-malas", obrigatorio: false },
              ].map((img, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg border-[hsl(210_30%_88%)]">
                  <span className="text-sm">{img.nome}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{img.obrigatorio ? "Obrigatória" : "Opcional"}</span>
                    <Switch defaultChecked={img.obrigatorio} />
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-4 gap-2 bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_25%)] text-white" onClick={() => toast.success("Configuração salva")}><Save className="h-4 w-4" />Salvar</Button>
          </CardContent>
        </Card>
      )}

      {subView === 2 && <CrudTable title="Itens de Vistoria" columns={["Item", "Categoria", "Obrigatório"]} data={[["Rádio / Multimídia", "Eletrônico", "Sim"],["Som / Alto-falantes", "Eletrônico", "Não"],["Retrovisores", "Estrutural", "Sim"],["Acessórios Aftermarket", "Acessório", "Não"],["Estepe", "Segurança", "Sim"],["Triângulo", "Segurança", "Sim"],["Macaco", "Segurança", "Sim"]]} />}

      {subView === 3 && <CrudTable title="Tipos de Avaria" columns={["Avaria", "Gravidade", "Status"]} data={[["Capô amassado", "Média", "Ativo"],["Lanterna queimada", "Leve", "Ativo"],["Para-choque riscado", "Leve", "Ativo"],["Vidro trincado", "Alta", "Ativo"],["Porta amassada", "Média", "Ativo"],["Pintura descascada", "Leve", "Ativo"]]} />}

      {subView === 4 && <CrudTable title="Marcas de Pneus" columns={["Marca", "País", "Status"]} data={[["Michelin", "França", "Ativo"],["Goodyear", "EUA", "Ativo"],["Pirelli", "Itália", "Ativo"],["Bridgestone", "Japão", "Ativo"],["Continental", "Alemanha", "Ativo"],["Dunlop", "Reino Unido", "Ativo"]]} />}

      {subView === 5 && <CrudTable title="Tipos de Vistoria" columns={["Tipo", "Descrição", "Tempo Estimado"]} data={[["Leve", "Veículos de passeio até 1.5", "30 min"],["Pesado", "Caminhões e veículos pesados", "60 min"],["Pesado com Agregado", "Pesado com implemento/carroceria", "90 min"],["Moto", "Motocicletas", "20 min"]]} />}

      {subView === 6 && <CrudTable title="Medidas de Pneus" columns={["Medida", "Tipo Veículo", "Status"]} data={[["175/70 R14", "Passeio", "Ativo"],["185/65 R15", "Passeio", "Ativo"],["195/55 R16", "Passeio", "Ativo"],["205/55 R17", "Passeio/SUV", "Ativo"],["215/65 R16", "SUV", "Ativo"],["265/70 R16", "Caminhonete", "Ativo"],["295/80 R22.5", "Caminhão", "Ativo"]]} />}
    </>
  );
}
