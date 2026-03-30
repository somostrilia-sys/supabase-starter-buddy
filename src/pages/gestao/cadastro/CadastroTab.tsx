import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Package, DollarSign, Car, AlertTriangle, Building2, ClipboardCheck,
  Plus, Edit, Trash2, Search, Download, Save, ChevronRight,
  ArrowRightLeft, FileText, Shield,
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

// ── Generic CRUD helpers ──
type CrudRow = Record<string, string>;

function useCrudState(initial: CrudRow[], columns: string[]) {
  const [data, setData] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<CrudRow>(() => Object.fromEntries(columns.map(c => [c, ""])));
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  const openNew = () => { setEditIdx(null); setForm(Object.fromEntries(columns.map(c => [c, ""]))); setModalOpen(true); };
  const openEdit = (i: number) => { setEditIdx(i); setForm({ ...data[i] }); setModalOpen(true); };
  const save = () => {
    if (!form[columns[0]]) { toast.error(`Preencha o campo "${columns[0]}"`); return; }
    if (editIdx !== null) {
      setData(p => p.map((r, i) => i === editIdx ? { ...form } : r));
      toast.success("Registro atualizado!");
    } else {
      setData(p => [...p, { ...form }]);
      toast.success("Registro adicionado!");
    }
    setModalOpen(false);
  };
  const confirmDelete = () => {
    if (deleteIdx !== null) {
      setData(p => p.filter((_, i) => i !== deleteIdx));
      toast.success("Registro removido!");
      setDeleteIdx(null);
    }
  };

  return { data, setData, modalOpen, setModalOpen, editIdx, form, setForm, openNew, openEdit, save, deleteIdx, setDeleteIdx, confirmDelete };
}

// ── Generic CRUD Table Component with working forms ──
function CrudTable({ title, columns, initialData, fieldOptions }: {
  title: string;
  columns: string[];
  initialData: CrudRow[];
  fieldOptions?: Record<string, string[]>;
}) {
  const crud = useCrudState(initialData, columns);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={crud.openNew}>
          <Plus className="h-3 w-3" />Adicionar
        </Button>
      </div>
      <div className="border rounded-lg border-border overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map(c => <TableHead key={c} className="text-xs">{c}</TableHead>)}
              <TableHead className="text-xs w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crud.data.map((row, i) => (
              <TableRow key={i}>
                {columns.map(c => <TableCell key={c} className="text-sm">{row[c]}</TableCell>)}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => crud.openEdit(i)}><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => crud.setDeleteIdx(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {crud.data.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground py-8">Nenhum registro cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={crud.modalOpen} onOpenChange={crud.setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{crud.editIdx !== null ? "Editar" : "Novo"} {title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {columns.map(col => (
              <div key={col} className="space-y-1">
                <Label className="text-xs">{col}</Label>
                {fieldOptions?.[col] ? (
                  <Select value={crud.form[col] || ""} onValueChange={v => crud.setForm(p => ({ ...p, [col]: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{fieldOptions[col].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={crud.form[col] || ""} onChange={e => crud.setForm(p => ({ ...p, [col]: e.target.value }))} placeholder={col} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setModalOpen(false)}>Cancelar</Button>
            <Button onClick={crud.save}>{crud.editIdx !== null ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={crud.deleteIdx !== null} onOpenChange={o => !o && crud.setDeleteIdx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setDeleteIdx(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={crud.confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Read-only table (for audit logs) ──
function ReadOnlyTable({ title, columns, data }: { title: string; columns: string[]; data: CrudRow[] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="border rounded-lg border-border overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map(c => <TableHead key={c} className="text-xs">{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map(c => <TableCell key={c} className="text-sm">{row[c]}</TableCell>)}
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
        <h2 className="text-xl font-bold">Cadastro</h2>
        <p className="text-sm text-muted-foreground">Configurações e cadastros operacionais do sistema</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[400px] md:min-h-[600px]">
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

        <div className="flex-1 min-w-0">
          {activeGroup === "produtos" && <GrupoProdutos subView={subView} setSubView={setSubView} />}
          {activeGroup === "financeiros" && <OpcionaisFinanceiros subView={subView} setSubView={setSubView} />}
          {activeGroup === "veiculo" && <OpcionaisVeiculoSection subView={subView} setSubView={setSubView} />}
          {activeGroup === "evento" && <OpcionaisEvento subView={subView} setSubView={setSubView} />}
          {activeGroup === "cooperativa" && <CooperativaSection subView={subView} setSubView={setSubView} />}
          {activeGroup === "vistoria" && <VistoriaConfig subView={subView} setSubView={setSubView} />}
        </div>
      </div>
    </div>
  );
}

// ── SubNav ──
function SubNav({ items, active, onChange }: { items: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex gap-1 border-b border-border mb-5 overflow-x-auto">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
            i === active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// Helper to convert arrays to CrudRow[]
function toRows(columns: string[], data: string[][]): CrudRow[] {
  return data.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i] || ""])));
}

// ═══════════════════════════════════════════════════════════
// 1) GRUPO DE PRODUTOS
// ═══════════════════════════════════════════════════════════

function GrupoProdutos({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Grupo de Cadastros", "Classificação", "Substituição Fornecedor", "Relatórios"];

  // Grupo de Produtos - editable with proper modal (NO "Valor Mensal" - plano only groups products)
  const grupoCols = ["Grupo", "Produtos", "Status"];
  const [grupos, setGrupos] = useState<CrudRow[]>([
    { Grupo: "Plano Básico", Produtos: "Rateio + Assistência 24h", Status: "Ativo" },
    { Grupo: "Plano Completo", Produtos: "Rateio + Assistência + Rastreador + Carro Reserva", Status: "Ativo" },
    { Grupo: "Plano Premium", Produtos: "Rateio + Assistência + Rastreador + Carro Reserva + Vidros", Status: "Ativo" },
    { Grupo: "Plano Moto", Produtos: "Rateio + Assistência 24h Moto", Status: "Ativo" },
    { Grupo: "Plano Pesados", Produtos: "Rateio + Assistência Pesados + Rastreador", Status: "Inativo" },
  ]);
  const [grupoModal, setGrupoModal] = useState(false);
  const [grupoEditIdx, setGrupoEditIdx] = useState<number | null>(null);
  const [grupoForm, setGrupoForm] = useState<{ Grupo: string; Produtos: string; Status: string }>({ Grupo: "", Produtos: "", Status: "Ativo" });
  const [grupoDeleteIdx, setGrupoDeleteIdx] = useState<number | null>(null);

  const openGrupoNew = () => { setGrupoEditIdx(null); setGrupoForm({ Grupo: "", Produtos: "", Status: "Ativo" }); setGrupoModal(true); };
  const openGrupoEdit = (i: number) => { setGrupoEditIdx(i); setGrupoForm({ Grupo: grupos[i].Grupo, Produtos: grupos[i].Produtos, Status: grupos[i].Status }); setGrupoModal(true); };
  const saveGrupo = () => {
    if (!grupoForm.Grupo) { toast.error("Informe o nome do grupo"); return; }
    if (grupoEditIdx !== null) {
      setGrupos(p => p.map((r, i) => i === grupoEditIdx ? { ...grupoForm } : r));
      toast.success("Grupo atualizado!");
    } else {
      setGrupos(p => [...p, { ...grupoForm }]);
      toast.success("Grupo criado!");
    }
    setGrupoModal(false);
  };

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">Grupos de Produtos</h4>
              <p className="text-xs text-muted-foreground">Plano agrupa produtos. Mensalidade = produto base + taxa admin (cotas/FIPE) + rateio + adicionais</p>
            </div>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={openGrupoNew}><Plus className="h-3 w-3" />Novo Grupo</Button>
          </div>
          <div className="border rounded-lg border-border overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader><TableRow className="bg-muted/50"><TableHead className="text-xs">Grupo</TableHead><TableHead className="text-xs">Produtos Vinculados</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-[80px]">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {grupos.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{row.Grupo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.Produtos}</TableCell>
                    <TableCell><Badge className={row.Status === "Ativo" ? "bg-emerald-500/10 text-emerald-600 text-xs" : "bg-muted text-muted-foreground text-xs"}>{row.Status}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openGrupoEdit(i)}><Edit className="h-3 w-3" /></Button><Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setGrupoDeleteIdx(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Dialog open={grupoModal} onOpenChange={setGrupoModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>{grupoEditIdx !== null ? "Editar" : "Novo"} Grupo de Produtos</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Nome do Grupo</Label><Input value={grupoForm.Grupo} onChange={e => setGrupoForm(p => ({ ...p, Grupo: e.target.value }))} placeholder="Ex: Plano Especial" /></div>
                <div><Label className="text-xs">Produtos Vinculados</Label><Textarea value={grupoForm.Produtos} onChange={e => setGrupoForm(p => ({ ...p, Produtos: e.target.value }))} placeholder="Ex: Rateio + Assistência 24h + Rastreador" /></div>
                <div><Label className="text-xs">Status</Label>
                  <Select value={grupoForm.Status} onValueChange={v => setGrupoForm(p => ({ ...p, Status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGrupoModal(false)}>Cancelar</Button>
                <Button onClick={saveGrupo}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={grupoDeleteIdx !== null} onOpenChange={o => !o && setGrupoDeleteIdx(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este grupo?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGrupoDeleteIdx(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => { setGrupos(p => p.filter((_, i) => i !== grupoDeleteIdx)); toast.success("Grupo removido!"); setGrupoDeleteIdx(null); }}>Excluir</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {subView === 1 && (
        <CrudTable
          title="Classificação de Produtos"
          columns={["Classificação", "Descrição", "Status"]}
          initialData={toRows(["Classificação", "Descrição", "Status"], [
            ["Rastreamento", "Equipamentos de rastreamento veicular", "Ativo"],
            ["Assistência 24h", "Serviço de assistência em emergências", "Ativo"],
            ["Carro Reserva", "Veículo substituto durante reparo", "Ativo"],
            ["Produto Adicional", "Coberturas extras opcionais", "Ativo"],
          ])}
          fieldOptions={{ Status: ["Ativo", "Inativo"] }}
        />
      )}

      {subView === 2 && <SubstituicaoFornecedor />}

      {subView === 3 && <RelatoriosProdutos />}
    </>
  );
}

function SubstituicaoFornecedor() {
  const [fornecedorAtual, setFornecedorAtual] = useState("");
  const [fornecedorNovo, setFornecedorNovo] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);

  const fornecedores = ["Tracker Pro Rastreadores", "Assist Brasil 24h", "CarReserve Locações", "SatTrack Rastreamento", "Road Assist Nacional", "Localiza Frotas"];

  const executar = () => {
    if (!fornecedorAtual || !fornecedorNovo) { toast.error("Selecione os dois fornecedores"); return; }
    if (fornecedorAtual === fornecedorNovo) { toast.error("Os fornecedores devem ser diferentes"); return; }
    setConfirmModal(true);
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Substituição de Fornecedor</CardTitle>
        <CardDescription>Migrar todos os produtos de um fornecedor para outro</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Fornecedor Atual</Label>
            <Select value={fornecedorAtual} onValueChange={setFornecedorAtual}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{fornecedores.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Novo Fornecedor</Label>
            <Select value={fornecedorNovo} onValueChange={setFornecedorNovo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{fornecedores.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="p-3 bg-warning/8 border border-amber-500/20 rounded-lg text-sm text-warning">
          ⚠️ Esta ação migrará todos os produtos e contratos vinculados ao fornecedor selecionado.
        </div>
        <Button className="gap-2" onClick={executar}><ArrowRightLeft className="h-4 w-4" />Migrar Fornecedor</Button>
      </CardContent>

      <Dialog open={confirmModal} onOpenChange={setConfirmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Migração</DialogTitle></DialogHeader>
          <p className="text-sm">Migrar todos os produtos de <strong>{fornecedorAtual}</strong> para <strong>{fornecedorNovo}</strong>?</p>
          <p className="text-xs text-muted-foreground">Esta operação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success(`Fornecedor migrado: ${fornecedorAtual} → ${fornecedorNovo}`); setConfirmModal(false); setFornecedorAtual(""); setFornecedorNovo(""); }}>Confirmar Migração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function RelatoriosProdutos() {
  const [relTab, setRelTab] = useState(0);
  const rels = ["Produtos por Fornecedor", "Utilização por Cooperativa", "Alterações de Produto"];
  const fornecedorCols = ["Fornecedor", "Produto", "Qtde Contratos", "Valor Mensal"];
  const utilizCols = ["Cooperativa", "Produto", "Qtde Utiliz.", "% do Total"];
  const alterCols = ["Data", "Produto", "Alteração", "Usuário"];

  return (
    <>
      <SubNav items={rels} active={relTab} onChange={setRelTab} />
      {relTab === 0 && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.success("Exportado")}><Download className="h-3 w-3" />Exportar</Button></div>
          <CrudTable title="Produtos por Fornecedor" columns={fornecedorCols}
            initialData={toRows(fornecedorCols, [["Tracker Pro", "Rastreador Veicular", "342", "R$ 39,90"],["Assist Brasil", "Assistência 24h", "847", "R$ 29,90"],["CarReserve", "Carro Reserva", "215", "R$ 49,90"]])} />
        </div>
      )}
      {relTab === 1 && (
        <CrudTable title="Utilização por Cooperativa" columns={utilizCols}
          initialData={toRows(utilizCols, [["Central SP", "Assistência 24h", "425", "50.2%"],["Campinas", "Rastreador", "180", "21.2%"],["Litoral SP", "Carro Reserva", "98", "11.6%"]])} />
      )}
      {relTab === 2 && (
        <CrudTable title="Alterações de Produto" columns={alterCols}
          initialData={toRows(alterCols, [["10/07/2025", "Plano Completo", "Valor atualizado R$ 199 → R$ 219", "Admin"],["05/07/2025", "Rastreador", "Fornecedor alterado", "Gerente"],["01/07/2025", "Plano Moto", "Status: Ativo → Inativo", "Admin"]])} />
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
        <CrudTable title="Contas Bancárias" columns={["Banco", "Agência", "Conta", "Tipo", "Status"]}
          initialData={toRows(["Banco", "Agência", "Conta", "Tipo", "Status"], [["Banco do Brasil", "1234-5", "56789-0", "Corrente", "Ativa"],["Itaú", "0987", "12345-6", "Corrente", "Ativa"],["Bradesco", "4567", "98765-4", "Poupança", "Inativa"]])}
          fieldOptions={{ Tipo: ["Corrente", "Poupança"], Status: ["Ativa", "Inativa"] }} />
      )}

      {subView === 1 && (
        <CrudTable title="Datas de Vencimento" columns={["Dia", "Descrição", "Status"]}
          initialData={toRows(["Dia", "Descrição", "Status"], [["05", "Vencimento dia 5", "Ativo"],["10", "Vencimento dia 10", "Ativo"],["15", "Vencimento dia 15", "Ativo"],["20", "Vencimento dia 20", "Ativo"],["25", "Vencimento dia 25", "Inativo"]])}
          fieldOptions={{ Status: ["Ativo", "Inativo"] }} />
      )}

      {subView === 2 && (
        <CrudTable title="Tipos de Boleto" columns={["Tipo", "Descrição"]}
          initialData={toRows(["Tipo", "Descrição"], [["Mensalidade", "Cobrança mensal do associado"],["Adesão", "Taxa de adesão inicial"],["Avulso", "Cobrança avulsa"],["Rateio", "Cobrança de rateio de evento"]])} />
      )}

      {subView === 3 && (
        <CrudTable title="Situações de Boleto" columns={["Código", "Situação", "Cor"]}
          initialData={toRows(["Código", "Situação", "Cor"], [["01", "Pendente", "🟡 Amarelo"],["02", "Pago", "🟢 Verde"],["03", "Cancelado", "🔴 Vermelho"],["04", "Pendente de vistoria", "🟠 Laranja"]])}
          fieldOptions={{ Cor: ["🟡 Amarelo", "🟢 Verde", "🔴 Vermelho", "🟠 Laranja", "🔵 Azul"] }} />
      )}

      {subView === 4 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Mensagens Personalizadas para Boletos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label className="text-xs">Mensagem de Lembrete (Antes do Vencimento)</Label><Textarea defaultValue="Prezado(a) associado(a), sua mensalidade vence no dia {DATA_VENCIMENTO}. Valor: {VALOR}. Evite atrasos!" className="min-h-[80px]" /></div>
            <div><Label className="text-xs">Mensagem de Atraso</Label><Textarea defaultValue="Prezado(a), identificamos que a mensalidade ref. {REFERENCIA} encontra-se em atraso. Regularize sua situação." className="min-h-[80px]" /></div>
            <div><Label className="text-xs">Mensagem de Confirmação de Pagamento</Label><Textarea defaultValue="Pagamento confirmado! Mensalidade ref. {REFERENCIA} no valor de {VALOR} foi registrada com sucesso." className="min-h-[80px]" /></div>
            <Button className="gap-2" onClick={() => toast.success("Mensagens salvas")}><Save className="h-4 w-4" />Salvar Mensagens</Button>
          </CardContent>
        </Card>
      )}

      {subView === 5 && (
        <CrudTable title="Motivos de Boleto" columns={["Código", "Descrição", "Situação"]}
          initialData={toRows(["Código", "Descrição", "Situação"], [["M01", "Mensalidade regular", "Ativo"],["M02", "Adesão nova", "Ativo"],["M03", "Cobrança de rateio", "Ativo"],["M04", "Taxa administrativa", "Ativo"],["M05", "Reembolso parcial", "Inativo"]])}
          fieldOptions={{ Situação: ["Ativo", "Inativo"] }} />
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
        <CrudTable title="Cartões Ativos" columns={["Associado", "Bandeira", "Final", "Validade", "Status"]}
          initialData={toRows(["Associado", "Bandeira", "Final", "Validade", "Status"], [["Carlos E. Silva", "Visa", "4532", "12/2027", "Ativo"],["Maria F. Oliveira", "Mastercard", "8891", "03/2026", "Ativo"],["João P. Santos", "Elo", "2210", "08/2027", "Ativo"]])}
          fieldOptions={{ Bandeira: ["Visa", "Mastercard", "Elo", "Amex"], Status: ["Ativo", "Inativo"] }} />
      )}
      {ccTab === 1 && (
        <CrudTable title="Cartões Inativos" columns={["Associado", "Bandeira", "Final", "Motivo"]}
          initialData={toRows(["Associado", "Bandeira", "Final", "Motivo"], [["Roberto Almeida", "Visa", "1123", "Expirado"],["Ana Carolina F.", "Mastercard", "5567", "Cancelado pelo associado"]])}
          fieldOptions={{ Bandeira: ["Visa", "Mastercard", "Elo", "Amex"], Motivo: ["Expirado", "Cancelado pelo associado", "Fraude", "Outro"] }} />
      )}
      {ccTab === 2 && (
        <CrudTable title="Débito Automático" columns={["Associado", "Banco", "Agência", "Conta", "Status"]}
          initialData={toRows(["Associado", "Banco", "Agência", "Conta", "Status"], [["Fernanda Lima", "Banco do Brasil", "1234", "56789-0", "Ativo"],["Lucas Martins", "Itaú", "0987", "12345-6", "Ativo"]])}
          fieldOptions={{ Status: ["Ativo", "Inativo"] }} />
      )}
      {ccTab === 3 && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.success("Exportado")}><Download className="h-3 w-3" />Exportar</Button></div>
          <ReadOnlyTable title="Relatório Cartões" columns={["Mês", "Cartão Ativo", "Cartão Inativo", "Débito Auto", "Total Recebido"]}
            data={toRows(["Mês", "Cartão Ativo", "Cartão Inativo", "Débito Auto", "Total Recebido"], [["07/2025", "3", "2", "2", "R$ 1.430,00"],["06/2025", "3", "1", "2", "R$ 1.380,00"]])} />
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 3) OPCIONAIS DE VEÍCULO
// ═══════════════════════════════════════════════════════════

function OpcionaisVeiculoSection({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Tipo Veículo", "Categoria", "Cota Veículo", "Cor", "Montadora", "Modelo", "Combustível", "Alienação", "Tipo Carga", "Tipo Carroceria", "Cat. Assoc./Veíc."];

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && <CrudTable title="Tipos de Veículo" columns={["Tipo", "Descrição"]}
        initialData={toRows(["Tipo", "Descrição"], [["Automóvel", "Veículos de passeio"],["Pesado", "Caminhões e ônibus"],["Moto", "Motocicletas"],["Utilitário", "Vans e pickups"]])} />}

      {/* Categoria - REMOVED "Fator" multiplicativo */}
      {subView === 1 && <CrudTable title="Categorias" columns={["Categoria", "Descrição"]}
        initialData={toRows(["Categoria", "Descrição"], [["Passeio", "Veículos particulares"],["Locador", "Veículos de locadora"],["Táxi/App", "Veículos de transporte"],["Frota", "Veículos corporativos"]])} />}

      {/* Intervalo de Cota - REMOVED "Valor Mensal Base", only Faixa FIPE + cálculo dinâmico */}
      {subView === 2 && (
        <div className="space-y-3">
          <div className="p-3 bg-primary/10 border border-blue-500/20 rounded-lg text-sm text-primary">
            ℹ️ O valor da cota é calculado dinamicamente: produto base + taxa admin (faixa FIPE) + rateio (categoria/regional) + adicionais
          </div>
          <CrudTable title="Cotas por Faixa FIPE" columns={["Faixa FIPE", "Cota"]}
            initialData={toRows(["Faixa FIPE", "Cota"], [
              ["R$ 0 — R$ 30.000", "R$ 20-30 mil"],
              ["R$ 30.001 — R$ 50.000", "R$ 30-50 mil"],
              ["R$ 50.001 — R$ 70.000", "R$ 50-70 mil"],
              ["R$ 70.001 — R$ 100.000", "R$ 70-100 mil"],
              ["R$ 100.001 — R$ 150.000", "R$ 100-150 mil"],
            ])} />
        </div>
      )}

      {subView === 3 && <CrudTable title="Cores" columns={["Cor", "Código"]}
        initialData={toRows(["Cor", "Código"], [["Branco", "01"],["Preto", "02"],["Prata", "03"],["Vermelho", "04"],["Azul", "05"],["Cinza", "06"]])} />}

      {subView === 4 && <CrudTable title="Montadoras" columns={["Montadora", "País", "Status"]}
        initialData={toRows(["Montadora", "País", "Status"], [["Chevrolet", "EUA", "Ativo"],["Volkswagen", "Alemanha", "Ativo"],["Fiat", "Itália", "Ativo"],["Hyundai", "Coreia do Sul", "Ativo"],["Toyota", "Japão", "Ativo"],["Kia", "Coreia do Sul", "Ativo"],["Honda", "Japão", "Ativo"]])}
        fieldOptions={{ Status: ["Ativo", "Inativo"] }} />}

      {subView === 5 && <CrudTable title="Modelos (FIPE)" columns={["Montadora", "Modelo", "Código FIPE"]}
        initialData={toRows(["Montadora", "Modelo", "Código FIPE"], [["Chevrolet", "Onix Plus 1.0 Turbo", "004459-0"],["Fiat", "Argo 1.0", "038003-2"],["Hyundai", "HB20 1.0", "037122-4"],["VW", "Polo 1.0 TSI", "005585-6"],["Toyota", "Corolla Cross XRE", "009317-2"]])} />}

      {subView === 6 && <CrudTable title="Combustíveis" columns={["Combustível", "Código"]}
        initialData={toRows(["Combustível", "Código"], [["Gasolina", "G"],["Etanol", "E"],["Diesel", "D"],["Flex", "F"],["Híbrido", "H"],["Elétrico", "EL"]])} />}

      {subView === 7 && <CrudTable title="Alienação" columns={["Tipo", "Descrição"]}
        initialData={toRows(["Tipo", "Descrição"], [["Alienado", "Veículo financiado com alienação fiduciária"],["Quitado", "Veículo sem gravame"],["Leasing", "Arrendamento mercantil"]])} />}

      {subView === 8 && <CrudTable title="Tipos de Carga" columns={["Tipo", "Descrição"]}
        initialData={toRows(["Tipo", "Descrição"], [["Seca", "Carga geral não perecível"],["Refrigerada", "Produtos perecíveis"],["Granel", "Materiais a granel"],["Perigosa", "Produtos químicos/inflamáveis"]])} />}

      {subView === 9 && <CrudTable title="Tipos de Carroceria" columns={["Tipo", "Descrição"]}
        initialData={toRows(["Tipo", "Descrição"], [["Baú", "Carroceria fechada"],["Sider", "Lonado lateral"],["Graneleiro", "Transporte de grãos"],["Tanque", "Transporte líquidos"],["Plataforma", "Carga aberta"]])} />}

      {subView === 10 && <CrudTable title="Categoria Associado/Veículo" columns={["Categoria", "Descrição"]}
        initialData={toRows(["Categoria", "Descrição"], [["PF - Passeio", "Pessoa Física com veículo de passeio"],["PF - Utilitário", "Pessoa Física com utilitário"],["PJ - Frota", "Pessoa Jurídica com frota"],["PF - Moto", "Pessoa Física com moto"]])} />}
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

      {subView === 0 && <CrudTable title="Campos Adicionais (Fraude)" columns={["Campo", "Tipo", "Status"]}
        initialData={toRows(["Campo", "Tipo", "Status"], [["Fraude", "Flag", "Ativo"],["Perícia solicitada", "Flag", "Ativo"],["Foto obrigatória", "Flag", "Ativo"]])}
        fieldOptions={{ Tipo: ["Flag", "Texto", "Numérico", "Data"], Status: ["Ativo", "Inativo"] }} />}

      {subView === 1 && <CrudTable title="Tipos de Envolvimento" columns={["Envolvimento", "Descrição"]}
        initialData={toRows(["Envolvimento", "Descrição"], [["Causador", "Responsável pelo sinistro"],["Vítima", "Parte afetada"],["Terceiro", "Veículo/pessoa de terceiro"],["Testemunha", "Testemunha do evento"]])} />}

      {subView === 2 && <CrudTable title="Motivos de Evento" columns={["Motivo", "Categoria", "Status"]}
        initialData={toRows(["Motivo", "Categoria", "Status"], [["Colisão", "Acidente", "Ativo"],["Fenômeno Natural", "Natureza", "Ativo"],["Furto", "Crime", "Ativo"],["Roubo", "Crime", "Ativo"],["Incêndio", "Acidente", "Ativo"],["Periférico", "Acessório", "Ativo"]])}
        fieldOptions={{ Categoria: ["Acidente", "Crime", "Natureza", "Acessório", "Outro"], Status: ["Ativo", "Inativo"] }} />}

      {subView === 3 && <CrudTable title="Situações de Evento" columns={["Situação", "Descrição", "Cor"]}
        initialData={toRows(["Situação", "Descrição", "Cor"], [["Aberto", "Evento registrado", "🔵 Azul"],["Em análise", "Sob avaliação técnica", "🟡 Amarelo"],["Sindicância", "Investigação em andamento", "🟠 Laranja"],["Aprovado", "Autorizado para reparo", "🟢 Verde"],["Negado", "Solicitação indeferida", "🔴 Vermelho"]])}
        fieldOptions={{ Cor: ["🔵 Azul", "🟡 Amarelo", "🟠 Laranja", "🟢 Verde", "🔴 Vermelho"] }} />}

      {subView === 4 && <CrudTable title="Classificações" columns={["Classificação", "Descrição"]}
        initialData={toRows(["Classificação", "Descrição"], [["Em andamento", "Evento em processamento"],["Concluído", "Evento finalizado"],["Cancelado", "Evento cancelado"],["Reaberto", "Evento reaberto para análise"]])} />}

      {subView === 5 && <CrudTable title="Checklist de Documentos" columns={["Documento", "Obrigatório", "Tipo Evento"]}
        initialData={toRows(["Documento", "Obrigatório", "Tipo Evento"], [["Boletim de Ocorrência", "Sim", "Todos"],["CNH do Condutor", "Sim", "Colisão, Roubo"],["Fotos do Veículo", "Sim", "Todos"],["Laudo Pericial", "Não", "Roubo, Furto"],["Nota Fiscal Reparo", "Sim", "Colisão"]])}
        fieldOptions={{ Obrigatório: ["Sim", "Não"] }} />}

      {subView === 6 && <CrudTable title="Peças e Serviços" columns={["Item", "Tipo", "Status"]}
        initialData={toRows(["Item", "Tipo", "Status"], [["Acordo", "Serviço", "Ativo"],["Carro reserva", "Serviço", "Ativo"],["Indenização integral", "Serviço", "Ativo"],["Reparo funilaria", "Peça/Serviço", "Ativo"],["Troca de vidro", "Peça", "Ativo"]])}
        fieldOptions={{ Tipo: ["Peça", "Serviço", "Peça/Serviço"], Status: ["Ativo", "Inativo"] }} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 5) COOPERATIVA
// ═══════════════════════════════════════════════════════════

function CooperativaSection({ subView, setSubView }: { subView: number; setSubView: (v: number) => void }) {
  const subs = ["Consulta Cooperativas", "Relatório", "Voluntários", "Comissões", "Rel. Alterações", "Indicação Externa"];

  return (
    <>
      <SubNav items={subs} active={subView} onChange={setSubView} />

      {subView === 0 && (
        <CrudTable title="Cooperativas" columns={["Nome", "CNPJ", "Regional", "Qtde Associados", "Status"]}
          initialData={toRows(["Nome", "CNPJ", "Regional", "Qtde Associados", "Status"], [
            ["Central SP", "12.345.678/0001-90", "São Paulo", "320", "Ativa"],
            ["Campinas Proteção", "23.456.789/0001-01", "Campinas", "210", "Ativa"],
            ["Litoral Sul", "34.567.890/0001-12", "Santos", "130", "Ativa"],
            ["Ribeirão Preto", "45.678.901/0001-23", "Ribeirão", "95", "Ativa"],
            ["Norte PR", "56.789.012/0001-34", "Londrina", "45", "Inativa"],
          ])}
          fieldOptions={{ Status: ["Ativa", "Inativa"] }} />
      )}

      {subView === 1 && (
        <div className="space-y-3">
          <div className="flex justify-end"><Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => toast.success("Exportado")}><Download className="h-3 w-3" />Exportar</Button></div>
          <CrudTable title="Relatório de Cooperativas" columns={["Cooperativa", "Status", "Vendas (mês)", "Voluntários"]}
            initialData={toRows(["Cooperativa", "Status", "Vendas (mês)", "Voluntários"], [
              ["Central SP", "Ativa", "45", "12"],["Campinas", "Ativa", "28", "8"],["Litoral Sul", "Ativa", "15", "5"],["Ribeirão Preto", "Ativa", "12", "4"],
            ])} />
        </div>
      )}

      {subView === 2 && (
        <CrudTable title="Voluntários por Cooperativa" columns={["Nome", "Cooperativa", "Função", "Desde", "Status"]}
          initialData={toRows(["Nome", "Cooperativa", "Função", "Desde", "Status"], [
            ["João Mendes", "Central SP", "Consultor", "01/2024", "Ativo"],
            ["Ana Costa", "Central SP", "Gerente", "03/2023", "Ativo"],
            ["Pedro Lima", "Campinas", "Consultor", "06/2024", "Ativo"],
            ["Maria Santos", "Litoral Sul", "Consultor", "09/2024", "Ativo"],
            ["Carlos Rocha", "Ribeirão Preto", "Gerente", "01/2023", "Ativo"],
          ])}
          fieldOptions={{ Função: ["Consultor", "Gerente", "Diretor", "Supervisor"], Status: ["Ativo", "Inativo"] }} />
      )}

      {subView === 3 && (
        <CrudTable title="Regras de Comissão" columns={["Cooperativa", "Meta Mínima", "Comissão (%)", "Bonificação"]}
          initialData={toRows(["Cooperativa", "Meta Mínima", "Comissão (%)", "Bonificação"], [
            ["Central SP", "30 contratos", "8%", "R$ 500 acima da meta"],
            ["Campinas", "20 contratos", "7%", "R$ 400 acima da meta"],
            ["Litoral Sul", "15 contratos", "9%", "R$ 300 acima da meta"],
          ])} />
      )}

      {/* AUDIT LOG - Read-only, no Add button */}
      {subView === 4 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-warning/8 border border-amber-500/20 rounded-lg">
            <Shield className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning">Log de auditoria inviolável — somente visualização (diretoria)</span>
          </div>
          <ReadOnlyTable
            title="Log de Alterações"
            columns={["Data/Hora", "Usuário", "Função", "Cooperativa", "Módulo", "Operação", "Campo", "Valor Anterior", "Valor Novo"]}
            data={[
              { "Data/Hora": "10/07/2025 14:32", "Usuário": "Admin", "Função": "Administrador", "Cooperativa": "Central SP", "Módulo": "Voluntários", "Operação": "Alterar", "Campo": "Cooperativa", "Valor Anterior": "Campinas", "Valor Novo": "Central SP" },
              { "Data/Hora": "05/07/2025 09:15", "Usuário": "Gerente", "Função": "Gerente Regional", "Cooperativa": "Campinas", "Módulo": "Voluntários", "Operação": "Criar", "Campo": "-", "Valor Anterior": "-", "Valor Novo": "Pedro Lima cadastrado" },
              { "Data/Hora": "01/07/2025 16:48", "Usuário": "Admin", "Função": "Administrador", "Cooperativa": "Litoral Sul", "Módulo": "Voluntários", "Operação": "Alterar", "Campo": "Status", "Valor Anterior": "Inativo", "Valor Novo": "Ativo" },
              { "Data/Hora": "28/06/2025 11:20", "Usuário": "Admin", "Função": "Administrador", "Cooperativa": "Ribeirão Preto", "Módulo": "Voluntários", "Operação": "Alterar", "Campo": "Função", "Valor Anterior": "Consultor", "Valor Novo": "Gerente" },
              { "Data/Hora": "25/06/2025 08:55", "Usuário": "Supervisor", "Função": "Supervisor", "Cooperativa": "Central SP", "Módulo": "Comissões", "Operação": "Alterar", "Campo": "Comissão (%)", "Valor Anterior": "6%", "Valor Novo": "8%" },
              { "Data/Hora": "20/06/2025 15:30", "Usuário": "Admin", "Função": "Administrador", "Cooperativa": "Norte PR", "Módulo": "Cooperativas", "Operação": "Alterar", "Campo": "Status", "Valor Anterior": "Ativa", "Valor Novo": "Inativa" },
            ]}
          />
        </div>
      )}

      {subView === 5 && (
        <CrudTable title="Indicações Externas" columns={["Indicante", "Indicado", "Data", "Status", "Comissão"]}
          initialData={toRows(["Indicante", "Indicado", "Data", "Status", "Comissão"], [
            ["Carlos E. Silva", "Marcos Pereira", "10/07/2025", "Convertido", "R$ 50,00"],
            ["Maria F. Oliveira", "Ana Beatriz", "08/07/2025", "Pendente", "-"],
            ["João P. Santos", "Roberto Neto", "05/07/2025", "Convertido", "R$ 50,00"],
          ])}
          fieldOptions={{ Status: ["Pendente", "Convertido", "Cancelado"] }} />
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
        <CrudTable title="Cadastro de Vistoriadores" columns={["Nome", "CPF", "Região", "Vistorias (mês)", "Status"]}
          initialData={toRows(["Nome", "CPF", "Região", "Vistorias (mês)", "Status"], [
            ["Felipe Augusto", "111.222.333-44", "São Paulo", "32", "Ativo"],
            ["Luciana Ribeiro", "222.333.444-55", "Campinas", "28", "Ativo"],
            ["Marcos Oliveira", "333.444.555-66", "Santos", "15", "Ativo"],
            ["Patricia Fernandes", "444.555.666-77", "Ribeirão Preto", "20", "Inativo"],
          ])}
          fieldOptions={{ Status: ["Ativo", "Inativo"] }} />
      )}

      {subView === 1 && <ImagensObrigatorias />}

      {subView === 2 && <CrudTable title="Itens de Vistoria" columns={["Item", "Categoria", "Obrigatório"]}
        initialData={toRows(["Item", "Categoria", "Obrigatório"], [["Rádio / Multimídia", "Eletrônico", "Sim"],["Som / Alto-falantes", "Eletrônico", "Não"],["Retrovisores", "Estrutural", "Sim"],["Acessórios Aftermarket", "Acessório", "Não"],["Estepe", "Segurança", "Sim"],["Triângulo", "Segurança", "Sim"],["Macaco", "Segurança", "Sim"]])}
        fieldOptions={{ Categoria: ["Eletrônico", "Estrutural", "Acessório", "Segurança", "Outro"], Obrigatório: ["Sim", "Não"] }} />}

      {subView === 3 && <CrudTable title="Tipos de Avaria" columns={["Avaria", "Gravidade", "Status"]}
        initialData={toRows(["Avaria", "Gravidade", "Status"], [["Capô amassado", "Média", "Ativo"],["Lanterna queimada", "Leve", "Ativo"],["Para-choque riscado", "Leve", "Ativo"],["Vidro trincado", "Alta", "Ativo"],["Porta amassada", "Média", "Ativo"],["Pintura descascada", "Leve", "Ativo"]])}
        fieldOptions={{ Gravidade: ["Leve", "Média", "Alta", "Crítica"], Status: ["Ativo", "Inativo"] }} />}

      {subView === 4 && <CrudTable title="Marcas de Pneus" columns={["Marca", "País", "Status"]}
        initialData={toRows(["Marca", "País", "Status"], [["Michelin", "França", "Ativo"],["Goodyear", "EUA", "Ativo"],["Pirelli", "Itália", "Ativo"],["Bridgestone", "Japão", "Ativo"],["Continental", "Alemanha", "Ativo"],["Dunlop", "Reino Unido", "Ativo"]])}
        fieldOptions={{ Status: ["Ativo", "Inativo"] }} />}

      {subView === 5 && <CrudTable title="Tipos de Vistoria" columns={["Tipo", "Descrição", "Tempo Estimado"]}
        initialData={toRows(["Tipo", "Descrição", "Tempo Estimado"], [["Leve", "Veículos de passeio até 1.5", "30 min"],["Pesado", "Caminhões e veículos pesados", "60 min"],["Pesado com Agregado", "Pesado com implemento/carroceria", "90 min"],["Moto", "Motocicletas", "20 min"]])} />}

      {subView === 6 && <CrudTable title="Medidas de Pneus" columns={["Medida", "Tipo Veículo", "Status"]}
        initialData={toRows(["Medida", "Tipo Veículo", "Status"], [["175/70 R14", "Passeio", "Ativo"],["185/65 R15", "Passeio", "Ativo"],["195/55 R16", "Passeio", "Ativo"],["205/55 R17", "Passeio/SUV", "Ativo"],["215/65 R16", "SUV", "Ativo"],["265/70 R16", "Caminhonete", "Ativo"],["295/80 R22.5", "Caminhão", "Ativo"]])}
        fieldOptions={{ Status: ["Ativo", "Inativo"] }} />}
    </>
  );
}

function ImagensObrigatorias() {
  const [imagens, setImagens] = useState([
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
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [formNome, setFormNome] = useState("");
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);

  const openNew = () => { setEditIdx(null); setFormNome(""); setModalOpen(true); };
  const openEdit = (i: number) => { setEditIdx(i); setFormNome(imagens[i].nome); setModalOpen(true); };
  const save = () => {
    if (!formNome) { toast.error("Informe o nome da imagem"); return; }
    if (editIdx !== null) {
      setImagens(p => p.map((img, i) => i === editIdx ? { ...img, nome: formNome } : img));
      toast.success("Imagem atualizada!");
    } else {
      setImagens(p => [...p, { nome: formNome, obrigatorio: false }]);
      toast.success("Imagem adicionada!");
    }
    setModalOpen(false);
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Imagens Obrigatórias na Vistoria</CardTitle>
          <CardDescription>Configure quais fotos devem ser exigidas durante a vistoria</CardDescription>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" /> Nova Imagem</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {imagens.map((img, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg border-border">
              <span className="text-sm">{img.nome}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{img.obrigatorio ? "Obrigatória" : "Opcional"}</span>
                <Switch checked={img.obrigatorio} onCheckedChange={() => { setImagens(p => p.map((x, j) => j === i ? { ...x, obrigatorio: !x.obrigatorio } : x)); toast.success("Status atualizado!"); }} />
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEdit(i)}><Edit className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDeleteIdx(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
        <Button className="mt-4 gap-2" onClick={() => toast.success("Configuração salva")}><Save className="h-4 w-4" />Salvar</Button>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editIdx !== null ? "Editar" : "Nova"} Imagem Obrigatória</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nome da Imagem</Label><Input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Ex: Foto Frontal" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteIdx !== null} onOpenChange={o => !o && setDeleteIdx(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Remover esta imagem obrigatória?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIdx(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { setImagens(p => p.filter((_, i) => i !== deleteIdx)); toast.success("Removido!"); setDeleteIdx(null); }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
