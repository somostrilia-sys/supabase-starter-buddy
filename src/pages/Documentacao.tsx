import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Documentacao() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentação</h1>
        <p className="text-muted-foreground text-sm">Gestão de documentos dos associados</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Em desenvolvimento</p>
          <p className="text-sm">Este módulo será implementado em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
