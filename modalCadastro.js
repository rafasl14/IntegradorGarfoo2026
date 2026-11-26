const modalCadastro = document.getElementById("modal-cadastro");

if (modalCadastro) {
    const caixaCadastro = modalCadastro.querySelector(".modal-cadastro-caixa");
    const tituloCadastro = modalCadastro.querySelector("#titulo-modal-cadastro");
    const opcoesCadastro = modalCadastro.querySelector(".opcoes-cadastro");
    const formularioCadastro = modalCadastro.querySelector("#formulario-cadastro");
    const botoesAbrirCadastro = document.querySelectorAll("[data-abrir-cadastro]");
    const botoesFecharCadastro = modalCadastro.querySelectorAll("[data-fechar-cadastro]");
    let cadastroExclusivoTipo = null;

    function aplicarMascara(campo, formatar, tamanhoMaximo) {
        if (!campo) return;
        campo.inputMode = "numeric";
        campo.maxLength = tamanhoMaximo;
        campo.addEventListener("input", () => {
            campo.value = formatar(campo.value);
        });
        campo.value = formatar(campo.value);
    }
    const mascararCpf = valor => {
        const digitos = valor.replace(/\D/g, "").slice(0, 11);
        if (digitos.length <= 3) return digitos;
        if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
        if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
    };
    const mascararCnpj = valor => {
        const digitos = valor.replace(/\D/g, "").slice(0, 14);
        if (digitos.length <= 2) return digitos;
        if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
        if (digitos.length <= 8) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
        if (digitos.length <= 12) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
        return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
    };
    const mascararTelefone = valor => {
        const digitos = valor.replace(/\D/g, "").slice(0, 11);
        if (digitos.length <= 2) return digitos ? `(${digitos}` : "";
        const ddd = digitos.slice(0, 2);
        const numero = digitos.slice(2);
        if (!numero) return `(${ddd})`;
        if (digitos.length <= 10) {
            return numero.length <= 4 ? `(${ddd}) ${numero}` : `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
        }
        return numero.length <= 5 ? `(${ddd}) ${numero}` : `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
    };

    const camposComuns = `
        <div class="grade-cadastro"> 
            <label class="campo-cadastro campo-largo">
                <span>Nome completo</span>
                <input name="nomeUsuario" type="text" autocomplete="name" required>
            </label>
            <label class="campo-cadastro">
                <span>E-mail</span>
                <input name="emailUsuario" type="email" autocomplete="email" required>
            </label>
            <label class="campo-cadastro">
                <span>Senha</span>
                <input name="senhaUsuario" type="password" autocomplete="new-password" required>
            </label>
            <label class="campo-cadastro">
                <span>Data de nascimento</span>
                <input name="dataNascimento" type="date" required>
            </label>
            <label class="campo-cadastro">
                <span>Sexo</span>
                <select name="sexo" required>
                    <option value="">Selecione</option>
                    <option value="F">Feminino</option>
                    <option value="M">Masculino</option>
                    <option value="Outro">Outro</option>
                    <option value="N">Prefiro não informar</option>
                </select>
            </label>
            <label class="campo-cadastro">
                <span>CPF</span>
                <input name="cpf" type="text" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" autocomplete="off" required>
            </label>
            <label class="campo-cadastro">
                <span>Telefone</span>
                <input name="telefone" type="tel" maxlength="15" placeholder="(00) 00000-0000" autocomplete="tel" required>
            </label>
        </div>
    `;

    const camposEntregador = `
        <div class="grade-cadastro">
            <label class="campo-cadastro">
                <span>Tipo de veículo</span>
                <select name="tipoVeiculo" id="tipo-veiculo" required>
                    <option value="">Selecione</option>
                    <option value="moto">Moto</option>
                    <option value="bicicleta">Bicicleta</option>
                </select>
            </label>
            <label class="campo-cadastro">
                <span>Ano do veículo</span>
                <input name="anoVeiculo" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="AAAA" title="Informe o ano com 4 dígitos" required>
            </label>
            <label class="campo-cadastro">
                <span>Modelo do veículo</span>
                <input name="modeloVeiculo" type="text" required>
            </label>
            <label class="campo-cadastro campo-veiculo-combustao">
                <span>Placa do veículo</span>
                <input name="placaVeiculo" type="text" maxlength="7" pattern="[A-Za-z0-9]{7}" placeholder="ABC1D23" title="A placa deve ter 7 caracteres" required>
            </label>
            <label class="campo-cadastro campo-veiculo-combustao">
                <span>Número da CNH</span>
                <input name="numeroCnhEntregador" type="text" inputmode="numeric" maxlength="11" pattern="[0-9]{11}" placeholder="11 dígitos" title="A CNH deve ter 11 dígitos" required>
            </label>
        </div>
    `;

    const camposProprietario = `
        <div class="grade-cadastro">
            <label class="campo-cadastro">
                <span>CNPJ</span>
                <input name="cnpj" type="text" inputmode="numeric" maxlength="18" placeholder="00.000.000/0000-00" required>
            </label>
            <label class="campo-cadastro">
                <span>Nome do restaurante</span>
                <input name="nomeRes" type="text" required>
            </label>
            <label class="campo-cadastro campo-largo">
                <span>Endereço do restaurante</span>
                <input name="enderecoRes" type="text" required>
            </label>
            <label class="campo-cadastro">
                <span>Telefone do restaurante</span>
                <input name="telefoneRes" type="tel" maxlength="15" placeholder="(00) 00000-0000" required>
            </label>
            <label class="campo-cadastro">
                <span>Horário de funcionamento</span>
                <input name="horarioRes" type="text" inputmode="numeric" maxlength="11" placeholder="08:00-22:00" autocomplete="off" required>
            </label>
        </div>
    `;

    function abrirModalCadastro(tipoExclusivo = null) {
        cadastroExclusivoTipo = tipoExclusivo;
        modalCadastro.hidden = false;
        modalCadastro.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-cadastro-aberto");

        if (cadastroExclusivoTipo) {
            tituloCadastro.textContent = cadastroExclusivoTipo === "proprietario"
                ? "Cadastre seu restaurante"
                : "Cadastro de Entregador";
            opcoesCadastro.querySelectorAll("[data-tipo-cadastro]").forEach(botao => {
                botao.hidden = botao.dataset.tipoCadastro !== cadastroExclusivoTipo;
            });
        }
        criarFormulario(cadastroExclusivoTipo || "cliente");

    }

    function fecharModalCadastro() {
        modalCadastro.hidden = true;
        modalCadastro.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-cadastro-aberto");
        tituloCadastro.textContent = "Como você deseja se cadastrar?";
        opcoesCadastro.hidden = false;
        opcoesCadastro.querySelectorAll("[data-tipo-cadastro]").forEach(botao => botao.classList.remove("selecionado"));
        cadastroExclusivoTipo = null;
        opcoesCadastro.querySelectorAll("[data-tipo-cadastro]").forEach(botao => {
            botao.hidden = false;
        });
        formularioCadastro.innerHTML = "";
        caixaCadastro.classList.remove("formulario-aberto");
    }

    function criarFormulario(tipo) {
        const nomes = {
            cliente: "Cliente",
            entregador: "Entregador",
            proprietario: "Proprietário"
        };

        let campos = camposComuns;
        if (tipo === "entregador") campos += camposEntregador;
        if (tipo === "proprietario") campos += camposProprietario;

        tituloCadastro.textContent = `Cadastro de ${nomes[tipo]}`;
        opcoesCadastro.hidden = false;
        opcoesCadastro.querySelectorAll("[data-tipo-cadastro]").forEach(botao => {
            const selecionado = botao.dataset.tipoCadastro === tipo;
            botao.classList.toggle("selecionado", selecionado);
            botao.setAttribute("aria-pressed", String(selecionado));
        });
        caixaCadastro.classList.add("formulario-aberto");
        formularioCadastro.innerHTML = `
            <form class="formulario-cadastro" data-formulario-tipo="${tipo}">
                ${campos}
                <button class="botao-enviar-cadastro" type="submit">Finalizar cadastro</button>
                <p class="mensagem-cadastro" role="status"></p>
            </form>
        `;

        const formulario = formularioCadastro.querySelector("form");
        aplicarMascara(formulario.elements.namedItem("cpf"), mascararCpf, 14);
        aplicarMascara(formulario.elements.namedItem("telefone"), mascararTelefone, 15);
        aplicarMascara(formulario.elements.namedItem("cnpj"), mascararCnpj, 18);
        aplicarMascara(formulario.elements.namedItem("telefoneRes"), mascararTelefone, 15);
        const campoHorario = formulario.elements.namedItem("horarioRes");
        if (campoHorario) {
            campoHorario.addEventListener("input", () => {
                const digitos = campoHorario.value.replace(/\D/g, "").slice(0, 8);
                let horario = digitos.slice(0, 2);
                if (digitos.length > 2) horario += `:${digitos.slice(2, 4)}`;
                if (digitos.length > 4) horario += `-${digitos.slice(4, 6)}`;
                if (digitos.length > 6) horario += `:${digitos.slice(6, 8)}`;
                campoHorario.value = horario;
            });
        }
        formulario.addEventListener("submit", event => {
            event.preventDefault();

            const dadosCadastro = Object.fromEntries(new FormData(formulario).entries());
            const usuarioLogado = {
                tipo: tipo,
                dados: dadosCadastro,
                autenticadoEm: new Date().toISOString()
            };

            window.GarfooContas?.salvarConta(usuarioLogado);
            localStorage.removeItem("garfooUsuarioLogado");
            formulario.querySelector(".botao-enviar-cadastro").disabled = true;
            formulario.querySelector(".mensagem-cadastro").textContent =
                "Cadastro finalizado! Você será levado à página inicial em 5 segundos. Depois, entre com seu login.";
            window.setTimeout(() => {
                window.location.href = "indexInicio.html";
            }, 5000);
        });

        if (tipo === "entregador") {
            const tipoVeiculo = formulario.querySelector("#tipo-veiculo");
            const camposCombustao = formulario.querySelectorAll(".campo-veiculo-combustao");

            function atualizarCamposVeiculo() {
                const bicicleta = tipoVeiculo.value === "bicicleta";

                camposCombustao.forEach(campo => {
                    const input = campo.querySelector("input");
                    input.disabled = bicicleta;
                    campo.classList.toggle("campo-desabilitado", bicicleta);
                });
            }

            tipoVeiculo.addEventListener("change", atualizarCamposVeiculo);
        }
    }

    botoesAbrirCadastro.forEach(botao => {
        botao.addEventListener("click", event => {
            event.preventDefault();
            const tipoExclusivo = botao.dataset.cadastroTipo
                || (botao.hasAttribute("data-cadastro-restaurante") ? "proprietario" : null);
            abrirModalCadastro(tipoExclusivo);
        });
    });

    botoesFecharCadastro.forEach(botao => {
        botao.addEventListener("click", fecharModalCadastro);
    });

    modalCadastro.querySelectorAll("[data-tipo-cadastro]").forEach(botao => {
        botao.addEventListener("click", () => criarFormulario(botao.dataset.tipoCadastro));
    });

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && !modalCadastro.hidden) {
            fecharModalCadastro();
        }
    });

    if (window.location.hash === "#cadastro") {
        abrirModalCadastro();
    }
}
