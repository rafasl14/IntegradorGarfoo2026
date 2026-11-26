(function configurarAtalhoContaCliente() {
    try {
        const usuario = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "{}");
        const foto = usuario.dados?.fotoPerfil || usuario.fotoPerfil;
        if (foto) document.querySelectorAll(".cliente-avatar").forEach(avatar => {
            avatar.style.backgroundImage = `url("${foto.replace(/["\\\\]/g, "\\\\$&")}")`;
            avatar.style.backgroundSize = "cover";
        });
    } catch (erro) {
        console.error("Não foi possível carregar a foto de perfil:", erro);
    }
    const abrirConta = elemento => {
        elemento.setAttribute("role", "link");
        elemento.setAttribute("tabindex", "0");
        elemento.setAttribute("aria-label", "Abrir minha conta");
        elemento.style.cursor = "pointer";
        elemento.addEventListener("click", () => { window.location.href = "minhaContaCliente.html"; });
        elemento.addEventListener("keydown", evento => {
            if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                window.location.href = "minhaContaCliente.html";
            }
        });
    };

    document.querySelectorAll(".cliente-avatar, [data-saudacao-usuario]").forEach(elemento => {
        if (elemento.matches("[data-saudacao-usuario]")) elemento.style.fontWeight = "700";
        abrirConta(elemento);
    });
})();
