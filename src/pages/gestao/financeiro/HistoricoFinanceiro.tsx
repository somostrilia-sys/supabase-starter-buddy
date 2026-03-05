import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Upload, XCircle, Mail, Receipt, CreditCard, Clock } from "lucide-react";
import { mockHistorico } from "./mockFinanceiro";

const tipoIcon: Record<string, typeof FileText> = {
  lote_gerado: FileText,
  remessa: Upload,
  retorno: Upload,
  cancelamento: XCircle,
  cobranca: Mail,
  recibo: Receipt,
};

const tipoCor: Record<string, string> = {
  lote_gerado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  remessa: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  retorno: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelamento: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cobranca: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  recibo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

export default function HistoricoFinanceiro({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold">Histórico Financeiro</h2>
          <p className="text-sm text-muted-foreground">Timeline de todas as movimentações financeiras</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {mockHistorico.map((item) => {
            const Icon = tipoIcon[item.tipo] || Clock;
            return (
              <div key={item.id} className="relative flex items-start gap-4 pl-12">
                <div className="absolute left-4 top-1 w-5 h-5 rounded-full border-2 bg-background border-primary flex items-center justify-center">
                  <Icon className="h-2.5 w-2.5 text-primary" />
                </div>
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.descricao}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={tipoCor[item.tipo] || "bg-muted text-muted-foreground"}>{item.tipo.replace("_", " ")}</Badge>
                          <span className="text-xs text-muted-foreground">por {item.usuario}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.data}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

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
