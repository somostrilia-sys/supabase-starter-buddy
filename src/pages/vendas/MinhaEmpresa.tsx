import { useState } from "react";
import { Building2, Car, Shield, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2 } from "lucide-react";

const subTabs = [
  { value: "cotacao-fipe", label: "Cotação FIPE", icon: Car },
  { value: "cooperativas", label: "Cooperativas", icon: Building2 },
  { value: "permissoes", label: "Grupo de Permissões", icon: Shield },
  { value: "usuarios", label: "Usuários", icon: Users },
];

const mockFipe = [
  { marca: "Fiat", modelo: "Uno 1.0", ano: "2023/2024", valor: "R$ 52.430" },
  { marca: "Chevrolet", modelo: "Onix 1.0 Turbo", ano: "2024/2024", valor: "R$ 89.990" },
  { marca: "Volkswagen", modelo: "Gol 1.6", ano: "2022/2023", valor: "R$ 63.750" },
  { marca: "Hyundai", modelo: "HB20 1.0", ano: "2023/2024", valor: "R$ 75.200" },
  { marca: "Toyota", modelo: "Corolla 2.0", ano: "2024/2024", valor: "R$ 158.990" },
];

const mockCooperativas = [
  { nome: "Cooperativa Central", cnpj: "12.345.678/0001-00", cidade: "São Paulo", status: "ativa" },
  { nome: "Cooperativa Sul", cnpj: "98.765.432/0001-00", cidade: "Curitiba", status: "ativa" },
  { nome: "Cooperativa Norte", cnpj: "11.222.333/0001-00", cidade: "Manaus", status: "inativa" },
];

const mockPermissoes = [
  { nome: "Administrador", descricao: "Acesso total ao sistema", usuarios: 3 },
  { nome: "Gerente", descricao: "Gestão de equipe e relatórios", usuarios: 5 },
  { nome: "Vendedor", descricao: "Pipeline e contatos", usuarios: 12 },
  { nome: "Financeiro", descricao: "Boletos, conciliação e fluxo", usuarios: 4 },
  { nome: "Visualizador", descricao: "Somente leitura", usuarios: 8 },
];

const mockUsuarios = [
  { nome: "Carlos Silva", email: "carlos@empresa.com", perfil: "Administrador", status: "ativo" },
  { nome: "Ana Oliveira", email: "ana@empresa.com", perfil: "Gerente", status: "ativo" },
  { nome: "Pedro Santos", email: "pedro@empresa.com", perfil: "Vendedor", status: "ativo" },
  { nome: "Maria Costa", email: "maria@empresa.com", perfil: "Financeiro", status: "inativo" },
  { nome: "Lucas Ferreira", email: "lucas@empresa.com", perfil: "Vendedor", status: "ativo" },
];

export default function MinhaEmpresa() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Empresa</h1>
        <p className="text-muted-foreground text-sm">Configurações e dados da sua empresa</p>
      </div>

      <Tabs defaultValue="cotacao-fipe" className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
          {subTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Cotação FIPE */}
        <TabsContent value="cotacao-fipe">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg">Cotação FIPE</CardTitle>
                <CardDescription>Consulte valores da tabela FIPE para veículos</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar veículo..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Valor FIPE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFipe
                    .filter((v) => !search || `${v.marca} ${v.modelo}`.toLowerCase().includes(search.toLowerCase()))
                    .map((v, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{v.marca}</TableCell>
                        <TableCell>{v.modelo}</TableCell>
                        <TableCell>{v.ano}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{v.valor}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cooperativas */}
        <TabsContent value="cooperativas">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg">Cooperativas</CardTitle>
                <CardDescription>Gerencie as cooperativas vinculadas</CardDescription>
              </div>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova Cooperativa</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCooperativas.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell>{c.cnpj}</TableCell>
                      <TableCell>{c.cidade}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "ativa" ? "default" : "secondary"}>{c.status}</Badge>
                      </TableCell>
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
        </TabsContent>

        {/* Grupo de Permissões */}
        <TabsContent value="permissoes">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg">Grupo de Permissões</CardTitle>
                <CardDescription>Defina perfis de acesso ao sistema</CardDescription>
              </div>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo Grupo</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Grupo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Usuários</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPermissoes.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{p.descricao}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{p.usuarios}</Badge>
                      </TableCell>
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
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="usuarios">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg">Usuários</CardTitle>
                <CardDescription>Gerencie os usuários do sistema</CardDescription>
              </div>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsuarios.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant="outline">{u.perfil}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={u.status === "ativo" ? "default" : "secondary"}>{u.status}</Badge>
                      </TableCell>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
