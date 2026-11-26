(function () {
    const armazenamentoEntregador = window.GarfooEntregadorDados;
    const CHAVE_STATUS = armazenamentoEntregador.chave("garfoo-entregador-online");
    let online = localStorage.getItem(CHAVE_STATUS) !== "false";

    function nomeSalvo() {
        try {
            const configuracao = armazenamentoEntregador.ler("garfoo-entregador-config", {});
            const nome = armazenamentoEntregador.ehEntregador
                ? (armazenamentoEntregador.cadastro.nomeUsuario || armazenamentoEntregador.cadastro.nomeCompleto || armazenamentoEntregador.cadastro.nome || configuracao?.conta?.nome || "")
                : "";
            return String(nome).trim() || "Entregador";
        } catch (erro) {
            return "Entregador";
        }
    }


    function lerNumeroPedido(restaurante, fallback) {
        try {
            const pedidos = JSON.parse(localStorage.getItem("garfooPedidosCliente") || "[]");
            const restauranteBuscado = String(restaurante || "").trim().toLocaleLowerCase("pt-BR");
            const pedido = (Array.isArray(pedidos) ? [...pedidos].reverse() : []).find(item =>
                (item.itens || []).some(produto => String(produto.restaurante || "").trim().toLocaleLowerCase("pt-BR") === restauranteBuscado)
            );
            return pedido?.numero || pedido?.id || fallback;
        } catch (erro) {
            console.warn("Não foi possível localizar o número do pedido do cliente.", erro);
            return fallback;
        }
    }

    function atualizarNumerosPedido() {
        document.querySelectorAll("[data-pedido-restaurante]").forEach(elemento => {
            const restaurante = elemento.dataset.pedidoRestaurante;
            const fallback = elemento.dataset.pedidoNumeroFallback || "GF-000000";
            elemento.textContent = lerNumeroPedido(restaurante, fallback);
        });
    }
    function atualizarInterface() {
        atualizarNumerosPedido();
        document.querySelectorAll("[data-driver-name]").forEach(item => item.textContent = nomeSalvo());
        document.querySelectorAll("[data-driver-status]").forEach(item => item.textContent = online ? "Online" : "Offline");
        document.querySelectorAll("[data-toggle-online]").forEach(botao => {
            botao.textContent = online ? "Ficar offline" : "Ficar online";
            botao.classList.toggle("offline", !online);
            botao.setAttribute("aria-pressed", String(!online));
            botao.setAttribute("aria-label", online ? "Ficar offline" : "Ficar online");
        });
        document.querySelectorAll(".entregador-online i").forEach(indicador => indicador.classList.toggle("offline", !online));
    }

    document.querySelectorAll("[data-toggle-online]").forEach(botao => botao.addEventListener("click", () => {
        online = !online;
        localStorage.setItem(CHAVE_STATUS, String(online));
        atualizarInterface();
    }));

    window.addEventListener("storage", evento => {
        if (evento.key === "garfooPedidosCliente") atualizarNumerosPedido();
        if (evento.key === CHAVE_STATUS) {
            online = evento.newValue !== "false";
            atualizarInterface();
        }
    });

    window.GarfooEntregador = { atualizarInterface, estaOnline: () => online };
    atualizarInterface();
})();
