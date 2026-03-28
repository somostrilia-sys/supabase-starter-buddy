import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

const veiculos = [
  { modelo: "Porsche Cayenne", marca: "Porsche", ano: 2024, regiao: "SP Capital", motivo: "Valor FIPE acima do limite" },
  { modelo: "BMW X5", marca: "BMW", ano: 2023, regiao: "RJ", motivo: "Veículo importado sem cobertura" },
  { modelo: "Land Rover Defender", marca: "Land Rover", ano: 2022, regiao: "MG", motivo: "Modelo fora da tabela de rateio" },
  { modelo: "Mercedes GLE", marca: "Mercedes-Benz", ano: 2024, regiao: "SP Capital", motivo: "Valor FIPE acima do limite" },
  { modelo: "Audi Q7", marca: "Audi", ano: 2023, regiao: "Interior SP", motivo: "Veículo importado sem cobertura" },
  { modelo: "Volvo XC90", marca: "Volvo", ano: 2022, regiao: "RJ", motivo: "Modelo fora da tabela de rateio" },
  { modelo: "Jaguar F-Pace", marca: "Jaguar", ano: 2024, regiao: "SP Capital", motivo: "Veículo importado sem cobertura" },
  { modelo: "Tesla Model 3", marca: "Tesla", ano: 2024, regiao: "SP Capital", motivo: "Veículo elétrico sem cobertura" },
];

const topModelos = ["Porsche Cayenne", "BMW X5", "Mercedes GLE"];
const topRegioes = ["SP Capital (4)", "RJ (2)", "Interior SP (1)"];

export default function VeiculosSemCoberturaTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-red-200 bg-destructive/8/50 dark:bg-red-950/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
            <p className="text-2xl font-bold">{veiculos.length}</p>
            <p className="text-xs text-muted-foreground">Veículos Sem Cobertura</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Top 3 Modelos</p>
            <div className="space-y-1">{topModelos.map(m => <p key={m} className="text-sm font-medium">{m}</p>)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Top 3 Regiões</p>
            <div className="space-y-1">{topRegioes.map(r => <p key={r} className="text-sm font-medium">{r}</p>)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Modelo</TableHead>
              <TableHead className="text-xs">Marca</TableHead>
              <TableHead className="text-xs">Ano</TableHead>
              <TableHead className="text-xs">Região</TableHead>
              <TableHead className="text-xs">Motivo</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {veiculos.map((v, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{v.modelo}</TableCell>
                  <TableCell className="text-sm">{v.marca}</TableCell>
                  <TableCell className="text-sm">{v.ano}</TableCell>
                  <TableCell className="text-sm">{v.regiao}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] text-red-600 border-red-300">{v.motivo}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
