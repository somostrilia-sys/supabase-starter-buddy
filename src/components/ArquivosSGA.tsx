import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Image as ImageIcon, Video, FileAudio, File, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";

type ArquivoRow = {
  id: number;
  arquivo_codigo: string | null;
  arquivo_nome: string | null;
  arquivo_tipo: string | null;
  arquivo_data: string | null;
  storage_path: string;
  size_bytes: number | null;
  content_type: string | null;
  downloaded_at: string | null;
};

interface Props {
  placa?: string;
  protocolo?: string;
}

const BUCKET = "sga-arquivos";
const URL_TTL = 3600;

function extOf(name: string | null): string {
  if (!name) return "";
  const m = name.match(/\.([A-Za-z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : "";
}

function kindOf(row: ArquivoRow): "image" | "pdf" | "video" | "audio" | "other" {
  const ct = (row.content_type || "").toLowerCase();
  const ext = extOf(row.arquivo_nome || row.storage_path);
  if (ct.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext)) return "image";
  if (ct.includes("pdf") || ext === "pdf") return "pdf";
  if (ct.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (ct.startsWith("audio/") || ["mp3", "ogg", "wav", "m4a", "opus"].includes(ext)) return "audio";
  return "other";
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function IconFor({ kind }: { kind: string }) {
  const cls = "h-4 w-4";
  if (kind === "image") return <ImageIcon className={cls} />;
  if (kind === "pdf") return <FileText className={cls} />;
  if (kind === "video") return <Video className={cls} />;
  if (kind === "audio") return <FileAudio className={cls} />;
  return <File className={cls} />;
}

export default function ArquivosSGA({ placa, protocolo }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ArquivoRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const table = placa ? "documentos_gia_veiculo" : "documentos_gia_evento";
  const col = placa ? "placa" : "protocolo";
  const val = placa || protocolo;

  useEffect(() => {
    if (!val) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      // usa cast as any porque tabelas não estão nos types gerados
      const sb: any = supabase;
      const { data, error } = await sb
        .from(table)
        .select("id,arquivo_codigo,arquivo_nome,arquivo_tipo,arquivo_data,storage_path,size_bytes,content_type,downloaded_at")
        .eq(col, val!)
        .not("downloaded_at", "is", null)
        .order("arquivo_tipo", { ascending: true })
        .order("arquivo_data", { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setRows((data || []) as ArquivoRow[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [table, col, val]);

  const grupos = useMemo(() => {
    const g: Record<string, ArquivoRow[]> = {};
    for (const r of rows) {
      const k = r.arquivo_tipo || "OUTROS";
      (g[k] = g[k] || []).push(r);
    }
    return g;
  }, [rows]);

  async function ensureUrl(path: string): Promise<string | null> {
    if (signedUrls[path]) return signedUrls[path];
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, URL_TTL);
    if (error || !data?.signedUrl) return null;
    setSignedUrls((m) => ({ ...m, [path]: data.signedUrl }));
    return data.signedUrl;
  }

  async function toggleGrupo(tipo: string) {
    const willOpen = !expanded[tipo];
    setExpanded((e) => ({ ...e, [tipo]: willOpen }));
    if (willOpen) {
      // lazy: gera URLs só das imagens para thumbnails
      const imgs = (grupos[tipo] || []).filter((r) => kindOf(r) === "image");
      for (const r of imgs.slice(0, 24)) {
        ensureUrl(r.storage_path);
      }
    }
  }

  async function openFile(r: ArquivoRow) {
    const url = await ensureUrl(r.storage_path);
    if (url) window.open(url, "_blank", "noopener");
  }

  if (!val) return <p className="text-sm text-muted-foreground">Sem identificador ({placa ? "placa" : "protocolo"}).</p>;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>Arquivos SGA {placa ? `— ${placa}` : `— Protocolo ${protocolo}`}</span>
          {!loading && (
            <Badge variant="secondary" className="font-mono">{rows.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        )}
        {error && <p className="text-sm text-destructive">Erro: {error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum arquivo encontrado no SGA.</p>
        )}
        {!loading && !error && Object.entries(grupos).map(([tipo, items]) => {
          const open = !!expanded[tipo];
          return (
            <div key={tipo} className="border rounded-md">
              <button
                onClick={() => toggleGrupo(tipo)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">{tipo}</span>
                  <Badge variant="outline" className="font-mono">{items.length}</Badge>
                </span>
              </button>
              {open && (
                <div className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {items.map((r) => {
                    const kind = kindOf(r);
                    const url = signedUrls[r.storage_path];
                    return (
                      <div key={r.id} className="border rounded-md p-2 flex flex-col gap-2 bg-background">
                        <div className="h-28 flex items-center justify-center bg-muted rounded overflow-hidden">
                          {kind === "image" && url ? (
                            <img src={url} alt={r.arquivo_nome || ""} loading="lazy" className="max-h-full max-w-full object-contain" />
                          ) : kind === "image" ? (
                            <Skeleton className="h-full w-full" />
                          ) : (
                            <IconFor kind={kind} />
                          )}
                        </div>
                        <div className="text-xs font-medium truncate" title={r.arquivo_nome || ""}>{r.arquivo_nome || "(sem nome)"}</div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{fmtSize(r.size_bytes)}</span>
                          <span>{r.arquivo_data || ""}</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openFile(r)}>
                          <ExternalLink className="h-3 w-3" /> Abrir
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
