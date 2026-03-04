import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, ArrowRight,
} from "lucide-react";

const mockCSVData = [
  { nome: "Ricardo Almeida", email: "ricardo@email.com", telefone: "(11) 99111-2233", veiculo: "Honda Civic 2024", placa: "ABC1D23", cidade: "São Paulo", valido: true },
  { nome: "Sandra Oliveira", email: "sandra@email.com", telefone: "(11) 99222-3344", veiculo: "Toyota Corolla 2023", placa: "DEF2G34", cidade: "Campinas", valido: true },
  { nome: "Marcos Pereira", email: "", telefone: "(11) 99333-4455", veiculo: "VW Gol 2022", placa: "GHI3J45", cidade: "Santos", valido: false },
  { nome: "Julia Costa", email: "julia@email.com", telefone: "(21) 99444-5566", veiculo: "Fiat Argo 2024", placa: "JKL4M56", cidade: "Rio de Janeiro", valido: true },
  { nome: "Fernando Santos", email: "fernando@email.com", telefone: "(21) 99555-6677", veiculo: "Hyundai HB20 2023", placa: "MNO5P67", cidade: "Niterói", valido: true },
  { nome: "Camila Rodrigues", email: "camila@email.com", telefone: "(31) 99666-7788", veiculo: "Chevrolet Onix 2024", placa: "QRS6T78", cidade: "BH", valido: true },
  { nome: "Paulo Mendes", email: "paulo@email.com", telefone: "(31) 99777-8899", veiculo: "Renault Kwid 2023", placa: "", cidade: "Uberlândia", valido: false },
  { nome: "Tatiana Lima", email: "tatiana@email.com", telefone: "(11) 99888-9900", veiculo: "VW T-Cross 2024", placa: "UVW7X89", cidade: "Guarulhos", valido: true },
  { nome: "Roberto Silva", email: "roberto@email.com", telefone: "(11) 99999-0011", veiculo: "Honda HR-V 2023", placa: "YZA8B01", cidade: "Osasco", valido: true },
  { nome: "Adriana Ferreira", email: "adriana@email.com", telefone: "(21) 99000-1122", veiculo: "Jeep Renegade 2023", placa: "BCD9E12", cidade: "Petrópolis", valido: true },
  { nome: "Lucas Barbosa", email: "lucas.b@email.com", telefone: "", veiculo: "Nissan Kicks 2024", placa: "FGH0I23", cidade: "São Paulo", valido: false },
  { nome: "Marina Souza", email: "marina@email.com", telefone: "(11) 99112-2334", veiculo: "Toyota Hilux 2024", placa: "JKL1M34", cidade: "Campinas", valido: true },
  { nome: "Diego Cardoso", email: "diego@email.com", telefone: "(31) 99223-3445", veiculo: "Hyundai Creta 2024", placa: "NOP2Q45", cidade: "Contagem", valido: true },
  { nome: "Patricia Nunes", email: "patricia@email.com", telefone: "(21) 99334-4556", veiculo: "Chevrolet Tracker 2024", placa: "RST3U56", cidade: "Volta Redonda", valido: true },
  { nome: "Ricardo Almeida", email: "ricardo@email.com", telefone: "(11) 99111-2233", veiculo: "Honda Civic 2024", placa: "ABC1D23", cidade: "São Paulo", valido: true },
];

const csvColumns = ["nome","email","telefone","veiculo","placa","cidade"];
const sysColumns = ["Nome","Email","Telefone","Veículo","Placa","Cidade"];

export default function ImportarLeads() {
  const [step, setStep] = useState<"upload"|"mapping"|"importing"|"done">("upload");
  const [progress, setProgress] = useState(0);

  const validos = mockCSVData.filter(d => d.valido).length;
  const erros = mockCSVData.filter(d => !d.valido).length;
  const duplicatas = 1;

  function simulateImport() {
    setStep("importing");
    let p = 0;
    const interval = setInterval(() => {
      p += 8;
      setProgress(p);
      if (p >= 100) { clearInterval(interval); setStep("done"); }
    }, 200);
  }

  if (step === "upload") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar Leads</h1>
          <p className="text-sm text-muted-foreground">Importe contatos via arquivo CSV ou Excel</p>
        </div>
        <Card className="border border-border/50">
          <CardContent className="p-0">
            <div className="border-2 border-dashed border-border/50 rounded-xl m-4 p-16 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setStep("mapping")}>
              <Upload className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Arraste seu arquivo CSV ou Excel aqui</h3>
              <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
              <Badge variant="outline" className="text-xs">Formatos aceitos: .csv, .xlsx, .xls</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-2">Dicas para importação</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• A primeira linha deve conter os nomes das colunas</li>
              <li>• Campos obrigatórios: Nome e pelo menos Telefone ou Email</li>
              <li>• Telefones no formato (XX) XXXXX-XXXX</li>
              <li>• CPF no formato XXX.XXX.XXX-XX</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "mapping") {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mapeamento de Colunas</h1>
          <p className="text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4 inline mr-1" />leads_março_2026.csv · {mockCSVData.length} linhas
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="border border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
              <div><p className="text-2xl font-bold text-[#22C55E]">{validos}</p><p className="text-xs text-muted-foreground">Válidos</p></div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div><p className="text-2xl font-bold text-destructive">{erros}</p><p className="text-xs text-muted-foreground">Com erro</p></div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-[#F59E0B]" />
              <div><p className="text-2xl font-bold text-[#F59E0B]">{duplicatas}</p><p className="text-xs text-muted-foreground">Duplicatas</p></div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Mapeamento</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {csvColumns.map((col, i) => (
                <div key={col} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] w-24 justify-center">{col}</Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Select defaultValue={sysColumns[i]}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{sysColumns.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Preview (10 primeiras linhas)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b bg-muted/30">
                  <th className="p-2 text-left text-[10px] uppercase text-muted-foreground">#</th>
                  {csvColumns.map(c => <th key={c} className="p-2 text-left text-[10px] uppercase text-muted-foreground">{c}</th>)}
                  <th className="p-2 text-left text-[10px] uppercase text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {mockCSVData.slice(0,10).map((row, i) => (
                    <tr key={i} className={`border-b border-border/30 ${!row.valido ? "bg-destructive/5" : ""}`}>
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2">{row.nome}</td>
                      <td className={`p-2 ${!row.email ? "text-destructive font-medium" : ""}`}>{row.email || "—"}</td>
                      <td className={`p-2 ${!row.telefone ? "text-destructive font-medium" : ""}`}>{row.telefone || "—"}</td>
                      <td className="p-2">{row.veiculo}</td>
                      <td className={`p-2 ${!row.placa ? "text-destructive font-medium" : ""}`}>{row.placa || "—"}</td>
                      <td className="p-2">{row.cidade}</td>
                      <td className="p-2">
                        {row.valido ? <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Configurações</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1"><Label className="text-xs">Cooperativa</Label>
                <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="sp">Central SP</SelectItem><SelectItem value="rj">Central RJ</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Responsável</Label>
                <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="maria">Maria Santos</SelectItem><SelectItem value="joao">João Pedro</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Etapa Pipeline</Label>
                <Select defaultValue="prospeccao"><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="prospeccao">Prospecção</SelectItem><SelectItem value="qualificacao">Qualificação</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Tags Automáticas</Label>
                <Select><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="importado">Importado</SelectItem><SelectItem value="novo">Novo Lead</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={simulateImport} className="px-8">
            Importar {validos} leads <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (step === "importing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <h2 className="text-xl font-bold">Importando leads...</h2>
        <div className="w-64">
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground text-center mt-1">{progress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <CheckCircle2 className="h-16 w-16 text-[#22C55E]" />
      <h2 className="text-xl font-bold">Importação Concluída!</h2>
      <p className="text-sm text-muted-foreground">{validos} leads importados com sucesso</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep("upload")}>Nova Importação</Button>
        <Button>Ver no Pipeline</Button>
      </div>
    </div>
  );
}
