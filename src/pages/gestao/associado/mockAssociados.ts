export interface MockAssociado {
  id: string;
  codigo: string;
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  email: string;
  telefone: string;
  telComercial: string;
  cnh: string;
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  status: "ativo" | "inativo" | "suspenso" | "cancelado";
  plano: string;
  cooperativa: string;
  regional: string;
  dataAdesao: string;
  diaVencimento: number;
  veiculos: { placa: string; modelo: string; ano: number }[];
  beneficiarios: { nome: string; parentesco: string; cpf: string }[];
  pagamentos: { ref: string; valor: number; status: string; vencimento: string; pagamento: string | null }[];
  alteracoes: { data: string; campo: string; de: string; para: string; usuario: string }[];
}

const nomes = [
  "Carlos Alberto Silva", "Maria Aparecida Santos", "José Roberto Oliveira", "Ana Paula Ferreira",
  "Francisco das Chagas Lima", "Francisca Helena Costa", "Antônio Carlos Pereira", "Adriana Souza Rodrigues",
  "Paulo Henrique Almeida", "Juliana Cristina Nascimento", "Marcos Vinícius Araújo", "Patricia de Lourdes Gomes",
  "Pedro Henrique Ribeiro", "Fernanda Beatriz Martins", "Lucas Gabriel Barbosa", "Camila Rodrigues Carvalho",
  "Rafael Augusto Rocha", "Vanessa Silva Correia", "Diego Fernando Cardoso", "Tatiana Mendes Nunes",
  "Thiago Oliveira Castro", "Bruna Alves Moreira", "Gustavo Henrique Dias", "Daniela Freitas Teixeira",
  "Leandro Souza Vieira", "Renata Costa Monteiro", "Anderson Pereira Lopes", "Simone Barros Pinto",
  "Rodrigo Almeida Campos", "Aline Martins Rezende",
];

const cidades = [
  { c: "São Paulo", e: "SP" }, { c: "Campinas", e: "SP" }, { c: "Ribeirão Preto", e: "SP" },
  { c: "Rio de Janeiro", e: "RJ" }, { c: "Niterói", e: "RJ" }, { c: "Belo Horizonte", e: "MG" },
  { c: "Uberlândia", e: "MG" }, { c: "Curitiba", e: "PR" }, { c: "Goiânia", e: "GO" },
  { c: "Brasília", e: "DF" },
];

const planos = ["Básico", "Intermediário", "Completo", "Premium"];
const cooperativas = ["Cooperativa São Paulo", "Cooperativa Rio", "Cooperativa Minas", "Cooperativa Sul", "Cooperativa Centro-Oeste"];
const regionais = ["Regional Capital", "Regional Interior", "Regional Litoral", "Regional Metropolitana"];
const modelos = ["Onix Plus", "HB20 Sedan", "Civic", "Corolla", "Tracker", "Compass", "T-Cross", "Creta", "Kicks", "Renegade", "Gol", "Polo", "Ka", "Argo", "Mobi"];

function cpf(i: number) {
  const base = String(11122233300 + i * 11111111).slice(0, 11);
  return `${base.slice(0,3)}.${base.slice(3,6)}.${base.slice(6,9)}-${base.slice(9,11)}`;
}

function tel(i: number) {
  return `(11) 9${String(8000 + i * 137).slice(0,4)}-${String(1000 + i * 93).slice(0,4)}`;
}

export const mockAssociados: MockAssociado[] = nomes.map((nome, i) => {
  const loc = cidades[i % cidades.length];
  const statusOpts: MockAssociado["status"][] = ["ativo", "ativo", "ativo", "ativo", "inativo", "suspenso", "cancelado", "ativo"];
  const st = statusOpts[i % statusOpts.length];
  const nVeic = (i % 3) + 1;

  return {
    id: `assoc-${i + 1}`,
    codigo: `A${String(1000 + i).padStart(5, "0")}`,
    nome,
    cpf: cpf(i),
    rg: `${20 + i}.${300 + i}.${400 + i}-${i % 10}`,
    dataNascimento: `${1965 + (i % 35)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    sexo: i % 3 === 0 ? "Feminino" : "Masculino",
    estadoCivil: ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)"][i % 4],
    email: `${nome.split(" ")[0].toLowerCase()}.${nome.split(" ").slice(-1)[0].toLowerCase()}@email.com`,
    telefone: tel(i),
    telComercial: i % 3 === 0 ? tel(i + 100) : "",
    cnh: `${String(10000000000 + i * 123456789).slice(0, 11)}`,
    cep: `${String(10000 + i * 1111).slice(0, 5)}-${String(100 + i).slice(0, 3)}`,
    endereco: `Rua ${["das Flores", "dos Pinheiros", "XV de Novembro", "da Liberdade", "São José", "Tiradentes", "Santos Dumont", "Marechal Deodoro"][i % 8]}, ${100 + i * 13}`,
    bairro: ["Centro", "Jardim América", "Vila Nova", "Boa Vista", "São Pedro", "Santa Luzia"][i % 6],
    cidade: loc.c,
    estado: loc.e,
    status: st,
    plano: planos[i % planos.length],
    cooperativa: cooperativas[i % cooperativas.length],
    regional: regionais[i % regionais.length],
    dataAdesao: `${2020 + (i % 5)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    diaVencimento: ((i % 28) + 1),
    veiculos: Array.from({ length: nVeic }, (_, j) => ({
      placa: `${["ABC", "DEF", "GHI", "JKL", "MNO"][i % 5]}${j}${["A", "B", "C", "D"][i % 4]}${String(10 + i + j).slice(0, 2)}`,
      modelo: modelos[(i + j) % modelos.length],
      ano: 2018 + ((i + j) % 7),
    })),
    beneficiarios: [
      { nome: `${nome.split(" ")[0]} Jr.`, parentesco: "Filho(a)", cpf: cpf(i + 100) },
      ...(i % 3 === 0 ? [{ nome: `Maria de ${nome.split(" ").slice(-1)[0]}`, parentesco: "Cônjuge", cpf: cpf(i + 200) }] : []),
    ],
    pagamentos: Array.from({ length: 6 }, (_, j) => {
      const m = 12 - j;
      const pago = j < 4 || i % 5 !== 0;
      return {
        ref: `2025/${String(m).padStart(2, "0")}`,
        valor: [89.90, 139.90, 189.90, 249.90][i % 4],
        status: pago ? "Pago" : (j === 4 ? "Atrasado" : "Pendente"),
        vencimento: `2025-${String(m).padStart(2, "0")}-${String(((i % 28) + 1)).padStart(2, "0")}`,
        pagamento: pago ? `2025-${String(m).padStart(2, "0")}-${String(((i % 28) + 1)).padStart(2, "0")}` : null,
      };
    }),
    alteracoes: [
      { data: "2025-01-15 14:30", campo: "Telefone", de: "(11) 9000-0000", para: tel(i), usuario: "admin@gia.com" },
      { data: "2024-11-02 09:15", campo: "Endereço", de: "Rua Antiga, 50", para: `Rua Nova, ${100 + i}`, usuario: "operador@gia.com" },
    ],
  };
});

export const mockVeiculosDisponiveis = [
  { id: "v1", placa: "XYZ1A23", modelo: "Onix Plus 1.0 Turbo", ano: 2024 },
  { id: "v2", placa: "ABC2B34", modelo: "HB20 1.6 Comfort", ano: 2023 },
  { id: "v3", placa: "DEF3C45", modelo: "Civic EXL 2.0", ano: 2024 },
  { id: "v4", placa: "GHI4D56", modelo: "Corolla XEi 2.0", ano: 2023 },
  { id: "v5", placa: "JKL5E67", modelo: "Tracker Premier 1.2T", ano: 2024 },
];
