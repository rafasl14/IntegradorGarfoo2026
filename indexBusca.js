(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
        return;
    }

    root.GarfooBusca = factory();
})(typeof self !== "undefined" ? self : this, function () {
    function normalizaTexto(texto) {
        return String(texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function criarResultado(restaurante, item) {
        const produto = item?.produto;

        if (!produto?.nomeProd) {
            return null;
        }

        return {
            comida: produto.nomeProd,
            descricao: produto.descricaoProd || "",
            preco: Number(item.precoItemCardapio) || 0,
            restaurante: restaurante.nomeRes || "Restaurante",
            foto: produto.linkFotoProd || "",
            logo: restaurante.linkLogoRes || ""
        };
    }

    function selecionarResultados(restaurantes, texto) {
        const busca = normalizaTexto(texto);
        const resultados = [];

        if (!busca || !Array.isArray(restaurantes)) {
            return resultados;
        }

        restaurantes.forEach(restaurante => {
            const cardapio = Array.isArray(restaurante.cardapio)
                ? restaurante.cardapio
                : [];
            const nomeRestaurante = normalizaTexto(restaurante.nomeRes);

            if (nomeRestaurante.includes(busca)) {
                const produtosAdicionados = new Set();

                cardapio.forEach(item => {
                    const produto = item?.produto;
                    const chaveProduto = normalizaTexto(produto?.nomeProd);

                    if (!chaveProduto || produtosAdicionados.has(chaveProduto)) {
                        return;
                    }

                    const resultado = criarResultado(restaurante, item);

                    if (resultado) {
                        resultados.push(resultado);
                        produtosAdicionados.add(chaveProduto);
                    }
                });

                return;
            }

            const itensEncontrados = cardapio.filter(item => {
                const produto = item?.produto || {};
                const nomeComida = normalizaTexto(produto.nomeProd);
                const categoria = normalizaTexto(produto.categoria?.nomeCategoria);

                return nomeComida.includes(busca) || categoria.includes(busca);
            });

            if (itensEncontrados.length === 0) {
                return;
            }

            const itemMaisBarato = itensEncontrados.reduce((menor, atual) => {
                const precoMenor = Number(menor.precoItemCardapio) || 0;
                const precoAtual = Number(atual.precoItemCardapio) || 0;

                return precoAtual < precoMenor ? atual : menor;
            });

            const resultado = criarResultado(restaurante, itemMaisBarato);

            if (resultado) {
                resultados.push(resultado);
            }
        });

        return resultados;
    }

    function iniciarBusca() {
        const formulario = document.getElementById("form-pesquisa");
        const campoPesquisa = document.getElementById("pesquisa");
        const area = document.getElementById("resultados");
        const areaPesquisa = document.getElementById("area-resultados-pesquisa");
        const hero = document.querySelector(".hero");
        const botaoVoltar = document.getElementById("voltar-inicio");

        if (!formulario || !campoPesquisa || !area || !areaPesquisa || !hero || !botaoVoltar) {
            return;
        }

        let restaurantes = [];
        let dadosCarregados = false;
        let erroAoCarregarDados = null;

        const carregamentoRestaurantes = fetch("cardapios_restaurantes.json?v=20261114-7")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Não foi possível carregar o JSON");
                }

                return response.json();
            })
            .then(dados => {
                restaurantes = Array.isArray(dados?.restaurantes)
                    ? dados.restaurantes
                    : [];
                dadosCarregados = true;
                console.log("JSON carregado:", restaurantes);
            })
            .catch(erro => {
                erroAoCarregarDados = erro;
                console.error("Erro:", erro);
            });

        function mostrarMensagemResultados(mensagem) {
            document.body.classList.add("modo-pesquisa");
            areaPesquisa.style.display = "block";
            hero.classList.add("hero-com-pesquisa");
            hero.style.boxShadow = "0 12px 30px #f57a03";
            area.innerHTML = "";

            const aviso = document.createElement("p");
            aviso.className = "resultado-vazio";
            aviso.textContent = mensagem;
            area.appendChild(aviso);
        }

        function mostrarResultados(resultados) {
            document.body.classList.add("modo-pesquisa");
            areaPesquisa.style.display = "block";
            hero.classList.add("hero-com-pesquisa");
            hero.style.boxShadow = "0 12px 30px #f57a03";
            area.innerHTML = "";

            if (resultados.length === 0) {
                mostrarMensagemResultados("Nenhum restaurante ou prato encontrado.");
                return;
            }

            const contador = document.createElement("p");
            contador.className = "resultados-contador";
            contador.textContent = `${resultados.length} produto(s) encontrado(s)`;
            area.appendChild(contador);

            resultados.forEach(item => {
                const card = document.createElement("article");
                card.className = "resultado-card";

                const imagem = document.createElement("img");
                imagem.className = "resultado-imagem";
                imagem.src = item.foto;
                imagem.alt = item.comida;

                const logo = document.createElement("img");
                logo.className = "resultado-logo";
                logo.src = item.logo;
                logo.alt = `Logo do restaurante ${item.restaurante}`;

                const restaurante = document.createElement("h2");
                restaurante.textContent = item.restaurante;

                const comida = document.createElement("h3");
                comida.textContent = item.comida;

                const descricao = document.createElement("p");
                descricao.textContent = item.descricao;

                const preco = document.createElement("strong");
                preco.className = "resultado-preco";
                preco.textContent = item.preco.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                });

                card.append(imagem, logo, restaurante, comida, descricao, preco);
                area.appendChild(card);
            });
        }

        function pesquisarComida() {
            const texto = normalizaTexto(campoPesquisa.value);

            if (!texto) {
                document.body.classList.remove("modo-pesquisa");
                area.innerHTML = "";
                areaPesquisa.style.display = "none";
                hero.style.boxShadow = "";
                hero.classList.remove("hero-com-pesquisa");
                return;
            }

            if (!dadosCarregados) {
                mostrarMensagemResultados(
                    erroAoCarregarDados
                        ? "Não foi possível carregar os restaurantes. Abra o projeto usando um servidor local."
                        : "Carregando restaurantes..."
                );

                if (!erroAoCarregarDados) {
                    carregamentoRestaurantes.then(pesquisarComida);
                }

                return;
            }

            mostrarResultados(selecionarResultados(restaurantes, texto));
        }

        formulario.addEventListener("submit", event => {
            event.preventDefault();
            pesquisarComida();
        });

        botaoVoltar.addEventListener("click", () => {
            campoPesquisa.value = "";
            document.body.classList.remove("modo-pesquisa");
            area.innerHTML = "";
            areaPesquisa.style.display = "none";
            hero.style.boxShadow = "";
            hero.classList.remove("hero-com-pesquisa");
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    return {
        normalizaTexto,
        selecionarResultados,
        iniciarBusca
    };
});

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            window.GarfooBusca.iniciarBusca();
        });
    } else {
        window.GarfooBusca.iniciarBusca();
    }
}
