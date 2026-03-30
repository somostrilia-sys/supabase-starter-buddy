import { Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Boletos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Boletos Recebidos</h1>
        <p className="text-muted-foreground text-sm">Controle de boletos recebidos</p>
      </div>
      <Card className="border border-border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Receipt className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Em desenvolvimento</p>
          <p className="text-sm">Este módulo será implementado em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
