(() => {
    let sessao = null;
    try { sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null"); }
    catch { sessao = null; }

    const tipos = [sessao?.modoAtivo, sessao?.tipo, sessao?.tipoUsuario,
        ...(Array.isArray(sessao?.perfis) ? sessao.perfis : [])]
        .map(tipo => String(tipo || "").trim().toLocaleLowerCase("pt-BR"));
    const temPerfilEntregador = tipos.some(tipo => ["entregador", "delivery", "courier"].includes(tipo))
        || Boolean(sessao?.perfilEntregador?.tipoVeiculo);

    if (temPerfilEntregador) {
        if (sessao.modoAtivo !== "entregador") {
            sessao.modoAtivo = "entregador";
            localStorage.setItem("garfooUsuarioLogado", JSON.stringify(sessao));
        }
        return;
    }

    document.documentElement.style.visibility = "hidden";
    const temPerfilCliente = tipos.some(tipo => ["cliente", "customer"].includes(tipo));
    window.location.replace(sessao && temPerfilCliente
        ? "cadastroVeiculoEntregador.html"
        : "indexInicio.html");
})();
