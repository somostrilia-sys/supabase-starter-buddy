import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface RegionalData {
  nome: string;
  totalUsuarios: number;
  totalCooperativas: number;
}

interface CooperativaData {
  nome: string;
  regional: string;
  totalConsultores: number;
  totalNegociacoes: number;
}

async function fetchRegionaisCooperativas() {
  // Fetch all usuarios with regional and cooperativa fields
  const { data: usuarios, error: errUsuarios } = await (supabase as any)
    .from("usuarios")
    .select("regional, cooperativa, nome, status");

  if (errUsuarios) throw errUsuarios;

  // Fetch all negociacoes with cooperativa field
  const { data: negociacoes, error: errNeg } = await (supabase as any)
    .from("negociacoes")
    .select("cooperativa, regional, consultor");

  if (errNeg) throw errNeg;

  const usuariosList: any[] = usuarios || [];
  const negociacoesList: any[] = negociacoes || [];

  // Extract unique regionais
  const regionaisSet = new Set<string>();
  usuariosList.forEach((u) => {
    if (u.regional && u.regional.trim()) {
      regionaisSet.add(u.regional.trim());
    }
  });

  // Extract unique cooperativas by splitting comma-separated field
  const cooperativasSet = new Set<string>();
  usuariosList.forEach((u) => {
    if (u.cooperativa) {
      u.cooperativa.split(",").forEach((c: string) => {
        const trimmed = c.trim();
        if (trimmed) cooperativasSet.add(trimmed);
      });
    }
  });

  // Build regionais data
  const regionais: RegionalData[] = Array.from(regionaisSet).sort().map((nome) => {
    const usuariosNaRegional = usuariosList.filter(
      (u) => u.regional && u.regional.trim() === nome
    );
    // Cooperativas in this regional: unique cooperativas from usuarios in that regional
    const coopsNaRegional = new Set<string>();
    usuariosNaRegional.forEach((u) => {
      if (u.cooperativa) {
        u.cooperativa.split(",").forEach((c: string) => {
          const trimmed = c.trim();
          if (trimmed) coopsNaRegional.add(trimmed);
        });
      }
    });
    return {
      nome,
      totalUsuarios: usuariosNaRegional.length,
      totalCooperativas: coopsNaRegional.size,
    };
  });

  // Build cooperativas data
  const cooperativas: CooperativaData[] = Array.from(cooperativasSet).sort().map((nome) => {
    // Consultores: usuarios where cooperativa field contains this cooperativa
    const consultores = usuariosList.filter((u) => {
      if (!u.cooperativa) return false;
      return u.cooperativa.split(",").map((c: string) => c.trim()).includes(nome);
    });

    // Regional: get from first usuario that has this cooperativa
    const primeiroUsuario = consultores[0];
    const regional = primeiroUsuario?.regional?.trim() || "";

    // Negociacoes for this cooperativa
    const negsCount = negociacoesList.filter(
      (n) => n.cooperativa && n.cooperativa.trim() === nome
    ).length;

    return {
      nome,
      regional,
      totalConsultores: consultores.length,
      totalNegociacoes: negsCount,
    };
  });

  return { regionais, cooperativas };
}

export default function RegionaisCooperativasTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["regionais-cooperativas"],
    queryFn: fetchRegionaisCooperativas,
  });

  const regionais = data?.regionais || [];
  const cooperativas = data?.cooperativas || [];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                  <TableHead>Usuários</TableHead>
                  <TableHead>Cooperativas Vinculadas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regionais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma regional encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  regionais.map((r) => (
                    <TableRow key={r.nome}>
                      <TableCell className="font-medium">{r.nome}</TableCell>
                      <TableCell>{r.totalUsuarios}</TableCell>
                      <TableCell>{r.totalCooperativas}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                  <TableHead>Regional</TableHead>
                  <TableHead>Consultores</TableHead>
                  <TableHead>Negociações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cooperativas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma cooperativa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  cooperativas.map((c) => (
                    <TableRow key={c.nome}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.regional}</TableCell>
                      <TableCell>{c.totalConsultores}</TableCell>
                      <TableCell>{c.totalNegociacoes}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                  {regionais.map(r => <SelectItem key={r.nome} value={r.nome}>{r.nome}</SelectItem>)}
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
