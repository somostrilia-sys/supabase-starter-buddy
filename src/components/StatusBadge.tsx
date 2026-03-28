import { cn } from "@/lib/utils";

type StatusType = "ativo" | "inativo" | "pendente" | "inadimplente" | "suspenso" | "cancelado" | "negado" | "pendente_revistoria" | "inativo_pendencia" | "pago" | "atrasado" | "aberto" | "em_analise" | "aprovado" | "reprovado" | "concluido" | "vencido";

const statusConfig: Record<string, { dot: string; bg: string; pulse: boolean }> = {
  ativo:                { dot: "bg-success",         bg: "bg-success/10 text-success",         pulse: false },
  pago:                 { dot: "bg-success",         bg: "bg-success/10 text-success",         pulse: false },
  aprovado:             { dot: "bg-success",         bg: "bg-success/10 text-success",         pulse: false },
  aprovada:             { dot: "bg-success",         bg: "bg-success/10 text-success",         pulse: false },
  concluido:            { dot: "bg-success",         bg: "bg-success/10 text-success",         pulse: false },
  "concluído":          { dot: "bg-success",         bg: "bg-success/10 text-success",         pulse: false },
  assinado:             { dot: "bg-success",         bg: "bg-success/10 text-success",         pulse: false },

  inadimplente:         { dot: "bg-destructive",     bg: "bg-destructive/8 text-destructive",  pulse: false },
  atrasado:             { dot: "bg-destructive",     bg: "bg-destructive/8 text-destructive",  pulse: false },
  cancelado:            { dot: "bg-destructive",     bg: "bg-destructive/8 text-destructive",  pulse: false },
  negado:               { dot: "bg-destructive",     bg: "bg-destructive/8 text-destructive",  pulse: false },
  reprovado:            { dot: "bg-destructive",     bg: "bg-destructive/8 text-destructive",  pulse: false },
  reprovada:            { dot: "bg-destructive",     bg: "bg-destructive/8 text-destructive",  pulse: false },
  vencido:              { dot: "bg-destructive",     bg: "bg-destructive/8 text-destructive",  pulse: false },

  pendente:             { dot: "bg-warning",         bg: "bg-warning/10 text-warning",         pulse: false },
  pendente_revistoria:  { dot: "bg-warning",         bg: "bg-warning/10 text-warning",         pulse: false },
  "pendente de revistoria": { dot: "bg-warning",     bg: "bg-warning/10 text-warning",         pulse: false },
  em_analise:           { dot: "bg-warning",         bg: "bg-warning/10 text-warning",         pulse: false },
  "em análise":         { dot: "bg-warning",         bg: "bg-warning/10 text-warning",         pulse: false },
  aberto:               { dot: "bg-warning",         bg: "bg-warning/10 text-warning",         pulse: false },

  suspenso:             { dot: "bg-accent",          bg: "bg-accent/10 text-accent",           pulse: false },

  inativo:              { dot: "bg-muted-foreground/50", bg: "bg-muted/60 text-muted-foreground", pulse: false },
  inativo_pendencia:    { dot: "bg-muted-foreground/50", bg: "bg-muted/60 text-muted-foreground", pulse: false },
  "inativo com pendência": { dot: "bg-muted-foreground/50", bg: "bg-muted/60 text-muted-foreground", pulse: false },
  "inativo com pendencia":  { dot: "bg-muted-foreground/50", bg: "bg-muted/60 text-muted-foreground", pulse: false },
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
  const config = statusConfig[key] || { dot: "bg-muted-foreground/50", bg: "bg-muted/60 text-muted-foreground", pulse: false };
  const displayLabel = label || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap select-none transition-all duration-150",
        config.bg,
        className
      )}
    >
      <span className={cn("flex-shrink-0 w-1.5 h-1.5 rounded-full", config.dot)} />
      {displayLabel}
    </span>
  );
}

/** Helper to use StatusBadge as a drop-in replacement for inline badge classes */
export function getStatusType(status: string): string {
  return normalize(status);
}
