import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import pagina1Img from "@/assets/cotacao/pagina1.jpg";
import pagina2Img from "@/assets/cotacao/pagina2.jpg";
import pagina4Img from "@/assets/cotacao/pagina4.jpg";

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
  opcionais?: { nome: string; categoria: string; valor_mensal: number }[];
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

function fmtBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function fmtBRLParts(v: number): { currency: string; integer: string; decimals: string } {
  const parts = v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }).split(",");
  return { currency: "R$", integer: parts[0], decimals: `,${parts[1]}` };
}

// Descrições padrão das coberturas (fallback quando detalhe do banco está vazio)
// Obs: evitar citar percentuais FIPE aqui — regras variam por categoria (táxi, leilão, etc)
const coberturaDescFallback: Record<string, string> = {
  "colisão": "Danos por colisão, capotamento ou tombamento",
  "incêndio": "Proteção contra incêndio, explosão e queda de raio",
  "perda total": "Indenização integral conforme regulamento do plano",
  "roubo": "Indenização conforme regulamento do plano",
  "furto": "Indenização conforme regulamento do plano",
  "danos a terceiros": "Danos materiais e corporais causados a terceiros",
  "terceiros": "Danos materiais e corporais causados a terceiros",
  "vidros": "Para-brisas, vidros laterais e traseiro",
  "retrovisor": "Troca ou reparo de retrovisores",
  "danos da natureza": "Enchentes, granizo, queda de árvore",
  "carro reserva": "Veículo reserva em caso de sinistro",
  "assistência 24h": "Socorro mecânico 24h, 7 dias por semana",
  "guincho": "Serviço de guincho em território nacional",
  "reboque": "Serviço de reboque em território nacional",
  "chaveiro": "Abertura do veículo no local",
  "recarga de bateria": "Recarga ou troca de bateria no local",
  "auxílio combustível": "Envio de combustível em caso de pane seca",
  "troca de pneus": "Troca pelo estepe do veículo",
  "hospedagem": "Diárias de hotel após sinistro fora do domicílio",
  "retorno ao domicílio": "Transporte de retorno após sinistro",
  "clube": "Acesso ao clube de benefícios e descontos exclusivos",
};

function getCoberturaDesc(nome: string, detalheOriginal: string): string {
  if (detalheOriginal) return detalheOriginal;
  const lower = nome.toLowerCase();
  for (const [key, desc] of Object.entries(coberturaDescFallback)) {
    if (lower.includes(key)) return desc;
  }
  return "";
}

// Mapeamento nome → categoria + emoji
const categoryMap: Record<string, { cat: string; emoji: string }> = {
  "colisão": { cat: "protecao", emoji: "💥" },
  "colisao": { cat: "protecao", emoji: "💥" },
  "incêndio": { cat: "protecao", emoji: "🔥" },
  "incendio": { cat: "protecao", emoji: "🔥" },
  "perda total": { cat: "protecao", emoji: "⚠️" },
  "roubo": { cat: "roubo", emoji: "🔒" },
  "furto": { cat: "roubo", emoji: "🔑" },
  "danos a terceiros": { cat: "terceiro", emoji: "👥" },
  "terceiros": { cat: "terceiro", emoji: "👥" },
  "rcf": { cat: "terceiro", emoji: "👥" },
  "vidro": { cat: "vidro", emoji: "🪟" },
  "retrovisor": { cat: "vidro", emoji: "🪞" },
  "guincho": { cat: "assist", emoji: "♾️" },
  "reboque": { cat: "assist", emoji: "♾️" },
  "chaveiro": { cat: "assist", emoji: "🔑" },
  "bateria": { cat: "assist", emoji: "🔋" },
  "combustível": { cat: "assist", emoji: "⛽" },
  "combustivel": { cat: "assist", emoji: "⛽" },
  "pane seca": { cat: "assist", emoji: "⛽" },
  "pneu": { cat: "assist", emoji: "🛞" },
  "assistência": { cat: "assist", emoji: "🚗" },
  "assistencia": { cat: "assist", emoji: "🚗" },
  "carro reserva": { cat: "extra", emoji: "🚙" },
  "natureza": { cat: "extra", emoji: "🌧️" },
  "hospedagem": { cat: "extra", emoji: "🏨" },
  "retorno": { cat: "extra", emoji: "🏠" },
  "domicílio": { cat: "extra", emoji: "🏠" },
  "domicilio": { cat: "extra", emoji: "🏠" },
  "clube": { cat: "clube", emoji: "⭐" },
};

const categoryMeta: Record<string, { label: string; chip: string; order: number }> = {
  protecao: { label: "Proteção Principal", chip: "💥", order: 1 },
  roubo: { label: "Roubo & Furto", chip: "🔒", order: 2 },
  terceiro: { label: "Responsabilidade a Terceiros", chip: "👥", order: 3 },
  vidro: { label: "Vidros & Retrovisores", chip: "🪟", order: 4 },
  assist: { label: "Assistência 24 Horas", chip: "🚗", order: 5 },
  extra: { label: "Benefícios Extras", chip: "✨", order: 6 },
  clube: { label: "Clube de Benefícios", chip: "⭐", order: 7 },
  outros: { label: "Outras Coberturas", chip: "✅", order: 99 },
};

function getCatMeta(nome: string): { cat: string; emoji: string } {
  const lower = nome.toLowerCase();
  for (const [key, meta] of Object.entries(categoryMap)) {
    if (lower.includes(key)) return meta;
  }
  return { cat: "outros", emoji: "✅" };
}

function buildPage3HTML(dados: DadosCotacao): string {
  const totalOpc = (dados.opcionais || []).reduce((s, o) => s + o.valor_mensal, 0);
  const mensalFinal = dados.plano.mensal;
  const mensalOriginal = dados.plano.mensalOriginal;
  const pontualidade = Math.round(mensalFinal * 0.85);
  const validadeDate = (() => { const d = new Date(); d.setDate(d.getDate() + dados.validade); return d.toLocaleDateString("pt-BR"); })();
  const price = fmtBRLParts(mensalFinal);

  // Agrupar coberturas por categoria
  const coberturas = dados.coberturas.filter(c => c.inclusa);
  const totalBenef = coberturas.length;

  const grupos: Record<string, { nome: string; desc: string; emoji: string }[]> = {};
  for (const c of coberturas) {
    const meta = getCatMeta(c.nome);
    const rawDesc = c.detalhe || "";
    const cleanDesc = (rawDesc === "0" || rawDesc === "0,00" || rawDesc === "R$ 0,00" || Number(rawDesc) === 0) ? "" : rawDesc;
    const desc = getCoberturaDesc(c.nome, cleanDesc);
    if (!grupos[meta.cat]) grupos[meta.cat] = [];
    grupos[meta.cat].push({ nome: c.nome, desc, emoji: meta.emoji });
  }
  const sortedCats = Object.keys(grupos).sort(
    (a, b) => (categoryMeta[a]?.order || 99) - (categoryMeta[b]?.order || 99)
  );

  let coberturasHTML = "";
  if (coberturas.length > 0) {
    coberturasHTML = sortedCats.map(cat => {
      const items = grupos[cat];
      const meta = categoryMeta[cat] || categoryMeta.outros;
      const singleFull = (cat === "terceiro" || cat === "clube") && items.length === 1;
      const itemsHTML = items.map(item => {
        const fullCls = singleFull ? " cov-full" : "";
        return `<div class="cov-item${fullCls}">
          <div class="ico">${item.emoji}</div>
          <div class="txt">
            <div class="name">${item.nome}</div>
            ${item.desc ? `<div class="desc">${item.desc}</div>` : ""}
          </div>
        </div>`;
      }).join("\n");
      const countLabel = items.length === 1 ? "1 item" : `${items.length} itens`;
      return `<div class="cov-cat cat-${cat}">
        <div class="cov-cat-header">
          <div class="chip">${meta.chip}</div>
          <h4>${meta.label}</h4>
          <div class="count">${countLabel}</div>
        </div>
        <div class="cov-items">${itemsHTML}</div>
      </div>`;
    }).join("\n");
  } else {
    coberturasHTML = `<div class="cov-cat cat-outros">
      <div class="cov-items">
        <div class="cov-item cov-full">
          <div class="ico">📋</div>
          <div class="txt">
            <div class="name">Coberturas conforme plano selecionado</div>
            <div class="desc">Consulte seu consultor para detalhes das coberturas do plano ${dados.plano.nome}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // Opcionais HTML
  let opcionaisHTML = "";
  if (dados.opcionais && dados.opcionais.length > 0) {
    const opcItems = dados.opcionais.map(o =>
      `<div class="opc-item">
        <div class="ico">➕</div>
        <div class="txt">
          <div class="name">${o.nome}</div>
          <div class="val">${fmtBRL(o.valor_mensal)}/m&ecirc;s</div>
        </div>
      </div>`
    ).join("\n");
    opcionaisHTML = `
    <div class="opc-section">
      <div class="opc-head">
        <h3>&#10022; Servi&ccedil;os Contratados &#10022;</h3>
        <div class="opc-total">Total: ${fmtBRL(totalOpc)}/m&ecirc;s</div>
      </div>
      <div class="opc-grid">${opcItems}</div>
    </div>`;
  }

  // Preço com/sem desconto — valor original separado acima
  let priceHTML = "";
  if (mensalOriginal && mensalOriginal > mensalFinal) {
    priceHTML = `
      <div style="font-size:16px;color:#7a9ab5;text-decoration:line-through;margin-bottom:4px;font-weight:500;">${fmtBRL(mensalOriginal)}</div>
      <div class="price"><span class="currency">${price.currency}</span> ${price.integer}<span style="font-size:22px;">${price.decimals}</span></div>`;
  } else {
    priceHTML = `<div class="price"><span class="currency">${price.currency}</span> ${price.integer}<span style="font-size:22px;">${price.decimals}</span></div>`;
  }

  return `<div style="width:794px;font-family:'Inter','Helvetica','Arial',sans-serif;background:#fff;color:#1a1a1a;padding:0;position:relative;overflow:hidden;">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
    .proposta-header{background:linear-gradient(135deg,#132f52 0%,#0a1e3a 100%);padding:28px 40px 22px;display:flex;align-items:center;gap:18px;border-bottom:3px solid;border-image:linear-gradient(90deg,#5bb8f5,#2a7fc9,transparent) 1;position:relative;z-index:1}
    .mini-shield{width:52px;height:52px;background:rgba(91,184,245,0.08);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(91,184,245,0.25);flex-shrink:0}
    .mini-shield svg{width:32px;height:32px}
    .header-info h1{font-family:'Montserrat',sans-serif;font-weight:800;font-size:20px;color:#fff;letter-spacing:0.5px}
    .cotacao-meta{display:flex;gap:18px;margin-top:5px}
    .cotacao-meta span{font-size:11.5px;color:#7aaed4;font-weight:500}
    .cotacao-meta span strong{color:#5bb8f5}
    .proposta-body{padding:22px 40px 18px;position:relative;z-index:1}
    .data-section{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
    .data-card{background:#0d2b5e;border:none;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(13,43,94,0.3)}
    .data-card-header{background:linear-gradient(135deg,#1a5090,#1e5a9e);padding:9px 16px;display:flex;align-items:center;gap:8px}
    .data-card-header svg{width:16px;height:16px;fill:#fff;flex-shrink:0}
    .data-card-header h3{font-family:'Montserrat',sans-serif;font-weight:700;font-size:10.5px;color:#fff;letter-spacing:2px;text-transform:uppercase}
    .data-card-body{padding:10px 16px}
    .data-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.08)}
    .data-row:last-child{border-bottom:none}
    .data-label{font-size:9.5px;color:#8ab8d8;text-transform:uppercase;font-weight:600;letter-spacing:0.8px}
    .data-value{font-size:13px;color:#ffffff;font-weight:600;text-align:right}
    /* ============ NOVA SEÇÃO DE COBERTURAS ============ */
    .cov-wrap{margin-bottom:20px}
    .cov-hero{background:linear-gradient(135deg,#0d2b5e 0%,#14376e 50%,#1a4a8a 100%);border-radius:16px 16px 0 0;padding:18px 26px;display:flex;align-items:center;justify-content:space-between;border:1px solid rgba(91,184,245,0.25);border-bottom:none;box-shadow:0 4px 25px rgba(13,43,94,0.35)}
    .cov-hero-title{display:flex;align-items:center;gap:14px}
    .cov-hero-title .spark{width:42px;height:42px;background:linear-gradient(135deg,#5bb8f5,#2a7fc9);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 14px rgba(91,184,245,0.4)}
    .cov-hero-title h2{font-family:'Montserrat',sans-serif;font-weight:900;font-size:18px;color:#fff;letter-spacing:2px;text-transform:uppercase;margin:0}
    .cov-hero-title p{font-size:10.5px;color:#7aaed4;margin:2px 0 0;font-weight:500}
    .cov-hero-badge{background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-family:'Montserrat',sans-serif;font-weight:800;font-size:10.5px;padding:8px 16px;border-radius:20px;letter-spacing:1.5px;box-shadow:0 3px 12px rgba(16,185,129,0.4)}
    .cov-body{background:#0a1e3a;border-radius:0 0 16px 16px;border:1px solid rgba(91,184,245,0.25);border-top:none;padding:18px 18px 14px}
    .cov-cat{margin-bottom:14px}
    .cov-cat:last-child{margin-bottom:0}
    .cov-cat-header{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:10px;margin-bottom:8px}
    .cov-cat-header .chip{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;background:rgba(255,255,255,0.18)}
    .cov-cat-header h4{font-family:'Montserrat',sans-serif;font-weight:800;font-size:12px;color:#fff;letter-spacing:2.5px;text-transform:uppercase;margin:0;flex:1}
    .cov-cat-header .count{background:rgba(255,255,255,0.22);color:#fff;font-family:'Montserrat',sans-serif;font-weight:800;font-size:10px;padding:3px 9px;border-radius:12px;letter-spacing:0.5px}
    .cat-protecao .cov-cat-header{background:linear-gradient(90deg,#dc2626,#ef4444 60%,#f87171)}
    .cat-roubo .cov-cat-header{background:linear-gradient(90deg,#7c3aed,#8b5cf6 60%,#a78bfa)}
    .cat-terceiro .cov-cat-header{background:linear-gradient(90deg,#059669,#10b981 60%,#34d399)}
    .cat-vidro .cov-cat-header{background:linear-gradient(90deg,#0891b2,#06b6d4 60%,#22d3ee)}
    .cat-assist .cov-cat-header{background:linear-gradient(90deg,#d97706,#f59e0b 60%,#fbbf24)}
    .cat-extra .cov-cat-header{background:linear-gradient(90deg,#ea580c,#f97316 60%,#fb923c)}
    .cat-clube .cov-cat-header{background:linear-gradient(90deg,#2a7fc9,#5bb8f5 60%,#93d5ff)}
    .cat-outros .cov-cat-header{background:linear-gradient(90deg,#475569,#64748b 60%,#94a3b8)}
    .cov-items{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
    .cov-item{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));border-radius:9px;border:1px solid rgba(255,255,255,0.09);position:relative;overflow:hidden}
    .cov-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px}
    .cat-protecao .cov-item::before{background:#ef4444}
    .cat-roubo .cov-item::before{background:#8b5cf6}
    .cat-terceiro .cov-item::before{background:#10b981}
    .cat-vidro .cov-item::before{background:#06b6d4}
    .cat-assist .cov-item::before{background:#f59e0b}
    .cat-extra .cov-item::before{background:#f97316}
    .cat-clube .cov-item::before{background:#5bb8f5}
    .cat-outros .cov-item::before{background:#64748b}
    .cov-item .ico{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
    .cat-protecao .cov-item .ico{background:rgba(239,68,68,0.22)}
    .cat-roubo .cov-item .ico{background:rgba(139,92,246,0.22)}
    .cat-terceiro .cov-item .ico{background:rgba(16,185,129,0.22)}
    .cat-vidro .cov-item .ico{background:rgba(6,182,212,0.22)}
    .cat-assist .cov-item .ico{background:rgba(245,158,11,0.22)}
    .cat-extra .cov-item .ico{background:rgba(249,115,22,0.22)}
    .cat-clube .cov-item .ico{background:rgba(91,184,245,0.22)}
    .cat-outros .cov-item .ico{background:rgba(100,116,139,0.22)}
    .cov-item .txt{flex:1;min-width:0}
    .cov-item .name{font-size:12px;color:#fff;font-weight:700;line-height:1.25;letter-spacing:0.2px;display:flex;align-items:center;gap:5px}
    .cov-item .name::after{content:'\\2713';color:#10b981;font-weight:900;font-size:12px}
    .cov-item .desc{font-size:9.5px;color:#a0c4e0;font-weight:500;margin-top:2px;line-height:1.35}
    .cov-full{grid-column:1 / -1;padding:13px 16px}
    .cov-full .ico{width:36px;height:36px;font-size:18px}
    .cov-full .name{font-size:13px}
    .cov-full .desc{font-size:10.5px}
    /* OPCIONAIS */
    .opc-section{margin-top:16px;background:linear-gradient(135deg,#1a4a2e 0%,#1e5a36 100%);border-radius:14px;padding:16px 20px;border:1px solid rgba(46,204,113,0.25);box-shadow:0 4px 20px rgba(26,74,46,0.4)}
    .opc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    .opc-head h3{font-family:'Montserrat',sans-serif;font-weight:900;font-size:13px;color:#2ecc71;letter-spacing:2px;text-transform:uppercase;margin:0}
    .opc-total{font-family:'Montserrat',sans-serif;font-weight:800;font-size:13px;color:#fff;background:rgba(46,204,113,0.22);padding:5px 14px;border-radius:16px;border:1px solid rgba(46,204,113,0.4)}
    .opc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
    .opc-item{display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(46,204,113,0.08);border-radius:9px;border:1px solid rgba(46,204,113,0.25)}
    .opc-item .ico{width:28px;height:28px;border-radius:7px;background:rgba(46,204,113,0.25);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
    .opc-item .txt{flex:1;min-width:0}
    .opc-item .name{font-size:11.5px;color:#fff;font-weight:700;line-height:1.2}
    .opc-item .val{font-size:10px;color:#7ee3a5;font-weight:600;margin-top:1px}
    .pricing-section{background:linear-gradient(135deg,#0d2b5e 0%,#14376e 100%);border:1px solid rgba(91,184,245,0.15);border-radius:16px;padding:22px 28px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;position:relative;overflow:hidden;box-shadow:0 4px 25px rgba(13,43,94,0.35)}
    .pricing-section::before{content:'';position:absolute;top:-60%;right:-15%;width:280px;height:280px;background:radial-gradient(circle,rgba(91,184,245,0.08),transparent 70%);border-radius:50%}
    .pricing-left{position:relative;z-index:1}
    .pricing-left .consultor{font-size:9.5px;color:#5a94c4;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;margin-bottom:3px}
    .pricing-left .consultor-name{font-size:14px;color:#e0ecf5;font-weight:600;margin-bottom:12px}
    .pricing-left .fees{display:flex;flex-wrap:wrap;gap:6px}
    .fee-tag{background:rgba(91,184,245,0.08);border:1px solid rgba(91,184,245,0.18);border-radius:20px;padding:5px 12px;font-size:10px;color:#7aaed4;font-weight:500}
    .fee-tag strong{color:#5bb8f5}
    .pricing-right{text-align:center;position:relative;z-index:1;padding:15px 25px;background:rgba(91,184,245,0.04);border-radius:14px;border:1px solid rgba(91,184,245,0.12)}
    .pricing-right .label{font-family:'Montserrat',sans-serif;font-weight:700;font-size:10px;color:#5bb8f5;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:2px}
    .pricing-right .price{font-family:'Montserrat',sans-serif;font-weight:900;font-size:44px;color:#fff;line-height:1;margin-bottom:6px;text-shadow:0 0 30px rgba(91,184,245,0.2)}
    .pricing-right .price .currency{font-size:20px;vertical-align:super;margin-right:2px;font-weight:700}
    .pricing-right .discount{background:linear-gradient(135deg,#059669,#10b981);border-radius:20px;padding:6px 18px;font-size:11px;font-weight:700;color:#fff;display:inline-block;box-shadow:0 2px 10px rgba(16,185,129,0.3);margin-top:4px}
    .proposta-footer{padding:12px 40px;border-top:1px solid #e0e8f0;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1}
    .proposta-footer p{font-size:9.5px;color:#6b7b8d}
    .proposta-footer .validity{background:#0d2b5e;border:none;border-radius:20px;padding:5px 16px;font-size:10.5px;color:#fff;font-weight:600}
  </style>

  <!-- HEADER -->
  <div class="proposta-header">
    <div class="mini-shield">
      <svg viewBox="0 0 80 90" fill="none">
        <path d="M40 5 L72 20 L72 50 Q72 75 40 88 Q8 75 8 50 L8 20 Z" fill="rgba(91,184,245,0.2)" stroke="#5bb8f5" stroke-width="2.5"/>
        <rect x="28" y="35" width="24" height="16" rx="3" fill="none" stroke="#fff" stroke-width="2"/>
        <circle cx="40" cy="43" r="3" fill="#5bb8f5"/>
      </svg>
    </div>
    <div class="header-info">
      <h1>PROPOSTA DE PROTE&Ccedil;&Atilde;O VEICULAR</h1>
      <div class="cotacao-meta">
        <span>Cota&ccedil;&atilde;o n&ordm; <strong>${dados.numeroCotacao}</strong></span>
        <span>Data: <strong>${dados.data}</strong></span>
        <span>Validade: <strong>${dados.validade} dias</strong></span>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="proposta-body">
    <!-- DATA CARDS -->
    <div class="data-section">
      <div class="data-card">
        <div class="data-card-header">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          <h3>Dados do Associado</h3>
        </div>
        <div class="data-card-body">
          <div class="data-row"><span class="data-label">Nome</span><span class="data-value">${dados.cliente.nome}</span></div>
          <div class="data-row"><span class="data-label">Telefone</span><span class="data-value">${dados.cliente.telefone || "—"}</span></div>
          <div class="data-row"><span class="data-label">Email</span><span class="data-value">${dados.cliente.email || "—"}</span></div>
          <div class="data-row"><span class="data-label">Cidade</span><span class="data-value">${dados.cliente.cidade}/${dados.cliente.estado}</span></div>
        </div>
      </div>
      <div class="data-card">
        <div class="data-card-header">
          <svg viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
          <h3>Dados do Ve&iacute;culo</h3>
        </div>
        <div class="data-card-body">
          <div class="data-row"><span class="data-label">Placa</span><span class="data-value">${dados.cliente.placa}</span></div>
          <div class="data-row"><span class="data-label">FIPE</span><span class="data-value">${fmtBRL(dados.cliente.valorFipe)} [${dados.cliente.codFipe}]</span></div>
          <div class="data-row"><span class="data-label">Modelo</span><span class="data-value">${dados.cliente.veiculo}</span></div>
          <div class="data-row"><span class="data-label">Plano</span><span class="data-value" style="color:#5bb8f5;font-weight:700;">${dados.plano.nome}</span></div>
        </div>
      </div>
    </div>

    <!-- COBERTURAS -->
    <div class="cov-wrap">
      <div class="cov-hero">
        <div class="cov-hero-title">
          <div class="spark">&#128737;&#65039;</div>
          <div>
            <h2>Coberturas Contratadas</h2>
            <p>Prote&ccedil;&atilde;o conforme o plano ${dados.plano.nome}</p>
          </div>
        </div>
        <div class="cov-hero-badge">&#10003; ${totalBenef} BENEF&Iacute;CIOS</div>
      </div>
      <div class="cov-body">
        ${coberturasHTML}
      </div>
    </div>

    <!-- OPCIONAIS -->
    ${opcionaisHTML}

    <!-- PRICING -->
    <div class="pricing-section">
      <div class="pricing-left">
        <div class="consultor">Dados do Consultor</div>
        <div class="consultor-name">${dados.consultor.nome}</div>
        <div class="fees">
          <div class="fee-tag">Ades&atilde;o: <strong>${fmtBRL(dados.plano.adesao)}</strong></div>
          <div class="fee-tag">Rastreador: <strong>${dados.plano.rastreador || "N&atilde;o"}</strong></div>
          ${dados.plano.instalacao ? `<div class="fee-tag">Instala&ccedil;&atilde;o: <strong>${fmtBRL(dados.plano.instalacao)}</strong></div>` : ""}
          <div class="fee-tag">Participa&ccedil;&atilde;o: <strong>${dados.plano.participacao}</strong></div>
        </div>
      </div>
      <div class="pricing-right">
        <div class="label">Mensalidade</div>
        ${priceHTML}
        <div class="discount">15% OFF pagando em dia &rarr; ${fmtBRL(pontualidade)}/m&ecirc;s</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="proposta-footer">
    <p>Valor de entrada j&aacute; inclui vistoria, taxa de cadastro e consultas cadastrais. Proposta n&ordm; ${dados.numeroCotacao}.</p>
    <div class="validity">V&aacute;lida at&eacute; ${validadeDate}</div>
  </div>
</div>`;
}

export async function gerarPdfCotacao(dados: DadosCotacao) {
  const doc = new jsPDF("p", "mm", "a4");
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // ═══ PÁGINA 1: CAPA (arte) ═══
  const img1 = await loadImage(pagina1Img);
  if (img1) doc.addImage(img1, "JPEG", 0, 0, w, h);

  // ═══ PÁGINA 2: DEPOIMENTOS (arte) ═══
  doc.addPage();
  const img2 = await loadImage(pagina2Img);
  if (img2) doc.addImage(img2, "JPEG", 0, 0, w, h);

  // ═══ PÁGINA 3: PROPOSTA PREMIUM (HTML → Canvas → PDF) ═══
  doc.addPage();

  const htmlStr = buildPage3HTML(dados);

  // Criar container temporário offscreen
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = htmlStr;
  document.body.appendChild(container);

  try {
    // Aguardar fontes carregarem
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))]);
    }

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    // A4 = 210x297mm. Escalar para largura total, ajustar altura proporcionalmente
    const imgRatio = canvas.height / canvas.width;
    const pdfW = w;
    const pdfH = pdfW * imgRatio;

    if (pdfH <= h) {
      // Cabe numa página
      doc.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
    } else {
      // Precisa escalar para caber
      const scale = h / pdfH;
      const scaledW = pdfW * scale;
      const offsetX = (w - scaledW) / 2;
      doc.addImage(imgData, "JPEG", offsetX, 0, scaledW, h);
    }
  } finally {
    document.body.removeChild(container);
  }

  // ═══ PÁGINA 4: APP (arte) ═══
  doc.addPage();
  const img4 = await loadImage(pagina4Img);
  if (img4) doc.addImage(img4, "JPEG", 0, 0, w, h);

  doc.save(`Cotacao-${dados.numeroCotacao}.pdf`);
}
