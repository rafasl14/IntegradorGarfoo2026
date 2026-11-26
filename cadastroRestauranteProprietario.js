(() => {
    let sessao;
    try { sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null"); }
    catch { sessao = null; }
    if (!sessao) {
        window.location.replace("indexInicio.html");
        return;
    }

    const formulario = document.querySelector("[data-form-restaurante-proprietario]");
    const erro = document.querySelector("[data-erro-restaurante]");
    const campoCnpj = formulario.elements.namedItem("cnpj");
    const campoTelefone = formulario.elements.namedItem("telefoneRes");
    const campoHorario = formulario.elements.namedItem("horarioRes");
    const somenteDigitos = valor => valor.replace(/\D/g, "");
    const formatarCnpj = valor => {
        const d = somenteDigitos(valor).slice(0, 14);
        if (d.length <= 2) return d;
        if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
        if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
        if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
        return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    };
    const formatarTelefone = valor => {
        const d = somenteDigitos(valor).slice(0, 11);
        if (d.length <= 2) return d ? `(${d}` : "";
        const numero = d.slice(2);
        if (d.length <= 10) return numero.length <= 4 ? `(${d.slice(0, 2)}) ${numero}` : `(${d.slice(0, 2)}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
        return numero.length <= 5 ? `(${d.slice(0, 2)}) ${numero}` : `(${d.slice(0, 2)}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
    };
    campoCnpj.addEventListener("input", () => campoCnpj.value = formatarCnpj(campoCnpj.value));
    campoTelefone.addEventListener("input", () => campoTelefone.value = formatarTelefone(campoTelefone.value));
    campoHorario.addEventListener("input", () => {
        const digitos = somenteDigitos(campoHorario.value).slice(0, 8);
        let valor = digitos.slice(0, 2);
        if (digitos.length > 2) valor += `:${digitos.slice(2, 4)}`;
        if (digitos.length > 4) valor += `-${digitos.slice(4, 6)}`;
        if (digitos.length > 6) valor += `:${digitos.slice(6, 8)}`;
        campoHorario.value = valor;
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        erro.textContent = "";
        if (!formulario.reportValidity()) return;
        if (somenteDigitos(campoCnpj.value).length !== 14) {
            erro.textContent = "Informe um CNPJ com 14 dígitos.";
            campoCnpj.focus();
            return;
        }

        const dadosRestaurante = Object.fromEntries(new FormData(formulario).entries());
        const agora = Date.now();
        const codProprie = Number(sessao.perfilProprietario?.codProprie || agora);
        const codRestaurante = sessao.perfilProprietario?.codRestaurante || `restaurante-${agora}`;
        const perfilProprietario = {
            ...dadosRestaurante,
            codProprie,
            codRestaurante,
            statusRes: "Ativo",
            avaliacaoRes: 0,
            linkLogoRes: sessao.perfilProprietario?.linkLogoRes || "./Fotos/logoFooter.png"
        };
        sessao.perfilProprietario = perfilProprietario;
        sessao.perfis = [...new Set([...(sessao.perfis || []), "proprietario"])];
        sessao.modoAtivo = window.GarfooContas?.tipoDaConta(sessao) || sessao.tipo;
        window.GarfooContas?.salvarConta(sessao);

        let indiceRestaurantes = {};
        try { indiceRestaurantes = JSON.parse(localStorage.getItem("garfoo-owner-restaurantes") || "{}"); }
        catch { indiceRestaurantes = {}; }
        const restaurantes = Array.isArray(indiceRestaurantes.restaurants) ? indiceRestaurantes.restaurants : [];
        const resumo = { id: codRestaurante, ownerId: codProprie, nomeRes: perfilProprietario.nomeRes, linkLogoRes: perfilProprietario.linkLogoRes };
        const indiceExistente = restaurantes.findIndex(item => String(item.id) === String(codRestaurante));
        if (indiceExistente >= 0) restaurantes[indiceExistente] = resumo;
        else restaurantes.push(resumo);
        localStorage.setItem("garfoo-owner-restaurantes", JSON.stringify({
            ...indiceRestaurantes,
            restaurants: restaurantes,
            activeId: codRestaurante,
            deletedIds: (indiceRestaurantes.deletedIds || []).filter(id => String(id) !== String(codRestaurante))
        }));
        localStorage.setItem(`garfoo-owner-${codRestaurante}`, JSON.stringify({
            restaurant: perfilProprietario,
            menu: [],
            addresses: [perfilProprietario.enderecoRes]
        }));

        sessao.dados = { ...(sessao.dados || {}), codProprie };
        sessao.modoAtivo = "proprietario";
        localStorage.setItem("garfooUsuarioLogado", JSON.stringify(sessao));
        window.location.assign("proprietario.html");
    });
})();
