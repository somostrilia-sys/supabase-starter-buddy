import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Search, Car, User, Clock, Save, Upload, Check, X,
  Bike, Truck as TruckIcon,
} from "lucide-react";
import { mockVeiculos, checklistLabels, type MockVeiculo } from "./mockVeiculos";

const statusColor: Record<string, string> = {
  Ativo: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  Cancelado: "bg-destructive/10 text-destructive border-destructive/20",
  "Em Vistoria": "bg-amber-500/10 text-amber-600 border-amber-200",
  Suspenso: "bg-muted text-muted-foreground",
};

const tipoIcon = (tipo: string) => {
  if (tipo === "Moto") return Bike;
  if (tipo === "Caminhão") return TruckIcon;
  return Car;
};

export default function ConsultarVeiculo() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MockVeiculo | null>(null);
  const [editForm, setEditForm] = useState<Partial<MockVeiculo>>({});

  const filtered = search.length >= 2
    ? mockVeiculos.filter(v =>
        v.placa.toLowerCase().includes(search.toLowerCase()) ||
        v.chassi.toLowerCase().includes(search.toLowerCase()) ||
        v.associadoNome.toLowerCase().includes(search.toLowerCase()) ||
        v.cooperativa.toLowerCase().includes(search.toLowerCase()) ||
        v.marca.toLowerCase().includes(search.toLowerCase()) ||
        v.modelo.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 15)
    : [];

  const openDetail = (v: MockVeiculo) => {
    setSelected(v);
    setEditForm({ ...v });
  };

  const handleSave = () => {
    toast.success("Veículo atualizado com sucesso!", { description: `${editForm.placa} - Histórico registrado` });
    setSelected(null);
  };

  const vistoriaColor = (r: string) => {
    if (r === "Aprovada") return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    if (r === "Reprovada") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-amber-500/10 text-amber-600 border-amber-200";
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Consultar / Alterar Veículo</h2>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por placa, chassi, associado, cooperativa ou modelo (mín. 2 caracteres)" className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {filtered.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Associado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor FIPE</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(v => {
                    const Icon = tipoIcon(v.tipo);
                    return (
                      <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(v)}>
                        <TableCell className="font-mono font-medium">{v.placa}</TableCell>
                        <TableCell className="text-sm">{v.marca} {v.modelo}</TableCell>
                        <TableCell className="text-sm">{v.ano}/{v.anoModelo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs">{v.tipo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{v.associadoNome}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColor[v.status]}>{v.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">R$ {v.valorFipe.toLocaleString("pt-BR")}</TableCell>
                        <TableCell><Button size="sm" variant="ghost">Detalhe</Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {search.length >= 2 && filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum veículo encontrado.</p>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {selected?.placa} - {selected?.marca} {selected?.modelo}
            </SheetTitle>
          </SheetHeader>

          {selected && (
            <Tabs defaultValue="dados" className="mt-4">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="agregados">Agregados</TabsTrigger>
                <TabsTrigger value="vistorias">Vistorias</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Placa</Label>
                    <Input value={editForm.placa || ""} disabled className="bg-muted font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Chassi</Label>
                    <Input value={editForm.chassi || ""} disabled className="bg-muted font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">RENAVAM</Label>
                    <Input value={editForm.renavam || ""} disabled className="bg-muted font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Motor</Label>
                    <Input value={editForm.motor || ""} className="text-sm" readOnly />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cor</Label>
                    <Select value={editForm.cor} onValueChange={v => setEditForm(p => ({ ...p, cor: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Branco","Prata","Preto","Cinza","Vermelho","Azul","Bege","Marrom"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Combustível</Label>
                    <Input value={editForm.combustivel || ""} className="text-sm" readOnly />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Câmbio</Label>
                    <Input value={editForm.cambio || ""} className="text-sm" readOnly />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">KM</Label>
                    <Input type="number" value={editForm.km || ""} onChange={e => setEditForm(p => ({ ...p, km: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <Input value={editForm.tipo || ""} className="text-sm" readOnly />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Categoria</Label>
                    <Input value={editForm.categoria || ""} className="text-sm" readOnly />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cota</Label>
                    <Input value={editForm.cota || ""} className="text-sm" readOnly />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Valor FIPE</Label>
                    <Input value={`R$ ${(editForm.valorFipe || 0).toLocaleString("pt-BR")}`} className="text-sm" readOnly />
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30">
                  <Label className="text-xs text-muted-foreground mb-1 block">Associado Vinculado</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selected.associadoNome}</p>
                      <p className="text-xs text-muted-foreground">{selected.associadoCpf} • {selected.cooperativa}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="outline" size="sm" className="gap-2"><Upload className="h-3.5 w-3.5" /> Fotos do Veículo</Button>
                </div>
              </TabsContent>

              <TabsContent value="agregados" className="mt-4">
                {selected.agregados.length > 0 ? (
                  <div className="space-y-3">
                    {selected.agregados.map(ag => (
                      <Card key={ag.id}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{ag.nome}</p>
                            <p className="text-xs text-muted-foreground">{ag.cpf} • {ag.parentesco} • CNH: {ag.cnh || "N/A"}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum agregado vinculado.</p>
                )}
              </TabsContent>

              <TabsContent value="vistorias" className="mt-4">
                <div className="space-y-4">
                  {selected.vistorias.map(vist => (
                    <Card key={vist.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{vist.codigo}</p>
                            <p className="text-sm font-medium">{vist.tipo} - {new Date(vist.data).toLocaleDateString("pt-BR")}</p>
                            <p className="text-xs text-muted-foreground">Inspetor: {vist.inspetor}</p>
                          </div>
                          <Badge variant="outline" className={vistoriaColor(vist.resultado)}>{vist.resultado}</Badge>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {checklistLabels.map(item => (
                            <div key={item} className="flex items-center gap-1.5">
                              {vist.checklist[item] ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-destructive" />
                              )}
                              <span className="text-xs">{item}</span>
                            </div>
                          ))}
                        </div>
                        {vist.observacoes && (
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{vist.observacoes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="historico" className="mt-4">
                <div className="space-y-3">
                  {selected.alteracoes.map((alt, i) => (
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
