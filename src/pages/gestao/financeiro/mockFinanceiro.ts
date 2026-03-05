export const mockBoletos = [
  { id: "BOL-001", associado: "Carlos Eduardo Silva", cpf: "123.456.789-00", cooperativa: "Central SP", regional: "Grande SP", valor: 189.90, vencimento: "2025-07-10", status: "pago" as const, referencia: "07/2025" },
  { id: "BOL-002", associado: "Maria Fernanda Oliveira", cpf: "987.654.321-00", cooperativa: "Central SP", regional: "Grande SP", valor: 245.50, vencimento: "2025-07-10", status: "gerado" as const, referencia: "07/2025" },
  { id: "BOL-003", associado: "José Roberto Santos", cpf: "456.789.123-00", cooperativa: "Norte MG", regional: "Triângulo Mineiro", valor: 312.00, vencimento: "2025-07-10", status: "enviado" as const, referencia: "07/2025" },
  { id: "BOL-004", associado: "Ana Paula Costa", cpf: "321.654.987-00", cooperativa: "Central RJ", regional: "Rio de Janeiro", valor: 178.40, vencimento: "2025-06-10", status: "vencido" as const, referencia: "06/2025" },
  { id: "BOL-005", associado: "Pedro Henrique Lima", cpf: "654.321.987-00", cooperativa: "Norte MG", regional: "Triângulo Mineiro", valor: 267.80, vencimento: "2025-07-10", status: "cancelado" as const, referencia: "07/2025" },
  { id: "BOL-006", associado: "Fernanda Rodrigues", cpf: "789.123.456-00", cooperativa: "Oeste PR", regional: "Curitiba", valor: 198.30, vencimento: "2025-07-10", status: "pago" as const, referencia: "07/2025" },
  { id: "BOL-007", associado: "Ricardo Almeida", cpf: "147.258.369-00", cooperativa: "Central SP", regional: "Campinas", valor: 342.10, vencimento: "2025-07-10", status: "gerado" as const, referencia: "07/2025" },
  { id: "BOL-008", associado: "Juliana Martins", cpf: "258.369.147-00", cooperativa: "Central RJ", regional: "Rio de Janeiro", valor: 156.90, vencimento: "2025-06-10", status: "vencido" as const, referencia: "06/2025" },
];

export const mockCobrancas = [
  { id: "COB-001", associado: "Carlos Eduardo Silva", valor: 189.90, vencimento: "2025-07-10", status: "em_dia" as const, tipo: "Mensalidade", ultimoEnvio: "2025-06-25" },
  { id: "COB-002", associado: "Ana Paula Costa", valor: 356.80, vencimento: "2025-06-10", status: "atrasado" as const, tipo: "Mensalidade + Rateio", ultimoEnvio: "2025-05-28" },
  { id: "COB-003", associado: "José Roberto Santos", valor: 312.00, vencimento: "2025-07-10", status: "em_dia" as const, tipo: "Mensalidade", ultimoEnvio: "2025-06-30" },
  { id: "COB-004", associado: "Pedro Henrique Lima", valor: 534.60, vencimento: "2025-05-10", status: "negativado" as const, tipo: "Mensalidade", ultimoEnvio: "2025-04-25" },
  { id: "COB-005", associado: "Juliana Martins", valor: 156.90, vencimento: "2025-06-10", status: "renegociado" as const, tipo: "Mensalidade", ultimoEnvio: "2025-06-15" },
];

export const mockHistorico = [
  { id: 1, data: "2025-07-01 09:15", tipo: "lote_gerado", descricao: "Lote de boletos 07/2025 gerado — 847 boletos, R$ 198.342,50", usuario: "Admin" },
  { id: 2, data: "2025-07-01 09:30", tipo: "remessa", descricao: "Remessa CNAB 240 enviada ao Banco do Brasil — 847 registros", usuario: "Admin" },
  { id: 3, data: "2025-07-02 14:00", tipo: "retorno", descricao: "Retorno bancário processado — 312 pagamentos confirmados", usuario: "Sistema" },
  { id: 4, data: "2025-07-03 08:45", tipo: "cobranca", descricao: "Envio de cobrança por e-mail — 535 destinatários", usuario: "Admin" },
  { id: 5, data: "2025-07-05 16:20", tipo: "cancelamento", descricao: "Boleto BOL-005 cancelado — motivo: associado cancelou plano", usuario: "Maria Operadora" },
  { id: 6, data: "2025-07-06 10:00", tipo: "retorno", descricao: "Retorno bancário processado — 189 pagamentos confirmados", usuario: "Sistema" },
  { id: 7, data: "2025-07-07 11:30", tipo: "recibo", descricao: "Recibo emitido para Carlos Eduardo Silva — R$ 189,90", usuario: "Admin" },
  { id: 8, data: "2025-07-08 09:00", tipo: "lote_gerado", descricao: "Lote complementar gerado — 23 boletos, R$ 5.412,30", usuario: "Admin" },
];

export const cooperativas = ["Central SP", "Central RJ", "Norte MG", "Oeste PR", "Sul RS"];
export const regionais = ["Grande SP", "Campinas", "Rio de Janeiro", "Triângulo Mineiro", "Curitiba", "Porto Alegre"];
export const statusBoleto = ["gerado", "enviado", "pago", "vencido", "cancelado"] as const;
export type StatusBoleto = typeof statusBoleto[number];

export const statusColors: Record<StatusBoleto, string> = {
  gerado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  enviado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  pago: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  vencido: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};
