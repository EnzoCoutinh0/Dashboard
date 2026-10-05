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
  return `R$ ${currencyFormatter.format(Number(value) || 0)}`;
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

function updateSummary(currencies) {
  const el = $('#resumo');
  if (!currencies.length) {
    el.innerHTML = '<p>Nenhuma moeda selecionada.</p>';
    return;
  }
  el.innerHTML = currencies.slice(0, 10).map(item => `
    <div class="info"><strong>${escapeHtml(item.nome)}</strong><span>${formatCurrency(item.valor)}</span></div>
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
      <div><h3>${bandeiras[item.nome] || '💱'} ${escapeHtml(item.nome)}</h3><small>${escapeHtml(moedaNome(item.nome))}</small></div>
      <strong>${formatCurrency(item.valor)}</strong>
    </div>
  `).join('');
}

function clearSvg(selector) {
  return d3.select(selector).selectAll('*').remove();
}

function drawBarChart(data) {
  const svg = d3.select('#graficoBarras');
  clearSvg('#graficoBarras');
  if (!data.length) return;

  const width = 700, height = 380;
  const margin = { top: 30, right: 30, bottom: 50, left: 75 };
  const x = d3.scaleBand().domain(data.map(d => d.nome)).range([margin.left, width - margin.right]).padding(.35);
  const maxValue = d3.max(data, d => d.valor) || 1;
  const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height - margin.bottom, margin.top]);

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)).selectAll('text').attr('fill', '#fff').style('font-size', '12px');
  svg.append('g').attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('fill', '#fff');
  svg.append('g').attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(''))
    .selectAll('line').attr('stroke', '#ffffff10');

  svg.selectAll('rect').data(data).join('rect')
    .attr('x', d => x(d.nome)).attr('y', d => y(d.valor))
    .attr('width', x.bandwidth()).attr('height', d => height - margin.bottom - y(d.valor))
    .attr('rx', 8).attr('fill', '#a855f7');

  svg.selectAll('.bar-value').data(data).join('text')
    .attr('class', 'bar-value').attr('x', d => x(d.nome) + x.bandwidth() / 2)
    .attr('y', d => y(d.valor) - 8).attr('text-anchor', 'middle')
    .attr('fill', '#ddd6fe').style('font-size', '10px')
    .text(d => formatCurrency(d.valor));
}

function drawRanking(allRates, selected) {
  const svg = d3.select('#graficoHorizontal');
  clearSvg('#graficoHorizontal');

  const selectedSet = selected instanceof Set ? selected : new Set(selected);
  const list = allRates.filter(item => selectedSet.has(item.nome))
    .sort((a, b) => b.valor - a.valor).slice(0, 20);
  if (!list.length) return;

  const width = 700, height = Math.max(300, list.length * 30);
  const margin = { top: 20, right: 90, bottom: 20, left: 90 };
  const maxValue = d3.max(list, d => d.valor) || 1;
  const x = d3.scaleLinear().domain([0, maxValue]).range([0, width - margin.left - margin.right]);
  const y = d3.scaleBand().domain(list.map(d => d.nome)).range([margin.top, height - margin.bottom]).padding(.25);

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y))
    .selectAll('text').attr('fill', 'white').style('font-size', '11px');
  svg.selectAll('rect').data(list).join('rect')
    .attr('x', margin.left).attr('y', d => y(d.nome)).attr('height', y.bandwidth())
    .attr('rx', 8).attr('width', d => x(d.valor)).attr('fill', '#8b5cf6');
  svg.selectAll('.valorRanking').data(list).join('text')
    .attr('class', 'valorRanking').attr('x', d => margin.left + x(d.valor) + 8)
    .attr('y', d => y(d.nome) + y.bandwidth() / 2 + 4).attr('fill', 'white')
    .style('font-size', '10px').text(d => formatCurrency(d.valor));
}

function drawProjection(currencies) {
  const svg = d3.select('#graficoProjecao');
  clearSvg('#graficoProjecao');
  if (!currencies.length) return;

  const months = Number($('#projectionMonths').value || 6);
  const growth = Number($('#projectionRate').value || 5) / 100;
  const width = 900, height = 360;
  const margin = { top: 25, right: 25, bottom: 45, left: 70 };
  const base = currencies.slice(0, 6);
  const points = base.flatMap(currency => Array.from({ length: months + 1 }, (_, month) => ({
    code: currency.nome,
    month,
    value: currency.valor * Math.pow(1 + growth, month / 12)
  })));

  const maxValue = d3.max(points, point => point.value) || 1;
  const x = d3.scaleLinear().domain([0, months]).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height - margin.bottom, margin.top]);
  const line = d3.line().x(d => x(d.month)).y(d => y(d.value)).curve(d3.curveMonotoneX);

  svg.attr('viewBox', `0 0 ${width} ${height}`);
  svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(Math.min(months, 12)).tickFormat(d => `M${d}`))
    .selectAll('text').attr('fill', '#aaa');
  svg.append('g').attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5)).selectAll('text').attr('fill', '#aaa');

  const colors = ['#a855f7','#c084fc','#e879f9','#8b5cf6','#f0abfc','#7c3aed'];
  base.forEach((currency, index) => {
    const series = points.filter(point => point.code === currency.nome);
    svg.append('path').datum(series).attr('fill', 'none')
      .attr('stroke', colors[index % colors.length]).attr('stroke-width', 3).attr('d', line);
    svg.append('text').attr('x', width - margin.right - 2)
      .attr('y', y(series.at(-1).value)).attr('fill', '#ddd6fe')
      .style('font-size', '10px').attr('text-anchor', 'end').text(currency.nome);
  });
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
