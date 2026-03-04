import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Upload, FileText, Download, Eye,
} from "lucide-react";

interface Documento {
  id: string; nome: string; tipo: string; categoria: string; versao: string;
  dataUpload: string; tamanho: string; downloads: number;
}

const mockDocs: Documento[] = [
  { id: "d1", nome: "Termo de Adesão - Modelo Padrão", tipo: "PDF", categoria: "Termos de Adesão", versao: "3.2", dataUpload: "2026-01-15", tamanho: "245 KB", downloads: 342 },
  { id: "d2", nome: "Contrato de Proteção Veicular", tipo: "PDF", categoria: "Contratos", versao: "5.1", dataUpload: "2026-02-01", tamanho: "512 KB", downloads: 289 },
  { id: "d3", nome: "Regulamento Geral da Cooperativa", tipo: "PDF", categoria: "Regulamentos", versao: "2.0", dataUpload: "2025-11-20", tamanho: "1.2 MB", downloads: 156 },
  { id: "d4", nome: "Manual do Associado", tipo: "PDF", categoria: "Manuais", versao: "4.0", dataUpload: "2026-01-10", tamanho: "3.8 MB", downloads: 478 },
  { id: "d5", nome: "Modelo de Declaração de Sinistro", tipo: "DOCX", categoria: "Modelos", versao: "1.5", dataUpload: "2025-12-05", tamanho: "89 KB", downloads: 123 },
  { id: "d6", nome: "Termo de Cancelamento", tipo: "PDF", categoria: "Termos de Adesão", versao: "2.1", dataUpload: "2026-02-15", tamanho: "178 KB", downloads: 98 },
  { id: "d7", nome: "Regulamento de Eventos/Sinistros", tipo: "PDF", categoria: "Regulamentos", versao: "3.0", dataUpload: "2025-10-01", tamanho: "890 KB", downloads: 210 },
  { id: "d8", nome: "Modelo de Procuração", tipo: "DOCX", categoria: "Modelos", versao: "1.0", dataUpload: "2026-03-01", tamanho: "67 KB", downloads: 45 },
];

const categorias = ["Todos", "Termos de Adesão", "Contratos", "Regulamentos", "Manuais", "Modelos"];

export default function Documentacao() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todos");

  const filtered = mockDocs.filter(d => {
    const matchSearch = !search || d.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = cat === "Todos" || d.categoria === cat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentação</h1>
          <p className="text-sm text-muted-foreground">{mockDocs.length} documentos · {categorias.length - 1} categorias</p>
        </div>
        <Button size="sm"><Upload className="h-4 w-4 mr-1" /> Upload</Button>
      </div>

      <Tabs value={cat} onValueChange={setCat}>
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          {categorias.map(c => <TabsTrigger key={c} value={c} className="text-[10px]">{c}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar documento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm font-medium">Arraste arquivos aqui para upload</p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX até 10MB</p>
      </div>

      <div className="space-y-2">
        {filtered.map(d => (
          <Card key={d.id} className="border border-border/50 hover:bg-muted/20 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.nome}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[9px]">{d.categoria}</Badge>
                  <Badge variant="secondary" className="text-[9px]">{d.tipo}</Badge>
                  <span className="text-[10px] text-muted-foreground">v{d.versao}</span>
                </div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-[10px] text-muted-foreground">{new Date(d.dataUpload).toLocaleDateString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground">{d.tamanho}</p>
                <p className="text-[10px] text-muted-foreground">{d.downloads} downloads</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">Nenhum documento encontrado</p>}
      </div>
    </div>
  );
}
