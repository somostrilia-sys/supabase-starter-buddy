// GIA Gestão — Painel WhatsApp estilo Meta Business Inbox
// 3 colunas: Atendimentos | Chat | Contexto
// Header: funil Automação → IA → Humano com contagens do setor
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useWhatsAppInstances, useConversations, useInstancesRealtime,
} from "@/hooks/useWhatsApp";
import {
  useAttendanceCounts,
  type Atendimento,
} from "@/hooks/useHubAtendimentos";
import { AttendanceList, type ProviderFilter } from "@/components/whatsapp/AttendanceList";
import { AttendanceContext } from "@/components/whatsapp/AttendanceContext";
import { ChatWindow } from "@/components/whatsapp/ChatWindow";
import { ChatList } from "@/components/whatsapp/ChatList";
import { QRConnect } from "@/components/whatsapp/QRConnect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Wifi, WifiOff, QrCode, Inbox, MessageSquare,
  Zap, Bot, User, Clock, ArrowRight,
} from "lucide-react";
import type { WhatsAppConversation, WhatsAppInstance } from "@/types/whatsapp";
import { cn } from "@/lib/utils";

function FunilBadge({
  label, count, Icon, color, isLast,
}: { label: string; count: number; Icon: any; color: "orange"|"violet"|"blue"|"amber"; isLast?: boolean }) {
  const clsMap = {
    orange: "bg-orange-500/10 text-orange-700 border-orange-300",
    violet: "bg-violet-500/10 text-violet-700 border-violet-300",
    blue:   "bg-blue-500/10 text-blue-700 border-blue-300",
    amber:  "bg-amber-500/10 text-amber-700 border-amber-300",
  };
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium",
        clsMap[color],
      )}>
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
        <Badge variant="secondary" className="h-5 min-w-6 px-1.5 text-[11px] font-bold bg-white/70">
          {count}
        </Badge>
      </div>
      {!isLast && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}

export default function Conversas() {
  useInstancesRealtime();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin" || profile?.role === "diretor";
  const userName = profile?.full_name || user?.email?.split("@")[0] || "Atendente";
  const userId = user?.id ?? null;

  const [selectedAtend, setSelectedAtend] = useState<Atendimento | null>(null);
  const [tabPage, setTabPage] = useState<"atendimentos" | "conversas">("atendimentos");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("meta");
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<WhatsAppConversation | null>(null);
  const [qrInstance, setQrInstance] = useState<WhatsAppInstance | null>(null);

  const { data: instances = [], isLoading } = useWhatsAppInstances();
  const counts = useAttendanceCounts();

  const activeInstanceId = selectedInstanceId
    ?? instances.find((i) => i.is_default_central)?.id
    ?? instances[0]?.id
    ?? null;
  const activeInstance = instances.find((i) => i.id === activeInstanceId) ?? null;

  const { data: conversations = [], isLoading: loadingConv } = useConversations(activeInstanceId);

  const sortedInstances = useMemo(() => {
    return [...instances].sort((a, b) => {
      const order = { central: 0, meta_oficial: 1, colaborador: 2 } as any;
      return (order[a.tipo] ?? 9) - (order[b.tipo] ?? 9);
    });
  }, [instances]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header com funil e ações */}
      <div className="px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              WhatsApp — Gestão
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logado como <span className="font-medium">{userName}</span>
              {isAdmin && <Badge variant="outline" className="ml-2 text-[10px]">admin</Badge>}
            </p>
          </div>

          {/* Funil Automação → IA → Humano */}
          <div className="flex items-center gap-2 flex-wrap">
            <FunilBadge label="Automação" count={counts.data?.automacao  ?? 0} Icon={Zap}   color="orange" />
            <FunilBadge label="IA"        count={counts.data?.ia         ?? 0} Icon={Bot}   color="violet" />
            <FunilBadge label="Humano"    count={counts.data?.humano     ?? 0} Icon={User}  color="blue"   />
            <FunilBadge label="Aguardando" count={counts.data?.aguardando ?? 0} Icon={Clock} color="amber"  isLast />
          </div>
        </div>

        {/* Tab top: Atendimentos (Hub) | Conversas brutas (por instância) */}
        <Tabs value={tabPage} onValueChange={(v) => setTabPage(v as any)} className="mt-3">
          <TabsList>
            <TabsTrigger value="atendimentos" className="gap-1.5">
              <Inbox className="h-3.5 w-3.5" /> Atendimentos
            </TabsTrigger>
            <TabsTrigger value="conversas" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Conversas por instância
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conteúdo */}
      {tabPage === "atendimentos" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Coluna 1: Lista de atendimentos (Minhas/Fila/Todas) */}
          <div className="w-[340px] shrink-0">
            <AttendanceList
              userId={userId}
              userName={userName}
              isAdmin={isAdmin}
              selectedId={selectedAtend?.id ?? null}
              onSelect={setSelectedAtend}
              provider={providerFilter}
              onProviderChange={setProviderFilter}
            />
          </div>

          {/* Coluna 2: Chat */}
          <ChatWindow
            instanceId={selectedAtend?.instance_id ?? null}
            telefone={selectedAtend?.telefone ?? null}
            nome={selectedAtend?.associado_nome ?? null}
            associadoId={selectedAtend?.associado_id ?? null}
            atendimento={selectedAtend}
          />

          {/* Coluna 3: Painel de contexto */}
          <AttendanceContext
            atendimento={selectedAtend}
            userId={userId}
            userName={userName}
          />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Coluna 1: Instâncias (ícones verticais) */}
          <div className="w-16 border-r bg-muted/30 flex flex-col items-center py-3 gap-2 shrink-0">
            {sortedInstances.length === 0 && (
              <div className="text-[10px] text-muted-foreground text-center px-1">Sem instâncias</div>
            )}
            {sortedInstances.map((inst) => {
              const isActive = inst.id === activeInstanceId;
              const connected = inst.status === "connected";
              const letter =
                inst.tipo === "meta_oficial" ? "M" :
                inst.tipo === "central" ? "C" :
                (inst.nome[0]?.toUpperCase() ?? "?");
              return (
                <button
                  key={inst.id}
                  onClick={() => { setSelectedInstanceId(inst.id); setSelectedConv(null); }}
                  className={cn(
                    "relative h-11 w-11 rounded-xl flex items-center justify-center font-bold transition-all",
                    isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-muted/30" : "",
                    inst.tipo === "central" ? "bg-primary/10 text-primary" :
                    inst.tipo === "meta_oficial" ? "bg-emerald-500/10 text-emerald-600" :
                    "bg-muted text-muted-foreground",
                  )}
                  title={`${inst.nome} — ${inst.status}`}
                >
                  {letter}
                  <span className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                    connected ? "bg-emerald-500" : inst.status === "qr_pending" ? "bg-amber-500" : "bg-muted-foreground/50",
                  )} />
                </button>
              );
            })}
          </div>

          {/* Coluna 2: Lista de conversas brutas */}
          <div className="w-80 shrink-0 flex flex-col border-r">
            {activeInstance && (
              <div className="p-3 border-b bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{activeInstance.nome}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {activeInstance.status === "connected" ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                          <Wifi className="h-2.5 w-2.5 mr-1" /> {activeInstance.telefone || "Online"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          <WifiOff className="h-2.5 w-2.5 mr-1" /> {activeInstance.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {activeInstance.status !== "connected" && activeInstance.tipo !== "meta_oficial" && (
                    <Button size="sm" variant="outline" onClick={() => setQrInstance(activeInstance)}>
                      <QrCode className="h-3.5 w-3.5 mr-1" /> Conectar
                    </Button>
                  )}
                </div>
              </div>
            )}
            <ChatList
              conversations={conversations}
              selectedPhone={selectedConv?.telefone ?? null}
              onSelect={setSelectedConv}
              loading={loadingConv}
            />
          </div>

          {/* Coluna 3: Chat */}
          <ChatWindow
            instanceId={activeInstanceId}
            telefone={selectedConv?.telefone ?? null}
            nome={selectedConv?.associado_nome ?? null}
            associadoId={selectedConv?.associado_id ?? null}
          />

          <QRConnect
            instance={qrInstance}
            open={!!qrInstance}
            onOpenChange={(v) => { if (!v) setQrInstance(null); }}
          />
        </div>
      )}
    </div>
  );
}
