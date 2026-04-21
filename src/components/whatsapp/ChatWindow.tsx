import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send, Loader2, Check, CheckCheck, Clock, AlertCircle, Paperclip,
  MessageSquare, Smile, FileText, Mic, Zap, Bot, User, UserCheck,
  BadgeCheck, Smartphone,
} from "lucide-react";
import { useMessages, useSendMessage, useWhatsAppInstances } from "@/hooks/useWhatsApp";
import { useToast } from "@/hooks/use-toast";
import { supabaseHub } from "@/integrations/hub/client";
import { useQuery } from "@tanstack/react-query";
import type { WhatsAppMessage, MessageStatus } from "@/types/whatsapp";
import { statusToStage, type Atendimento } from "@/hooks/useHubAtendimentos";
import { cn } from "@/lib/utils";

interface Props {
  instanceId: string | null;
  telefone: string | null;
  nome?: string | null;
  associadoId?: string | null;
  atendimento?: Atendimento | null;
}

const EMOJI_QUICK = ["👍","👌","🙏","❤️","😊","😂","😉","🙂","😀","🎉","✅","❌","⚠️","🔥","💰","📎","📌","📞","📱","👀","🚗","🤝"];

function formatTel(t: string): string {
  const d = String(t || "").replace(/\D/g, "");
  if (d.length >= 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, -4)}-${d.slice(-4)}`;
  return t;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function StatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "queued": return <Clock className="h-3 w-3 opacity-60" />;
    case "sent": return <Check className="h-3 w-3 opacity-60" />;
    case "delivered": return <CheckCheck className="h-3 w-3 opacity-60" />;
    case "read": return <CheckCheck className="h-3 w-3 text-sky-400" />;
    case "failed": return <AlertCircle className="h-3 w-3 text-destructive" />;
    default: return null;
  }
}

interface Template {
  id: string; nome: string; categoria: string | null;
  conteudo_texto: string | null; aprovado_meta: boolean | null; ativo: boolean | null;
}

function useTemplates(setor?: string) {
  return useQuery<Template[]>({
    queryKey: ["hub-templates", setor],
    queryFn: async () => {
      const { data, error } = await (supabaseHub as any)
        .from("whatsapp_templates").select("id,nome,categoria,conteudo_texto,aprovado_meta,ativo")
        .eq("ativo", true).order("nome").limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}

export function ChatWindow({ instanceId, telefone, nome, associadoId, atendimento }: Props) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { data: messages = [], isLoading } = useMessages(instanceId, telefone);
  const { data: templates = [] } = useTemplates(atendimento?.setor);
  const { data: instances = [] } = useWhatsAppInstances();
  const send = useSendMessage();
  const activeInstance = instances.find((i) => i.id === instanceId);
  const providerMeta = activeInstance?.tipo === "meta_oficial";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, telefone]);

  if (!telefone || !instanceId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-muted-foreground gap-3">
        <MessageSquare className="h-20 w-20 opacity-30" />
        <p className="text-lg">Selecione uma conversa pra começar</p>
        <p className="text-sm">Escolha em Minhas ou Fila do setor à esquerda</p>
      </div>
    );
  }

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    try {
      await send.mutateAsync({
        instance_id: instanceId,
        telefone,
        associado_id: associadoId ?? undefined,
        texto: msg,
      });
    } catch (e: any) {
      toast({ title: "Falha ao enviar", description: e.message, variant: "destructive" });
      setText(msg);
    }
  };

  const insertAtCursor = (s: string) => {
    const el = taRef.current;
    if (!el) { setText((v) => v + s); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + s + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + s.length;
    });
  };

  const stg = atendimento ? statusToStage(atendimento.status, atendimento.ai_runs_count) : null;
  const stageBadge = stg === "automacao" ? { Icon: Zap,  cls: "bg-orange-500/10 text-orange-700 border-orange-300",  label: "Automação" }
                   : stg === "ia"        ? { Icon: Bot,  cls: "bg-violet-500/10 text-violet-700 border-violet-300",  label: "IA"        }
                   : stg === "humano"    ? { Icon: User, cls: "bg-blue-500/10 text-blue-700 border-blue-300",        label: "Humano"    }
                   : stg === "aguardando"? { Icon: Clock,cls: "bg-amber-500/10 text-amber-700 border-amber-300",     label: "Aguardando"}
                   : stg === "resolvido" ? { Icon: UserCheck, cls: "bg-emerald-500/10 text-emerald-700 border-emerald-300", label: "Resolvido" }
                   : null;

  const header = nome || atendimento?.associado_nome || formatTel(telefone);

  const groups: { date: string; msgs: WhatsAppMessage[] }[] = [];
  let lastDate = "";
  for (const m of messages) {
    const d = new Date(m.criado_em).toLocaleDateString("pt-BR");
    if (d !== lastDate) { groups.push({ date: d, msgs: [] }); lastDate = d; }
    groups[groups.length - 1].msgs.push(m);
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-muted/20 min-w-0">
      {/* Provider strip — fixo no topo pra não confundir Meta vs UAZAPI */}
      {activeInstance && (
        <div className={cn(
          "px-4 py-1.5 flex items-center gap-2 text-[11px] font-semibold",
          providerMeta ? "bg-emerald-500/10 text-emerald-700 border-b border-emerald-200"
                       : "bg-indigo-500/10 text-indigo-700 border-b border-indigo-200",
        )}>
          {providerMeta ? <BadgeCheck className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
          <span>{providerMeta ? "META OFICIAL" : "UAZAPI"}</span>
          {activeInstance.nome && <span className="opacity-80">· {activeInstance.nome}</span>}
          {activeInstance.telefone && <span className="opacity-70 ml-auto">{activeInstance.telefone}</span>}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shadow-sm shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {(nome || atendimento?.associado_nome || "??").split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase() || "").join("") || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{header}</p>
            {stageBadge && (
              <Badge variant="outline" className={cn("text-[10px] gap-1 py-0 px-1.5", stageBadge.cls)}>
                <stageBadge.Icon className="h-2.5 w-2.5" /> {stageBadge.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatTel(telefone)}</span>
            {atendimento?.veiculo_placa && <span className="font-mono">· {atendimento.veiculo_placa}</span>}
            {atendimento?.protocolo && <span className="font-mono">· #{atendimento.protocolo.slice(-6)}</span>}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center pt-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-16">Nenhuma mensagem ainda. Mande a primeira.</div>
        ) : (
          groups.map((g, gi) => (
            <div key={gi} className="space-y-1.5">
              <div className="flex justify-center my-3">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">{g.date}</Badge>
              </div>
              {g.msgs.map((m) => {
                const mine = m.direction === "out";
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-3 py-2 shadow-sm",
                        mine
                          ? "bg-[#d9fdd3] dark:bg-emerald-900/30 text-foreground rounded-tr-none"
                          : "bg-white dark:bg-card text-foreground rounded-tl-none",
                      )}
                    >
                      {(m as any).colaborador_nome_snap && mine && (
                        <p className="text-[10px] font-semibold text-emerald-700 mb-0.5">
                          {(m as any).colaborador_nome_snap}
                        </p>
                      )}
                      {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                      {m.media_url && !m.body && <p className="text-xs text-muted-foreground italic">[{m.tipo}]</p>}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatTime(m.criado_em)}</span>
                        {mine && <StatusIcon status={m.status} />}
                      </div>
                      {m.error && <p className="text-[10px] text-destructive mt-1">{m.error}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input enriquecido */}
      <div className="px-3 py-2 border-t bg-background shrink-0">
        <div className="flex items-end gap-1">
          {/* Emojis */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="shrink-0 h-9 w-9" title="Emojis">
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 p-2">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_QUICK.map((e) => (
                  <button
                    key={e}
                    onClick={() => insertAtCursor(e)}
                    className="text-lg hover:bg-accent rounded p-1 transition-colors"
                  >{e}</button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Templates */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="shrink-0 h-9 w-9" title="Templates">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-80 p-0">
              <div className="p-3 border-b">
                <p className="text-xs font-semibold">Templates ({templates.length})</p>
                <p className="text-[10px] text-muted-foreground">Clique pra inserir no campo</p>
              </div>
              <ScrollArea className="h-64">
                {templates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">Sem templates cadastrados.</div>
                ) : templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => insertAtCursor(t.conteudo_texto || "")}
                    className="w-full text-left px-3 py-2 hover:bg-accent/50 border-b border-border/40"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium truncate flex-1">{t.nome}</p>
                      {t.aprovado_meta && <Badge variant="outline" className="text-[9px] py-0 px-1 text-emerald-700 border-emerald-300">META</Badge>}
                      {t.categoria && <Badge variant="secondary" className="text-[9px] py-0 px-1">{t.categoria}</Badge>}
                    </div>
                    {t.conteudo_texto && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.conteudo_texto}</p>
                    )}
                  </button>
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Anexo (disabled, placeholder) */}
          <Button size="icon" variant="ghost" className="shrink-0 h-9 w-9" disabled title="Anexo (em breve)">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Textarea */}
          <Textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="Escreva uma mensagem..."
            rows={1}
            className="resize-none min-h-9 max-h-32 text-sm bg-muted/30 border-0 focus-visible:ring-1"
          />

          {/* Áudio (disabled) */}
          <Button size="icon" variant="ghost" className="shrink-0 h-9 w-9" disabled title="Áudio (em breve)">
            <Mic className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Enviar */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={send.isPending || !text.trim()}
            className="shrink-0 h-9 w-9"
          >
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 ml-1">
          Enter = enviar · Shift+Enter = nova linha
        </p>
      </div>
    </div>
  );
}
