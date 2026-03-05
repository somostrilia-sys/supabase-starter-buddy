import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2 } from "lucide-react";

const mockPlanos = [
  { id: 1, nome: "Básico", descricao: "Proteção essencial contra roubo e furto", status: "Ativo", regionais: "SP Capital, Interior SP", mensalidade: "89,90", adesao: "299,90" },
  { id: 2, nome: "Intermediário", descricao: "Proteção ampliada com colisão e incêndio", status: "Ativo", regionais: "SP Capital, Sul, Nordeste", mensalidade: "149,90", adesao: "399,90" },
  { id: 3, nome: "Premium", descricao: "Cobertura total com todos os serviços", status: "Ativo", regionais: "Todas", mensalidade: "249,90", adesao: "599,90" },
  { id: 4, nome: "Executivo", descricao: "Para veículos de alto valor com assistência premium", status: "Ativo", regionais: "SP Capital", mensalidade: "349,90", adesao: "799,90" },
  { id: 5, nome: "Empresarial", descricao: "Plano corporativo para frotas", status: "Inativo", regionais: "SP Capital, Interior SP", mensalidade: "199,90", adesao: "499,90" },
];

const coberturas = ["Roubo/Furto", "Colisão", "Incêndio", "Fenômenos Naturais", "Vidros", "Terceiros"];
const servicos = ["Guincho", "Carro Reserva", "Assistência 24h"];
const regionaisOpcoes = ["SP Capital", "Interior SP", "Regional Sul", "Regional Nordeste", "Regional Norte", "Regional Centro-Oeste"];

export default function PlanosTab() {
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [coberturasSelec, setCoberturasSelec] = useState<string[]>([]);
  const [servicosSelec, setServicosSelec] = useState<string[]>([]);
  const [mensalidade, setMensalidade] = useState("");
  const [adesao, setAdesao] = useState("");
  const [valorRastreador, setValorRastreador] = useState("");
  const [nuncaCobrarRastreador, setNuncaCobrarRastreador] = useState(false);
  const [valorAcrescido, setValorAcrescido] = useState("");
  const [regionaisSelec, setRegionaisSelec] = useState<string[]>([]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const openModal = () => {
    setNome(""); setDescricao(""); setCoberturasSelec([]); setServicosSelec([]);
    setMensalidade(""); setAdesao(""); setValorRastreador(""); setNuncaCobrarRastreador(false);
    setValorAcrescido(""); setRegionaisSelec([]);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planos</h3>
          <p className="text-sm text-muted-foreground">Gerencie os planos de proteção veicular</p>
        </div>
        <Button onClick={openModal} className="gap-2"><Plus className="h-4 w-4" /> Novo Plano</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Regionais</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Adesão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPlanos.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{p.descricao}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Ativo" ? "default" : "secondary"} className={p.status === "Ativo" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : ""}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{p.regionais}</TableCell>
                  <TableCell>R$ {p.mensalidade}</TableCell>
                  <TableCell>R$ {p.adesao}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Plano</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Plano</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Premium Plus" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva o plano..." />
            </div>
            <div>
              <Label className="mb-2 block">Coberturas</Label>
              <div className="grid grid-cols-2 gap-2">
                {coberturas.map(c => (
                  <div key={c} className="flex items-center gap-2">
                    <Checkbox checked={coberturasSelec.includes(c)} onCheckedChange={() => toggle(coberturasSelec, setCoberturasSelec, c)} />
                    <span className="text-sm">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Serviços Opcionais</Label>
              <div className="grid grid-cols-2 gap-2">
                {servicos.map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <Checkbox checked={servicosSelec.includes(s)} onCheckedChange={() => toggle(servicosSelec, setServicosSelec, s)} />
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Mensalidade Base (R$)</Label><Input value={mensalidade} onChange={e => setMensalidade(e.target.value)} placeholder="0,00" /></div>
              <div><Label>Adesão (R$)</Label><Input value={adesao} onChange={e => setAdesao(e.target.value)} placeholder="0,00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor Rastreador (R$)</Label><Input value={valorRastreador} onChange={e => setValorRastreador(e.target.value)} placeholder="0,00" /></div>
              <div><Label>Valor Acrescido (R$)</Label><Input value={valorAcrescido} onChange={e => setValorAcrescido(e.target.value)} placeholder="0,00" /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={nuncaCobrarRastreador} onCheckedChange={setNuncaCobrarRastreador} />
              <Label>Nunca cobrar rastreador</Label>
            </div>
            <div>
              <Label className="mb-2 block">Regionais Vinculadas</Label>
              <div className="grid grid-cols-2 gap-2">
                {regionaisOpcoes.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox checked={regionaisSelec.includes(r)} onCheckedChange={() => toggle(regionaisSelec, setRegionaisSelec, r)} />
                    <span className="text-sm">{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={() => setShowModal(false)}>Salvar Plano</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
