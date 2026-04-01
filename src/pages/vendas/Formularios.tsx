import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Formularios() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Formularios de Captura</h1>
        <p className="text-sm text-muted-foreground">Crie formularios para captar leads automaticamente</p>
      </div>

      <Card className="border border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Em desenvolvimento</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            O construtor de formularios de captura esta sendo desenvolvido.
            Em breve voce podera criar formularios personalizados que alimentam
            o pipeline automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
