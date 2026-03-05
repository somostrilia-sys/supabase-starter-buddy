import { useState } from "react";
import { Building2, Car, Shield, Users, MapPin, Wrench, CreditCard, Package, Truck, ChevronRight, ArrowLeft, Plus, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MainTab = "cotacao-fipe" | "cooperativas" | "permissoes" | "usuarios";
type FipeSubMenu = null | "regionais" | "servicos" | "planos" | "tabela-precos" | "implementos";

const mainTabs = [
  { value: "cotacao-fipe" as MainTab, label: "Cotação FIPE", icon: Car },
  { value: "cooperativas" as MainTab, label: "Cooperativas", icon: Building2 },
  { value: "permissoes" as MainTab, label: "Grupo de Permissões", icon: Shield },
  { value: "usuarios" as MainTab, label: "Usuários", icon: Users },
];

const fipeSubMenus = [
  { value: "regionais" as FipeSubMenu, label: "Regionais", icon: MapPin, desc: "Gerencie as regionais cadastradas" },
  { value: "servicos" as FipeSubMenu, label: "Serviços", icon: Wrench, desc: "Cadastro e gestão de serviços" },
  { value: "planos" as FipeSubMenu, label: "Planos", icon: Package, desc: "Planos disponíveis para associados" },
  { value: "tabela-precos" as FipeSubMenu, label: "Tabela de Preços", icon: CreditCard, desc: "Consulta de preços com filtros" },
  { value: "implementos" as FipeSubMenu, label: "Implementos", icon: Truck, desc: "Cadastro de implementos veiculares" },
];

// Mock data
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

const mockRegionais = [
  { nome: "Regional São Paulo", responsavel: "João Mendes", cidades: 12, status: "ativa" },
  { nome: "Regional Sul", responsavel: "Maria Souza", cidades: 8, status: "ativa" },
  { nome: "Regional Norte", responsavel: "Carlos Lima", cidades: 5, status: "inativa" },
];

const mockServicos = [
  { nome: "Guincho 24h", tipo: "Assistência", valor: "R$ 150,00", status: "ativo" },
  { nome: "Vidros", tipo: "Reparo", valor: "R$ 300,00", status: "ativo" },
  { nome: "Chaveiro", tipo: "Assistência", valor: "R$ 80,00", status: "inativo" },
];

const mockPlanos = [
  { nome: "Básico", cobertura: "Roubo/Furto", valor: "R$ 89,90", associados: 120 },
  { nome: "Intermediário", cobertura: "Roubo/Furto + Colisão", valor: "R$ 149,90", associados: 85 },
  { nome: "Premium", cobertura: "Cobertura Total", valor: "R$ 249,90", associados: 42 },
];

const mockPrecos = [
  { categoria: "Carro Popular", faixa: "Até R$ 50.000", taxa: "3,5%", valor: "R$ 89,90" },
  { categoria: "Carro Médio", faixa: "R$ 50.001 - R$ 100.000", taxa: "3,0%", valor: "R$ 149,90" },
  { categoria: "SUV", faixa: "R$ 100.001 - R$ 200.000", taxa: "2,8%", valor: "R$ 199,90" },
  { categoria: "Caminhão", faixa: "Acima de R$ 200.000", taxa: "2,5%", valor: "R$ 349,90" },
];

const mockImplementos = [
  { nome: "Baú Frigorífico", tipo: "Refrigerado", marca: "Recrusul", status: "ativo" },
  { nome: "Carreta Graneleira", tipo: "Granéis", marca: "Randon", status: "ativo" },
  { nome: "Tanque Combustível", tipo: "Líquidos", marca: "Facchini", status: "inativo" },
];

function CrudTable({ title, description, headers, rows, actions = true }: {
  title: string;
  description: string;
  headers: string[];
  rows: (string | React.ReactNode)[][];
  actions?: boolean;
}) {
  const [search, setSearch] = useState("");
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {actions && <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo</Button>}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h, i) => (
                <TableHead key={i} className={i === headers.length - 1 && actions ? "text-right" : ""}>{h}</TableHead>
              ))}
              {actions && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className={j === 0 ? "font-medium" : ""}>{cell}</TableCell>
                ))}
                {actions && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FipeSubMenuContent({ subMenu, onBack }: { subMenu: FipeSubMenu; onBack: () => void }) {
  const menuInfo = fipeSubMenus.find(m => m.value === subMenu);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar ao menu
      </Button>

      {subMenu === "regionais" && (
        <CrudTable
          title="Regionais"
          description="Gerencie as regionais cadastradas"
          headers={["Nome", "Responsável", "Cidades", "Status"]}
          rows={mockRegionais.map(r => [
            r.nome, r.responsavel, String(r.cidades),
            <Badge variant={r.status === "ativa" ? "default" : "secondary"}>{r.status}</Badge>
          ])}
        />
      )}
      {subMenu === "servicos" && (
        <CrudTable
          title="Serviços"
          description="Cadastro e gestão de serviços"
          headers={["Nome", "Tipo", "Valor", "Status"]}
          rows={mockServicos.map(s => [
            s.nome, s.tipo, s.valor,
            <Badge variant={s.status === "ativo" ? "default" : "secondary"}>{s.status}</Badge>
          ])}
        />
      )}
      {subMenu === "planos" && (
        <CrudTable
          title="Planos"
          description="Planos disponíveis para associados"
          headers={["Nome", "Cobertura", "Valor Mensal", "Associados"]}
          rows={mockPlanos.map(p => [p.nome, p.cobertura, p.valor, String(p.associados)])}
        />
      )}
      {subMenu === "tabela-precos" && (
        <CrudTable
          title="Tabela de Preços"
          description="Consulta de preços com filtros"
          headers={["Categoria", "Faixa de Valor", "Taxa", "Mensalidade"]}
          rows={mockPrecos.map(p => [p.categoria, p.faixa, p.taxa, p.valor])}
          actions={false}
        />
      )}
      {subMenu === "implementos" && (
        <CrudTable
          title="Implementos"
          description="Cadastro de implementos veiculares"
          headers={["Nome", "Tipo", "Marca", "Status"]}
          rows={mockImplementos.map(i => [
            i.nome, i.tipo, i.marca,
            <Badge variant={i.status === "ativo" ? "default" : "secondary"}>{i.status}</Badge>
          ])}
        />
      )}
    </div>
  );
}

function FipeMenuCards({ onSelect }: { onSelect: (v: FipeSubMenu) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {fipeSubMenus.map((item) => (
        <button
          key={item.value}
          onClick={() => onSelect(item.value)}
          className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all text-left w-full"
        >
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <item.icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>
      ))}
    </div>
  );
}

export default function MinhaEmpresa() {
  const [activeTab, setActiveTab] = useState<MainTab>("cotacao-fipe");
  const [fipeSubMenu, setFipeSubMenu] = useState<FipeSubMenu>(null);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Empresa</h1>
        <p className="text-muted-foreground text-sm">Configurações e dados da sua empresa</p>
      </div>

      {/* Custom tab buttons */}
      <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {mainTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setFipeSubMenu(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "cotacao-fipe" && (
        fipeSubMenu ? (
          <FipeSubMenuContent subMenu={fipeSubMenu} onBack={() => setFipeSubMenu(null)} />
        ) : (
          <FipeMenuCards onSelect={setFipeSubMenu} />
        )
      )}

      {activeTab === "cooperativas" && (
        <CrudTable
          title="Cooperativas"
          description="Gerencie as cooperativas vinculadas"
          headers={["Nome", "CNPJ", "Cidade", "Status"]}
          rows={mockCooperativas.map(c => [
            c.nome, c.cnpj, c.cidade,
            <Badge variant={c.status === "ativa" ? "default" : "secondary"}>{c.status}</Badge>
          ])}
        />
      )}

      {activeTab === "permissoes" && (
        <CrudTable
          title="Grupo de Permissões"
          description="Defina perfis de acesso ao sistema"
          headers={["Nome do Grupo", "Descrição", "Usuários"]}
          rows={mockPermissoes.map(p => [
            p.nome,
            <span className="text-muted-foreground">{p.descricao}</span>,
            <Badge variant="outline">{p.usuarios}</Badge>
          ])}
        />
      )}

      {activeTab === "usuarios" && (
        <CrudTable
          title="Usuários"
          description="Gerencie os usuários do sistema"
          headers={["Nome", "E-mail", "Perfil", "Status"]}
          rows={mockUsuarios.map(u => [
            u.nome, u.email,
            <Badge variant="outline">{u.perfil}</Badge>,
            <Badge variant={u.status === "ativo" ? "default" : "secondary"}>{u.status}</Badge>
          ])}
        />
      )}
    </div>
  );
}
