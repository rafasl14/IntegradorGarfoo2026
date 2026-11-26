(() => {
    const ler = chave => {
        try { const dado = JSON.parse(localStorage.getItem(chave) || "[]"); return Array.isArray(dado) ? dado : []; }
        catch { return []; }
    };
    const escapar = texto => String(texto ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    const armazenamento = window.GarfooEntregadorDados;
    const dados = armazenamento.cadastro;
    const config = armazenamento.ler("garfoo-entregador-config", {});
    const nomeLogado = String(armazenamento.ehEntregador ? (dados.nomeUsuario || dados.nome || config.conta?.nome || "") : "").trim();
    const emailLogado = String(armazenamento.ehEntregador ? (dados.emailUsuario || dados.email || config.conta?.email || "") : "").trim().toLocaleLowerCase("pt-BR");
    const idLogado = String(armazenamento.ehEntregador ? (dados.id || dados.idUsuario || String(dados.cpf || "").replace(/\D/g, "")) : "");
    document.querySelectorAll("[data-driver-name]").forEach(no => no.textContent = nomeLogado || "Entregador");

    function pertenceAoEntregador(pedido) {
        const entregador = pedido?.entregador || {};
        const idAtribuido = String(entregador.id || "");
        const emailAtribuido = String(entregador.email || "").trim().toLocaleLowerCase("pt-BR");
        return Boolean((idLogado && idAtribuido === idLogado) || (emailLogado && emailAtribuido === emailLogado));
    }
    function pedidoEntregue(pedido) {
        const status = String(pedido?.statusEntrega || pedido?.status || "").trim().toLocaleLowerCase("pt-BR");
        return Boolean(pedido?.entregueEm) || ["entregue", "pedido entregue"].includes(status);
    }
    function obterAvaliacoesRecebidas() {
        return ler("garfooPedidosCliente").flatMap(pedido => {
            const avaliacao = pedido.avaliacoesCliente?.entregador;
            if (!avaliacao || !Number(avaliacao.nota) || !pertenceAoEntregador(pedido)) return [];
            return [{ pedido, avaliacao }];
        }).sort((a, b) => new Date(b.avaliacao.criadaEm || 0) - new Date(a.avaliacao.criadaEm || 0));
    }
    function dispensadaParaMim(pedido) {
        const dispensada = pedido.avaliacoesEntregador?.clienteDispensadaPor;
        return Boolean(dispensada && ((idLogado && dispensada.entregadorId === idLogado) || (emailLogado && dispensada.entregadorEmail === emailLogado)));
    }
    function obterPedidosParaAvaliar() {
        return ler("garfooPedidosCliente").filter(pedido => pedidoEntregue(pedido)
            && pertenceAoEntregador(pedido)
            && !pedido.avaliacoesEntregador?.cliente
            && !dispensadaParaMim(pedido));
    }
    function renderizarPedidosParaAvaliar() {
        const lista = document.querySelector("[data-clientes-pendentes]");
        const feitos = document.querySelector("[data-lista-clientes-avaliados]");
        const secaoFeitos = document.querySelector("[data-clientes-avaliados]");
        if (!lista || !feitos || !secaoFeitos) return;

        lista.querySelectorAll(".avaliacao-cliente-card").forEach(card => card.remove());
        feitos.replaceChildren();
        const todos = ler("garfooPedidosCliente").filter(pedido => pedidoEntregue(pedido) && pertenceAoEntregador(pedido));
        const pendentes = obterPedidosParaAvaliar();
        const avaliados = todos.filter(pedido => pedido.avaliacoesEntregador?.cliente);
        const vazio = lista.querySelector(".avaliacoes-clientes-vazio");
        if (vazio) vazio.textContent = todos.length
            ? "Não há avaliações de clientes pendentes."
            : "Quando você concluir uma entrega, poderá avaliar o cliente por aqui.";
        if (vazio) vazio.hidden = pendentes.length > 0;

        pendentes.forEach(pedido => {
            const numero = pedido.numero || pedido.id || "—";
            const nomeCliente = pedido.clienteNome || pedido.nomeCliente || "Cliente";
            const pratos = [...new Set((pedido.itens || []).map(item => item.nome).filter(Boolean))].join(", ");
            const card = document.createElement("article");
            card.className = "avaliacao-cliente-card";
            card.innerHTML = `<header><strong>Pedido ${escapar(numero)} · ${escapar(nomeCliente)}</strong><small>Entrega concluída</small></header>${pratos ? `<p class="avaliacao-cliente-endereco">Itens: ${escapar(pratos)}</p>` : ""}<form data-form-avaliar-cliente data-pedido-id="${escapar(pedido.id)}"><label>Sua nota para o cliente<select name="nota" required><option value="">Escolha uma nota</option><option value="5">★★★★★ — Ótimo</option><option value="4">★★★★ — Bom</option><option value="3">★★★ — Regular</option><option value="2">★★ — Ruim</option><option value="1">★ — Muito ruim</option></select></label><label>Comentário (opcional)<textarea name="comentario" maxlength="500" placeholder="Conte como foi a experiência da entrega"></textarea></label><div class="avaliacao-cliente-acoes"><button type="submit">Salvar avaliação</button><button type="button" data-pular-avaliacao-cliente data-pedido-id="${escapar(pedido.id)}">Agora não</button></div></form>`;
            lista.append(card);
        });

        avaliados.forEach(pedido => {
            const avaliacao = pedido.avaliacoesEntregador.cliente;
            const linha = document.createElement("div");
            linha.className = "avaliacao-cliente-salva";
            linha.innerHTML = `<strong>Pedido ${escapar(pedido.numero || pedido.id)} · ${escapar(pedido.clienteNome || "Cliente")}</strong><span class="avaliacao-cliente-voto">${"★".repeat(Number(avaliacao.nota) || 0)}${"☆".repeat(5 - (Number(avaliacao.nota) || 0))} ${Number(avaliacao.nota) || 0}/5</span>`;
            feitos.append(linha);
        });
        secaoFeitos.hidden = avaliados.length === 0;
    }

    function renderizar() {
        const avaliacoes = obterAvaliacoesRecebidas();
        const notas = avaliacoes.map(item => Number(item.avaliacao.nota));
        const media = notas.length ? notas.reduce((soma, nota) => soma + nota, 0) / notas.length : 0;
        const notaEl = document.querySelector(".nota-media > strong");
        if (notaEl) notaEl.innerHTML = `${media.toFixed(1).replace(".", ",")} <em>★</em>`;
        const resumoNota = document.querySelector("[data-avaliacao-media]");
        if (resumoNota) resumoNota.innerHTML = `${media.toFixed(1).replace(".", ",")} <em>★</em>`;
        const resumoQuantidade = document.querySelector("[data-avaliacoes-total]");
        if (resumoQuantidade) resumoQuantidade.textContent = `${notas.length} ${notas.length === 1 ? "avaliação" : "avaliações"}`;
        const notaCaption = document.querySelector(".nota-media > small");
        if (notaCaption) notaCaption.textContent = `${notas.length} ${notas.length === 1 ? "avaliação recebida" : "avaliações recebidas"}`;
        const positivas = notas.filter(nota => nota >= 4).length;
        const positivasEl = document.querySelector(".positivas > strong");
        if (positivasEl) positivasEl.textContent = `${notas.length ? (positivas / notas.length * 100).toFixed(1).replace(".", ",") : "0,0"}%`;
        const distribuicao = document.querySelector(".distribuicao");
        if (distribuicao) [...distribuicao.querySelectorAll(":scope > div")].forEach((linha, indice) => {
            const valorNota = 5 - indice;
            const quantidade = notas.filter(nota => nota === valorNota).length;
            const numero = linha.querySelector("strong");
            const barra = linha.querySelector("i b");
            if (numero) numero.textContent = String(quantidade);
            if (barra) barra.style.width = `${notas.length ? quantidade / notas.length * 100 : 0}%`;
        });
        const historico = document.querySelector(".historico-avaliacoes");
        if (historico) {
            historico.querySelectorAll("article").forEach(item => item.remove());
            historico.querySelectorAll(".avaliacoes-entregador-vazio").forEach(item => item.remove());
            if (!avaliacoes.length) {
                const vazio = document.createElement("p"); vazio.className = "avaliacoes-entregador-vazio";
                vazio.textContent = "Você ainda não recebeu avaliações de clientes.";
                historico.append(vazio);
            } else avaliacoes.forEach(({ pedido, avaliacao }) => {
                const artigo = document.createElement("article"); artigo.className = "card-pagina";
                const nomeCliente = pedido.clienteNome || "Cliente";
                const numero = pedido.numero || pedido.id || "—";
                const data = avaliacao.criadaEm ? new Date(avaliacao.criadaEm).toLocaleDateString("pt-BR") : "Data não informada";
                const comentario = avaliacao.comentarioOculto ? "Comentário ocultado para moderação." : (avaliacao.comentario || "Avaliação sem comentário escrito.");
                artigo.innerHTML = `<div><strong>${escapar(nomeCliente)} · Pedido ${escapar(numero)}</strong><span>${"★".repeat(avaliacao.nota)}${"☆".repeat(5 - avaliacao.nota)} <b>${avaliacao.nota}/5</b></span></div><p>${escapar(comentario)}</p><small>Entrega finalizada · ${escapar(data)}</small>`;
                historico.append(artigo);
            });
        }
        renderizarPedidosParaAvaliar();
        window.dispatchEvent(new CustomEvent("garfoo:avaliacoes-atualizadas", { detail: { media, total: notas.length } }));
    }

    document.addEventListener("submit", evento => {
        const formulario = evento.target.closest("[data-form-avaliar-cliente]");
        if (!formulario) return;
        evento.preventDefault();
        const nota = Number(new FormData(formulario).get("nota"));
        if (!Number.isInteger(nota) || nota < 1 || nota > 5) return;
        const pedidos = ler("garfooPedidosCliente");
        const pedido = pedidos.find(item => String(item.id) === formulario.dataset.pedidoId);
        if (!pedido || !pedidoEntregue(pedido) || !pertenceAoEntregador(pedido)) return;
        const comentario = String(new FormData(formulario).get("comentario") || "").trim();
        const comentarioOculto = /\b(idiota|imbecil|burro|retardado|desgra[cç]ado|vagabundo|lixo|racista|nazista|estupro|matar)\b/i.test(comentario);
        pedido.avaliacoesEntregador ||= {};
        pedido.avaliacoesEntregador.cliente = {
            nota,
            comentario: comentarioOculto ? "" : comentario,
            comentarioOculto,
            clienteId: pedido.clienteId || "",
            clienteEmail: pedido.clienteEmail || "",
            entregadorId: idLogado,
            entregadorEmail: emailLogado,
            criadaEm: new Date().toISOString()
        };
        localStorage.setItem("garfooPedidosCliente", JSON.stringify(pedidos));
        renderizar();
    });
    document.addEventListener("click", evento => {
        const botao = evento.target.closest("[data-pular-avaliacao-cliente]");
        if (!botao) return;
        const pedidos = ler("garfooPedidosCliente");
        const pedido = pedidos.find(item => String(item.id) === botao.dataset.pedidoId);
        if (!pedido || !pertenceAoEntregador(pedido)) return;
        pedido.avaliacoesEntregador ||= {};
        pedido.avaliacoesEntregador.clienteDispensadaPor = { entregadorId: idLogado, entregadorEmail: emailLogado };
        localStorage.setItem("garfooPedidosCliente", JSON.stringify(pedidos));
        renderizar();
    });
    window.addEventListener("storage", evento => { if (evento.key === "garfooPedidosCliente") renderizar(); });
    renderizar();
})();
