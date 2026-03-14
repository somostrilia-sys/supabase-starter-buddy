import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Search, User, Car, DollarSign, FileText, Clock, AlertTriangle,
  Eye, Pencil, History, ArrowLeft, Save, Upload, Trash2, Plus,
  Download, ChevronLeft, ChevronRight, X, MapPin, Phone, Mail,
  Heart, KeyRound, Landmark, GraduationCap,
} from "lucide-react";

// ─── Mock Data ───
const ufs = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

interface Associado {
  id: string; codigo: string; nome: string; cpf: string; rg: string;
  dataNasc: string; sexo: string; estadoCivil: string; profissao: string;
  cnh: string; categoriaCnh: string; escolaridade: string;
  celular: string; telResidencial: string; telComercial: string;
  email: string; emailAux: string; contato: string;
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; cidade: string; estado: string;
  nomeConjuge: string; nomePai: string; nomeMae: string;
  regional: string; cooperativa: string; consultorResp: string;
  banco: string; agencia: string; contaCorrente: string; diaVencimento: string;
  observacoes: string; status: string; plano: string; dataAdesao: string;
  veiculos: { placa: string; modelo: string; marca: string; ano: number; cor: string; situacao: string; plano: string }[];
  lancamentos: { data: string; tipo: string; valor: number; status: string; vencimento: string }[];
  documentos: { nome: string; tipo: string; dataUpload: string }[];
  historico: { dataHora: string; usuario: string; campo: string; anterior: string; novo: string }[];
  ocorrencias: { numero: string; data: string; tipo: string; placa: string; status: string; valorEstimado: number }[];
}

const mockAssociados: Associado[] = [
  {
    id: "1", codigo: "A01000", nome: "Carlos Alberto Silva", cpf: "342.876.541-09", rg: "28.456.789-3",
    dataNasc: "1985-03-15", sexo: "Masculino", estadoCivil: "Casado", profissao: "Engenheiro Civil",
    cnh: "04512367890", categoriaCnh: "B", escolaridade: "Superior",
    celular: "(11) 99845-3210", telResidencial: "(11) 3254-8790", telComercial: "",
    email: "carlos.silva@email.com", emailAux: "", contato: "Maria Helena",
    cep: "01310-100", logradouro: "Av. Paulista", numero: "1578", complemento: "Apto 42",
    bairro: "Bela Vista", cidade: "São Paulo", estado: "SP",
    nomeConjuge: "Maria Helena Silva", nomePai: "José Alberto Silva", nomeMae: "Ana Maria Santos",
    regional: "Regional Capital", cooperativa: "Cooperativa São Paulo", consultorResp: "Ana Beatriz",
    banco: "Bradesco", agencia: "1234", contaCorrente: "56789-0", diaVencimento: "10",
    observacoes: "", status: "Ativo", plano: "Completo", dataAdesao: "2022-01-15",
    veiculos: [
      { placa: "BRA-2E19", modelo: "T-Cross 200 TSI", marca: "Volkswagen", ano: 2024, cor: "Branco", situacao: "Ativo", plano: "Completo" },
      { placa: "SPX-4H56", modelo: "Polo TSI", marca: "Volkswagen", ano: 2022, cor: "Cinza", situacao: "Ativo", plano: "Básico" },
    ],
    lancamentos: [
      { data: "2026-03-05", tipo: "Mensalidade", valor: 189.90, status: "Pendente", vencimento: "2026-03-10" },
      { data: "2026-02-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2026-02-10" },
      { data: "2026-01-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2026-01-10" },
      { data: "2025-12-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-12-10" },
      { data: "2025-11-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-11-10" },
      { data: "2025-10-10", tipo: "Mensalidade", valor: 189.90, status: "Atrasado", vencimento: "2025-10-10" },
      { data: "2025-09-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-09-10" },
      { data: "2022-01-15", tipo: "Adesão", valor: 350.00, status: "Pago", vencimento: "2022-01-20" },
      { data: "2022-01-20", tipo: "Rastreador", valor: 250.00, status: "Pago", vencimento: "2022-01-25" },
      { data: "2025-08-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-08-10" },
    ],
    documentos: [
      { nome: "CNH_Carlos_Silva.pdf", tipo: "CNH", dataUpload: "15/01/2022" },
      { nome: "CRLV_BRA2E19.pdf", tipo: "CRLV", dataUpload: "15/01/2022" },
      { nome: "Comprovante_Residencia.pdf", tipo: "Comprovante", dataUpload: "15/01/2022" },
      { nome: "Contrato_Adesao.pdf", tipo: "Contrato", dataUpload: "15/01/2022" },
    ],
    historico: [
      { dataHora: "05/03/2026 09:30", usuario: "admin@gia.com", campo: "Celular", anterior: "(11) 98000-0000", novo: "(11) 99845-3210" },
      { dataHora: "28/02/2026 14:15", usuario: "operador@gia.com", campo: "Endereço", anterior: "Rua Augusta, 500", novo: "Av. Paulista, 1578" },
      { dataHora: "15/02/2026 10:00", usuario: "admin@gia.com", campo: "Plano", anterior: "Intermediário", novo: "Completo" },
      { dataHora: "01/02/2026 16:45", usuario: "operador@gia.com", campo: "Email", anterior: "carlos@antigo.com", novo: "carlos.silva@email.com" },
      { dataHora: "20/01/2026 08:30", usuario: "admin@gia.com", campo: "Status", anterior: "Suspenso", novo: "Ativo" },
      { dataHora: "10/01/2026 11:20", usuario: "financeiro@gia.com", campo: "Dia Vencimento", anterior: "5", novo: "10" },
      { dataHora: "05/01/2026 13:00", usuario: "admin@gia.com", campo: "Cooperativa", anterior: "Cooperativa Rio", novo: "Cooperativa São Paulo" },
      { dataHora: "20/12/2025 09:45", usuario: "operador@gia.com", campo: "Profissão", anterior: "Arquiteto", novo: "Engenheiro Civil" },
      { dataHora: "10/12/2025 15:30", usuario: "admin@gia.com", campo: "Regional", anterior: "Regional Interior", novo: "Regional Capital" },
      { dataHora: "01/12/2025 10:15", usuario: "operador@gia.com", campo: "Nome Cônjuge", anterior: "", novo: "Maria Helena Silva" },
      { dataHora: "15/11/2025 14:00", usuario: "financeiro@gia.com", campo: "Banco", anterior: "Itaú", novo: "Bradesco" },
      { dataHora: "01/11/2025 08:00", usuario: "admin@gia.com", campo: "Veículo Vinculado", anterior: "-", novo: "SPX-4H56 (Polo TSI)" },
    ],
    ocorrencias: [
      { numero: "SIN-2026-001", data: "2026-02-10", tipo: "Colisão", placa: "BRA-2E19", status: "Em Análise", valorEstimado: 8500 },
      { numero: "SIN-2025-045", data: "2025-08-22", tipo: "Roubo", placa: "SPX-4H56", status: "Aprovado", valorEstimado: 45000 },
      { numero: "SIN-2025-012", data: "2025-03-15", tipo: "Furto", placa: "BRA-2E19", status: "Concluído", valorEstimado: 3200 },
      { numero: "SIN-2024-089", data: "2024-11-05", tipo: "Incêndio", placa: "BRA-2E19", status: "Negado", valorEstimado: 95000 },
      { numero: "SIN-2024-034", data: "2024-06-18", tipo: "Colisão", placa: "SPX-4H56", status: "Concluído", valorEstimado: 5600 },
    ],
  },
  {
    id: "2", codigo: "A01001", nome: "Maria Aparecida Santos", cpf: "456.123.789-00", rg: "32.654.987-1",
    dataNasc: "1990-07-22", sexo: "Feminino", estadoCivil: "Solteiro", profissao: "Médica",
    cnh: "98765432100", categoriaCnh: "AB", escolaridade: "Pós-graduação",
    celular: "(19) 98765-4321", telResidencial: "", telComercial: "(19) 3234-5678",
    email: "maria.santos@email.com", emailAux: "maria.s@gmail.com", contato: "",
    cep: "13015-000", logradouro: "Rua Barão de Jaguara", numero: "890", complemento: "",
    bairro: "Centro", cidade: "Campinas", estado: "SP",
    nomeConjuge: "", nomePai: "Antônio Santos", nomeMae: "Rosa Maria Santos",
    regional: "Regional Interior", cooperativa: "Cooperativa Campinas", consultorResp: "Ricardo Souza",
    banco: "Itaú", agencia: "5678", contaCorrente: "12345-6", diaVencimento: "15",
    observacoes: "Profissional da saúde, horários restritos para contato.", status: "Ativo", plano: "Premium", dataAdesao: "2023-05-10",
    veiculos: [
      { placa: "CPS-3G78", modelo: "Civic EXL 2.0", marca: "Honda", ano: 2023, cor: "Prata", situacao: "Ativo", plano: "Premium" },
      { placa: "CPS-9J12", modelo: "HR-V EXL", marca: "Honda", ano: 2024, cor: "Azul", situacao: "Ativo", plano: "Premium" },
    ],
    lancamentos: [
      { data: "2026-03-01", tipo: "Mensalidade", valor: 249.90, status: "Pendente", vencimento: "2026-03-15" },
      { data: "2026-02-15", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2026-02-15" },
      { data: "2026-01-15", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2026-01-15" },
      { data: "2025-12-15", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-12-15" },
      { data: "2025-11-15", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-11-15" },
      { data: "2025-10-15", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-10-15" },
      { data: "2025-09-15", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-09-15" },
      { data: "2025-08-15", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-08-15" },
      { data: "2023-05-10", tipo: "Adesão", valor: 450.00, status: "Pago", vencimento: "2023-05-15" },
      { data: "2023-05-15", tipo: "Rastreador", valor: 300.00, status: "Pago", vencimento: "2023-05-20" },
    ],
    documentos: [
      { nome: "CNH_Maria_Santos.pdf", tipo: "CNH", dataUpload: "10/05/2023" },
      { nome: "CRLV_CPS3G78.pdf", tipo: "CRLV", dataUpload: "10/05/2023" },
      { nome: "Comprovante_Campinas.pdf", tipo: "Comprovante", dataUpload: "10/05/2023" },
      { nome: "Contrato_Maria.pdf", tipo: "Contrato", dataUpload: "10/05/2023" },
    ],
    historico: [
      { dataHora: "01/03/2026 10:00", usuario: "admin@gia.com", campo: "Telefone Comercial", anterior: "", novo: "(19) 3234-5678" },
      { dataHora: "15/02/2026 09:30", usuario: "operador@gia.com", campo: "Email Auxiliar", anterior: "", novo: "maria.s@gmail.com" },
      { dataHora: "01/01/2026 11:00", usuario: "admin@gia.com", campo: "Veículo Vinculado", anterior: "-", novo: "CPS-9J12 (HR-V EXL)" },
    ],
    ocorrencias: [
      { numero: "SIN-2025-078", data: "2025-09-12", tipo: "Colisão", placa: "CPS-3G78", status: "Concluído", valorEstimado: 12000 },
    ],
  },
  {
    id: "3", codigo: "A01002", nome: "José Roberto Oliveira", cpf: "789.654.321-55", rg: "45.123.678-9",
    dataNasc: "1978-11-03", sexo: "Masculino", estadoCivil: "Divorciado", profissao: "Comerciante",
    cnh: "11223344556", categoriaCnh: "D", escolaridade: "Médio",
    celular: "(21) 99654-8712", telResidencial: "(21) 2456-7890", telComercial: "",
    email: "jose.oliveira@email.com", emailAux: "", contato: "Fernanda",
    cep: "20040-020", logradouro: "Rua da Assembleia", numero: "45", complemento: "Sala 302",
    bairro: "Centro", cidade: "Rio de Janeiro", estado: "RJ",
    nomeConjuge: "", nomePai: "Roberto Oliveira", nomeMae: "Lúcia Oliveira",
    regional: "Regional Litoral", cooperativa: "Cooperativa Rio", consultorResp: "Camila Oliveira",
    banco: "Banco do Brasil", agencia: "3456", contaCorrente: "78901-2", diaVencimento: "5",
    observacoes: "Associado com restrição pendente.", status: "Suspenso", plano: "Intermediário", dataAdesao: "2021-08-20",
    veiculos: [
      { placa: "RJO-5K34", modelo: "Hilux SRV 4x4", marca: "Toyota", ano: 2022, cor: "Preto", situacao: "Ativo", plano: "Intermediário" },
      { placa: "RJO-8M67", modelo: "Corolla XEi", marca: "Toyota", ano: 2021, cor: "Branco", situacao: "Suspenso", plano: "Intermediário" },
    ],
    lancamentos: [
      { data: "2026-03-01", tipo: "Mensalidade", valor: 139.90, status: "Atrasado", vencimento: "2026-03-05" },
      { data: "2026-02-05", tipo: "Mensalidade", valor: 139.90, status: "Atrasado", vencimento: "2026-02-05" },
      { data: "2026-01-05", tipo: "Mensalidade", valor: 139.90, status: "Atrasado", vencimento: "2026-01-05" },
      { data: "2025-12-05", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-12-05" },
      { data: "2025-11-05", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-11-05" },
      { data: "2025-10-05", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-10-05" },
      { data: "2025-09-05", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-09-05" },
      { data: "2025-08-05", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-08-05" },
      { data: "2021-08-20", tipo: "Adesão", valor: 300.00, status: "Pago", vencimento: "2021-08-25" },
      { data: "2021-08-25", tipo: "Rastreador", valor: 200.00, status: "Pago", vencimento: "2021-08-30" },
    ],
    documentos: [
      { nome: "CNH_Jose_Oliveira.pdf", tipo: "CNH", dataUpload: "20/08/2021" },
      { nome: "CRLV_RJO5K34.pdf", tipo: "CRLV", dataUpload: "20/08/2021" },
      { nome: "Comprovante_RJ.pdf", tipo: "Comprovante", dataUpload: "20/08/2021" },
      { nome: "Contrato_Jose.pdf", tipo: "Contrato", dataUpload: "20/08/2021" },
    ],
    historico: [
      { dataHora: "01/03/2026 08:00", usuario: "financeiro@gia.com", campo: "Status", anterior: "Ativo", novo: "Suspenso" },
      { dataHora: "15/02/2026 14:30", usuario: "admin@gia.com", campo: "Observações", anterior: "", novo: "Associado com restrição pendente." },
    ],
    ocorrencias: [
      { numero: "SIN-2025-090", data: "2025-10-02", tipo: "Roubo", placa: "RJO-8M67", status: "Aberto", valorEstimado: 85000 },
      { numero: "SIN-2024-055", data: "2024-07-14", tipo: "Colisão", placa: "RJO-5K34", status: "Concluído", valorEstimado: 15000 },
    ],
  },
  {
    id: "4", codigo: "A01003", nome: "Ana Paula Ferreira", cpf: "123.456.789-10", rg: "50.987.654-2",
    dataNasc: "1992-05-18", sexo: "Feminino", estadoCivil: "Casado", profissao: "Advogada",
    cnh: "55667788990", categoriaCnh: "B", escolaridade: "Pós-graduação",
    celular: "(31) 99876-5432", telResidencial: "", telComercial: "(31) 3456-7890",
    email: "ana.ferreira@email.com", emailAux: "", contato: "",
    cep: "30130-000", logradouro: "Av. Afonso Pena", numero: "2100", complemento: "Cobertura",
    bairro: "Funcionários", cidade: "Belo Horizonte", estado: "MG",
    nomeConjuge: "Pedro Henrique Ferreira", nomePai: "Marcos Ferreira", nomeMae: "Claudia Ferreira",
    regional: "Regional Capital", cooperativa: "Cooperativa Minas", consultorResp: "Pedro Lima",
    banco: "Nubank", agencia: "0001", contaCorrente: "99887-7", diaVencimento: "20",
    observacoes: "", status: "Ativo", plano: "Premium", dataAdesao: "2024-02-01",
    veiculos: [
      { placa: "BHZ-1A45", modelo: "Compass Limited", marca: "Jeep", ano: 2024, cor: "Vermelho", situacao: "Ativo", plano: "Premium" },
      { placa: "BHZ-7C89", modelo: "Renegade Sport", marca: "Jeep", ano: 2023, cor: "Preto", situacao: "Ativo", plano: "Básico" },
    ],
    lancamentos: [
      { data: "2026-03-01", tipo: "Mensalidade", valor: 249.90, status: "Pendente", vencimento: "2026-03-20" },
      { data: "2026-02-20", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2026-02-20" },
      { data: "2026-01-20", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2026-01-20" },
      { data: "2025-12-20", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-12-20" },
      { data: "2025-11-20", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-11-20" },
      { data: "2025-10-20", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-10-20" },
      { data: "2025-09-20", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-09-20" },
      { data: "2024-02-01", tipo: "Adesão", valor: 500.00, status: "Pago", vencimento: "2024-02-05" },
      { data: "2024-02-05", tipo: "Rastreador", valor: 350.00, status: "Pago", vencimento: "2024-02-10" },
      { data: "2025-08-20", tipo: "Mensalidade", valor: 249.90, status: "Pago", vencimento: "2025-08-20" },
    ],
    documentos: [
      { nome: "CNH_Ana_Ferreira.pdf", tipo: "CNH", dataUpload: "01/02/2024" },
      { nome: "CRLV_BHZ1A45.pdf", tipo: "CRLV", dataUpload: "01/02/2024" },
      { nome: "Comprovante_BH.pdf", tipo: "Comprovante", dataUpload: "01/02/2024" },
      { nome: "Contrato_Ana.pdf", tipo: "Contrato", dataUpload: "01/02/2024" },
    ],
    historico: [
      { dataHora: "20/02/2026 10:00", usuario: "admin@gia.com", campo: "Plano", anterior: "Completo", novo: "Premium" },
    ],
    ocorrencias: [],
  },
  {
    id: "5", codigo: "A01004", nome: "Francisco das Chagas Lima", cpf: "321.654.987-00", rg: "15.678.432-0",
    dataNasc: "1970-01-25", sexo: "Masculino", estadoCivil: "Viúvo", profissao: "Autônomo",
    cnh: "33445566778", categoriaCnh: "C", escolaridade: "Fundamental",
    celular: "(85) 99123-4567", telResidencial: "(85) 3234-5678", telComercial: "",
    email: "francisco.lima@email.com", emailAux: "", contato: "Ana Lima",
    cep: "60060-000", logradouro: "Rua Major Facundo", numero: "200", complemento: "",
    bairro: "Centro", cidade: "Fortaleza", estado: "CE",
    nomeConjuge: "", nomePai: "Antônio Lima", nomeMae: "Maria das Graças",
    regional: "Regional Metropolitana", cooperativa: "Cooperativa Nordeste", consultorResp: "Ana Beatriz",
    banco: "Caixa", agencia: "0100", contaCorrente: "45678-9", diaVencimento: "25",
    observacoes: "", status: "Inativo", plano: "Básico", dataAdesao: "2020-06-15",
    veiculos: [
      { placa: "FOR-2D56", modelo: "Strada Freedom", marca: "Fiat", ano: 2021, cor: "Branco", situacao: "Inativo", plano: "Básico" },
      { placa: "FOR-6F90", modelo: "Toro Ranch", marca: "Fiat", ano: 2020, cor: "Cinza", situacao: "Inativo", plano: "Básico" },
    ],
    lancamentos: [
      { data: "2025-06-25", tipo: "Mensalidade", valor: 89.90, status: "Atrasado", vencimento: "2025-06-25" },
      { data: "2025-05-25", tipo: "Mensalidade", valor: 89.90, status: "Atrasado", vencimento: "2025-05-25" },
      { data: "2025-04-25", tipo: "Mensalidade", valor: 89.90, status: "Atrasado", vencimento: "2025-04-25" },
      { data: "2025-03-25", tipo: "Mensalidade", valor: 89.90, status: "Pago", vencimento: "2025-03-25" },
      { data: "2025-02-25", tipo: "Mensalidade", valor: 89.90, status: "Pago", vencimento: "2025-02-25" },
      { data: "2025-01-25", tipo: "Mensalidade", valor: 89.90, status: "Pago", vencimento: "2025-01-25" },
      { data: "2024-12-25", tipo: "Mensalidade", valor: 89.90, status: "Pago", vencimento: "2024-12-25" },
      { data: "2024-11-25", tipo: "Mensalidade", valor: 89.90, status: "Pago", vencimento: "2024-11-25" },
      { data: "2020-06-15", tipo: "Adesão", valor: 200.00, status: "Pago", vencimento: "2020-06-20" },
      { data: "2020-06-20", tipo: "Rastreador", valor: 150.00, status: "Pago", vencimento: "2020-06-25" },
    ],
    documentos: [
      { nome: "CNH_Francisco.pdf", tipo: "CNH", dataUpload: "15/06/2020" },
      { nome: "CRLV_FOR2D56.pdf", tipo: "CRLV", dataUpload: "15/06/2020" },
      { nome: "Comprovante_Fortaleza.pdf", tipo: "Comprovante", dataUpload: "15/06/2020" },
      { nome: "Contrato_Francisco.pdf", tipo: "Contrato", dataUpload: "15/06/2020" },
    ],
    historico: [
      { dataHora: "01/07/2025 10:00", usuario: "financeiro@gia.com", campo: "Status", anterior: "Ativo", novo: "Inativo" },
      { dataHora: "15/06/2025 09:00", usuario: "admin@gia.com", campo: "Observações", anterior: "", novo: "Inadimplência - 3 meses" },
    ],
    ocorrencias: [
      { numero: "SIN-2024-100", data: "2024-09-10", tipo: "Furto", placa: "FOR-6F90", status: "Concluído", valorEstimado: 25000 },
    ],
  },
  {
    id: "6", codigo: "A01005", nome: "Adriana Souza Rodrigues", cpf: "654.987.321-88", rg: "38.765.432-5",
    dataNasc: "1988-09-12", sexo: "Feminino", estadoCivil: "União Estável", profissao: "Professora",
    cnh: "66778899001", categoriaCnh: "B", escolaridade: "Mestrado",
    celular: "(41) 99234-5678", telResidencial: "", telComercial: "",
    email: "adriana.rodrigues@email.com", emailAux: "", contato: "",
    cep: "80060-000", logradouro: "Rua XV de Novembro", numero: "700", complemento: "Apto 15",
    bairro: "Centro", cidade: "Curitiba", estado: "PR",
    nomeConjuge: "Marcos Rodrigues", nomePai: "João Souza", nomeMae: "Teresa Souza",
    regional: "Regional Capital", cooperativa: "Cooperativa Sul", consultorResp: "Ricardo Souza",
    banco: "Inter", agencia: "0001", contaCorrente: "33445-5", diaVencimento: "15",
    observacoes: "", status: "Ativo", plano: "Intermediário", dataAdesao: "2023-09-01",
    veiculos: [
      { placa: "CWB-4E23", modelo: "Creta Platinum", marca: "Hyundai", ano: 2024, cor: "Azul", situacao: "Ativo", plano: "Intermediário" },
      { placa: "CWB-8G67", modelo: "HB20S Diamond", marca: "Hyundai", ano: 2023, cor: "Branco", situacao: "Ativo", plano: "Básico" },
    ],
    lancamentos: [
      { data: "2026-03-01", tipo: "Mensalidade", valor: 139.90, status: "Pendente", vencimento: "2026-03-15" },
      { data: "2026-02-15", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2026-02-15" },
      { data: "2026-01-15", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2026-01-15" },
      { data: "2025-12-15", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-12-15" },
      { data: "2025-11-15", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-11-15" },
      { data: "2025-10-15", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-10-15" },
      { data: "2025-09-15", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-09-15" },
      { data: "2025-08-15", tipo: "Mensalidade", valor: 139.90, status: "Pago", vencimento: "2025-08-15" },
      { data: "2023-09-01", tipo: "Adesão", valor: 350.00, status: "Pago", vencimento: "2023-09-05" },
      { data: "2023-09-05", tipo: "Rastreador", valor: 250.00, status: "Pago", vencimento: "2023-09-10" },
    ],
    documentos: [
      { nome: "CNH_Adriana.pdf", tipo: "CNH", dataUpload: "01/09/2023" },
      { nome: "CRLV_CWB4E23.pdf", tipo: "CRLV", dataUpload: "01/09/2023" },
      { nome: "Comprovante_Curitiba.pdf", tipo: "Comprovante", dataUpload: "01/09/2023" },
      { nome: "Contrato_Adriana.pdf", tipo: "Contrato", dataUpload: "01/09/2023" },
    ],
    historico: [
      { dataHora: "10/02/2026 11:00", usuario: "admin@gia.com", campo: "Veículo Vinculado", anterior: "-", novo: "CWB-8G67 (HB20S Diamond)" },
    ],
    ocorrencias: [],
  },
  {
    id: "7", codigo: "A01006", nome: "Paulo Henrique Almeida", cpf: "987.321.654-77", rg: "42.876.543-8",
    dataNasc: "1982-04-30", sexo: "Masculino", estadoCivil: "Casado", profissao: "Funcionário Público",
    cnh: "22334455667", categoriaCnh: "AE", escolaridade: "Superior",
    celular: "(62) 99345-6789", telResidencial: "(62) 3234-5678", telComercial: "",
    email: "paulo.almeida@email.com", emailAux: "", contato: "Sandra Almeida",
    cep: "74003-000", logradouro: "Av. Goiás", numero: "1500", complemento: "",
    bairro: "Setor Central", cidade: "Goiânia", estado: "GO",
    nomeConjuge: "Sandra Almeida", nomePai: "Henrique Almeida", nomeMae: "Lúcia Almeida",
    regional: "Regional Interior", cooperativa: "Cooperativa Centro-Oeste", consultorResp: "Camila Oliveira",
    banco: "Santander", agencia: "2345", contaCorrente: "67890-1", diaVencimento: "10",
    observacoes: "", status: "Ativo", plano: "Completo", dataAdesao: "2022-11-01",
    veiculos: [
      { placa: "GYN-6F45", modelo: "SW4 SRX", marca: "Toyota", ano: 2023, cor: "Preto", situacao: "Ativo", plano: "Completo" },
      { placa: "GYN-2H89", modelo: "Kicks Advance", marca: "Nissan", ano: 2024, cor: "Vermelho", situacao: "Ativo", plano: "Intermediário" },
    ],
    lancamentos: [
      { data: "2026-03-01", tipo: "Mensalidade", valor: 189.90, status: "Pendente", vencimento: "2026-03-10" },
      { data: "2026-02-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2026-02-10" },
      { data: "2026-01-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2026-01-10" },
      { data: "2025-12-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-12-10" },
      { data: "2025-11-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-11-10" },
      { data: "2025-10-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-10-10" },
      { data: "2025-09-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-09-10" },
      { data: "2025-08-10", tipo: "Mensalidade", valor: 189.90, status: "Pago", vencimento: "2025-08-10" },
      { data: "2022-11-01", tipo: "Adesão", valor: 400.00, status: "Pago", vencimento: "2022-11-05" },
      { data: "2022-11-05", tipo: "Rastreador", valor: 280.00, status: "Pago", vencimento: "2022-11-10" },
    ],
    documentos: [
      { nome: "CNH_Paulo.pdf", tipo: "CNH", dataUpload: "01/11/2022" },
      { nome: "CRLV_GYN6F45.pdf", tipo: "CRLV", dataUpload: "01/11/2022" },
      { nome: "Comprovante_Goiania.pdf", tipo: "Comprovante", dataUpload: "01/11/2022" },
      { nome: "Contrato_Paulo.pdf", tipo: "Contrato", dataUpload: "01/11/2022" },
    ],
    historico: [
      { dataHora: "05/01/2026 14:00", usuario: "admin@gia.com", campo: "Veículo Vinculado", anterior: "-", novo: "GYN-2H89 (Kicks Advance)" },
      { dataHora: "10/12/2025 09:30", usuario: "operador@gia.com", campo: "Email", anterior: "paulo@antigo.com", novo: "paulo.almeida@email.com" },
    ],
    ocorrencias: [
      { numero: "SIN-2025-067", data: "2025-07-20", tipo: "Colisão", placa: "GYN-6F45", status: "Concluído", valorEstimado: 18000 },
    ],
  },
  {
    id: "8", codigo: "A01007", nome: "Juliana Cristina Nascimento", cpf: "111.222.333-44", rg: "55.123.456-7",
    dataNasc: "1995-12-08", sexo: "Feminino", estadoCivil: "Solteiro", profissao: "Designer",
    cnh: "99887766554", categoriaCnh: "B", escolaridade: "Superior",
    celular: "(61) 99567-8901", telResidencial: "", telComercial: "",
    email: "juliana.nascimento@email.com", emailAux: "ju.design@gmail.com", contato: "",
    cep: "70070-000", logradouro: "SQS 308 Bloco A", numero: "102", complemento: "",
    bairro: "Asa Sul", cidade: "Brasília", estado: "DF",
    nomeConjuge: "", nomePai: "Ricardo Nascimento", nomeMae: "Patricia Nascimento",
    regional: "Regional Capital", cooperativa: "Cooperativa Centro-Oeste", consultorResp: "Pedro Lima",
    banco: "Nubank", agencia: "0001", contaCorrente: "11223-3", diaVencimento: "5",
    observacoes: "Cliente VIP - atendimento prioritário.", status: "Ativo", plano: "Executivo", dataAdesao: "2024-06-01",
    veiculos: [
      { placa: "BSB-3A78", modelo: "Tracker Premier", marca: "Chevrolet", ano: 2024, cor: "Azul", situacao: "Ativo", plano: "Executivo" },
      { placa: "BSB-9C12", modelo: "Onix Plus Premier", marca: "Chevrolet", ano: 2024, cor: "Branco", situacao: "Ativo", plano: "Executivo" },
    ],
    lancamentos: [
      { data: "2026-03-01", tipo: "Mensalidade", valor: 349.90, status: "Pendente", vencimento: "2026-03-05" },
      { data: "2026-02-05", tipo: "Mensalidade", valor: 349.90, status: "Pago", vencimento: "2026-02-05" },
      { data: "2026-01-05", tipo: "Mensalidade", valor: 349.90, status: "Pago", vencimento: "2026-01-05" },
      { data: "2025-12-05", tipo: "Mensalidade", valor: 349.90, status: "Pago", vencimento: "2025-12-05" },
      { data: "2025-11-05", tipo: "Mensalidade", valor: 349.90, status: "Pago", vencimento: "2025-11-05" },
      { data: "2025-10-05", tipo: "Mensalidade", valor: 349.90, status: "Pago", vencimento: "2025-10-05" },
      { data: "2025-09-05", tipo: "Mensalidade", valor: 349.90, status: "Pago", vencimento: "2025-09-05" },
      { data: "2024-06-01", tipo: "Adesão", valor: 600.00, status: "Pago", vencimento: "2024-06-05" },
      { data: "2024-06-05", tipo: "Rastreador", valor: 400.00, status: "Pago", vencimento: "2024-06-10" },
      { data: "2025-08-05", tipo: "Mensalidade", valor: 349.90, status: "Pago", vencimento: "2025-08-05" },
    ],
    documentos: [
      { nome: "CNH_Juliana.pdf", tipo: "CNH", dataUpload: "01/06/2024" },
      { nome: "CRLV_BSB3A78.pdf", tipo: "CRLV", dataUpload: "01/06/2024" },
      { nome: "Comprovante_Brasilia.pdf", tipo: "Comprovante", dataUpload: "01/06/2024" },
      { nome: "Contrato_Juliana.pdf", tipo: "Contrato", dataUpload: "01/06/2024" },
    ],
    historico: [
      { dataHora: "01/03/2026 09:00", usuario: "admin@gia.com", campo: "Observações", anterior: "", novo: "Cliente VIP - atendimento prioritário." },
    ],
    ocorrencias: [
      { numero: "SIN-2025-110", data: "2025-11-30", tipo: "Colisão", placa: "BSB-3A78", status: "Aberto", valorEstimado: 7500 },
    ],
  },
];

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    "Ativo": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Inativo": "bg-muted text-muted-foreground",
    "Suspenso": "bg-amber-100 text-amber-700 border-amber-200",
    "Cancelado": "bg-red-100 text-red-700 border-red-200",
  };
  return map[s] || "bg-muted text-muted-foreground";
};

const finBadge = (s: string) => {
  const map: Record<string, string> = {
    "Pago": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Pendente": "bg-amber-100 text-amber-700 border-amber-200",
    "Atrasado": "bg-red-100 text-red-700 border-red-200",
  };
  return map[s] || "";
};

const ocBadge = (s: string) => {
  const map: Record<string, string> = {
    "Aberto": "bg-blue-100 text-blue-700 border-blue-200",
    "Em Análise": "bg-amber-100 text-amber-700 border-amber-200",
    "Aprovado": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Negado": "bg-red-100 text-red-700 border-red-200",
    "Concluído": "bg-muted text-muted-foreground",
  };
  return map[s] || "";
};

export default function AlterarAssociado() {
  const [filters, setFilters] = useState({ cpf: "", nome: "", placa: "", situacao: "Todos", regional: "Todos", cooperativa: "Todos" });
  const [results, setResults] = useState<Associado[]>([]);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Associado | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [ocModal, setOcModal] = useState(false);
  const [newOc, setNewOc] = useState({ tipo: "", veiculo: "", data: "", descricao: "", valor: "" });

  const setF = (k: string, v: string) => setFilters(p => ({ ...p, [k]: v }));

  const buscar = () => {
    let r = [...mockAssociados];
    if (filters.cpf) r = r.filter(a => a.cpf.replace(/\D/g, "").includes(filters.cpf.replace(/\D/g, "")));
    if (filters.nome) r = r.filter(a => a.nome.toLowerCase().includes(filters.nome.toLowerCase()));
    if (filters.placa) r = r.filter(a => a.veiculos.some(v => v.placa.toLowerCase().replace("-","").includes(filters.placa.toLowerCase().replace("-",""))));
    if (filters.situacao !== "Todos") r = r.filter(a => a.status === filters.situacao);
    if (filters.regional !== "Todos") r = r.filter(a => a.regional === filters.regional);
    if (filters.cooperativa !== "Todos") r = r.filter(a => a.cooperativa === filters.cooperativa);
    setResults(r);
    setSearched(true);
    setPage(1);
  };

  const limpar = () => {
    setFilters({ cpf: "", nome: "", placa: "", situacao: "Todos", regional: "Todos", cooperativa: "Todos" });
    setResults([]);
    setSearched(false);
  };

  const openEdit = (a: Associado) => {
    setSelected(a);
    setEditForm({
      nome: a.nome, cpf: a.cpf, rg: a.rg, dataNasc: a.dataNasc, sexo: a.sexo,
      estadoCivil: a.estadoCivil, profissao: a.profissao, cnh: a.cnh, categoriaCnh: a.categoriaCnh,
      escolaridade: a.escolaridade, celular: a.celular, telResidencial: a.telResidencial,
      telComercial: a.telComercial, email: a.email, emailAux: a.emailAux, contato: a.contato,
      cep: a.cep, logradouro: a.logradouro, numero: a.numero, complemento: a.complemento,
      bairro: a.bairro, cidade: a.cidade, estado: a.estado,
      nomeConjuge: a.nomeConjuge, nomePai: a.nomePai, nomeMae: a.nomeMae,
      regional: a.regional, cooperativa: a.cooperativa, consultorResp: a.consultorResp,
      banco: a.banco, agencia: a.agencia, contaCorrente: a.contaCorrente,
      diaVencimento: a.diaVencimento, observacoes: a.observacoes, status: a.status, plano: a.plano,
    });
  };

  const setE = (k: string, v: string) => setEditForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    toast.success("Alterações salvas com sucesso!", { description: `${editForm.nome} - Histórico registrado automaticamente.` });
  };

  const paged = results.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(results.length / perPage);

  const totalMens = selected ? selected.lancamentos.reduce((s, l) => s + l.valor, 0) : 0;
  const inadimpl = selected ? selected.lancamentos.filter(l => l.status === "Atrasado").length : 0;
  const ultimoPag = selected ? selected.lancamentos.find(l => l.status === "Pago") : null;

  // ── LIST VIEW ──
  if (!selected) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold">Consultar / Alterar Associado</h2>
          <p className="text-sm text-muted-foreground">Busque e edite cadastros de associados</p>
        </div>

        {/* Busca Avançada */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div><Label className="text-xs">CPF/CNPJ</Label><Input value={filters.cpf} onChange={e => setF("cpf", e.target.value)} placeholder="000.000.000-00" /></div>
              <div><Label className="text-xs">Nome</Label><Input value={filters.nome} onChange={e => setF("nome", e.target.value)} placeholder="Nome do associado" /></div>
              <div><Label className="text-xs">Placa</Label><Input value={filters.placa} onChange={e => setF("placa", e.target.value)} placeholder="ABC-1234" /></div>
              <div>
                <Label className="text-xs">Situação</Label>
                <Select value={filters.situacao} onValueChange={v => setF("situacao", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Todos","Ativo","Inativo","Suspenso"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Regional</Label>
                <Select value={filters.regional} onValueChange={v => setF("regional", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Todos","Regional Capital","Regional Interior","Regional Litoral","Regional Metropolitana"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cooperativa</Label>
                <Select value={filters.cooperativa} onValueChange={v => setF("cooperativa", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Todos","Cooperativa São Paulo","Cooperativa Campinas","Cooperativa Rio","Cooperativa Minas","Cooperativa Sul","Cooperativa Centro-Oeste","Cooperativa Nordeste"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={buscar} className="gap-1.5"><Search className="h-4 w-4" />Buscar</Button>
              <Button variant="outline" onClick={limpar}>Limpar Filtros</Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {searched && (
          <Card>
            <CardContent className="p-0">
              {results.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">Nenhum associado encontrado com os filtros informados.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Regional</TableHead>
                        <TableHead>Celular</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paged.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono text-xs">{a.codigo}</TableCell>
                          <TableCell className="font-medium text-sm">{a.nome}</TableCell>
                          <TableCell className="text-sm">{a.cpf}</TableCell>
                          <TableCell><Badge variant="outline" className={statusBadge(a.status)}>{a.status}</Badge></TableCell>
                          <TableCell className="text-sm">{a.regional}</TableCell>
                          <TableCell className="text-sm">{a.celular}</TableCell>
                          <TableCell className="text-sm font-mono">{a.veiculos[0]?.placa || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar" onClick={() => openEdit(a)}><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" title="Histórico" onClick={() => openEdit(a)}><History className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between p-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{results.length} resultado(s)</span>
                      <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                        <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{[10,25,50].map(n => <SelectItem key={n} value={String(n)}>{n}/pág</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <span className="text-sm px-2">{page}/{totalPages || 1}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── EDIT VIEW ──
  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1.5 mb-4 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar à lista
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{selected.nome}</h2>
          <p className="text-sm text-muted-foreground">{selected.codigo} • {selected.cpf} • <Badge variant="outline" className={statusBadge(selected.status)}>{selected.status}</Badge></p>
        </div>
      </div>

      <Tabs defaultValue="pessoal">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="pessoal" className="gap-1 text-xs"><User className="h-3.5 w-3.5" />Dados</TabsTrigger>
          <TabsTrigger value="veiculos" className="gap-1 text-xs"><Car className="h-3.5 w-3.5" />Veículos</TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-1 text-xs"><DollarSign className="h-3.5 w-3.5" />Financeiro</TabsTrigger>
          <TabsTrigger value="documentos" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" />Documentos</TabsTrigger>
          <TabsTrigger value="historico" className="gap-1 text-xs"><Clock className="h-3.5 w-3.5" />Histórico</TabsTrigger>
          <TabsTrigger value="ocorrencias" className="gap-1 text-xs"><AlertTriangle className="h-3.5 w-3.5" />Ocorrências</TabsTrigger>
        </TabsList>

        {/* TAB 1 - DADOS PESSOAIS */}
        <TabsContent value="pessoal" className="mt-4">
          <Accordion type="multiple" defaultValue={["sec-dados","sec-endereco","sec-telefones"]} className="space-y-3">
            <AccordionItem value="sec-dados" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Dados do Associado</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div className="lg:col-span-2"><Label className="text-xs">Nome</Label><Input value={editForm.nome||""} onChange={e => setE("nome", e.target.value)} /></div>
                  <div><Label className="text-xs">CPF/CNPJ</Label><Input value={editForm.cpf||""} disabled className="bg-muted/50" /></div>
                  <div><Label className="text-xs">RG</Label><Input value={editForm.rg||""} onChange={e => setE("rg", e.target.value)} /></div>
                  <div><Label className="text-xs">Data Nascimento</Label><Input type="date" value={editForm.dataNasc||""} onChange={e => setE("dataNasc", e.target.value)} /></div>
                  <div><Label className="text-xs">Sexo</Label>
                    <Select value={editForm.sexo} onValueChange={v => setE("sexo", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Profissão</Label><Input value={editForm.profissao||""} onChange={e => setE("profissao", e.target.value)} /></div>
                  <div><Label className="text-xs">CNH</Label><Input value={editForm.cnh||""} onChange={e => setE("cnh", e.target.value)} /></div>
                  <div><Label className="text-xs">Categoria CNH</Label>
                    <Select value={editForm.categoriaCnh} onValueChange={v => setE("categoriaCnh", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["A","B","C","D","E","AB","AC","AD","AE"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Status</Label>
                    <Select value={editForm.status} onValueChange={v => setE("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Ativo","Inativo","Suspenso","Cancelado"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Plano</Label>
                    <Select value={editForm.plano} onValueChange={v => setE("plano", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Básico","Intermediário","Completo","Premium","Executivo"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-endereco" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Endereço</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">CEP</Label><Input value={editForm.cep||""} onChange={e => setE("cep", e.target.value)} /></div>
                  <div className="lg:col-span-2"><Label className="text-xs">Logradouro</Label><Input value={editForm.logradouro||""} onChange={e => setE("logradouro", e.target.value)} /></div>
                  <div><Label className="text-xs">Nº</Label><Input value={editForm.numero||""} onChange={e => setE("numero", e.target.value)} /></div>
                  <div><Label className="text-xs">Complemento</Label><Input value={editForm.complemento||""} onChange={e => setE("complemento", e.target.value)} /></div>
                  <div><Label className="text-xs">Bairro</Label><Input value={editForm.bairro||""} onChange={e => setE("bairro", e.target.value)} /></div>
                  <div><Label className="text-xs">Cidade</Label><Input value={editForm.cidade||""} onChange={e => setE("cidade", e.target.value)} /></div>
                  <div><Label className="text-xs">Estado</Label>
                    <Select value={editForm.estado} onValueChange={v => setE("estado", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-escolaridade" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Escolaridade</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="max-w-xs pt-2">
                  <Label className="text-xs">Nível</Label>
                  <Select value={editForm.escolaridade} onValueChange={v => setE("escolaridade", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Fundamental","Médio","Superior","Pós-graduação","Mestrado","Doutorado"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-telefones" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Telefones</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">Celular</Label><Input value={editForm.celular||""} onChange={e => setE("celular", e.target.value)} /></div>
                  <div><Label className="text-xs">Tel. Residencial</Label><Input value={editForm.telResidencial||""} onChange={e => setE("telResidencial", e.target.value)} /></div>
                  <div><Label className="text-xs">Tel. Comercial</Label><Input value={editForm.telComercial||""} onChange={e => setE("telComercial", e.target.value)} /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-emails" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Emails e Contatos</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">Email</Label><Input value={editForm.email||""} onChange={e => setE("email", e.target.value)} /></div>
                  <div><Label className="text-xs">Email Aux</Label><Input value={editForm.emailAux||""} onChange={e => setE("emailAux", e.target.value)} /></div>
                  <div><Label className="text-xs">Contato</Label><Input value={editForm.contato||""} onChange={e => setE("contato", e.target.value)} /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-familiares" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Informações Familiares</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div><Label className="text-xs">Estado Civil</Label>
                    <Select value={editForm.estadoCivil} onValueChange={v => setE("estadoCivil", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{["Solteiro","Casado","Divorciado","Viúvo","União Estável"].map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Nome Cônjuge</Label><Input value={editForm.nomeConjuge||""} onChange={e => setE("nomeConjuge", e.target.value)} /></div>
                  <div><Label className="text-xs">Nome do Pai</Label><Input value={editForm.nomePai||""} onChange={e => setE("nomePai", e.target.value)} /></div>
                  <div><Label className="text-xs">Nome da Mãe</Label><Input value={editForm.nomeMae||""} onChange={e => setE("nomeMae", e.target.value)} /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-acesso" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Acesso e Categorização</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">Regional</Label><Input value={editForm.regional||""} onChange={e => setE("regional", e.target.value)} /></div>
                  <div><Label className="text-xs">Cooperativa</Label><Input value={editForm.cooperativa||""} onChange={e => setE("cooperativa", e.target.value)} /></div>
                  <div><Label className="text-xs">Consultor Responsável</Label><Input value={editForm.consultorResp||""} onChange={e => setE("consultorResp", e.target.value)} /></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-financeiro" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Informações Financeiras</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div><Label className="text-xs">Banco</Label><Input value={editForm.banco||""} onChange={e => setE("banco", e.target.value)} /></div>
                  <div><Label className="text-xs">Agência</Label><Input value={editForm.agencia||""} onChange={e => setE("agencia", e.target.value)} /></div>
                  <div><Label className="text-xs">Conta Corrente</Label><Input value={editForm.contaCorrente||""} onChange={e => setE("contaCorrente", e.target.value)} /></div>
                  <div><Label className="text-xs">Dia Vencimento</Label>
                    <Select value={editForm.diaVencimento} onValueChange={v => setE("diaVencimento", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Array.from({length:31},(_,i)=>i+1).map(d => <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sec-obs" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-semibold text-sm">Dados Complementares</span></div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2">
                <Label className="text-xs">Observações</Label>
                <Textarea value={editForm.observacoes||""} onChange={e => setE("observacoes", e.target.value)} rows={3} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} className="gap-1.5"><Save className="h-4 w-4" />Salvar Alterações</Button>
          </div>
        </TabsContent>

        {/* TAB 2 - VEÍCULOS */}
        <TabsContent value="veiculos" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Vincular Novo Veículo</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Cor</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.veiculos.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{v.placa}</TableCell>
                      <TableCell className="text-sm">{v.modelo}</TableCell>
                      <TableCell className="text-sm">{v.marca}</TableCell>
                      <TableCell className="text-sm">{v.ano}</TableCell>
                      <TableCell className="text-sm">{v.cor}</TableCell>
                      <TableCell><Badge variant="outline" className={statusBadge(v.situacao)}>{v.situacao}</Badge></TableCell>
                      <TableCell className="text-sm">{v.plano}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Desvincular"><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 - FINANCEIRO */}
        <TabsContent value="financeiro" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Mensalidades</p><p className="text-xl font-bold text-primary">R$ {totalMens.toFixed(2).replace(".", ",")}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Inadimplência</p><p className="text-xl font-bold text-destructive">{inadimpl} parcela(s)</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Último Pagamento</p><p className="text-xl font-bold">{ultimoPag ? new Date(ultimoPag.data).toLocaleDateString("pt-BR") : "-"}</p></CardContent></Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.lancamentos.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{new Date(l.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{l.tipo}</TableCell>
                      <TableCell className="text-sm font-medium">R$ {l.valor.toFixed(2).replace(".",",")}</TableCell>
                      <TableCell><Badge variant="outline" className={finBadge(l.status)}>{l.status}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(l.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 - DOCUMENTOS */}
        <TabsContent value="documentos" className="mt-4 space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Arraste arquivos aqui ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground mt-1">CNH, CRLV, Comprovante de Residência, Contrato</p>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Upload</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.documentos.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{d.nome}</TableCell>
                      <TableCell><Badge variant="outline">{d.tipo}</Badge></TableCell>
                      <TableCell className="text-sm">{d.dataUpload}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Download"><Download className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5 - HISTÓRICO */}
        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {selected.historico.map((h, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1" />
                      {i < selected.historico.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{h.campo}</span>
                        <span className="text-xs text-muted-foreground">• {h.dataHora}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">De:</span> <span className="line-through text-destructive/70">{h.anterior || "(vazio)"}</span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span className="text-emerald-600 font-medium">{h.novo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">por {h.usuario}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6 - OCORRÊNCIAS */}
        <TabsContent value="ocorrencias" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setOcModal(true)}><Plus className="h-3.5 w-3.5" />Nova Ocorrência</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Estimado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.ocorrencias.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Nenhuma ocorrência registrada.</TableCell></TableRow>
                  ) : selected.ocorrencias.map((o, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{o.numero}</TableCell>
                      <TableCell className="text-sm">{new Date(o.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-sm">{o.tipo}</TableCell>
                      <TableCell className="font-mono text-sm">{o.placa}</TableCell>
                      <TableCell><Badge variant="outline" className={ocBadge(o.status)}>{o.status}</Badge></TableCell>
                      <TableCell className="text-sm">R$ {o.valorEstimado.toLocaleString("pt-BR",{minimumFractionDigits:2})}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Modal Nova Ocorrência */}
          <Dialog open={ocModal} onOpenChange={setOcModal}>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Ocorrência</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newOc.tipo} onValueChange={v => setNewOc(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{["Roubo","Furto","Colisão","Incêndio","Alagamento","Outros"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Veículo</Label>
                  <Select value={newOc.veiculo} onValueChange={v => setNewOc(p => ({ ...p, veiculo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{selected.veiculos.map(v => <SelectItem key={v.placa} value={v.placa}>{v.placa} - {v.modelo}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Data</Label><Input type="date" value={newOc.data} onChange={e => setNewOc(p => ({ ...p, data: e.target.value }))} /></div>
                <div><Label>Descrição</Label><Textarea value={newOc.descricao} onChange={e => setNewOc(p => ({ ...p, descricao: e.target.value }))} rows={3} /></div>
                <div><Label>Valor Estimado (R$)</Label><Input value={newOc.valor} onChange={e => setNewOc(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" /></div>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs">Upload de fotos</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOcModal(false)}>Cancelar</Button>
                <Button onClick={() => { toast.success("Ocorrência registrada!"); setOcModal(false); setNewOc({ tipo:"",veiculo:"",data:"",descricao:"",valor:"" }); }}>Registrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
