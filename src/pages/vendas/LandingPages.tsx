import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, Search, Eye, Copy, ExternalLink, Users, MousePointerClick, TrendingUp, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUsuario } from "@/hooks/useUsuario";

interface Consultor {
  id: string;
  nome: string;
  slug: string;
  funcao: string | null;
  cooperativa: string | null;
  celular: string | null;
  email: string | null;
  foto_capa_url: string | null;
  leads: number;
  conversoes: number;
  taxa: number;
}

async function fetchConsultores(): Promise<Consultor[]> {
  // Fetch active usuarios with slug
  const { data: usuarios, error: userError } = await supabase
    .from("usuarios")
    .select("id, nome, slug, funcao, cooperativa, celular, email, foto_capa_url")
    .eq("status", "ativo")
    .not("slug", "is", null);

  if (userError) throw userError;
  if (!usuarios || usuarios.length === 0) return [];

  // Only count leads from landing page (origem = 'Landing Consultor')
  const nomes = usuarios.map((u: any) => u.nome);

  const { data: allNeg } = await supabase
    .from("negociacoes")
    .select("consultor, stage")
    .in("consultor", nomes)
    .eq("origem", "Landing Consultor");

  // Build counts map
  const leadsMap: Record<string, number> = {};
  const conversoesMap: Record<string, number> = {};

  for (const neg of allNeg || []) {
    const name = neg.consultor as string;
    leadsMap[name] = (leadsMap[name] || 0) + 1;
    if (neg.stage === "concluido") {
      conversoesMap[name] = (conversoesMap[name] || 0) + 1;
    }
  }

  return usuarios.map((u: any) => {
    const leads = leadsMap[u.nome] || 0;
    const conversoes = conversoesMap[u.nome] || 0;
    const taxa = leads > 0 ? Math.round((conversoes / leads) * 1000) / 10 : 0;
    return {
      id: u.id,
      nome: u.nome,
      slug: u.slug,
      funcao: u.funcao || null,
      cooperativa: u.cooperativa,
      celular: u.celular,
      email: u.email,
      foto_capa_url: u.foto_capa_url,
      leads,
      conversoes,
      taxa,
    };
  });
}

export default function LandingPages() {
  const { usuario, isConsultor, isGestor, canViewAllData, cooperativas: minhasCoops } = useUsuario();
  const [busca, setBusca] = useState("");
  const [previewConsultor, setPreviewConsultor] = useState<Consultor | null>(null);

  const { data: allConsultores = [], isLoading } = useQuery({
    queryKey: ["landing-pages-consultores"],
    queryFn: fetchConsultores,
  });

  // Scope: consultor sees only theirs, gestor sees cooperativa, director sees all
  const consultores = useMemo(() => {
    if (canViewAllData) return allConsultores;
    if (isConsultor && usuario?.nome) return allConsultores.filter(c => c.nome === usuario.nome);
    if (isGestor && minhasCoops.length > 0) return allConsultores.filter(c => minhasCoops.some(coop => c.cooperativa?.includes(coop)));
    return allConsultores;
  }, [allConsultores, canViewAllData, isConsultor, isGestor, usuario?.nome, minhasCoops]);

  const filtered = consultores.filter(c => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()));
  const baseUrl = "https://objetivoauto.com.br/";

  const comSlug = consultores.filter(c => c.slug).length;
  const totalLeadsLP = consultores.reduce((s, c) => s + c.leads, 0);
  const totalConvLP = consultores.reduce((s, c) => s + c.conversoes, 0);
  const taxaLP = totalLeadsLP > 0 ? Math.round((totalConvLP / totalLeadsLP) * 1000) / 10 : 0;

  function handleCopy(slug: string) {
    const url = baseUrl + slug;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("URL copiada!", { description: url });
    }).catch(() => {
      toast.error("Falha ao copiar URL");
    });
  }

  function handleOpen(slug: string) {
    window.open(baseUrl + slug, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md">
            <Globe className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Landing Pages por Consultor</h1>
            <p className="text-sm text-muted-foreground">Páginas de captação personalizadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paginas Ativas</p>
              <p className="text-lg font-bold text-foreground">{comSlug}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/8 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leads via LP</p>
              <p className="text-lg font-bold text-foreground">{totalLeadsLP}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/8 flex items-center justify-center">
              <Globe className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Convertidos</p>
              <p className="text-lg font-bold text-foreground">{totalConvLP}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/8 flex items-center justify-center">
              <MousePointerClick className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa Conversao</p>
              <p className="text-lg font-bold text-foreground">{taxaLP}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 border-border" placeholder="Buscar consultor..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando consultores...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary border-b-0">
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Consultor</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Cooperativa</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">URL</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-center">Leads LP</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-center">Convertidos</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider text-center">Taxa</TableHead>
                    <TableHead className="text-primary-foreground/90 font-semibold text-xs uppercase tracking-wider">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c, i) => (
                    <TableRow key={c.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-muted/40 transition-colors border-b-2 border-[#747474]`}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.cooperativa || "—"}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">/{c.slug}</span>
                      </TableCell>
                      <TableCell className="text-center font-semibold">{c.leads}</TableCell>
                      <TableCell className="text-center font-semibold text-emerald-400">{c.conversoes}</TableCell>
                      <TableCell className="text-center">
                        {c.leads > 0 ? <Badge className={c.taxa >= 25 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}>{c.taxa}%</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2" title="Visualizar" onClick={() => setPreviewConsultor(c)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2" title="Copiar URL" onClick={() => handleCopy(c.slug)}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2" title="Abrir" onClick={() => handleOpen(c.slug)}><ExternalLink className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {busca ? "Nenhum consultor encontrado" : "Nenhum consultor ativo com landing page"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="px-4 py-3 bg-muted/30 border-t-2 border-[#747474]">
                <span className="text-xs text-muted-foreground">{filtered.length} landing page(s)</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewConsultor} onOpenChange={() => setPreviewConsultor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview — Landing Page</DialogTitle>
          </DialogHeader>
          {previewConsultor && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-6 text-center space-y-3">
                <Avatar className="h-16 w-16 mx-auto">
                  {previewConsultor.foto_capa_url && (
                    <AvatarImage src={previewConsultor.foto_capa_url} alt={previewConsultor.nome} />
                  )}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {previewConsultor.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold">{previewConsultor.nome}</h3>
                <p className="text-sm font-medium text-primary">
                  {previewConsultor.funcao || "Consultor(a)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {previewConsultor.cooperativa || "Objetivo Proteção Veicular"}
                </p>
                <div className="flex flex-col gap-1.5 items-center text-sm text-muted-foreground">
                  {previewConsultor.celular && (
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {previewConsultor.celular}</span>
                  )}
                  {previewConsultor.email && (
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {previewConsultor.email}</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-lg font-bold">{previewConsultor.leads}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-lg font-bold">{previewConsultor.conversoes}</p>
                  <p className="text-xs text-muted-foreground">Conversões</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">URL da página</p>
                <p className="font-mono text-sm bg-muted px-3 py-1.5 rounded mt-1">{baseUrl}{previewConsultor.slug}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => handleCopy(previewConsultor.slug)}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar URL
                </Button>
                <Button size="sm" onClick={() => handleOpen(previewConsultor.slug)}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir Página
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
