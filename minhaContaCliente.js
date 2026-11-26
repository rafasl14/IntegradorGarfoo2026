(function configurarMinhaConta() {
    const chaveUsuario = "garfooUsuarioLogado";
    const chaveCliente = base => window.GarfooClienteStore.chave(base);
    const escaparHtml = valor => String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[caractere]));
    const formulario = document.querySelector("[data-form-conta]");
    const textoTermos = document.querySelector("[data-termos-texto]");
    if (textoTermos) {
        fetch("termos-uso-privacidade.txt")
            .then(resposta => resposta.ok ? resposta.text() : Promise.reject(new Error("Não foi possível carregar os termos.")))
            .then(texto => { textoTermos.textContent = texto; })
            .catch(() => { textoTermos.textContent = "Não foi possível carregar os termos e políticas."; });
    }
    let usuario = {};
    try {
        const sessao = JSON.parse(localStorage.getItem(chaveUsuario) || "null");
        const tipos = [sessao?.modoAtivo, sessao?.tipo, sessao?.tipoUsuario, ...(Array.isArray(sessao?.perfis) ? sessao.perfis : [])]
            .map(tipo => String(tipo || "").trim().toLocaleLowerCase("pt-BR"));
        if (tipos.some(tipo => ["cliente", "customer"].includes(tipo))) usuario = sessao;
    } catch { usuario = {}; }
    const dados = usuario.dados || {};
    const imagemPadraoPerfil = "./Fotos/usuario.png";
    const imagemPerfil = document.querySelector("[data-foto-perfil]");
    const seletorFotoPerfil = document.querySelector("[data-selecionar-foto-perfil]");
    const botaoRemoverFotoPerfil = document.querySelector("[data-remover-foto-perfil]");
    const statusFotoPerfil = document.querySelector("[data-status-foto-perfil]");
    const fotoSalva = dados.fotoPerfil || usuario.fotoPerfil || "";
    if (imagemPerfil) imagemPerfil.src = fotoSalva || imagemPadraoPerfil;
    if (botaoRemoverFotoPerfil) botaoRemoverFotoPerfil.hidden = !fotoSalva;
    seletorFotoPerfil?.addEventListener("change", () => {
        const arquivo = seletorFotoPerfil.files?.[0];
        if (!arquivo) return;
        if (!arquivo.type.startsWith("image/")) {
            statusFotoPerfil.textContent = "Escolha um arquivo de imagem.";
            seletorFotoPerfil.value = "";
            return;
        }
        if (arquivo.size > 2 * 1024 * 1024) {
            statusFotoPerfil.textContent = "A imagem deve ter até 2 MB.";
            seletorFotoPerfil.value = "";
            return;
        }
        const leitor = new FileReader();
        leitor.onload = () => {
            dados.fotoPerfil = String(leitor.result);
            usuario.dados = dados;
            localStorage.setItem(chaveUsuario, JSON.stringify(usuario));
            imagemPerfil.src = dados.fotoPerfil;
            if (botaoRemoverFotoPerfil) botaoRemoverFotoPerfil.hidden = false;
            statusFotoPerfil.textContent = "Foto de perfil atualizada.";
        };
        leitor.onerror = () => { statusFotoPerfil.textContent = "Não foi possível carregar a imagem."; };
        leitor.readAsDataURL(arquivo);
    });
    botaoRemoverFotoPerfil?.addEventListener("click", () => {
        delete dados.fotoPerfil;
        delete usuario.fotoPerfil;
        usuario.dados = dados;
        localStorage.setItem(chaveUsuario, JSON.stringify(usuario));
        imagemPerfil.src = imagemPadraoPerfil;
        botaoRemoverFotoPerfil.hidden = true;
        seletorFotoPerfil.value = "";
        statusFotoPerfil.textContent = "Foto de perfil removida.";
    });
    const nome = String(dados.nomeUsuario || dados.nomeCompleto || usuario.nomeUsuario || "").trim();
    const primeiroNome = nome ? nome.split(/\s+/)[0] : "";
    const saudacao = primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!";

    document.querySelectorAll("[data-saudacao-usuario], [data-nome-perfil]").forEach(item => { item.textContent = saudacao; });
    if (formulario) {
        ["nomeUsuario", "dataNascimento", "sexo", "emailUsuario", "telefone"].forEach(campo => {
            const input = formulario.elements.namedItem(campo);
            if (input) input.value = dados[campo] || "";
        });
        formulario.addEventListener("submit", evento => {
            evento.preventDefault();
            const atualizados = Object.fromEntries(new FormData(formulario).entries());
            usuario.dados = { ...dados, ...atualizados };
            Object.assign(dados, atualizados);
            localStorage.setItem(chaveUsuario, JSON.stringify(usuario));
            const primeiroNomeAtualizado = String(atualizados.nomeUsuario || "").trim().split(/\s+/)[0];
            const saudacaoAtualizada = primeiroNomeAtualizado ? `Olá, ${primeiroNomeAtualizado}!` : "Olá!";
            document.querySelectorAll("[data-saudacao-usuario], [data-nome-perfil]").forEach(item => { item.textContent = saudacaoAtualizada; });
            document.querySelectorAll("[data-status-conta]").forEach(status => { status.textContent = "Dados salvos com sucesso."; });
        });
    }

    const formularioEmailLogin = document.querySelector("[data-form-email-login]");
    const formularioSenhaLogin = document.querySelector("[data-form-senha-login]");
    const emailAtualLogin = formularioEmailLogin?.elements.namedItem("emailAtual");
    const novoEmailLogin = formularioEmailLogin?.elements.namedItem("emailNovo");
    if (emailAtualLogin) emailAtualLogin.value = dados.emailUsuario || usuario.emailUsuario || "";
    if (novoEmailLogin) novoEmailLogin.value = dados.emailUsuario || usuario.emailUsuario || "";

    formularioEmailLogin?.addEventListener("submit", evento => {
        evento.preventDefault();
        const status = document.querySelector("[data-status-email-login]");
        const emailAtual = String(dados.emailUsuario || usuario.emailUsuario || "").trim().toLowerCase();
        const emailNovo = String(novoEmailLogin.value || "").trim();
        if (emailNovo.toLowerCase() === emailAtual) {
            status.textContent = "Informe um e-mail diferente do atual.";
            return;
        }
        dados.emailUsuario = emailNovo;
        usuario.dados = { ...dados, emailUsuario: emailNovo };
        usuario.emailUsuario = emailNovo;
        if (formulario) formulario.elements.namedItem("emailUsuario").value = emailNovo;
        emailAtualLogin.value = emailNovo;
        novoEmailLogin.value = emailNovo;
        localStorage.setItem(chaveUsuario, JSON.stringify(usuario));
        status.textContent = "E-mail atualizado com sucesso.";
    });

    formularioSenhaLogin?.addEventListener("submit", evento => {
        evento.preventDefault();
        const status = document.querySelector("[data-status-senha-login]");
        const senhaAtualInput = formularioSenhaLogin.elements.namedItem("senhaAtual");
        const senhaNovaInput = formularioSenhaLogin.elements.namedItem("senhaNova");
        const confirmacaoInput = formularioSenhaLogin.elements.namedItem("confirmacaoSenhaNova");
        const senhaAtualSalva = dados.senhaUsuario || usuario.senhaUsuario || "";
        const senhaAtual = senhaAtualInput.value;
        const senhaNova = senhaNovaInput.value;

        if (!senhaAtualSalva || senhaAtual !== senhaAtualSalva) {
            status.textContent = "A senha atual não confere.";
            return;
        }
        if (senhaNova === senhaAtualSalva) {
            status.textContent = "A senha nova deve ser diferente da senha atual.";
            return;
        }
        if (senhaNova !== confirmacaoInput.value) {
            status.textContent = "A confirmação não corresponde à senha nova.";
            return;
        }

        dados.senhaUsuario = senhaNova;
        usuario.dados = { ...dados, senhaUsuario: senhaNova };
        if (Object.hasOwn(usuario, "senhaUsuario")) usuario.senhaUsuario = senhaNova;
        localStorage.setItem(chaveUsuario, JSON.stringify(usuario));
        formularioSenhaLogin.reset();
        status.textContent = "Senha redefinida com sucesso.";
    });

    function obterFavoritos() {
        try {
            const salvos = JSON.parse(localStorage.getItem(chaveCliente("garfooFavoritosCliente")) || "[]");
            return Array.isArray(salvos) ? salvos : [];
        } catch { return []; }
    }

    function obterDadosFavoritos() {
        try { return JSON.parse(localStorage.getItem(chaveCliente("garfooDadosFavoritosCliente")) || "{}"); } catch { return {}; }
    }

    function renderizarFavoritos() {
        const favoritos = obterFavoritos();
        const dadosFavoritos = obterDadosFavoritos();
        const lista = document.querySelector("[data-lista-favoritos]");
        const vazio = document.querySelector(".conta-favoritos-vazio");
        if (!lista) return;
        lista.replaceChildren();
        favoritos.slice(-4).reverse().forEach(id => {
            const dadosPrato = dadosFavoritos[id] || { nome: String(id).replace(/-/g, " "), restaurante: "" };
            const cartao = document.createElement("article");
            cartao.className = "conta-favorito-card";
            const abrirRestaurante = document.createElement("a");
            abrirRestaurante.className = "conta-favorito-link";
            abrirRestaurante.href = dadosPrato.restaurante
                ? `cliente.html?restaurante=${encodeURIComponent(dadosPrato.restaurante)}`
                : "cliente.html";
            abrirRestaurante.setAttribute("aria-label", `${dadosPrato.nome || "Prato favorito"} — ver cardápio do restaurante`);
            if (dadosPrato.imagem) {
                const imagem = document.createElement("img");
                imagem.src = dadosPrato.imagem;
                imagem.alt = dadosPrato.nome || "Prato favorito";
                abrirRestaurante.append(imagem);
            }
            const informacoes = document.createElement("div");
            informacoes.className = "conta-favorito-info";
            const nomePrato = document.createElement("strong");
            nomePrato.textContent = dadosPrato.nome || "Prato favorito";
            informacoes.append(nomePrato);
            if (dadosPrato.logo) {
                const restauranteArea = document.createElement("span");
                restauranteArea.className = "conta-favorito-restaurante";
                const logo = document.createElement("img");
                logo.src = dadosPrato.logo;
                logo.alt = `Logo do restaurante ${dadosPrato.restaurante || ""}`;
                logo.loading = "lazy";
                restauranteArea.append(logo);
                informacoes.append(restauranteArea);
            }
            if (dadosPrato.preco) {
                const preco = document.createElement("span");
                preco.className = "conta-favorito-preco";
                preco.textContent = dadosPrato.preco;
                informacoes.append(preco);
            }
            const remover = document.createElement("button");
            remover.type = "button";
            remover.textContent = "Remover";
            remover.setAttribute("aria-label", `Remover ${dadosPrato.nome || "prato"} dos favoritos`);
            remover.addEventListener("click", () => {
                const atualizados = obterFavoritos().filter(favorito => favorito !== id);
                localStorage.setItem(chaveCliente("garfooFavoritosCliente"), JSON.stringify(atualizados));
                const dadosAtualizados = obterDadosFavoritos();
                delete dadosAtualizados[id];
                localStorage.setItem(chaveCliente("garfooDadosFavoritosCliente"), JSON.stringify(dadosAtualizados));
                renderizarFavoritos();
            });
            abrirRestaurante.append(informacoes);
            cartao.append(abrirRestaurante, remover);
            lista.append(cartao);
        });
        if (vazio) vazio.hidden = favoritos.length > 0;
    }

    async function completarDadosFavoritos() {
        const favoritos = obterFavoritos();
        if (!favoritos.length) return;
        const dadosFavoritos = obterDadosFavoritos();
        try {
            const [respostaCatalogo, respostaInicio] = await Promise.all([
                fetch("cardapios_restaurantes.json?v=20261114-7"),
                fetch("cliente.html")
            ]);
            const catalogo = respostaCatalogo.ok ? await respostaCatalogo.json() : { restaurantes: [] };
            const documentoInicio = respostaInicio.ok
                ? new DOMParser().parseFromString(await respostaInicio.text(), "text/html")
                : null;
            const itensCatalogo = {};
            (catalogo.restaurantes || []).forEach(restaurante => {
                (restaurante.cardapio || []).forEach(item => {
                    itensCatalogo[`${restaurante.codRestaurante}-${item.codItemCardapio}`] = { restaurante, item };
                });
            });
            favoritos.forEach(id => {
                const antigo = dadosFavoritos[id] || {};
                if (antigo.logo && antigo.nome && antigo.restaurante) return;
                const itemCatalogo = itensCatalogo[id];
                if (itemCatalogo) {
                    const { restaurante, item } = itemCatalogo;
                    dadosFavoritos[id] = {
                        nome: item.produto?.nomeProd || antigo.nome || String(id),
                        restaurante: restaurante.nomeRes || antigo.restaurante || "",
                        preco: item.precoItemCardapio ? `R$ ${Number(item.precoItemCardapio).toFixed(2).replace(".", ",")}` : antigo.preco || "",
                        imagem: item.produto?.linkFotoProd || antigo.imagem || "",
                        logo: restaurante.linkLogoRes || antigo.logo || ""
                    };
                    return;
                }
                const botao = documentoInicio?.querySelector(`[data-favoritar="${CSS.escape(String(id))}"]`);
                const card = botao?.closest(".produto-cliente");
                if (!card) return;
                const logo = card.querySelector(".produto-restaurante-logo");
                dadosFavoritos[id] = {
                    nome: card.querySelector(".produto-detalhes strong")?.textContent.trim() || antigo.nome || String(id),
                    restaurante: logo?.alt || antigo.restaurante || "",
                    preco: card.querySelector(".produto-detalhes span")?.textContent.trim() || antigo.preco || "",
                    imagem: card.querySelector("img:not(.produto-restaurante-logo)")?.getAttribute("src") || antigo.imagem || "",
                    logo: logo?.getAttribute("src") || antigo.logo || ""
                };
            });
            localStorage.setItem(chaveCliente("garfooDadosFavoritosCliente"), JSON.stringify(dadosFavoritos));
            renderizarFavoritos();
        } catch (erro) {
            console.error("Não foi possível completar os dados dos favoritos:", erro);
        }
    }

    renderizarFavoritos();
    completarDadosFavoritos();
    const linksMenuConta = [...document.querySelectorAll(".conta-sidebar nav a[href^='#']")];
    const menuConta = document.querySelector(".conta-sidebar nav");
    const painelConta = document.querySelector(".conta-painel");
    const painelFavoritos = document.querySelector(".conta-favoritos-painel");
    const painelPrivacidade = document.querySelector(".conta-privacidade");
    const painelLogin = document.querySelector(".conta-login");
    const painelPagamentos = document.querySelector(".conta-pagamentos");
    const painelEnderecos = document.querySelector(".conta-enderecos");
    const painelAvaliacoes = document.querySelector(".conta-avaliacoes");
    const tituloPainelAvaliacoes = painelAvaliacoes?.querySelector(":scope > h1");
    const listaAvaliacoesFeitas = document.querySelector("[data-avaliacoes-feitas]");
    const listaAvaliacoesPendentes = document.querySelector("[data-avaliacoes-pendentes]");
    const mensagemAvaliacoesVazias = document.querySelector("[data-avaliacoes-vazio]");
    const gruposAvaliacoes = [...(painelAvaliacoes?.querySelectorAll(".conta-avaliacoes-grupo") || [])];
    const normalizarNome = valor => String(valor || "").trim().toLocaleLowerCase("pt-BR");
    const mostrarEstrelas = nota => `${"★".repeat(Math.max(0, Math.min(5, Number(nota) || 0)))}${"☆".repeat(5 - Math.max(0, Math.min(5, Number(nota) || 0)))}`;
    function lerPedidosConta() {
        return window.GarfooClienteStore.listarPedidos();
    }
    function lerTodosPedidosConta() {
        try { const pedidos = JSON.parse(localStorage.getItem("garfooPedidosCliente") || "[]"); return Array.isArray(pedidos) ? pedidos : []; }
        catch { return []; }
    }
    function renderizarAvaliacoesConta() {
        if (!listaAvaliacoesFeitas || !listaAvaliacoesPendentes) return;
        const pedidos = lerPedidosConta().filter(pedido => pedido && typeof pedido === "object");
        const feitas = [];
        const pendentes = [];
        pedidos.forEach(pedido => {
            const avaliacaoCliente = pedido.avaliacoesCliente || {};
            const etapaPedido = normalizarNome(pedido.statusEntrega || pedido.status);
            const entregue = ["entregue", "pedido entregue"].includes(etapaPedido);
            if (["cancelado", "pedido cancelado"].includes(etapaPedido) || normalizarNome(pedido.status) === "cancelado") return;
            const numero = pedido.numero || pedido.id;
            const itens = Array.isArray(pedido.itens) ? pedido.itens.filter(item => item && typeof item === "object") : [];
            const restaurantes = [...new Set(itens.map(item => String(item.restaurante || "Restaurante").trim()))];
            const blocosAvaliacao = [];
            let temPendencia = false;
            const criarBlocoAvaliacao = ({ tipo, titulo, restauranteNome = "", avaliacao, dispensada }) => {
                if (dispensada && !avaliacao) return "";
                if (avaliacao) {
                    const comentario = avaliacao.comentarioOculto ? "Comentário ocultado para moderação." : (avaliacao.comentario || "Sem comentário escrito.");
                    const data = avaliacao.criadaEm && !Number.isNaN(new Date(avaliacao.criadaEm).getTime())
                        ? new Date(avaliacao.criadaEm).toLocaleDateString("pt-BR") : "Data não informada";
                    return `<section class="conta-avaliacao-alvo"><strong>${escaparHtml(titulo)}</strong><div class="conta-avaliacao-concluida"><b>${mostrarEstrelas(avaliacao.nota)} <span>${Number(avaliacao.nota)}/5</span></b><p>${escaparHtml(comentario)}</p><small>${escaparHtml(data)}</small></div></section>`;
                }
                temPendencia = true;
                if (!entregue) return `<section class="conta-avaliacao-alvo"><strong>${escaparHtml(titulo)}</strong><div class="conta-avaliacao-aguardando">Aguardando a entrega para avaliar.</div></section>`;
                return `<section class="conta-avaliacao-alvo"><strong>${escaparHtml(titulo)}</strong><button class="conta-avaliacao-fechar" type="button" data-dispensar-avaliacao-conta="${tipo}" data-pedido-id="${escaparHtml(pedido.id)}" data-restaurante-nome="${escaparHtml(restauranteNome)}" aria-label="Dispensar avaliação de ${escaparHtml(titulo)}">×</button><form class="conta-avaliacao-form" data-form-avaliacao-conta="${tipo}" data-pedido-id="${escaparHtml(pedido.id)}" data-restaurante-nome="${escaparHtml(restauranteNome)}"><label>Avaliação<select name="nota" required><option value="">Escolha uma nota</option><option value="5">★★★★★ — Ótimo</option><option value="4">★★★★ — Bom</option><option value="3">★★★ — Regular</option><option value="2">★★ — Ruim</option><option value="1">★ — Muito ruim</option></select></label><label>Comentário (opcional)<textarea name="comentario" rows="2" maxlength="500" placeholder="Conte como foi sua experiência"></textarea></label><button type="submit">Salvar avaliação</button></form></section>`;
            };
            restaurantes.forEach(nomeRestaurante => {
                const chave = nomeRestaurante.toLocaleLowerCase("pt-BR");
                const avaliacao = avaliacaoCliente.restaurantes?.[chave] || (restaurantes.length === 1 ? avaliacaoCliente.restaurante : null);
                const dispensada = Boolean(avaliacaoCliente.dispensadas?.[`restaurante:${chave}`]);
                const bloco = criarBlocoAvaliacao({ tipo: "restaurante", titulo: `Restaurante · ${nomeRestaurante}`, restauranteNome: nomeRestaurante, avaliacao, dispensada });
                if (bloco) blocosAvaliacao.push(bloco);
            });
            const avaliacaoEntregador = avaliacaoCliente.entregador;
            const blocoEntregador = criarBlocoAvaliacao({ tipo: "entregador", titulo: "Entregador", avaliacao: avaliacaoEntregador, dispensada: Boolean(avaliacaoCliente.dispensadas?.entregador) });
            if (blocoEntregador) blocosAvaliacao.push(blocoEntregador);
            if (!blocosAvaliacao.length) return;
            const pratosPedido = [...new Set(itens.map(item => item.nome || "Prato"))];
            const cartaoPedido = `<article class="conta-avaliacao-pedido"><header><strong>Pedido ${escaparHtml(numero)}</strong><small>Pratos: ${escaparHtml(pratosPedido.join(", ") || "Não informado")}</small></header><div class="conta-avaliacao-pedido-blocos">${blocosAvaliacao.join("")}</div></article>`;
            (temPendencia ? pendentes : feitas).push(cartaoPedido);
        });
        listaAvaliacoesFeitas.innerHTML = feitas.join("");
        listaAvaliacoesPendentes.innerHTML = pendentes.join("");
        const temAvaliacoes = feitas.length + pendentes.length > 0;
        if (tituloPainelAvaliacoes) tituloPainelAvaliacoes.hidden = !temAvaliacoes;
        if (mensagemAvaliacoesVazias) mensagemAvaliacoesVazias.hidden = temAvaliacoes;
        gruposAvaliacoes.forEach(grupo => {
            const lista = grupo.querySelector("[data-avaliacoes-feitas], [data-avaliacoes-pendentes]");
            grupo.hidden = !lista?.childElementCount;
        });
    }
    painelAvaliacoes?.addEventListener("click", evento => {
        const botao = evento.target.closest("[data-dispensar-avaliacao-conta]");
        if (!botao) return;
        const pedidos = lerTodosPedidosConta();
        const pedido = pedidos.find(item => String(item.id) === botao.dataset.pedidoId);
        if (!pedido) return;
        pedido.avaliacoesCliente ||= {};
        pedido.avaliacoesCliente.dispensadas ||= {};
        const chave = botao.dataset.dispensarAvaliacaoConta === "entregador"
            ? "entregador"
            : `restaurante:${normalizarNome(botao.dataset.restauranteNome)}`;
        pedido.avaliacoesCliente.dispensadas[chave] = true;
        localStorage.setItem("garfooPedidosCliente", JSON.stringify(pedidos));
        renderizarAvaliacoesConta();
    });
    painelAvaliacoes?.addEventListener("submit", evento => {
        const form = evento.target.closest("[data-form-avaliacao-conta]");
        if (!form) return;
        evento.preventDefault();
        const nota = Number(new FormData(form).get("nota"));
        if (!Number.isInteger(nota) || nota < 1 || nota > 5) return;
        const pedidos = lerTodosPedidosConta();
        const pedido = pedidos.find(item => String(item.id) === form.dataset.pedidoId);
        if (!pedido || !["Entregue", "Pedido entregue"].includes(pedido.statusEntrega || pedido.status)) return;
        const restauranteNome = form.dataset.restauranteNome || "";
        const comentario = String(new FormData(form).get("comentario") || "").trim();
        const comentarioOculto = /\b(idiota|imbecil|burro|retardado|desgra[cç]ado|vagabundo|lixo|macaco|preto imundo|racista|nazista|estupro|matar|vou te pegar)\b/i.test(comentario);
        const avaliacao = {
            nota, comentario: comentarioOculto ? "" : comentario, comentarioOculto,
            criadaEm: new Date().toISOString(), pedidoNumero: pedido.numero || pedido.id,
            restauranteNome,
            pratos: (pedido.itens || []).filter(item => !restauranteNome || normalizarNome(item.restaurante || "Restaurante") === normalizarNome(restauranteNome)).map(item => item.nome || "Prato")
        };
        pedido.avaliacoesCliente ||= {};
        if (form.dataset.formAvaliacaoConta === "restaurante") {
            pedido.avaliacoesCliente.restaurantes ||= {};
            pedido.avaliacoesCliente.restaurantes[normalizarNome(restauranteNome)] = avaliacao;
        } else {
            pedido.avaliacoesCliente.entregador = {
                ...avaliacao,
                entregadorId: pedido.entregador?.id || "",
                entregadorEmail: pedido.entregador?.email || "",
                entregadorNome: pedido.entregador?.nome || ""
            };
        }
        localStorage.setItem("garfooPedidosCliente", JSON.stringify(pedidos));
        renderizarAvaliacoesConta();
    });
    window.addEventListener("storage", evento => {
        if (evento.key === "garfooPedidosCliente") {
            try { renderizarAvaliacoesConta(); }
            catch (erro) { console.error("Não foi possível atualizar as avaliações da conta:", erro); }
        }
    });
    try { renderizarAvaliacoesConta(); }
    catch (erro) { console.error("Não foi possível carregar as avaliações da conta:", erro); }
    const formularioPagamento = document.querySelector("[data-form-pagamento]");
    const promptCartao = document.querySelector(".conta-pagamento-vazio");
    const painelCartoesCadastrados = document.querySelector("[data-cartoes-cadastrados]");
    const listaCartoesCadastrados = document.querySelector("[data-lista-cartoes]");
    const statusPagamento = document.querySelector("[data-status-pagamento]");
    const campoTipoPagamento = formularioPagamento?.elements.namedItem("tipo");
    const campoCvv = formularioPagamento?.elements.namedItem("cvv");
    const campoNumeroCartao = formularioPagamento?.elements.namedItem("numeroCartao");
    const campoValidade = formularioPagamento?.elements.namedItem("validade");
    const campoTitular = formularioPagamento?.elements.namedItem("nomeTitular");
    const campoCpfCartao = formularioPagamento?.elements.namedItem("cpf");
    const previewTipo = document.querySelector("[data-preview-tipo]");
    const previewNumero = document.querySelector("[data-preview-numero]");
    const previewTitular = document.querySelector("[data-preview-titular]");
    const previewValidade = document.querySelector("[data-preview-validade]");

    function lerCartoesCadastrados() {
        try {
            const cartoes = JSON.parse(localStorage.getItem(chaveCliente("garfooCartoesCliente")) || "[]");
            return Array.isArray(cartoes) ? cartoes : [];
        } catch { return []; }
    }

    function cpfValido(valor) {
        const numeros = String(valor || "").replace(/\D/g, "");
        if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;
        const calcularDigito = tamanho => {
            const soma = numeros.slice(0, tamanho).split("").reduce((total, digito, indice) => total + Number(digito) * (tamanho + 1 - indice), 0);
            const resto = (soma * 10) % 11;
            return resto === 10 ? 0 : resto;
        };
        return calcularDigito(9) === Number(numeros[9]) && calcularDigito(10) === Number(numeros[10]);
    }

    function renderizarCartoesCadastrados() {
        const cartoes = lerCartoesCadastrados();
        const temCartoes = cartoes.length > 0;
        if (promptCartao) promptCartao.hidden = temCartoes;
        if (painelCartoesCadastrados) painelCartoesCadastrados.hidden = !temCartoes;
        if (!listaCartoesCadastrados) return;
        const tipos = { credito: "Crédito", debito: "Débito", vale_refeicao: "Vale-refeição", vale_alimentacao: "Vale-alimentação" };
        listaCartoesCadastrados.replaceChildren();
        cartoes.forEach((cartao, indice) => {
            const item = document.createElement("article");
            item.className = "conta-cartao-salvo";
            const titulo = document.createElement("strong");
            titulo.textContent = cartao.apelido || tipos[cartao.tipo] || "Cartão";
            const detalhes = document.createElement("span");
            detalhes.textContent = `${tipos[cartao.tipo] || "Cartão"} ···· ${cartao.finais} · ${cartao.nomeTitular || ""}`;
            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.dataset.excluirCartao = String(indice);
            excluir.textContent = "Excluir cartão";
            item.append(titulo, detalhes, excluir);
            listaCartoesCadastrados.append(item);
        });
    }
    renderizarCartoesCadastrados();
    listaCartoesCadastrados?.addEventListener("click", evento => {
        const botao = evento.target.closest("[data-excluir-cartao]");
        if (!botao) return;
        const indice = Number(botao.dataset.excluirCartao);
        const cartoes = lerCartoesCadastrados();
        if (!cartoes[indice]) return;
        cartoes.splice(indice, 1);
        localStorage.setItem(chaveCliente("garfooCartoesCliente"), JSON.stringify(cartoes));
        renderizarCartoesCadastrados();
        if (statusPagamento) statusPagamento.textContent = "Cartão excluído.";
    });

    const atualizarCamposPagamento = () => {
        const credito = campoTipoPagamento?.value === "credito";
        const nomesTipos = {
            credito: "Crédito",
            debito: "Débito",
            vale_refeicao: "Vale-refeição",
            vale_alimentacao: "Vale-alimentação"
        };
        const cvvLabel = document.querySelector("[data-campo-cvv]");
        if (cvvLabel) cvvLabel.hidden = !credito;
        if (previewTipo) previewTipo.textContent = nomesTipos[campoTipoPagamento?.value] || "Cartão";
        if (campoCvv) {
            campoCvv.required = credito;
            if (!credito) campoCvv.value = "";
        }
    };
    campoTipoPagamento?.addEventListener("change", atualizarCamposPagamento);
    atualizarCamposPagamento();

    document.querySelectorAll("[data-abrir-cartao]").forEach(botao => botao.addEventListener("click", () => {
        if (promptCartao) promptCartao.hidden = true;
        if (painelCartoesCadastrados) painelCartoesCadastrados.hidden = true;
        if (formularioPagamento) formularioPagamento.hidden = false;
        if (statusPagamento) statusPagamento.textContent = "";
    }));
    document.querySelector("[data-voltar-cartao]")?.addEventListener("click", evento => {
        evento.preventDefault();
        formularioPagamento.reset();
        formularioPagamento.hidden = true;
        renderizarCartoesCadastrados();
        if (statusPagamento) statusPagamento.textContent = "";
        atualizarCamposPagamento();
    });
    campoNumeroCartao?.addEventListener("input", () => {
        const digitos = campoNumeroCartao.value.replace(/\D/g, "").slice(0, 19);
        campoNumeroCartao.value = digitos.replace(/(.{4})/g, "$1 ").trim();
        if (previewNumero) previewNumero.textContent = campoNumeroCartao.value || "0000 0000 0000 0000";
    });
    campoTitular?.addEventListener("input", () => {
        if (previewTitular) previewTitular.textContent = campoTitular.value.trim() || "Nome do titular";
    });
    campoValidade?.addEventListener("input", () => {
        const digitos = campoValidade.value.replace(/\D/g, "").slice(0, 4);
        campoValidade.value = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
        if (previewValidade) previewValidade.textContent = campoValidade.value || "MM/AA";
    });
    formularioPagamento?.addEventListener("submit", evento => {
        evento.preventDefault();
        const campos = Object.fromEntries(new FormData(formularioPagamento).entries());
        const numero = String(campos.numeroCartao || "").replace(/\D/g, "");
        if (numero.length < 13 || numero.length > 19) {
            campoNumeroCartao.setCustomValidity("Digite um número de cartão válido.");
            campoNumeroCartao.reportValidity();
            campoNumeroCartao.setCustomValidity("");
            return;
        }
        const [mes, ano] = String(campos.validade || "").split("/").map(Number);
        const agora = new Date();
        const anoAtual = Number(String(agora.getFullYear()).slice(-2));
        if (mes < 1 || mes > 12 || !ano || ano < anoAtual || (ano === anoAtual && mes < agora.getMonth() + 1)) {
            campoValidade.setCustomValidity("Informe uma validade futura no formato MM/AA.");
            campoValidade.reportValidity();
            campoValidade.setCustomValidity("");
            return;
        }
        if (!cpfValido(campos.cpf)) {
            campoCpfCartao.setCustomValidity("Digite um CPF válido.");
            campoCpfCartao.reportValidity();
            campoCpfCartao.setCustomValidity("");
            return;
        }
        if (campoCvv.required && String(campos.cvv || "").replace(/\D/g, "").length < 3) {
            campoCvv.setCustomValidity("Digite o código de segurança do cartão.");
            campoCvv.reportValidity();
            campoCvv.setCustomValidity("");
            return;
        }
        const cartao = {
            tipo: campos.tipo,
            finais: numero.slice(-4),
            nomeTitular: String(campos.nomeTitular || "").trim(),
            apelido: String(campos.apelido || "").trim()
        };
        const cartoes = lerCartoesCadastrados();
        cartoes.push(cartao);
        localStorage.setItem(chaveCliente("garfooCartoesCliente"), JSON.stringify(cartoes));
        campoNumeroCartao.value = "";
        campoCvv.value = "";
        formularioPagamento.reset();
        formularioPagamento.hidden = true;
        if (statusPagamento) {
            statusPagamento.textContent = "Cartão cadastrado. O número completo e o CVV não foram armazenados.";
            statusPagamento.dataset.status = "aprovado";
        }
        renderizarCartoesCadastrados();
        atualizarCamposPagamento();
    });

    const ativarLinkConta = link => {
        linksMenuConta.forEach(item => {
            const selecionado = item === link;
            item.classList.toggle("selecionado", selecionado);
            if (selecionado) item.setAttribute("aria-current", "page");
            else item.removeAttribute("aria-current");
        });
        const destino = link.getAttribute("href");
        const mostrarPagamentos = destino === "#pagamentos";
        const mostrarEnderecos = destino === "#enderecos";
        const mostrarLogin = destino === "#login-conta";
        const mostrarFavoritos = destino === "#favoritos";
        const mostrarAvaliacoes = destino === "#avaliacoes";
        const mostrarPrivacidade = destino === "#privacidade";
        if (painelConta) painelConta.hidden = mostrarPagamentos || mostrarEnderecos || mostrarLogin || mostrarFavoritos || mostrarAvaliacoes || mostrarPrivacidade;
        if (painelFavoritos) painelFavoritos.hidden = !mostrarFavoritos;
        if (painelAvaliacoes) painelAvaliacoes.hidden = !mostrarAvaliacoes;
        if (painelPrivacidade) painelPrivacidade.hidden = !mostrarPrivacidade;
        if (painelLogin) painelLogin.hidden = !mostrarLogin;
        if (painelPagamentos) painelPagamentos.hidden = !mostrarPagamentos;
        if (painelEnderecos) painelEnderecos.hidden = !mostrarEnderecos;
    };
    menuConta?.addEventListener("click", evento => {
        const link = evento.target.closest("a[href^='#']");
        if (!link) return;
        evento.preventDefault();
        ativarLinkConta(link);
        try { window.history.replaceState(null, "", link.getAttribute("href")); }
        catch { window.location.hash = link.getAttribute("href"); }
    });
    const linkInicial = linksMenuConta.find(link => link.getAttribute("href") === window.location.hash)
        || linksMenuConta.find(link => link.getAttribute("href") === "#dados-conta");
    if (linkInicial) ativarLinkConta(linkInicial);
    const formularioEndereco = document.querySelector("[data-form-endereco]");
    const vazioEnderecos = document.querySelector("[data-enderecos-vazio]");
    const salvosEnderecos = document.querySelector("[data-enderecos-salvos]");
    const listaEnderecos = document.querySelector("[data-lista-enderecos]");
    let enderecosSalvos = [];
    try { enderecosSalvos = JSON.parse(localStorage.getItem(chaveCliente("garfooEnderecosCliente")) || "[]"); } catch { enderecosSalvos = []; }
    if (!Array.isArray(enderecosSalvos)) enderecosSalvos = [];
    let indiceEnderecoEditado = null;

    const renderizarEnderecos = () => {
        const temEndereco = enderecosSalvos.length > 0;
        if (vazioEnderecos) vazioEnderecos.hidden = temEndereco;
        if (salvosEnderecos) salvosEnderecos.hidden = !temEndereco;
        if (!listaEnderecos) return;
        listaEnderecos.replaceChildren();
        enderecosSalvos.forEach((endereco, indice) => {
            const cartao = document.createElement("article");
            cartao.className = "endereco-card";
            const identificacao = document.createElement("strong");
            identificacao.textContent = endereco.identificacao || "Endereço";
            const detalhes = document.createElement("span");
            detalhes.textContent = `${endereco.rua}, ${endereco.numero}${endereco.complemento ? `, ${endereco.complemento}` : ""} · ${endereco.bairro} · ${endereco.cidade}${endereco.uf ? ` - ${endereco.uf}` : ""} · CEP ${endereco.cep}`;
            const acoes = document.createElement("div");
            acoes.className = "endereco-acoes";
            const editar = document.createElement("button");
            editar.type = "button";
            editar.dataset.editarEndereco = String(indice);
            editar.textContent = "Editar";
            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.dataset.excluirEndereco = String(indice);
            excluir.textContent = "Excluir";
            acoes.append(editar, excluir);
            cartao.append(identificacao, detalhes, acoes);
            listaEnderecos.append(cartao);
        });
    };
    renderizarEnderecos();
    document.querySelectorAll("[data-abrir-endereco]").forEach(botao => botao.addEventListener("click", () => {
        if (vazioEnderecos) vazioEnderecos.hidden = true;
        if (salvosEnderecos) salvosEnderecos.hidden = true;
        if (formularioEndereco) {
            formularioEndereco.reset();
            formularioEndereco.querySelector("h1").textContent = "Novo endereço";
            formularioEndereco.hidden = false;
        }
        indiceEnderecoEditado = null;
    }));
    document.querySelector("[data-cancelar-endereco]")?.addEventListener("click", () => {
        if (formularioEndereco) formularioEndereco.hidden = true;
        indiceEnderecoEditado = null;
        renderizarEnderecos();
    });
    listaEnderecos?.addEventListener("click", evento => {
        const botaoEditar = evento.target.closest("[data-editar-endereco]");
        const botaoExcluir = evento.target.closest("[data-excluir-endereco]");
        if (botaoEditar) {
            indiceEnderecoEditado = Number(botaoEditar.dataset.editarEndereco);
            const endereco = enderecosSalvos[indiceEnderecoEditado];
            if (!endereco || !formularioEndereco) return;
            Object.entries(endereco).forEach(([campo, valor]) => {
                const input = formularioEndereco.elements.namedItem(campo);
                if (input) input.value = valor;
            });
            formularioEndereco.querySelector("h1").textContent = "Editar endereço";
            if (salvosEnderecos) salvosEnderecos.hidden = true;
            formularioEndereco.hidden = false;
        } else if (botaoExcluir) {
            const indice = Number(botaoExcluir.dataset.excluirEndereco);
            const endereco = enderecosSalvos[indice];
            if (!endereco || !window.confirm(`Excluir o endereço “${endereco.identificacao || "Endereço"}”?`)) return;
            enderecosSalvos.splice(indice, 1);
            localStorage.setItem(chaveCliente("garfooEnderecosCliente"), JSON.stringify(enderecosSalvos));
            renderizarEnderecos();
        }
    });
    const campoCep = document.querySelector("#cep-endereco");
    const statusCep = document.querySelector("[data-status-cep]");
    let ultimoCepConsultado = "";
    let consultaCepAtual;
    campoCep?.addEventListener("input", async () => {
        const digitosCep = campoCep.value.replace(/\D/g, "").slice(0, 8);
        campoCep.value = digitosCep.length > 5
            ? `${digitosCep.slice(0, 5)}-${digitosCep.slice(5)}`
            : digitosCep;
        const cep = digitosCep;
        if (cep.length !== 8 || cep === ultimoCepConsultado) return;
        ultimoCepConsultado = cep;
        consultaCepAtual?.abort();
        consultaCepAtual = new AbortController();
        statusCep.textContent = "Consultando CEP…";
        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: consultaCepAtual.signal });
            if (!resposta.ok) throw new Error("Não foi possível consultar este CEP.");
            const resultado = await resposta.json();
            if (resultado.erro) throw new Error("CEP não encontrado.");
            document.querySelector("#rua-endereco").value = resultado.logradouro || "";
            document.querySelector("#bairro-endereco").value = resultado.bairro || "";
            document.querySelector("#cidade-endereco").value = resultado.localidade || "";
            document.querySelector("#uf-endereco").value = resultado.uf || "";
            statusCep.textContent = "Endereço preenchido pelo CEP.";
        } catch (erro) {
            if (erro.name === "AbortError") return;
            statusCep.textContent = erro.message || "Não foi possível consultar o CEP.";
        }
    });
    formularioEndereco?.addEventListener("submit", evento => {
        evento.preventDefault();
        const endereco = Object.fromEntries(new FormData(formularioEndereco).entries());
        if (indiceEnderecoEditado === null) enderecosSalvos.push(endereco);
        else enderecosSalvos[indiceEnderecoEditado] = endereco;
        localStorage.setItem(chaveCliente("garfooEnderecosCliente"), JSON.stringify(enderecosSalvos));
        formularioEndereco.reset();
        formularioEndereco.hidden = true;
        formularioEndereco.querySelector("h1").textContent = "Novo endereço";
        indiceEnderecoEditado = null;
        renderizarEnderecos();
    });

    document.querySelector("[data-sair-conta]")?.addEventListener("click", () => {
        localStorage.removeItem(chaveUsuario);
        window.location.href = "indexInicio.html";
    });
})();
