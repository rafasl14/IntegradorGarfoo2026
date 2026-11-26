(function carregarCategoriaProduto() {
    const chaveCliente = base => window.GarfooClienteStore.chave(base);
    const categoria = document.body.dataset.categoriaProduto;
    const grade = document.querySelector("[data-grade-categoria]");
    const mensagem = document.querySelector("[data-mensagem-categoria]");
    const saudacao = document.querySelector("[data-saudacao-usuario]");
    const seletorRestaurante = document.querySelector(".busca-cliente select");
    const formularioBusca = document.querySelector(".busca-cliente");
    const campoBusca = formularioBusca?.querySelector('input[type="search"]');

    if (!categoria || !grade || !mensagem) {
        return;
    }

    const usuarioSalvo = localStorage.getItem("garfooUsuarioLogado");

    if (usuarioSalvo && saudacao) {
        try {
            const usuario = JSON.parse(usuarioSalvo);
            const nome = usuario?.dados?.nomeUsuario || usuario?.nomeUsuario;

            if (nome) {
                saudacao.textContent = `Olá, ${nome.trim().split(/\s+/)[0]}!`;
            }
        } catch (erro) {
            console.error("Não foi possível recuperar o usuário logado:", erro);
        }
    }

    function escaparHtml(texto) {
        return String(texto || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .replace(/\s+/g, " ")
            .toLocaleLowerCase("pt-BR");
    }

    function buscarProdutos(dados) {
        const categoriaNormalizada = normalizar(categoria);

        return (dados.restaurantes || []).flatMap(restaurante => {
            return (restaurante.cardapio || [])
                .filter(item => normalizar(item.produto?.categoria?.nomeCategoria) === categoriaNormalizada)
                .map(item => ({ restaurante, item }));
        });
    }

    function filtrarBebidasPeloCarrinho(produtos, dados) {
        if (normalizar(categoria) !== "bebidas") return produtos;

        let carrinho = [];
        try {
            const salvo = JSON.parse(localStorage.getItem(chaveCliente("garfooCarrinho")) || "[]");
            if (Array.isArray(salvo)) carrinho = salvo;
        } catch (erro) {
            console.error("Não foi possível verificar os restaurantes do carrinho:", erro);
            return produtos;
        }

        const restaurantesComProdutos = new Set();
        carrinho.forEach(item => {
            const restaurante = (dados.restaurantes || []).find(registro => normalizar(registro.nomeRes) === normalizar(item.restaurante));
            const registro = (restaurante?.cardapio || []).find(entry => normalizar(entry.produto?.nomeProd) === normalizar(item.nome));
            const categoriaItem = normalizar(item.categoria?.nomeCategoria || item.categoria || registro?.produto?.categoria?.nomeCategoria);
            if (categoriaItem && categoriaItem !== "bebidas") restaurantesComProdutos.add(normalizar(item.restaurante));
        });

        if (!restaurantesComProdutos.size) return produtos;
        return produtos.filter(({ restaurante }) => restaurantesComProdutos.has(normalizar(restaurante.nomeRes)));
    }

    function filtrarPorRestauranteEBusca(produtos) {
        const selecionado = seletorRestaurante?.selectedOptions[0]?.textContent.trim();
        const termo = normalizar(campoBusca?.value);
        return produtos.filter(({ restaurante, item }) => {
            const produto = item.produto || {};
            const correspondeRestaurante = !selecionado || selecionado === "Todos os restaurantes" || restaurante.nomeRes === selecionado;
            const textoProduto = normalizar(`${produto.nomeProd} ${produto.descricaoProd} ${produto.categoria?.nomeCategoria}`);
            const correspondeBusca = !termo || normalizar(restaurante.nomeRes).includes(termo) || textoProduto.includes(termo);
            return correspondeRestaurante && correspondeBusca;
        });
    }

    function renderizar(produtos) {
        grade.innerHTML = produtos.map(({ restaurante, item }) => {
            const produto = item.produto;
            const nomeProduto = escaparHtml(produto.nomeProd);
            const nomeRestaurante = escaparHtml(restaurante.nomeRes);
            const foto = escaparHtml(produto.linkFotoProd);
            const logo = escaparHtml(restaurante.linkLogoRes);
            const descricao = escaparHtml(produto.descricaoProd);
            const preco = Number(item.precoItemCardapio || 0).toFixed(2).replace(".", ",");
            const idFavorito = `${restaurante.codRestaurante}-${item.codItemCardapio}`;

            return `
                <article class="categoria-produto-card" data-produto-id="${idFavorito}">
                    <button class="categoria-produto-favorito" type="button" data-favoritar-categoria="${idFavorito}" aria-label="Adicionar ${nomeProduto} aos favoritos" aria-pressed="false">
                        ♡
                    </button>
                    ${foto ? `<img src="${foto}" alt="${nomeProduto}">` : ""}
                    <div class="categoria-produto-separador"></div>
                    <div class="categoria-produto-info">
                        ${logo ? `<img class="categoria-produto-logo" src="${logo}" alt="Logo de ${nomeRestaurante}">` : ""}
                        <div class="categoria-produto-texto">
                            <h2>${nomeProduto}</h2>
                            <p>${nomeRestaurante}</p>
                        </div>
                    </div>
                    <p class="categoria-produto-descricao">${descricao}</p>
                    <div class="categoria-produto-rodape">
                        <span>R$ ${preco}</span>
                        <span class="categoria-produto-tempo">25–45 min</span>
                    </div>
                </article>
            `;
        }).join("");

        const verboEncontrar = ["Bebidas", "Sobremesas"].includes(categoria) ? "encontradas" : "encontrados";
        mensagem.textContent = `${produtos.length} ${categoria.toLowerCase()} ${verboEncontrar}.`;
        grade.querySelectorAll(".categoria-produto-card > img, .categoria-produto-logo").forEach(imagem => {
            imagem.addEventListener("error", () => {
                imagem.style.visibility = "hidden";
                imagem.alt = "";
            }, { once: true });
        });
        configurarFavoritos();
    }

    function configurarFavoritos() {
        let favoritos = new Set();

        try {
            const salvos = JSON.parse(localStorage.getItem(chaveCliente("garfooFavoritosCliente")) || "[]");
            if (Array.isArray(salvos)) favoritos = new Set(salvos);
        } catch (erro) {
            console.error("Não foi possível carregar os favoritos:", erro);
        }

        document.querySelectorAll("[data-favoritar-categoria]").forEach(botao => {
            const id = botao.dataset.favoritarCategoria;

            function atualizar() {
                const marcado = favoritos.has(id);
                botao.classList.toggle("marcado", marcado);
                botao.textContent = marcado ? "♥" : "♡";
                botao.setAttribute("aria-pressed", String(marcado));
                botao.setAttribute("aria-label", `${marcado ? "Remover" : "Adicionar"} produto ${marcado ? "dos" : "aos"} favoritos`);
            }

            atualizar();
            botao.addEventListener("click", () => {
                if (favoritos.has(id)) favoritos.delete(id);
                else favoritos.add(id);

                localStorage.setItem(chaveCliente("garfooFavoritosCliente"), JSON.stringify([...favoritos]));
                let dados = {};
                try { dados = JSON.parse(localStorage.getItem(chaveCliente("garfooDadosFavoritosCliente")) || "{}"); } catch {}
                if (!favoritos.has(id)) delete dados[id];
                else {
                    const card = botao.closest(".categoria-produto-card");
                    dados[id] = {
                        nome: card?.querySelector(".categoria-produto-texto h2")?.textContent.trim() || id,
                        restaurante: card?.querySelector(".categoria-produto-texto p")?.textContent.trim() || "",
                        preco: card?.querySelector(".categoria-produto-rodape span")?.textContent.trim() || "",
                        imagem: card?.querySelector(".categoria-produto-card > img")?.getAttribute("src") || "",
                        logo: card?.querySelector(".categoria-produto-logo")?.getAttribute("src") || ""
                    };
                }
                localStorage.setItem(chaveCliente("garfooDadosFavoritosCliente"), JSON.stringify(dados));
                atualizar();
            });
        });
    }

    let dadosCarregados = null;

    function atualizarProdutosDaCategoria() {
        if (!dadosCarregados) return;
        const produtos = filtrarBebidasPeloCarrinho(buscarProdutos(dadosCarregados), dadosCarregados);
        renderizar(filtrarPorRestauranteEBusca(produtos));
    }

    seletorRestaurante?.addEventListener("change", atualizarProdutosDaCategoria);
    formularioBusca?.addEventListener("submit", evento => {
        evento.preventDefault();
        atualizarProdutosDaCategoria();
    });
    campoBusca?.addEventListener("search", () => {
        if (!campoBusca.value.trim()) atualizarProdutosDaCategoria();
    });

    fetch("cardapios_restaurantes.json?v=20261114-7")
        .then(resposta => {
            if (!resposta.ok) throw new Error(`Não foi possível carregar ${categoria}.`);
            return resposta.json();
        })
        .then(dados => {
            dadosCarregados = dados;
            atualizarProdutosDaCategoria();
        })
        .catch(erro => {
            console.error(erro);
            mensagem.textContent = `Não foi possível carregar ${categoria.toLowerCase()}. Abra o projeto em um servidor local.`;
        });
})();


