import jsPDF from "jspdf";
import pagina1Img from "@/assets/cotacao/pagina1.jpg";
import pagina2Img from "@/assets/cotacao/pagina2.jpg";
import pagina4Img from "@/assets/cotacao/pagina4.jpg";

interface DadosCotacao {
  numeroCotacao: string;
  data: string;
  validade: number;
  cliente: { nome: string; veiculo: string; placa: string; codFipe: string; valorFipe: number; cidade: string; estado: string };
  plano: {
    nome: string;
    mensal: number;
    mensalOriginal?: number;
    adesao: number;
    adesaoOriginal?: number;
    participacao: string;
    rastreador: string;
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
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
}

export async function gerarPdfCotacao(dados: DadosCotacao) {
  const doc = new jsPDF("p", "mm", "a4");
  const w = doc.internal.pageSize.getWidth(); // 210
  const h = doc.internal.pageSize.getHeight(); // 297
  const m = 14;

  // === PÁGINA 1: CAPA (imagem completa) ===
  const img1 = await loadImage(pagina1Img);
  if (img1) doc.addImage(img1, "JPEG", 0, 0, w, h);

  // === PÁGINA 2: DEPOIMENTOS (imagem completa) ===
  doc.addPage();
  const img2 = await loadImage(pagina2Img);
  if (img2) doc.addImage(img2, "JPEG", 0, 0, w, h);

  // === PÁGINA 3: COTAÇÃO (dinâmica — layout exato da referência) ===
  doc.addPage();

  // Logo top-left (texto simulando logo)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(26, 58, 92);
  doc.text("OBJETIVO", m, 18);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AUTO BENEFÍCIOS", m, 23);

  // Cotação top-right
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`COTAÇÃO: ${dados.numeroCotacao}`, w - m, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Data: ${dados.data}`, w - m, 22, { align: "right" });
  doc.text(`Validade: ${dados.validade} dias`, w - m, 27, { align: "right" });

  // Separador
  let y = 35;
  doc.setDrawColor(200, 200, 200);
  doc.line(m, y, w - m, y);
  y += 6;

  // Saudação
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Olá ", m, y);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.nome, m + doc.getTextWidth("Olá "), y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Esta é uma cotação para o seu veículo:", m, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.veiculo, m, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Placa: `, m, y);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.placa, m + doc.getTextWidth("Placa: "), y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Cód. Fipe: `, m, y);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.codFipe, m + doc.getTextWidth("Cód. Fipe: "), y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Valor protegido: ", m, y);
  doc.setFont("helvetica", "bold");
  doc.text(`R$ ${dados.cliente.valorFipe.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, m + doc.getTextWidth("Valor protegido: "), y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Cidade e estado de circulação: `, m, y);
  doc.setFont("helvetica", "bold");
  doc.text(`${dados.cliente.cidade}/${dados.cliente.estado}`, m + doc.getTextWidth("Cidade e estado de circulação: "), y);

  // === PLANO header ===
  y += 8;
  doc.setFillColor(26, 58, 92);
  doc.rect(m, y, w - 2 * m, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`PLANO ${dados.plano.nome.toUpperCase()}`, m + 3, y + 5);

  // Coberturas sub-header
  y += 9;
  const coberturas = dados.coberturas.filter(c => c.tipo === "cobertura");
  const assistencias = dados.coberturas.filter(c => c.tipo === "assistencia");
  const tableX = m;
  const tableW = w - 2 * m;

  if (coberturas.length > 0 || true) {
    // Sub-header "Coberturas"
    doc.setFillColor(230, 233, 237);
    doc.rect(tableX, y, tableW, 6, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Coberturas", tableX + 3, y + 4.5);
    y += 6;

    // Cobertura items
    doc.setFont("helvetica", "normal");
    const cobItems = coberturas.length > 0
      ? coberturas.map(c => c.nome)
      : ["Roubo", "Furto"];
    cobItems.forEach(item => {
      doc.setDrawColor(220, 220, 220);
      doc.line(tableX, y, tableX + tableW, y);
      doc.text(item, tableX + 3, y + 4);
      y += 6;
    });
  }

  // Sub-header "Assistências"
  doc.setFillColor(230, 233, 237);
  doc.rect(tableX, y, tableW, 6, "F");
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Assistências", tableX + 3, y + 4.5);
  y += 6;

  doc.setFont("helvetica", "normal");
  const assItems = assistencias.length > 0
    ? assistencias
    : [
      { nome: "Assistência 24H", detalhe: "200km" },
      { nome: "Auxílio combustível" },
      { nome: "Recarga de bateria" },
      { nome: "Hospedagem" },
      { nome: "Retorno ao domicílio" },
      { nome: "Chaveiro" },
      { nome: "Reboque" },
      { nome: "Troca de pneus" },
    ];

  assItems.forEach((item: any) => {
    doc.setDrawColor(220, 220, 220);
    doc.line(tableX, y, tableX + tableW, y);
    const nome = typeof item === "string" ? item : item.nome;
    const detalhe = typeof item === "string" ? "" : (item.detalhe || "");
    doc.text(nome, tableX + 3, y + 4);
    if (detalhe) {
      doc.text(detalhe, tableX + tableW - 3, y + 4, { align: "right" });
    }
    y += 6;
  });

  // Border bottom
  doc.setDrawColor(220, 220, 220);
  doc.line(tableX, y, tableX + tableW, y);

  // === COTAÇÃO DO VEÍCULO header ===
  y += 3;
  doc.setFillColor(26, 58, 92);
  doc.rect(tableX, y, tableW, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("COTAÇÃO DO VEÍCULO", tableX + 3, y + 5);
  y += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  // Mensalidade
  doc.setDrawColor(220, 220, 220);
  doc.line(tableX, y - 1, tableX + tableW, y - 1);
  doc.setFont("helvetica", "normal");
  doc.text("Mensalidade:", tableX + 3, y + 3);
  if (dados.plano.mensalOriginal && dados.plano.mensalOriginal > dados.plano.mensal) {
    // Preço riscado + desconto
    const origText = `R$ ${dados.plano.mensalOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const descText = `R$ ${dados.plano.mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const rightX = tableX + tableW - 3;
    const descW = doc.getTextWidth(descText);
    const origW = doc.getTextWidth(origText);
    // Desconto em preto bold
    doc.setFont("helvetica", "bold");
    doc.text(descText, rightX, y + 3, { align: "right" });
    // Original riscado em cinza
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    const origX = rightX - descW - 4;
    doc.text(origText, origX, y + 3, { align: "right" });
    // Linha de risco
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    doc.line(origX - origW, y + 1.5, origX, y + 1.5);
    doc.setLineWidth(0.2);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.text(`R$ ${dados.plano.mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, tableX + tableW - 3, y + 3, { align: "right" });
  }
  y += 7;

  // Adesão
  doc.setDrawColor(220, 220, 220);
  doc.line(tableX, y - 1, tableX + tableW, y - 1);
  doc.setFont("helvetica", "normal");
  doc.text("Adesão:", tableX + 3, y + 3);
  if (dados.plano.adesaoOriginal && dados.plano.adesaoOriginal > dados.plano.adesao) {
    const origText = `R$ ${dados.plano.adesaoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const descText = `R$ ${dados.plano.adesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const rightX = tableX + tableW - 3;
    const descW = doc.getTextWidth(descText);
    const origW = doc.getTextWidth(origText);
    doc.setFont("helvetica", "bold");
    doc.text(descText, rightX, y + 3, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    const origX = rightX - descW - 4;
    doc.text(origText, origX, y + 3, { align: "right" });
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    doc.line(origX - origW, y + 1.5, origX, y + 1.5);
    doc.setLineWidth(0.2);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.text(`R$ ${dados.plano.adesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, tableX + tableW - 3, y + 3, { align: "right" });
  }
  y += 7;

  // Rastreador
  doc.setDrawColor(220, 220, 220);
  doc.line(tableX, y - 1, tableX + tableW, y - 1);
  doc.text("Rastreador obrigatório:", tableX + 3, y + 3);
  doc.text(dados.plano.rastreador || "", tableX + tableW - 3, y + 3, { align: "right" });
  y += 7;
  doc.line(tableX, y - 1, tableX + tableW, y - 1);

  // === CONSULTOR header ===
  y += 3;
  doc.setFillColor(26, 58, 92);
  doc.rect(tableX, y, tableW, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CONSULTOR", tableX + 3, y + 5);
  y += 9;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // Nome + Telefone
  doc.setDrawColor(220, 220, 220);
  doc.line(tableX, y - 1, tableX + tableW, y - 1);
  doc.setFont("helvetica", "bold");
  doc.text("Nome: ", tableX + 3, y + 3);
  doc.setFont("helvetica", "normal");
  doc.text(dados.consultor.nome, tableX + 3 + doc.getTextWidth("Nome: "), y + 3);

  doc.setFont("helvetica", "bold");
  doc.text("Telefone: ", tableX + tableW / 2, y + 3);
  doc.setFont("helvetica", "normal");
  doc.text(dados.consultor.telefone, tableX + tableW / 2 + doc.getTextWidth("Telefone: "), y + 3);
  y += 7;

  // Email
  doc.setDrawColor(220, 220, 220);
  doc.line(tableX, y - 1, tableX + tableW, y - 1);
  doc.setFont("helvetica", "bold");
  doc.text("Email: ", tableX + 3, y + 3);
  doc.setFont("helvetica", "normal");
  doc.text(dados.consultor.email, tableX + 3 + doc.getTextWidth("Email: "), y + 3);
  y += 6;
  doc.line(tableX, y, tableX + tableW, y);

  // === PÁGINA 4: APP (imagem completa) ===
  doc.addPage();
  const img4 = await loadImage(pagina4Img);
  if (img4) doc.addImage(img4, "JPEG", 0, 0, w, h);

  // Download
  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}
