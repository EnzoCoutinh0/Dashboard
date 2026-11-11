'use strict';

const state = {
  selected: new Set(['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'BTC']),
  temporarySelection: new Set(),
  catalog: [],
  rates: [],
  selectedRates: [],
  catalogLoaded: false,
  refreshPromise: null,
  lastUpdated: null,
  projectionFrame: null,
  resizeFrame: null
};

const $ = (selector) => document.querySelector(selector);
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const nomesFixos = {
  BRL:'Real brasileiro', USD:'Dólar americano', EUR:'Euro', GBP:'Libra esterlina', JPY:'Iene japonês',
  ARS:'Peso argentino', AUD:'Dólar australiano', CAD:'Dólar canadense', CHF:'Franco suíço', CNY:'Yuan chinês',
  HKD:'Dólar de Hong Kong', NZD:'Dólar neozelandês', SGD:'Dólar de Singapura', MXN:'Peso mexicano', CLP:'Peso chileno',
  COP:'Peso colombiano', PEN:'Sol peruano', UYU:'Peso uruguaio', ZAR:'Rand sul-africano', TRY:'Lira turca',
  INR:'Rupia indiana', KRW:'Won sul-coreano', RUB:'Rublo russo', PLN:'Zloti polonês', SEK:'Coroa sueca',
  NOK:'Coroa norueguesa', DKK:'Coroa dinamarquesa', CZK:'Coroa tcheca', HUF:'Forint húngaro', ILS:'Novo shekel israelense',
  AED:'Dirham dos Emirados Árabes', SAR:'Riyal saudita', THB:'Baht tailandês', IDR:'Rupia indonésia', MYR:'Ringgit malaio',
  PHP:'Peso filipino', VND:'Dong vietnamita', PKR:'Rupia paquistanesa', EGP:'Libra egípcia', NGN:'Naira nigeriana',
  KES:'Xelim queniano', MAD:'Dirham marroquino', ISK:'Coroa islandesa', BGN:'Lev búlgaro', RON:'Leu romeno',
  HRK:'Kuna croata', UAH:'Hryvnia ucraniana', TWD:'Novo dólar taiwanês'
};

const bandeiras = {
  BRL:'🇧🇷', USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', ARS:'🇦🇷', AUD:'🇦🇺', CAD:'🇨🇦', CHF:'🇨🇭', CNY:'🇨🇳',
  HKD:'🇭🇰', NZD:'🇳🇿', SGD:'🇸🇬', MXN:'🇲🇽', CLP:'🇨🇱', COP:'🇨🇴', PEN:'🇵🇪', UYU:'🇺🇾', ZAR:'🇿🇦', TRY:'🇹🇷',
  INR:'🇮🇳', KRW:'🇰🇷', RUB:'🇷🇺', PLN:'🇵🇱', SEK:'🇸🇪', NOK:'🇳🇴', DKK:'🇩🇰', CZK:'🇨🇿', HUF:'🇭🇺', ILS:'🇮🇱',
  AED:'🇦🇪', SAR:'🇸🇦', THB:'🇹🇭', IDR:'🇮🇩', MYR:'🇲🇾', PHP:'🇵🇭', VND:'🇻🇳', PKR:'🇵🇰', EGP:'🇪🇬', NGN:'🇳🇬',
  KES:'🇰🇪', MAD:'🇲🇦', ISK:'🇮🇸', BGN:'🇧🇬', RON:'🇷🇴', HRK:'🇭🇷', UAH:'🇺🇦', TWD:'🇹🇼'
};

function moedaNome(code) {
  if (nomesFixos[code]) return nomesFixos[code];
  try {
    return new Intl.DisplayNames(['pt-BR'], { type: 'currency' }).of(code) || `Moeda ${code}`;
  } catch {
    return `Moeda ${code}`;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[char]));
}

function formatCurrency(value) {
  const n = Number(value) || 0;
  if (n > 0 && n < 0.01) {
    const digits = Math.min(8, Math.max(3, 1 - Math.floor(Math.log10(n)) + 1));
    return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  }
  return `R$ ${currencyFormatter.format(n)}`;
}

async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function setLoading(isLoading) {
  const refresh = $('.refresh');
  if (!refresh) return;
  refresh.disabled = isLoading;
  refresh.classList.toggle('loading', isLoading);
}

function updatePicker() {
  const count = state.selected.size;
  $('#pickerTitle').textContent = count
    ? `${count} moeda${count === 1 ? '' : 's'} selecionada${count === 1 ? '' : 's'}`
    : 'Selecionar moedas';
  $('#pickerSubtitle').textContent = count
    ? 'Clique para alterar sua seleção'
    : 'Escolha as moedas para acompanhar';
}

function updateChips() {
  const codes = [...state.temporarySelection];
  const el = $('#selectedChips');
  el.innerHTML = codes.slice(0, 8).map(code => `
    <button type="button" class="chip" data-remove-currency="${escapeHtml(code)}">
      ${bandeiras[code] || '💱'} ${escapeHtml(code)} <span>×</span>
    </button>
  `).join('') + (codes.length > 8 ? `<span class="chip-more">+${codes.length - 8}</span>` : '');
  $('#currencyCount').textContent = `${codes.length} selecionada${codes.length === 1 ? '' : 's'}`;
}

function renderCurrencyOptions() {
  const query = ($('#currencySearch').value || '').toLowerCase().trim();
  const list = state.catalog.filter(item =>
    item.code.toLowerCase().includes(query) || item.nome.toLowerCase().includes(query)
  );
  const el = $('#currencyOptions');

  el.innerHTML = list.length
    ? list.map(item => {
        const selected = state.temporarySelection.has(item.code);
        return `<button type="button" class="currency-option ${selected ? 'selected' : ''}" data-currency-code="${escapeHtml(item.code)}">
          <span class="currency-check">${selected ? '✓' : ''}</span>
          <span class="currency-flag">${item.flag}</span>
          <span class="currency-label"><b>${escapeHtml(item.code)}</b><small>${escapeHtml(item.nome)}</small></span>
        </button>`;
      }).join('')
    : '<div class="loading-currencies">Nenhuma moeda encontrada.</div>';

  updateChips();
}

function toggleCurrency(code) {
  if (state.temporarySelection.has(code)) state.temporarySelection.delete(code);
  else state.temporarySelection.add(code);
  renderCurrencyOptions();
}

function openCurrencyPicker(open) {
  const menu = $('#currencyMenu');
  const picker = $('#currencyPicker');
  menu.hidden = !open;
  picker.setAttribute('aria-expanded', String(open));

  if (open) {
    state.temporarySelection = new Set(state.selected);
    renderCurrencyOptions();
    requestAnimationFrame(() => $('#currencySearch')?.focus());
  }
}

function setupCurrencyPicker() {
  const pickerWrap = $('.currency-picker-wrap');
  const picker = $('#currencyPicker');
  const menu = $('#currencyMenu');

  picker.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openCurrencyPicker(menu.hidden);
  });

  menu.addEventListener('click', event => {
    event.stopPropagation();

    const currencyButton = event.target.closest('[data-currency-code]');
    if (currencyButton) {
      toggleCurrency(currencyButton.dataset.currencyCode);
      return;
    }

    const removeButton = event.target.closest('[data-remove-currency]');
    if (removeButton) {
      state.temporarySelection.delete(removeButton.dataset.removeCurrency);
      renderCurrencyOptions();
    }
  });

  $('#currencySearch').addEventListener('input', renderCurrencyOptions);

  $('#selectAllCurrencies').addEventListener('click', event => {
    event.preventDefault();
    state.catalog.forEach(item => state.temporarySelection.add(item.code));
    renderCurrencyOptions();
  });

  $('#applyCurrencies').addEventListener('click', async event => {
    event.preventDefault();
    state.selected = new Set(state.temporarySelection);
    openCurrencyPicker(false);
    updatePicker();
    await refreshQuotes(true);
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.currency-picker-wrap')) openCurrencyPicker(false);
  });

  // Impede que o menu seja fechado por comportamentos padrão do navegador.
  pickerWrap.addEventListener('keydown', event => {
    if (event.key === 'Escape') openCurrencyPicker(false);
  });
}

function buildCatalog(rates) {
  const codes = new Set(Object.keys(rates || {}));
  codes.add('BRL');

  const catalog = [...codes]
    .filter(code => code !== 'BTC')
    .sort()
    .map(code => ({ code, nome: moedaNome(code), flag: bandeiras[code] || '💱' }));

  catalog.push({ code: 'BTC', nome: 'Bitcoin', flag: '₿' });
  return catalog;
}

async function loadCatalog() {
  if (state.catalogLoaded) return;

  try {
    const data = await fetchJson('https://open.er-api.com/v6/latest/BRL', {}, 8000);
    state.catalog = buildCatalog(data.rates);
    state.catalogLoaded = true;
    renderCurrencyOptions();
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    $('#currencyOptions').innerHTML = '<div class="loading-currencies error">Não foi possível carregar o catálogo.</div>';
  }
}

async function fetchBtcRate() {
  try {
    const data = await fetchJson(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl',
      { cache: 'no-store' },
      8000
    );
    const value = Number(data?.bitcoin?.brl);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch (error) {
    console.warn('Bitcoin indisponível no momento:', error);
    return null;
  }
}

async function refreshQuotes(force = false) {
  if (state.refreshPromise && !force) return state.refreshPromise;
  if (state.refreshPromise && force) return state.refreshPromise;

  const selectedCodes = [...state.selected];
  if (!selectedCodes.length) {
    state.rates = [];
    state.selectedRates = [];
    renderAll([]);
    return;
  }

  state.refreshPromise = (async () => {
    setLoading(true);
    try {
      const data = await fetchJson('https://open.er-api.com/v6/latest/BRL', { cache: 'no-store' }, 10000);
      const rates = data.rates || {};
      const currencies = [{ nome: 'BRL', valor: 1 }];

      Object.entries(rates).forEach(([code, rate]) => {
        if (code === 'BRL') return;
        const numericRate = Number(rate);
        if (Number.isFinite(numericRate) && numericRate > 0) {
          currencies.push({ nome: code, valor: 1 / numericRate });
        }
      });

      if (selectedCodes.includes('BTC')) {
        const btcValue = await fetchBtcRate();
        if (btcValue) currencies.push({ nome: 'BTC', valor: btcValue });
      }

      // Garante que nenhuma moeda apareça duas vezes, mesmo se uma API mudar o retorno.
      const uniqueCurrencies = [...new Map(currencies.map(item => [item.nome, item])).values()];
      state.rates = uniqueCurrencies;
      state.selectedRates = selectedCodes
        .map(code => uniqueCurrencies.find(item => item.nome === code))
        .filter(Boolean);
      state.lastUpdated = new Date();

      renderAll(state.selectedRates);
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
    } finally {
      state.refreshPromise = null;
      setLoading(false);
    }
  })();

  return state.refreshPromise;
}

function renderAll(currencies) {
  state.selectedRates = currencies;
  updateCards(currencies);
  updateSummary(currencies);
  updateList(currencies);
  drawBarChart(currencies);
  drawRanking(state.rates, state.selected);
  scheduleProjection();
}

function updateCards(currencies) {
  $('#totalMoedas').textContent = currencies.length;
  if (!currencies.length) {
    $('#maiorMoeda').textContent = '-';
    $('#maiorValor').textContent = 'R$ 0,00';
    $('#horaAtual').textContent = '--:--';
    return;
  }

  const highest = currencies.reduce((max, item) => item.valor > max.valor ? item : max);
  $('#maiorMoeda').textContent = highest.nome;
  $('#maiorValor').textContent = formatCurrency(highest.valor);
  $('#horaAtual').textContent = (state.lastUpdated || new Date()).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });
}

function flagFor(code) {
  return code === 'BTC' ? '₿' : (bandeiras[code] || '💱');
}

function updateSummary(currencies) {
  const el = $('#resumo');
  if (!currencies.length) {
    el.innerHTML = '<p>Nenhuma moeda selecionada.</p>';
    return;
  }
  el.innerHTML = currencies.slice(0, 10).map(item => `
    <div class="info"><strong><em>${flagFor(item.nome)}</em>${escapeHtml(item.nome)}</strong><span>${formatCurrency(item.valor)}</span></div>
  `).join('') + (currencies.length > 10
    ? `<div class="info-more">+ ${currencies.length - 10} moedas selecionadas</div>`
    : '');
}

function updateList(currencies) {
  const el = $('#cardsLista');
  if (!currencies.length) {
    el.innerHTML = '<p>Nenhuma moeda selecionada.</p>';
    return;
  }
  el.innerHTML = currencies.map(item => `
    <div class="moeda">
      <div><h3>${flagFor(item.nome)} ${escapeHtml(item.nome)}</h3><small>${escapeHtml(item.nome === 'BTC' ? 'Bitcoin' : moedaNome(item.nome))}</small></div>
      <strong>${formatCurrency(item.valor)}</strong>
    </div>
  `).join('');
}

/* ---------- Estilo compartilhado dos gráficos ---------- */
const CHART = {
  palette: ['#a78bfa', '#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#fb7185'],
  axis: '#7d7490',
  grid: 'rgba(255,255,255,.06)',
  label: '#ddd6fe',
  font: 'Inter, system-ui, sans-serif'
};

const compactFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
function formatAxis(value) {
  if (value >= 1000) return compactFormatter.format(value);
  if (value >= 1) return d3.format('~r')(+value.toPrecision(3)).replace('.', ',');
  return String(+value.toPrecision(2)).replace('.', ',');
}

// Usa escala logarítmica quando os valores são muito diferentes (ex.: BTC x JPY).
function needsLog(values) {
  const positives = values.filter(v => v > 0);
  if (positives.length < 2) return false;
  return d3.max(positives) / d3.min(positives) > 50;
}

function valueScale(values, range) {
  const max = d3.max(values) || 1;
  if (needsLog(values)) {
    const min = d3.min(values.filter(v => v > 0));
    return d3.scaleLog().domain([min / 3, max * 1.6]).range(range).clamp(true);
  }
  return d3.scaleLinear().domain([0, max]).nice().range(range);
}

function styleAxis(g, { fontSize = 12, hideDomain = true } = {}) {
  if (hideDomain) g.select('.domain').remove();
  g.selectAll('.tick line').attr('stroke', CHART.grid);
  g.selectAll('text').attr('fill', CHART.axis).style('font-size', `${fontSize}px`).style('font-family', CHART.font);
  return g;
}

let tooltipEl = null;
function tooltip() {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chart-tooltip';
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}
function showTooltip(event, title, value) {
  const el = tooltip();
  el.innerHTML = `<b>${escapeHtml(title)}</b><span>${escapeHtml(value)}</span>`;
  const x = Math.min(event.clientX + 14, window.innerWidth - el.offsetWidth - 10);
  el.style.left = `${x}px`;
  el.style.top = `${event.clientY - el.offsetHeight - 12}px`;
  el.classList.add('show');
}
function hideTooltip() {
  if (tooltipEl) tooltipEl.classList.remove('show');
}

function addGradient(svg, id, color) {
  const grad = svg.append('defs').append('linearGradient')
    .attr('id', id).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
  grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 1);
  grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', .35);
}

function chartWidth(selector, fallback) {
  const node = document.querySelector(selector);
  const w = node ? node.getBoundingClientRect().width : 0;
  return Math.max(300, Math.round(w || fallback));
}

// Afasta rótulos que ficariam um em cima do outro.
function dodgeLabels(items, minGap, top, bottom) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < minGap) sorted[i].y = sorted[i - 1].y + minGap;
  }
  const overflow = sorted.length ? sorted.at(-1).y - bottom : 0;
  if (overflow > 0) sorted.forEach(item => { item.y = Math.max(top, item.y - overflow); });
  for (let i = sorted.length - 2; i >= 0; i--) {
    if (sorted[i + 1].y - sorted[i].y < minGap) sorted[i].y = sorted[i + 1].y - minGap;
  }
  return items;
}

function clearSvg(selector) {
  return d3.select(selector).selectAll('*').remove();
}

function emptyChart(selector, message = 'Selecione ao menos uma moeda para ver o gráfico.') {
  const width = chartWidth(selector, 600), height = 220;
  const svg = d3.select(selector).attr('viewBox', `0 0 ${width} ${height}`);
  svg.append('text').attr('x', width / 2).attr('y', height / 2).attr('text-anchor', 'middle')
    .attr('fill', CHART.axis).style('font-size', '14px').style('font-family', CHART.font).text(message);
}

function drawBarChart(data) {
  const svg = d3.select('#graficoBarras');
  clearSvg('#graficoBarras');
  if (!data.length) return emptyChart('#graficoBarras');

  // Com muitas moedas os nomes se sobrepõem: mostra as 12 maiores.
  const MAX_BARS = 12;
  const totalBars = data.length;
  if (data.length > MAX_BARS) data = [...data].sort((a, b) => b.valor - a.valor).slice(0, MAX_BARS);

  const width = chartWidth('#graficoBarras', 720), height = 360;
  const margin = { top: 34, right: 8, bottom: 40, left: 52 };
  const x = d3.scaleBand().domain(data.map(d => d.nome)).range([margin.left, width - margin.right]).padding(.38);
  const values = data.map(d => d.valor);
  const y = valueScale(values, [height - margin.bottom, margin.top]);
  const isLog = needsLog(values);
  const baseline = height - margin.bottom;

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  addGradient(svg, 'barGradient', '#8b5cf6');
  addGradient(svg, 'barGradientHover', '#c4b5fd');

  const yAxis = isLog ? d3.axisLeft(y).ticks(5, formatAxis) : d3.axisLeft(y).ticks(5).tickFormat(formatAxis);
  styleAxis(svg.append('g').attr('transform', `translate(${margin.left},0)`)
    .call(yAxis.tickSize(-(width - margin.left - margin.right)).tickPadding(10)));
  svg.selectAll('.tick line').attr('stroke-dasharray', '3 4');

  styleAxis(svg.append('g').attr('transform', `translate(0,${baseline})`)
    .call(d3.axisBottom(x).tickSize(0).tickPadding(14)), { fontSize: 13 })
    .selectAll('text').attr('fill', CHART.label).style('font-weight', 600);

  const barWidth = Math.min(x.bandwidth(), 64);
  const offset = (x.bandwidth() - barWidth) / 2;

  svg.selectAll('rect.bar').data(data).join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.nome) + offset).attr('width', barWidth)
    .attr('y', d => y(d.valor)).attr('height', d => Math.max(2, baseline - y(d.valor)))
    .attr('rx', 6).attr('fill', 'url(#barGradient)').style('cursor', 'pointer')
    .on('mousemove', (event, d) => {
      d3.select(event.currentTarget).attr('fill', 'url(#barGradientHover)');
      showTooltip(event, `${flagFor(d.nome)} ${d.nome}`, formatCurrency(d.valor));
    })
    .on('mouseleave', event => {
      d3.select(event.currentTarget).attr('fill', 'url(#barGradient)');
      hideTooltip();
    });

  if (data.length <= 10 && x.step() >= 62) {
    svg.selectAll('.bar-value').data(data).join('text')
      .attr('class', 'bar-value').attr('x', d => x(d.nome) + x.bandwidth() / 2)
      .attr('y', d => y(d.valor) - 9).attr('text-anchor', 'middle')
      .attr('fill', CHART.label).style('font-size', '12px').style('font-weight', 600)
      .style('font-family', CHART.font).style('pointer-events', 'none')
      .text(d => d.valor >= 10000 ? `R$ ${compactFormatter.format(d.valor)}` : formatCurrency(d.valor));
  }

  const notes = [];
  if (totalBars > data.length) notes.push(`${data.length} maiores de ${totalBars}`);
  if (isLog) notes.push('escala logarítmica');
  if (notes.length) {
    svg.append('text').attr('x', width - margin.right).attr('y', 14).attr('text-anchor', 'end')
      .attr('fill', CHART.axis).style('font-size', '11px').style('font-family', CHART.font)
      .text(notes.join(' · ').replace(/^./, c => c.toUpperCase()));
  }
}

function drawRanking(allRates, selected) {
  const svg = d3.select('#graficoHorizontal');
  clearSvg('#graficoHorizontal');

  const selectedSet = selected instanceof Set ? selected : new Set(selected);
  const list = allRates.filter(item => selectedSet.has(item.nome))
    .sort((a, b) => b.valor - a.valor).slice(0, 20);
  if (!list.length) return emptyChart('#graficoHorizontal');

  const rowHeight = 38;
  const width = chartWidth('#graficoHorizontal', 700), height = list.length * rowHeight + 20;
  const margin = { top: 10, right: 110, bottom: 10, left: 78 };
  const values = list.map(d => d.valor);
  const isLog = needsLog(values);
  const x = isLog
    ? d3.scaleLog().domain([d3.min(values) / 3, d3.max(values)]).range([6, width - margin.left - margin.right]).clamp(true)
    : d3.scaleLinear().domain([0, d3.max(values) || 1]).range([0, width - margin.left - margin.right]);
  const y = d3.scaleBand().domain(list.map(d => d.nome)).range([margin.top, height - margin.bottom]).padding(.32);
  const track = width - margin.left - margin.right;

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  const grad = svg.append('defs').append('linearGradient').attr('id', 'rankGradient');
  grad.append('stop').attr('offset', '0%').attr('stop-color', '#6d28d9');
  grad.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa');

  svg.selectAll('rect.track').data(list).join('rect').attr('class', 'track')
    .attr('x', margin.left).attr('y', d => y(d.nome)).attr('height', y.bandwidth())
    .attr('width', track).attr('rx', y.bandwidth() / 2).attr('fill', 'rgba(255,255,255,.035)');

  svg.selectAll('rect.rank').data(list).join('rect').attr('class', 'rank')
    .attr('x', margin.left).attr('y', d => y(d.nome)).attr('height', y.bandwidth())
    .attr('rx', y.bandwidth() / 2).attr('width', d => Math.max(y.bandwidth(), x(d.valor)))
    .attr('fill', 'url(#rankGradient)').style('cursor', 'pointer')
    .on('mousemove', (event, d) => showTooltip(event, `${flagFor(d.nome)} ${d.nome}`, formatCurrency(d.valor)))
    .on('mouseleave', hideTooltip);

  svg.selectAll('.rank-pos').data(list).join('text').attr('class', 'rank-pos')
    .attr('x', 6).attr('y', d => y(d.nome) + y.bandwidth() / 2 + 4)
    .attr('fill', CHART.axis).style('font-size', '12px').style('font-family', CHART.font)
    .text((d, i) => `${i + 1}.`);

  svg.selectAll('.rank-name').data(list).join('text').attr('class', 'rank-name')
    .attr('x', 30).attr('y', d => y(d.nome) + y.bandwidth() / 2 + 5)
    .attr('fill', CHART.label).style('font-size', '13px').style('font-weight', 600).style('font-family', CHART.font)
    .text(d => d.nome);

  svg.selectAll('.valorRanking').data(list).join('text').attr('class', 'valorRanking')
    .attr('x', width - 4).attr('y', d => y(d.nome) + y.bandwidth() / 2 + 5).attr('text-anchor', 'end')
    .attr('fill', '#f5f3fa').style('font-size', '13px').style('font-weight', 600).style('font-family', CHART.font)
    .text(d => formatCurrency(d.valor));
}

function drawProjection(currencies) {
  const svg = d3.select('#graficoProjecao');
  clearSvg('#graficoProjecao');
  const legend = $('#projectionLegend');
  if (!currencies.length) { if (legend) legend.innerHTML = ''; return emptyChart('#graficoProjecao'); }

  const months = Number($('#projectionMonths').value || 6);
  const growth = Number($('#projectionRate').value || 5) / 100;
  const width = chartWidth('#graficoProjecao', 960), height = 340;
  const margin = { top: 20, right: 64, bottom: 36, left: 56 };
  const base = currencies.slice(0, 6);
  const points = base.flatMap(currency => Array.from({ length: months + 1 }, (_, month) => ({
    code: currency.nome,
    month,
    value: currency.valor * Math.pow(1 + growth, month / 12)
  })));

  const values = points.map(p => p.value);
  const isLog = needsLog(values);
  const x = d3.scaleLinear().domain([0, months]).range([margin.left, width - margin.right]);
  const y = isLog
    ? d3.scaleLog().domain([d3.min(values) / 1.6, d3.max(values) * 1.6]).range([height - margin.bottom, margin.top])
    : d3.scaleLinear().domain([0, d3.max(values) || 1]).nice().range([height - margin.bottom, margin.top]);
  const line = d3.line().x(d => x(d.month)).y(d => y(d.value)).curve(d3.curveMonotoneX);

  svg.attr('viewBox', `0 0 ${width} ${height}`);

  const yAxis = isLog ? d3.axisLeft(y).ticks(5, formatAxis) : d3.axisLeft(y).ticks(5).tickFormat(formatAxis);
  styleAxis(svg.append('g').attr('transform', `translate(${margin.left},0)`)
    .call(yAxis.tickSize(-(width - margin.left - margin.right)).tickPadding(10)));
  svg.selectAll('.tick line').attr('stroke-dasharray', '3 4');
  styleAxis(svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(Math.min(months, 12)).tickFormat(d => `M${d}`).tickSize(0).tickPadding(12)));

  const defs = svg.append('defs');
  const endLabels = [];
  base.forEach((currency, index) => {
    const color = CHART.palette[index % CHART.palette.length];
    const series = points.filter(point => point.code === currency.nome);
    const gid = `projArea${index}`;
    const g = defs.append('linearGradient').attr('id', gid).attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
    g.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', base.length === 1 ? .3 : .12);
    g.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);

    if (base.length <= 3) {
      const area = d3.area().x(d => x(d.month)).y0(height - margin.bottom).y1(d => y(d.value)).curve(d3.curveMonotoneX);
      svg.append('path').datum(series).attr('fill', `url(#${gid})`).attr('d', area);
    }
    svg.append('path').datum(series).attr('fill', 'none')
      .attr('stroke', color).attr('stroke-width', 2.5).attr('stroke-linecap', 'round').attr('d', line);

    const last = series.at(-1);
    svg.append('circle').attr('cx', x(last.month)).attr('cy', y(last.value)).attr('r', 4.5)
      .attr('fill', '#100c18').attr('stroke', color).attr('stroke-width', 2.5);
    endLabels.push({ name: currency.nome, color, y: y(last.value) });
  });

  dodgeLabels(endLabels, 16, margin.top, height - margin.bottom).forEach(label => {
    svg.append('text').attr('x', x(months) + 10).attr('y', label.y + 4)
      .attr('fill', label.color).style('font-size', '12px').style('font-weight', 700).style('font-family', CHART.font)
      .text(label.name);
  });

  // camada invisível para tooltip por mês
  const focus = svg.append('line').attr('y1', margin.top).attr('y2', height - margin.bottom)
    .attr('stroke', 'rgba(255,255,255,.18)').attr('stroke-dasharray', '3 3').style('opacity', 0);
  svg.append('rect').attr('x', margin.left).attr('y', margin.top)
    .attr('width', width - margin.left - margin.right).attr('height', height - margin.top - margin.bottom)
    .attr('fill', 'transparent')
    .on('mousemove', event => {
      const [mx] = d3.pointer(event);
      const month = Math.max(0, Math.min(months, Math.round(x.invert(mx))));
      focus.attr('x1', x(month)).attr('x2', x(month)).style('opacity', 1);
      const rows = base.map(c => {
        const p = points.find(pt => pt.code === c.nome && pt.month === month);
        return `${c.nome}: ${formatCurrency(p.value)}`;
      });
      const el = tooltip();
      el.innerHTML = `<b>Mês ${month}</b>` + rows.map(r => `<span style="display:block">${escapeHtml(r)}</span>`).join('');
      const left = Math.min(event.clientX + 14, window.innerWidth - el.offsetWidth - 10);
      el.style.left = `${left}px`;
      el.style.top = `${event.clientY - el.offsetHeight - 12}px`;
      el.classList.add('show');
    })
    .on('mouseleave', () => { focus.style('opacity', 0); hideTooltip(); });

  if (legend) {
    legend.innerHTML = base.map((c, i) =>
      `<span><i style="background:${CHART.palette[i % CHART.palette.length]}"></i>${flagFor(c.nome)} ${escapeHtml(c.nome)}</span>`
    ).join('') + (isLog ? '<span style="color:var(--text-3)">· escala logarítmica</span>' : '');
  }
}

function scheduleProjection() {
  if (state.projectionFrame) cancelAnimationFrame(state.projectionFrame);
  state.projectionFrame = requestAnimationFrame(() => {
    state.projectionFrame = null;
    drawProjection(state.selectedRates);
  });
}

function setupProjectionControls() {
  $('#projectionMonths').addEventListener('input', event => {
    $('#monthsValue').textContent = event.target.value;
    scheduleProjection();
  });

  $('#projectionRate').addEventListener('input', event => {
    $('#rateValue').textContent = `${event.target.value}% a.a.`;
    scheduleProjection();
  });
}

function setupResize() {
  window.addEventListener('resize', () => {
    if (state.resizeFrame) cancelAnimationFrame(state.resizeFrame);
    state.resizeFrame = requestAnimationFrame(() => {
      state.resizeFrame = null;
      drawBarChart(state.selectedRates);
      drawRanking(state.rates, state.selected);
      drawProjection(state.selectedRates);
    });
  });
}

function setupRefresh() {
  $('.refresh').addEventListener('click', () => refreshQuotes(true));
  setInterval(() => refreshQuotes(), 30000);
}

document.addEventListener('DOMContentLoaded', async () => {
  setupCurrencyPicker();
  setupProjectionControls();
  setupResize();
  setupRefresh();
  updatePicker();
  await loadCatalog();
  await refreshQuotes();
});
