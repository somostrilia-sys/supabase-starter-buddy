/**
 * Script de importação de preços reais de mensalidade
 *
 * Fontes:
 * - Mensalidade: Relacao_Completa_Tabelas_Regionais_Planos.xlsx (sheets de preços por regional)
 * - Participação/Adesão/Rastreador: priceTable-*.xlsx (11 arquivos por regional)
 *
 * Saída: SQL INSERT para tabela_precos com campo mensalidade correto
 */

const XLSX = require('../node_modules/xlsx');
const path = require('path');
const fs = require('fs');

const DOWNLOADS = path.join('C:', 'Users', 'LENOVO', 'Downloads');

// ==================== 1. EXTRAIR MENSALIDADES DO RELACAO_COMPLETA ====================

function parseFipeRange(str) {
  // "R$ 0,00 a R$ 10.000,00" → { min: 0, max: 10000 }
  if (!str || typeof str !== 'string') return null;
  const matches = str.match(/R\$\s*([\d.,]+)/g);
  if (!matches || matches.length < 2) return null;
  const parse = s => parseFloat(s.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
  return { min: parse(matches[0]), max: parse(matches[1]) };
}

function parsePrice(str) {
  // "R$ 225" or "R$ 1.400,00" → 225 or 1400
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function extrairMensalidades() {
  const fp = path.join(DOWNLOADS, 'Relacao_Completa_Tabelas_Regionais_Planos.xlsx');
  const wb = XLSX.readFile(fp);

  const resultado = []; // { regional, tabela_id, tabela_nome, plano, fipe_min, fipe_max, mensalidade, franquia }

  // Processar cada sheet de preços
  const sheetsPrecos = wb.SheetNames.filter(s => s.startsWith('Preços'));

  for (const sheetName of sheetsPrecos) {
    const regional = sheetName.replace('Preços ', '').trim();
    const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

    let tabelaAtual = null;
    let tabelaId = null;
    let planosAtual = [];
    let headerRow = null;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

      const firstCell = String(row[0] || '').trim();

      // Detectar nome da tabela: "Utilitários leves (ID: 43654)"
      const tabelaMatch = firstCell.match(/^(.+?)\s*\(ID:\s*(\d+)\)/);
      if (tabelaMatch) {
        tabelaAtual = tabelaMatch[1].trim();
        tabelaId = tabelaMatch[2];
        headerRow = null;
        continue;
      }

      // Detectar linha "Planos: ..."
      if (firstCell.startsWith('Planos:')) {
        planosAtual = firstCell.replace('Planos:', '').split(',').map(p => p.trim()).filter(Boolean);
        continue;
      }

      // Detectar header: "Faixa FIPE", "Franquia", ...planos
      if (firstCell === 'Faixa FIPE') {
        headerRow = row.map(c => String(c || '').trim());
        continue;
      }

      // Processar linha de dados (se temos header)
      if (headerRow && firstCell.includes('R$') && firstCell.includes(' a ')) {
        const fipe = parseFipeRange(firstCell);
        if (!fipe) continue;

        const franquia = parsePrice(String(row[1] || ''));

        // Colunas de planos começam no índice 2
        for (let col = 2; col < headerRow.length; col++) {
          const planoNome = headerRow[col];
          if (!planoNome) continue;

          const mensalidade = parsePrice(String(row[col] || ''));
          if (mensalidade === null || mensalidade === 0) continue;

          resultado.push({
            regional,
            tabela_id: tabelaId,
            tabela_nome: tabelaAtual,
            plano: planoNome,
            fipe_min: fipe.min,
            fipe_max: fipe.max,
            mensalidade,
            franquia,
          });
        }
      }
    }

    console.log(`[${regional}] ${resultado.filter(r => r.regional === regional).length} registros de mensalidade`);
  }

  return resultado;
}

// ==================== 2. EXTRAIR PARTICIPAÇÃO/ADESÃO DOS PRICETABLE ====================

const REGIONAL_MAP = {
  'priceTable-156854.xlsx': 'Norte/Minas/Sul',
  'priceTable-156891.xlsx': 'Espírito Santo',
  'priceTable-156892.xlsx': 'RIO GRANDE DO SUL',
  'priceTable-156893.xlsx': 'Alagoas',
  'priceTable-156894.xlsx': 'Interior São Paulo',
  'priceTable-156895.xlsx': 'CEARÁ',
  'priceTable-156896.xlsx': 'Natal',
  'priceTable-156897.xlsx': 'MINAS (INTERIOR)',
  'priceTable-156898.xlsx': 'Paraná',
  'priceTable-156899 (1).xlsx': 'Bahia',
  'priceTable-156900.xlsx': 'PALMAS',
};

function extrairParticipacao() {
  const resultado = []; // { regional, fipe_min, fipe_max, planos[], adesao, rastreador, instalacao, tipo_franquia, valor_franquia }

  for (const [arquivo, regional] of Object.entries(REGIONAL_MAP)) {
    const fp = path.join(DOWNLOADS, arquivo);
    if (!fs.existsSync(fp)) {
      console.warn(`[AVISO] Arquivo não encontrado: ${arquivo}`);
      continue;
    }

    const wb = XLSX.readFile(fp);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 10) continue;

      const parseBR = s => parseFloat(String(s || '0').replace(/\./g, '').replace(',', '.'));

      const fipe_min = parseBR(row[0]);
      const fipe_max = parseBR(row[1]);
      // row[2] = COTA (desconsiderar)
      // row[3] = TAXA_ADMINISTRATIVA (desconsiderar na pipeline)
      const adesao = parseBR(row[4]);
      const rastreador = String(row[5] || 'Não').trim();
      const instalacao = parseBR(row[6]);
      const tipo_franquia = String(row[7] || '%').trim();
      const valor_franquia = parseBR(row[8]);
      const planos = String(row[9] || '').split(',').map(p => p.trim()).filter(Boolean);

      resultado.push({
        regional,
        fipe_min,
        fipe_max,
        planos,
        adesao,
        rastreador,
        instalacao,
        tipo_franquia,
        valor_franquia,
      });
    }

    console.log(`[${regional}] ${resultado.filter(r => r.regional === regional).length} registros de participação`);
  }

  return resultado;
}

// ==================== 3. NORMALIZAR NOMES DE REGIONAIS ====================

function normalizeRegional(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/regional\s*/gi, '')
    .replace(/[-\/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePlano(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ==================== 4. CRUZAR E GERAR SQL ====================

function gerarSQL(mensalidades, participacoes) {
  const linhas = [];
  let matched = 0;
  let unmatched = 0;

  for (const m of mensalidades) {
    // Encontrar participação correspondente: mesma regional + faixa FIPE + plano
    const normRegM = normalizeRegional(m.regional);

    let part = null;
    for (const p of participacoes) {
      const normRegP = normalizeRegional(p.regional);
      // Match exato ou contém, mas evitar "sao paulo" matchar "interior sao paulo"
      const exactMatch = normRegM === normRegP;
      const containsMatch = (normRegM.includes(normRegP) || normRegP.includes(normRegM))
        && Math.abs(normRegM.length - normRegP.length) <= 5;
      if (!exactMatch && !containsMatch) continue;

      // Mesma faixa FIPE (com tolerância)
      if (Math.abs(p.fipe_min - m.fipe_min) > 1 || Math.abs(p.fipe_max - m.fipe_max) > 1) continue;

      // Plano presente
      const normPlanoM = normalizePlano(m.plano);
      const planoMatch = p.planos.some(pp => {
        const normPP = normalizePlano(pp);
        return normPP.includes(normPlanoM) || normPlanoM.includes(normPP);
      });

      if (planoMatch) {
        part = p;
        break;
      }
    }

    // Determinar tipo_veiculo pelo nome do plano
    let tipo_veiculo = 'Carros e Utilitários Pequenos';
    const planoLower = m.plano.toLowerCase();
    if (planoLower.includes('moto')) tipo_veiculo = 'Motos';
    else if (planoLower.includes('pesado') || planoLower.includes('van')) tipo_veiculo = 'Pesados e Vans';
    else if (planoLower.includes('agregado')) tipo_veiculo = 'Pesados e Vans';

    const adesao = part ? part.adesao : 400;
    const rastreador = part ? part.rastreador : 'Não';
    const instalacao = part ? part.instalacao : 0;
    let tipo_franquia = part ? part.tipo_franquia : '%';
    let valor_franquia = part ? part.valor_franquia : 0;

    // Plano básico NÃO tem cota de participação
    if (planoLower.includes('basico') || planoLower.includes('básico')) {
      tipo_franquia = '%';
      valor_franquia = 0;
    }

    if (part) matched++;
    else unmatched++;

    const esc = s => String(s).replace(/'/g, "''");

    linhas.push(
      `('${esc(m.tabela_id || '')}', '${esc(m.plano)}', '${esc(m.regional)}', ` +
      `${m.fipe_min}, ${m.fipe_max}, ${m.mensalidade}, ` +
      `0, ${adesao}, '${esc(rastreador)}', ${instalacao}, ` +
      `'${esc(tipo_franquia)}', ${valor_franquia}, '${esc(tipo_veiculo)}', ` +
      `'${esc(normalizePlano(m.plano))}', '${esc(normalizeRegional(m.regional))}')`
    );
  }

  // Dedup: 1 registro por regional+plano+faixa (manter primeiro encontrado)
  const seen = new Set();
  const linhasDedup = [];
  const linhasRaw = [];
  for (let i = 0; i < linhas.length; i++) {
    const m = mensalidades[i];
    const key = `${normalizeRegional(m.regional)}|${normalizePlano(m.plano)}|${m.fipe_min}-${m.fipe_max}`;
    if (!seen.has(key)) {
      seen.add(key);
      linhasDedup.push(linhas[i]);
    }
  }
  const removidas = linhas.length - linhasDedup.length;
  linhas.length = 0;
  linhas.push(...linhasDedup);

  console.log(`\n[RESULTADO] ${matched} com participação encontrada, ${unmatched} sem (usaram defaults)`);
  console.log(`[DEDUP] ${removidas} duplicatas removidas`);
  console.log(`[TOTAL] ${linhas.length} registros para inserir`);

  const sql = `-- Migration: Reimportação de tabela_precos com mensalidades reais
-- Gerado automaticamente por scripts/importar-precos.js em ${new Date().toISOString()}
-- Fonte: Relacao_Completa_Tabelas_Regionais_Planos.xlsx + priceTable-*.xlsx

-- 1. Adicionar campo mensalidade se não existir
ALTER TABLE tabela_precos ADD COLUMN IF NOT EXISTS mensalidade DECIMAL(10,2) DEFAULT 0;

-- 2. Limpar dados antigos
DELETE FROM tabela_precos;

-- 3. Inserir dados corretos
INSERT INTO tabela_precos (
  tabela_id, plano, regional,
  valor_menor, valor_maior, mensalidade,
  taxa_administrativa, adesao, rastreador, instalacao,
  tipo_franquia, valor_franquia, tipo_veiculo,
  plano_normalizado, regional_normalizado
) VALUES
${linhas.join(',\n')};

-- 4. Copiar mensalidade para campo cota (compatibilidade com frontend existente)
UPDATE tabela_precos SET cota = mensalidade WHERE mensalidade > 0;

-- 5. Limpar cache de cotações existentes
UPDATE negociacoes SET cache_precos = NULL, cache_fipe = NULL
WHERE stage NOT IN ('concluido', 'perdido');
`;

  return sql;
}

// ==================== MAIN ====================

console.log('=== Importação de Preços Reais ===\n');

console.log('--- Extraindo mensalidades do Relacao_Completa ---');
const mensalidades = extrairMensalidades();
console.log(`\nTotal mensalidades: ${mensalidades.length}\n`);

console.log('--- Extraindo participação/adesão dos priceTable ---');
const participacoes = extrairParticipacao();
console.log(`\nTotal participações: ${participacoes.length}\n`);

console.log('--- Gerando SQL ---');
const sql = gerarSQL(mensalidades, participacoes);

const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260408000001_tabela_precos_reimport.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`\nSQL salvo em: ${outputPath}`);
console.log(`Tamanho: ${(sql.length / 1024).toFixed(1)} KB`);
