import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, FileText, GripVertical, Eye, Pencil, Copy, ToggleLeft,
  Loader2, ChevronDown, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// TODO: Criar migration para tabela `formularios_vendas` no Supabase para persistência real.
// Por enquanto usa localStorage.

interface FormField {
  id: string;
  label: string;
  tipo: "texto" | "numero" | "select" | "checkbox" | "data" | "telefone" | "email";
  obrigatorio: boolean;
  opcoes?: string[];
}

interface FormularioCustom {
  id: string;
  nome: string;
  descricao: string;
  campos: FormField[];
  ativo: boolean;
  created_at: string;
}

const STORAGE_KEY = "gia-vendas-formularios";

const tiposLabel: Record<FormField["tipo"], string> = {
  texto: "Texto",
  numero: "Número",
  select: "Seleção",
  checkbox: "Checkbox",
  data: "Data",
  telefone: "Telefone",
  email: "E-mail",
};

function loadForms(): FormularioCustom[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveForms(forms: FormularioCustom[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

export default function Formularios() {
  const [forms, setForms] = useState<FormularioCustom[]>(loadForms);
  const [editingForm, setEditingForm] = useState<FormularioCustom | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewForm, setPreviewForm] = useState<FormularioCustom | null>(null);

  // Persist to localStorage on change
  useEffect(() => {
    saveForms(forms);
  }, [forms]);

  function openNew() {
    setEditingForm({
      id: `form-${Date.now()}`,
      nome: "",
      descricao: "",
      campos: [],
      ativo: true,
      created_at: new Date().toISOString(),
    });
    setModalOpen(true);
  }

  function openEdit(form: FormularioCustom) {
    setEditingForm({ ...form, campos: form.campos.map(c => ({ ...c })) });
    setModalOpen(true);
  }

  function saveForm() {
    if (!editingForm || !editingForm.nome.trim()) return;
    setForms(prev => {
      const exists = prev.find(f => f.id === editingForm.id);
      if (exists) {
        return prev.map(f => f.id === editingForm.id ? editingForm : f);
      }
      return [...prev, editingForm];
    });
    setModalOpen(false);
    setEditingForm(null);
    toast.success("Formulário salvo");
  }

  function deleteForm(id: string) {
    setForms(prev => prev.filter(f => f.id !== id));
    toast.success("Formulário removido");
  }

  function toggleActive(id: string) {
    setForms(prev => prev.map(f => f.id === id ? { ...f, ativo: !f.ativo } : f));
  }

  function duplicateForm(form: FormularioCustom) {
    const dup: FormularioCustom = {
      ...form,
      id: `form-${Date.now()}`,
      nome: `${form.nome} (cópia)`,
      created_at: new Date().toISOString(),
      campos: form.campos.map(c => ({ ...c, id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
    };
    setForms(prev => [...prev, dup]);
    toast.success("Formulário duplicado");
  }

  // --- Field editor helpers ---
  function addField() {
    if (!editingForm) return;
    const field: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: "",
      tipo: "texto",
      obrigatorio: false,
    };
    setEditingForm({ ...editingForm, campos: [...editingForm.campos, field] });
  }

  function updateField(fieldId: string, patch: Partial<FormField>) {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      campos: editingForm.campos.map(f => f.id === fieldId ? { ...f, ...patch } : f),
    });
  }

  function removeField(fieldId: string) {
    if (!editingForm) return;
    setEditingForm({
      ...editingForm,
      campos: editingForm.campos.filter(f => f.id !== fieldId),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Formulários de Captura</h1>
          <p className="text-sm text-muted-foreground">
            {forms.length} formulário{forms.length !== 1 ? "s" : ""} criado{forms.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Formulário
        </Button>
      </div>

      {/* Form list */}
      {forms.length === 0 ? (
        <Card className="border border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Nenhum formulário</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Crie formulários personalizados para captar leads e alimentar o pipeline automaticamente.
            </p>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Criar Primeiro Formulário
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {forms.map(form => (
            <Card key={form.id} className={`border border-border/50 ${!form.ativo ? "opacity-60" : ""}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold truncate">{form.nome}</h3>
                      <Badge variant={form.ativo ? "default" : "secondary"} className="text-[10px]">
                        {form.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {form.campos.length} campo{form.campos.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {form.descricao && (
                      <p className="text-xs text-muted-foreground truncate">{form.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewForm(form)} title="Visualizar">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(form)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateForm(form)} title="Duplicar">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(form.id)} title={form.ativo ? "Desativar" : "Ativar"}>
                      <ToggleLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteForm(form.id)} title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Builder Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) setEditingForm(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingForm && forms.find(f => f.id === editingForm.id) ? "Editar Formulário" : "Novo Formulário"}
            </DialogTitle>
          </DialogHeader>
          {editingForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do Formulário</Label>
                  <Input
                    value={editingForm.nome}
                    onChange={e => setEditingForm({ ...editingForm, nome: e.target.value })}
                    className="h-9 text-xs"
                    placeholder="Ex: Cadastro de Lead"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Textarea
                    value={editingForm.descricao}
                    onChange={e => setEditingForm({ ...editingForm, descricao: e.target.value })}
                    className="text-xs min-h-[60px]"
                    placeholder="Descreva o propósito deste formulário"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Campos ({editingForm.campos.length})</Label>
                  <Button size="sm" variant="outline" onClick={addField}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Campo
                  </Button>
                </div>

                {editingForm.campos.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
                  </p>
                )}

                {editingForm.campos.map((field, idx) => (
                  <Card key={field.id} className="border border-border/40">
                    <CardContent className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Campo {idx + 1}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeField(field.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Label</Label>
                          <Input
                            value={field.label}
                            onChange={e => updateField(field.id, { label: e.target.value })}
                            className="h-8 text-xs"
                            placeholder="Nome do campo"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Tipo</Label>
                          <Select value={field.tipo} onValueChange={v => updateField(field.id, { tipo: v as FormField["tipo"] })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(tiposLabel) as FormField["tipo"][]).map(t => (
                                <SelectItem key={t} value={t}>{tiposLabel[t]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={field.obrigatorio}
                          onCheckedChange={v => updateField(field.id, { obrigatorio: v })}
                        />
                        <Label className="text-[10px]">Obrigatório</Label>
                      </div>
                      {field.tipo === "select" && (
                        <div className="space-y-1">
                          <Label className="text-[10px]">Opções (separadas por vírgula)</Label>
                          <Input
                            value={(field.opcoes || []).join(", ")}
                            onChange={e => updateField(field.id, {
                              opcoes: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                            })}
                            className="h-8 text-xs"
                            placeholder="Opção 1, Opção 2, Opção 3"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button className="w-full" onClick={saveForm} disabled={!editingForm.nome.trim()}>
                Salvar Formulário
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview: {previewForm?.nome}</DialogTitle>
          </DialogHeader>
          {previewForm && (
            <div className="space-y-4">
              {previewForm.descricao && (
                <p className="text-xs text-muted-foreground">{previewForm.descricao}</p>
              )}
              {previewForm.campos.map(field => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs">
                    {field.label || "Sem label"}
                    {field.obrigatorio && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.tipo === "checkbox" ? (
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <span className="text-xs text-muted-foreground">{field.label}</span>
                    </div>
                  ) : field.tipo === "select" ? (
                    <Select disabled>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {(field.opcoes || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : field.tipo === "data" ? (
                    <Input type="date" disabled className="h-9 text-xs" />
                  ) : field.tipo === "numero" ? (
                    <Input type="number" disabled className="h-9 text-xs" placeholder={field.label} />
                  ) : field.tipo === "email" ? (
                    <Input type="email" disabled className="h-9 text-xs" placeholder="email@exemplo.com" />
                  ) : field.tipo === "telefone" ? (
                    <Input type="tel" disabled className="h-9 text-xs" placeholder="(00) 00000-0000" />
                  ) : (
                    <Input disabled className="h-9 text-xs" placeholder={field.label} />
                  )}
                </div>
              ))}
              {previewForm.campos.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum campo configurado.</p>
              )}
              <Button className="w-full" disabled>Enviar (preview)</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
