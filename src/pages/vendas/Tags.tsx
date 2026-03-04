import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Tag as TagIcon } from "lucide-react";

const presetColors = [
  "#EF4444","#F97316","#F59E0B","#EAB308","#22C55E","#14B8A6",
  "#3B82F6","#6366F1","#8B5CF6","#A855F7","#EC4899","#64748B",
];

interface TagItem { id: string; nome: string; cor: string; grupo: string; }

const defaultTags: TagItem[] = [
  { id: "t1", nome: "Aceita", cor: "#22C55E", grupo: "Status" },
  { id: "t2", nome: "Cancelada", cor: "#EF4444", grupo: "Status" },
  { id: "t3", nome: "SGA", cor: "#3B82F6", grupo: "Sistema" },
  { id: "t4", nome: "Prioridade", cor: "#F97316", grupo: "Prioridade" },
  { id: "t5", nome: "VIP", cor: "#EAB308", grupo: "Prioridade" },
  { id: "t6", nome: "Retorno", cor: "#F59E0B", grupo: "Ação" },
  { id: "t7", nome: "Indicação", cor: "#8B5CF6", grupo: "Origem" },
  { id: "t8", nome: "Renovação", cor: "#14B8A6", grupo: "Ação" },
];

export default function Tags() {
  const [tags, setTags] = useState<TagItem[]>(defaultTags);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTag, setNewTag] = useState({ nome: "", cor: "#3B82F6", grupo: "Geral" });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Status","Prioridade","Ação","Origem","Sistema"]));

  const grupos = [...new Set(tags.map(t => t.grupo))];

  function toggleGroup(g: string) {
    setExpandedGroups(prev => {
      const n = new Set(prev);
      n.has(g) ? n.delete(g) : n.add(g);
      return n;
    });
  }

  function addTag() {
    if (!newTag.nome.trim()) return;
    setTags(prev => [...prev, { id: `t${Date.now()}`, ...newTag }]);
    setNewTag({ nome: "", cor: "#3B82F6", grupo: "Geral" });
    setModalOpen(false);
  }

  function removeTag(id: string) {
    setTags(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground">{tags.length} tags em {grupos.length} grupos</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Tag</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Nova Tag</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1"><Label className="text-xs">Nome</Label>
                <Input value={newTag.nome} onChange={e => setNewTag({...newTag, nome: e.target.value})} className="h-9 text-xs" placeholder="Nome da tag" />
              </div>
              <div className="space-y-1"><Label className="text-xs">Grupo</Label>
                <Select value={newTag.grupo} onValueChange={v => setNewTag({...newTag, grupo: v})}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[...grupos, "Geral"].filter((v,i,a) => a.indexOf(v)===i).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Cor</Label>
                <div className="grid grid-cols-6 gap-2">
                  {presetColors.map(c => (
                    <button key={c} onClick={() => setNewTag({...newTag, cor: c})}
                      className={`w-8 h-8 rounded-lg transition-all ${newTag.cor === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
                      style={{backgroundColor: c}} />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preview</Label>
                <div className="p-3 rounded-lg bg-muted/40 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" style={{color: newTag.cor}} />
                  <span className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{backgroundColor: newTag.cor}}>
                    {newTag.nome || "Nome da tag"}
                  </span>
                </div>
              </div>
              <Button className="w-full" onClick={addTag} disabled={!newTag.nome.trim()}>Criar Tag</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {grupos.map(grupo => {
          const groupTags = tags.filter(t => t.grupo === grupo);
          const expanded = expandedGroups.has(grupo);
          return (
            <Card key={grupo} className="border border-border/50">
              <CardHeader className="pb-0 cursor-pointer" onClick={() => toggleGroup(grupo)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <CardTitle className="text-sm">{grupo}</CardTitle>
                    <Badge variant="secondary" className="text-[10px]">{groupTags.length}</Badge>
                  </div>
                </div>
              </CardHeader>
              {expanded && (
                <CardContent className="pt-3">
                  <div className="flex flex-wrap gap-2">
                    {groupTags.map(tag => (
                      <div key={tag.id} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 bg-card hover:bg-muted/30 transition-colors">
                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: tag.cor}} />
                        <span className="text-xs font-medium">{tag.nome}</span>
                        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                          <button className="p-0.5 rounded hover:bg-muted"><Edit className="h-3 w-3 text-muted-foreground" /></button>
                          <button className="p-0.5 rounded hover:bg-destructive/20" onClick={() => removeTag(tag.id)}><Trash2 className="h-3 w-3 text-destructive" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
