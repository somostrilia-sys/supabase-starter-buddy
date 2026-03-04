import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Plus, MapPin, Users, Building2, Edit, Trash2, Phone, Mail } from "lucide-react";

interface Regional {
  id: string; nome: string; cooperativa: string; responsavel: string; telefone: string;
  email: string; cidade: string; estado: string; associados: number; ativo: boolean;
}

const mockRegionais: Regional[] = [
  { id: "r1", nome: "Capital SP", cooperativa: "Cooperativa Central SP", responsavel: "Maria Santos", telefone: "(11) 98888-1111", email: "capital@coopsp.com.br", cidade: "São Paulo", estado: "SP", associados: 580, ativo: true },
  { id: "r2", nome: "Interior SP", cooperativa: "Cooperativa Central SP", responsavel: "João Pedro", telefone: "(19) 98888-2222", email: "interior@coopsp.com.br", cidade: "Campinas", estado: "SP", associados: 420, ativo: true },
  { id: "r3", nome: "Litoral SP", cooperativa: "Cooperativa Central SP", responsavel: "Ana Costa", telefone: "(13) 98888-3333", email: "litoral@coopsp.com.br", cidade: "Santos", estado: "SP", associados: 250, ativo: true },
  { id: "r4", nome: "Capital RJ", cooperativa: "Cooperativa Central RJ", responsavel: "Carlos Lima", telefone: "(21) 98888-4444", email: "capital@cooprj.com.br", cidade: "Rio de Janeiro", estado: "RJ", associados: 490, ativo: true },
  { id: "r5", nome: "Baixada Fluminense", cooperativa: "Cooperativa Central RJ", responsavel: "Fernanda Alves", telefone: "(21) 98888-5555", email: "baixada@cooprj.com.br", cidade: "Nova Iguaçu", estado: "RJ", associados: 310, ativo: true },
  { id: "r6", nome: "Região Serrana", cooperativa: "Cooperativa Central RJ", responsavel: "Roberto Souza", telefone: "(24) 98888-6666", email: "serrana@cooprj.com.br", cidade: "Petrópolis", estado: "RJ", associados: 180, ativo: true },
  { id: "r7", nome: "BH e Região", cooperativa: "Cooperativa Minas Proteção", responsavel: "Juliana Mendes", telefone: "(31) 98888-7777", email: "bh@minasprot.com.br", cidade: "Belo Horizonte", estado: "MG", associados: 520, ativo: true },
  { id: "r8", nome: "Interior MG", cooperativa: "Cooperativa Minas Proteção", responsavel: "Ricardo Barbosa", telefone: "(34) 98888-8888", email: "interior@minasprot.com.br", cidade: "Uberlândia", estado: "MG", associados: 230, ativo: false },
];

const cooperativas = ["Cooperativa Central SP", "Cooperativa Central RJ", "Cooperativa Minas Proteção", "Cooperativa Sul Proteção"];

export default function Regionais() {
  const [selected, setSelected] = useState<Regional | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const byCooperativa = cooperativas.filter(c => mockRegionais.some(r => r.cooperativa === c));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regionais</h1>
          <p className="text-sm text-muted-foreground">{mockRegionais.length} regionais · {mockRegionais.reduce((s,r)=>s+r.associados,0)} associados</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Regional</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Regional</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label className="text-xs">Nome</Label><Input className="h-9 text-xs" placeholder="Nome da regional" /></div>
              <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{cooperativas.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2"><Label className="text-xs">Cidade</Label><Input className="h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">UF</Label><Input className="h-9 text-xs" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Responsável</Label><Input className="h-9 text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Telefone</Label><Input className="h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-9 text-xs" /></div>
              </div>
              <Button className="w-full" onClick={()=>setModalOpen(false)}>Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {byCooperativa.map(coop => (
        <div key={coop} className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold">{coop}</h2>
            <Badge variant="secondary" className="text-[9px]">{mockRegionais.filter(r=>r.cooperativa===coop).length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mockRegionais.filter(r=>r.cooperativa===coop).map(r => (
              <Card key={r.id} className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(r)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{r.nome}</p>
                    <Badge className={`text-[9px] border-0 ${r.ativo ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{r.ativo ? "Ativa" : "Inativa"}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{r.cidade}/{r.estado}</div>
                  <div className="flex items-center gap-1 text-xs"><Users className="h-3 w-3 text-muted-foreground" /><span className="font-bold">{r.associados}</span> associados</div>
                  <div className="text-[10px] text-muted-foreground">Resp: {r.responsavel}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Sheet open={!!selected} onOpenChange={o=>!o&&setSelected(null)}>
        <SheetContent className="w-[380px]">
          {selected && (
            <div className="space-y-4 mt-4">
              <h3 className="font-bold text-lg">{selected.nome}</h3>
              <Badge className={`text-[9px] border-0 ${selected.ativo ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{selected.ativo ? "Ativa" : "Inativa"}</Badge>
              <Separator />
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{selected.cooperativa}</div>
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{selected.cidade}/{selected.estado}</div>
                <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" />{selected.associados} associados</div>
                <div><span className="text-muted-foreground">Responsável:</span> {selected.responsavel}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selected.telefone}</div>
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selected.email}</div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" size="sm"><Edit className="h-3.5 w-3.5 mr-1" /> Editar</Button>
                <Button variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
