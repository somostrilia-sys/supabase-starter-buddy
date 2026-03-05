export type PipelineStage = "novo_lead" | "em_negociacao" | "aguardando_vistoria" | "liberado_cadastro" | "vendas_concretizadas";

export interface PipelineDeal {
  id: string;
  lead_nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  plano: string;
  stage: PipelineStage;
  consultor: string;
  cooperativa: string;
  regional: string;
  gerente: string;
  origem: string;
  observacoes: string;
  enviado_sga: boolean;
  visualizacoes_proposta: number;
  created_at: string;
  updated_at: string;
}

export const stageColumns: { key: PipelineStage; label: string; color: string; bg: string; dot: string }[] = [
  { key: "novo_lead", label: "Novo Lead", color: "#3B82F6", bg: "bg-blue-500/5", dot: "bg-blue-500" },
  { key: "em_negociacao", label: "Em Negociação", color: "#F59E0B", bg: "bg-amber-500/5", dot: "bg-amber-500" },
  { key: "aguardando_vistoria", label: "Aguardando Vistoria", color: "#F97316", bg: "bg-orange-500/5", dot: "bg-orange-500" },
  { key: "liberado_cadastro", label: "Liberado p/ Cadastro", color: "#84CC16", bg: "bg-lime-500/5", dot: "bg-lime-500" },
  { key: "vendas_concretizadas", label: "Vendas Concretizadas", color: "#22C55E", bg: "bg-green-500/5", dot: "bg-green-500" },
];

export const consultores = ["Ana Silva", "Carlos Souza", "Maria Lima"];
export const gerentes = ["Roberto Costa", "Fernanda Dias"];
export const cooperativas = ["Coop Norte", "Coop Sul", "Coop Leste"];
export const regionais = ["SP Capital", "Interior SP", "RJ", "MG"];
export const planos = ["Básico", "Intermediário", "Premium", "Frota"];

const day = 86400000;

export const mockDeals: PipelineDeal[] = [
  // Novo Lead (3)
  { id: "p1", lead_nome: "João Pereira", cpf_cnpj: "123.456.789-00", telefone: "(11) 98765-1234", email: "joao@email.com", veiculo_modelo: "Honda Civic 2022", veiculo_placa: "ABC-1D23", plano: "Premium", stage: "novo_lead", consultor: "Ana Silva", cooperativa: "Coop Norte", regional: "SP Capital", gerente: "Roberto Costa", origem: "WhatsApp", observacoes: "", enviado_sga: false, visualizacoes_proposta: 0, created_at: new Date(Date.now() - 0.5 * day).toISOString(), updated_at: new Date(Date.now() - 0.5 * day).toISOString() },
  { id: "p2", lead_nome: "Maria Santos", cpf_cnpj: "987.654.321-00", telefone: "(11) 97654-5678", email: "maria@email.com", veiculo_modelo: "VW Gol 2023", veiculo_placa: "DEF-2G34", plano: "Básico", stage: "novo_lead", consultor: "Carlos Souza", cooperativa: "Coop Sul", regional: "Interior SP", gerente: "Fernanda Dias", origem: "Facebook", observacoes: "", enviado_sga: false, visualizacoes_proposta: 0, created_at: new Date(Date.now() - 2 * day).toISOString(), updated_at: new Date(Date.now() - 1 * day).toISOString() },
  { id: "p3", lead_nome: "Carlos Oliveira", cpf_cnpj: "456.789.123-00", telefone: "(21) 99876-4321", email: "carlos@email.com", veiculo_modelo: "Fiat Argo 2024", veiculo_placa: "GHI-3J45", plano: "Intermediário", stage: "novo_lead", consultor: "Maria Lima", cooperativa: "Coop Leste", regional: "RJ", gerente: "Roberto Costa", origem: "Indicação", observacoes: "", enviado_sga: false, visualizacoes_proposta: 0, created_at: new Date(Date.now() - 5 * day).toISOString(), updated_at: new Date(Date.now() - 4 * day).toISOString() },
  // Em Negociação (2)
  { id: "p4", lead_nome: "Ana Costa", cpf_cnpj: "321.654.987-00", telefone: "(11) 91234-5678", email: "ana@email.com", veiculo_modelo: "Toyota Corolla 2023", veiculo_placa: "JKL-4M56", plano: "Premium", stage: "em_negociacao", consultor: "Ana Silva", cooperativa: "Coop Norte", regional: "SP Capital", gerente: "Roberto Costa", origem: "Google", observacoes: "", enviado_sga: true, visualizacoes_proposta: 3, created_at: new Date(Date.now() - 3 * day).toISOString(), updated_at: new Date(Date.now() - 0.2 * day).toISOString() },
  { id: "p5", lead_nome: "Roberto Lima", cpf_cnpj: "654.321.987-00", telefone: "(31) 98765-9876", email: "roberto@email.com", veiculo_modelo: "Hyundai HB20 2024", veiculo_placa: "MNO-5P67", plano: "Básico", stage: "em_negociacao", consultor: "Carlos Souza", cooperativa: "Coop Sul", regional: "MG", gerente: "Fernanda Dias", origem: "Telefone", observacoes: "", enviado_sga: false, visualizacoes_proposta: 1, created_at: new Date(Date.now() - 1 * day).toISOString(), updated_at: new Date(Date.now() - 0.5 * day).toISOString() },
  // Aguardando Vistoria (1)
  { id: "p6", lead_nome: "Fernanda Alves", cpf_cnpj: "789.123.456-00", telefone: "(11) 93456-7890", email: "fernanda@email.com", veiculo_modelo: "Chevrolet Tracker 2024", veiculo_placa: "QRS-6T78", plano: "Premium", stage: "aguardando_vistoria", consultor: "Maria Lima", cooperativa: "Coop Norte", regional: "SP Capital", gerente: "Roberto Costa", origem: "WhatsApp", observacoes: "", enviado_sga: true, visualizacoes_proposta: 5, created_at: new Date(Date.now() - 4 * day).toISOString(), updated_at: new Date(Date.now() - 3.5 * day).toISOString() },
  // Liberado p/ Cadastro (1)
  { id: "p7", lead_nome: "Pedro Souza", cpf_cnpj: "147.258.369-00", telefone: "(21) 92345-6789", email: "pedro@email.com", veiculo_modelo: "Jeep Compass 2024", veiculo_placa: "UVW-7X89", plano: "Frota", stage: "liberado_cadastro", consultor: "Ana Silva", cooperativa: "Coop Leste", regional: "RJ", gerente: "Fernanda Dias", origem: "Indicação", observacoes: "", enviado_sga: true, visualizacoes_proposta: 2, created_at: new Date(Date.now() - 6 * day).toISOString(), updated_at: new Date(Date.now() - 0.1 * day).toISOString() },
  // Vendas Concretizadas (1)
  { id: "p8", lead_nome: "Juliana Mendes", cpf_cnpj: "258.369.147-00", telefone: "(31) 91234-0987", email: "juliana@email.com", veiculo_modelo: "Honda HR-V 2023", veiculo_placa: "YZA-8B01", plano: "Intermediário", stage: "vendas_concretizadas", consultor: "Carlos Souza", cooperativa: "Coop Sul", regional: "MG", gerente: "Roberto Costa", origem: "Facebook", observacoes: "", enviado_sga: true, visualizacoes_proposta: 7, created_at: new Date(Date.now() - 10 * day).toISOString(), updated_at: new Date(Date.now() - 1 * day).toISOString() },
];

export const mockActivities = [
  { id: "a1", tipo: "Ligação", descricao: "Primeiro contato realizado", data: new Date(Date.now() - 5 * day).toISOString(), usuario: "Ana Silva" },
  { id: "a2", tipo: "WhatsApp", descricao: "Enviou proposta por WhatsApp", data: new Date(Date.now() - 4 * day).toISOString(), usuario: "Ana Silva" },
  { id: "a3", tipo: "Email", descricao: "Documentação solicitada", data: new Date(Date.now() - 3 * day).toISOString(), usuario: "Carlos Souza" },
  { id: "a4", tipo: "Reunião", descricao: "Reunião presencial agendada", data: new Date(Date.now() - 1 * day).toISOString(), usuario: "Maria Lima" },
];
