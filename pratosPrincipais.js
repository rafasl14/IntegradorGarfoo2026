(function carregarTodosOsPratosPrincipais() {
    const chaveCliente = base => window.GarfooClienteStore.chave(base);
    const grade = document.querySelector("[data-grade-pratos-principais]");
    const mensagem = document.querySelector("[data-mensagem-pratos-principais]");
    const saudacao = document.querySelector("[data-saudacao-usuario]");
    const seletorRestaurante = document.querySelector(".busca-cliente select");
    const formularioBusca = document.querySelector(".busca-cliente");
    const campoBusca = formularioBusca?.querySelector('input[type="search"]');

    if (!grade || !mensagem) {
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

    function normalizarBusca(texto) {
        return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
    }

    function criarPratos(dados, restauranteSelecionado = "") {
        const pratosIncluidos = new Set();
        return dados.restaurantes.flatMap(restaurante => {
            if (restauranteSelecionado && restaurante.nomeRes !== restauranteSelecionado) return [];
            return (restaurante.cardapio || [])
                .filter(item => item.produto?.categoria?.nomeCategoria === "Pratos Principais")
                .filter(item => {
                    const nome = String(item.produto.nomeProd || "")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .trim()
                        .replace(/\s+/g, " ")
                        .toLocaleLowerCase("pt-BR");
                    if (!nome || pratosIncluidos.has(nome)) return false;
                    pratosIncluidos.add(nome);
                    return true;
                })
                .map(item => ({ restaurante, item }));
        });
    }

    function renderizar(pratos) {
        grade.innerHTML = pratos.map(({ restaurante, item }) => {
            const produto = item.produto;
            const nomePrato = escaparHtml(produto.nomeProd);
            const nomeRestaurante = escaparHtml(restaurante.nomeRes);
            const foto = escaparHtml(produto.linkFotoProd);
            const logo = escaparHtml(restaurante.linkLogoRes);
            const descricao = escaparHtml(produto.descricaoProd);
            const preco = Number(item.precoItemCardapio || 0).toFixed(2).replace(".", ",");
            const idFavorito = `${restaurante.codRestaurante}-${item.codItemCardapio}`;
            const codigoEntrega = (Number(restaurante.codRestaurante) * 17 + Number(item.codItemCardapio) * 13) % 5;
            const hora = new Date().getHours();
            const picoMinutos = hora >= 11 && hora < 14 ? 5 : hora >= 18 && hora < 22 ? 10 : 0;
            const picoFrete = hora >= 11 && hora < 14 ? 0.75 : hora >= 18 && hora < 22 ? 1.5 : 0;
            const inicioEntrega = 25 + codigoEntrega * 5 + picoMinutos;
            const fimEntrega = inicioEntrega + 15;
            const frete = (5.99 + ((Number(restaurante.codRestaurante) + Number(item.codItemCardapio)) % 6) * 0.7 + picoFrete).toFixed(2).replace(".", ",");

            return `
                <article class="prato-principal-card" data-restaurante="${nomeRestaurante}" data-produto-id="${idFavorito}">
                    <button class="prato-principal-favorito" type="button" data-favoritar-prato="${idFavorito}" aria-label="Adicionar ${nomePrato} aos favoritos" aria-pressed="false">
                        ♡
                    </button>
                    ${foto ? `<img src="${foto}" alt="${nomePrato}">` : ""}
                    <div class="prato-principal-separador"></div>
                    <div class="prato-principal-info">
                        ${logo ? `<img class="prato-principal-logo" src="${logo}" alt="Logo de ${nomeRestaurante}">` : ""}
                        <div class="prato-principal-texto">
                            <h2>${nomePrato}</h2>
                            <p>${nomeRestaurante}</p>
                        </div>
                    </div>
                    <p class="prato-principal-descricao">${descricao}</p>
                    <div class="prato-principal-rodape">
                        <span>R$ ${preco}</span>
                        <span class="prato-principal-tempo">${inicioEntrega}–${fimEntrega} min · R$ ${frete}</span>
                    </div>
                </article>
            `;
        }).join("");

        mensagem.textContent = `${pratos.length} pratos principais encontrados.`;
        configurarFavoritos();
        grade.querySelectorAll(".prato-principal-card > img, .prato-principal-logo").forEach(imagem => {
            imagem.addEventListener("error", () => {
                imagem.style.visibility = "hidden";
                imagem.alt = "";
            }, { once: true });
        });
    }

    function configurarFavoritos() {
        let favoritos = new Set();

        try {
            const salvos = JSON.parse(localStorage.getItem(chaveCliente("garfooFavoritosCliente")) || "[]");
            if (Array.isArray(salvos)) favoritos = new Set(salvos);
        } catch (erro) {
            console.error("Não foi possível carregar os favoritos:", erro);
        }

        document.querySelectorAll("[data-favoritar-prato]").forEach(botao => {
            const id = botao.dataset.favoritarPrato;
            const atualizar = () => {
                const marcado = favoritos.has(id);
                botao.classList.toggle("marcado", marcado);
                botao.textContent = marcado ? "♥" : "♡";
                botao.setAttribute("aria-pressed", String(marcado));
            };

            atualizar();
            botao.addEventListener("click", () => {
                if (favoritos.has(id)) favoritos.delete(id);
                else favoritos.add(id);
                localStorage.setItem(chaveCliente("garfooFavoritosCliente"), JSON.stringify([...favoritos]));
                salvarDadosFavorito(id, botao, ".prato-principal-card", ".prato-principal-texto h2", ".prato-principal-texto p", ".prato-principal-rodape span", ".prato-principal-card > img", ".prato-principal-logo");
                atualizar();
            });
        });
    }

    function salvarDadosFavorito(id, botao, cardSeletor, nomeSeletor, restauranteSeletor, precoSeletor, imagemSeletor, logoSeletor) {
        let dados = {};
        try { dados = JSON.parse(localStorage.getItem(chaveCliente("garfooDadosFavoritosCliente")) || "{}"); } catch {}
        if (!favoritos.has(id)) delete dados[id];
        else {
            const card = botao.closest(cardSeletor);
            dados[id] = { nome: card?.querySelector(nomeSeletor)?.textContent.trim() || id, restaurante: card?.querySelector(restauranteSeletor)?.textContent.trim() || "", preco: card?.querySelector(precoSeletor)?.textContent.trim() || "", imagem: card?.querySelector(imagemSeletor)?.getAttribute("src") || "", logo: card?.querySelector(logoSeletor)?.getAttribute("src") || "" };
        }
        localStorage.setItem(chaveCliente("garfooDadosFavoritosCliente"), JSON.stringify(dados));
    }

    let restaurantesCarregados = [];

    function atualizarPratosPorRestaurante() {
        const selecionado = seletorRestaurante?.selectedOptions[0]?.textContent.trim();
        const restauranteSelecionado = selecionado && selecionado !== "Todos os restaurantes" ? selecionado : "";
        const termo = normalizarBusca(campoBusca?.value);
        const pratos = criarPratos({ restaurantes: restaurantesCarregados }, restauranteSelecionado).filter(({ restaurante, item }) => {
            const produto = item.produto || {};
            const texto = normalizarBusca(`${restaurante.nomeRes} ${produto.nomeProd} ${produto.descricaoProd} ${produto.categoria?.nomeCategoria}`);
            return !termo || texto.includes(termo);
        });
        renderizar(pratos);
    }

    seletorRestaurante?.addEventListener("change", atualizarPratosPorRestaurante);
    formularioBusca?.addEventListener("submit", evento => {
        evento.preventDefault();
        atualizarPratosPorRestaurante();
    });
    campoBusca?.addEventListener("search", () => {
        if (!campoBusca.value.trim()) atualizarPratosPorRestaurante();
    });

    fetch("cardapios_restaurantes.json?v=20261114-7")
        .then(resposta => {
            if (!resposta.ok) throw new Error("Não foi possível carregar os pratos principais.");
            return resposta.json();
        })
        .then(dados => {
            restaurantesCarregados = Array.isArray(dados.restaurantes) ? dados.restaurantes : [];
            atualizarPratosPorRestaurante();
        })
        .catch(erro => {
            console.error(erro);
            mensagem.textContent = "Não foi possível carregar os pratos principais. Abra o projeto em um servidor local.";
        });
})();
