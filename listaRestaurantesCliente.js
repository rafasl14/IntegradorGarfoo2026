(function configurarListaSuspensaDeRestaurantes() {
    const abrir = document.querySelector("[data-abrir-lista-restaurantes]");
    const fechar = document.querySelector("[data-fechar-lista-restaurantes]");
    const lista = document.querySelector("[data-lista-restaurantes-suspensa]");
    const itens = document.querySelector("[data-itens-lista-restaurantes]");
    const mensagem = document.querySelector("[data-mensagem-lista-restaurantes]");

    if (!abrir || !fechar || !lista || !itens || !mensagem) {
        return;
    }

    let carregada = false;

    function escaparHtml(texto) {
        return String(texto || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function obterCategorias(restaurante) {
        const categorias = restaurante.cardapio
            .map(item => item.produto?.categoria?.nomeCategoria)
            .filter(Boolean)
            .filter((categoria, indice, listaCategorias) => listaCategorias.indexOf(categoria) === indice);

        return categorias.slice(0, 2).join(" • ") || "Diversas opções";
    }

    function renderizar(restaurantes) {
        itens.innerHTML = restaurantes.map(restaurante => {
            const nome = escaparHtml(restaurante.nomeRes);
            const logo = escaparHtml(restaurante.linkLogoRes);
            const categorias = escaparHtml(obterCategorias(restaurante));

            return `
                <a class="lista-restaurante-item" href="cliente.html?restaurante=${encodeURIComponent(restaurante.nomeRes)}">
                    <img src="${logo}" alt="Logo do restaurante ${nome}">
                    <span>
                        <strong>${nome}</strong>
                        <small>${categorias}</small>
                    </span>
                </a>
            `;
        }).join("");

        mensagem.textContent = `${restaurantes.length} restaurantes encontrados.`;
        carregada = true;
    }

    function carregar() {
        mensagem.textContent = "Carregando restaurantes...";

        fetch("cardapios_restaurantes.json?v=20261114-7")
            .then(resposta => {
                if (!resposta.ok) {
                    throw new Error("Não foi possível carregar os restaurantes.");
                }

                return resposta.json();
            })
            .then(dados => {
                const restaurantes = Array.isArray(dados.restaurantes) ? dados.restaurantes : [];
                renderizar(restaurantes);
            })
            .catch(erro => {
                console.error(erro);
                mensagem.textContent = "Não foi possível carregar os restaurantes. Abra o projeto em um servidor local.";
            });
    }

    abrir.addEventListener("click", () => {
        const deveAbrir = lista.hidden;

        lista.hidden = !deveAbrir;
        abrir.setAttribute("aria-expanded", String(deveAbrir));

        if (deveAbrir && !carregada) {
            carregar();
        }
    });

    fechar.addEventListener("click", () => {
        lista.hidden = true;
        abrir.setAttribute("aria-expanded", "false");
        abrir.focus();
    });
})();
