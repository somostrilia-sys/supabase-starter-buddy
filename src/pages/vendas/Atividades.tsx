import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone, Mail, MessageCircle, Users, MapPin, Calendar, Clock,
  LayoutGrid, List, CalendarDays, AlertTriangle, ExternalLink,
  ChevronLeft, ChevronRight,
} from "lucide-react";

const tipoIcons: Record<string, any> = { Ligar: Phone, Email: Mail, WhatsApp: MessageCircle, Reunião: Users, Visita: MapPin };
const statusColors: Record<string, string> = {
  Pendente: "bg-[#F59E0B]/20 text-[#F59E0B]",
  "Em Andamento": "bg-[#3B82F6]/20 text-[#3B82F6]",
  "Concluída": "bg-[#22C55E]/20 text-[#22C55E]",
  Atrasada: "bg-destructive/20 text-destructive",
};

const responsaveis = ["Maria Santos","João Pedro","Ana Costa","Carlos Lima","Fernanda Alves"];
const tipos = ["Ligar","Email","WhatsApp","Reunião","Visita"];
const statuses = ["Pendente","Em Andamento","Concluída","Atrasada"];
const now = Date.now();
const day = 86400000;

interface Atividade {
  id: string; tipo: string; titulo: string; responsavel: string;
  data: string; negociacao: string; status: string;
}

const mockAtividades: Atividade[] = Array.from({length: 20}).map((_, i) => ({
  id: `at${i}`,
  tipo: tipos[i % 5],
  titulo: [
    "Ligar para apresentar planos","Enviar proposta por email","Responder mensagem WhatsApp",
    "Reunião de fechamento","Visita para vistoria","Follow-up cotação","Enviar contrato",
    "Confirmar dados","Agendar vistoria","Negociar desconto","Enviar boleto adesão",
    "Retorno cliente","Apresentar coberturas","Coletar documentos","Verificar FIPE",
    "Enviar link vistoria","Confirmar pagamento","Reenviar proposta","Atualizar cadastro","Fechar contrato"
  ][i],
  responsavel: responsaveis[i % 5],
  data: new Date(now - (i - 5) * day + (i % 3) * 3600000).toISOString(),
  negociacao: `NEG-2026-${String(40 + i).padStart(4, "0")}`,
  status: i < 3 ? "Atrasada" : i < 8 ? "Pendente" : i < 14 ? "Concluída" : "Em Andamento",
}));

function fmtDateTime(d: string) { return new Date(d).toLocaleString("pt-BR", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}); }

export default function Atividades() {
  const [viewMode, setViewMode] = useState<"lista"|"kanban"|"calendario">("lista");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number|null>(null);

  const atrasadas = mockAtividades.filter(a => a.status === "Atrasada").length;

  const filtered = useMemo(() => {
    let list = mockAtividades;
    if (filterStatus !== "todos") list = list.filter(a => a.status === filterStatus);
    if (filterTipo !== "todos") list = list.filter(a => a.tipo === filterTipo);
    return list;
  }, [filterStatus, filterTipo]);

  const kanbanCols = ["Pendente","Em Andamento","Concluída","Atrasada"];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  const actsByDay = useMemo(() => {
    const map: Record<number, Atividade[]> = {};
    mockAtividades.forEach(a => {
      const d = new Date(a.data);
      if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
        const dayNum = d.getDate();
        if (!map[dayNum]) map[dayNum] = [];
        map[dayNum].push(a);
      }
    });
    return map;
  }, [calMonth, calYear]);

  function ActivityCard({ act }: { act: Atividade }) {
    const Icon = tipoIcons[act.tipo] || Clock;
    return (
      <div className="p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10"><Icon className="h-3.5 w-3.5 text-primary" /></div>
            <span className="text-xs font-semibold">{act.titulo}</span>
          </div>
          <Badge className={`text-[9px] border-0 ${statusColors[act.status]}`}>{act.status}</Badge>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Avatar className="h-4 w-4"><AvatarFallback className="text-[7px] bg-primary/20 text-primary">{act.responsavel.charAt(0)}</AvatarFallback></Avatar>
            {act.responsavel}
          </div>
          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDateTime(act.data)}</div>
          <div className="flex items-center gap-1 text-primary cursor-pointer"><ExternalLink className="h-3 w-3" />{act.negociacao}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">{filtered.length} atividades</p>
            {atrasadas > 0 && (
              <Badge className="bg-destructive/20 text-destructive border-0 text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />{atrasadas} atrasada(s)
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg overflow-hidden">
            <Button size="icon" variant={viewMode==="lista"?"default":"ghost"} className="rounded-none h-9 w-9" onClick={()=>setViewMode("lista")}><List className="h-4 w-4" /></Button>
            <Button size="icon" variant={viewMode==="kanban"?"default":"ghost"} className="rounded-none h-9 w-9" onClick={()=>setViewMode("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
            <Button size="icon" variant={viewMode==="calendario"?"default":"ghost"} className="rounded-none h-9 w-9" onClick={()=>setViewMode("calendario")}><CalendarDays className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {viewMode === "lista" && (
        <div className="space-y-2">
          {filtered.map(act => <ActivityCard key={act.id} act={act} />)}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Nenhuma atividade encontrada</p>}
        </div>
      )}

      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 min-h-[60vh]">
          {kanbanCols.map(col => {
            const colActs = filtered.filter(a => a.status === col);
            return (
              <div key={col} className="flex flex-col rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
                <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                  <Badge className={`text-[9px] border-0 ${statusColors[col]}`}>{col}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground">{colActs.length}</span>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[55vh]">
                  {colActs.map(act => <ActivityCard key={act.id} act={act} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "calendario" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-semibold">{monthNames[calMonth]} {calYear}</span>
            <Button variant="ghost" size="icon" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {Array.from({length: firstDayOfWeek}).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({length: daysInMonth}).map((_, i) => {
              const d = i + 1;
              const acts = actsByDay[d] || [];
              const isSelected = selectedDay === d;
              return (
                <div key={d} onClick={() => setSelectedDay(isSelected ? null : d)}
                  className={`p-1 rounded-lg border cursor-pointer transition-colors min-h-[60px] ${isSelected ? "border-primary bg-primary/5" : "border-border/30 hover:bg-muted/30"}`}>
                  <span className="text-xs font-medium">{d}</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap">
                    {acts.slice(0,3).map((a,j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full" style={{
                        backgroundColor: a.status === "Atrasada" ? "#EF4444" : a.status === "Concluída" ? "#22C55E" : a.status === "Em Andamento" ? "#3B82F6" : "#F59E0B"
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedDay && actsByDay[selectedDay] && (
            <Card className="border border-border/50">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">{selectedDay}/{String(calMonth+1).padStart(2,"0")}/{calYear}</p>
                {actsByDay[selectedDay].map(act => <ActivityCard key={act.id} act={act} />)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
