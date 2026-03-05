import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const allFields = [
  "Nome", "CPF", "Email", "Telefone", "Placa", "Chassi",
  "Modelo", "Plano", "Etapa", "Consultor", "Cooperativa", "Regional",
  "Data Criação", "Data Pagamento", "Forma Pagamento", "CPF Vendedor", "Valor Adesão", "Status SGA",
];

const previewData = [
  { Nome: "João Pereira", CPF: "123.456.789-00", Email: "joao@email.com", Telefone: "(11) 98765-1234", Placa: "ABC-1D23", Chassi: "9BW...", Modelo: "Honda Civic", Plano: "Premium", Etapa: "Em Negociação", Consultor: "Ana Silva", Cooperativa: "Coop Norte", Regional: "SP Capital", "Data Criação": "25/02/2026", "Data Pagamento": "03/03/2026", "Forma Pagamento": "Boleto", "CPF Vendedor": "111.222.333-44", "Valor Adesão": "R$ 289,90", "Status SGA": "Sincronizado" },
  { Nome: "Maria Santos", CPF: "987.654.321-00", Email: "maria@email.com", Telefone: "(11) 97654-5678", Placa: "DEF-2G34", Chassi: "8AP...", Modelo: "VW Gol", Plano: "Básico", Etapa: "Novo Lead", Consultor: "Carlos Souza", Cooperativa: "Coop Sul", Regional: "Interior SP", "Data Criação": "27/02/2026", "Data Pagamento": "—", "Forma Pagamento": "—", "CPF Vendedor": "555.666.777-88", "Valor Adesão": "R$ 149,90", "Status SGA": "Não Enviado" },
  { Nome: "Carlos Oliveira", CPF: "456.789.123-00", Email: "carlos.f@email.com", Telefone: "(21) 99876-4321", Placa: "GHI-3J45", Chassi: "3FA...", Modelo: "Fiat Argo", Plano: "Intermediário", Etapa: "Ag. Vistoria", Consultor: "Maria Lima", Cooperativa: "Coop Leste", Regional: "RJ", "Data Criação": "01/03/2026", "Data Pagamento": "—", "Forma Pagamento": "Cartão", "CPF Vendedor": "999.888.777-66", "Valor Adesão": "R$ 199,90", "Status SGA": "Pendente" },
  { Nome: "Ana Costa", CPF: "321.654.987-00", Email: "ana.b@email.com", Telefone: "(11) 91234-5678", Placa: "JKL-4M56", Chassi: "1HG...", Modelo: "Toyota Corolla", Plano: "Premium", Etapa: "Concretizada", Consultor: "Ana Silva", Cooperativa: "Coop Norte", Regional: "SP Capital", "Data Criação": "20/02/2026", "Data Pagamento": "28/02/2026", "Forma Pagamento": "Cartão", "CPF Vendedor": "111.222.333-44", "Valor Adesão": "R$ 389,90", "Status SGA": "Sincronizado" },
  { Nome: "Roberto Lima", CPF: "654.321.987-00", Email: "roberto.l@email.com", Telefone: "(31) 98765-9876", Placa: "MNO-5P67", Chassi: "KMH...", Modelo: "Hyundai HB20", Plano: "Básico", Etapa: "Em Negociação", Consultor: "Carlos Souza", Cooperativa: "Coop Sul", Regional: "MG", "Data Criação": "02/03/2026", "Data Pagamento": "—", "Forma Pagamento": "—", "CPF Vendedor": "555.666.777-88", "Valor Adesão": "R$ 129,90", "Status SGA": "Erro" },
];

export default function BancoDadosTab() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["Nome", "CPF", "Email", "Placa", "Plano", "Etapa"]));

  function toggle(f: string) {
    setSelected(prev => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  }

  const cols = allFields.filter(f => selected.has(f));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Selecione os campos para exportação</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set(allFields))}>Selecionar Todos</Button>
              <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>Limpar Seleção</Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {allFields.map(f => (
              <label key={f} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded">
                <Checkbox checked={selected.has(f)} onCheckedChange={() => toggle(f)} />{f}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => toast({ title: "CSV exportado" })}><Download className="h-4 w-4 mr-1" />Exportar CSV</Button>
        <Button onClick={() => toast({ title: "Excel exportado" })}><Download className="h-4 w-4 mr-1" />Exportar Excel</Button>
      </div>

      {cols.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <p className="px-4 pt-3 text-xs text-muted-foreground">Preview (5 primeiros registros)</p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>{cols.map(c => <TableHead key={c} className="text-xs whitespace-nowrap">{c}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>{cols.map(c => <TableCell key={c} className="text-xs whitespace-nowrap">{(row as any)[c]}</TableCell>)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
