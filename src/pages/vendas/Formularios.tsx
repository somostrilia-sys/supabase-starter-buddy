import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus, ExternalLink, Copy, FileText, GripVertical, X, Eye, ArrowLeft,
} from "lucide-react";

interface Campo {
  id: string; label: string; obrigatorio: boolean; placeholder: string;
}

interface Formulario {
  id: string; nome: string; url: string; ativo: boolean; leads: number; criadoEm: string; campos: Campo[];
}

const mockForms: Formulario[] = [
  {
    id: "f1", nome: "Captação Site Principal", url: "https://gia.com.br/f/captacao-site",
    ativo: true, leads: 142, criadoEm: "2026-01-15",
    campos: [
      { id: "c1", label: "Nome Completo", obrigatorio: true, placeholder: "Seu nome" },
      { id: "c2", label: "Telefone", obrigatorio: true, placeholder: "(11) 99999-9999" },
      { id: "c3", label: "Veículo", obrigatorio: false, placeholder: "Marca e modelo" },
    ],
  },
  {
    id: "f2", nome: "Landing Page Facebook", url: "https://gia.com.br/f/facebook-lp",
    ativo: true, leads: 87, criadoEm: "2026-02-01",
    campos: [
      { id: "c4", label: "Nome", obrigatorio: true, placeholder: "Nome" },
      { id: "c5", label: "Email", obrigatorio: true, placeholder: "email@exemplo.com" },
      { id: "c6", label: "Telefone", obrigatorio: true, placeholder: "Telefone" },
    ],
  },
  {
    id: "f3", nome: "Indicação de Amigos", url: "https://gia.com.br/f/indicacao",
    ativo: false, leads: 23, criadoEm: "2026-02-20",
    campos: [
      { id: "c7", label: "Seu Nome", obrigatorio: true, placeholder: "Quem indica" },
      { id: "c8", label: "Nome do Amigo", obrigatorio: true, placeholder: "Nome" },
      { id: "c9", label: "Telefone do Amigo", obrigatorio: true, placeholder: "Telefone" },
    ],
  },
];

const camposDisponiveis = ["Nome","Email","Telefone","CPF","Veículo Marca","Modelo","Placa","Mensagem"];

export default function Formularios() {
  const [forms, setForms] = useState(mockForms);
  const [editing, setEditing] = useState<Formulario | null>(null);
  const [formName, setFormName] = useState("");
  const [formCampos, setFormCampos] = useState<Campo[]>([]);

  function startNew() {
    setFormName("Novo Formulário");
    setFormCampos([]);
    setEditing({id: "new", nome: "", url: "", ativo: true, leads: 0, criadoEm: new Date().toISOString().slice(0,10), campos: []});
  }

  function addCampo(label: string) {
    setFormCampos(prev => [...prev, { id: `c${Date.now()}`, label, obrigatorio: false, placeholder: `Digite ${label.toLowerCase()}...` }]);
  }

  function removeCampo(id: string) {
    setFormCampos(prev => prev.filter(c => c.id !== id));
  }

  function toggleFormActive(id: string) {
    setForms(prev => prev.map(f => f.id === id ? {...f, ativo: !f.ativo} : f));
  }

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setEditing(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-bold tracking-tight">Editor de Formulário</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card className="border border-border/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1"><Label className="text-xs">Nome do Formulário</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cooperativa Destino</Label>
                  <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central-sp">Cooperativa Central SP</SelectItem>
                      <SelectItem value="central-rj">Cooperativa Central RJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Responsável Padrão</Label>
                  <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maria">Maria Santos</SelectItem>
                      <SelectItem value="joao">João Pedro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs">Campos Disponíveis</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {camposDisponiveis.map(c => (
                      <Button key={c} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => addCampo(c)}>
                        <Plus className="h-3 w-3 mr-0.5" />{c}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs">Campos Adicionados ({formCampos.length})</Label>
                  {formCampos.map(campo => (
                    <div key={campo.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-card">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                      <Input value={campo.label} onChange={e => setFormCampos(prev => prev.map(c => c.id === campo.id ? {...c, label: e.target.value} : c))} className="h-7 text-xs flex-1" />
                      <div className="flex items-center gap-1">
                        <Label className="text-[9px] text-muted-foreground">Obrig.</Label>
                        <Switch checked={campo.obrigatorio} onCheckedChange={v => setFormCampos(prev => prev.map(c => c.id === campo.id ? {...c, obrigatorio: v} : c))} className="scale-75" />
                      </div>
                      <button onClick={() => removeCampo(campo.id)} className="p-1 rounded hover:bg-destructive/20"><X className="h-3 w-3 text-destructive" /></button>
                    </div>
                  ))}
                </div>
                <div className="p-2 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                  <span className="font-medium">URL:</span> https://gia.com.br/f/{formName.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-border/50 h-fit sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm">Preview</CardTitle></div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/50 bg-background p-6 space-y-4">
                <h3 className="text-lg font-bold text-center">{formName || "Nome do Formulário"}</h3>
                <p className="text-xs text-muted-foreground text-center">Preencha os dados abaixo</p>
                {formCampos.map(campo => (
                  <div key={campo.id} className="space-y-1">
                    <Label className="text-xs">{campo.label} {campo.obrigatorio && <span className="text-destructive">*</span>}</Label>
                    <Input className="h-9 text-xs" placeholder={campo.placeholder} disabled />
                  </div>
                ))}
                {formCampos.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Adicione campos ao formulário</p>}
                <Button className="w-full" disabled>Enviar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Formulários de Captura</h1>
          <p className="text-sm text-muted-foreground">{forms.length} formulários criados</p>
        </div>
        <Button size="sm" onClick={startNew}><Plus className="h-4 w-4 mr-1" /> Criar Formulário</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map(f => (
          <Card key={f.id} className="border border-border/50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditing(f); setFormName(f.nome); setFormCampos(f.campos); }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{f.nome}</span>
                </div>
                <Switch checked={f.ativo} onCheckedChange={() => toggleFormActive(f.id)} onClick={e => e.stopPropagation()} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{f.url}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={e => e.stopPropagation()}><Copy className="h-3 w-3" /></Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <Badge variant={f.ativo ? "default" : "secondary"} className="text-[9px]">{f.ativo ? "Ativo" : "Inativo"}</Badge>
                <span className="text-muted-foreground">{f.leads} leads capturados</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Criado em {new Date(f.criadoEm).toLocaleDateString("pt-BR")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
