import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CalDeal {
  id: string;
  nome: string;
  etapa: string;
  created_at: string;
  updated_at: string;
}

const etapaCores: Record<string, string> = {
  prospeccao: "bg-blue-500",
  qualificacao: "bg-yellow-500",
  proposta: "bg-purple-500",
  negociacao: "bg-orange-500",
  fechamento: "bg-green-500",
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function Calendario() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: deals = [], isLoading } = useQuery<CalDeal[]>({
    queryKey: ["calendario-deals", month, year],
    queryFn: async () => {
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const { data, error } = await (supabase as any)
        .from("negociacoes")
        .select("id, lead_nome, stage, created_at, updated_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at");
      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        nome: d.lead_nome || "Sem nome",
        etapa: d.stage || "lead",
        created_at: d.created_at,
        updated_at: d.updated_at,
      }));
    },
  });

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);

    return grid;
  }, [month, year]);

  // Group deals by day
  const dealsByDay = useMemo(() => {
    const map: Record<number, CalDeal[]> = {};
    deals.forEach(deal => {
      const d = new Date(deal.created_at).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(deal);
    });
    return map;
  }, [deals]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function goToday() {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const selectedDeals = selectedDay ? (dealsByDay[selectedDay] || []) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground">
            {deals.length} negociação{deals.length !== 1 ? "ões" : ""} em {meses[month]} {year}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={goToday}>Hoje</Button>
      </div>

      <Card className="border border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base">{meses[month]} {year}</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="grid grid-cols-7 mb-2">
                {diasSemana.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const dayDeals = day ? (dealsByDay[day] || []) : [];
                  const hasDeals = dayDeals.length > 0;

                  return (
                    <div
                      key={idx}
                      className={`
                        min-h-[80px] border border-border/20 p-1 transition-colors
                        ${day ? "cursor-pointer hover:bg-muted/30" : "bg-muted/10"}
                        ${isToday(day!) ? "bg-primary/5 border-primary/30" : ""}
                      `}
                      onClick={() => day && setSelectedDay(day)}
                    >
                      {day && (
                        <>
                          <div className={`
                            text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full
                            ${isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"}
                          `}>
                            {day}
                          </div>
                          {hasDeals && (
                            <div className="space-y-0.5">
                              {dayDeals.slice(0, 2).map(deal => (
                                <div
                                  key={deal.id}
                                  className="text-[9px] leading-tight truncate px-1 py-0.5 rounded bg-muted/50"
                                  title={deal.nome}
                                >
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${etapaCores[deal.etapa] || "bg-gray-400"}`} />
                                  {deal.nome}
                                </div>
                              ))}
                              {dayDeals.length > 2 && (
                                <div className="text-[9px] text-muted-foreground px-1">
                                  +{dayDeals.length - 2} mais
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Day detail dialog */}
      <Dialog open={selectedDay !== null} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {selectedDay} de {meses[month]} de {year}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma negociação neste dia.
              </p>
            ) : (
              selectedDeals.map(deal => (
                <Card key={deal.id} className="border border-border/40">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${etapaCores[deal.etapa] || "bg-gray-400"}`} />
                          <span className="text-sm font-medium truncate">{deal.nome}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 ml-4">
                          {new Date(deal.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {deal.etapa}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
