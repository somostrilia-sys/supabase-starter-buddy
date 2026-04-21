// GIA Gestão — Lista de atendimentos estilo Meta Business Inbox
// Tabs Minhas/Fila/Todas + SEPARAÇÃO EXPLÍCITA Meta Oficial | UAZAPI por instance.tipo
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Inbox, Bot, User, Clock, UserCheck, Zap, AlertCircle, BadgeCheck, Smartphone } from "lucide-react";
import {
  useMyAttendances, useSectorQueue, useAtendimentos, useAssumir,
  statusToStage, type Atendimento, type AttendanceStage,
} from "@/hooks/useHubAtendimentos";
import { useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { useToast } from "@/hooks/use-toast";
import type { InstanceTipo } from "@/types/whatsapp";
import { cn } from "@/lib/utils";

type TabKey = "minhas" | "fila" | "todas";
type StageFilter = "all" | AttendanceStage;
export type ProviderFilter = "meta" | "uazapi";

interface Props {
  userId?: string | null;
  userName?: string;
  isAdmin?: boolean;
  selectedId?: string | null;
  onSelect: (a: Atendimento) => void;
  provider: ProviderFilter;
  onProviderChange: (p: ProviderFilter) => void;
}

const STAGE_META: Record<AttendanceStage, { label: string; Icon: any; cls: string; dot: string }> = {
  automacao:  { label: "Automação",  Icon: Zap,         cls: "bg-orange-500/10 text-orange-700 border-orange-200",    dot: "bg-orange-500" },
  ia:         { label: "IA",         Icon: Bot,         cls: "bg-violet-500/10 text-violet-700 border-violet-200",    dot: "bg-violet-500" },
  humano:     { label: "Humano",     Icon: User,        cls: "bg-blue-500/10 text-blue-700 border-blue-200",          dot: "bg-blue-500" },
  aguardando: { label: "Aguardando", Icon: Clock,       cls: "bg-amber-500/10 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  resolvido:  { label: "Resolvido",  Icon: UserCheck,   cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

function matchesProvider(tipo: InstanceTipo | undefined, p: ProviderFilter): boolean {
  if (!tipo) return false;
  if (p === "meta") return tipo === "meta_oficial";
  return tipo === "central" || tipo === "colaborador";
}

function formatTel(t: string) {
  const d = String(t).replace(/\D/g, "");
  if (d.length >= 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, -4)}-${d.slice(-4)}`;
  return t;
}

function formatAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `agora`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function initials(name: string | null, tel: string) {
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    return (parts[0]?.[0] + (parts.at(-1)?.[0] || "")).toUpperCase();
  }
  return String(tel).slice(-4);
}

function UrgenciaDot({ urgencia }: { urgencia: string | null }) {
  if (!urgencia || urgencia === "normal") return null;
  const cls = urgencia === "alta" ? "bg-red-500" : urgencia === "baixa" ? "bg-slate-400" : "bg-muted";
  return <span className={cn("h-2 w-2 rounded-full shrink-0", cls)} title={`Urgência ${urgencia}`} />;
}

export function AttendanceList({
  userId, userName, isAdmin, selectedId, onSelect, provider, onProviderChange,
}: Props) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>(isAdmin ? "fila" : "minhas");
  const [stage, setStage] = useState<StageFilter>("all");
  const [q, setQ] = useState("");

  const { data: instances = [] } = useWhatsAppInstances();
  const instanceTipoMap = useMemo(() => {
    const m = new Map<string, InstanceTipo>();
    for (const i of instances) m.set(i.id, i.tipo);
    return m;
  }, [instances]);

  const mine = useMyAttendances(userId);
  const queue = useSectorQueue();
  const all = useAtendimentos();
  const assumir = useAssumir();

  const source =
    tab === "minhas" ? mine :
    tab === "fila"   ? queue :
    all;

  const listRaw = source.data ?? [];
  const listByProvider = useMemo(
    () => listRaw.filter((a) => matchesProvider(instanceTipoMap.get(a.instance_id), provider)),
    [listRaw, instanceTipoMap, provider],
  );

  const filtered = useMemo(() => {
    let out = listByProvider;
    if (stage !== "all") {
      out = out.filter((a) => statusToStage(a.status, a.ai_runs_count) === stage);
    }
    const term = q.trim().toLowerCase();
    if (term) {
      out = out.filter((a) =>
        a.telefone.includes(term.replace(/\D/g, "")) ||
        (a.associado_nome || "").toLowerCase().includes(term) ||
        (a.atendente_nome || "").toLowerCase().includes(term) ||
        (a.protocolo || "").toLowerCase().includes(term)
      );
    }
    return out;
  }, [listByProvider, stage, q]);

  const counts = useMemo(() => {
    const c = { all: listByProvider.length, automacao: 0, ia: 0, humano: 0, aguardando: 0, resolvido: 0 };
    for (const a of listByProvider) {
      const s = statusToStage(a.status, a.ai_runs_count);
      if (s in c) (c as any)[s]++;
    }
    return c;
  }, [listByProvider]);

  // contagens por provider em cada aba (pra mostrar no toggle)
  const providerCounts = useMemo(() => {
    let meta = 0, uaz = 0;
    for (const a of listRaw) {
      const t = instanceTipoMap.get(a.instance_id);
      if (!t) continue;
      if (t === "meta_oficial") meta++;
      else uaz++;
    }
    return { meta, uazapi: uaz };
  }, [listRaw, instanceTipoMap]);

  const handleAssumir = async (a: Atendimento, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await assumir.mutateAsync({
        atendimento_id: a.id,
        atendente_id: userId ?? null,
        atendente_nome: userName,
      });
      toast({ title: "Atendimento assumido", description: `#${a.protocolo?.slice(-6) ?? a.id.slice(-6)}` });
      onSelect(a);
      setTab("minhas");
    } catch (err: any) {
      toast({ title: "Falha", description: err.message, variant: "destructive" });
    }
  };

  const tabDefs: { key: TabKey; label: string; count: number }[] = [
    { key: "minhas", label: "Minhas", count: (mine.data ?? []).filter(a => matchesProvider(instanceTipoMap.get(a.instance_id), provider)).length },
    { key: "fila",   label: "Fila",   count: (queue.data ?? []).filter(a => matchesProvider(instanceTipoMap.get(a.instance_id), provider)).length },
  ];
  if (isAdmin) tabDefs.push({ key: "todas", label: "Todas", count: (all.data ?? []).filter(a => matchesProvider(instanceTipoMap.get(a.instance_id), provider)).length });

  const stageChips: { key: StageFilter; label: string; n: number; cls?: string }[] = [
    { key: "all",        label: "Todos",      n: counts.all },
    { key: "automacao",  label: "Automação",  n: counts.automacao,  cls: "bg-orange-500/10 text-orange-700 border-orange-300" },
    { key: "ia",         label: "IA",         n: counts.ia,         cls: "bg-violet-500/10 text-violet-700 border-violet-300" },
    { key: "humano",     label: "Humano",     n: counts.humano,     cls: "bg-blue-500/10 text-blue-700 border-blue-300" },
    { key: "aguardando", label: "Aguardando", n: counts.aguardando, cls: "bg-amber-500/10 text-amber-700 border-amber-300" },
  ];

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Provider toggle — SEPARAÇÃO CLARA Meta vs UAZAPI */}
      <div className="grid grid-cols-2 gap-0 border-b">
        <button
          onClick={() => onProviderChange("meta")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-r",
            provider === "meta"
              ? "bg-emerald-500/10 text-emerald-700 border-b-2 border-b-emerald-500"
              : "text-muted-foreground hover:bg-muted/40",
          )}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          META OFICIAL
          <Badge variant="secondary" className="h-4 min-w-5 px-1 text-[10px] font-bold">
            {providerCounts.meta}
          </Badge>
        </button>
        <button
          onClick={() => onProviderChange("uazapi")}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors",
            provider === "uazapi"
              ? "bg-indigo-500/10 text-indigo-700 border-b-2 border-b-indigo-500"
              : "text-muted-foreground hover:bg-muted/40",
          )}
        >
          <Smartphone className="h-3.5 w-3.5" />
          UAZAPI
          <Badge variant="secondary" className="h-4 min-w-5 px-1 text-[10px] font-bold">
            {providerCounts.uazapi}
          </Badge>
        </button>
      </div>

      {/* Tabs Minhas/Fila/Todas */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="px-3 pt-3">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabDefs.length}, 1fr)` }}>
            {tabDefs.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="text-xs gap-1.5">
                {t.label}
                <Badge variant="secondary" className="h-4 min-w-5 px-1 text-[10px] font-semibold">
                  {t.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nome, telefone, protocolo..."
            className="pl-8 h-9 text-xs bg-muted/30 border-0"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-thin">
        {stageChips.map((c) => (
          <button
            key={c.key}
            onClick={() => setStage(c.key)}
            className={cn(
              "text-[10px] font-medium px-2 py-1 rounded-full border whitespace-nowrap transition-colors",
              stage === c.key
                ? c.cls ?? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60",
            )}
          >
            {c.label}
            <span className={cn("ml-1 font-semibold", stage === c.key ? "" : "text-foreground/80")}>
              {c.n}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {source.isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Inbox className="h-10 w-10 opacity-40" />
            <p className="text-xs">
              Nenhum atendimento em <span className="font-semibold">{provider === "meta" ? "Meta Oficial" : "UAZAPI"}</span>
            </p>
          </div>
        ) : (
          filtered.map((a) => {
            const sel = a.id === selectedId;
            const stg = statusToStage(a.status, a.ai_runs_count);
            const meta = STAGE_META[stg];
            const Icon = meta.Icon;
            const name = a.associado_nome || formatTel(a.telefone);
            const podeAssumir = tab === "fila" && (stg === "automacao" || stg === "ia" || stg === "aguardando");

            return (
              <button
                key={a.id}
                onClick={() => onSelect(a)}
                className={cn(
                  "w-full flex items-start gap-3 px-3 py-3 border-b border-border/40 text-left transition-colors relative",
                  sel ? "bg-accent" : "hover:bg-accent/40",
                )}
              >
                <span className={cn("absolute left-0 top-0 bottom-0 w-0.5", meta.dot)} />

                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                    {initials(a.associado_nome, a.telefone)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate flex-1">{name}</p>
                    <UrgenciaDot urgencia={a.urgencia} />
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatAgo(a.ultima_msg_em)}</span>
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {formatTel(a.telefone)}
                    {a.veiculo_placa && <span className="ml-1.5 font-mono opacity-70">· {a.veiculo_placa}</span>}
                  </p>

                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge variant="outline" className={cn("text-[10px] gap-1 py-0 px-1.5", meta.cls)}>
                      <Icon className="h-2.5 w-2.5" /> {meta.label}
                    </Badge>
                    {a.intencao && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                        {a.intencao.replace(/^int_/, "").replace(/_/g, " ")}
                      </Badge>
                    )}
                    {a.protocolo && (
                      <span className="text-[10px] text-muted-foreground font-mono">#{a.protocolo.slice(-6)}</span>
                    )}
                    {a.atendente_nome && tab !== "minhas" && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                        · {a.atendente_nome.split(" ")[0]}
                      </span>
                    )}
                  </div>

                  {podeAssumir && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full h-7 mt-2 text-[10px]"
                      onClick={(e) => handleAssumir(a, e)}
                      disabled={assumir.isPending}
                    >
                      <UserCheck className="h-3 w-3 mr-1.5" /> Assumir
                    </Button>
                  )}

                  {a.fallback_motivo && stg !== "humano" && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      <AlertCircle className="h-2.5 w-2.5" />
                      <span className="truncate">{a.fallback_motivo}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
