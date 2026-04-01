import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DadosContrato {
  empresa: { nome: string; cnpj: string };
  associado: { nome: string; cpf: string; rg: string; cnh: string; sexo: string; nascimento: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; cep: string; email: string; celular: string };
  veiculo: { placa: string; modelo: string; marca: string; anoFab: string; anoModelo: string; cor: string; combustivel: string; chassi: string; renavam: string; codFipe: string; valorFipe: number; valorProtegido: number; diaVencimento: string; veiculoTrabalho: string };
  plano: { nome: string; valorMensal: number; adesao: number; participacao: string };
  coberturas: string[];
  assistencias: string[];
  consultor: { nome: string; celular: string; email: string };
  textoContrato?: string;
}

export function gerarContratoPdf(dados: DadosContrato): Blob {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const azul: [number, number, number] = [26, 58, 92];
  const azulClaro: [number, number, number] = [200, 215, 230];

  function header(titulo: string, y: number) {
    doc.setFillColor(...azul);
    doc.rect(14, y, w - 28, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(titulo, w / 2, y + 6, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  }

  // === PÁG 1: TERMO DE ADESÃO ===
  // Logo area
  doc.setFontSize(18);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(...azul);
  doc.text("OBJETIVO", 14, 20);
  doc.setFontSize(8);
  doc.text("AUTO BENEFÍCIOS", 14, 26);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE ADESÃO", w - 14, 18, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`CNPJ: ${dados.empresa.cnpj}`, w - 14, 24, { align: "right" });

  // Dados do Associado
  header("DADOS DO ASSOCIADO", 35);
  autoTable(doc, {
    startY: 45, head: [], theme: "grid", margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200] },
    body: [
      [{ content: `Nome: ${dados.associado.nome}`, colSpan: 2, styles: { fontStyle: "bold" } }, `CPF: ${dados.associado.cpf}`],
      [`RG: ${dados.associado.rg}`, `CNH: ${dados.associado.cnh}`, `Sexo: ${dados.associado.sexo}`, `Data Nascimento: ${dados.associado.nascimento}`],
      [`Logradouro: ${dados.associado.logradouro}`, `Nº: ${dados.associado.numero}`, `Complemento: ${dados.associado.complemento}`],
      [`Bairro: ${dados.associado.bairro}`, `Cidade: ${dados.associado.cidade}`, `Estado: ${dados.associado.estado}`, `CEP: ${dados.associado.cep}`],
      [`E-mail: ${dados.associado.email}`, { content: `Celular: ${dados.associado.celular}`, colSpan: 2 }],
    ],
  });

  // Dados do Veículo
  let y = (doc as any).lastAutoTable.finalY + 5;
  header("DADOS DO VEÍCULO", y);
  autoTable(doc, {
    startY: y + 10, head: [], theme: "grid", margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200] },
    body: [
      [`Placa: ${dados.veiculo.placa}`, `Modelo: ${dados.veiculo.modelo}`],
      [`Marca: ${dados.veiculo.marca}`, `Chassi: ${dados.veiculo.chassi}`, `Renavam: ${dados.veiculo.renavam}`],
      [`Ano Fab: ${dados.veiculo.anoFab}`, `Cor: ${dados.veiculo.cor}`, `Combustível: ${dados.veiculo.combustivel}`],
      [`Ano Modelo: ${dados.veiculo.anoModelo}`, `Cód. FIPE: ${dados.veiculo.codFipe}`, `Valor FIPE: R$ ${dados.veiculo.valorFipe.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      [`Valor Protegido: R$ ${dados.veiculo.valorProtegido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, `Dia de Vencimento: ${dados.veiculo.diaVencimento}`, `Veículo de Trabalho: ${dados.veiculo.veiculoTrabalho}`],
    ],
  });

  // === PÁG 2: PRODUTOS ===
  doc.addPage();
  header("PRODUTOS VEÍCULO", 15);
  autoTable(doc, {
    startY: 25, head: [], theme: "grid", margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [200, 200, 200] },
    headStyles: { fillColor: azulClaro, textColor: [0, 0, 0], fontStyle: "bold" },
    body: [
      [{ content: `Plano: ${dados.plano.nome}`, styles: { fontStyle: "bold", fillColor: azulClaro } }, `Valor mensal: R$ ${dados.plano.valorMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
      [`Adesão: R$ ${dados.plano.adesao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, `Participação: ${dados.plano.participacao}`],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 3;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Produtos:", 14, y + 4);
  doc.setFont("helvetica", "normal");
  dados.coberturas.forEach((c, i) => {
    doc.text(c, 14, y + 10 + i * 5);
  });

  y = y + 10 + dados.coberturas.length * 5 + 3;
  dados.assistencias.forEach((a, i) => {
    doc.text(a, 14, y + i * 5);
  });

  y = y + dados.assistencias.length * 5 + 8;
  header("DADOS DO CONSULTOR", y);
  autoTable(doc, {
    startY: y + 10, head: [], theme: "grid", margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    body: [
      [`Nome: ${dados.consultor.nome}`, `Celular: ${dados.consultor.celular}`, `Email: ${dados.consultor.email}`],
    ],
  });

  // === PÁG 3-4: CONTRATO ===
  doc.addPage();
  header("CONTRATO DE ADESÃO", 15);

  const texto = dados.textoContrato || `SERVIÇOS OFERECIDOS: Proteção contra colisão, incêndio, roubo/furto, perda total, danos a terceiros conforme o regulamento da ${dados.empresa.nome}, cujo associado tem ciência e que consta no site da associação.

PRAZO PARA COMUNICAÇÃO DO EVENTO: Os veículos que forem envolvidos em acidentes com danos reparáveis ou irreparáveis deverão ser comunicados imediatamente à associação ${dados.empresa.nome} no momento do fato, através dos telefones 0800-111-3400 ou 0800-123-9500 para solicitação de assistência 24h e comunicação de eventos como colisão, incêndio, roubo, entre outros.

ASSISTÊNCIA 24 HORAS: Vinculado ao manual de assistência 24h.

BOLETOS: O vencimento do boleto ocorrerá em dias fixos de acordo com a data de cadastro da associação. O não pagamento até a data do vencimento torna o veículo do associado desprotegido a partir de 00:00 hora do 1º dia subsequente ao vencimento.

CANCELAMENTO: O cancelamento pode ser solicitado a qualquer momento após 3 meses de participação mínima, com aviso prévio de 25 dias antes do próximo vencimento.

COTA DE PARTICIPAÇÃO: O reembolso de eventos depende do pagamento da Cota Participação, estabelecida conforme o valor da Tabela FIPE.

VALOR PROTEGIDO: O valor protegido é definido pela Tabela FIPE vigente.

VISTORIA PRÉVIA: A proteção do veículo será válida somente após a aprovação da vistoria prévia, seguindo critérios da associação.`;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(texto, w - 28);
  let currentY = 28;
  for (const line of lines) {
    if (currentY > 275) { doc.addPage(); currentY = 20; }
    doc.text(line, 14, currentY);
    currentY += 4;
  }

  // === PÁG 5: ASSINATURAS ===
  doc.addPage();
  const sigY = 60;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, w / 2, 30, { align: "center" });

  // Assinatura associado
  doc.line(30, sigY, 90, sigY);
  doc.setFontSize(9);
  doc.text(dados.associado.nome, 60, sigY + 8, { align: "center" });
  doc.setFontSize(7);
  doc.text(dados.associado.cpf, 60, sigY + 13, { align: "center" });

  // Assinatura empresa
  doc.line(120, sigY, 180, sigY);
  doc.setFontSize(9);
  doc.text(dados.empresa.nome, 150, sigY + 8, { align: "center" });
  doc.setFontSize(7);
  doc.text(dados.empresa.cnpj, 150, sigY + 13, { align: "center" });

  // Footer com hash
  const hash = `GIA-${Date.now().toString(36).toUpperCase()}`;
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text(`Documento: ${hash}`, 14, 290);
    doc.text(`${i} de ${totalPages}`, w - 14, 290, { align: "right" });
  }

  return doc.output("blob");
}

export function baixarContratoPdf(dados: DadosContrato) {
  const doc = new jsPDF();
  // Reusar mesma lógica mas salvar direto
  const blob = gerarContratoPdf(dados);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Contrato-${dados.associado.nome.replace(/\s/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
