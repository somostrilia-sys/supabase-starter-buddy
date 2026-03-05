import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const tags = [
  { nome: "VIP", cor: "#EF4444", qtd: 18, etapas: { "Novo Lead": 3, "Em Negociação": 5, "Concretizadas": 10 } },
  { nome: "Frota", cor: "#8B5CF6", qtd: 12, etapas: { "Novo Lead": 2, "Em Negociação": 4, "Ag. Vistoria": 3, "Concretizadas": 3 } },
  { nome: "Indicação", cor: "#22C55E", qtd: 25, etapas: { "Novo Lead": 8, "Em Negociação": 7, "Concretizadas": 10 } },
  { nome: "Reativação", cor: "#F59E0B", qtd: 9, etapas: { "Novo Lead": 4, "Em Negociação": 3, "Concretizadas": 2 } },
  { nome: "Campanha Verão", cor: "#06B6D4", qtd: 15, etapas: { "Novo Lead": 6, "Em Negociação": 5, "Concretizadas": 4 } },
  { nome: "Prioridade", cor: "#F97316", qtd: 7, etapas: { "Em Negociação": 3, "Ag. Vistoria": 2, "Concretizadas": 2 } },
];

export default function GrupoTagsTab() {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-xs">Tag</TableHead>
            <TableHead className="text-xs text-right">Cotações</TableHead>
            <TableHead className="text-xs">Distribuição por Etapa</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {tags.map(t => (
              <TableRow key={t.nome}>
                <TableCell>
                  <Badge className="text-white text-xs" style={{ backgroundColor: t.cor }}>{t.nome}</Badge>
                </TableCell>
                <TableCell className="text-right font-bold">{t.qtd}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(t.etapas).map(([etapa, qtd]) => (
                      <Badge key={etapa} variant="outline" className="text-[10px]">{etapa}: {qtd}</Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
