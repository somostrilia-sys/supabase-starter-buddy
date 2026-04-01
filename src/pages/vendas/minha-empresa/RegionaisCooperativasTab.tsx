import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";

const mockRegionais = [
  { id: 1, nome: "São Paulo Capital", codigoSga: "SGA-SP001", cooperativas: 3 },
  { id: 2, nome: "Interior SP", codigoSga: "SGA-ISP002", cooperativas: 2 },
  { id: 3, nome: "Regional Sul", codigoSga: "SGA-SUL003", cooperativas: 2 },
  { id: 4, nome: "Regional Nordeste", codigoSga: "SGA-NE004", cooperativas: 1 },
];

const mockCooperativas = [
  { id: 1, nome: "Cooperativa Central SP", cnpj: "12.345.678/0001-90", codigoSga: "COOP-001", regional: "São Paulo Capital" },
  { id: 2, nome: "Cooperativa ABC Paulista", cnpj: "23.456.789/0001-01", codigoSga: "COOP-002", regional: "São Paulo Capital" },
  { id: 3, nome: "Cooperativa Campinas", cnpj: "34.567.890/0001-12", codigoSga: "COOP-003", regional: "Interior SP" },
  { id: 4, nome: "Cooperativa Curitiba", cnpj: "45.678.901/0001-23", codigoSga: "COOP-004", regional: "Regional Sul" },
  { id: 5, nome: "Cooperativa Porto Alegre", cnpj: "56.789.012/0001-34", codigoSga: "COOP-005", regional: "Regional Sul" },
  { id: 6, nome: "Cooperativa Recife", cnpj: "67.890.123/0001-45", codigoSga: "COOP-006", regional: "Regional Nordeste" },
];

export default function RegionaisCooperativasTab() {
  const [regionaisReais, setRegionaisReais] = useState<any[]>([]);
  const [cooperativasReais, setCooperativasReais] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("regionais").select("*").order("nome").then(({ data }) => setRegionaisReais(data || []));
    supabase.from("cooperativas" as any).select("*, regionais(nome)").order("nome").then(({ data }) => setCooperativasReais(data || []));
  }, []);

  // Sempre usar dados reais do banco
  const regionais = regionaisReais.map(r => ({
    id: r.id, nome: r.nome, codigoSga: "", cooperativas: cooperativasReais.filter((c: any) => c.regional_id === r.id).length
  }));

  const cooperativas = cooperativasReais.map((c: any) => ({
    id: c.id, nome: c.nome, cnpj: "", codigoSga: "", regional: c.regionais?.nome || ""
  }));

  const [showRegionalModal, setShowRegionalModal] = useState(false);
  const [showCoopModal, setShowCoopModal] = useState(false);
  const [nomeRegional, setNomeRegional] = useState("");
  const [codigoSgaRegional, setCodigoSgaRegional] = useState("");
  const [nomeCoop, setNomeCoop] = useState("");
  const [cnpjCoop, setCnpjCoop] = useState("");
  const [codigoSgaCoop, setCodigoSgaCoop] = useState("");
  const [regionalCoop, setRegionalCoop] = useState("");

  const formatCnpj = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 14);
    return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
      .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})/, "$1.$2.$3/$4")
      .replace(/^(\d{2})(\d{3})(\d{3})/, "$1.$2.$3")
      .replace(/^(\d{2})(\d{3})/, "$1.$2")
      .replace(/^(\d{2})/, "$1");
  };

  return (
    <div className="space-y-8">
      {/* Regionais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Regionais</h3>
            <p className="text-sm text-muted-foreground">Gerencie as regionais da organização</p>
          </div>
          <Button onClick={() => { setNomeRegional(""); setCodigoSgaRegional(""); setShowRegionalModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Regional
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código SGA</TableHead>
                  <TableHead>Cooperativas Vinculadas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRegionais.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell><Badge variant="outline">{r.codigoSga}</Badge></TableCell>
                    <TableCell>{r.cooperativas}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cooperativas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Cooperativas</h3>
            <p className="text-sm text-muted-foreground">Gerencie as cooperativas vinculadas às regionais</p>
          </div>
          <Button onClick={() => { setNomeCoop(""); setCnpjCoop(""); setCodigoSgaCoop(""); setRegionalCoop(""); setShowCoopModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Cooperativa
          </Button>
        </div>
        <Alert variant="destructive" className="bg-warning/8 border-warning/25 text-warning">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>Alteração de CNPJ requer abertura de chamado ao suporte.</AlertDescription>
        </Alert>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Código SGA</TableHead>
                  <TableHead>Regional</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCooperativas.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{c.cnpj}</TableCell>
                    <TableCell><Badge variant="outline">{c.codigoSga}</Badge></TableCell>
                    <TableCell>{c.regional}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Regional */}
      <Dialog open={showRegionalModal} onOpenChange={setShowRegionalModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Regional</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={nomeRegional} onChange={e => setNomeRegional(e.target.value)} placeholder="Ex: Regional Centro-Oeste" /></div>
            <div><Label>Código Integração SGA <span className="text-destructive">*</span></Label><Input value={codigoSgaRegional} onChange={e => setCodigoSgaRegional(e.target.value)} placeholder="Ex: SGA-CO005" /></div>
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-[#747474]">
              <Button variant="outline" onClick={() => setShowRegionalModal(false)}>Cancelar</Button>
              <Button onClick={() => setShowRegionalModal(false)}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Cooperativa */}
      <Dialog open={showCoopModal} onOpenChange={setShowCoopModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Cooperativa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={nomeCoop} onChange={e => setNomeCoop(e.target.value)} placeholder="Ex: Cooperativa Brasília" /></div>
            <div><Label>CNPJ</Label><Input value={cnpjCoop} onChange={e => setCnpjCoop(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Código SGA</Label><Input value={codigoSgaCoop} onChange={e => setCodigoSgaCoop(e.target.value)} placeholder="Ex: COOP-007" /></div>
            <div>
              <Label>Regional</Label>
              <Select value={regionalCoop} onValueChange={setRegionalCoop}>
                <SelectTrigger><SelectValue placeholder="Selecione a regional" /></SelectTrigger>
                <SelectContent>
                  {mockRegionais.map(r => <SelectItem key={r.id} value={r.nome}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-[#747474]">
              <Button variant="outline" onClick={() => setShowCoopModal(false)}>Cancelar</Button>
              <Button onClick={() => setShowCoopModal(false)}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
