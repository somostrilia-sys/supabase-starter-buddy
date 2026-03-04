import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Building2, Users, Car, MapPin, Phone, Mail, Edit, Trash2,
} from "lucide-react";

interface Cooperativa {
  id: string; nome: string; razaoSocial: string; cnpj: string; ie: string;
  cidade: string; estado: string; endereco: string; telefone: string; email: string;
  responsavel: string; ativo: boolean; associados: number; veiculos: number; regionais: string[];
}

const mockCoops: Cooperativa[] = [
  { id: "co1", nome: "Cooperativa Central SP", razaoSocial: "Coop Central de Proteção Veicular de São Paulo Ltda", cnpj: "12.345.678/0001-90", ie: "123.456.789.000", cidade: "São Paulo", estado: "SP", endereco: "Av. Paulista, 1000 - Bela Vista", telefone: "(11) 3333-4444", email: "contato@coopcentral-sp.com.br", responsavel: "Dr. Carlos Eduardo", ativo: true, associados: 1250, veiculos: 1890, regionais: ["Capital","Interior SP","Litoral SP"] },
  { id: "co2", nome: "Cooperativa Central RJ", razaoSocial: "Coop Central de Proteção Veicular do Rio de Janeiro Ltda", cnpj: "98.765.432/0001-10", ie: "987.654.321.000", cidade: "Rio de Janeiro", estado: "RJ", endereco: "Av. Rio Branco, 500 - Centro", telefone: "(21) 2222-3333", email: "contato@coopcentral-rj.com.br", responsavel: "Dra. Fernanda Lima", ativo: true, associados: 980, veiculos: 1450, regionais: ["Capital RJ","Baixada","Região Serrana"] },
  { id: "co3", nome: "Cooperativa Minas Proteção", razaoSocial: "Cooperativa Mineira de Proteção Veicular Ltda", cnpj: "45.678.901/0001-23", ie: "456.789.012.000", cidade: "Belo Horizonte", estado: "MG", endereco: "Rua da Bahia, 300 - Centro", telefone: "(31) 3111-2222", email: "contato@minasprotecao.com.br", responsavel: "Dr. Roberto Mendes", ativo: true, associados: 750, veiculos: 1100, regionais: ["BH","Interior MG"] },
  { id: "co4", nome: "Cooperativa Sul Proteção", razaoSocial: "Cooperativa Sul de Proteção Veicular Ltda", cnpj: "78.901.234/0001-56", ie: "789.012.345.000", cidade: "Curitiba", estado: "PR", endereco: "Rua XV de Novembro, 700 - Centro", telefone: "(41) 3444-5555", email: "contato@sulprotecao.com.br", responsavel: "Dr. Paulo Araújo", ativo: true, associados: 520, veiculos: 780, regionais: ["Curitiba","Interior PR"] },
  { id: "co5", nome: "Cooperativa Nordeste Veicular", razaoSocial: "Cooperativa Nordestina de Proteção Veicular Ltda", cnpj: "23.456.789/0001-01", ie: "", cidade: "Recife", estado: "PE", endereco: "Av. Boa Viagem, 1500 - Boa Viagem", telefone: "(81) 3555-6666", email: "contato@neveicular.com.br", responsavel: "Dra. Ana Cristina", ativo: false, associados: 180, veiculos: 250, regionais: ["Recife"] },
];

export default function Cooperativas() {
  const [selected, setSelected] = useState<Cooperativa | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cooperativas</h1>
          <p className="text-sm text-muted-foreground">{mockCoops.length} cooperativas · {mockCoops.filter(c=>c.ativo).length} ativas</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Cooperativa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Cooperativa</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1"><Label className="text-xs">Razão Social</Label><Input className="h-9 text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">CNPJ</Label><Input className="h-9 text-xs" placeholder="00.000.000/0000-00" /></div>
                <div className="space-y-1"><Label className="text-xs">IE</Label><Input className="h-9 text-xs" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2"><Label className="text-xs">Cidade</Label><Input className="h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">UF</Label><Input className="h-9 text-xs" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input className="h-9 text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Telefone</Label><Input className="h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-9 text-xs" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Responsável</Label><Input className="h-9 text-xs" /></div>
              <Button className="w-full" onClick={()=>setModalOpen(false)}>Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCoops.map(c => (
          <Card key={c.id} className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(c)}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-bold">{c.nome}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.cnpj}</p>
                  </div>
                </div>
                <Badge className={`text-[9px] border-0 ${c.ativo ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{c.ativo ? "Ativa" : "Inativa"}</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{c.cidade}/{c.estado}</div>
              <Separator />
              <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-bold">{c.associados}</span> <span className="text-muted-foreground">associados</span></div>
                <div className="flex items-center gap-1"><Car className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-bold">{c.veiculos}</span> <span className="text-muted-foreground">veículos</span></div>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.regionais.map(r => <Badge key={r} variant="secondary" className="text-[8px]">{r}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={o=>!o&&setSelected(null)}>
        <SheetContent className="w-[420px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10"><Building2 className="h-8 w-8 text-primary" /></div>
                <div>
                  <h3 className="font-bold text-lg">{selected.nome}</h3>
                  <Badge className={`text-[9px] border-0 ${selected.ativo ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>{selected.ativo ? "Ativa" : "Inativa"}</Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs">
                <div><span className="text-muted-foreground">Razão Social:</span> {selected.razaoSocial}</div>
                <div><span className="text-muted-foreground">CNPJ:</span> <span className="font-mono">{selected.cnpj}</span></div>
                {selected.ie && <div><span className="text-muted-foreground">IE:</span> <span className="font-mono">{selected.ie}</span></div>}
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{selected.endereco} - {selected.cidade}/{selected.estado}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selected.telefone}</div>
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selected.email}</div>
                <div><span className="text-muted-foreground">Responsável:</span> {selected.responsavel}</div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Estatísticas</p>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border border-border/40"><CardContent className="p-3 text-center"><p className="text-xl font-bold">{selected.associados}</p><p className="text-[10px] text-muted-foreground">Associados</p></CardContent></Card>
                  <Card className="border border-border/40"><CardContent className="p-3 text-center"><p className="text-xl font-bold">{selected.veiculos}</p><p className="text-[10px] text-muted-foreground">Veículos</p></CardContent></Card>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Regionais ({selected.regionais.length})</p>
                {selected.regionais.map(r => (
                  <div key={r} className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-card text-xs mb-1.5">
                    <span className="font-medium">{r}</span>
                  </div>
                ))}
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
