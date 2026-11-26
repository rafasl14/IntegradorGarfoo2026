(() => {
    const chaveCarrinho = window.GarfooClienteStore.chave("garfooCarrinho");
    const modal = document.createElement("section");
    modal.className = "detalhe-modal";
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
        <button class="detalhe-modal-fundo" type="button" data-fechar-detalhe aria-label="Fechar detalhes do produto"></button>
        <div class="detalhe-modal-caixa" role="dialog" aria-modal="true" aria-labelledby="detalhe-modal-titulo">
            <button class="detalhe-modal-fechar" type="button" data-fechar-detalhe aria-label="Fechar">×</button>
            <div class="detalhe-modal-foto-coluna">
                <img class="detalhe-modal-imagem" data-detalhe-imagem alt="">
            </div>
            <div class="detalhe-modal-conteudo">
              <div class="detalhe-modal-scroll">
                <h2 class="detalhe-modal-titulo" id="detalhe-modal-titulo" data-detalhe-nome></h2>
                <p class="detalhe-modal-descricao" data-detalhe-descricao></p>
                <p class="detalhe-modal-porcoes" data-detalhe-porcoes hidden></p>
                <p class="detalhe-modal-preco" data-detalhe-preco></p>
                <div class="detalhe-modal-entrega" data-detalhe-entrega hidden>
                    <div class="detalhe-modal-entrega-restaurante"><strong data-entrega-restaurante></strong></div>
                    <div class="detalhe-modal-entrega-dados"><span data-entrega-prazo></span><span class="detalhe-modal-entrega-separador">•</span><span data-entrega-frete></span></div>
                </div>
                <p class="detalhe-modal-aviso-carrinho" data-aviso-carrinho role="status" aria-live="polite" hidden></p>
                <label class="detalhe-modal-observacao-label" for="detalhe-modal-observacao">Algum comentário?</label>
                <textarea class="detalhe-modal-observacao" id="detalhe-modal-observacao" data-detalhe-observacao maxlength="140" placeholder="Ex.: sem cebola, molho à parte..."></textarea>
                <div class="detalhe-modal-contagem"><span data-contagem-observacao>0</span> / 140</div>
              </div>
            <footer class="detalhe-modal-rodape">
                <div class="detalhe-modal-quantidade" aria-label="Quantidade">
                    <button type="button" data-quantidade="-1" aria-label="Diminuir quantidade">−</button>
                    <output data-quantidade-atual>1</output>
                    <button type="button" data-quantidade="1" aria-label="Aumentar quantidade">+</button>
                </div>
                <button class="detalhe-modal-adicionar" type="button" data-adicionar-detalhe><span>Adicionar</span><strong class="detalhe-modal-total" data-detalhe-total></strong></button>
            </footer>
            </div>
        </div>`;
    document.body.append(modal);

    const imagemEl = modal.querySelector("[data-detalhe-imagem]");
    const nomeEl = modal.querySelector("[data-detalhe-nome]");
    const descricaoEl = modal.querySelector("[data-detalhe-descricao]");
    const precoEl = modal.querySelector("[data-detalhe-preco]");
    const entregaEl = modal.querySelector("[data-detalhe-entrega]");
    const porcoesEl = modal.querySelector("[data-detalhe-porcoes]");
    const entregaRestauranteEl = modal.querySelector("[data-entrega-restaurante]");
    const entregaPrazoEl = modal.querySelector("[data-entrega-prazo]");
    const entregaFreteEl = modal.querySelector("[data-entrega-frete]");
    const avisoCarrinhoEl = modal.querySelector("[data-aviso-carrinho]");
    const quantidadeEl = modal.querySelector("[data-quantidade-atual]");
    const observacaoEl = modal.querySelector("[data-detalhe-observacao]");
    const contagemEl = modal.querySelector("[data-contagem-observacao]");
    const totalEl = modal.querySelector("[data-detalhe-total]");
    let produtoAtual = null;
    let quantidade = 1;
    let ultimoAlvo = null;
    const catalogoPromise = fetch("cardapios_restaurantes.json?v=20261114-7")
        .then(resposta => resposta.ok ? resposta.json() : null)
        .catch(() => null);

    function normalizar(texto) {
        return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
    }

    async function categoriaDoItem(item) {
        if (item.categoria) return item.categoria;
        const dados = await catalogoPromise;
        const restaurante = (dados?.restaurantes || []).find(registro => normalizar(registro.nomeRes) === normalizar(item.restaurante));
        const registro = (restaurante?.cardapio || []).find(entry => normalizar(entry.produto?.nomeProd) === normalizar(item.nome));
        return registro?.produto?.categoria?.nomeCategoria || "";
    }

    async function obterPratosNoCarrinho() {
        const produtosAlimentares = [];
        for (const item of lerCarrinho()) {
            const categoria = normalizar(await categoriaDoItem(item));
            if (categoria && categoria !== "bebidas") produtosAlimentares.push(item);
        }
        return produtosAlimentares;
    }

    async function obterBebidasNoCarrinho() {
        const bebidas = [];
        for (const item of lerCarrinho()) {
            if (normalizar(await categoriaDoItem(item)) === "bebidas") bebidas.push(item);
        }
        return bebidas;
    }

    function nomesDosRestaurantes(pratos) {
        return [...new Set(pratos.map(item => item.restaurante).filter(Boolean))];
    }

    async function mostrarRestaurantesDosPratos(produto) {
        if (normalizar(produto.categoria) !== "bebidas") return;
        const produtosAlimentares = await obterPratosNoCarrinho();
        if (produtoAtual !== produto || !produtosAlimentares.length) return;
        const nomes = nomesDosRestaurantes(produtosAlimentares);
        const restaurantesTexto = nomes.length > 1
            ? `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`
            : nomes[0];
        const referenciaRestaurantes = nomes.length > 1 ? `dos restaurantes ${restaurantesTexto}` : `do restaurante ${restaurantesTexto}`;
        avisoCarrinhoEl.textContent = `Há ${produtosAlimentares.length} ${produtosAlimentares.length === 1 ? "produto" : "produtos"} no carrinho, ${referenciaRestaurantes}. Você pode escolher bebidas ${nomes.length > 1 ? "desses restaurantes" : "desse restaurante"}.`;
        avisoCarrinhoEl.hidden = false;
    }

    async function buscarDescricao(nomeRestaurante, nomeProduto) {
        const dados = await catalogoPromise;
        const restaurantes = dados?.restaurantes || [];
        const restaurante = restaurantes.find(item => normalizar(item.nomeRes) === normalizar(nomeRestaurante));
        const itemEncontrado = (restaurante?.cardapio || []).find(item => normalizar(item.produto?.nomeProd) === normalizar(nomeProduto));
        if (itemEncontrado?.produto?.descricaoProd) return itemEncontrado.produto.descricaoProd;
        const itemEmOutroRestaurante = restaurantes.flatMap(item => item.cardapio || [])
            .find(item => normalizar(item.produto?.nomeProd) === normalizar(nomeProduto));
        return itemEmOutroRestaurante?.produto?.descricaoProd || "Descrição não cadastrada.";
    }

    function lerCarrinho() {
        try {
            const salvo = JSON.parse(localStorage.getItem(chaveCarrinho) || "[]");
            return Array.isArray(salvo) ? salvo : [];
        } catch (erro) {
            console.error("Não foi possível ler o carrinho:", erro);
            return [];
        }
    }

    function lerPreco(texto) {
        const valor = String(texto || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
        return Number(valor) || 0;
    }

    function moeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function atualizarTotal() {
        quantidadeEl.value = String(quantidade);
        quantidadeEl.textContent = String(quantidade);
        totalEl.textContent = moeda(produtoAtual.preco * quantidade);
    }

    function atualizarPorcoes(texto) {
        const match = String(texto || "").match(/(?:serve|para)\s+(\d+|uma|um|duas|dois|tres|três|quatro)\s+pessoas?/i);
        const equivalencias = { uma: "1", um: "1", duas: "2", dois: "2", tres: "3", "três": "3", quatro: "4" };
        const quantidadePessoas = match ? (equivalencias[match[1].toLocaleLowerCase("pt-BR")] || match[1]) : "";
        porcoesEl.textContent = quantidadePessoas ? `♟ Serve ${quantidadePessoas} ${quantidadePessoas === "1" ? "pessoa" : "pessoas"}` : "";
        porcoesEl.hidden = !quantidadePessoas;
    }

    function abrir(card) {
        const nome = card.querySelector(".produto-detalhes strong, .prato-principal-texto h2, .categoria-produto-texto h2")?.textContent.trim();
        if (!nome) return;
        const img = card.querySelector(":scope > img");
        const logo = card.querySelector(".produto-restaurante-logo, .prato-principal-logo, .categoria-produto-logo");
        const precoTexto = card.querySelector(".produto-detalhes span, .prato-principal-rodape > span:first-child, .categoria-produto-rodape > span:first-child")?.textContent;
        const nomeRestaurante = logo?.alt?.replace(/^Logo de\s*/i, "") || card.dataset.restaurante || card.querySelector(".categoria-produto-texto p")?.textContent.trim() || "Restaurante";
        const descricao = card.querySelector(".prato-principal-descricao, .categoria-produto-descricao")?.textContent.trim() || "";
        const entrega = card.querySelector(".prato-principal-tempo, .categoria-produto-tempo, small")?.textContent.trim() || "";
        const categoria = card.dataset.categoriaProduto || document.body.dataset.categoriaProduto || (card.matches(".prato-principal-card") ? "Pratos Principais" : "");

        produtoAtual = {
            id: card.dataset.produtoId || card.dataset.favoritoId || `${nomeRestaurante}-${nome}`,
            nome,
            restaurante: nomeRestaurante,
            categoria,
            descricao,
            imagem: img?.getAttribute("src") || "",
            logo: logo?.getAttribute("src") || "",
            preco: lerPreco(precoTexto),
            entrega
        };
        modal.classList.toggle("detalhe-modal-bebida", normalizar(categoria) === "bebidas");
        quantidade = 1;
        ultimoAlvo = card;
        nomeEl.textContent = nome;
        descricaoEl.textContent = descricao || "Carregando descrição...";
        descricaoEl.hidden = false;
        precoEl.textContent = moeda(produtoAtual.preco);
        if (produtoAtual.imagem) {
            imagemEl.src = produtoAtual.imagem;
            imagemEl.alt = nome;
            imagemEl.hidden = false;
            imagemEl.onerror = () => { imagemEl.hidden = true; imagemEl.removeAttribute("src"); };
        } else {
            imagemEl.hidden = true;
            imagemEl.removeAttribute("src");
        }
        atualizarPorcoes(descricao);
        entregaRestauranteEl.textContent = nomeRestaurante;
        const prazo = entrega.match(/\d+\s*[–-]\s*\d+\s*min/i)?.[0]?.replace(/\s+/g, " ") || entrega.match(/\d+\s*min/i)?.[0] || "Prazo sob consulta";
        const frete = entrega.match(/R\$\s*[\d.,]+/i)?.[0] || (/grátis/i.test(entrega) ? "Grátis" : "Frete sob consulta");
        entregaPrazoEl.textContent = prazo;
        entregaFreteEl.textContent = /R\$\s*0([,.]00)?/i.test(frete) ? "Grátis" : frete;
        entregaEl.hidden = !entrega;
        avisoCarrinhoEl.hidden = true;
        avisoCarrinhoEl.textContent = "";
        observacaoEl.value = "";
        contagemEl.textContent = "0";
        atualizarTotal();
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("detalhe-modal-aberto");
        modal.querySelector("[data-fechar-detalhe]").focus();
        mostrarRestaurantesDosPratos(produtoAtual);
        if (!descricao) {
            const produtoDaModal = produtoAtual;
            buscarDescricao(nomeRestaurante, nome).then(texto => {
                if (produtoAtual === produtoDaModal) {
                    produtoAtual.descricao = texto;
                    descricaoEl.textContent = texto;
                    atualizarPorcoes(texto);
                }
            });
        }
    }

    function fechar() {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("detalhe-modal-aberto");
        ultimoAlvo?.focus?.();
    }

    document.addEventListener("click", async evento => {
        const card = evento.target.closest(".produto-cliente, .prato-principal-card, .categoria-produto-card");
        if (card && !evento.target.closest("button, a, input, textarea, select")) {
            abrir(card);
            return;
        }
        if (evento.target.closest("[data-fechar-detalhe]")) {
            fechar();
            return;
        }
        const quantidadeBotao = evento.target.closest("[data-quantidade]");
        if (quantidadeBotao && !modal.hidden) {
            quantidade = Math.max(1, quantidade + Number(quantidadeBotao.dataset.quantidade));
            atualizarTotal();
            return;
        }
        if (evento.target.closest("[data-adicionar-detalhe]") && produtoAtual) {
            const carrinho = lerCarrinho();
            const categoriaProdutoAtual = normalizar(produtoAtual.categoria);
            if (categoriaProdutoAtual && categoriaProdutoAtual !== "bebidas") {
                const produtosAlimentares = await obterPratosNoCarrinho();
                const bebidasNoCarrinho = await obterBebidasNoCarrinho();
                const restaurantesDasBebidas = [...new Set(bebidasNoCarrinho.map(item => item.restaurante).filter(Boolean))];
                const bebidasDeOutroRestaurante = bebidasNoCarrinho.some(item => normalizar(item.restaurante) !== normalizar(produtoAtual.restaurante));
                if (!produtosAlimentares.length && bebidasDeOutroRestaurante) {
                    const nomes = restaurantesDasBebidas.length > 1
                        ? `${restaurantesDasBebidas.slice(0, -1).join(", ")} e ${restaurantesDasBebidas[restaurantesDasBebidas.length - 1]}`
                        : restaurantesDasBebidas[0];
                    avisoCarrinhoEl.textContent = `Você tem bebida${bebidasNoCarrinho.length > 1 ? "s" : ""} de ${nomes} no carrinho. Para adicionar um produto de ${produtoAtual.restaurante}, troque a bebida por uma desse restaurante.`;
                    avisoCarrinhoEl.hidden = false;
                    return;
                }
            }
            if (categoriaProdutoAtual === "bebidas") {
                const produtosAlimentares = await obterPratosNoCarrinho();
                const restaurantesComPrato = new Set(produtosAlimentares.map(item => normalizar(item.restaurante)));
                if (restaurantesComPrato.size && !restaurantesComPrato.has(normalizar(produtoAtual.restaurante))) {
                    const nomes = nomesDosRestaurantes(produtosAlimentares);
                    const restaurantesTexto = nomes.length > 1
                        ? `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`
                        : nomes[0];
                    const referenciaRestaurantes = nomes.length > 1 ? `dos restaurantes ${restaurantesTexto}` : `do restaurante ${restaurantesTexto}`;
                    avisoCarrinhoEl.textContent = `Essa bebida é de ${produtoAtual.restaurante}. No carrinho há ${produtosAlimentares.length} ${produtosAlimentares.length === 1 ? "produto" : "produtos"} ${referenciaRestaurantes}. Escolha uma bebida ${nomes.length > 1 ? "desses restaurantes" : "desse restaurante"}.`;
                    avisoCarrinhoEl.hidden = false;
                    return;
                }
            }
            const existente = carrinho.find(item => item.id === produtoAtual.id);
            if (existente) {
                existente.quantidade = (Number(existente.quantidade) || 0) + quantidade;
                if (observacaoEl.value.trim()) existente.observacao = observacaoEl.value.trim();
            } else {
                carrinho.push({
                    ...produtoAtual,
                    quantidade,
                    observacao: observacaoEl.value.trim()
                });
            }
            localStorage.setItem(chaveCarrinho, JSON.stringify(carrinho));
            window.location.href = "carrinhoCliente.html";
        }
    });

    observacaoEl.addEventListener("input", () => {
        contagemEl.textContent = String(observacaoEl.value.length);
    });

    modal.addEventListener("keydown", evento => {
        if (evento.key === "Escape") fechar();
    });
})();

