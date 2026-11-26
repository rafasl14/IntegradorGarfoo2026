(function carregarListaDeRestaurantes() {
    const lista = document.querySelector("[data-lista-restaurantes]");
    const mensagem = document.querySelector("[data-mensagem-restaurantes]");
    const saudacao = document.querySelector("[data-saudacao-usuario]");

    if (!lista || !mensagem) {
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

    function obterCategoria(restaurante) {
        const categorias = restaurante.cardapio
            .map(item => item.produto?.categoria?.nomeCategoria)
            .filter(Boolean)
            .filter((categoria, indice, listaCategorias) => listaCategorias.indexOf(categoria) === indice);

        return categorias.slice(0, 2).join(" • ") || "Diversas opções";
    }

    function renderizarRestaurantes(restaurantes) {
        lista.innerHTML = restaurantes.map(restaurante => {
            const nome = escaparHtml(restaurante.nomeRes);
            const logo = escaparHtml(restaurante.linkLogoRes);
            const avaliacao = Number(restaurante.avaliacaoRes || 0).toFixed(1).replace(".", ",");
            const quantidade = restaurante.cardapio?.length || 0;

            return `
                <article class="restaurante-cliente-card">
                    <div class="restaurante-cliente-logo">
                        <img src="${logo}" alt="Logo do restaurante ${nome}">
                    </div>
                    <h2>${nome}</h2>
                    <p class="restaurante-cliente-categoria">${escaparHtml(obterCategoria(restaurante))}</p>
                    <div class="restaurante-cliente-detalhes">
                        <span>★ ${avaliacao}</span>
                        <span>${quantidade} pratos</span>
                    </div>
                    <a class="restaurante-cliente-botao" href="cliente.html?restaurante=${encodeURIComponent(restaurante.nomeRes)}">
                        Ver cardápio
                    </a>
                </article>
            `;
        }).join("");

        mensagem.textContent = `${restaurantes.length} restaurantes encontrados.`;
    }

    fetch("cardapios_restaurantes.json?v=20261114-7")
        .then(resposta => {
            if (!resposta.ok) {
                throw new Error("Não foi possível carregar os restaurantes.");
            }

            return resposta.json();
        })
        .then(dados => {
            const restaurantes = Array.isArray(dados.restaurantes) ? dados.restaurantes : [];
            renderizarRestaurantes(restaurantes);
        })
        .catch(erro => {
            console.error(erro);
            mensagem.textContent = "Não foi possível carregar os restaurantes. Abra o projeto em um servidor local.";
        });
})();
