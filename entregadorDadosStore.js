(function () {
    let sessao = {};
    try { sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "{}"); } catch {}
    const ehEntregador = String(sessao?.modoAtivo || sessao?.tipo || "").trim().toLocaleLowerCase("pt-BR") === "entregador";
    const cadastro = ehEntregador ? { ...(sessao.perfilEntregador || {}), ...(sessao.dados || sessao || {}) } : {};
    const cpf = String(cadastro.cpf || "").replace(/\D/g, "");
    const email = String(cadastro.emailUsuario || cadastro.email || "").trim().toLocaleLowerCase("pt-BR");
    const origem = ehEntregador ? (cpf || email || "entregador-sem-identificador") : "perfil-sem-entregador";
    let hash = 2166136261;
    for (let indice = 0; indice < origem.length; indice++) {
        hash ^= origem.charCodeAt(indice);
        hash = Math.imul(hash, 16777619);
    }
    const id = (hash >>> 0).toString(36);
    const chave = base => `${base}::${id}`;
    const ler = (base, padrao = null) => {
        try {
            const valor = localStorage.getItem(chave(base));
            return valor === null ? padrao : JSON.parse(valor);
        } catch { return padrao; }
    };
    const salvar = (base, valor) => localStorage.setItem(chave(base), JSON.stringify(valor));
    function obterFotoPerfil() {
        const configuracao = ehEntregador ? ler("garfoo-entregador-config", {}) : {};
        const fotoSalvaNaConta = cadastro.fotoPerfil || sessao.fotoPerfil || "";
        const fotoSalvaNasConfiguracoes = configuracao?.fotoPerfilDono === id ? configuracao.fotoPerfil : "";
        return String(fotoSalvaNaConta || fotoSalvaNasConfiguracoes || "");
    }
    function aplicarFotoPerfil(foto = obterFotoPerfil()) {
        document.querySelectorAll(".entregador-avatar-vazio").forEach(atual => {
            if (ehEntregador && foto && atual.tagName !== "IMG") {
                const imagem = document.createElement("img");
                imagem.className = "entregador-avatar-vazio";
                imagem.src = foto;
                imagem.alt = "Foto de perfil do entregador";
                atual.replaceWith(imagem);
            } else if ((!ehEntregador || !foto) && atual.tagName === "IMG") {
                const placeholder = document.createElement("span");
                placeholder.className = "entregador-avatar-vazio";
                placeholder.setAttribute("aria-hidden", "true");
                atual.replaceWith(placeholder);
            } else if (ehEntregador && foto && atual.tagName === "IMG" && atual.src !== foto) {
                atual.src = foto;
            }
        });
    }
    window.GarfooEntregadorDados = { ehEntregador, sessao, cadastro, id, chave, ler, salvar, obterFotoPerfil, aplicarFotoPerfil };
    aplicarFotoPerfil();
})();
