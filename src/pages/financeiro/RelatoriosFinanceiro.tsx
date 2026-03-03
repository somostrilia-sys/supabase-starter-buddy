import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RelatoriosFinanceiro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios Financeiros</h1>
        <p className="text-muted-foreground text-sm">Análises e relatórios do módulo financeiro</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Em desenvolvimento</p>
          <p className="text-sm">Este módulo será implementado em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
