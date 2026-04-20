import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Search, Phone, Car, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAlertas } from "@/hooks/useAlertas";

function formatBRL(v: number | string | null | undefined): string {
  if (v == null) return "R$ 0,00";
  const n = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

function formatTel(t: string | null | undefined): string {
  if (!t) return "—";
  const d = t.replace(/\D/g, "");
  if (d.length >= 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, -4)}-${d.slice(-4)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return t;
}

export default function Alertas() {
  const { alertasRevistoria, alertasInadimplencia, alertasVencimento } = useAlertas();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"revistoria" | "inadimplencia" | "vencimento">("revistoria");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const termD = term.replace(/\D/g, "");
    if (tab !== "revistoria") return [];
    let list = alertasRevistoria as any[];
    if (term) {
      list = list.filter((v) => {
        const byN = (v.nome || "").toLowerCase().includes(term);
        const byP = (v.placa || "").toLowerCase().includes(term);
        const byC = termD && (v.cpf || "").replace(/\D/g, "").includes(termD);
        const byT = termD && ((v.whatsapp || "") + (v.telefone || "")).replace(/\D/g, "").includes(termD);
        return byN || byP || byC || byT;
      });
    }
    return list;
  }, [alertasRevistoria, q, tab]);

  const kpis = {
    revistoria: (alertasRevistoria as any[]).length,
    inadimplencia: (alertasInadimplencia as any[]).length,
    vencimento: (alertasVencimento as any[]).length,
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" /> Alertas
          </h1>
          <p className="text-sm text-muted-foreground">
            Revistoria pendente, inadimplência, boletos próximos do vencimento.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setTab("revistoria")} className={`text-left rounded-lg border-2 p-4 transition ${tab === "revistoria" ? "border-yellow-500 bg-yellow-50" : "border-muted bg-background hover:border-muted-foreground/30"}`}>
          <div className="text-xs text-yellow-700 font-medium uppercase tracking-wider">Revistoria &gt;5d</div>
          <div className="text-2xl font-bold text-yellow-700">{kpis.revistoria}</div>
        </button>
        <button onClick={() => setTab("inadimplencia")} className={`text-left rounded-lg border-2 p-4 transition ${tab === "inadimplencia" ? "border-red-500 bg-red-50" : "border-muted bg-background hover:border-muted-foreground/30"}`}>
          <div className="text-xs text-red-700 font-medium uppercase tracking-wider">Inadimplentes</div>
          <div className="text-2xl font-bold text-red-700">{kpis.inadimplencia}</div>
        </button>
        <button onClick={() => setTab("vencimento")} className={`text-left rounded-lg border-2 p-4 transition ${tab === "vencimento" ? "border-blue-500 bg-blue-50" : "border-muted bg-background hover:border-muted-foreground/30"}`}>
          <div className="text-xs text-blue-700 font-medium uppercase tracking-wider">Vencendo em 3d</div>
          <div className="text-2xl font-bold text-blue-700">{kpis.vencimento}</div>
        </button>
      </div>

      {tab === "revistoria" && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF, placa, telefone..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="text-xs text-muted-foreground">{filtered.length} resultados</div>

            <div className="divide-y">
              {filtered.map((v: any) => (
                <div
                  key={v.veiculo_id}
                  className="py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 rounded px-2"
                  onClick={() => navigate(`/gestao/associado/${v.associado_id}`)}
                  title="Abrir associado"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{v.nome || "—"}</span>
                      {v.cpf && <span className="text-xs text-muted-foreground">CPF {v.cpf}</span>}
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 gap-1">
                        <AlertTriangle className="w-3 h-3" /> {v.dias_atraso}d atraso
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" /> <b>{v.placa || "—"}</b> · {v.marca || "?"} {v.modelo || ""} {v.ano || ""}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {formatTel(v.whatsapp || v.telefone)}
                      </span>
                      <span>{formatBRL(v.valor_devido)} vencidos</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum resultado</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "inadimplencia" && (
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground mb-3">{kpis.inadimplencia} mensalidades em atraso há mais de 5 dias.</div>
            <div className="divide-y">
              {(alertasInadimplencia as any[]).slice(0, 100).map((m: any) => (
                <div key={m.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <b>{m.associados?.nome || "—"}</b>
                    <span className="text-xs text-muted-foreground ml-2">CPF {m.associados?.cpf || "—"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatBRL(m.valor)} · venc {new Date(m.data_vencimento).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "vencimento" && (
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground mb-3">{kpis.vencimento} boletos vencendo nos próximos 3 dias.</div>
            <div className="divide-y">
              {(alertasVencimento as any[]).slice(0, 100).map((m: any) => (
                <div key={m.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <b>{m.associados?.nome || "—"}</b>
                    <span className="text-xs text-muted-foreground ml-2">CPF {m.associados?.cpf || "—"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatBRL(m.valor)} · venc {new Date(m.data_vencimento).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
