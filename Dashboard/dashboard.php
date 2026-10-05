<?php
require_once 'config.php';
requireLogin();

$nome = $_SESSION['usuario_nome'];
$iniciais = strtoupper(substr($nome, 0, 1));
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Painel | Purple Finance</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://d3js.org/d3.v7.min.js"></script>
<link rel="stylesheet" href="assets/dashboard.css">
</head>
<body>
<div class="app">
    <aside class="sidebar">
        <a class="brand" href="dashboard.php"><span class="brand-mark">P</span><div><b>Purple</b><small>Finance</small></div></a>
        <nav>
            <span class="nav-label">VISÃO GERAL</span>
            <a class="nav-link active" href="dashboard.php"><span>⌂</span> Dashboard</a>
        </nav>
        <div class="sidebar-bottom">
            <div class="mini-user"><div class="avatar"><?= e($iniciais) ?></div><div><strong><?= e($nome) ?></strong><small>Conta ativa</small></div></div>
            <a class="logout" href="logout.php">↪ Sair da conta</a>
        </div>
    </aside>

    <main class="content">
        <header class="topbar">
            <div><span class="eyebrow">DASHBOARD</span><h1>Olá, <?= e(explode(' ', $nome)[0]) ?> 👋</h1><p>Acompanhe suas cotações de forma simples.</p></div>
            <div class="top-user"><div class="avatar"><?= e($iniciais) ?></div><div><strong><?= e($nome) ?></strong><small>Usuário</small></div></div>
        </header>

        <section class="toolbar currency-toolbar">
            <div class="toolbar-copy">
                <strong>Moedas monitoradas</strong>
                <span>Pesquise e selecione quantas quiser — sem usar Ctrl.</span>
            </div>
            <div class="currency-picker-wrap">
                <button type="button" class="currency-picker" id="currencyPicker" aria-expanded="false">
                    <span class="picker-icon">◎</span>
                    <span class="picker-text"><b id="pickerTitle">Selecionar moedas</b><small id="pickerSubtitle">Carregando moedas...</small></span>
                    <span class="picker-chevron">⌄</span>
                </button>
                <div class="currency-menu" id="currencyMenu" hidden>
                    <div class="currency-menu-head">
                        <div><strong>Escolha suas moedas</strong><small>Selecione uma ou várias</small></div>
                        <button type="button" id="selectAllCurrencies" class="text-btn">Selecionar todas</button>
                    </div>
                    <div class="currency-search"><span>⌕</span><input id="currencySearch" type="search" placeholder="Buscar por nome ou código..." autocomplete="off"></div>
                    <div class="selected-chips" id="selectedChips"></div>
                    <div class="currency-options" id="currencyOptions"><div class="loading-currencies">Carregando moedas...</div></div>
                    <div class="currency-menu-foot"><span id="currencyCount">0 selecionadas</span><button type="button" id="applyCurrencies" class="apply-btn">Aplicar seleção</button></div>
                </div>
                <button type="button" class="refresh">↻ Atualizar</button>
            </div>
        </section>

        <section class="cards">
            <div class="metric"><div class="metric-icon purple">◎</div><div><small>Moedas selecionadas</small><strong id="totalMoedas">0</strong></div></div>
            <div class="metric"><div class="metric-icon pink">↗</div><div><small>Maior cotação</small><strong id="maiorMoeda">-</strong></div></div>
            <div class="metric"><div class="metric-icon blue">R$</div><div><small>Valor máximo</small><strong id="maiorValor">R$ 0,00</strong></div></div>
            <div class="metric"><div class="metric-icon green">✓</div><div><small>Atualizado às</small><strong id="horaAtual">--:--</strong></div></div>
        </section>

        <section class="grid">
            <div class="panel chart-panel">
                <div class="panel-title"><div><h2>Cotação atual</h2><p>Comparativo das moedas selecionadas</p></div><span class="live"><i></i> Ao vivo</span></div>
                <svg id="graficoBarras"></svg>
            </div>
            <div class="panel">
                <div class="panel-title"><div><h2>Resumo</h2><p>Visão rápida das cotações</p></div></div>
                <div id="resumo"></div>
            </div>
        </section>

        <section class="panel projection-panel">
            <div class="panel-title projection-head"><div><h2>Projeção simulada</h2><p>Veja como o valor poderia evoluir se uma taxa média de crescimento se mantivesse.</p></div><span class="simulation-badge">SIMULAÇÃO</span></div>
            <div class="projection-controls">
                <label>Período <strong><span id="monthsValue">6</span> meses</strong><input id="projectionMonths" type="range" min="1" max="24" value="6"></label>
                <label>Taxa estimada <strong id="rateValue">5% a.a.</strong><input id="projectionRate" type="range" min="-20" max="50" step="1" value="5"></label>
            </div>
            <svg id="graficoProjecao"></svg>
            <p class="projection-note">A projeção é matemática e ilustrativa, baseada no valor atual e na taxa escolhida. Ela não representa recomendação financeira nem garante valorização futura.</p>
        </section>

        <section class="grid bottom-grid">
            <div class="panel">
                <div class="panel-title"><div><h2>Ranking das moedas</h2><p>Do maior para o menor valor</p></div></div>
                <svg id="graficoHorizontal"></svg>
            </div>
            <div class="panel">
                <div class="panel-title"><div><h2>Selecionadas</h2><p>Valores atuais</p></div></div>
                <div id="cardsLista" class="cardsLista"></div>
            </div>
        </section>
    </main>
</div>
<script src="assets/dashboard.js"></script>
</body>
</html>
