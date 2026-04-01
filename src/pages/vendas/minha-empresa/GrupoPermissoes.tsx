import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GrupoContagem {
  grupo: string;
  count: number;
}

const permissoesPorGrupo: Record<string, { descricao: string; permissoes: string[] }> = {
  Consultor: {
    descricao: "Acesso restrito as proprias cotacoes",
    permissoes: [
      "Ve somente suas proprias cotacoes",
      "Pode criar novas cotacoes",
      "Acesso ao pipeline pessoal",
    ],
  },
  Gestor: {
    descricao: "Gestao da cooperativa",
    permissoes: [
      "Ve cotacoes de toda a cooperativa",
      "Acesso a relatorios da cooperativa",
      "Pode reatribuir cotacoes entre consultores",
    ],
  },
  "Gestor sul": {
    descricao: "Gestao da regional Sul",
    permissoes: [
      "Ve cotacoes da cooperativa (regional Sul)",
      "Acesso a relatorios da regional",
      "Mesmas permissoes de Gestor para a regional Sul",
    ],
  },
  Diretor: {
    descricao: "Acesso total ao sistema",
    permissoes: [
      "Ve todas as cotacoes de todas as cooperativas",
      "Pode deletar cotacoes e registros",
      "Acesso completo a relatorios e configuracoes",
      "Gerenciamento de usuarios e permissoes",
    ],
  },
};

export default function GrupoPermissoes() {
  const { data: grupos, isLoading } = useQuery({
    queryKey: ["grupo_permissao_contagem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("grupo_permissao");
      if (error) throw error;

      const contagem: Record<string, number> = {};
      (data || []).forEach((u: { grupo_permissao: string | null }) => {
        const grupo = u.grupo_permissao || "Sem grupo";
        contagem[grupo] = (contagem[grupo] || 0) + 1;
      });

      const result: GrupoContagem[] = Object.entries(contagem)
        .map(([grupo, count]) => ({ grupo, count }))
        .sort((a, b) => b.count - a.count);

      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando grupos...</span>
      </div>
    );
  }

  const totalUsuarios = grupos?.reduce((sum, g) => sum + g.count, 0) || 0;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div>
            <CardTitle className="text-lg">Grupo de Permissoes</CardTitle>
            <CardDescription>
              Perfis de acesso baseados no campo grupo_permissao da tabela usuarios ({totalUsuarios} usuarios total)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!grupos || grupos.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum usuario encontrado na tabela usuarios.
            </p>
          ) : (
            grupos.map((grupo) => {
              const info = permissoesPorGrupo[grupo.grupo];
              return (
                <div
                  key={grupo.grupo}
                  className="flex flex-col gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{grupo.grupo}</p>
                        <p className="text-xs text-muted-foreground">
                          {info?.descricao || "Grupo personalizado"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {grupo.count} usuario{grupo.count !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {info && (
                    <div className="ml-14 space-y-1">
                      {info.permissoes.map((perm, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                          {perm}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
