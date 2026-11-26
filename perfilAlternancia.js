(function configurarAlternanciaDePerfis() {
    const componente = document.querySelector("[data-perfil-alternador]");
    if (!componente) return;

    let usuario;
    try { usuario = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null"); }
    catch { usuario = null; }
    if (!usuario) return;

    const destinos = {
        cliente: "cliente.html",
        entregador: "entregadorComLogin.html",
        proprietario: "proprietario.html"
    };
    const titulos = { cliente: "Cliente", entregador: "Entregador", proprietario: "Proprietário" };
    const tipoConta = window.GarfooContas?.tipoDaConta(usuario) || String(usuario.tipo || "").trim().toLocaleLowerCase("pt-BR");
    const perfis = new Set(window.GarfooContas?.perfisDaConta(usuario) || [tipoConta]);
    const modoAtual = String(usuario.modoAtivo || tipoConta).toLocaleLowerCase("pt-BR");
    const podeAdicionarPerfil = perfis.has("cliente");
    const botao = componente.querySelector("[data-abrir-perfis]");
    const menu = componente.querySelector("[data-menu-perfis]");
    if (!botao || !menu) return;

    componente.querySelector("[data-modo-perfil]")?.remove();
    botao.setAttribute("aria-label", "Trocar modo");
    botao.title = "Trocar modo";
    componente.hidden = false;

    const campoVeiculoCompleto = perfil => Boolean(perfil?.tipoVeiculo && perfil.anoVeiculo && perfil.modeloVeiculo
        && (String(perfil.tipoVeiculo).toLocaleLowerCase("pt-BR") === "bicicleta" || (perfil.placaVeiculo && perfil.numeroCnhEntregador)));
    const campoRestauranteCompleto = perfil => Boolean(perfil?.nomeRes && perfil.cnpj);
    const veiculo = window.GarfooContas?.perfilDeEntregador(usuario) || usuario.perfilEntregador || (tipoConta === "entregador" ? usuario.dados : null);
    const restaurante = window.GarfooContas?.perfilDeProprietario(usuario) || usuario.perfilProprietario || (tipoConta === "proprietario" ? usuario.dados : null);

    menu.querySelectorAll("a[data-perfil-link]").forEach(link => {
        const perfil = link.dataset.perfilLink;
        if (!destinos[perfil]) return;
        const temPerfil = perfis.has(perfil)
            || (perfil === "entregador" && campoVeiculoCompleto(veiculo))
            || (perfil === "proprietario" && campoRestauranteCompleto(restaurante));
        if (temPerfil) {
            link.hidden = false;
            link.href = destinos[perfil];
            link.textContent = `Modo ${titulos[perfil]}`;
            if (perfil === modoAtual) link.setAttribute("aria-current", "page");
            return;
        }
        if (podeAdicionarPerfil && perfil === "entregador") {
            link.hidden = false;
            link.href = "cadastroVeiculoEntregador.html";
            link.textContent = "Modo Entregador";
            return;
        }
        if (podeAdicionarPerfil && perfil === "proprietario") {
            link.hidden = false;
            link.href = "cadastroRestauranteProprietario.html";
            link.textContent = "Modo Proprietário";
            return;
        }
        link.hidden = true;
    });

    botao.addEventListener("click", evento => {
        evento.stopPropagation();
        const deveFechar = !menu.hidden;
        menu.hidden = deveFechar;
        botao.setAttribute("aria-expanded", String(!deveFechar));
    });
    document.addEventListener("click", evento => {
        if (!componente.contains(evento.target)) {
            menu.hidden = true;
            botao.setAttribute("aria-expanded", "false");
        }
    });

    menu.querySelectorAll("a[data-perfil-link]").forEach(link => {
        link.addEventListener("click", evento => {
            const destino = link.dataset.perfilLink;
            if (!destinos[destino]) return;
            if (destino === "entregador" && link.href.endsWith("cadastroVeiculoEntregador.html")) return;
            if (destino === "proprietario" && link.href.endsWith("cadastroRestauranteProprietario.html")) return;

            if (destino === "entregador") {
                const perfil = window.GarfooContas?.perfilDeEntregador(usuario) || veiculo;
                if (campoVeiculoCompleto(perfil)) {
                    const campos = ["tipoVeiculo", "anoVeiculo", "modeloVeiculo", "placaVeiculo", "numeroCnhEntregador"];
                    usuario.perfilEntregador = Object.fromEntries(campos.filter(campo => perfil[campo] != null && perfil[campo] !== "").map(campo => [campo, perfil[campo]]));
                    usuario.dados = { ...(usuario.dados || {}), ...usuario.perfilEntregador };
                }
            } else if (destino === "proprietario") {
                const perfil = window.GarfooContas?.perfilDeProprietario(usuario) || restaurante;
                if (campoRestauranteCompleto(perfil)) {
                    usuario.perfilProprietario = { ...perfil };
                    usuario.dados = { ...(usuario.dados || {}), codProprie: perfil.codProprie };
                }
            }
            usuario.perfis = [...new Set([...(usuario.perfis || []), destino])];
            usuario.modoAtivo = destino;
            localStorage.setItem("garfooUsuarioLogado", JSON.stringify(usuario));
            window.GarfooContas?.salvarConta(usuario);
        });
    });
})();
