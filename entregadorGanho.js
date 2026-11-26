try {
    const usuario = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null");
    const tipos = [usuario?.modoAtivo, usuario?.tipo, usuario?.tipoUsuario, ...(Array.isArray(usuario?.perfis) ? usuario.perfis : [])]
        .map(tipo => String(tipo || "").trim().toLocaleLowerCase("pt-BR"));
    const ehEntregador = tipos.some(tipo => ["entregador", "delivery", "courier"].includes(tipo));
    const nome = ehEntregador ? (usuario?.perfilEntregador?.nomeUsuario || usuario?.dados?.nomeUsuario || usuario?.dados?.nomeCompleto || usuario?.nomeUsuario) : "";
    document.querySelectorAll("[data-driver-name]").forEach(item => item.textContent = String(nome || "").trim());
} catch (erro) { console.warn("Não foi possível ler o perfil salvo.", erro); }
