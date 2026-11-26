document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".entregador-publico a[href^='#']").forEach(link => {
        link.addEventListener("click", event => {
            const alvo = document.querySelector(link.getAttribute("href"));

            if (!alvo) {
                return;
            }

            event.preventDefault();
            alvo.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    const secoes = document.querySelectorAll(".entregador-publico main section[id]");
    const links = document.querySelectorAll(".entregador-publico nav a[href^='#']");

    const atualizarNavegacao = () => {
        const posicao = window.scrollY + 120;
        let secaoAtual = "inicio";

        secoes.forEach(secao => {
            if (secao.offsetTop <= posicao) {
                secaoAtual = secao.id;
            }
        });

        links.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === `#${secaoAtual}`);
        });
    };

    window.addEventListener("scroll", atualizarNavegacao, { passive: true });
    atualizarNavegacao();
});
