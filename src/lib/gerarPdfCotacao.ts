import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import pagina1Img from "@/assets/cotacao/pagina1.jpg";
import pagina2Img from "@/assets/cotacao/pagina2.jpg";
import pagina4Img from "@/assets/cotacao/pagina4.jpg";
import logoImg from "@/assets/cotacao/logo-objetivo.png";

interface DadosCotacao {
  numeroCotacao: string;
  data: string;
  validade: number;
  cliente: { nome: string; telefone?: string; email?: string; veiculo: string; placa: string; codFipe: string; valorFipe: number; cidade: string; estado: string };
  plano: {
    nome: string;
    mensal: number;
    mensalOriginal?: number;
    adesao: number;
    adesaoOriginal?: number;
    participacao: string;
    rastreador: string;
    instalacao?: number;
  };
  coberturas: { nome: string; inclusa: boolean; tipo: string; detalhe?: string }[];
  consultor: { nome: string; telefone: string; email: string };
}

async function loadImage(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

function fmtBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

// Desenha um header de seção estilizado (fundo azul escuro com texto branco grande)
function sectionHeader(doc: jsPDF, text: string, x: number, y: number, width: number, azul: [number, number, number]) {
  doc.setFillColor(...azul);
  doc.roundedRect(x, y, width, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(text, x + width / 2, y + 6.5, { align: "center" });
  return y + 12;
}

// Desenha um campo label + valor
function field(doc: jsPDF, label: string, value: string, x: number, y: number, fieldW: number, azul: [number, number, number]) {
  // Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...azul);
  doc.text(label, x + 2, y + 3.5);
  // Valor
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text(value || "—", x + 2, y + 8);
  // Borda inferior cinza
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.line(x, y + 10, x + fieldW, y + 10);
  return y + 12;
}

export async function gerarPdfCotacao(dados: DadosCotacao) {
  const doc = new jsPDF("p", "mm", "a4");
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const m = 12;
  const pageW = w - 2 * m;
  const azul: [number, number, number] = [26, 58, 92];
  const azulClaro: [number, number, number] = [66, 103, 148];
  const cinzaBg: [number, number, number] = [241, 243, 246];
  const verde: [number, number, number] = [22, 163, 74];

  const logoData = await loadImage(logoImg);

  // ═══ PÁGINA 1: CAPA (arte) ═══
  const img1 = await loadImage(pagina1Img);
  if (img1) doc.addImage(img1, "JPEG", 0, 0, w, h);

  // ═══ PÁGINA 2: DEPOIMENTOS (arte) ═══
  doc.addPage();
  const img2 = await loadImage(pagina2Img);
  if (img2) doc.addImage(img2, "JPEG", 0, 0, w, h);

  // ═══ PÁGINA 3: COTAÇÃO DINÂMICA ═══
  doc.addPage();

  // ── Faixa topo azul ──
  doc.setFillColor(...azul);
  doc.rect(0, 0, w, 28, "F");

  // Logo no topo esquerdo
  if (logoData) doc.addImage(logoData, "PNG", m, 3, 32, 22);

  // Título central
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("PROPOSTA DE PROTEÇÃO VEICULAR", w / 2, 13, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Cotação nº ${dados.numeroCotacao}  |  ${dados.data}  |  Válida por ${dados.validade} dias`, w / 2, 20, { align: "center" });

  let y = 34;
  const halfW = pageW / 2 - 2;
  const leftX = m;
  const rightX = m + halfW + 4;

  // ══════════ DADOS DO ASSOCIADO (esquerda) ══════════
  y = sectionHeader(doc, "DADOS DO ASSOCIADO", leftX, y, halfW, azulClaro);
  y = field(doc, "NOME", dados.cliente.nome, leftX, y, halfW, azul);
  y = field(doc, "TELEFONE", dados.cliente.telefone || "—", leftX, y, halfW, azul);
  y = field(doc, "EMAIL", dados.cliente.email || "—", leftX, y, halfW, azul);
  y = field(doc, "CIDADE", `${dados.cliente.cidade}/${dados.cliente.estado}`, leftX, y, halfW, azul);
  const leftEndY = y;

  // ══════════ DADOS DO VEÍCULO (direita) ══════════
  let ry = 34;
  ry = sectionHeader(doc, "DADOS DO VEÍCULO", rightX, ry, halfW, azulClaro);
  ry = field(doc, "PLACA", dados.cliente.placa, rightX, ry, halfW, azul);
  ry = field(doc, "FIPE", `${fmtBRL(dados.cliente.valorFipe)} - [${dados.cliente.codFipe}]`, rightX, ry, halfW, azul);
  ry = field(doc, "MODELO", dados.cliente.veiculo, rightX, ry, halfW, azul);
  ry = field(doc, "TIPO", `Veículo ${dados.plano.nome.includes("Pesado") ? "Pesado" : "Leves"}`, rightX, ry, halfW, azul);

  y = Math.max(leftEndY, ry) + 4;

  // ══════════ BENEFÍCIOS CONTRATADOS ══════════
  y = sectionHeader(doc, "BENEFÍCIOS CONTRATADOS", leftX, y, pageW, azul);

  const coberturas = dados.coberturas.filter(c => c.inclusa);
  const detalheMap: Record<string, string> = {
    "Roubo": "ROUBO/FURTO - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
    "Furto": "",
    "Colisão": "COLISÃO/INCÊNDIO PÓS COLISÃO - COM ENTREGA DAS NOTAS FISCAIS",
    "Incêndio": "",
    "Perda Total": "PERDA TOTAL - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
    "Vidros Completos (60%)": "VIDRO - FARÓIS, LANTERNAS, PARABRISA, LATERAIS E VIGIA",
    "Danos a terceiros (R$ 150.000)": "TERCEIRO 150 MIL PATRIMONIAIS OU 150 MIL DANOS MATERIAIS",
    "Danos da natureza": "DANOS DA NATUREZA (ENCHENTE, GRANIZO, QUEDA DE ÁRVORE)",
    "Carro Reserva 15 dias": "CARRO RESERVA 15 DIAS",
    "Carro Reserva 7 dias": "CARRO RESERVA 7 DIAS",
    "Carro Reserva 30 dias": "CARRO RESERVA 30 DIAS",
    "Assistência 24H 1000km": "ASSISTÊNCIA 24 HORAS (1000KM DE GUINCHO PANE E COLISÃO)",
    "Auxílio combustível": "AUXÍLIO COMBUSTÍVEL / PANE SECA",
    "Recarga de bateria": "RECARGA DE BATERIA",
    "Hospedagem": "HOSPEDAGEM EM CASO DE SINISTRO",
    "Retorno ao domicílio": "RETORNO AO DOMICÍLIO",
    "Chaveiro": "CHAVEIRO 24 HORAS",
    "Reboque": "GUINCHO ILIMITADO EM CASO DE PT",
    "Troca de pneus": "SUBSTITUIÇÃO DE PNEUS",
  };

  const beneficios = coberturas.length > 0
    ? coberturas.map(c => detalheMap[c.nome] || c.nome.toUpperCase()).filter(b => b.length > 0)
    : [
        "COLISÃO/INCÊNDIO PÓS COLISÃO - COM ENTREGA DAS NOTAS FISCAIS",
        "PERDA TOTAL - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
        "ROUBO/FURTO - COM INDENIZAÇÃO EM 30 DIAS CORRIDOS",
        "TERCEIRO 150 MIL PATRIMONIAIS OU 150 MIL DANOS MATERIAIS",
        "VIDRO - FARÓIS, LANTERNAS, PARABRISA, LATERAIS E VIGIA",
        "VIDRO - RETROVISOR (CAPA, ESPELHO)",
        "ASSISTÊNCIA 24 HORAS (1000KM DE GUINCHO PANE E COLISÃO)",
        "GUINCHO ILIMITADO EM CASO DE PT",
        "CHAVEIRO 24 HORAS",
        "RECARGA DE BATERIA",
        "PANE SECA",
        "SUBSTITUIÇÃO DE PNEUS",
        "CLUBE DE DESCONTO - Clube PRO",
      ];

  // Grid 2 colunas com fundo alternado
  const benefRows: any[][] = [];
  for (let i = 0; i < beneficios.length; i += 2) {
    benefRows.push([beneficios[i] || "", beneficios[i + 1] || ""]);
  }

  autoTable(doc, {
    startY: y,
    body: benefRows,
    theme: "plain",
    margin: { left: m, right: m },
    styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: cinzaBg },
    columnStyles: { 0: { cellWidth: pageW / 2 }, 1: { cellWidth: pageW / 2 } },
    didParseCell: (data: any) => {
      // Destacar itens com "INDENIZAÇÃO" ou "NOTAS FISCAIS" em bold
      const text = String(data.cell.raw || "");
      if (text.includes("INDENIZAÇÃO") || text.includes("NOTAS FISCAIS")) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [26, 58, 92];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ══════════ RODAPÉ: CONSULTOR (esquerda) + MENSALIDADE (direita) ══════════

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(m, y - 2, w - m, y - 2);

  // Consultor esquerda
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...azul);
  doc.text("DADOS DO CONSULTOR", m, y + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text(dados.consultor.nome, m, y + 7);
  if (dados.consultor.telefone) doc.text(dados.consultor.telefone, m, y + 11);
  if (dados.consultor.email) doc.text(dados.consultor.email, m, y + 15);

  // Caixa MENSALIDADE à direita (grande, estilosa)
  const boxW = 70;
  const boxH = 28;
  const boxX = w - m - boxW;
  const boxY = y - 3;
  doc.setFillColor(...azul);
  doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("MENSALIDADE", boxX + boxW / 2, boxY + 8, { align: "center" });
  doc.setFontSize(20);

  const mensalFinal = dados.plano.mensal;
  const mensalOriginal = dados.plano.mensalOriginal;
  if (mensalOriginal && mensalOriginal > mensalFinal) {
    // Preço original riscado pequeno
    doc.setFontSize(9);
    doc.setTextColor(180, 190, 200);
    const origStr = fmtBRL(mensalOriginal);
    doc.text(origStr, boxX + boxW / 2, boxY + 14, { align: "center" });
    // Linha riscando
    const origW = doc.getTextWidth(origStr);
    doc.setDrawColor(180, 190, 200);
    doc.setLineWidth(0.4);
    doc.line(boxX + boxW / 2 - origW / 2, boxY + 13, boxX + boxW / 2 + origW / 2, boxY + 13);
    // Preço com desconto grande
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(fmtBRL(mensalFinal), boxX + boxW / 2, boxY + 22, { align: "center" });
  } else {
    doc.setFontSize(20);
    doc.text(fmtBRL(mensalFinal), boxX + boxW / 2, boxY + 20, { align: "center" });
  }

  // Pontualidade abaixo da caixa
  const pontualidade = Math.round(mensalFinal * 0.85);
  doc.setFontSize(8);
  doc.setTextColor(...verde);
  doc.setFont("helvetica", "bold");
  doc.text(`15% de desconto: ${fmtBRL(pontualidade)}/mês se pagar em dia`, boxX + boxW / 2, boxY + boxH + 5, { align: "center" });

  // Adesão + Instalação abaixo
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Adesão: ${fmtBRL(dados.plano.adesao)}  |  Instalação rastreador: ${fmtBRL(dados.plano.instalacao || 100)}  |  Participação: ${dados.plano.participacao}`, boxX + boxW / 2, boxY + boxH + 10, { align: "center" });

  // Nota final
  const noteY = Math.max(y + 20, boxY + boxH + 16);
  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text("Valor de entrada já inclui valor de vistoria, taxa de cadastro e consultas cadastrais.", m, noteY);
  doc.text(`Proposta nº ${dados.numeroCotacao} válida até ${(() => { const d = new Date(); d.setDate(d.getDate() + dados.validade); return d.toLocaleDateString("pt-BR"); })()}.`, m, noteY + 3.5);

  // ═══ PÁGINA 4: APP (arte) ═══
  doc.addPage();
  const img4 = await loadImage(pagina4Img);
  if (img4) doc.addImage(img4, "JPEG", 0, 0, w, h);

  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}
