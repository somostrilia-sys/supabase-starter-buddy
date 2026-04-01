import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export function gerarPdfCotacao(dados: DadosCotacao) {
  const doc = new jsPDF();
  const azul = "#1A3A5C";
  const cinzaClaro = "#F0F2F5";
  const w = doc.internal.pageSize.getWidth();
  const m = 14; // margem

  // === PÁGINA 1: CAPA ===
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, w, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("OBJETIVO", w / 2, 30, { align: "center" });
  doc.setFontSize(12);
  doc.text("AUTO & TRUCK", w / 2, 40, { align: "center" });
  doc.setFontSize(16);
  doc.text("Sempre prontos para lhe proteger!", w / 2, 52, { align: "center" });

  doc.setTextColor(26, 58, 92);
  doc.setFontSize(14);
  doc.text("Proteção completa com agilidade", w / 2, 80, { align: "center" });
  doc.text("e sem burocracia", w / 2, 90, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const beneficios = [
    "Assistência 24h em todo território nacional",
    "Mais de 30 unidades em todo o país",
    "Recuperações de veículos e reparos",
    "Indenizações rápidas e justas",
    "Licenciado SUSEP",
  ];
  beneficios.forEach((b, i) => {
    doc.text(`• ${b}`, 30, 115 + i * 10);
  });

  // === PÁGINA 2: DEPOIMENTOS ===
  doc.addPage();
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, w, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("OBJETIVO AUTO BENEFÍCIOS", m, 10);

  doc.setTextColor(26, 58, 92);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Nossos Resultados", w / 2, 35, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const cases = [
    { titulo: "Recuperação de Veículo", desc: "Veículo recuperado em menos de 48h após o furto, com toda assistência ao associado." },
    { titulo: "Indenização por Colisão", desc: "Associado recebeu indenização integral em 15 dias úteis após o sinistro." },
    { titulo: "Assistência 24h", desc: "Atendimento em rodovia com guincho e carro reserva, garantindo a viagem do associado." },
  ];
  cases.forEach((c, i) => {
    const y = 55 + i * 35;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 58, 92);
    doc.text(c.titulo, m, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(c.desc, m, y + 8, { maxWidth: w - 28 });
  });

  // === PÁGINA 3: COTAÇÃO (layout de referência) ===
  doc.addPage();

  // Header com logo e dados da cotação
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, w, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OBJETIVO", m + 2, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Auto Benefícios", m + 2, 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`COTAÇÃO: ${dados.numeroCotacao}`, w - m, 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Data: ${dados.data}`, w - m, 15, { align: "right" });
  doc.text(`Validade: ${dados.validade} dias`, w - m, 19, { align: "right" });

  // Saudação e dados do veículo
  let y = 32;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Olá `, m, y);
  doc.setFont("helvetica", "bold");
  doc.text(dados.cliente.nome, m + doc.getTextWidth("Olá "), y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Esta é uma cotação para o seu veículo:", m, y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 58, 92);
  doc.setFontSize(10);
  doc.text(dados.cliente.veiculo, m, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Placa: ${dados.cliente.placa}`, m, y);
  doc.text(`Cód. Fipe: ${dados.cliente.codFipe}`, m + 60, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 50, 50);
  doc.text(`Valor protegido: R$ ${dados.cliente.valorFipe.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, m, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text(`Cidade e estado de circulação: ${dados.cliente.cidade}/${dados.cliente.estado}`, m, y);

  // Separador
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(m, y, w - m, y);

  // PLANO header
  y += 6;
  doc.setFillColor(26, 58, 92);
  doc.rect(m, y, w - 2 * m, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`PLANO ${dados.plano.nome.toUpperCase()}`, m + 4, y + 6);

  // Coberturas sub-header
  y += 12;
  const coberturas = dados.coberturas.filter(c => c.tipo === "cobertura");
  const assistencias = dados.coberturas.filter(c => c.tipo === "assistencia");

  if (coberturas.length > 0) {
    doc.setFillColor(240, 242, 245);
    doc.rect(m, y, w - 2 * m, 6, "F");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Coberturas", m + 4, y + 4.5);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    coberturas.forEach(c => {
      doc.text(c.nome, m + 6, y);
      y += 5;
    });
  }

  if (assistencias.length > 0) {
    y += 2;
    doc.setFillColor(240, 242, 245);
    doc.rect(m, y, w - 2 * m, 6, "F");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Assistências", m + 4, y + 4.5);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    assistencias.forEach(c => {
      doc.text(c.nome, m + 6, y);
      if (c.detalhe) {
        doc.setTextColor(120, 120, 120);
        doc.text(c.detalhe, w - m, y, { align: "right" });
        doc.setTextColor(0, 0, 0);
      }
      y += 5;
    });
  }

  // COTAÇÃO DO VEÍCULO header
  y += 4;
  doc.setFillColor(26, 58, 92);
  doc.rect(m, y, w - 2 * m, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("COTAÇÃO DO VEÍCULO", m + 4, y + 6);
  y += 12;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  // Mensalidade com preço original riscado + desconto
  doc.setFont("helvetica", "bold");
  doc.text("Mensalidade:", m + 4, y);
  if (dados.plano.mensalOriginal && dados.plano.mensalOriginal > dados.plano.mensal) {
    const origText = `R$ ${dados.plano.mensalOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const origX = m + 50;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(origText, origX, y);
    // Strikethrough
    const origW = doc.getTextWidth(origText);
    doc.setDrawColor(150, 150, 150);
    doc.line(origX, y - 1.5, origX + origW, y - 1.5);
    // Preço com desconto
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 58, 92);
    doc.text(`R$ ${dados.plano.mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, origX + origW + 5, y);
  } else {
    doc.setFont("helvetica", "normal");
    doc.text(`R$ ${dados.plano.mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, m + 50, y);
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Adesão:", m + 4, y);
  if (dados.plano.adesaoOriginal && dados.plano.adesaoOriginal > dados.plano.adesao) {
    const origText = `R$ ${dados.plano.adesaoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    const origX = m + 50;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(origText, origX, y);
    const origW = doc.getTextWidth(origText);
    doc.setDrawColor(150, 150, 150);
    doc.line(origX, y - 1.5, origX + origW, y - 1.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 58, 92);
    doc.text(`R$ ${dados.plano.adesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, origX + origW + 5, y);
  } else {
    doc.setFont("helvetica", "normal");
    doc.text(`R$ ${dados.plano.adesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, m + 50, y);
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Rastreador obrigatório:", m + 4, y);
  doc.setFont("helvetica", "normal");
  doc.text(dados.plano.rastreador, m + 60, y);

  // CONSULTOR header
  y += 10;
  doc.setFillColor(26, 58, 92);
  doc.rect(m, y, w - 2 * m, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CONSULTOR", m + 4, y + 6);
  y += 12;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${dados.consultor.nome}`, m + 4, y);
  doc.text(`Telefone: ${dados.consultor.telefone}`, w / 2, y);
  y += 6;
  doc.text(`Email: ${dados.consultor.email}`, m + 4, y);

  // === PÁGINA 4: APP + ENDEREÇO ===
  doc.addPage();
  doc.setFillColor(26, 58, 92);
  doc.rect(0, 0, w, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("OBJETIVO AUTO BENEFÍCIOS", m, 10);

  doc.setTextColor(26, 58, 92);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Baixe nosso App", w / 2, 40, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Acompanhe sua proteção, solicite assistência", w / 2, 52, { align: "center" });
  doc.text("e gerencie tudo na palma da mão.", w / 2, 60, { align: "center" });

  doc.setTextColor(26, 58, 92);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Endereço Matriz", w / 2, 90, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Objetivo Auto Benefícios", w / 2, 100, { align: "center" });

  // Download
  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}
