import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, User, Car, CreditCard, Clock, Save, MessageCircle } from "lucide-react";
import { mockAssociados, type MockAssociado } from "./mockAssociados";

const statusColor: Record<string, string> = {
  ativo: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  inativo: "bg-muted text-muted-foreground",
  suspenso: "bg-amber-500/10 text-amber-600 border-amber-200",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AlterarAssociado() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MockAssociado | null>(null);
  const [editForm, setEditForm] = useState<Partial<MockAssociado>>({});

  const filtered = search.length >= 3
    ? mockAssociados.filter(a =>
        a.nome.toLowerCase().includes(search.toLowerCase()) ||
        a.cpf.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
        a.codigo.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : [];

  const openEdit = (a: MockAssociado) => {
    setSelected(a);
    setEditForm({ ...a });
  };

  const setField = (f: string, v: string) => setEditForm(p => ({ ...p, [f]: v }));

  const handleSave = () => {
    toast.success("Alterações salvas com sucesso!", { description: `${editForm.nome} - Histórico registrado` });
    setSelected(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Alterar Associado</h2>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou código (mín. 3 caracteres)"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(a)}>
                    <TableCell className="font-mono text-xs">{a.codigo}</TableCell>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell className="text-sm">{a.cpf}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[a.status]}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{a.plano}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {search.length >= 3 && filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum associado encontrado.</p>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Editar Associado - {selected?.codigo}
            </SheetTitle>
          </SheetHeader>

          {editForm && (
            <Tabs defaultValue="pessoal" className="mt-4">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                <TabsTrigger value="veiculos">Veículos</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="pessoal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Nome</Label>
                    <Input value={editForm.nome || ""} onChange={e => setField("nome", e.target.value)} />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input value={editForm.cpf || ""} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input value={editForm.rg || ""} onChange={e => setField("rg", e.target.value)} />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={editForm.telefone || ""} onChange={e => setField("telefone", e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={editForm.email || ""} onChange={e => setField("email", e.target.value)} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={v => setField("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Plano</Label>
                    <Select value={editForm.plano} onValueChange={v => setField("plano", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Básico">Básico</SelectItem>
                        <SelectItem value="Intermediário">Intermediário</SelectItem>
                        <SelectItem value="Completo">Completo</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input value={`${editForm.endereco || ""}, ${editForm.bairro || ""} - ${editForm.cidade || ""}/${editForm.estado || ""}`} disabled className="bg-muted" />
                </div>

                {editForm.telefone && (
                  <Button variant="outline" size="sm" className="gap-2 text-emerald-600" asChild>
                    <a href={`https://wa.me/55${(editForm.telefone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" /> Contato via WhatsApp
                    </a>
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="veiculos" className="mt-4">
                <div className="space-y-3">
                  {selected?.veiculos.map((v, i) => (
                    <Card key={i}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{v.modelo} ({v.ano})</p>
                          <p className="text-xs text-muted-foreground font-mono">{v.placa}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!selected?.veiculos || selected.veiculos.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum veículo vinculado.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pagamentos" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref.</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Venc.</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected?.pagamentos.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{p.ref}</TableCell>
                        <TableCell className="text-sm">R$ {p.valor.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{new Date(p.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            p.status === "Pago" ? "bg-emerald-500/10 text-emerald-600" :
                            p.status === "Atrasado" ? "bg-destructive/10 text-destructive" :
                            "bg-amber-500/10 text-amber-600"
                          }>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <div className="space-y-3">
                  {selected?.alteracoes.map((alt, i) => (
                    <div key={i} className="flex gap-3 items-start border-l-2 border-primary/30 pl-3 py-1">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{alt.campo}</p>
                        <p className="text-xs text-muted-foreground">
                          De: <span className="text-destructive">{alt.de}</span> → Para: <span className="text-emerald-600">{alt.para}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alt.data} por {alt.usuario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <div className="pt-4 border-t mt-4">
                <Button onClick={handleSave} className="w-full gap-2">
                  <Save className="h-4 w-4" /> Salvar Alterações
                </Button>
              </div>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
