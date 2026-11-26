(function () {
    function sessaoAtual() {
        try { return JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null") || {}; }
        catch { return {}; }
    }
    function identidadeVisitante() {
        const chave = "garfoo-cliente-visitante-sessao";
        try {
            let id = sessionStorage.getItem(chave);
            if (!id) {
                id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
                sessionStorage.setItem(chave, id);
            }
            return id;
        } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
    }
    function identidade() {
        const sessaoBruta = sessaoAtual();
        const tipos = [sessaoBruta?.modoAtivo, sessaoBruta?.tipo, sessaoBruta?.tipoUsuario, ...(Array.isArray(sessaoBruta?.perfis) ? sessaoBruta.perfis : [])]
            .map(tipo => String(tipo || "").trim().toLocaleLowerCase("pt-BR"));
        const autenticado = tipos.some(tipo => ["cliente", "customer"].includes(tipo));
        const sessao = autenticado ? sessaoBruta : {};
        const dados = sessao.dados || sessao;
        const cpf = String(dados.cpf || dados.cpfUsuario || "").replace(/\D/g, "");
        const email = String(dados.emailUsuario || dados.email || sessao.emailUsuario || sessao.email || "").trim().toLocaleLowerCase("pt-BR");
        const nome = String(dados.nomeUsuario || dados.nome || sessao.nomeUsuario || "").trim().toLocaleLowerCase("pt-BR");
        const origem = autenticado ? (cpf || email || nome || "cliente-sem-identificador") : `visitante-${identidadeVisitante()}`;
        let hash = 2166136261;
        for (let indice = 0; indice < origem.length; indice++) {
            hash ^= origem.charCodeAt(indice);
            hash = Math.imul(hash, 16777619);
        }
        return { id: `cliente-${(hash >>> 0).toString(36)}`, email, nome, autenticado };
    }
    const atual = identidade();
    function chave(base) { return `${base}::${atual.id}`; }
    function pertence(pedido) {
        if (!atual.autenticado || !pedido || typeof pedido !== "object") return false;
        if (pedido.clienteId) return String(pedido.clienteId) === atual.id;
        if (atual.email && pedido.clienteEmail) return String(pedido.clienteEmail).trim().toLocaleLowerCase("pt-BR") === atual.email;
        // Pedidos antigos sem vínculo explícito não podem ser atribuídos por nome:
        // duas pessoas podem ter o mesmo nome, o que exporia dados de outra conta.
        return false;
    }
    function listarPedidos() {
        if (!atual.autenticado) return [];
        try {
            const pedidos = JSON.parse(localStorage.getItem("garfooPedidosCliente") || "[]");
            return Array.isArray(pedidos) ? pedidos.filter(pertence) : [];
        } catch { return []; }
    }
    window.GarfooClienteStore = { identidade: () => ({ ...atual }), chave, pertence, listarPedidos };
})();
