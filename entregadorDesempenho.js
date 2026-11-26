function mostrarPeriodo(periodo) {
    const indicadores = window.GarfooCorridas?.obterIndicadores(periodo);
    if (!indicadores) return;
    document.querySelectorAll("[data-periodo]").forEach(botao => botao.classList.toggle("ativo", botao.dataset.periodo === periodo));
    const valores = {
        entregas: String(indicadores.entregas),
        aceitacao: `${indicadores.aceitacao}%`,
        conclusao: `${indicadores.conclusao}%`,
        tempo: `${indicadores.tempoMedio} min`,
        horas: `${Math.floor(indicadores.horas)}h ${Math.round(indicadores.horas % 1 * 60)}min`,
        distancia: `${indicadores.distancia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`
    };
    Object.entries(valores).forEach(([chave, valor]) => {
        const elemento = document.querySelector(`[data-metrica="${chave}"]`);
        if (elemento) elemento.textContent = valor;
    });
    document.querySelector('[data-barra="aceitacao"]')?.style.setProperty("width", `${indicadores.aceitacao}%`);
    document.querySelector('[data-barra="conclusao"]')?.style.setProperty("width", `${indicadores.conclusao}%`);
    const comparacao = document.querySelector("[data-comparacao]");
    if (comparacao) comparacao.textContent = indicadores.entregas ? "Dados das suas entregas finalizadas" : "Sem entregas neste período";
}

document.querySelectorAll("[data-periodo]").forEach(botao => botao.addEventListener("click", () => mostrarPeriodo(botao.dataset.periodo)));
window.addEventListener("storage", evento => {
    if (evento.key?.includes("garfoo-entregador-historico-entregas") || evento.key?.includes("garfoo-entregador-decisoes-corrida")) {
        mostrarPeriodo(document.querySelector("[data-periodo].ativo")?.dataset.periodo || "dia");
    }
});
window.addEventListener("garfoo:corrida-finalizada", () => mostrarPeriodo(document.querySelector("[data-periodo].ativo")?.dataset.periodo || "dia"));
window.addEventListener("garfoo:corrida-aceita", () => mostrarPeriodo(document.querySelector("[data-periodo].ativo")?.dataset.periodo || "dia"));
window.addEventListener("garfoo:corrida-recusada", () => mostrarPeriodo(document.querySelector("[data-periodo].ativo")?.dataset.periodo || "dia"));
mostrarPeriodo("dia");
