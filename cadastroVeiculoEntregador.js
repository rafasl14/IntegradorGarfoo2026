(() => {
    let sessao;
    try { sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null"); }
    catch { sessao = null; }
    if (!sessao) {
        window.location.replace("indexInicio.html");
        return;
    }
    const perfilJaCadastrado = window.GarfooContas?.perfilDeEntregador(sessao)
        || sessao.perfilEntregador
        || (String(sessao.tipo || "").toLowerCase() === "entregador" ? sessao.dados : null);
    const perfilCompleto = perfil => Boolean(perfil?.tipoVeiculo && perfil.anoVeiculo && perfil.modeloVeiculo
        && (String(perfil.tipoVeiculo).toLocaleLowerCase("pt-BR") === "bicicleta" || (perfil.placaVeiculo && perfil.numeroCnhEntregador)));
    if (perfilCompleto(perfilJaCadastrado)) {
        sessao.perfilEntregador ||= perfilJaCadastrado;
        sessao.dados = { ...(sessao.dados || {}), ...perfilJaCadastrado };
        sessao.modoAtivo = "entregador";
        localStorage.setItem("garfooUsuarioLogado", JSON.stringify(sessao));
        window.location.replace("entregadorComLogin.html");
        return;
    }

    const formulario = document.querySelector("[data-form-veiculo-entregador]");
    const seletorVeiculo = formulario.elements.namedItem("tipoVeiculo");
    const camposMoto = document.querySelector("[data-campos-moto]");
    const avisoBicicleta = document.querySelector("[data-aviso-veiculo]");
    const erro = document.querySelector("[data-erro-veiculo]");
    const dadosVeiculoAnterior = perfilJaCadastrado || sessao.perfilEntregador || {};
    Object.entries(dadosVeiculoAnterior).forEach(([nome, valor]) => {
        const campo = formulario.elements.namedItem(nome);
        if (campo && valor) campo.value = valor;
    });

    function ajustarCampos() {
        const bicicleta = seletorVeiculo.value === "bicicleta";
        camposMoto.hidden = bicicleta;
        avisoBicicleta.hidden = !bicicleta;
        camposMoto.querySelectorAll("input").forEach(campo => {
            campo.disabled = bicicleta;
            campo.required = !bicicleta;
        });
    }
    seletorVeiculo.addEventListener("change", ajustarCampos);
    ajustarCampos();

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        erro.textContent = "";
        if (!formulario.reportValidity()) return;

        const dadosVeiculo = Object.fromEntries(new FormData(formulario).entries());
        dadosVeiculo.placaVeiculo = String(dadosVeiculo.placaVeiculo || "").toUpperCase();
        sessao.perfilEntregador = { ...(sessao.perfilEntregador || {}), ...dadosVeiculo };
        sessao.dados = { ...(sessao.dados || {}), ...dadosVeiculo };
        sessao.perfis = [...new Set([...(sessao.perfis || []), "cliente", "entregador"])];
        sessao.modoAtivo = "cliente";
        window.GarfooContas?.salvarConta(sessao);
        sessao.modoAtivo = "entregador";
        localStorage.setItem("garfooUsuarioLogado", JSON.stringify(sessao));
        window.location.assign("entregadorComLogin.html");
    });
})();
