// SectorTemplatesTab — lista templates Meta do Hub, filtráveis por categoria
// Operador: listar + copiar. Admin: também envia template pra atendimento aberto.
import { useQuery } from "@tanstack/react-query";
import { supabaseHub } from "@/integrations/hub/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, FileText, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  nome: string;
  categoria: string | null;
  provider_tipo: string | null;
  conteudo_texto: string | null;
  meta_template_name: string | null;
  meta_language: string | null;
  componentes: any;
  variaveis: string[] | null;
  aprovado_meta: boolean | null;
  ativo: boolean;
}

interface Props {
  setor: string;
}

export function SectorTemplatesTab({ setor }: Props) {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["sector-templates", setor],
    queryFn: async () => {
      const { data } = await (supabaseHub as any).from("whatsapp_templates")
        .select("*").eq("ativo", true).order("categoria").order("nome");
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((t) =>
      t.nome.toLowerCase().includes(term) ||
      (t.conteudo_texto || "").toLowerCase().includes(term) ||
      (t.categoria || "").toLowerCase().includes(term)
    );
  }, [templates, q]);

  const byCategoria = useMemo(() => {
    return filtered.reduce<Record<string, Template[]>>((acc, t) => {
      const c = t.categoria || "sem categoria";
      (acc[c] ||= []).push(t);
      return acc;
    }, {});
  }, [filtered]);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    toast({ title: "Copiado!" });
  };

  return (
    <div className="p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> Templates Meta disponíveis
        </h3>
        <p className="text-xs text-muted-foreground">
          Templates aprovados pela Meta, usados em disparos e pela IA. CRUD fica no CollectPRO.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, categoria, conteúdo..."
          className="pl-8 h-9 text-xs"
        />
      </div>

      {isLoading ? (
        <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
      ) : Object.keys(byCategoria).length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum template.</p>
      ) : (
        Object.entries(byCategoria).map(([cat, list]) => (
          <Card key={cat}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs capitalize flex items-center justify-between">
                <span>{cat}</span>
                <Badge variant="outline" className="text-[10px]">{list.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {list.map((t) => (
                <div key={t.id} className="p-2 border rounded hover:bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{t.nome}</p>
                    <div className="flex items-center gap-1">
                      {t.aprovado_meta && (
                        <Badge variant="outline" className="text-[9px] text-emerald-700 border-emerald-300">META ✓</Badge>
                      )}
                      {t.provider_tipo && (
                        <Badge variant="secondary" className="text-[9px]">{t.provider_tipo}</Badge>
                      )}
                      <button
                        className="ml-1 p-1 rounded hover:bg-muted"
                        onClick={() => copy(t.conteudo_texto || "")}
                        title="Copiar texto"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {t.conteudo_texto && (
                    <p className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">
                      {t.conteudo_texto}
                    </p>
                  )}
                  {t.variaveis && t.variaveis.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.variaveis.map((v) => (
                        <span key={v} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{v}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
