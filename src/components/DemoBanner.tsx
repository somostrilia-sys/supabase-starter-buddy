import { AlertTriangle } from "lucide-react";

export function DemoBanner({ message }: { message?: string }) {
  return (
    <div className="mx-4 mt-4 mb-2 flex items-center gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning-foreground">
      <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
      <span className="font-medium">
        {message || "⚠️ Dados de demonstração — módulo em desenvolvimento"}
      </span>
    </div>
  );
}
