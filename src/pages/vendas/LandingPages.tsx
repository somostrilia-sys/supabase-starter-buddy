import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Globe, Search, Eye, Copy, ExternalLink, Users, MousePointerClick, TrendingUp, Phone, Mail, MapPin } from "lucide-react";

const consultores = [
  { id: 1, nome: "Maria Santos", slug: "maria-santos", visitas: 1240, leads: 86, conversoes: 22, taxa: 25.6, ativa: true },
  { id: 2, nome: "João Pedro", slug: "joao-pedro", visitas: 980, leads: 64, conversoes: 15, taxa: 23.4, ativa: true },
  { id: 3, nome: "Carlos Lima", slug: "carlos-lima", visitas: 756, leads: 42, conversoes: 12, taxa: 28.6, ativa: true },
  { id: 4, nome: "Ana Costa", slug: "ana-costa", visitas: 620, leads: 38, conversoes: 9, taxa: 23.7, ativa: true },
  { id: 5, nome: "Fernanda Alves", slug: "fernanda-alves", visitas: 540, leads: 31, conversoes: 8, taxa: 25.8, ativa: false },
  { id: 6, nome: "Marcos Souza", slug: "marcos-souza", visitas: 380, leads: 18, conversoes: 4, taxa: 22.2, ativa: true },
];

const kpis = [
  { label: "Total Consultores", value: consultores.length, icon: Users, color: "text-[hsl(212_55%_40%)]", bg: "bg-[hsl(210_40%_95%)]" },
  { label: "Total Visitas", value: consultores.reduce((s, c) => s + c.visitas, 0).toLocaleString(), icon: MousePointerClick, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Total Leads", value: consultores.reduce((s, c) => s + c.leads, 0), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  { label: "Total Conversões", value: consultores.reduce((s, c) => s + c.conversoes, 0), icon: Globe, color: "text-purple-600", bg: "bg-purple-50" },
];

export default function LandingPages() {
  const [busca, setBusca] = useState("");
  const [previewConsultor, setPreviewConsultor] = useState<typeof consultores[0] | null>(null);
  const filtered = consultores.filter(c => !busca || c.nome.toLowerCase().includes(busca.toLowerCase()));
  const baseUrl = "objetivoauto.com.br/c/";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(212_35%_18%)] flex items-center justify-center shadow-md">
            <Globe className="h-5 w-5 text-[hsl(210_55%_70%)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Landing Pages por Consultor</h1>
            <p className="text-sm text-muted-foreground">Páginas de captação personalizadas</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-[hsl(210_30%_88%)]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="border-[hsl(210_30%_88%)]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 border-[hsl(210_30%_85%)]" placeholder="Buscar consultor..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[hsl(210_30%_88%)] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[hsl(212_35%_18%)] via-[hsl(212_35%_28%)] to-[hsl(210_40%_40%)]" />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[hsl(212_35%_18%)] hover:bg-[hsl(212_35%_18%)] border-b-0">
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Consultor</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">URL</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Visitas</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Leads</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Conversões</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider text-right">Taxa</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[hsl(210_55%_80%)] font-semibold text-xs uppercase tracking-wider">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
                <TableRow key={c.id} className={`${i % 2 === 0 ? 'bg-card' : 'bg-[hsl(210_30%_97%)]'} hover:bg-[hsl(210_40%_94%)] transition-colors border-b border-[hsl(210_30%_90%)]`}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-[hsl(210_30%_95%)] px-2 py-1 rounded">{baseUrl}{c.slug}</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{c.visitas.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{c.leads}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{c.conversoes}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={c.taxa >= 25 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{c.taxa}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={c.ativa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>{c.ativa ? "Ativa" : "Inativa"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2" title="Visualizar" onClick={() => setPreviewConsultor(c)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" title="Copiar URL"><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" title="Abrir"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3 bg-[hsl(210_30%_97%)] border-t border-[hsl(210_30%_90%)]">
            <span className="text-xs text-muted-foreground">{filtered.length} landing page(s)</span>
          </div>
        </CardContent>
      </Card>
    </div>

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
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {previewConsultor.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold">{previewConsultor.nome}</h3>
                <p className="text-sm text-muted-foreground">Consultor(a) — Objetivo Proteção Veicular</p>
                <div className="flex flex-col gap-1.5 items-center text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> (11) 99999-0000</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {previewConsultor.slug}@objetivoauto.com.br</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> São Paulo, SP</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-lg font-bold">{previewConsultor.visitas.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Visitas</p>
                </div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
