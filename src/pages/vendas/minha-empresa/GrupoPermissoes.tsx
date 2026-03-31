import { useState } from "react";
import { Shield, Menu, FileText, Eye, Plus, Edit, Trash2, ArrowLeft, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PermissaoGrupo {
  id: string;
  nome: string;
  descricao: string;
  usuarios: number;
  permissoes: Record<string, boolean>;
}

const defaultPermissoes: Record<string, boolean> = {
  aprovar_vistoria: false,
  acessar_financeiro: false,
  acessar_relatorios: false,
  acessar_contatos: false,
  acessar_configuracoes: false,
  acessar_ferramentas: false,
  atender_cotacoes_sem_consultor: false,
  receber_cotacoes_sem_consultor: false,
  atender_cotacoes_sem_consultor_cooperativa: false,
  receber_cotacoes_sem_consultor_cooperativa: false,
  enviar_cotacoes_sga: false,
  receber_leads_distribuicoes: false,
  alterar_responsavel_cotacao: false,
  inserir_afiliado_cotacao: false,
  mover_cotacao_etapa: false,
  alterar_valor_protegido: false,
  aplicar_depreciacao: false,
  alterar_valor_mensalidade: false,
  alterar_tabela_veiculo: false,
  informar_adesao_dinheiro: false,
  alterar_valor_adesao: false,
  alterar_valor_rastreador: false,
  acessar_power_sign: false,
  adicionar_remover_tags: false,
  consultar_placa_cpf_sga: false,
  realizar_vistorias: false,
  ver_lista_vistoriadores: false,
  ignorar_fluxo_vistorias: false,
  upload_fotos_vistoria: false,
  acesso_relatorios_vistoria: false,
  relatorio_banco_dados: false,
};

const mockGrupos: PermissaoGrupo[] = [
  { id: "1", nome: "Administrador", descricao: "Acesso total ao sistema", usuarios: 3, permissoes: Object.fromEntries(Object.keys(defaultPermissoes).map(k => [k, true])) },
  { id: "2", nome: "Gerente", descricao: "Gestão de equipe e relatórios", usuarios: 5, permissoes: { ...defaultPermissoes, acessar_financeiro: true, acessar_relatorios: true, acessar_contatos: true, alterar_responsavel_cotacao: true, mover_cotacao_etapa: true } },
  { id: "3", nome: "Consultor", descricao: "Pipeline e contatos de vendas", usuarios: 12, permissoes: { ...defaultPermissoes, acessar_contatos: true, receber_leads_distribuicoes: true, inserir_afiliado_cotacao: true } },
  { id: "4", nome: "Vistoriador", descricao: "Realização e gestão de vistorias", usuarios: 4, permissoes: { ...defaultPermissoes, realizar_vistorias: true, upload_fotos_vistoria: true, ver_lista_vistoriadores: true } },
  { id: "5", nome: "Visualizador", descricao: "Somente leitura", usuarios: 8, permissoes: { ...defaultPermissoes, acessar_relatorios: true } },
];

const secaoMenus = [
  { key: "aprovar_vistoria", label: "Aprovar vistoria" },
  { key: "acessar_financeiro", label: "Acessar painel financeiro" },
  { key: "acessar_relatorios", label: "Acessar relatórios" },
  { key: "acessar_contatos", label: "Acessar contatos" },
  { key: "acessar_configuracoes", label: "Acessar configurações da empresa" },
  { key: "acessar_ferramentas", label: "Acessar ferramentas" },
];

const secaoCotacoes = [
  { key: "atender_cotacoes_sem_consultor", label: "Atender cotações sem consultor" },
  { key: "receber_cotacoes_sem_consultor", label: "Receber cotações sem consultor" },
  { key: "atender_cotacoes_sem_consultor_cooperativa", label: "Atender cotações sem consultor e cooperativa" },
  { key: "receber_cotacoes_sem_consultor_cooperativa", label: "Receber cotações sem consultor e cooperativa" },
  { key: "enviar_cotacoes_sga", label: "Enviar cotações para o SGA" },
  { key: "receber_leads_distribuicoes", label: "Recebe Leads em distribuições de listas" },
  { key: "alterar_responsavel_cotacao", label: "Alterar responsável pela cotação" },
  { key: "inserir_afiliado_cotacao", label: "Inserir afiliado na cotação" },
  { key: "mover_cotacao_etapa", label: "Mover cotação entre qualquer etapa do funil" },
  { key: "alterar_valor_protegido", label: "Alterar valor protegido do veículo" },
  { key: "aplicar_depreciacao", label: "Aplicar depreciação para o veículo" },
  { key: "alterar_valor_mensalidade", label: "Alterar valor da mensalidade" },
  { key: "alterar_tabela_veiculo", label: "Alterar tabela do veículo" },
  { key: "informar_adesao_dinheiro", label: "Informar que a empresa recebeu adesão em dinheiro" },
  { key: "alterar_valor_adesao", label: "Alterar valor da adesão" },
  { key: "alterar_valor_rastreador", label: "Alterar valor do rastreador" },
  { key: "acessar_power_sign", label: "Acessar aba Power Sign" },
  { key: "adicionar_remover_tags", label: "Adicionar e remover tags na negociação" },
  { key: "consultar_placa_cpf_sga", label: "Consultar placa e CPF/CNPJ no SGA" },
];

const secaoVistorias = [
  { key: "realizar_vistorias", label: "Realizar vistorias como vistoriador" },
  { key: "ver_lista_vistoriadores", label: "Ver lista de vistoriadores do App Visto" },
  { key: "ignorar_fluxo_vistorias", label: "Ignorar o fluxo de vistorias" },
  { key: "upload_fotos_vistoria", label: "Fazer upload de fotos de vistoria" },
  { key: "acesso_relatorios_vistoria", label: "Acesso aos relatórios" },
  { key: "relatorio_banco_dados", label: "Relatório de banco de dados" },
];

function PermissaoSecao({ titulo, icone: Icone, items, permissoes, onChange }: {
  titulo: string;
  icone: React.ElementType;
  items: { key: string; label: string }[];
  permissoes: Record<string, boolean>;
  onChange: (key: string, value: boolean) => void;
}) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icone className="h-4 w-4 text-primary" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-1.5 border-b-2 border-[#747474] last:border-0">
            <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">{item.label}</Label>
            <Switch
              id={item.key}
              checked={permissoes[item.key] ?? false}
              onCheckedChange={(v) => onChange(item.key, v)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function GrupoPermissoes() {
  const [grupos, setGrupos] = useState<PermissaoGrupo[]>(mockGrupos);
  const [editing, setEditing] = useState<PermissaoGrupo | null>(null);
  const [creating, setCreating] = useState(false);
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formPermissoes, setFormPermissoes] = useState<Record<string, boolean>>(defaultPermissoes);

  const openCreate = () => {
    setFormNome("");
    setFormDescricao("");
    setFormPermissoes({ ...defaultPermissoes });
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (grupo: PermissaoGrupo) => {
    setFormNome(grupo.nome);
    setFormDescricao(grupo.descricao);
    setFormPermissoes({ ...grupo.permissoes });
    setEditing(grupo);
    setCreating(false);
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleSave = () => {
    if (!formNome.trim()) {
      toast.error("Informe o nome do grupo");
      return;
    }
    if (editing) {
      setGrupos(prev => prev.map(g => g.id === editing.id ? { ...g, nome: formNome, descricao: formDescricao, permissoes: formPermissoes } : g));
      toast.success("Grupo atualizado com sucesso");
    } else {
      setGrupos(prev => [...prev, { id: String(Date.now()), nome: formNome, descricao: formDescricao, usuarios: 0, permissoes: formPermissoes }]);
      toast.success("Grupo criado com sucesso");
    }
    closeForm();
  };

  const handleDelete = (id: string) => {
    setGrupos(prev => prev.filter(g => g.id !== id));
    toast.success("Grupo excluído");
  };

  const handlePermChange = (key: string, value: boolean) => {
    setFormPermissoes(prev => ({ ...prev, [key]: value }));
  };

  const isFormOpen = editing !== null || creating;

  if (isFormOpen) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={closeForm} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar à lista
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{editing ? "Editar Grupo" : "Criar Grupo"}</h2>
            <p className="text-sm text-muted-foreground">Configure as permissões do grupo</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeForm} className="gap-2"><X className="h-4 w-4" />Cancelar</Button>
            <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />Salvar</Button>
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome do Grupo</Label>
                <Input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Ex: Administrador" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Descreva o grupo" />
              </div>
            </div>
          </CardContent>
        </Card>

        <PermissaoSecao titulo="Acessos a Menus" icone={Menu} items={secaoMenus} permissoes={formPermissoes} onChange={handlePermChange} />
        <PermissaoSecao titulo="Permissões em Cotações" icone={FileText} items={secaoCotacoes} permissoes={formPermissoes} onChange={handlePermChange} />
        <PermissaoSecao titulo="Permissões em Vistorias" icone={Eye} items={secaoVistorias} permissoes={formPermissoes} onChange={handlePermChange} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Grupo de Permissões</CardTitle>
            <CardDescription>Defina perfis de acesso ao sistema</CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Criar Grupo</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {grupos.map((grupo) => (
            <div key={grupo.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{grupo.nome}</p>
                  <p className="text-xs text-muted-foreground">{grupo.descricao}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{grupo.usuarios} usuários</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(grupo)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(grupo.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
