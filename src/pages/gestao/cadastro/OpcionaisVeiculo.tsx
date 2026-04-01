import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Car, Layers, DollarSign } from "lucide-react";

// Types
interface TipoVeiculo { id: string; nome: string; ativo: boolean; }
interface CategoriaVeiculo { id: string; nome: string; ativo: boolean; }
interface CotaVeiculo { id: string; nome: string; faixaMin: number; faixaMax: number; valor: number; ativo: boolean; }

// opcionais_veiculos table: CRUD connected via Supabase
// Tipos and Categorias are managed locally until tables are created
const initialTipos: TipoVeiculo[] = [];
const initialCategorias: CategoriaVeiculo[] = [];
const initialCotas: CotaVeiculo[] = [];

export default function OpcionaisVeiculo() {
  const [tipos, setTipos] = useState(initialTipos);
  const [categorias, setCategorias] = useState(initialCategorias);
  const [cotas, setCotas] = useState(initialCotas);

  // Simple item modal
  const [itemModal, setItemModal] = useState<{ open: boolean; type: "tipo" | "categoria"; editId: string | null }>({ open: false, type: "tipo", editId: null });
  const [itemName, setItemName] = useState("");

  // Cota modal
  const [cotaModal, setCotaModal] = useState(false);
  const [cotaEditId, setCotaEditId] = useState<string | null>(null);
  const [cotaForm, setCotaForm] = useState({ nome: "", faixaMin: 0, faixaMax: 0, valor: 0 });

  const openItemNew = (type: "tipo" | "categoria") => { setItemModal({ open: true, type, editId: null }); setItemName(""); };
  const openItemEdit = (type: "tipo" | "categoria", id: string, nome: string) => { setItemModal({ open: true, type, editId: id }); setItemName(nome); };

  const saveItem = () => {
    if (!itemName) return;
    if (itemModal.type === "tipo") {
      if (itemModal.editId) setTipos(p => p.map(t => t.id === itemModal.editId ? { ...t, nome: itemName } : t));
      else setTipos(p => [...p, { id: `tv${Date.now()}`, nome: itemName, ativo: true }]);
    } else {
      if (itemModal.editId) setCategorias(p => p.map(c => c.id === itemModal.editId ? { ...c, nome: itemName } : c));
      else setCategorias(p => [...p, { id: `cv${Date.now()}`, nome: itemName, ativo: true }]);
    }
    toast.success(itemModal.editId ? "Atualizado!" : "Cadastrado!");
    setItemModal({ open: false, type: "tipo", editId: null });
  };

  const openCotaNew = () => { setCotaEditId(null); setCotaForm({ nome: "", faixaMin: 0, faixaMax: 0, valor: 0 }); setCotaModal(true); };
  const openCotaEdit = (c: CotaVeiculo) => { setCotaEditId(c.id); setCotaForm({ nome: c.nome, faixaMin: c.faixaMin, faixaMax: c.faixaMax, valor: c.valor }); setCotaModal(true); };

  const saveCota = () => {
    if (!cotaForm.nome) return;
    if (cotaEditId) {
      setCotas(p => p.map(c => c.id === cotaEditId ? { ...c, ...cotaForm } : c));
      toast.success("Cota atualizada!");
    } else {
      setCotas(p => [...p, { id: `cq${Date.now()}`, ...cotaForm, ativo: true }]);
      toast.success("Cota cadastrada!");
    }
    setCotaModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Opcionais do Veículo</h2>

      <Tabs defaultValue="tipos">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="tipos" className="gap-1.5"><Car className="h-3.5 w-3.5" /> Tipos</TabsTrigger>
          <TabsTrigger value="categorias" className="gap-1.5"><Layers className="h-3.5 w-3.5" /> Categorias</TabsTrigger>
          <TabsTrigger value="cotas" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Cotas</TabsTrigger>
        </TabsList>

        {/* Tipos */}
        <TabsContent value="tipos">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Tipos de Veículo</CardTitle>
              <Button size="sm" onClick={() => openItemNew("tipo")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {tipos.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/30">
                  <Checkbox checked={t.ativo} onCheckedChange={() => { setTipos(p => p.map(x => x.id === t.id ? { ...x, ativo: !x.ativo } : x)); toast.success("Status atualizado!"); }} />
                  <span className={`text-sm flex-1 ${!t.ativo ? "text-muted-foreground line-through" : "font-medium"}`}>{t.nome}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemEdit("tipo", t.id, t.nome)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setTipos(p => p.filter(x => x.id !== t.id)); toast.success("Removido!"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categorias">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Categorias de Veículo</CardTitle>
              <Button size="sm" onClick={() => openItemNew("categoria")} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {categorias.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/30">
                  <Checkbox checked={c.ativo} onCheckedChange={() => { setCategorias(p => p.map(x => x.id === c.id ? { ...x, ativo: !x.ativo } : x)); toast.success("Status atualizado!"); }} />
                  <span className={`text-sm flex-1 ${!c.ativo ? "text-muted-foreground line-through" : "font-medium"}`}>{c.nome}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openItemEdit("categoria", c.id, c.nome)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setCategorias(p => p.filter(x => x.id !== c.id)); toast.success("Removido!"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cotas */}
        <TabsContent value="cotas">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Faixas de valor FIPE que definem a precificação</p>
            <Button size="sm" onClick={openCotaNew} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Nova Cota</Button>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Faixa Mínima</TableHead>
                    <TableHead>Faixa Máxima</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotas.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.nome}</TableCell>
                      <TableCell className="font-mono text-sm">R$ {c.faixaMin.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-mono text-sm">R$ {c.faixaMax.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold">R$ {c.valor.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={c.ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}>
                          {c.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCotaEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setCotas(p => p.filter(x => x.id !== c.id)); toast.success("Removido!"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Simple Item Modal */}
      <Dialog open={itemModal.open} onOpenChange={o => !o && setItemModal(p => ({ ...p, open: false }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>{itemModal.editId ? "Editar" : "Novo"} {itemModal.type === "tipo" ? "Tipo de Veículo" : "Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={itemName} onChange={e => setItemName(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setItemModal(p => ({ ...p, open: false }))}>Cancelar</Button>
              <Button onClick={saveItem}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cota Modal */}
      <Dialog open={cotaModal} onOpenChange={setCotaModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{cotaEditId ? "Editar Cota" : "Nova Cota"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={cotaForm.nome} onChange={e => setCotaForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Cota A" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Faixa Mín (R$)</Label><Input type="number" value={cotaForm.faixaMin} onChange={e => setCotaForm(p => ({ ...p, faixaMin: Number(e.target.value) }))} /></div>
              <div><Label>Faixa Máx (R$)</Label><Input type="number" value={cotaForm.faixaMax} onChange={e => setCotaForm(p => ({ ...p, faixaMax: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Valor Mensal (R$)</Label><Input type="number" step="0.01" value={cotaForm.valor} onChange={e => setCotaForm(p => ({ ...p, valor: Number(e.target.value) }))} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCotaModal(false)}>Cancelar</Button>
              <Button onClick={saveCota}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
