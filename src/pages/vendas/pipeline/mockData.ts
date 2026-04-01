export type PipelineStage = "novo_lead" | "em_contato" | "em_negociacao" | "aguardando_vistoria" | "liberado_cadastro" | "concluido" | "perdido";

export interface DealStatus {
  aceita: boolean;
  pendente: boolean;
  aprovada: boolean;
  sga: boolean;
  rastreador: boolean;
  inadimplencia: boolean;
}

export interface PipelineDeal {
  id: string;
  codigo: string;
  lead_nome: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  plano: string;
  valor_plano: number;
  stage: PipelineStage;
  consultor: string;
  cooperativa: string;
  regional: string;
  gerente: string;
  origem: string;
  observacoes: string;
  enviado_sga: boolean;
  visualizacoes_proposta: number;
  status_icons: DealStatus;
  created_at: string;
  updated_at: string;
}

export const stageColumns: { key: PipelineStage; label: string; color: string; bg: string; dot: string }[] = [
  { key: "novo_lead", label: "Novo Lead", color: "#6366F1", bg: "bg-muted/20", dot: "bg-indigo-500" },
  { key: "em_contato", label: "Em Contato", color: "#3B82F6", bg: "bg-muted/20", dot: "bg-blue-500" },
  { key: "em_negociacao", label: "Em Negociação", color: "#F97316", bg: "bg-muted/20", dot: "bg-orange-500" },
  { key: "aguardando_vistoria", label: "Aguardando Vistoria", color: "#8B5CF6", bg: "bg-muted/20", dot: "bg-purple-500" },
  { key: "liberado_cadastro", label: "Liberado p/ Cadastro", color: "#84CC16", bg: "bg-muted/20", dot: "bg-lime-500" },
  { key: "concluido", label: "Concluído", color: "#22C55E", bg: "bg-muted/20", dot: "bg-green-500" },
];

export const stageColumnPerdido = { key: "perdido" as PipelineStage, label: "Perdido / Arquivado", color: "#EF4444", bg: "bg-muted/20", dot: "bg-red-500" };

// Transições permitidas por drag manual
export const DRAG_ALLOWED: Record<PipelineStage, PipelineStage[]> = {
  novo_lead: ["em_contato", "perdido"],
  em_contato: ["novo_lead", "perdido"],
  em_negociacao: ["perdido"],
  aguardando_vistoria: ["perdido"],
  liberado_cadastro: ["perdido"],
  concluido: [],
  perdido: ["novo_lead"],
};

export const consultores: string[] = [];
export const gerentes: string[] = [];
export const cooperativas: string[] = [];
export const regionais: string[] = [];
export const planos = ["Básico", "Completo", "Objetivo", "Premium", "Objetivo (Leves)", "PESADOS"];

const day = 86400000;

export const mockDeals: PipelineDeal[] = [];
