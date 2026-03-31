import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Props { negociacaoId: string }

export default function TagsInline({ negociacaoId }: Props) {
  const [tags, setTags] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  useEffect(() => { fetchTags(); }, [negociacaoId]);

  async function fetchTags() {
    const { data } = await supabase.from("negociacao_tags" as any).select("id, tags(id, nome, cor)").eq("negociacao_id", negociacaoId);
    setTags((data || []).map((d: any) => ({ link_id: d.id, ...d.tags })));
    const { data: all } = await supabase.from("tags" as any).select("*").order("nome");
    setAllTags(all || []);
  }

  async function addTag(tagId: string) {
    await supabase.from("negociacao_tags" as any).insert({ negociacao_id: negociacaoId, tag_id: tagId });
    setShowAdd(false);
    fetchTags();
    toast.success("Tag adicionada");
  }

  async function removeTag(linkId: string) {
    await supabase.from("negociacao_tags" as any).delete().eq("id", linkId);
    fetchTags();
  }

  async function createTag() {
    if (!newName.trim()) return;
    const { data } = await supabase.from("tags" as any).insert({ nome: newName.trim(), cor: newColor }).select().single();
    if (data) { await addTag((data as any).id); setNewName(""); setShowNew(false); }
  }

  const assignedIds = new Set(tags.map(t => t.id));
  const available = allTags.filter(t => !assignedIds.has(t.id));

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map(t => (
        <Badge key={t.link_id} style={{ backgroundColor: t.cor, color: "#fff" }} className="text-[10px] rounded-none flex items-center gap-0.5">
          {t.nome}
          <button onClick={() => removeTag(t.link_id)} className="ml-0.5 hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
        </Badge>
      ))}
      {!showAdd ? (
        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3" /></Button>
      ) : (
        <div className="flex flex-col gap-1 bg-card border rounded p-2 shadow-sm z-10">
          {available.map(t => (
            <button key={t.id} onClick={() => addTag(t.id)} className="text-xs text-left hover:bg-muted px-2 py-1 rounded flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: t.cor }} /> {t.nome}
            </button>
          ))}
          {available.length === 0 && <p className="text-[10px] text-muted-foreground px-1">Sem tags</p>}
          {!showNew && <button onClick={() => setShowNew(true)} className="text-[10px] text-primary mt-1">+ Nova Tag</button>}
          {showNew && (
            <div className="flex items-center gap-1 mt-1">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome" className="h-6 text-xs w-20 rounded-none" />
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-5 h-5 border-0 p-0 cursor-pointer" />
              <Button size="sm" variant="ghost" className="text-xs h-5 px-1" onClick={createTag}>OK</Button>
            </div>
          )}
          <button onClick={() => { setShowAdd(false); setShowNew(false); }} className="text-[10px] text-muted-foreground mt-1">Fechar</button>
        </div>
      )}
    </div>
  );
}
