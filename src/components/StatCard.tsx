import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("border border-border shadow-sm hover:shadow-md card-glow animate-fade-in-up", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            {trend && (
              <p className={cn("text-xs font-semibold", trend.value >= 0 ? "text-success" : "text-destructive")}>
                {trend.value >= 0 ? "▲ +" : "▼ "}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/8 border border-primary/15">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
