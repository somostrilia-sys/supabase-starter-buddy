import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "@/assets/cotacao/logo-objetivo.png";

export interface DadosContrato {
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
  coberturas?: string[];
  assistencias?: string[];
}

function fmtMoney(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function cell(label: string, value: string): string {
  const v = value?.trim() ? `<span>${value}</span>` : `<span class="empty">&mdash;</span>`;
  return `<div class="data-cell"><label>${label}</label>${v}</div>`;
}

function buildPage1(d: DadosContrato, hash: string): string {
  const coberturas = d.coberturas && d.coberturas.length > 0 ? d.coberturas : d.produtos.filter((_, i) => i < Math.ceil(d.produtos.length / 2));
  const assistencias = d.assistencias && d.assistencias.length > 0 ? d.assistencias : d.produtos.filter((_, i) => i >= Math.ceil(d.produtos.length / 2));

  return `
  <div class="page">
    <div class="top-bar"></div>
    <div class="page-inner">
      <div class="header">
        <img src="${logoImg}" alt="Objetivo Auto Benefícios">
        <div class="header-text">
          <h1>Termo de Adesão</h1>
          <div class="subtitle">Proteção Veicular Associativa</div>
        </div>
        <div class="header-right">
          <div class="cnpj-label">CNPJ</div>
          <div class="cnpj">${d.empresa.cnpj}</div>
        </div>
      </div>

      <div class="section-title">Dados do Associado</div>
      <div class="data-grid cols-2">
        ${cell("Nome Completo", d.associado.nome)}
        ${cell("CPF", d.associado.cpf)}
      </div>
      <div class="data-grid cols-4">
        ${cell("RG", d.associado.rg)}
        ${cell("CNH", d.associado.cnh)}
        ${cell("Sexo", d.associado.sexo)}
        ${cell("Data Nascimento", d.associado.nascimento)}
      </div>
      <div class="data-grid cols-4">
        ${cell("Logradouro", d.associado.logradouro)}
        ${cell("Número", d.associado.numero)}
        ${cell("Complemento", d.associado.complemento)}
        ${cell("Bairro", d.associado.bairro)}
      </div>
      <div class="data-grid cols-4">
        ${cell("Cidade", d.associado.cidade)}
        ${cell("Estado", d.associado.estado)}
        ${cell("CEP", d.associado.cep)}
        ${cell("Celular", d.associado.celular)}
      </div>
      <div class="data-grid cols-2">
        ${cell("E-mail", d.associado.email)}
        ${cell("Telefone", d.associado.celular)}
      </div>

      <div class="section-title">Dados do Veículo</div>
      <div class="data-grid cols-3">
        ${cell("Placa", d.veiculo.placa)}
        ${cell("Modelo", d.veiculo.modelo)}
        ${cell("Marca", d.veiculo.marca)}
      </div>
      <div class="data-grid cols-3">
        ${cell("Chassi", d.veiculo.chassi)}
        ${cell("Renavam", d.veiculo.renavam)}
        ${cell("Ano Fabricação", d.veiculo.anoFab)}
      </div>
      <div class="data-grid cols-3">
        ${cell("Cor", d.veiculo.cor)}
        ${cell("Combustível", d.veiculo.combustivel)}
        ${cell("Ano Modelo", d.veiculo.anoModelo)}
      </div>
      <div class="data-grid cols-3">
        ${cell("Cód. FIPE", d.veiculo.codFipe)}
        ${cell("Valor FIPE", fmtMoney(d.veiculo.valorFipe))}
        ${cell("Veículo Trabalho", d.veiculo.veiculoTrabalho)}
      </div>

      <div class="highlight-box">
        <div class="row">
          <div><label>Valor Protegido</label><div class="val">${fmtMoney(d.veiculo.valorProtegido || d.veiculo.valorFipe)}</div></div>
          <div style="text-align:right"><label>Dia Vencimento</label><div class="val">${d.veiculo.diaVencimento}</div></div>
        </div>
      </div>

      <div class="section-title">Dados do Agregado</div>
      ${d.agregado?.nome ? `
      <div class="data-grid cols-3">
        ${cell("Nome", d.agregado.nome)}
        ${cell("CPF", d.agregado.cpf || "")}
        ${cell("Parentesco", d.agregado.parentesco || "")}
      </div>` : `<div class="no-data">Sem agregado cadastrado</div>`}

      <div class="section-title">Produtos do Veículo</div>
      <div class="highlight-box">
        <div class="row">
          <div><label>Plano</label><div class="val">${d.plano.nome}</div></div>
          <div><label>Valor Mensal</label><div class="val">${fmtMoney(d.plano.valorMensal)}</div></div>
        </div>
        <div class="row">
          <div><label>Adesão</label><div class="val">${fmtMoney(d.plano.adesao)}</div></div>
          <div><label>Participação</label><div class="val">${d.plano.participacao}</div></div>
        </div>
      </div>

      <div class="products-grid">
        <div class="product-col">
          <h4>Coberturas Incluídas</h4>
          <ul>${coberturas.map(c => `<li>${c}</li>`).join("")}</ul>
        </div>
        <div class="product-col">
          <h4>Assistências Incluídas</h4>
          <ul>${assistencias.map(a => `<li>${a}</li>`).join("")}</ul>
        </div>
      </div>

      ${d.opcionais && d.opcionais.length > 0 ? `
      <div class="section-title">Serviços Contratados</div>
      <div class="products-grid"><div class="product-col"><h4>Serviços</h4><ul>${d.opcionais.map(o => `<li>${o}</li>`).join("")}</ul></div></div>` : ""}

      <div class="section-title">Dados do Consultor</div>
      <div class="data-grid cols-3">
        ${cell("Nome", d.consultor.nome)}
        ${cell("Celular", d.consultor.celular)}
        ${cell("Email", d.consultor.email)}
      </div>

      <div class="footer">
        <div class="qr">Autenticação GIA: ${hash}</div>
        <div>Página 1 de 3</div>
      </div>
    </div>
    <div class="watermark">OBJETIVO</div>
  </div>`;
}

function buildPage2(d: DadosContrato, hash: string): string {
  const sections = [
    { t: "Serviços Oferecidos", p: "A associação oferece serviços de proteção veicular contra colisão, incêndio, roubo, furto, perda total e danos a terceiros, conforme regulamento vigente disponível no site da associação, do qual o associado declara ter pleno conhecimento." },
    { t: "Prazo para Comunicação", p: "Os veículos que forem envolvidos em acidentes com danos reparáveis ou irreparáveis deverão ser comunicados imediatamente à associação no momento do fato, através dos telefones <strong>0800-111-3400</strong> ou <strong>0800-123-9500</strong>, para solicitação de assistência 24h e comunicação de eventos." },
    { t: "Assistência 24 Horas", p: "O serviço de Assistência 24 Horas está vinculado ao manual de assistência 24h. Inclui reboque até 1000km, auxílio combustível, recarga de bateria, hospedagem, retorno ao domicílio, chaveiro e troca de pneus." },
    { t: "Boletos", p: "O vencimento do boleto ocorrerá em dias fixos de acordo com a data de cadastro junto à associação. O não pagamento até a data do vencimento torna o veículo do associado desprotegido a partir de 00:00 hora do 1º dia subsequente ao vencimento." },
    { t: "Vistoria Prévia", p: "A proteção do veículo será válida somente após a aprovação da vistoria prévia, seguindo critérios estabelecidos pela associação." },
    { t: "Benefício Desconto Mensalidade", p: "Associados que mantiverem suas mensalidades em dia por período consecutivo de 12 meses poderão ter direito a desconto na renovação." },
    { t: "Rastreador", p: "A instalação de rastreador poderá ser exigida para veículos com valor FIPE acima do limite estabelecido pela associação. O custo do rastreador e sua instalação são de responsabilidade do associado." },
    { t: "Cancelamento", p: "O cancelamento pode ser solicitado a qualquer momento após 3 meses de participação mínima obrigatória, mediante aviso prévio de 25 dias antes do próximo vencimento." },
    { t: "Cota de Participação", p: "O reembolso de eventos cobertos depende do pagamento da Cota de Participação pelo associado, cujo valor é estabelecido conforme percentual sobre o valor da Tabela FIPE do veículo na data do evento." },
    { t: "Valor Protegido", p: "O valor protegido é definido pela Tabela FIPE vigente na data do evento. Em caso de perda total, o reembolso será de até 100% do valor da Tabela FIPE, deduzida a cota de participação." },
  ];

  return `
  <div class="page page-break">
    <div class="top-bar"></div>
    <div class="page-inner">
      <div class="header">
        <img src="${logoImg}" alt="Objetivo Auto Benefícios">
        <div class="header-text"><h1>Contrato de Adesão</h1><div class="subtitle">Termos e Condições Gerais</div></div>
        <div class="header-right"><div class="cnpj-label">CNPJ</div><div class="cnpj">${d.empresa.cnpj}</div></div>
      </div>
      ${sections.map(s => `<div class="contract-section"><h3>${s.t}</h3><p>${s.p}</p></div>`).join("")}
      <div class="footer"><div class="qr">Autenticação GIA: ${hash}</div><div>Página 2 de 3</div></div>
    </div>
    <div class="watermark">OBJETIVO</div>
  </div>`;
}

function buildPage3(d: DadosContrato, hash: string): string {
  const dataAtual = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const sections2 = [
    { t: "Reembolso", p: "O reembolso será efetuado em até 30 dias úteis após a aprovação do evento pela associação, mediante apresentação de toda documentação exigida." },
    { t: "Veículos Alienados", p: "Veículos com alienação fiduciária poderão ser aceitos mediante apresentação de documentação comprobatória." },
    { t: "Veículos Leilão / Ex-Táxi", p: "Veículos oriundos de leilão ou ex-táxi poderão ter restrições de cobertura ou condições especiais de participação." },
    { t: "Lucros Cessantes", p: "A associação não se responsabiliza por lucros cessantes, danos indiretos ou consequenciais decorrentes de eventos cobertos ou não cobertos." },
    { t: "Danos Morais", p: "A associação não se responsabiliza por danos morais de qualquer natureza relacionados direta ou indiretamente aos serviços prestados." },
  ];

  return `
  <div class="page page-break">
    <div class="top-bar"></div>
    <div class="page-inner">
      <div class="header">
        <img src="${logoImg}" alt="Objetivo Auto Benefícios">
        <div class="header-text"><h1>Contrato de Adesão</h1><div class="subtitle">Termos e Condições Gerais</div></div>
        <div class="header-right"><div class="cnpj-label">CNPJ</div><div class="cnpj">${d.empresa.cnpj}</div></div>
      </div>
      ${sections2.map(s => `<div class="contract-section"><h3>${s.t}</h3><p>${s.p}</p></div>`).join("")}

      <div class="section-title">Termo de Aceite de Vistoria</div>
      <div class="declarations">
        <p style="font-size:10.5px;color:#333;margin-bottom:8px;font-weight:500;">Eu, associado abaixo identificado, declaro para os devidos fins que:</p>
        <ul>
          <li>Recebi e li integralmente o regulamento da associação e estou ciente de todas as condições, direitos e obrigações;</li>
          <li>As informações prestadas neste termo são verdadeiras e completas, sob pena de perda dos benefícios;</li>
          <li>O veículo descrito neste termo encontra-se em perfeito estado de conservação, sem avarias, danos ou modificações não declaradas;</li>
          <li>Estou ciente de que a proteção somente terá início após a aprovação da vistoria prévia e pagamento da primeira mensalidade;</li>
          <li>Autorizo a associação a realizar consultas cadastrais e veiculares para fins de análise;</li>
          <li>Concordo com os termos de adesão, regulamento e tabela de preços vigente.</li>
        </ul>
      </div>

      <div class="date-center">${dataAtual}</div>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"><div class="name">${d.associado.nome}</div><div class="doc">CPF: ${d.associado.cpf || "&mdash;"}</div></div></div>
        <div class="sig-block"><div class="sig-line"><div class="name">${d.empresa.nome}</div><div class="doc">CNPJ: ${d.empresa.cnpj}</div></div></div>
      </div>

      <div class="footer"><div class="qr">Autenticação GIA: ${hash}</div><div>Página 3 de 3</div></div>
    </div>
    <div class="watermark">OBJETIVO</div>
  </div>`;
}

const CSS = `
@page{size:A4;margin:12mm 15mm}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:#1a1a1a;line-height:1.5;background:#fff}
.page{width:210mm;min-height:297mm;background:#fff;padding:0;position:relative;overflow:hidden;page-break-after:always}
.page-break{page-break-before:always}
.top-bar{height:6px;background:linear-gradient(90deg,#0d2137 0%,#1b3a5c 30%,#2980b9 70%,#1b3a5c 100%)}
.page::before{content:'';position:absolute;left:0;top:6px;bottom:0;width:5px;background:linear-gradient(180deg,#1b3a5c,#2980b9,#1b3a5c)}
.page::after{content:'';position:absolute;right:0;top:6px;bottom:0;width:5px;background:linear-gradient(180deg,#1b3a5c,#2980b9,#1b3a5c)}
.page-inner{padding:16mm 22mm 14mm 22mm}
.header{display:flex;align-items:center;gap:16px;margin-bottom:18px;padding-bottom:14px;border-bottom:2.5px solid #1b3a5c;position:relative}
.header::after{content:'';position:absolute;bottom:-5px;left:0;width:80px;height:2.5px;background:#2980b9;border-radius:2px}
.header img{height:80px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15))}
.header-text{flex:1}.header-text h1{font-size:26px;font-weight:800;color:#1b3a5c;letter-spacing:2px;text-transform:uppercase}
.header-text .subtitle{font-size:11px;color:#2980b9;font-weight:600;letter-spacing:1px;margin-top:2px}
.header-right{text-align:right}.header-right .cnpj-label{font-size:8px;color:#999;text-transform:uppercase;letter-spacing:1px}
.header-right .cnpj{font-size:13px;font-weight:700;color:#1b3a5c}
.section-title{background:linear-gradient(135deg,#1b3a5c,#234b73);color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;padding:7px 16px;margin:18px 0 10px;border-radius:4px;box-shadow:0 2px 6px rgba(27,58,92,.25);position:relative}
.section-title::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#2980b9;border-radius:4px 0 0 4px}
.data-grid{display:grid;gap:0;border:1px solid #d0d5dd;border-radius:6px;overflow:hidden;margin-bottom:6px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.data-grid.cols-2{grid-template-columns:1fr 1fr}.data-grid.cols-3{grid-template-columns:1fr 1fr 1fr}.data-grid.cols-4{grid-template-columns:1fr 1fr 1fr 1fr}
.data-cell{padding:6px 12px;border-bottom:1px solid #eef0f2;border-right:1px solid #eef0f2;background:#fff}
.data-cell label{font-size:8.5px;text-transform:uppercase;color:#2980b9;letter-spacing:.8px;display:block;margin-bottom:1px;font-weight:600}
.data-cell span{font-weight:700;color:#1a1a1a;font-size:11px}.data-cell span.empty{color:#ccc;font-weight:400}
.highlight-box{background:linear-gradient(135deg,#f0f5fb,#e8eef5);border:1px solid #c5d3e3;border-left:4px solid #2980b9;border-radius:6px;padding:12px 16px;margin-bottom:6px;box-shadow:0 1px 4px rgba(41,128,185,.1)}
.highlight-box .row{display:flex;justify-content:space-between;margin-bottom:4px}.highlight-box .row:last-child{margin-bottom:0}
.highlight-box label{font-size:8.5px;text-transform:uppercase;color:#2980b9;font-weight:600;letter-spacing:.5px}
.highlight-box .val{font-size:15px;font-weight:800;color:#1b3a5c}
.products-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #d0d5dd;border-radius:6px;overflow:hidden;margin-bottom:6px}
.product-col{padding:10px 16px;background:#fff}.product-col:first-child{border-right:1px solid #eef0f2}
.product-col h4{font-size:9px;text-transform:uppercase;color:#2980b9;margin-bottom:8px;letter-spacing:1px;font-weight:700}
.product-col ul{list-style:none}.product-col ul li{font-size:11px;padding:3px 0 3px 18px;position:relative;color:#1a1a1a;font-weight:500}
.product-col ul li::before{content:'';width:7px;height:7px;background:linear-gradient(135deg,#2980b9,#1b3a5c);border-radius:50%;position:absolute;left:0;top:7px;box-shadow:0 1px 3px rgba(41,128,185,.3)}
.contract-section{margin-bottom:14px}.contract-section h3{font-size:11.5px;font-weight:700;color:#1b3a5c;text-transform:uppercase;margin-bottom:5px;padding-bottom:4px;border-bottom:1.5px solid #e0e7ef;letter-spacing:.5px;position:relative;padding-left:10px}
.contract-section h3::before{content:'';position:absolute;left:0;top:2px;bottom:6px;width:3px;background:#2980b9;border-radius:2px}
.contract-section p{font-size:10.5px;text-align:justify;color:#333;line-height:1.6}
.declarations ul{list-style:none;margin-top:8px}.declarations ul li{font-size:10.5px;color:#333;padding:4px 0 4px 20px;position:relative;text-align:justify;line-height:1.55}
.declarations ul li::before{content:'';width:8px;height:8px;border:2px solid #2980b9;border-radius:2px;position:absolute;left:0;top:7px}
.signatures{display:flex;justify-content:space-between;margin-top:44px}.sig-block{text-align:center;width:44%}
.sig-line{border-top:2px solid #1b3a5c;padding-top:8px}.sig-block .name{font-weight:800;font-size:12px;color:#1b3a5c}
.sig-block .doc{font-size:10px;color:#666;margin-top:2px}
.date-center{text-align:center;font-size:13px;font-weight:700;color:#1b3a5c;margin-top:34px}
.footer{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #eef0f2;padding-top:10px;margin-top:18px;font-size:9px;color:#aaa}
.footer .qr{font-weight:600;color:#2980b9}
.no-data{color:#bbb;font-style:italic;font-size:10.5px;padding:8px 12px;background:#fafafa;border-radius:4px;border:1px dashed #ddd}
.watermark{position:absolute;bottom:30mm;right:15mm;font-size:72px;font-weight:900;color:rgba(27,58,92,.03);transform:rotate(-25deg);letter-spacing:8px;pointer-events:none;user-select:none}
`;

async function renderPageToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.innerHTML = `<style>${CSS}</style>${html}`;
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;";
  document.body.appendChild(container);

  if (document.fonts?.ready) {
    await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
  }

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    width: 794,
    windowWidth: 794,
  });

  document.body.removeChild(container);
  return canvas;
}

export async function gerarContratoPdf(dados: DadosContrato): Promise<Blob> {
  const hash = `GIA-${Date.now().toString(36).toUpperCase()}`;
  const pages = [
    buildPage1(dados, hash),
    buildPage2(dados, hash),
    buildPage3(dados, hash),
  ];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage();
    const canvas = await renderPageToCanvas(pages[i]);
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    doc.addImage(imgData, "JPEG", 0, 0, 210, 297);
  }

  return doc.output("blob");
}

export async function baixarContratoPdf(dados: DadosContrato) {
  const blob = await gerarContratoPdf(dados);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Contrato-${dados.associado.nome.replace(/\s/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
