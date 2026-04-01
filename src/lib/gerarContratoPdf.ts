import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DadosContrato {
  empresa: { nome: string; cnpj: string };
  associado: {
    nome: string; cpf: string; rg: string; cnh: string; sexo: string;
    nascimento: string; logradouro: string; numero: string; complemento: string;
    bairro: string; cidade: string; estado: string; cep: string;
    email: string; celular: string;
  };
  veiculo: {
    placa: string; modelo: string; marca: string; anoFab: string;
    anoModelo: string; cor: string; combustivel: string; chassi: string;
    renavam: string; codFipe: string; valorFipe: number;
    valorProtegido: number; diaVencimento: string; veiculoTrabalho: string;
  };
  plano: { nome: string; valorMensal: number; adesao: number; participacao: string };
  produtos: string[];
  opcionais?: string[];
  observacoes?: string;
  consultor: { nome: string; celular: string; email: string };
  agregado?: { nome?: string; cpf?: string; parentesco?: string };
  // keep backwards compat
  coberturas?: string[];
  assistencias?: string[];
  textoContrato?: string;
}

const AZUL_ESCURO: [number, number, number] = [26, 58, 92]; // #1A3A5C
const AZUL_CLARO: [number, number, number] = [200, 215, 230]; // #C8D7E6
const CINZA_BORDA: [number, number, number] = [200, 200, 200];
const TOTAL_PAGES = 5;

function sectionHeader(doc: jsPDF, titulo: string, y: number): number {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...AZUL_ESCURO);
  doc.rect(14, y, w - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, w / 2, y + 6, { align: "center" });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  return y + 10;
}

function fmtMoney(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function addPageFooter(doc: jsPDF, hash: string) {
  const totalPages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    // QR code placeholder + hash left
    doc.setDrawColor(180, 180, 180);
    doc.rect(14, 280, 10, 10, "S");
    doc.setFontSize(5);
    doc.setTextColor(180, 180, 180);
    doc.text("QR", 19, 286, { align: "center" });
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(`PowerSign: ${hash}`, 26, 286);
    doc.text(`${i} de ${totalPages}`, w - 14, 286, { align: "right" });
  }
}

// ===================== FULL CONTRACT TEXT =====================
const CONTRATO_COMPLETO = `SERVIÇOS OFERECIDOS
A associação oferece serviços de proteção veicular contra colisão, incêndio, roubo, furto, perda total e danos a terceiros, conforme regulamento vigente disponível no site da associação, do qual o associado declara ter pleno conhecimento.

PRAZO PARA COMUNICAÇÃO
Os veículos que forem envolvidos em acidentes com danos reparáveis ou irreparáveis deverão ser comunicados imediatamente à associação no momento do fato, através dos telefones 0800-111-3400 ou 0800-123-9500, para solicitação de assistência 24h e comunicação de eventos como colisão, incêndio, roubo, furto, entre outros. A não comunicação imediata pode acarretar na perda do direito ao benefício.

ASSISTÊNCIA 24 HORAS
O serviço de Assistência 24 Horas está vinculado ao manual de assistência 24h. Inclui reboque até 1000km, auxílio combustível, recarga de bateria, hospedagem, retorno ao domicílio, chaveiro e troca de pneus, conforme condições estabelecidas no regulamento.

BOLETOS
O vencimento do boleto ocorrerá em dias fixos de acordo com a data de cadastro junto à associação. O não pagamento até a data do vencimento torna o veículo do associado desprotegido a partir de 00:00 hora do 1º dia subsequente ao vencimento. A associação não se responsabiliza por eventos ocorridos durante o período de inadimplência. A regularização poderá ser feita mediante o pagamento dos boletos em atraso, respeitando o prazo máximo de tolerância de 30 dias.

VISTORIA PRÉVIA
A proteção do veículo será válida somente após a aprovação da vistoria prévia, seguindo critérios estabelecidos pela associação. O veículo deverá ser apresentado em condições adequadas para a vistoria, sem avarias pré-existentes não declaradas. Caso sejam constatadas irregularidades, a vistoria será reprovada e o associado deverá regularizar a situação antes de nova análise.

BENEFÍCIO DESCONTO MENSALIDADE
Associados que mantiverem suas mensalidades em dia por período consecutivo de 12 meses poderão ter direito a desconto na renovação, conforme política vigente da associação.

RASTREADOR
A instalação de rastreador poderá ser exigida para veículos com valor FIPE acima do limite estabelecido pela associação. O custo do rastreador e sua instalação são de responsabilidade do associado. A desativação ou remoção não autorizada do rastreador implica na perda imediata da proteção.

CANCELAMENTO
O cancelamento pode ser solicitado a qualquer momento após 3 (três) meses de participação mínima obrigatória, mediante aviso prévio de 25 (vinte e cinco) dias antes do próximo vencimento. O pedido de cancelamento deve ser formalizado por escrito. Não haverá devolução de valores já pagos. Em caso de cancelamento dentro do período mínimo, será cobrada multa equivalente às mensalidades restantes.

COTA DE PARTICIPAÇÃO
O reembolso de eventos cobertos depende do pagamento da Cota de Participação pelo associado, cujo valor é estabelecido conforme percentual sobre o valor da Tabela FIPE do veículo na data do evento. A cota deverá ser paga em até 5 dias úteis após a comunicação do evento, sob pena de perda do direito ao reembolso.

VALOR PROTEGIDO
O valor protegido é definido pela Tabela FIPE vigente na data do evento. Em caso de perda total, o reembolso será de até 100% do valor da Tabela FIPE, deduzida a cota de participação. Para danos parciais, o reembolso seguirá os limites e condições do regulamento.

REEMBOLSO
O reembolso será efetuado em até 30 (trinta) dias úteis após a aprovação do evento pela associação, mediante apresentação de toda documentação exigida. O pagamento será realizado via transferência bancária em conta de titularidade do associado.

VEÍCULOS ALIENADOS
Veículos com alienação fiduciária poderão ser aceitos mediante apresentação de documentação comprobatória. Em caso de sinistro com perda total, o reembolso será feito prioritariamente ao agente financeiro, até o limite do saldo devedor, e o remanescente ao associado.

VEÍCULOS LEILÃO / EX-TÁXI
Veículos oriundos de leilão ou ex-táxi poderão ter restrições de cobertura ou condições especiais de participação, devendo ser previamente analisados pela associação. A aceitação fica condicionada à aprovação em vistoria específica.

LUCROS CESSANTES
A associação não se responsabiliza por lucros cessantes, danos indiretos ou consequenciais decorrentes de eventos cobertos ou não cobertos, incluindo períodos de indisponibilidade do veículo para reparos.

DANOS MORAIS
A associação não se responsabiliza por danos morais de qualquer natureza relacionados direta ou indiretamente aos serviços prestados.

TERMO DE ACEITE DE VISTORIA

Eu, associado abaixo identificado, declaro para os devidos fins que:

• Recebi e li integralmente o regulamento da associação e estou ciente de todas as condições, direitos e obrigações;
• As informações prestadas neste termo são verdadeiras e completas, sob pena de perda dos benefícios;
• O veículo descrito neste termo encontra-se em perfeito estado de conservação, sem avarias, danos ou modificações não declaradas;
• Estou ciente de que a proteção somente terá início após a aprovação da vistoria prévia e pagamento da primeira mensalidade;
• Autorizo a associação a realizar consultas cadastrais e veiculares para fins de análise;
• Concordo com os termos de adesão, regulamento e tabela de preços vigente.`;

export function gerarContratoPdf(dados: DadosContrato): Blob {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const hash = `GIA-${Date.now().toString(36).toUpperCase()}`;

  // Merge old fields if new ones not provided
  const produtos = dados.produtos && dados.produtos.length > 0
    ? dados.produtos
    : [
        ...(dados.coberturas || []),
        ...(dados.assistencias || []),
      ];

  // ===================== PAGE 1: TERMO DE ADESAO =====================
  // Logo top-left
  doc.setFontSize(16);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(...AZUL_ESCURO);
  doc.text("OBJETIVO", 14, 16);
  doc.setFontSize(7);
  doc.text("AUTO BENEFÍCIOS", 14, 21);

  // TERMO DE ADESAO top-right
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE ADESÃO", w - 14, 16, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ: ${dados.empresa.cnpj}`, w - 14, 22, { align: "right" });

  // --- DADOS DO ASSOCIADO ---
  let startY = sectionHeader(doc, "DADOS DO ASSOCIADO", 30);
  autoTable(doc, {
    startY,
    head: [],
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7, cellPadding: 2, lineColor: CINZA_BORDA, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: (w - 28) * 0.5 },
      1: { cellWidth: (w - 28) * 0.5 },
    },
    body: [
      [
        { content: `Nome: ${dados.associado.nome}`, colSpan: 1, styles: { fontStyle: "bold" } },
        `CPF: ${dados.associado.cpf}`,
      ],
      [
        { content: `RG: ${dados.associado.rg}   |   CNH: ${dados.associado.cnh}   |   Sexo: ${dados.associado.sexo}`, colSpan: 1 },
        `Data Nascimento: ${dados.associado.nascimento}`,
      ],
      [
        `Logradouro: ${dados.associado.logradouro}   |   Nº: ${dados.associado.numero}`,
        `Complemento: ${dados.associado.complemento}`,
      ],
      [
        `Bairro: ${dados.associado.bairro}   |   Cidade: ${dados.associado.cidade}`,
        `Estado: ${dados.associado.estado}   |   CEP: ${dados.associado.cep}`,
      ],
      [
        `E-mail: ${dados.associado.email}`,
        `Celular: ${dados.associado.celular}`,
      ],
    ],
  });

  // --- DADOS DO VEICULO ---
  let y = (doc as any).lastAutoTable.finalY + 4;
  startY = sectionHeader(doc, "DADOS DO VEÍCULO", y);
  autoTable(doc, {
    startY,
    head: [],
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7, cellPadding: 2, lineColor: CINZA_BORDA, lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: (w - 28) / 3 },
      1: { cellWidth: (w - 28) / 3 },
      2: { cellWidth: (w - 28) / 3 },
    },
    body: [
      [
        `Placa: ${dados.veiculo.placa}`,
        { content: `Modelo: ${dados.veiculo.modelo}`, colSpan: 2 },
      ],
      [
        `Marca: ${dados.veiculo.marca}`,
        `Chassi: ${dados.veiculo.chassi}`,
        `Renavam: ${dados.veiculo.renavam}`,
      ],
      [
        `Ano Fab: ${dados.veiculo.anoFab}`,
        `Cor: ${dados.veiculo.cor}`,
        `Combustível: ${dados.veiculo.combustivel}`,
      ],
      [
        `Ano Modelo: ${dados.veiculo.anoModelo}`,
        `Cód. FIPE: ${dados.veiculo.codFipe}`,
        `Valor FIPE: ${fmtMoney(dados.veiculo.valorFipe)}`,
      ],
      [
        `Valor Protegido: ${fmtMoney(dados.veiculo.valorProtegido)}`,
        `Dia Vencimento: ${dados.veiculo.diaVencimento}`,
        `Veículo Trabalho: ${dados.veiculo.veiculoTrabalho}`,
      ],
    ],
  });

  // --- DADOS DO AGREGADO ---
  y = (doc as any).lastAutoTable.finalY + 4;
  startY = sectionHeader(doc, "DADOS DO AGREGADO", y);
  if (dados.agregado && dados.agregado.nome) {
    autoTable(doc, {
      startY,
      head: [],
      theme: "grid",
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7, cellPadding: 2, lineColor: CINZA_BORDA, lineWidth: 0.2 },
      body: [
        [`Nome: ${dados.agregado.nome}`, `CPF: ${dados.agregado.cpf || ""}`, `Parentesco: ${dados.agregado.parentesco || ""}`],
      ],
    });
  } else {
    // Empty section placeholder
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("Sem agregado cadastrado", 14, startY + 4);
    doc.setTextColor(0, 0, 0);
  }

  // ===================== PAGE 2: PRODUTOS =====================
  doc.addPage();

  // Logo top-left repeated
  doc.setFontSize(16);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(...AZUL_ESCURO);
  doc.text("OBJETIVO", 14, 16);
  doc.setFontSize(7);
  doc.text("AUTO BENEFÍCIOS", 14, 21);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  startY = sectionHeader(doc, "PRODUTOS VEÍCULO", 28);

  // Plano table with light blue background
  autoTable(doc, {
    startY,
    head: [],
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 3, lineColor: CINZA_BORDA, lineWidth: 0.2 },
    body: [
      [
        { content: `Plano: ${dados.plano.nome}`, styles: { fontStyle: "bold", fillColor: AZUL_CLARO } },
        { content: `Valor Mensal: ${fmtMoney(dados.plano.valorMensal)}`, styles: { fillColor: AZUL_CLARO } },
      ],
      [
        { content: `Adesão: ${fmtMoney(dados.plano.adesao)}`, styles: { fillColor: AZUL_CLARO } },
        { content: `Participação: ${dados.plano.participacao}`, styles: { fillColor: AZUL_CLARO } },
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Produtos list
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Produtos:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y += 5;

  const defaultProdutos = [
    "Roubo", "Furto", "Colisão", "Incêndio", "Danos a Terceiros",
    "Perda Total", "Carro Reserva", "Vidros", "Danos da natureza",
    "Assistência 24H 1000km", "Auxílio combustível", "Recarga bateria",
    "Hospedagem", "Retorno domicílio", "Chaveiro", "Reboque", "Troca pneus",
  ];
  const produtosList = produtos.length > 0 ? produtos : defaultProdutos;

  for (const p of produtosList) {
    doc.text(`• ${p}`, 16, y);
    y += 4.5;
  }

  y += 3;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Opcionais:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y += 5;
  if (dados.opcionais && dados.opcionais.length > 0) {
    for (const o of dados.opcionais) {
      doc.text(`• ${o}`, 16, y);
      y += 4.5;
    }
  } else {
    doc.setTextColor(150, 150, 150);
    doc.text("Nenhum", 16, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  y += 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Observações:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y += 5;
  const obsText = dados.observacoes || "";
  if (obsText) {
    const obsLines = doc.splitTextToSize(obsText, w - 28);
    doc.text(obsLines, 14, y);
    y += obsLines.length * 4;
  }

  y += 5;
  // DADOS DO CONSULTOR
  startY = sectionHeader(doc, "DADOS DO CONSULTOR", y);
  autoTable(doc, {
    startY,
    head: [],
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: CINZA_BORDA, lineWidth: 0.2 },
    body: [
      [
        `Nome: ${dados.consultor.nome}`,
        `Celular: ${dados.consultor.celular}`,
        `Email: ${dados.consultor.email}`,
      ],
    ],
  });

  // ===================== PAGES 3-4: CONTRATO DE ADESAO =====================
  doc.addPage();

  // Logo top-left repeated
  doc.setFontSize(16);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(...AZUL_ESCURO);
  doc.text("OBJETIVO", 14, 16);
  doc.setFontSize(7);
  doc.text("AUTO BENEFÍCIOS", 14, 21);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  sectionHeader(doc, "CONTRATO DE ADESÃO", 28);

  const contratoText = dados.textoContrato || CONTRATO_COMPLETO;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  const contratoLines = doc.splitTextToSize(contratoText, w - 28);
  let cY = 42;
  for (const line of contratoLines) {
    if (cY > 275) {
      doc.addPage();
      cY = 20;
    }
    // Bold section headers (lines that are ALL CAPS and don't start with bullet)
    const trimmed = line.trim();
    if (
      trimmed.length > 0 &&
      trimmed === trimmed.toUpperCase() &&
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("-") &&
      trimmed.length > 3
    ) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(line, 14, cY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
    } else {
      doc.text(line, 14, cY);
    }
    cY += 3.8;
  }

  // ===================== PAGE 5: ASSINATURAS =====================
  doc.addPage();

  // Date centered
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(dataAtual, w / 2, 40, { align: "center" });

  const sigY = 80;

  // Signature line - associado (left)
  doc.setDrawColor(0, 0, 0);
  doc.line(25, sigY, 95, sigY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(dados.associado.nome, 60, sigY + 6, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`CPF: ${dados.associado.cpf}`, 60, sigY + 11, { align: "center" });

  // Signature line - empresa (right)
  doc.line(115, sigY, 185, sigY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(dados.empresa.nome, 150, sigY + 6, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ: ${dados.empresa.cnpj}`, 150, sigY + 11, { align: "center" });

  // ===================== FOOTER ALL PAGES =====================
  addPageFooter(doc, hash);

  return doc.output("blob");
}

export function baixarContratoPdf(dados: DadosContrato) {
  const blob = gerarContratoPdf(dados);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Contrato-${dados.associado.nome.replace(/\s/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
