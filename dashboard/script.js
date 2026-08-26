// ===============================
// VARIÁVEIS GLOBAIS (Em cache)
// ===============================
// Guardam os últimos dados baixados para não precisar chamar a API à toa ao redimensionar a tela
let dadosEmCache = [];
let moedasSelecionadasEmCache = [];

// ===============================
// BUSCA E ATUALIZAÇÃO DOS DADOS
// ===============================
async function buscarCotacoes() {
    const selecionadas = Array.from(
        document.getElementById("moedas").selectedOptions
    ).map(option => option.value);

    try {
        const resposta = await fetch("https://open.er-api.com/v6/latest/BRL");
        const dados = await resposta.json();

        const respostaBTC = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl"
        );
        const dadosBTC = await respostaBTC.json();

        let moedas = [{ nome: "BRL", valor: 1 }];
        const lista = ["USD", "EUR", "GBP", "JPY", "ARS"];

        lista.forEach(m => {
            if(dados.rates[m]){
                moedas.push({
                    nome: m,
                    valor: 1 / dados.rates[m]
                });
            }
        });

        moedas.push({
            nome: "BTC",
            valor: dadosBTC.bitcoin.brl
        });

        const escolhidas = moedas.filter(m => selecionadas.includes(m.nome));

        // Salva no cache para uso na redimensão de tela
        dadosEmCache = moedas;
        moedasSelecionadasEmCache = selecionadas;

        atualizarCards(escolhidas);
        atualizarResumo(escolhidas);
        atualizarLista(escolhidas);
        desenharGrafico(escolhidas);
        desenharRanking(moedas, selecionadas);

    } catch (erro) {
        console.error("Erro na API: ", erro);
    }
}

// =====================================
// INTERFACE: CARDS SUPERIORES
// =====================================
function atualizarCards(moedas) {
    document.getElementById("totalMoedas").innerHTML = moedas.length;

    if (moedas.length === 0) {
        document.getElementById("maiorMoeda").innerHTML = "-";
        document.getElementById("maiorValor").innerHTML = "-";
        return;
    }

    const maior = moedas.reduce((a, b) => a.valor > b.valor ? a : b);
    document.getElementById("maiorMoeda").innerHTML = maior.nome;
    document.getElementById("maiorValor").innerHTML = 
        "R$ " + maior.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    const agora = new Date();
    document.getElementById("horaAtual").innerHTML = 
        agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// =====================================
// INTERFACE: RESUMO
// =====================================
function atualizarResumo(moedas) {
    const div = document.getElementById("resumo");

    if (moedas.length === 0) {
        div.innerHTML = "<p>Nenhuma moeda selecionada.</p>";
        return;
    }

    const maior = moedas.reduce((a, b) => a.valor > b.valor ? a : b);
    let html = ""; // Manipulação otimizada do DOM

    moedas.forEach(m => {
        html += `
        <div class="info">
            <strong>${m.nome}</strong><br>
            <span>R$ ${m.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        </div>`;
    });

    html += `
    <div class="vencedor">
        🏆 <strong>${maior.nome}</strong><br><br>
        Vale aproximadamente <strong>R$ ${maior.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> por unidade.
    </div>`;

    div.innerHTML = html;
}

// =====================================
// INTERFACE: LISTA DAS MOEDAS
// =====================================
function atualizarLista(moedas) {
    const div = document.getElementById("cardsLista");

    if(moedas.length === 0) {
        div.innerHTML = "<p>Nenhuma moeda selecionada.</p>";
        return;
    }

    let html = ""; // Manipulação otimizada: Injetar HTML de uma vez só
    const icones = { BRL:"🇧🇷", USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", JPY:"🇯🇵", BTC:"₿", ARS:"🇦🇷" };

    moedas.forEach(m => {
        html += `
        <div class="moeda">
            <div>
                <h3>${icones[m.nome] || "💰"} ${m.nome}</h3>
                <small>Cotação Atual</small>
            </div>
            <strong>
                R$ ${m.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
        </div>`;
    });

    div.innerHTML = html;
}

// =====================================
// D3: GRÁFICO DE BARRAS
// =====================================
function desenharGrafico(dados) {
    d3.select("#graficoBarras").selectAll("*").remove();
    if (dados.length === 0) return;

    const svg = d3.select("#graficoBarras");
    const largura = 700, altura = 380;
    const margem = { top: 30, right: 30, bottom: 50, left: 70 };
    const cores = ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#ef4444"];

    const x = d3.scaleBand().domain(dados.map(d => d.nome)).range([margem.left, largura - margem.right]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(dados, d => d.valor)]).nice().range([altura - margem.bottom, margem.top]);

    svg.append("g").attr("transform", `translate(0,${altura-margem.bottom})`).call(d3.axisBottom(x)).selectAll("text").attr("fill", "#ffffff").style("font-size", "13px");
    svg.append("g").attr("transform", `translate(${margem.left},0)`).call(d3.axisLeft(y)).selectAll("text").attr("fill", "#ffffff");
    svg.append("g").attr("transform", `translate(${margem.left},0)`).call(d3.axisLeft(y).tickSize(-(largura - margem.left - margem.right)).tickFormat("")).attr("color", "#334155").attr("opacity", .4);

    svg.selectAll("rect").data(dados).enter().append("rect")
        .attr("x", d => x(d.nome)).attr("y", altura - margem.bottom).attr("width", x.bandwidth()).attr("height", 0).attr("rx", 8)
        .attr("fill", (d, i) => cores[i % cores.length])
        .transition().duration(1000)
        .attr("y", d => y(d.valor)).attr("height", d => altura - margem.bottom - y(d.valor));

    svg.selectAll(".valor").data(dados).enter().append("text").attr("class", "valor")
        .attr("x", d => x(d.nome) + x.bandwidth() / 2).attr("y", d => y(d.valor) - 10).attr("text-anchor", "middle").attr("fill", "#ffffff").style("font-size", "12px").style("font-weight", "bold")
        .text(d => "R$ " + d.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));

    svg.selectAll("rect").on("mouseover", function () { d3.select(this).transition().duration(150).attr("opacity", .75); })
        .on("mouseout", function () { d3.select(this).transition().duration(150).attr("opacity", 1); });
}

// =====================================
// D3: RANKING DAS MOEDAS
// =====================================
function desenharRanking(dados, selecionadas) {
    d3.select("#graficoHorizontal").selectAll("*").remove();
    if (dados.length === 0) return;

    dados.sort((a, b) => b.valor - a.valor);
    const svg = d3.select("#graficoHorizontal");
    const largura = 700, altura = 380;
    const margem = { top: 20, right: 60, bottom: 20, left: 120 };

    const x = d3.scaleLinear().domain([0, d3.max(dados, d => d.valor)]).range([0, largura - margem.left - margem.right]);
    const y = d3.scaleBand().domain(dados.map(d => d.nome)).range([margem.top, altura - margem.bottom]).padding(0.25);

    svg.append("g").attr("transform", `translate(${margem.left},0)`).call(d3.axisLeft(y)).selectAll("text").attr("fill", "white").style("font-size", "14px").style("font-weight", "bold");

    svg.selectAll("rect").data(dados).enter().append("rect")
        .attr("x", margem.left).attr("y", d => y(d.nome)).attr("height", y.bandwidth()).attr("rx", 10).attr("width", 0)
        .attr("fill", d => selecionadas.includes(d.nome) ? "#22c55e" : "#475569")
        .transition().duration(1000).attr("width", d => x(d.valor));

    svg.selectAll(".valorRanking").data(dados).enter().append("text").attr("class", "valorRanking")
        .attr("x", d => margem.left + x(d.valor) + 10).attr("y", d => y(d.nome) + y.bandwidth() / 2 + 5).attr("fill", "white").style("font-size", "13px")
        .text(d => "R$ " + d.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    svg.selectAll(".medalha").data(dados).enter().append("text").attr("class", "medalha")
        .attr("x", 15).attr("y", d => y(d.nome) + y.bandwidth()/2 + 5).style("font-size", "18px")
        .text((d, i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "");

    svg.selectAll(".selecionada").data(dados.filter(d => selecionadas.includes(d.nome))).enter().append("text")
        .attr("class","selecionada").attr("x", d => margem.left + x(d.valor) + 90).attr("y", d => y(d.nome) + y.bandwidth()/2 + 5).attr("fill","#22c55e").style("font-size","13px").style("font-weight","bold").text("✔");
}

// =====================================
// AUTOMAÇÕES E EVENTOS
// =====================================

// Atualiza da internet a cada 30 segundos
setInterval(buscarCotacoes, 30000);

// Animação de Entrada
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, i) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(25px)";
        setTimeout(() => {
            card.style.transition = ".6s";
            card.style.opacity = "1";
            card.style.transform = "translateY(0px)";
        }, i * 120);
    });

    const paineis = document.querySelectorAll(".painel");
    paineis.forEach((painel, i) => {
        painel.style.opacity = "0";
        painel.style.transform = "scale(.95)";
        setTimeout(() => {
            painel.style.transition = ".5s";
            painel.style.opacity = "1";
            painel.style.transform = "scale(1)";
        }, 400 + i * 150);
    });
});

// Redimensionamento Otimizado (Debounce)
let tempoEsperaResize;
window.addEventListener("resize", () => {
    clearTimeout(tempoEsperaResize);
    // Aguarda 200ms após o usuário parar de mexer na tela para redesenhar, economizando CPU.
    tempoEsperaResize = setTimeout(() => {
        if (dadosEmCache.length > 0) {
            const escolhidas = dadosEmCache.filter(m => moedasSelecionadasEmCache.includes(m.nome));
            desenharGrafico(escolhidas);
            desenharRanking(dadosEmCache, moedasSelecionadasEmCache);
        }
    }, 200); 
});

// =====================================
// INICIALIZAÇÃO
// =====================================
buscarCotacoes();