import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, FileText, Save, Loader2, Clock, User } from "lucide-react";

const STATUS_OPTIONS = [
  "Pós-venda realizado",
  "Não realizado",
  "Número incorreto",
];

export default function PosVendaSection({ veiculoId }: { veiculoId: string }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("Não realizado");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: posVenda, isLoading } = useQuery({
    queryKey: ["pos-venda", veiculoId],
    enabled: !!veiculoId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("pos_venda")
        .select("*, pos_venda_arquivos(*)")
        .eq("veiculo_id", veiculoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (posVenda) {
      setStatus(posVenda.status || "Não realizado");
      setObservacao(posVenda.observacao || "");
    }
  }, [posVenda]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        veiculo_id: veiculoId,
        status,
        observacao: observacao || null,
        usuario_id: user?.id || null,
        usuario_nome: user?.email || "Sistema",
        updated_at: new Date().toISOString(),
      };

      if (posVenda?.id) {
        const { error } = await (supabase as any)
          .from("pos_venda")
          .update(payload)
          .eq("id", posVenda.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("pos_venda")
          .insert(payload);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["pos-venda", veiculoId] });
      toast.success("Pós-venda salvo com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar pós-venda");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !posVenda?.id) {
      if (!posVenda?.id) toast.error("Salve o pós-venda antes de anexar arquivos.");
      return;
    }

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `pos-venda/${veiculoId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("documentos").upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) { toast.error("Erro upload: " + uploadError.message); continue; }

      await (supabase as any).from("pos_venda_arquivos").insert({
        pos_venda_id: posVenda.id,
        nome_arquivo: file.name,
        storage_path: path,
        tipo: ext.toUpperCase(),
      });
    }
    queryClient.invalidateQueries({ queryKey: ["pos-venda", veiculoId] });
    toast.success("Arquivo(s) enviado(s)!");
    e.target.value = "";
  };

  const removeFile = async (fileId: string, storagePath: string) => {
    await supabase.storage.from("documentos").remove([storagePath]);
    await (supabase as any).from("pos_venda_arquivos").delete().eq("id", fileId);
    queryClient.invalidateQueries({ queryKey: ["pos-venda", veiculoId] });
    toast.success("Arquivo removido.");
  };

  if (isLoading) {
    return <Card><CardContent className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></CardContent></Card>;
  }

  const arquivos = posVenda?.pos_venda_arquivos || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">Status do Pós-Venda <span className="text-destructive">*</span></Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {posVenda && (
              <div className="flex items-end gap-4">
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Última atualização: {new Date(posVenda.updated_at).toLocaleString("pt-BR")}</div>
                  <div className="flex items-center gap-1"><User className="h-3 w-3" /> Por: {posVenda.usuario_nome || "—"}</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold">Observação</Label>
            <Textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={4}
              placeholder="Descreva detalhes sobre o pós-venda realizado ou tentativa de contato..."
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">{observacao.length}/5000 caracteres</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Pós-Venda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Arquivos */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Anexos</Label>
            <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf,.doc,.docx" multiple onChange={handleFileUpload} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Adicionar Arquivo
            </Button>
          </div>

          {arquivos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum arquivo anexado.</p>
          ) : (
            <div className="space-y-2">
              {arquivos.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between border rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{f.nome_arquivo}</span>
                    <Badge variant="outline" className="text-[10px]">{f.tipo}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(f.id, f.storage_path)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
