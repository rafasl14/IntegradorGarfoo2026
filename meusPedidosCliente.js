(() => {
    const listaPedidos = document.querySelector("[data-lista-pedidos]");
    const pedidosDoClienteAtual = () => window.GarfooClienteStore.listarPedidos();
    const chaveCliente = base => window.GarfooClienteStore.chave(base);
    try {
        const usuario = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "{}");
        const nome = usuario.dados?.nomeUsuario || usuario.nomeUsuario;
        if (nome) document.querySelector("[data-saudacao-usuario]").textContent = `Olá, ${nome.trim().split(/\s+/)[0]}!`;
    } catch (erro) {
        console.error("Não foi possível carregar o nome do usuário:", erro);
    }
    const escaparHtml = valor => String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[caractere]));
    const moeda = valor => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    function lerPedidos() {
        try {
            const pedidos = JSON.parse(localStorage.getItem("garfooPedidosCliente") || "[]");
            return Array.isArray(pedidos) ? pedidos : [];
        } catch (erro) {
            console.error("Não foi possível carregar os pedidos:", erro);
            return [];
        }
    }

    function podeCancelarPedido(pedido) {
        const statusEntrega = pedido.statusEntrega || (pedido.status === "Confirmado" ? "Aguardando confirmação do restaurante" : "");
        return statusEntrega === "Aguardando confirmação do restaurante"
            && !["Entregue", "Pedido entregue", "Cancelado", "Pedido cancelado"].includes(pedido.status);
    }

    function renderizar() {
        const pedidos = pedidosDoClienteAtual();
        if (!pedidos.length) {
            listaPedidos.innerHTML = '<p class="meus-pedidos-vazio">Você ainda não fez pedidos.</p>';
            return;
        }
        listaPedidos.innerHTML = [...pedidos].reverse().map(pedido => {
            const data = new Date(pedido.dataHora);
            const dataFormatada = Number.isNaN(data.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
            const janela = pedido.previsaoEntregaMinutos || { minimo: 30, maximo: 45 };
            const baseEntrega = Number.isNaN(data.getTime()) ? new Date() : data;
            const horaEntrega = minutos => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(baseEntrega.getTime() + minutos * 60000));
            const horarioEstimado = `${horaEntrega(janela.minimo)}–${horaEntrega(janela.maximo)}`;
            const itens = (pedido.itens || []).map(item => {
                const quantidade = Math.max(1, Number(item.quantidade) || 1);
                return `<li><span>${escaparHtml(item.nome)} × ${quantidade}</span><strong>${moeda((Number(item.preco) || 0) * quantidade)}</strong></li>`;
            }).join("");
            const endereco = pedido.endereco || {};
            const resumoEndereco = `${endereco.rua || ""}, ${endereco.numero || ""} · ${endereco.cidade || ""}${endereco.uf ? ` - ${endereco.uf}` : ""}`;
            const pagamento = pedido.cartao ? `${escaparHtml(pedido.cartao.apelido || pedido.cartao.tipo)} ···· ${escaparHtml(pedido.cartao.finais)}` : "Cartão cadastrado";
            const statusEntrega = pedido.statusEntrega || "Aguardando confirmação do restaurante";
            const entregue = statusEntrega === "Pedido entregue" || pedido.status === "Entregue";
            const cancelado = statusEntrega === "Pedido cancelado" || pedido.status === "Cancelado";
            const statusCabecalho = entregue ? "Entregue" : cancelado ? "Cancelado" : "Confirmado";
            const statusAtualizado = pedido.statusAtualizadoEm && !Number.isNaN(new Date(pedido.statusAtualizadoEm).getTime())
                ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(pedido.statusAtualizadoEm))
                : "";
            const podeCancelar = !entregue && !cancelado && podeCancelarPedido(pedido);
            return `<article class="cliente-pedido-card">
                <header class="cliente-pedido-cabecalho"><div><strong>Pedido ${escaparHtml(pedido.numero || pedido.id)}</strong><time datetime="${escaparHtml(pedido.dataHora)}">${escaparHtml(dataFormatada)}</time></div><span class="${cancelado ? "cliente-pedido-status-cancelado" : ""}">${statusCabecalho}</span></header>
                <p class="cliente-pedido-status"><span>${escaparHtml(statusEntrega === "Em preparo" ? "Preparando pedido" : statusEntrega)}</span>${statusAtualizado ? `<small>Atualizado às ${escaparHtml(statusAtualizado)}</small>` : ""}</p>
                <ul>${itens}</ul>
                <div class="cliente-pedido-detalhes"><span class="cliente-pedido-horario">Entrega estimada: ${horarioEstimado}</span><span>Subtotal: ${moeda(pedido.subtotal)}</span><span>Entrega: ${pedido.taxaEntrega == null ? "A confirmar" : moeda(pedido.taxaEntrega)}</span><span>Pagamento: ${pagamento}</span><span>Endereço: ${escaparHtml(resumoEndereco)}</span></div>
                <strong class="cliente-pedido-total">Total: ${moeda(pedido.total)}</strong>
                ${podeCancelar ? `<button class="cliente-pedido-cancelar" type="button" data-cancelar-pedido="${escaparHtml(pedido.id)}">Cancelar pedido</button>` : ""}
                <button class="cliente-pedido-repetir" type="button" data-pedir-novamente="${escaparHtml(pedido.id)}">Pedir de novo</button>
            </article>`;
        }).join("");
    }

    listaPedidos.addEventListener("click", evento => {
        const cancelar = evento.target.closest("[data-cancelar-pedido]");
        if (cancelar) {
            const pedidos = lerPedidos();
            const pedido = pedidos.find(item => String(item.id) === cancelar.dataset.cancelarPedido);
            if (!pedido || !podeCancelarPedido(pedido)) return;
            pedido.status = "Cancelado";
            pedido.statusEntrega = "Pedido cancelado";
            pedido.statusAtualizadoEm = new Date().toISOString();
            localStorage.setItem("garfooPedidosCliente", JSON.stringify(pedidos));
            renderizar();
            return;
        }
        const botao = evento.target.closest("[data-pedir-novamente]");
        if (!botao) return;
        let carrinho = [];
        try {
            const salvo = JSON.parse(localStorage.getItem(chaveCliente("garfooCarrinho")) || "[]");
            carrinho = Array.isArray(salvo) ? salvo : [];
        } catch { carrinho = []; }
        const pedido = pedidosDoClienteAtual().find(item => String(item.id) === botao.dataset.pedirNovamente);
        if (!pedido) return;
        (pedido.itens || []).forEach(item => {
            const quantidade = Math.max(1, Number(item.quantidade) || 1);
            const existente = carrinho.find(produto => String(produto.id) === String(item.id));
            if (existente) existente.quantidade = Math.max(1, Number(existente.quantidade) || 1) + quantidade;
            else carrinho.push({
                id: item.id,
                nome: item.nome,
                restaurante: item.restaurante,
                imagem: item.imagem || "",
                logo: item.logo || "",
                preco: Number(item.preco) || 0,
                entrega: item.entrega || "",
                observacao: item.observacao || "",
                quantidade
            });
        });
        localStorage.setItem(chaveCliente("garfooCarrinho"), JSON.stringify(carrinho));
        window.location.href = "carrinhoCliente.html";
    });

    window.addEventListener("storage", evento => {
        if (evento.key === "garfooPedidosCliente") renderizar();
    });

    renderizar();
})();
