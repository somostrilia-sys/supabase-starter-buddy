import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Filter, Download, Plus, ChevronLeft, ChevronRight, Car, Bike, Truck,
  User, ExternalLink, Trash2, Calendar,
} from "lucide-react";

const statusMap: Record<string, { label: string; class: string }> = {
  ativo: { label: "Ativo", class: "bg-emerald-500/15 text-emerald-400 border-0" },
  cancelado: { label: "Cancelado", class: "bg-destructive/15 text-destructive border-0" },
  vistoria: { label: "Em Vistoria", class: "bg-warning/80/15 text-amber-400 border-0" },
};
const tipoIcon: Record<string, any> = { "Automóvel": Car, "Moto": Bike, "Caminhão": Truck };

interface Veiculo {
  id: string; placa: string; marca: string; modelo: string; ano: number; cor: string;
  valorFipe: number; associado: string; associadoId: string; status: string; tipo: string;
  dataInclusao: string; chassi: string; renavam: string; motor: string; cambio: string;
  combustivel: string; km: number; estadoCirc: string; cidadeCirc: string;
}

const marcas = ["Chevrolet","Hyundai","VW","Fiat","Toyota","Honda","Renault","Jeep","Nissan","Ford"];
const modelos: Record<string, string[]> = {
  Chevrolet: ["Onix","Tracker","S10","Spin","Cruze"], Hyundai: ["HB20","Creta","Tucson","i30","Santa Fe"],
  VW: ["Gol","T-Cross","Polo","Virtus","Amarok"], Fiat: ["Argo","Mobi","Toro","Pulse","Strada"],
  Toyota: ["Corolla","Hilux","SW4","Yaris","RAV4"], Honda: ["Civic","HR-V","City","Fit","WR-V"],
  Renault: ["Kwid","Duster","Sandero","Captur","Oroch"], Jeep: ["Compass","Renegade","Commander","Gladiator"],
  Nissan: ["Kicks","Versa","Frontier","Sentra"], Ford: ["Ranger","Territory","Bronco","Maverick"],
};
const cores = ["Branco","Prata","Preto","Cinza","Vermelho","Azul","Marrom"];
const assocNomes = [
  "Carlos Silva","Maria Souza","José Santos","Ana Oliveira","Francisco Lima","Antônia Ferreira","João Costa",
  "Rita Pereira","Pedro Almeida","Lúcia Ribeiro","Paulo Cardoso","Sandra Martins","Marcos Dias","Rosângela Nunes",
  "Sebastião Barbosa","Teresa Gomes","Raimundo Araújo","Cláudia Teixeira","Antônio Monteiro","Márcia Castro",
  "Luiz Correia","Sônia Pinto","Fernando Nascimento","Aparecida Mendes","Manoel Rocha","Eliane Moreira",
  "Roberto Vieira","Adriana Campos","Wellington Borges","Patrícia Lopes","Bruno Costa","Camila Rocha",
  "Daniel Santos","Fernanda Alves","Lucas Pereira",
];

const now = Date.now();
const day = 86400000;

function genPlaca(i: number) {
  const l = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return `${l[i%26]}${l[(i*3)%26]}${l[(i*7)%26]}${i%10}${l[(i*11)%26]}${(i*37)%10}${(i*53)%10}`;
}

const mockVeiculos: Veiculo[] = Array.from({ length: 35 }).map((_, i) => {
  const marca = marcas[i % 10];
  const modelo = modelos[marca][i % modelos[marca].length];
  return {
    id: `v${i}`, placa: genPlaca(i), marca, modelo, ano: 2020 + (i % 5), cor: cores[i % 7],
    valorFipe: 45000 + i * 3500, associado: assocNomes[i], associadoId: `a${i}`,
    status: i < 28 ? "ativo" : i < 32 ? "vistoria" : "cancelado",
    tipo: i % 8 === 7 ? "Moto" : i % 12 === 11 ? "Caminhão" : "Automóvel",
    dataInclusao: new Date(now - (i * 15 + 5) * day).toISOString().slice(0, 10),
    chassi: `9BR${String(53000000 + i * 111111).slice(0, 8)}${i}`, renavam: `${String(10000000000 + i * 111111111).slice(0, 11)}`,
    motor: `${["1.0","1.3","1.5","1.8","2.0"][i%5]} ${["Flex","Diesel","Elétrico"][i%3]}`,
    cambio: i % 3 === 0 ? "Manual" : "Automático", combustivel: ["Flex","Gasolina","Diesel","Elétrico"][i%4],
    km: 5000 + i * 3200, estadoCirc: ["SP","RJ","MG"][i%3], cidadeCirc: ["São Paulo","Rio de Janeiro","Belo Horizonte"][i%3],
  };
});

const condutoresMock = [
  { nome: "João Silva", cpf: "123.456.789-00", cnh: "04512345678", parentesco: "Titular" },
  { nome: "Maria Silva", cpf: "987.654.321-00", cnh: "04598765432", parentesco: "Cônjuge" },
];

export default function Veiculos() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState<Veiculo | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return mockVeiculos;
    const s = search.toLowerCase();
    return mockVeiculos.filter(v =>
      v.placa.toLowerCase().includes(s) || v.marca.toLowerCase().includes(s) ||
      v.modelo.toLowerCase().includes(s) || v.associado.toLowerCase().includes(s)
    );
  }, [search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} veículos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Veículo</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por placa, marca, modelo ou associado..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild><Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1"><Label className="text-xs">Tipo</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{["Automóvel","Moto","Caminhão"].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k,v])=><SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Marca</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>{marcas.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Ano</Label>
                <div className="grid grid-cols-2 gap-2"><Input type="number" className="h-9 text-xs" placeholder="Min" /><Input type="number" className="h-9 text-xs" placeholder="Max" /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Valor FIPE (R$)</Label>
                <div className="grid grid-cols-2 gap-2"><Input type="number" className="h-9 text-xs" placeholder="Min" /><Input type="number" className="h-9 text-xs" placeholder="Max" /></div>
              </div>
              <Button className="w-full" onClick={() => setFilterOpen(false)}>Aplicar</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="border border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">
                {["Placa","Tipo","Marca/Modelo","Ano","Cor","Valor FIPE","Associado","Status","Inclusão"].map(h => (
                  <th key={h} className="text-left p-3 text-[10px] font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pageData.map(v => {
                  const Icon = tipoIcon[v.tipo] || Car;
                  return (
                    <tr key={v.id} className="border-b border-border/30 hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setSelected(v)}>
                      <td className="p-3"><Badge variant="secondary" className="text-[10px] font-mono">{v.placa}</Badge></td>
                      <td className="p-3"><Icon className="h-4 w-4 text-muted-foreground" /></td>
                      <td className="p-3 text-xs font-medium">{v.marca} {v.modelo}</td>
                      <td className="p-3 text-xs">{v.ano}</td>
                      <td className="p-3 text-xs">{v.cor}</td>
                      <td className="p-3 text-xs font-mono text-emerald-400">R$ {v.valorFipe.toLocaleString("pt-BR")}</td>
                      <td className="p-3 text-xs text-primary cursor-pointer">{v.associado}</td>
                      <td className="p-3"><Badge className={`text-[9px] ${statusMap[v.status].class}`}>{statusMap[v.status].label}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(v.dataInclusao).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Por página:</span>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{page*perPage+1}-{Math.min((page+1)*perPage,filtered.length)} de {filtered.length}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="w-[460px] overflow-y-auto">
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  {(() => { const I = tipoIcon[selected.tipo] || Car; return <I className="h-8 w-8 text-primary" />; })()}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selected.marca} {selected.modelo} {selected.ano}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">{selected.placa}</Badge>
                    <Badge className={`text-[9px] ${statusMap[selected.status].class}`}>{statusMap[selected.status].label}</Badge>
                  </div>
                </div>
              </div>
              <Separator />

              <Tabs defaultValue="dados">
                <TabsList className="bg-muted/50 w-full">
                  <TabsTrigger value="dados" className="text-xs flex-1">Dados</TabsTrigger>
                  <TabsTrigger value="condutores" className="text-xs flex-1">Condutores</TabsTrigger>
                  <TabsTrigger value="historico" className="text-xs flex-1">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="dados" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Chassi:</span> <span className="font-mono">{selected.chassi}</span></div>
                    <div><span className="text-muted-foreground">Renavam:</span> <span className="font-mono">{selected.renavam}</span></div>
                    <div><span className="text-muted-foreground">Motor:</span> {selected.motor}</div>
                    <div><span className="text-muted-foreground">Câmbio:</span> {selected.cambio}</div>
                    <div><span className="text-muted-foreground">Combustível:</span> {selected.combustivel}</div>
                    <div><span className="text-muted-foreground">KM:</span> {selected.km.toLocaleString("pt-BR")}</div>
                    <div><span className="text-muted-foreground">Cor:</span> {selected.cor}</div>
                    <div><span className="text-muted-foreground">Valor FIPE:</span> <span className="font-mono text-emerald-400">R$ {selected.valorFipe.toLocaleString("pt-BR")}</span></div>
                    <div><span className="text-muted-foreground">Circulação:</span> {selected.cidadeCirc}/{selected.estadoCirc}</div>
                    <div><span className="text-muted-foreground">Inclusão:</span> {new Date(selected.dataInclusao).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Associado</p>
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-card text-xs">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">{selected.associado}</span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] ml-auto"><ExternalLink className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="condutores" className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{condutoresMock.length} condutores</p>
                    <Button size="sm" variant="outline" className="text-xs h-7"><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
                  </div>
                  {condutoresMock.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/40 bg-card space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{c.nome}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[8px]">{c.parentesco}</Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                        <span>CPF: {c.cpf}</span>
                        <span>CNH: {c.cnh}</span>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="historico" className="space-y-2 mt-3">
                  {[
                    { data: "01/03/2026", desc: "Vistoria aprovada", tipo: "vistoria" },
                    { data: "15/02/2026", desc: "Vistoria agendada", tipo: "vistoria" },
                    { data: "10/01/2026", desc: "Veículo incluído no sistema", tipo: "sistema" },
                  ].map((h, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 text-xs border-l-2 border-primary/30 pl-3">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{h.desc}</p>
                        <p className="text-[10px] text-muted-foreground">{h.data}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
