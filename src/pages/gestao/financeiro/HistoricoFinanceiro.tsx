import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Upload, XCircle, Mail, Receipt, CreditCard, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const tipoIcon: Record<string, typeof FileText> = {
  lote_gerado: FileText,
  remessa: Upload,
  retorno: Upload,
  cancelamento: XCircle,
  cobranca: Mail,
  recibo: Receipt,
};

const tipoCor: Record<string, string> = {
  lote_gerado: "bg-primary/8 text-primary dark:bg-blue-900 dark:text-blue-300",
  remessa: "bg-warning/10 text-warning dark:bg-yellow-900 dark:text-yellow-300",
  retorno: "bg-success/10 text-success dark:bg-green-900 dark:text-green-300",
  cancelamento: "bg-destructive/8 text-destructive dark:bg-red-900 dark:text-red-300",
  cobranca: "bg-accent/8 text-accent dark:bg-purple-900 dark:text-purple-300",
  recibo: "bg-success/10 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

export default function HistoricoFinanceiro({ onBack }: { onBack: () => void }) {
  const [boletos, setBoletos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBoletos() {
      setLoading(true);
      const { data, error } = await supabase
        .from("boletos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setBoletos(data);
      setLoading(false);
    }
    fetchBoletos();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Histórico Financeiro</h2>
          <p className="text-sm text-muted-foreground">Timeline de todas as movimentações financeiras</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando histórico...</span>
        </div>
      ) : boletos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</div>
      ) : (
        /* Timeline */
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {boletos.map((item) => {
              const tipo = item.tipo || item.status || "lote_gerado";
              const Icon = tipoIcon[tipo] || Clock;
              const descricao = item.associado_nome
                ? `${item.associado_nome} — Nosso Nº ${item.nosso_numero || "N/A"} — R$ ${Number(item.valor || 0).toFixed(2)} — ${item.status}`
                : `Boleto #${item.id} — R$ ${Number(item.valor || 0).toFixed(2)} — ${item.status}`;
              const data = item.created_at
                ? new Date(item.created_at).toLocaleString("pt-BR")
                : "";
              return (
                <div key={item.id} className="relative flex items-start gap-4 pl-12">
                  <div className="absolute left-4 top-1 w-5 h-5 rounded-full border-2 bg-background border-primary flex items-center justify-center">
                    <Icon className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <Card className="flex-1">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{descricao}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={tipoCor[tipo] || "bg-muted text-muted-foreground"}>{(item.tipo || item.status || "").replace("_", " ")}</Badge>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{data}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Em breve */}
      <Card className="border-dashed">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">Cartão de Crédito</p>
            <p className="text-sm text-muted-foreground">Integração com pagamentos via cartão de crédito — Em breve</p>
          </div>
          <Badge variant="outline" className="ml-auto">Em breve</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
