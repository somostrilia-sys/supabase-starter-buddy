import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Filter, Plus, ChevronLeft, ChevronRight,
  Clock, Calendar, User, Car, MapPin, ImageIcon,
} from "lucide-react";

const statusMap: Record<string, { label: string; class: string }> = {
  agendada: { label: "Agendada", class: "bg-sky-500/15 text-sky-400 border-0" },
  realizada: { label: "Realizada", class: "bg-amber-500/15 text-amber-400 border-0" },
  aprovada: { label: "Aprovada", class: "bg-emerald-500/15 text-emerald-400 border-0" },
  reprovada: { label: "Reprovada", class: "bg-destructive/15 text-destructive border-0" },
};

const tipoMap: Record<string, string> = { admissao: "Admissão", periodica: "Periódica", transferencia: "Transferência" };

interface Vistoria {
  id: string; codigo: string; associado: string; placa: string; veiculo: string;
  inspetor: string; dataAgendada: string; status: string; tipo: string; local: string;
}

const inspetores = ["Carlos Vistoriador","Ana Inspetora","Roberto Laudo","Fernanda Check","Paulo Técnico"];
const assocNomes = ["Carlos Silva","Maria Souza","José Santos","Ana Oliveira","Francisco Lima","João Costa","Rita Pereira","Pedro Almeida","Lúcia Ribeiro","Paulo Cardoso","Sandra Martins","Marcos Dias","Rosângela Nunes","Sebastião Barbosa","Teresa Gomes"];
const veiculos = ["Honda Civic 2024","VW Gol 2022","Fiat Argo 2023","Hyundai HB20 2023","Toyota Hilux 2024","Chevrolet Onix 2024","Renault Kwid 2023","Jeep Compass 2024","Honda HR-V 2023","VW T-Cross 2024","Nissan Kicks 2024","Toyota Corolla 2023","Fiat Toro 2024","Hyundai Creta 2024","Chevrolet Tracker 2024"];
const now = Date.now();
const day = 86400000;

function genPlaca(i: number) { const l = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; return `${l[i%26]}${l[(i*3)%26]}${l[(i*7)%26]}${i%10}${l[(i*11)%26]}${(i*37)%10}${(i*53)%10}`; }

const mockVistorias: Vistoria[] = Array.from({ length: 15 }).map((_, i) => ({
  id: `vi${i}`, codigo: `VIST-${String(1000+i).padStart(4,"0")}`, associado: assocNomes[i],
  placa: genPlaca(i), veiculo: veiculos[i], inspetor: inspetores[i % 5],
  dataAgendada: new Date(now + (i - 7) * day).toISOString().slice(0, 10),
  status: i < 4 ? "agendada" : i < 8 ? "realizada" : i < 12 ? "aprovada" : "reprovada",
  tipo: ["admissao","periodica","transferencia"][i % 3],
  local: ["Filial Centro","Filial Zona Sul","Domicílio","Filial Norte","Parceiro ABC"][i % 5],
}));

const checklist = ["Lanternas dianteiras","Lanternas traseiras","Pneus (4)","Estepe","Macaco","Triângulo","Extintor","Vidros","Pintura","Para-choques","Retrovisores","Bancos"];

export default function Vistorias() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vistoria | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = useMemo(() => {
    if (!search) return mockVistorias;
    const s = search.toLowerCase();
    return mockVistorias.filter(v => v.codigo.toLowerCase().includes(s) || v.associado.toLowerCase().includes(s) || v.placa.toLowerCase().includes(s));
  }, [search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vistorias</h1>
          <p className="text-sm text-muted-foreground">{mockVistorias.length} vistorias · {mockVistorias.filter(v=>v.status==="agendada").length} agendadas</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Vistoria</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, associado ou placa..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} className="pl-9" />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild><Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Inspetor</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{inspetores.map(i=><SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{Object.entries(tipoMap).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Período</Label>
                <div className="grid grid-cols-2 gap-2"><Input type="date" className="h-9 text-xs" /><Input type="date" className="h-9 text-xs" /></div>
              </div>
              <Button className="w-full" onClick={()=>setFilterOpen(false)}>Aplicar</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                {["Código","Associado","Veículo","Inspetor","Data","Tipo","Status"].map(h=>(
                  <th key={h} className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pageData.map(v=>(
                  <tr key={v.id} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors" onClick={()=>setSelected(v)}>
                    <td className="p-3 text-xs font-mono text-primary">{v.codigo}</td>
                    <td className="p-3 text-xs font-medium">{v.associado}</td>
                    <td className="p-3 text-xs"><Badge variant="secondary" className="font-mono text-[9px]">{v.placa}</Badge> <span className="text-muted-foreground">{v.veiculo}</span></td>
                    <td className="p-3 text-xs">{v.inspetor}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(v.dataAgendada).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[9px]">{tipoMap[v.tipo]}</Badge></td>
                    <td className="p-3"><Badge className={`text-[9px] ${statusMap[v.status].class}`}>{statusMap[v.status].label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{page*perPage+1}-{Math.min((page+1)*perPage,filtered.length)} de {filtered.length}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={o=>!o&&setSelected(null)}>
        <SheetContent className="w-[460px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div>
                <h3 className="font-bold text-lg">{selected.codigo}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{tipoMap[selected.tipo]}</Badge>
                  <Badge className={`text-[9px] ${statusMap[selected.status].class}`}>{statusMap[selected.status].label}</Badge>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Associado:</span> {selected.associado}</div>
                <div className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Veículo:</span> {selected.veiculo}</div>
                <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Inspetor:</span> {selected.inspetor}</div>
                <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Data:</span> {new Date(selected.dataAgendada).toLocaleDateString("pt-BR")}</div>
                <div className="flex items-center gap-1.5 col-span-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Local:</span> {selected.local}</div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Checklist de Itens</p>
                <div className="grid grid-cols-2 gap-2">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Checkbox defaultChecked={i < 9} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Fotos</p>
                <div className="grid grid-cols-3 gap-2">
                  {["Dianteira","Traseira","Lateral E.","Lateral D.","Motor","Painel"].map((f, i) => (
                    <div key={i} className="aspect-square rounded-lg border border-border/40 bg-muted/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 transition-colors">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      <span className="text-[9px] text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2">Observações</p>
                <Textarea className="text-xs" placeholder="Observações do inspetor..." rows={3} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
