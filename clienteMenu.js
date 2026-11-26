(function configurarMenuClienteNasPaginasInternas() {
    const parametros = new URLSearchParams(window.location.search);

    if (parametros.get("menu") !== "cliente") {
        return;
    }

    const menuTradicional = document.getElementById("header");
    const menuCliente = document.querySelector("[data-menu-cliente]");

    if (menuTradicional) {
        menuTradicional.hidden = true;
    }

    if (!menuCliente) {
        return;
    }

    menuCliente.hidden = false;
    document.body.classList.add("menu-cliente-ativo");

    const linksFooterCliente = {
        inicio: "cliente.html",
        sobre: "sobrenosSemLogin.html?menu=cliente",
        restaurantes: "restaurantesCliente.html",
        pedidos: "meusPedidosCliente.html",
        carrinho: "carrinhoCliente.html"
    };

    document.querySelectorAll("[data-footer-link]").forEach(link => {
        const destino = linksFooterCliente[link.dataset.footerLink];

        if (destino) {
            link.href = destino;
        }
    });

    const usuarioSalvo = localStorage.getItem("garfooUsuarioLogado");

    if (!usuarioSalvo) {
        return;
    }

    try {
        const usuarioLogado = JSON.parse(usuarioSalvo);
        const tipos = [usuarioLogado?.modoAtivo, usuarioLogado?.tipo, usuarioLogado?.tipoUsuario, ...(Array.isArray(usuarioLogado?.perfis) ? usuarioLogado.perfis : [])]
            .map(tipo => String(tipo || "").trim().toLocaleLowerCase("pt-BR"));
        const ehCliente = tipos.some(tipo => ["cliente", "customer"].includes(tipo));
        const nome = ehCliente ? (usuarioLogado?.dados?.nomeUsuario || usuarioLogado?.dados?.nomeCompleto || usuarioLogado?.nomeUsuario) : "";
        const saudacao = menuCliente.querySelector("[data-saudacao-usuario]");

        if (saudacao) saudacao.textContent = nome ? `Olá, ${nome.trim().split(/\s+/)[0]}!` : "Olá!";
    } catch (erro) {
        console.error("Não foi possível recuperar o usuário logado:", erro);
    }
})();
