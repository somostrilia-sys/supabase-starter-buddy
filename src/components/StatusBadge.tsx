import { cn } from "@/lib/utils";

type StatusType = "ativo" | "inativo" | "pendente" | "inadimplente" | "suspenso" | "cancelado" | "negado" | "pendente_revistoria" | "inativo_pendencia" | "pago" | "atrasado" | "aberto" | "em_analise" | "aprovado" | "reprovado" | "concluido" | "vencido";

const statusConfig: Record<string, { dot: string; label?: string; pulse: boolean }> = {
  ativo:                { dot: "bg-[hsl(110_58%_36%)]",  pulse: true },
  pago:                 { dot: "bg-[hsl(110_58%_36%)]",  pulse: true },
  aprovado:             { dot: "bg-[hsl(110_58%_36%)]",  pulse: true },
  aprovada:             { dot: "bg-[hsl(110_58%_36%)]",  pulse: true },
  concluido:            { dot: "bg-[hsl(110_58%_36%)]",  pulse: false },
  "concluído":          { dot: "bg-[hsl(110_58%_36%)]",  pulse: false },
  assinado:             { dot: "bg-[hsl(110_58%_36%)]",  pulse: false },

  inadimplente:         { dot: "bg-[hsl(0_70%_55%)]",    pulse: true },
  atrasado:             { dot: "bg-[hsl(0_70%_55%)]",    pulse: true },
  cancelado:            { dot: "bg-[hsl(0_70%_55%)]",    pulse: true },
  negado:               { dot: "bg-[hsl(0_70%_55%)]",    pulse: true },
  reprovado:            { dot: "bg-[hsl(0_70%_55%)]",    pulse: true },
  reprovada:            { dot: "bg-[hsl(0_70%_55%)]",    pulse: true },
  vencido:              { dot: "bg-[hsl(0_70%_55%)]",    pulse: true },

  pendente:             { dot: "bg-[hsl(38_85%_50%)]",   pulse: true },
  pendente_revistoria:  { dot: "bg-[hsl(38_85%_50%)]",   pulse: true },
  "pendente de revistoria": { dot: "bg-[hsl(38_85%_50%)]", pulse: true },
  em_analise:           { dot: "bg-[hsl(38_85%_50%)]",   pulse: true },
  "em análise":         { dot: "bg-[hsl(38_85%_50%)]",   pulse: true },
  aberto:               { dot: "bg-[hsl(38_85%_50%)]",   pulse: true },

  suspenso:             { dot: "bg-[hsl(210_70%_55%)]",  pulse: true },

  inativo:              { dot: "bg-[hsl(40_5%_55%)]",    pulse: false },
  inativo_pendencia:    { dot: "bg-[hsl(40_5%_55%)]",    pulse: false },
  "inativo com pendência": { dot: "bg-[hsl(40_5%_55%)]", pulse: false },
  "inativo com pendencia":  { dot: "bg-[hsl(40_5%_55%)]", pulse: false },
};

function normalize(status: string): string {
  return status.toLowerCase().trim();
}

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = normalize(status);
  const config = statusConfig[key] || { dot: "bg-[hsl(40_5%_55%)]", pulse: false };
  const displayLabel = label || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-muted/60 text-foreground whitespace-nowrap select-none transition-all duration-150 hover:-translate-y-px hover:shadow-sm",
        className
      )}
    >
      <span className="relative flex-shrink-0 w-2 h-2">
        <span className={cn("absolute inset-0 rounded-full", config.dot)} />
        {config.pulse && (
          <span className={cn("absolute -inset-[3px] rounded-full opacity-40 animate-status-pulse", config.dot)} />
        )}
      </span>
      {displayLabel}
    </span>
  );
}

/** Helper to use StatusBadge as a drop-in replacement for inline badge classes */
export function getStatusType(status: string): string {
  return normalize(status);
}
