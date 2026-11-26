(function () {
    const CHAVE_CONTAS = "garfooContasCadastradas";
    const destinos = {
        cliente: "cliente.html",
        entregador: "entregadorComLogin.html",
        proprietario: "proprietario.html",
        administrador: "indexAdm.html"
    };
    function tipoDaConta(conta) {
        const tipo = String(conta?.tipo || conta?.tipoUsuario || "").trim().toLocaleLowerCase("pt-BR");
        if (["entregador", "delivery", "courier"].includes(tipo)) return "entregador";
        if (["proprietario", "proprietário", "restaurante", "owner"].includes(tipo)) return "proprietario";
        if (["administrador", "admin"].includes(tipo)) return "administrador";
        if (["cliente", "customer"].includes(tipo)) return "cliente";
        return tipo;
    }
    function destinoDaConta(conta) {
        return destinos[tipoDaConta(conta)] || null;
    }

    function lerContas() {
        try {
            const contas = JSON.parse(localStorage.getItem(CHAVE_CONTAS) || "[]");
            return Array.isArray(contas) ? contas : [];
        } catch { return []; }
    }
    function emailConta(conta) {
        return String(conta?.dados?.emailUsuario || conta?.emailUsuario || "").trim().toLocaleLowerCase("pt-BR");
    }
    function cpfConta(conta) {
        return String(conta?.dados?.cpf || conta?.cpf || "").replace(/\D/g, "");
    }
    function mesmaPessoa(primeira, segunda) {
        const cpf = cpfConta(primeira);
        const email = emailConta(primeira);
        return Boolean((cpf && cpf === cpfConta(segunda)) || (email && email === emailConta(segunda)));
    }
    function perfilDeEntregador(conta) {
        const perfilAtual = conta?.perfilEntregador || {};
        if (perfilAtual.tipoVeiculo || conta?.dados?.tipoVeiculo) {
            return { ...perfilAtual, ...(conta?.dados?.tipoVeiculo ? conta.dados : {}) };
        }
        const vinculado = lerContas().find(registro => tipoDaConta(registro) === "entregador" && mesmaPessoa(conta, registro));
        if (!vinculado) return null;
        const dados = vinculado.perfilEntregador || vinculado.dados || {};
        return dados.tipoVeiculo ? { ...dados } : null;
    }
    function perfilDeProprietario(conta) {
        const perfilAtual = conta?.perfilProprietario || {};
        if (perfilAtual.nomeRes || perfilAtual.cnpj) return { ...perfilAtual };
        const vinculado = lerContas().find(registro => tipoDaConta(registro) === "proprietario" && mesmaPessoa(conta, registro));
        if (!vinculado) return null;
        const dados = vinculado.perfilProprietario || vinculado.dados || {};
        return dados.nomeRes || dados.cnpj ? { ...dados } : null;
    }
    function perfisDaConta(conta) {
        const perfis = new Set([tipoDaConta(conta)]);
        (Array.isArray(conta?.perfis) ? conta.perfis : []).forEach(tipo => perfis.add(tipoDaConta({ tipo })));
        if (perfilDeEntregador(conta)) perfis.add("entregador");
        if (perfilDeProprietario(conta)) perfis.add("proprietario");
        lerContas().filter(registro => mesmaPessoa(conta, registro)).forEach(registro => perfis.add(tipoDaConta(registro)));
        return [...perfis].filter(tipo => ["cliente", "entregador", "proprietario"].includes(tipo));
    }
    function salvarConta(conta) {
        const contas = lerContas();
        const tipo = String(conta?.tipo || "");
        const email = emailConta(conta);
        const cpf = cpfConta(conta);
        const indice = contas.findIndex(existente => tipoDaConta(existente) === tipoDaConta(conta) && mesmaPessoa(conta, existente));
        if (indice >= 0) contas[indice] = conta;
        else contas.push(conta);
        localStorage.setItem(CHAVE_CONTAS, JSON.stringify(contas));
        return conta;
    }
    function localizarConta(identificador, senha) {
        const entrada = String(identificador || "").trim();
        const emailEntrada = entrada.toLocaleLowerCase("pt-BR");
        const cpfEntrada = entrada.replace(/\D/g, "");
        return lerContas().find(conta => {
            const dados = conta?.dados || {};
            const corresponde = emailEntrada.includes("@")
                ? emailConta(conta) === emailEntrada
                : cpfEntrada.length === 11 && cpfConta(conta) === cpfEntrada;
            return corresponde && String(dados.senhaUsuario || "") === String(senha || "") && destinoDaConta(conta);
        }) || null;
    }
    async function localizarAdministrador(identificador, senha) {
        const entrada = String(identificador || "").trim();
        const emailEntrada = entrada.toLocaleLowerCase("pt-BR");
        const cpfEntrada = entrada.replace(/\D/g, "");
        if (!emailEntrada.includes("@") && cpfEntrada.length !== 11) return null;
        try {
            const resposta = await fetch("cardapios_restaurantes.json", { cache: "no-store" });
            if (!resposta.ok) return null;
            const dadosSistema = await resposta.json();
            const usuario = (dadosSistema.usuarios || []).find(registro => {
                if (tipoDaConta({ tipo: registro.tipoUsuario || registro.tipo }) !== "administrador") return false;
                const emailCorresponde = emailEntrada.includes("@")
                    && String(registro.emailUsuario || "").trim().toLocaleLowerCase("pt-BR") === emailEntrada;
                const cpfCorresponde = cpfEntrada.length === 11
                    && String(registro.cpfUsuario || registro.cpf || "").replace(/\D/g, "") === cpfEntrada;
                return (emailCorresponde || cpfCorresponde) && String(registro.senhaUsuario || "") === String(senha || "");
            });
            if (!usuario) return null;
            return {
                tipo: "administrador",
                tipoUsuario: "administrador",
                id: usuario.codUsuario,
                dados: {
                    ...usuario,
                    idUsuario: usuario.codUsuario,
                    nomeUsuario: usuario.nomeUsuario,
                    cpf: usuario.cpfUsuario || "",
                    emailUsuario: usuario.emailUsuario || "",
                    senhaUsuario: usuario.senhaUsuario || ""
                }
            };
        } catch (erro) {
            console.error("Não foi possível validar as credenciais do administrador:", erro);
            return null;
        }
    }
    async function localizarUsuarioJSON(identificador, senha) {
        const entrada = String(identificador || "").trim();
        const emailEntrada = entrada.toLocaleLowerCase("pt-BR");
        const cpfEntrada = entrada.replace(/\D/g, "");
        if (!emailEntrada.includes("@") && cpfEntrada.length !== 11) return null;
        try {
            const resposta = await fetch("cardapios_restaurantes.json", { cache: "no-store" });
            if (!resposta.ok) return null;
            const sistema = await resposta.json();
            const usuario = (sistema.usuarios || []).find(registro => {
                const tipo = tipoDaConta({ tipo: registro.tipoUsuario || registro.tipo });
                if (!["cliente", "entregador", "proprietario"].includes(tipo)) return false;
                const emailCorresponde = emailEntrada.includes("@")
                    && String(registro.emailUsuario || "").trim().toLocaleLowerCase("pt-BR") === emailEntrada;
                const cpfCorresponde = cpfEntrada.length === 11
                    && String(registro.cpfUsuario || registro.cpf || "").replace(/\D/g, "") === cpfEntrada;
                return (emailCorresponde || cpfCorresponde)
                    && String(registro.senhaUsuario || "") === String(senha || "");
            });
            if (!usuario) return null;
            const tipo = tipoDaConta({ tipo: usuario.tipoUsuario || usuario.tipo });
            const id = usuario.codUsuario;
            const conta = {
                tipo, tipoUsuario: tipo, id,
                dados: { ...usuario, idUsuario: id, cpf: usuario.cpfUsuario || "" },
                modoAtivo: tipo
            };
            if (tipo === "entregador") {
                const perfil = (sistema.entregadores || []).find(item => Number(item.codEntregador) === Number(usuario.codEntregador || id));
                if (perfil) conta.perfilEntregador = { ...perfil };
            }
            if (tipo === "proprietario") {
                const restaurante = (sistema.restaurantes || []).find(item => Number(item.codRestaurante) === Number(usuario.codRestaurante)
                    || Number(item.codProprie) === Number(usuario.codProprie));
                const codProprie = Number(usuario.codProprie || restaurante?.codProprie || id);
                const proprietario = (sistema.proprietarios || []).find(item => Number(item.codProprie) === codProprie);
                conta.codProprie = codProprie;
                conta.perfilProprietario = {
                    ...(proprietario || {}), ...(restaurante || {}),
                    codProprie, codRestaurante: restaurante?.codRestaurante,
                    cnpj: proprietario?.cnpjProprie || ""
                };
            }
            return conta;
        } catch (erro) {
            console.error("Não foi possível validar o cadastro:", erro);
            return null;
        }
    }
    window.GarfooContas = { destinos, lerContas, salvarConta, localizarConta, localizarAdministrador, localizarUsuarioJSON, tipoDaConta, destinoDaConta, perfilDeEntregador, perfilDeProprietario, perfisDaConta };
})();
