(() => {
    const armazenamentoEntregador = window.GarfooEntregadorDados;
    const STORAGE_KEY = armazenamentoEntregador.chave("garfoo-entregador-config");
    if (!armazenamentoEntregador.ehEntregador) {
        const avisoPerfil = document.querySelector("[data-aviso-perfil-entregador]");
        if (avisoPerfil) avisoPerfil.hidden = false;
        document.querySelectorAll(".config-grid input, .config-grid select, .config-grid button").forEach(campo => {
            campo.disabled = true;
            if (campo.tagName !== "BUTTON") campo.value = "";
        });
        return;
    }
    const formatos = {
        cpf: value => value.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
        telefone: value => { const d = value.replace(/\D/g, "").slice(0, 11); return d.length < 3 ? d : `(${d.slice(0,2)}) ${d.slice(2,7)}${d.length > 7 ? `-${d.slice(7)}` : ""}`; },
        cep: value => value.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2"),
        data: value => value.replace(/\D/g, "").slice(0, 8).replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2"),
        rg: value => value.toUpperCase().replace(/[^0-9X]/g, "").replace(/X/g, "").slice(0, 8) + (value.toUpperCase().includes("X") ? "X" : ""),
        cnh: value => value.replace(/\D/g, "").slice(0, 11),
        placa: value => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)
    };
    function cpfValido(value) {
        const d = value.replace(/\D/g, "");
        if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
        const digito = (base, peso) => { let soma = 0; for (const n of base) soma += Number(n) * peso--; const resto = soma % 11; return resto < 2 ? 0 : 11 - resto; };
        return digito(d.slice(0, 9), 10) === Number(d[9]) && digito(d.slice(0, 10), 11) === Number(d[10]);
    }
    function dataValida(value) {
        const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
        if (!match) return false;
        const [, ds, ms, ys] = match, d = Number(ds), m = Number(ms), y = Number(ys), date = new Date(y, m - 1, d);
        return y >= 1900 && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date <= new Date();
    }
    function erroDoCampo(campo) {
        const v = campo.value.trim(), tipo = campo.dataset.mascara;
        if (!v) return "";
        if (tipo === "cpf" && !cpfValido(v)) return "Informe um CPF válido.";
        if (tipo === "telefone" && v.replace(/\D/g, "").length !== 11) return "Informe um telefone com DDD.";
        if (tipo === "cep" && v.replace(/\D/g, "").length !== 8) return "Informe um CEP com 8 dígitos.";
        if (tipo === "data" && !dataValida(v)) return "Informe uma data válida, anterior ou igual a hoje.";
        if (tipo === "rg" && !/^(?:\d{5,9}|\d{5,8}X)$/.test(v)) return "Informe de 5 a 9 dígitos, com X opcional no final.";
        if (tipo === "cnh" && !/^\d{11}$/.test(v)) return "A CNH deve conter 11 dígitos.";
        if (tipo === "placa" && !/^[A-Z]{3}\d[A-Z]\d{2}$/.test(v) && !/^[A-Z]{3}\d{4}$/.test(v)) return "Informe uma placa válida.";
        if (campo.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Informe um e-mail válido.";
        return "";
    }
    window.GarfooDocumentoUtils = { formatar: (tipo, value) => formatos[tipo]?.(value) ?? value, cpfValido, dataValida, erroDoCampo };

    let dados = {};
    try { dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { dados = {}; }
    if (dados.fotoPerfil && dados.fotoPerfilDono !== armazenamentoEntregador.id) {
        delete dados.fotoPerfil;
        delete dados.fotoPerfilDono;
    }
    const sessaoCadastro = armazenamentoEntregador.sessao;
    const cadastro = armazenamentoEntregador.cadastro;
    const dataNascimento = String(cadastro.dataNascimento || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const dadosDoCadastro = {
        conta: {
            nome: cadastro.nomeUsuario || cadastro.nome || "",
            email: cadastro.emailUsuario || cadastro.email || "",
            telefone: cadastro.telefone || "",
            sexo: cadastro.sexo || "",
            cpf: cadastro.cpf || dados.documentos?.cpf || "",
            nascimento: dataNascimento ? `${dataNascimento[3]}/${dataNascimento[2]}/${dataNascimento[1]}` : dados.documentos?.nascimento || "",
            cep: cadastro.cep || dados.documentos?.cep || ""
        },
        veiculo: {
            veiculo: cadastro.tipoVeiculo || "",
            ano: cadastro.anoVeiculo || "",
            modelo: cadastro.modeloVeiculo || "",
            placa: cadastro.placaVeiculo || "",
            cnh: cadastro.numeroCnhEntregador || ""
        }
    };
    Object.entries(dadosDoCadastro).forEach(([secao, valores]) => {
        const preenchidosNoCadastro = Object.fromEntries(Object.entries(valores).filter(([, valor]) => valor !== "" && valor != null));
        dados[secao] = { ...(dados[secao] || {}), ...preenchidosNoCadastro };
    });
    const identificadorLogin = document.querySelector("[data-login-email-atual]");
    if (identificadorLogin) identificadorLogin.value = cadastro.emailUsuario || cadastro.email || dados.conta?.email || "";
    const campoSenhaAtual = document.querySelector("[data-salvar-login] [name=senhaAtual]");
    if (campoSenhaAtual) campoSenhaAtual.value = cadastro.senhaUsuario || "";
    document.querySelectorAll("[data-config-form]").forEach(form => {
        const secao = form.dataset.configForm, salvos = dados[secao] || {};
        Object.entries(salvos).forEach(([nome, valor]) => { const campo = form.elements.namedItem(nome); if (campo) campo.value = campo.type === "checkbox" ? Boolean(valor) : valor; });
        form.querySelectorAll("[data-mascara]").forEach(campo => campo.value = formatos[campo.dataset.mascara](campo.value));
        form.querySelectorAll("[data-mascara]").forEach(campo => campo.addEventListener("input", () => { campo.value = formatos[campo.dataset.mascara](campo.value); validar(campo); }));
        form.querySelectorAll("input[type=email]").forEach(campo => campo.addEventListener("input", () => validar(campo)));
        form.addEventListener("submit", evento => {
            evento.preventDefault();
            const campos = [...form.querySelectorAll("input:not([type=checkbox]),select")];
            const invalidos = campos.filter(campo => !validar(campo));
            const status = form.querySelector("[data-status-config]");
            if (invalidos.length) { status.textContent = "Revise os campos destacados."; invalidos[0].focus(); return; }
            const registro = Object.fromEntries(new FormData(form).entries());
            form.querySelectorAll('input[type="checkbox"]').forEach(campo => registro[campo.name] = campo.checked);
            dados[secao] = registro;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
            status.textContent = "Informações salvas neste navegador.";
            if (secao === "conta") {
                if (registro.nome) document.querySelectorAll("[data-driver-name]").forEach(el => el.textContent = registro.nome);
                try {
                    const sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null");
                    if (armazenamentoEntregador.ehEntregador && sessao?.dados) {
                        sessao.dados.nomeUsuario = registro.nome || sessao.dados.nomeUsuario;
                        sessao.dados.emailUsuario = registro.email || sessao.dados.emailUsuario;
                        sessao.dados.telefone = registro.telefone || sessao.dados.telefone;
                        sessao.dados.sexo = registro.sexo || sessao.dados.sexo;
                        sessao.dados.cpf = registro.cpf || sessao.dados.cpf;
                        if (registro.nascimento) {
                            const [dia, mes, ano] = registro.nascimento.split("/");
                            sessao.dados.dataNascimento = `${ano}-${mes}-${dia}`;
                        }
                        sessao.dados.rg = registro.rg || sessao.dados.rg;
                        sessao.dados.cep = registro.cep || sessao.dados.cep;
                        localStorage.setItem("garfooUsuarioLogado", JSON.stringify(sessao));
                    }
                    if (identificadorLogin) identificadorLogin.value = registro.email || registro.cpf || "";
                } catch {}
            }
            if (secao === "veiculo") {
                try {
                    const sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null");
                    if (armazenamentoEntregador.ehEntregador && sessao?.dados) {
                        sessao.dados.tipoVeiculo = registro.veiculo || sessao.dados.tipoVeiculo;
                        sessao.dados.anoVeiculo = registro.ano || sessao.dados.anoVeiculo;
                        sessao.dados.modeloVeiculo = registro.modelo || sessao.dados.modeloVeiculo;
                        sessao.dados.placaVeiculo = registro.placa || sessao.dados.placaVeiculo;
                        sessao.dados.numeroCnhEntregador = registro.cnh || sessao.dados.numeroCnhEntregador;
                        localStorage.setItem("garfooUsuarioLogado", JSON.stringify(sessao));
                    }
                } catch {}
            }
        });
    });
    const campoFotoPerfil = document.querySelector("[data-foto-perfil-input]");
    const previaFotoPerfil = document.querySelector("[data-foto-perfil-preview]");
    const textoFotoVazia = document.querySelector("[data-foto-perfil-vazio]");
    const botaoRemoverFoto = document.querySelector("[data-remover-foto-perfil]");
    const statusFoto = document.querySelector("[data-status-foto-perfil]");
    function atualizarFotoPerfil(foto) {
        if (foto) {
            previaFotoPerfil.src = foto;
            previaFotoPerfil.hidden = false;
            textoFotoVazia.hidden = true;
            botaoRemoverFoto.hidden = false;
        } else {
            previaFotoPerfil.removeAttribute("src");
            previaFotoPerfil.hidden = true;
            textoFotoVazia.hidden = false;
            botaoRemoverFoto.hidden = true;
        }
        armazenamentoEntregador.aplicarFotoPerfil(foto || "");
    }
    atualizarFotoPerfil(dados.fotoPerfil || "");
    campoFotoPerfil?.addEventListener("change", () => {
        const arquivo = campoFotoPerfil.files?.[0];
        if (!arquivo) return;
        if (!arquivo.type.startsWith("image/")) {
            statusFoto.textContent = "Selecione um arquivo de imagem.";
            campoFotoPerfil.value = "";
            return;
        }
        if (arquivo.size > 8 * 1024 * 1024) {
            statusFoto.textContent = "A imagem deve ter no máximo 8 MB.";
            campoFotoPerfil.value = "";
            return;
        }
        const leitor = new FileReader();
        leitor.onerror = () => { statusFoto.textContent = "Não foi possível carregar essa imagem."; };
        leitor.onload = () => {
            const imagem = new Image();
            imagem.onerror = () => { statusFoto.textContent = "Não foi possível abrir essa imagem."; };
            imagem.onload = () => {
                const escala = Math.min(1, 512 / Math.max(imagem.naturalWidth, imagem.naturalHeight));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
                canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
                canvas.getContext("2d").drawImage(imagem, 0, 0, canvas.width, canvas.height);
                try {
                    dados.fotoPerfil = canvas.toDataURL("image/jpeg", 0.82);
                    dados.fotoPerfilDono = armazenamentoEntregador.id;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
                    atualizarFotoPerfil(dados.fotoPerfil);
                    statusFoto.textContent = "Foto de perfil salva.";
                } catch {
                    statusFoto.textContent = "Não foi possível salvar a foto neste navegador.";
                }
            };
            imagem.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
    });
    botaoRemoverFoto?.addEventListener("click", () => {
        delete dados.fotoPerfil;
        delete dados.fotoPerfilDono;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        atualizarFotoPerfil("");
        campoFotoPerfil.value = "";
        statusFoto.textContent = "Foto de perfil removida.";
    });
    document.querySelectorAll("[data-toggle-senha]").forEach(botao => {
        botao.addEventListener("click", () => {
            const campo = botao.closest("label")?.querySelector("input[type=password], input[type=text]");
            if (!campo) return;
            const mostrar = campo.type === "password";
            campo.type = mostrar ? "text" : "password";
            botao.textContent = mostrar ? "Ocultar" : "Mostrar";
            botao.setAttribute("aria-pressed", String(mostrar));
            botao.setAttribute("aria-label", `${mostrar ? "Ocultar" : "Mostrar"} ${botao.closest("label")?.firstChild?.textContent?.trim() || "senha"}`);
        });
    });    const formularioLogin = document.querySelector("[data-salvar-login]");
    formularioLogin?.addEventListener("submit", evento => {
        evento.preventDefault();
        const status = formularioLogin.querySelector("[data-status-login]");
        const emailNovo = formularioLogin.elements.namedItem("emailNovo").value.trim();
        const senhaAtual = formularioLogin.elements.namedItem("senhaAtual").value;
        const senhaNova = formularioLogin.elements.namedItem("senhaNova").value;
        const confirmarSenha = formularioLogin.elements.namedItem("confirmarSenha").value;
        const alterarSenha = Boolean(senhaNova || confirmarSenha);
        const emailAtual = String(identificadorLogin?.value || "").trim();

        if (!emailNovo && !alterarSenha) { status.textContent = "Informe um novo e-mail ou os dados para alterar a senha."; return; }
        if (emailNovo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNovo)) { status.textContent = "Informe um e-mail válido."; formularioLogin.elements.namedItem("emailNovo").focus(); return; }
        if (emailNovo && emailNovo.toLowerCase() === emailAtual.toLowerCase()) { status.textContent = "O novo e-mail deve ser diferente do atual."; formularioLogin.elements.namedItem("emailNovo").focus(); return; }
        if (alterarSenha && (!senhaAtual || !senhaNova || !confirmarSenha)) { status.textContent = "Preencha os três campos de senha para alterá-la."; return; }
        if (alterarSenha && senhaNova.length < 8) { status.textContent = "A nova senha deve ter pelo menos 8 caracteres."; formularioLogin.elements.namedItem("senhaNova").focus(); return; }
        if (alterarSenha && senhaNova !== confirmarSenha) { status.textContent = "A confirmação da nova senha não confere."; formularioLogin.elements.namedItem("confirmarSenha").focus(); return; }

        try {
            const sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null");
            if (!armazenamentoEntregador.ehEntregador || !sessao?.dados) { status.textContent = "Entre com uma conta de entregador para alterar essas informações."; return; }
            if (alterarSenha && senhaAtual !== sessao.dados.senhaUsuario) { status.textContent = "A senha atual não confere."; formularioLogin.elements.namedItem("senhaAtual").focus(); return; }
            if (emailNovo) {
                sessao.dados.emailUsuario = emailNovo;
                dados.conta = { ...(dados.conta || {}), email: emailNovo };
                identificadorLogin.value = emailNovo;
            }
            if (alterarSenha) sessao.dados.senhaUsuario = senhaNova;
            localStorage.setItem("garfooUsuarioLogado", JSON.stringify(sessao));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
            formularioLogin.reset();
            if (identificadorLogin) identificadorLogin.value = sessao.dados.emailUsuario || emailAtual;
            if (campoSenhaAtual) campoSenhaAtual.value = sessao.dados.senhaUsuario || "";
            status.textContent = "Alterações salvas neste navegador.";
        } catch { status.textContent = "Não foi possível salvar as alterações."; }
    });
    function validar(campo) {
        const erro = erroDoCampo(campo), alvo = campo.closest("label")?.querySelector(`[data-erro-campo="${campo.name}"]`);
        if (alvo) alvo.textContent = erro;
        campo.setAttribute("aria-invalid", String(Boolean(erro)));
        return !erro;
    }
    document.querySelectorAll('.preferencias input[type="checkbox"]').forEach(campo => {
        campo.checked = Boolean(dados.preferencias?.[campo.name]);
    });
    document.querySelector("[data-salvar-preferencias]")?.addEventListener("click", () => {
        const preferencias = Object.fromEntries([...document.querySelectorAll('.preferencias input[type="checkbox"]')].map(campo => [campo.name, campo.checked]));
        dados.preferencias = preferencias;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
            const status = document.querySelector("[data-status-preferencias]");
            if (status) status.textContent = "Preferências salvas neste navegador.";
        } catch {
            const status = document.querySelector("[data-status-preferencias]");
            if (status) status.textContent = "Não foi possível salvar as preferências.";
        }
    });
    const conteudoTermos = document.querySelector("[data-termos-completos]");
    if (conteudoTermos) {
        fetch("termos-uso-privacidade.txt")
            .then(resposta => { if (!resposta.ok) throw new Error("Falha ao carregar termos."); return resposta.text(); })
            .then(texto => { conteudoTermos.textContent = texto; })
            .catch(() => { conteudoTermos.textContent = "Não foi possível carregar os termos neste momento."; });
    }    document.querySelector("[data-sair]")?.addEventListener("click", () => { const status = document.querySelector("[data-status-preferencias]"); if (status) status.textContent = "Para sair, encerre sua sessão no painel de autenticação."; });
})();
