const usuarioSalvo = localStorage.getItem("garfooUsuarioLogado");
const chaveClienteUsuario = base => window.GarfooClienteStore.chave(base);
let usuarioLogadoCliente = null;

if (usuarioSalvo) {
    try {
        const usuarioLogado = JSON.parse(usuarioSalvo);
        const tipos = [usuarioLogado?.modoAtivo, usuarioLogado?.tipo, usuarioLogado?.tipoUsuario, ...(Array.isArray(usuarioLogado?.perfis) ? usuarioLogado.perfis : [])]
            .map(tipo => String(tipo || "").trim().toLocaleLowerCase("pt-BR"));
        const ehCliente = tipos.some(tipo => ["cliente", "customer"].includes(tipo));
        usuarioLogadoCliente = ehCliente ? usuarioLogado : null;
        const nome = ehCliente ? (usuarioLogado?.dados?.nomeUsuario || usuarioLogado?.dados?.nomeCompleto || usuarioLogado?.nomeUsuario) : "";
        const saudacao = document.querySelector("[data-saudacao-usuario]");

        if (saudacao) {
            saudacao.textContent = nome ? `Olá, ${nome.trim().split(/\s+/)[0]}!` : "Olá!";
        }
    } catch (erro) {
        console.error("Não foi possível recuperar o usuário logado:", erro);
    }
}

function atualizarPaginaPedidos() {
    if (window.location.hash === "#pedidos") window.location.replace("meusPedidosCliente.html");
}

atualizarPaginaPedidos();
window.addEventListener("hashchange", atualizarPaginaPedidos);
window.addEventListener("pageshow", atualizarPaginaPedidos);

const botoesCategoria = document.querySelectorAll("[data-categoria-filtro]");
const secoesProdutos = document.querySelectorAll("[data-secao-produtos]");
const seletorRestaurante = document.querySelector(".busca-cliente select");
const formularioBuscaCliente = document.querySelector(".busca-cliente");
const campoBuscaCliente = formularioBuscaCliente?.querySelector('input[type="search"]');
const resultadosBuscaCliente = document.querySelector("[data-resultados-busca]");
const conteudoCliente = document.querySelector(".cliente-main");

function voltarAoInicioDaBusca() {
    if (campoBuscaCliente) campoBuscaCliente.value = "";
    if (seletorRestaurante) seletorRestaurante.selectedIndex = 0;
    resultadosBuscaCliente.hidden = true;
    resultadosBuscaCliente.innerHTML = "";
    conteudoCliente.hidden = false;
    botoesCategoria.forEach(botao => botao.classList.toggle("categoria-ativa", botao.dataset.categoriaFiltro === "Todos"));
    atualizarProdutosVisiveis();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("error", evento => {
    if (evento.target.matches?.(".produto-cliente > img, .produto-restaurante-logo")) {
        evento.target.style.visibility = "hidden";
        evento.target.alt = "";
    }
}, true);

function obterEntregaPorRestaurante(nomeRestaurante) {
    const hora = new Date().getHours();
    const horarioPico = hora >= 11 && hora < 14 ? 5 : hora >= 18 && hora < 22 ? 10 : 0;
    const adicionalFrete = hora >= 11 && hora < 14 ? 0.75 : hora >= 18 && hora < 22 ? 1.5 : 0;
    const codigo = [...String(nomeRestaurante || "Garfoo")].reduce((total, letra) => total + letra.charCodeAt(0), 0);
    const inicio = 20 + (codigo % 5) * 5 + horarioPico;
    const fim = inicio + 15;
    const frete = (5.99 + (codigo % 4) * 0.9 + adicionalFrete).toFixed(2).replace(".", ",");
    return [`${inicio}–${fim} min`, `R$ ${frete}`];
}

function atualizarProdutosVisiveis() {
    const categoriaAtiva = document.querySelector("[data-categoria-filtro].categoria-ativa");
    const categoriaSelecionada = categoriaAtiva?.dataset.categoriaFiltro || "Todos";
    const restauranteSelecionado = seletorRestaurante?.selectedOptions[0]?.textContent.trim();

    document.querySelectorAll(".produto-cliente").forEach(produto => {
        const nomeRestaurante = produto.querySelector(".produto-restaurante-logo")?.alt || "Garfoo";
        const correspondeCategoria = categoriaSelecionada === "Todos" || produto.dataset.categoriaProduto === categoriaSelecionada;
        const correspondeRestaurante = !restauranteSelecionado || restauranteSelecionado === "Todos os restaurantes" || nomeRestaurante === restauranteSelecionado;
        produto.hidden = !(correspondeCategoria && correspondeRestaurante);

        const resumo = produto.querySelector("small");
        if (resumo) {
            const [tempo, frete] = obterEntregaPorRestaurante(nomeRestaurante);
            resumo.textContent = `${tempo} · ${frete}`;
        }
    });

    secoesProdutos.forEach(secao => {
        secao.hidden = !secao.querySelector(".produto-cliente:not([hidden])");
    });
}

function normalizarBuscaCliente(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function escaparBuscaCliente(texto) {
    return String(texto || "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[caractere]));
}

const catalogoBuscaCliente = fetch("cardapios_restaurantes.json?v=20261114-7")
    .then(resposta => resposta.ok ? resposta.json() : Promise.reject(new Error("Não foi possível carregar o cardápio.")));

// Reaproveita a página do cliente para exibir o cardápio do restaurante escolhido.
const restauranteEscolhidoUrl = new URLSearchParams(window.location.search).get("restaurante");
if (restauranteEscolhidoUrl && "scrollRestoration" in history) history.scrollRestoration = "manual";
// Configure cada banner separadamente. Largura e altura aceitam valores em px ou %.
const configuracaoBannersRestaurantes = {
    "le verre": { largura: "90%", altura: "100%", zoom: 1.12 },
    "pepin restaurant": { largura: "100%", altura: "100%", zoom: 1 },
    "la petit etoile": { largura: "100%", altura: "100%", zoom: 1 },
    "el rancho": { largura: "100%", altura: "100%", zoom: 1 },
    "zocalo": { largura: "100%", altura: "100%", zoom: 1 },
    "la morena": { largura: "100%", altura: "100%", zoom: 1 },
    "ay jalisco": { largura: "100%", altura: "100%", zoom: 1 },
    "suba sushi": { largura: "100%", altura: "100%", zoom: 1 },
    "ichiran ramen": { largura: "100%", altura: "100%", zoom: 1},
    "papa sushi": { largura: "100%", altura: "100%", zoom: 1 },
    "sushi yoji bar": { largura: "100%", altura: "100%", zoom: 1 },
    "vino & sapori": { largura: "100%", altura: "100%", zoom: 1 },
    "di napoli": { largura: "100%", altura: "100%", zoom: 1 },
    "pasta & passione": { largura: "100%", altura: "100%", zoom: 1 },
    "costiera": { largura: "100%", altura: "100%", zoom: 1 }
};
if (restauranteEscolhidoUrl) {
    const paginaRestaurante = document.createElement("main");
    paginaRestaurante.className = "pagina-restaurante-cliente";
    document.querySelector(".cliente-header")?.after(paginaRestaurante);
    document.querySelector(".cliente-hero")?.setAttribute("hidden", "");
    document.querySelector(".cliente-categorias")?.setAttribute("hidden", "");
    document.querySelector(".cliente-busca-resultados")?.setAttribute("hidden", "");
    conteudoCliente?.setAttribute("hidden", "");

    const escaparRestaurante = valor => String(valor || "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[caractere]));
    const slugRestaurante = valor => normalizarBuscaCliente(valor).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    function atualizarAvaliacoesEnviadas(nomeRestaurante) {
        const grade = paginaRestaurante.querySelector(".restaurante-avaliacoes-grade");
        if (!grade) return;
        grade.querySelectorAll("[data-avaliacao-cliente-real]").forEach(item => item.remove());
        let pedidos = [];
        try {
            const salvos = JSON.parse(localStorage.getItem("garfooPedidosCliente") || "[]");
            pedidos = Array.isArray(salvos) ? salvos : [];
        } catch (erro) { console.warn("Não foi possível carregar avaliações de clientes:", erro); }
        const alvo = normalizarBuscaCliente(nomeRestaurante);
        const avaliacoes = pedidos.flatMap(pedido => {
            const entregues = pedido.status === "Entregue" || pedido.statusEntrega === "Pedido entregue";
            if (!entregues) return [];
            const novas = Object.values(pedido.avaliacoesCliente?.restaurantes || {});
            if (!novas.length && pedido.avaliacoesCliente?.restaurante) novas.push({ ...pedido.avaliacoesCliente.restaurante, restauranteNome: pedido.itens?.[0]?.restaurante || "" });
            return novas.filter(avaliacao => normalizarBuscaCliente(avaliacao.restauranteNome) === alvo)
                .map(avaliacao => ({ pedido, avaliacao }));
        });
        avaliacoes.reverse().forEach(({ pedido, avaliacao }) => {
            const pratos = (avaliacao.pratos?.length ? avaliacao.pratos : (pedido.itens || []).filter(item => normalizarBuscaCliente(item.restaurante) === alvo).map(item => item.nome)).filter(Boolean);
            const comentario = avaliacao.comentarioOculto ? "Comentário ocultado para moderação." : avaliacao.comentario || "Cliente avaliou sem deixar comentário.";
            const nomeCliente = pedido.clienteNome || "Cliente Garfoo";
            const numero = pedido.numero || pedido.id;
            const cartao = document.createElement("article");
            cartao.className = "restaurante-avaliacao-card";
            cartao.dataset.avaliacaoClienteReal = "";
            cartao.innerHTML = `<p><strong>Pedido ${escaparRestaurante(numero)}</strong><br><small>Prato: ${escaparRestaurante(pratos.join(", ") || "Não informado")}</small></p><p>${escaparRestaurante(comentario)}</p><div class="restaurante-avaliacao-autor"><span class="restaurante-avaliacao-avatar" aria-hidden="true">${escaparRestaurante(nomeCliente.charAt(0).toUpperCase())}</span><span><strong>${escaparRestaurante(nomeCliente)}</strong><small>${"★".repeat(avaliacao.nota)}${"☆".repeat(5 - avaliacao.nota)} · Pedido ${escaparRestaurante(numero)}</small></span></div>`;
            grade.prepend(cartao);
        });
    }
    const categoriasRestaurante = [
        { titulo: "Principais", inclui: categoria => ["pratos principais", "entradas", "massas"].includes(normalizarBuscaCliente(categoria)) },
        { titulo: "Combos", inclui: categoria => normalizarBuscaCliente(categoria) === "combos" },
        { titulo: "Ofertas", inclui: (categoria, item) => item.oferta === true || item.produto?.oferta === true || Number(item.precoOriginal || item.produto?.precoOriginal) > Number(item.precoItemCardapio) },
        { titulo: "Sobremesas", inclui: categoria => normalizarBuscaCliente(categoria) === "sobremesas" },
        { titulo: "Bebidas", inclui: categoria => normalizarBuscaCliente(categoria) === "bebidas" }
    ];

    catalogoBuscaCliente.then(dados => {
        const restaurante = (dados.restaurantes || []).find(item => normalizarBuscaCliente(item.nomeRes) === normalizarBuscaCliente(restauranteEscolhidoUrl));
        if (!restaurante) {
            paginaRestaurante.innerHTML = '<p class="pagina-restaurante-status">Restaurante não encontrado. <a href="restaurantesCliente.html">Ver restaurantes</a></p>';
            return;
        }

        const nomeSeguro = escaparRestaurante(restaurante.nomeRes);
        document.title = `${restaurante.nomeRes} — Garfoo`;
        const contato = {
            telefone: document.querySelector("[data-telefone-restaurante]"),
            endereco: document.querySelector("[data-endereco-restaurante]"),
            horario: document.querySelector("[data-horario-restaurante]")
        };
        if (contato.telefone && restaurante.telefoneRes) contato.telefone.textContent = restaurante.telefoneRes;
        if (contato.endereco && restaurante.enderecoRes) {
            contato.endereco.textContent = normalizarBuscaCliente(restaurante.enderecoRes).includes("uberlandia") ? restaurante.enderecoRes : `${restaurante.enderecoRes} · Uberlândia - MG`;
        }
        if (contato.horario && restaurante.horarioRes) contato.horario.textContent = restaurante.horarioRes;

        const itens = (restaurante.cardapio || []).filter(item => item.produto && item.produto.linkFotoProd);
        const nomeNormalizadoRestaurante = normalizarBuscaCliente(restaurante.nomeRes);
        const idSecao = grupo => `cardapio-${slugRestaurante(restaurante.nomeRes)}-${slugRestaurante(grupo.titulo)}`;
        const cartao = item => {
            const produto = item.produto;
            const nomeProduto = escaparRestaurante(produto.nomeProd);
            const categoria = escaparRestaurante(produto.categoria?.nomeCategoria || "");
            const imagem = produto.linkFotoProd ? `<img class="restaurante-produto-foto" src="${escaparRestaurante(produto.linkFotoProd)}" alt="${nomeProduto}" loading="lazy">` : "";
            const preco = Number(item.precoItemCardapio || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const [prazo, frete] = obterEntregaPorRestaurante(restaurante.nomeRes);
            return `<article class="restaurante-produto-card produto-cliente${imagem ? "" : " sem-foto"}" data-categoria-produto="${categoria}" data-restaurante="${nomeSeguro}" data-produto-id="${restaurante.codRestaurante}-${item.codItemCardapio}">
                ${imagem}<div class="restaurante-produto-conteudo"><h3 class="produto-detalhes"><strong>${nomeProduto}</strong><span class="restaurante-preco-modal">R$ ${preco}</span></h3>
                <p class="restaurante-produto-descricao categoria-produto-descricao">${escaparRestaurante(produto.descricaoProd || "")}</p>
                <div class="restaurante-produto-rodape"><strong>R$ ${preco}</strong><small>${prazo} · ${frete}</small></div></div></article>`;
        };
        const gruposVisiveis = categoriasRestaurante.map(grupo => ({
            ...grupo,
            itens: itens.filter(item => grupo.inclui(item.produto.categoria?.nomeCategoria || "", item))
        })).filter(grupo => grupo.itens.length);
        const secoes = gruposVisiveis.map(grupo => `<section class="restaurante-cardapio-secao" id="${idSecao(grupo)}">
            <h2><span aria-hidden="true">•</span> ${grupo.titulo}</h2><div class="restaurante-cardapio-grade">${grupo.itens.map(cartao).join("")}</div></section>`).join("");
        const botoesCategoria = gruposVisiveis.map(grupo => `<a href="#${idSecao(grupo)}">${grupo.titulo}</a>`).join("");
        const banner = restaurante.linkBannerRes ? escaparRestaurante(restaurante.linkBannerRes) : "";
        const nomesAvaliadores = ["Marília Fernandes", "Pedro Paulo", "Gláucia Vilela"];
        const frasesAvaliacao = [
            "estava muito saboroso e chegou bem preparado. Os ingredientes estavam frescos.",
            "estava delicioso e a apresentação veio caprichada. Pedirei novamente.",
            "veio bem temperado e o pedido chegou no prazo. Foi uma ótima experiência."
        ];
        const produtosParaAvaliar = itens.filter(item => normalizarBuscaCliente(item.produto.categoria?.nomeCategoria) !== "bebidas");
        const totalAvaliacoes = 2 + (Number(restaurante.codRestaurante) % 2);
        const avaliacoes = Array.from({ length: totalAvaliacoes }, (_, indice) => {
            const item = produtosParaAvaliar[indice % Math.max(produtosParaAvaliar.length, 1)];
            const nomePrato = item?.produto?.nomeProd || "pedido";
            return `<article class="restaurante-avaliacao-card">
                <p>O <strong>${escaparRestaurante(nomePrato)}</strong> ${frasesAvaliacao[indice]} </p>
                <div class="restaurante-avaliacao-autor"><span class="restaurante-avaliacao-avatar" aria-hidden="true">${nomesAvaliadores[indice].charAt(0)}</span><span><strong>${nomesAvaliadores[indice]}</strong><small>★★★★★ · Cliente Garfoo</small></span></div>
            </article>`;
        }).join("");

        paginaRestaurante.innerHTML = `<section class="restaurante-cliente-hero">
            ${banner ? `<img class="restaurante-banner-imagem" src="${banner}" alt="" aria-hidden="true">` : ""}
        </section><nav class="restaurante-categorias-nav" aria-label="Categorias do cardápio">${botoesCategoria}</nav>
        <div class="restaurante-cardapio-conteudo"><div class="restaurante-voltar-wrap"><a class="restaurante-voltar" href="cliente.html" aria-label="Voltar para a página inicial" title="Voltar para a página inicial"><span aria-hidden="true">←</span></a></div>${secoes || '<p class="pagina-restaurante-status">Não há produtos com fotos cadastradas para este restaurante.</p>'}
            <section class="restaurante-avaliacoes"><h2><span aria-hidden="true">•</span> Avaliações dos clientes</h2><div class="restaurante-avaliacoes-grade">${avaliacoes}</div></section>
        </div>`;
        atualizarAvaliacoesEnviadas(restaurante.nomeRes);
        window.addEventListener("storage", evento => {
            if (evento.key === "garfooPedidosCliente") atualizarAvaliacoesEnviadas(restaurante.nomeRes);
        });
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
        const configuracaoBanner = configuracaoBannersRestaurantes[nomeNormalizadoRestaurante] || { largura: "100%", altura: "100%", zoom: 1 };
        const elementoBanner = paginaRestaurante.querySelector(".restaurante-banner-imagem");
        if (elementoBanner) {
            elementoBanner.style.setProperty("--banner-largura", configuracaoBanner.largura);
            elementoBanner.style.setProperty("--banner-altura", configuracaoBanner.altura);
            elementoBanner.style.setProperty("--banner-zoom", configuracaoBanner.zoom);
            elementoBanner.style.setProperty("--banner-top", configuracaoBanner.top || "0px");
        }
        paginaRestaurante.querySelectorAll(".restaurante-produto-foto").forEach(imagem => imagem.addEventListener("error", () => {
            const cartao = imagem.closest(".restaurante-produto-card");
            const secao = cartao?.closest(".restaurante-cardapio-secao");
            cartao?.remove();
            if (secao && !secao.querySelector(".restaurante-produto-card")) {
                const linkCategoria = paginaRestaurante.querySelector(`.restaurante-categorias-nav a[href="#${secao.id}"]`);
                linkCategoria?.remove();
                secao.remove();
            }
            if (!paginaRestaurante.querySelector(".restaurante-produto-card")) {
                const conteudo = paginaRestaurante.querySelector(".restaurante-cardapio-conteudo");
                if (conteudo) conteudo.innerHTML = '<p class="pagina-restaurante-status">Não há produtos com fotos cadastradas para este restaurante.</p>';
            }
        }, { once: true }));
        paginaRestaurante.querySelector(".restaurante-banner-imagem")?.addEventListener("error", evento => evento.currentTarget.remove(), { once: true });
    }).catch(erro => {
        console.error("Não foi possível carregar o cardápio do restaurante:", erro);
        paginaRestaurante.innerHTML = '<p class="pagina-restaurante-status">Não foi possível carregar este cardápio.</p>';
    });
}

formularioBuscaCliente?.addEventListener("submit", async evento => {
    evento.preventDefault();
    const termo = normalizarBuscaCliente(campoBuscaCliente?.value);
    const restauranteSelecionado = seletorRestaurante?.selectedOptions[0]?.textContent.trim();

    if (!termo && (!restauranteSelecionado || restauranteSelecionado === "Todos os restaurantes")) {
        resultadosBuscaCliente.hidden = true;
        resultadosBuscaCliente.innerHTML = "";
        conteudoCliente.hidden = false;
        return;
    }

    resultadosBuscaCliente.hidden = false;
    resultadosBuscaCliente.innerHTML = '<p class="cliente-busca-status">Buscando pratos e restaurantes...</p>';
    conteudoCliente.hidden = true;

    try {
        const dados = await catalogoBuscaCliente;
        const produtos = (dados.restaurantes || []).flatMap(restaurante => {
            if (restauranteSelecionado && restauranteSelecionado !== "Todos os restaurantes" && restaurante.nomeRes !== restauranteSelecionado) return [];
            return (restaurante.cardapio || []).filter(item => {
                const produto = item.produto || {};
                const texto = normalizarBuscaCliente(`${restaurante.nomeRes} ${produto.nomeProd} ${produto.descricaoProd} ${produto.categoria?.nomeCategoria}`);
                return !termo || texto.includes(termo);
            }).map(item => ({ restaurante, item }));
        });

        if (!produtos.length) {
            resultadosBuscaCliente.innerHTML = '<p class="cliente-busca-status">Nenhum prato ou restaurante encontrado.</p>';
            return;
        }

        const cartoes = produtos.map(({ restaurante, item }) => {
            const produto = item.produto || {};
            const nome = escaparBuscaCliente(produto.nomeProd);
            const nomeRestaurante = escaparBuscaCliente(restaurante.nomeRes);
            const categoria = escaparBuscaCliente(produto.categoria?.nomeCategoria);
            const foto = produto.linkFotoProd ? `<img src="${escaparBuscaCliente(produto.linkFotoProd)}" alt="${nome}">` : "";
            const logo = restaurante.linkLogoRes ? `<img class="produto-restaurante-logo" src="${escaparBuscaCliente(restaurante.linkLogoRes)}" alt="${nomeRestaurante}">` : "";
            const preco = Number(item.precoItemCardapio || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const [prazo, frete] = obterEntregaPorRestaurante(restaurante.nomeRes);
            return `<article class="produto-cliente" data-categoria-produto="${categoria}" data-restaurante="${nomeRestaurante}" data-produto-id="${restaurante.codRestaurante}-${item.codItemCardapio}">
                ${foto}
                <div class="produto-separador"></div>
                <div class="produto-info">${logo}<div class="produto-detalhes"><strong>${nome}</strong><span>R$ ${preco}</span></div></div>
                <small>${prazo} · ${frete}</small>
            </article>`;
        }).join("");

        resultadosBuscaCliente.innerHTML = `<h2>Resultados da busca</h2><p class="cliente-busca-status">${produtos.length} produto${produtos.length === 1 ? "" : "s"} encontrado${produtos.length === 1 ? "" : "s"}</p><div class="cliente-busca-grade">${cartoes}</div>`;
    } catch (erro) {
        console.error("Erro na busca do cliente:", erro);
        resultadosBuscaCliente.innerHTML = '<p class="cliente-busca-status">Não foi possível carregar a busca. Tente novamente.</p>';
    }
});

campoBuscaCliente?.addEventListener("search", () => {
    if (!campoBuscaCliente.value.trim()) voltarAoInicioDaBusca();
});

campoBuscaCliente?.addEventListener("input", () => {
    if (!campoBuscaCliente.value.trim() && !resultadosBuscaCliente.hidden) voltarAoInicioDaBusca();
});

seletorRestaurante?.addEventListener("change", atualizarProdutosVisiveis);
window.setInterval(atualizarProdutosVisiveis, 60000);

const listaSobremesas = document.querySelector("[data-lista-sobremesas]");
if (listaSobremesas) {
    fetch("cardapios_restaurantes.json?v=20261114-7")
        .then(resposta => {
            if (!resposta.ok) throw new Error("Não foi possível carregar as sobremesas.");
            return resposta.json();
        })
        .then(dados => {
            const todasSobremesas = (dados.restaurantes || []).flatMap(restaurante =>
                (restaurante.cardapio || [])
                    .filter(item => item.produto?.categoria?.nomeCategoria === "Sobremesas")
                    .map(item => ({ restaurante, item }))
            );
            const escapar = valor => String(valor || "").replace(/[&<>\"']/g, caractere => ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
            }[caractere]));

            const renderizarSobremesa = ({ restaurante, item }) => {
                const produto = item.produto;
                const id = `${restaurante.codRestaurante}-${item.codItemCardapio}`;
                const preco = Number(item.precoItemCardapio || 0).toFixed(2).replace(".", ",");
                return `<article class="produto-cliente" data-categoria-produto="Sobremesas" data-favorito-id="${escapar(id)}">
                    <button class="favorito-produto" type="button" data-favoritar="${escapar(id)}" aria-label="Adicionar ${escapar(produto.nomeProd)} aos favoritos" aria-pressed="false">♡</button>
                    <img src="${escapar(produto.linkFotoProd)}" alt="${escapar(produto.nomeProd)}">
                    <div class="produto-separador"></div>
                    <div class="produto-info">
                        <img class="produto-restaurante-logo" src="${escapar(restaurante.linkLogoRes)}" alt="${escapar(restaurante.nomeRes)}">
                        <div class="produto-detalhes"><strong>${escapar(produto.nomeProd)}</strong><span>R$ ${preco}</span></div>
                    </div>
                    <small></small>
                </article>`;
            };
            function atualizarSobremesas() {
                const escolhido = seletorRestaurante?.selectedOptions[0]?.textContent.trim();
                const sobremesas = escolhido && escolhido !== "Todos os restaurantes"
                    ? todasSobremesas.filter(({ restaurante }) => restaurante.nomeRes === escolhido).slice(0, 6)
                    : todasSobremesas.slice(0, 6);

                listaSobremesas.innerHTML = sobremesas.map(renderizarSobremesa).join("");
                listaSobremesas.querySelectorAll("[data-favoritar]").forEach(botao => {
                    atualizarBotaoFavorito(botao);
                    botao.addEventListener("click", function() {
                        const idFavorito = botao.dataset.favoritar;
                        favoritos.has(idFavorito) ? favoritos.delete(idFavorito) : favoritos.add(idFavorito);
                        localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...favoritos]));
                        salvarDadosFavorito(idFavorito, botao, {
                            nome: ".produto-detalhes strong",
                            restaurante: ".produto-restaurante-logo",
                            preco: ".produto-detalhes span"
                        }, ".produto-restaurante-logo");
                        document.querySelectorAll(`[data-favoritar="${idFavorito}"]`).forEach(atualizarBotaoFavorito);
                    });
                });
                atualizarProdutosVisiveis();
            }
            seletorRestaurante?.addEventListener("change", atualizarSobremesas);
            atualizarSobremesas();
            window.setInterval(atualizarSobremesas, 60000);
        })
        .catch(erro => {
            console.error(erro);
            listaSobremesas.innerHTML = "<p class=\"cliente-legenda\">Não foi possível carregar as sobremesas.</p>";
        });
}

const CHAVE_FAVORITOS = chaveClienteUsuario("garfooFavoritosCliente");
let favoritos = new Set();

try {
    const favoritosSalvos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || "[]");

    if (Array.isArray(favoritosSalvos)) {
        favoritos = new Set(favoritosSalvos);
    }
} catch (erro) {
    console.error("Não foi possível carregar os favoritos:", erro);
}

function atualizarBotaoFavorito(botao) {
    const idFavorito = botao.dataset.favoritar;
    const marcado = favoritos.has(idFavorito);

    botao.classList.toggle("marcado", marcado);
    botao.setAttribute("aria-pressed", String(marcado));
    botao.textContent = marcado ? "♥" : "♡";
    botao.setAttribute(
        "aria-label",
        `${marcado ? "Remover" : "Adicionar"} ${botao.closest(".produto-cliente")?.querySelector(".produto-detalhes strong")?.textContent || "produto"} ${marcado ? "dos" : "aos"} favoritos`
    );
}

document.querySelectorAll("[data-favoritar]").forEach(botao => {
    atualizarBotaoFavorito(botao);

    botao.addEventListener("click", function() {
        const idFavorito = botao.dataset.favoritar;

        if (favoritos.has(idFavorito)) {
            favoritos.delete(idFavorito);
        } else {
            favoritos.add(idFavorito);
        }

        localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...favoritos]));
        salvarDadosFavorito(idFavorito, botao, {
            nome: ".produto-detalhes strong",
            restaurante: ".produto-restaurante-logo",
            preco: ".produto-detalhes span"
        }, ".produto-restaurante-logo");
        document.querySelectorAll(`[data-favoritar="${idFavorito}"]`).forEach(atualizarBotaoFavorito);
    });
});

function salvarDadosFavorito(id, botao, seletores, seletorLogo) {
    let dados = {};
    try { dados = JSON.parse(localStorage.getItem(chaveClienteUsuario("garfooDadosFavoritosCliente")) || "{}"); } catch {}
    if (!favoritos.has(id)) delete dados[id];
    else {
        const card = botao.closest(".produto-cliente");
        const texto = seletor => card?.querySelector(seletor)?.textContent.trim() || "";
        const imagem = card?.querySelector(`img:not(${seletorLogo})`);
        dados[id] = {
            nome: texto(seletores.nome),
            restaurante: card?.querySelector(seletores.restaurante)?.alt.replace(/^Logo (do restaurante )?/i, "").trim() || "",
            preco: texto(seletores.preco),
            imagem: imagem?.getAttribute("src") || "",
            logo: card?.querySelector(seletores.restaurante)?.getAttribute("src") || ""
        };
    }
    localStorage.setItem(chaveClienteUsuario("garfooDadosFavoritosCliente"), JSON.stringify(dados));
}

document.querySelectorAll("[data-carrossel-alvo]").forEach(botao => {
    botao.addEventListener("click", function() {
        const faixa = document.getElementById(botao.dataset.carrosselAlvo);
        const direcao = Number(botao.dataset.carrosselDirecao);

        if (!faixa) {
            return;
        }

        faixa.scrollBy({
            left: direcao * faixa.clientWidth * 0.8,
            behavior: "smooth"
        });
    });
});

botoesCategoria.forEach(botao => {
    botao.addEventListener("click", function() {
        botoesCategoria.forEach(item => item.classList.remove("categoria-ativa"));
        botao.classList.add("categoria-ativa");
        atualizarProdutosVisiveis();
    });
});

atualizarProdutosVisiveis();
