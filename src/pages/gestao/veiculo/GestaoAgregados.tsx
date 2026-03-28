import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Car, Link2, RefreshCw, ArrowRightLeft, Search, Check } from "lucide-react";
import { mockVeiculos } from "./mockVeiculos";

interface PainelData {
  placa: string; chassi: string; modelo: string; marca: string; regional: string; associado: string; found: boolean;
}

const emptyPainel = (): PainelData => ({ placa: "", chassi: "", modelo: "", marca: "", regional: "", associado: "", found: false });

const PainelVeiculo = ({ title, icon, data, setData, color }: {
  title: string; icon: React.ReactNode; data: PainelData;
  setData: (d: PainelData) => void; color: string;
}) => {
  const buscar = () => {
    const found = mockVeiculos.find(v =>
      v.placa.toLowerCase().replace("-", "").includes(data.placa.toLowerCase().replace("-", ""))
    );
    if (found) {
      setData({ placa: found.placa, chassi: found.chassi, modelo: found.modelo, marca: found.marca, regional: found.regional, associado: found.associadoNome, found: true });
      toast.success(`${title} encontrado!`);
    } else {
      toast.error("Veículo não encontrado.");
    }
  };

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Placa *</Label>
          <div className="flex gap-1">
            <Input value={data.placa} onChange={e => setData({ ...data, placa: e.target.value.toUpperCase(), found: false })} placeholder="ABC-1D23" />
            <Button variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={buscar}><Search className="h-4 w-4" /></Button>
          </div>
        </div>
        <div><Label className="text-xs">Chassi *</Label><Input value={data.chassi} onChange={e => setData({ ...data, chassi: e.target.value })} disabled={data.found} className={data.found ? "bg-muted" : ""} /></div>
        <div><Label className="text-xs">Modelo</Label><Input value={data.modelo} disabled className="bg-muted" /></div>
        <div><Label className="text-xs">Marca</Label><Input value={data.marca} disabled className="bg-muted" /></div>
        <div><Label className="text-xs">Regional</Label><Input value={data.regional} disabled className="bg-muted" /></div>
        <div><Label className="text-xs">Associado</Label><Input value={data.associado} disabled className="bg-muted" /></div>
        {data.found && (
          <Badge className={`${color} text-white`}>
            <Check className="h-3 w-3 mr-1" /> Selecionado
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default function GestaoAgregados() {
  // Tab 1 state
  const [vincVeiculo, setVincVeiculo] = useState<PainelData>(emptyPainel());
  const [vincAgregado, setVincAgregado] = useState<PainelData>(emptyPainel());

  // Tab 2 state
  const [transPrincipal, setTransPrincipal] = useState<PainelData>(emptyPainel());
  const [transVeiculo, setTransVeiculo] = useState<PainelData>(emptyPainel());

  // Tab 3 state
  const [transAgregado, setTransAgregado] = useState<PainelData>(emptyPainel());

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5" /> Gestão de Agregados</h2>

      <Tabs defaultValue="vincular">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vincular" className="text-xs gap-1"><Link2 className="h-3.5 w-3.5" /> Vincular Agregado</TabsTrigger>
          <TabsTrigger value="transformar-agreg" className="text-xs gap-1"><RefreshCw className="h-3.5 w-3.5" /> Veículo → Agregado</TabsTrigger>
          <TabsTrigger value="transformar-veic" className="text-xs gap-1"><ArrowRightLeft className="h-3.5 w-3.5" /> Agregado → Veículo</TabsTrigger>
        </TabsList>

        {/* Tab 1: Vincular */}
        <TabsContent value="vincular" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Vincule um veículo agregado a um veículo principal existente.</p>
          <div className="flex flex-col md:flex-row gap-4">
            <PainelVeiculo title="Veículo Principal" icon={<Car className="h-4 w-4 text-primary" />} data={vincVeiculo} setData={setVincVeiculo} color="bg-primary" />
            <PainelVeiculo title="Veículo Agregado" icon={<Car className="h-4 w-4 text-warning" />} data={vincAgregado} setData={setVincAgregado} color="bg-amber-600" />
          </div>
          <div className="flex justify-center">
            <Button
              disabled={!vincVeiculo.found || !vincAgregado.found}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              onClick={() => toast.success("Agregado vinculado com sucesso!", { description: `${vincAgregado.placa} vinculado a ${vincVeiculo.placa}` })}
            >
              <Link2 className="h-4 w-4" /> Vincular
            </Button>
          </div>
          <div className="text-xs text-muted-foreground p-3 border rounded bg-muted/50">
            <p className="font-medium mb-1">Placas para teste:</p>
            <p>{mockVeiculos.slice(0, 6).map(v => v.placa).join(" • ")}</p>
          </div>
        </TabsContent>

        {/* Tab 2: Veículo → Agregado */}
        <TabsContent value="transformar-agreg" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Transforme um veículo existente em agregado de outro veículo principal.</p>
          <div className="flex flex-col md:flex-row gap-4">
            <PainelVeiculo title="Veículo Principal" icon={<Car className="h-4 w-4 text-primary" />} data={transPrincipal} setData={setTransPrincipal} color="bg-primary" />
            <PainelVeiculo title="Veículo a Transformar" icon={<RefreshCw className="h-4 w-4 text-purple-600" />} data={transVeiculo} setData={setTransVeiculo} color="bg-purple-600" />
          </div>
          <div className="flex justify-center">
            <Button
              disabled={!transPrincipal.found || !transVeiculo.found}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8"
              onClick={() => toast.success("Veículo transformado em agregado!", { description: `${transVeiculo.placa} agora é agregado de ${transPrincipal.placa}` })}
            >
              <RefreshCw className="h-4 w-4" /> Transformar em Agregado
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Agregado → Veículo */}
        <TabsContent value="transformar-veic" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Transforme um agregado existente de volta em veículo independente.</p>
          <div className="max-w-md">
            <PainelVeiculo title="Dados do Agregado" icon={<ArrowRightLeft className="h-4 w-4 text-blue-600" />} data={transAgregado} setData={setTransAgregado} color="bg-blue-600" />
          </div>
          <div className="flex justify-start">
            <Button
              disabled={!transAgregado.found}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8"
              onClick={() => toast.success("Agregado transformado em veículo!", { description: `${transAgregado.placa} agora é veículo independente` })}
            >
              <ArrowRightLeft className="h-4 w-4" /> Transformar em Veículo
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Small fix: Settings was used in the title but not imported — use Car instead
function Settings(props: any) {
  return <Car {...props} />;
}
