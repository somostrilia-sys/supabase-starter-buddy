import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Shield, Plus, Pencil, CheckCircle2, Filter, Car, Truck, Bike, Bus,
} from "lucide-react";

type CategoriaVeiculo = "Leves" | "Pesados" | "Motos" | "Vans";

interface Cobertura {
  id: string;
  nome: string;
  grupo: string;
  valorBase: number;
}

interface PlanoProtecao {
  id: string;
  nome: string;
  descricao: string;
  descricaoAdmin: string;
  valorBase: number;
  ativo: boolean;
  coberturas: Cobertura[];
  regionais: string[];
  categorias: CategoriaVeiculo[];
  regrasEspeciais: string;
  icone: string;
}

const todasCoberturas: Cobertura[] = [
  { id: "c1", nome: "Proteção Roubo/Furto", grupo: "Proteção", valorBase: 45 },
  { id: "c2", nome: "Proteção Colisão", grupo: "Proteção", valorBase: 55 },
  { id: "c3", nome: "Proteção Incêndio", grupo: "Proteção", valorBase: 25 },
  { id: "c4", nome: "Proteção Enchente/Alagamento", grupo: "Proteção", valorBase: 20 },
  { id: "c5", nome: "Proteção Terceiros", grupo: "Proteção", valorBase: 35 },
  { id: "c6", nome: "Vidros", grupo: "Proteção", valorBase: 18 },
  { id: "c7", nome: "Assistência 24h", grupo: "Assistência", valorBase: 29.9 },
  { id: "c8", nome: "Guincho 200km", grupo: "Assistência", valorBase: 19.9 },
  { id: "c9", nome: "Carro Reserva 7 dias", grupo: "Benefício", valorBase: 35 },
  { id: "c10", nome: "Rastreador Veicular", grupo: "Rastreador", valorBase: 59.9 },
  { id: "c11", nome: "APP (Acidentes Pessoais)", grupo: "Proteção", valorBase: 15 },
  { id: "c12", nome: "Assistência Residencial", grupo: "Assistência", valorBase: 12 },
];

const todasRegionais = ["Sul", "Norte", "Sudeste", "Nordeste", "Centro-Oeste"];
const todasCategorias: CategoriaVeiculo[] = ["Leves", "Pesados", "Motos", "Vans"];

const categoriaIcons: Record<CategoriaVeiculo, typeof Car> = {
  Leves: Car, Pesados: Truck, Motos: Bike, Vans: Bus,
};

const mockPlanos: PlanoProtecao[] = [
  {
    id: "p1", nome: "Premium", descricao: "Cobertura total com todos os benefícios premium.",
    descricaoAdmin: "Plano top de linha, nunca conceder desconto sem aprovação gerencial.",
    valorBase: 249.9, ativo: true,
    coberturas: todasCoberturas,
    regionais: ["Sul", "Sudeste", "Centro-Oeste"],
    categorias: ["Leves", "Vans"],
    regrasEspeciais: "Nunca cobrar rastreador separadamente neste plano.",
    icone: "🏆",
  },
  {
    id: "p2", nome: "Completo", descricao: "Proteção completa com assistência e benefícios.",
    descricaoAdmin: "Plano principal de vendas, margem de 22%.",
    valorBase: 189.9, ativo: true,
    coberturas: todasCoberturas.filter(c => !["c10", "c12"].includes(c.id)),
    regionais: todasRegionais,
    categorias: ["Leves", "Pesados", "Vans"],
    regrasEspeciais: "",
    icone: "⭐",
  },
  {
    id: "p3", nome: "Básico", descricao: "Proteção essencial com as principais coberturas.",
    descricaoAdmin: "Plano de entrada. Foco em volume.",
    valorBase: 89.9, ativo: true,
    coberturas: todasCoberturas.filter(c => ["c1", "c2", "c7"].includes(c.id)),
    regionais: todasRegionais,
    categorias: todasCategorias,
    regrasEspeciais: "",
    icone: "🛡️",
  },
  {
    id: "p4", nome: "Objetivo Leve", descricao: "Plano econômico para veículos leves.",
    descricaoAdmin: "Exclusivo para veículos com FIPE até R$80.000.",
    valorBase: 119.9, ativo: true,
    coberturas: todasCoberturas.filter(c => ["c1", "c2", "c3", "c5", "c7", "c8"].includes(c.id)),
    regionais: ["Sul", "Sudeste"],
    categorias: ["Leves"],
    regrasEspeciais: "Restrito a veículos com FIPE até R$ 80.000.",
    icone: "🚗",
  },
  {
    id: "p5", nome: "Objetivo Sul", descricao: "Plano exclusivo para a regional Sul.",
    descricaoAdmin: "Condições especiais negociadas com cooperativas do Sul.",
    valorBase: 139.9, ativo: true,
    coberturas: todasCoberturas.filter(c => ["c1", "c2", "c3", "c4", "c5", "c7", "c8", "c9"].includes(c.id)),
    regionais: ["Sul"],
    categorias: ["Leves", "Vans"],
    regrasEspeciais: "Disponível apenas para regional Sul.",
    icone: "📍",
  },
  {
    id: "p6", nome: "Agregado", descricao: "Plano para veículos agregados e frotas.",
    descricaoAdmin: "Requer contrato especial com a cooperativa.",
    valorBase: 169.9, ativo: false,
    coberturas: todasCoberturas.filter(c => ["c1", "c2", "c3", "c5", "c7", "c8", "c10"].includes(c.id)),
    regionais: ["Sudeste", "Centro-Oeste"],
    categorias: ["Pesados", "Vans"],
    regrasEspeciais: "Exige contrato de frota mínimo de 5 veículos.",
    icone: "🚚",
  },
];

const tierColors: Record<string, { border: string; bg: string; accent: string }> = {
  Premium: { border: "border-amber-500/30", bg: "from-amber-500/10 to-amber-500/5", accent: "text-amber-500" },
  Completo: { border: "border-primary/30", bg: "from-primary/10 to-primary/5", accent: "text-primary" },
  Básico: { border: "border-border/50", bg: "from-muted to-muted/50", accent: "text-muted-foreground" },
  "Objetivo Leve": { border: "border-sky-500/30", bg: "from-sky-500/10 to-sky-500/5", accent: "text-sky-500" },
  "Objetivo Sul": { border: "border-emerald-500/30", bg: "from-emerald-500/10 to-emerald-500/5", accent: "text-emerald-500" },
  Agregado: { border: "border-violet-500/30", bg: "from-violet-500/10 to-violet-500/5", accent: "text-violet-500" },
};

export default function PlanosProtecao({ onBack }: { onBack: () => void }) {
  const [planos, setPlanos] = useState(mockPlanos);
  const [filtroRegional, setFiltroRegional] = useState<string>("todas");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [editing, setEditing] = useState<PlanoProtecao | null>(null);
  const [editCoberturas, setEditCoberturas] = useState<string[]>([]);
  const [editRegionais, setEditRegionais] = useState<string[]>([]);
  const [editCategorias, setEditCategorias] = useState<string[]>([]);

  const filteredPlanos = planos.filter(p => {
    if (filtroRegional !== "todas" && !p.regionais.includes(filtroRegional)) return false;
    if (filtroCategoria !== "todas" && !p.categorias.includes(filtroCategoria as CategoriaVeiculo)) return false;
    return true;
  });

  const openEdit = (p: PlanoProtecao) => {
    setEditing({ ...p });
    setEditCoberturas(p.coberturas.map(c => c.id));
    setEditRegionais([...p.regionais]);
    setEditCategorias([...p.categorias]);
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    setPlanos(prev => prev.map(p => p.id === editing.id ? {
      ...editing,
      coberturas: todasCoberturas.filter(c => editCoberturas.includes(c.id)),
      regionais: editRegionais,
      categorias: editCategorias as CategoriaVeiculo[],
    } : p));
    setEditing(null);
  };

  return (
    <div className="p-6 lg:px-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Planos de Proteção</h1>
        <Badge variant="secondary" className="text-xs">{planos.length} planos</Badge>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroRegional} onValueChange={setFiltroRegional}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Regional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Regionais</SelectItem>
              {todasRegionais.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Categorias</SelectItem>
            {todasCategorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Novo Plano</Button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredPlanos.map(p => {
          const colors = tierColors[p.nome] || tierColors["Básico"];
          return (
            <Card key={p.id} className={`border ${colors.border} bg-gradient-to-b ${colors.bg} hover:shadow-lg transition-all`}>
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.icone}</span>
                    <div>
                      <h3 className="font-bold text-[15px]">{p.nome}</h3>
                      <Badge className={`text-[9px] border-0 mt-0.5 ${p.ativo ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        {p.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Valor */}
                <div>
                  <span className="text-3xl font-bold">R$ {p.valorBase.toFixed(2).replace(".", ",")}</span>
                  <span className="text-xs text-muted-foreground">/mês</span>
                </div>

                <p className="text-xs text-muted-foreground">{p.descricao}</p>

                <Separator />

                {/* Coberturas */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {p.coberturas.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{c.nome}</span>
                      </div>
                      <span className="text-muted-foreground">R$ {c.valorBase.toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Categorias */}
                <div className="flex flex-wrap gap-1.5">
                  {p.categorias.map(cat => {
                    const Icon = categoriaIcons[cat];
                    return (
                      <Badge key={cat} variant="outline" className="text-[10px] gap-1">
                        <Icon className="h-3 w-3" />{cat}
                      </Badge>
                    );
                  })}
                </div>

                {/* Regionais */}
                <div className="flex flex-wrap gap-1">
                  {p.regionais.map(r => (
                    <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                  ))}
                </div>

                {/* Regras especiais */}
                {p.regrasEspeciais && (
                  <p className="text-[11px] text-amber-500 italic bg-warning/80/10 px-2 py-1.5 rounded">
                    ⚠️ {p.regrasEspeciais}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPlanos.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum plano encontrado com os filtros selecionados.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-xl">{editing.icone}</span>
                  Editar Plano: {editing.nome}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Nome</Label><Input value={editing.nome} onChange={e => setEditing({ ...editing, nome: e.target.value })} /></div>
                  <div><Label className="text-xs">Valor Base (R$)</Label><Input type="number" step="0.01" value={editing.valorBase} onChange={e => setEditing({ ...editing, valorBase: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div><Label className="text-xs">Descrição (pública)</Label><Textarea value={editing.descricao} onChange={e => setEditing({ ...editing, descricao: e.target.value })} rows={2} /></div>
                <div><Label className="text-xs">Descrição Administrativa (visível só para gestores)</Label><Textarea value={editing.descricaoAdmin} onChange={e => setEditing({ ...editing, descricaoAdmin: e.target.value })} rows={2} className="border-amber-500/30" /></div>
                <div><Label className="text-xs">Ícone/Emoji</Label><Input value={editing.icone} onChange={e => setEditing({ ...editing, icone: e.target.value })} className="w-20" /></div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.ativo} onCheckedChange={v => setEditing({ ...editing, ativo: v })} />
                  <Label className="text-xs">Plano Ativo</Label>
                </div>

                <Separator />

                {/* Coberturas */}
                <div>
                  <Label className="text-xs font-semibold">Coberturas Incluídas</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {todasCoberturas.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/50">
                        <Checkbox
                          checked={editCoberturas.includes(c.id)}
                          onCheckedChange={checked => {
                            setEditCoberturas(prev => checked ? [...prev, c.id] : prev.filter(x => x !== c.id));
                          }}
                        />
                        <span className="flex-1">{c.nome}</span>
                        <span className="text-muted-foreground">R$ {c.valorBase.toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Regionais */}
                <div>
                  <Label className="text-xs font-semibold">Regionais Ativas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {todasRegionais.map(r => (
                      <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox
                          checked={editRegionais.includes(r)}
                          onCheckedChange={checked => {
                            setEditRegionais(prev => checked ? [...prev, r] : prev.filter(x => x !== r));
                          }}
                        />
                        {r}
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Categorias */}
                <div>
                  <Label className="text-xs font-semibold">Categorias de Veículo</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {todasCategorias.map(cat => {
                      const Icon = categoriaIcons[cat];
                      return (
                        <label key={cat} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox
                            checked={editCategorias.includes(cat)}
                            onCheckedChange={checked => {
                              setEditCategorias(prev => checked ? [...prev, cat] : prev.filter(x => x !== cat));
                            }}
                          />
                          <Icon className="h-3.5 w-3.5" />{cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Regras especiais */}
                <div>
                  <Label className="text-xs">Regras Especiais</Label>
                  <Textarea
                    value={editing.regrasEspeciais}
                    onChange={e => setEditing({ ...editing, regrasEspeciais: e.target.value })}
                    rows={2}
                    placeholder='Ex: "Nunca cobrar rastreador neste plano"'
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
