// Painel lateral direito (Meta Inbox style) — contexto do atendimento ativo
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserCheck, ArrowRightLeft, CheckCircle2, Archive, RotateCcw,
  IdCard, Car, MessageSquare, Bot, Smile, Frown, Meh,
  Clock, Tag, StickyNote, Hash, Phone,
} from "lucide-react";
import {
  useAssumir, useTransferir, useResolver, useDevolverFila,
  statusToStage, type Atendimento,
} from "@/hooks/useHubAtendimentos";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  atendimento: Atendimento | null;
  userId?: string | null;
  userName?: string;
}

const SETORES = [
  { slug: "cobranca", nome: "Cobrança" },
  { slug: "evento",   nome: "Eventos"  },
  { slug: "track",    nome: "Track"    },
  { slug: "gestao",   nome: "Gestão"   },
];

const SENTIMENTO_ICON: Record<string, { Icon: any; cls: string; label: string }> = {
  positivo: { Icon: Smile, cls: "text-emerald-600", label: "Positivo" },
  neutro:   { Icon: Meh,   cls: "text-slate-500",   label: "Neutro"   },
  negativo: { Icon: Frown, cls: "text-red-600",     label: "Negativo" },
};

function formatTel(t: string) {
  const d = String(t).replace(/\D/g, "");
  if (d.length >= 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, -4)}-${d.slice(-4)}`;
  return t;
}

function formatCpf(cpf: string | null): string {
  if (!cpf) return "";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function elapsedSince(iso: string | null): string {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function AttendanceContext({ atendimento, userId, userName }: Props) {
  const { toast } = useToast();
  const [showTransfer, setShowTransfer] = useState(false);
  const assumir = useAssumir();
  const transferir = useTransferir();
  const resolver = useResolver();
  const devolver = useDevolverFila();

  if (!atendimento) {
    return (
      <div className="hidden xl:flex flex-col items-center justify-center h-full border-l bg-muted/10 p-6 text-muted-foreground gap-3 w-80 shrink-0">
        <MessageSquare className="h-14 w-14 opacity-30" />
        <p className="text-sm text-center">Selecione um atendimento pra ver o contexto</p>
      </div>
    );
  }

  const a = atendimento;
  const stg = statusToStage(a.status, a.ai_runs_count);
  const isMine = a.atendente_id === userId;
  const sentimento = a.sentimento ? SENTIMENTO_ICON[a.sentimento] : null;

  const handle = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast({ title: ok }); }
    catch (e: any) { toast({ title: "Falha", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="hidden xl:flex flex-col h-full border-l bg-background w-80 shrink-0">
      <ScrollArea className="flex-1">
        {/* Avatar header */}
        <div className="p-5 text-center border-b">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
              {(a.associado_nome || a.telefone).split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("") || "?"}
            </AvatarFallback>
          </Avatar>
          <p className="mt-3 font-semibold text-sm">
            {a.associado_nome || formatTel(a.telefone)}
          </p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <Phone className="h-3 w-3" /> {formatTel(a.telefone)}
          </p>
          {a.protocolo && (
            <Badge variant="outline" className="mt-2 text-[10px] gap-1 font-mono">
              <Hash className="h-2.5 w-2.5" /> {a.protocolo}
            </Badge>
          )}
        </div>

        {/* Ações */}
        <div className="p-3 space-y-1.5">
          {!isMine && (stg === "automacao" || stg === "ia" || stg === "aguardando") && (
            <Button
              size="sm" className="w-full gap-1.5" variant="default"
              onClick={() => handle(
                () => assumir.mutateAsync({ atendimento_id: a.id, atendente_id: userId ?? null, atendente_nome: userName }),
                "Atendimento assumido",
              )}
              disabled={assumir.isPending}
            >
              <UserCheck className="h-3.5 w-3.5" /> Assumir
            </Button>
          )}
          {isMine && (
            <Button
              size="sm" className="w-full gap-1.5" variant="default"
              onClick={() => handle(
                () => resolver.mutateAsync({ atendimento_id: a.id }),
                "Atendimento resolvido",
              )}
              disabled={resolver.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
            </Button>
          )}
          <Button
            size="sm" className="w-full gap-1.5" variant="outline"
            onClick={() => setShowTransfer((v) => !v)}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Transferir setor
          </Button>
          {showTransfer && (
            <div className="grid grid-cols-2 gap-1 pt-1">
              {SETORES.filter((s) => s.slug !== a.setor).map((s) => (
                <Button
                  key={s.slug} size="sm" variant="secondary" className="h-7 text-[10px]"
                  onClick={() => handle(
                    () => transferir.mutateAsync({ atendimento_id: a.id, para_setor: s.slug, motivo: `Transferido via painel gestao` }),
                    `→ ${s.nome}`,
                  )}
                >
                  {s.nome}
                </Button>
              ))}
            </div>
          )}
          {isMine && (
            <Button
              size="sm" className="w-full gap-1.5" variant="ghost"
              onClick={() => handle(
                () => devolver.mutateAsync({ atendimento_id: a.id, motivo: "Devolvido pra IA" }),
                "Devolvido à fila",
              )}
              disabled={devolver.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Devolver à IA
            </Button>
          )}
        </div>

        <Separator />

        {/* Contato */}
        <Section title="Contato">
          <Row icon={IdCard}  label="CPF"     value={formatCpf(a.associado_cpf)} />
          <Row icon={Car}     label="Placa"   value={a.veiculo_placa} mono />
        </Section>

        <Separator />

        {/* Fluxo Automação → IA → Humano */}
        <Section title="Fluxo">
          <div className="flex items-center justify-between gap-1 bg-muted/30 rounded-lg p-2">
            <Stage label="Auto"   active={stg === "automacao"} passed={a.ai_runs_count && a.ai_runs_count > 0 ? true : (stg !== "automacao")} color="orange" />
            <Arrow />
            <Stage label="IA"     active={stg === "ia"}        passed={stg === "humano" || stg === "resolvido"} color="violet" />
            <Arrow />
            <Stage label="Humano" active={stg === "humano"}    passed={stg === "resolvido"} color="blue" />
          </div>
          {a.sessao_step && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Step:</span>
              <Badge variant="outline" className="text-[10px] font-mono">{a.sessao_step}</Badge>
            </div>
          )}
          {a.ai_runs_count != null && a.ai_runs_count > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
              <Bot className="h-3 w-3" />
              <span>{a.ai_runs_count} {a.ai_runs_count === 1 ? "interação IA" : "interações IA"}</span>
              {a.ai_last_run && <span className="opacity-70">· {elapsedSince(a.ai_last_run)} atrás</span>}
            </div>
          )}
          {a.fallback_motivo && (
            <div className="mt-2 text-[10px] p-2 rounded bg-amber-500/10 text-amber-800 border border-amber-200">
              <span className="font-semibold">Fallback pra humano:</span> {a.fallback_motivo}
            </div>
          )}
        </Section>

        <Separator />

        {/* IA */}
        <Section title="Análise IA">
          <Row icon={MessageSquare} label="Intenção" value={a.intencao?.replace(/^int_/, "").replace(/_/g, " ")} />
          <Row icon={Clock}         label="Urgência" value={a.urgencia}
            badge={a.urgencia === "alta" ? "bg-red-500/10 text-red-700 border-red-300" :
                   a.urgencia === "baixa" ? "bg-slate-400/10 text-slate-600" : ""}
          />
          {sentimento && (
            <div className="flex items-center gap-2 py-0.5 text-[11px]">
              <sentimento.Icon className={cn("h-3.5 w-3.5", sentimento.cls)} />
              <span className="text-muted-foreground">Sentimento</span>
              <span className="ml-auto font-medium">{sentimento.label}</span>
            </div>
          )}
        </Section>

        {a.tags && a.tags.length > 0 && (
          <>
            <Separator />
            <Section title="Tags">
              <div className="flex flex-wrap gap-1">
                {a.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] gap-1">
                    <Tag className="h-2.5 w-2.5" /> {t}
                  </Badge>
                ))}
              </div>
            </Section>
          </>
        )}

        <Separator />

        {/* SLA + timeline curta */}
        <Section title="SLA">
          <Row icon={Clock} label="1º resp."  value={a.sla_primeiro_resp_seg ? `${a.sla_primeiro_resp_seg}s` : "—"} />
          <Row icon={Clock} label="Resolução" value={a.sla_resolucao_seg ? `${a.sla_resolucao_seg}s` : "—"} />
          <Row icon={Clock} label="Abriu há"  value={elapsedSince(a.primeira_msg_em)} />
          {a.assumido_em  && <Row icon={UserCheck}   label="Assumido há"  value={elapsedSince(a.assumido_em)} />}
          {a.resolvido_em && <Row icon={CheckCircle2} label="Resolvido há" value={elapsedSince(a.resolvido_em)} />}
        </Section>

        {a.notas && (
          <>
            <Separator />
            <Section title="Notas">
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                <p className="whitespace-pre-wrap">{a.notas}</p>
              </div>
            </Section>
          </>
        )}
      </ScrollArea>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, value, mono, badge }: {
  icon: any; label: string; value?: string | null; mono?: boolean; badge?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 py-0.5 text-[11px]">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}</span>
      {badge ? (
        <Badge variant="outline" className={cn("ml-auto text-[10px]", badge)}>{value}</Badge>
      ) : (
        <span className={cn("ml-auto font-medium truncate", mono && "font-mono")}>{value}</span>
      )}
    </div>
  );
}

function Stage({ label, active, passed, color }: {
  label: string; active: boolean; passed?: boolean; color: "orange" | "violet" | "blue";
}) {
  const clsMap = {
    orange: active ? "bg-orange-500 text-white" : passed ? "bg-orange-500/20 text-orange-700" : "bg-muted text-muted-foreground",
    violet: active ? "bg-violet-500 text-white" : passed ? "bg-violet-500/20 text-violet-700" : "bg-muted text-muted-foreground",
    blue:   active ? "bg-blue-500 text-white"   : passed ? "bg-blue-500/20 text-blue-700"     : "bg-muted text-muted-foreground",
  };
  return (
    <div className={cn("flex-1 text-center text-[10px] font-semibold py-1.5 rounded", clsMap[color])}>
      {label}
    </div>
  );
}

function Arrow() {
  return <span className="text-muted-foreground text-xs shrink-0">→</span>;
}
