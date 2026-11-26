document.querySelectorAll("[data-filtro-corrida]").forEach(botao => botao.addEventListener("click", () => {
    const filtro = botao.dataset.filtroCorrida;
    document.querySelectorAll("[data-filtro-corrida]").forEach(item => item.classList.toggle("ativo", item === botao));
    document.querySelectorAll("[data-status-corrida]").forEach(card => {
        card.hidden = filtro !== "todas" && card.dataset.statusCorrida !== filtro;
    });
}));
try {
    const usuario = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null");
    const nome = usuario?.perfilEntregador?.nomeUsuario || usuario?.dados?.nomeUsuario || usuario?.dados?.nomeCompleto || usuario?.nomeUsuario;
    document.querySelectorAll("[data-driver-name]").forEach(item => item.textContent = String(nome || "").trim() || "Entregador");
} catch (erro) { console.warn("Não foi possível ler o perfil salvo.", erro); }
