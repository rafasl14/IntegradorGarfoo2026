(() => {
    const lista = document.querySelector("[data-itens-carrinho]");
    const vazio = document.querySelector("[data-carrinho-vazio]");
    const resumo = document.querySelector("[data-carrinho-resumo]");
    const totalEl = document.querySelector("[data-total-carrinho]");
    const subtotalEl = document.querySelector("[data-subtotal-carrinho]");
    const entregaTotalEl = document.querySelector("[data-total-entrega]");
    const quantidadeEl = document.querySelector("[data-quantidade-carrinho]");
    const modalConfirmacao = document.querySelector("[data-modal-observacao]");
    const botaoAbrirConfirmacao = document.querySelector("[data-abrir-confirmacao]");
    const seletorEndereco = document.querySelector("[data-selecionar-endereco]");
    const seletorEnderecoRotulo = document.querySelector("[data-seletor-endereco-wrap]");
    const avisoSemEndereco = document.querySelector("[data-aviso-sem-endereco]");
    const avisoSemCartao = document.querySelector("[data-aviso-sem-cartao]");
    const formularioEnderecoPedido = document.querySelector("[data-form-endereco-checkout]");
    const botaoEnderecoNovo = document.querySelector("[data-cadastrar-outro-endereco]");
    const formularioCartaoCheckout = document.querySelector("[data-form-cartao-checkout]");
    const seletorCartao = document.querySelector("[data-selecionar-cartao]");
    const rotuloCartaoSalvo = document.querySelector("[data-cartao-salvo-label]");
    const botaoCartaoNovo = document.querySelector("[data-cadastrar-outro-cartao]");
    const campoNumeroCartao = document.querySelector("[data-numero-cartao]");
    const campoValidadeCartao = document.querySelector("[data-validade-cartao]");
    const campoCvvCartao = formularioCartaoCheckout.querySelector('[name="cvv"]');
    const campoCpfCheckout = formularioCartaoCheckout.querySelector('[name="cpf"]');
    const campoCepCheckout = document.querySelector("[data-cep-endereco-checkout]");
    const statusCepCheckout = document.querySelector("[data-status-cep-checkout]");
    const botaoSalvarEnderecoPedido = document.querySelector("[data-salvar-endereco-pedido]");
    const statusPedidoConfirmado = document.querySelector("[data-pedido-confirmado]");
    const chaveCliente = base => window.GarfooClienteStore.chave(base);
    const chaveCarrinho = chaveCliente("garfooCarrinho");
    let ultimoCepCheckout = "";
    let consultaCepCheckout;

    function escaparHtml(valor) {
        return String(valor || "").replace(/[&<>\"']/g, caractere => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
        }[caractere]));
    }

    function lerCarrinho() {
        try {
            const produtos = JSON.parse(localStorage.getItem(chaveCarrinho) || "[]");
            return Array.isArray(produtos) ? produtos : [];
        } catch (erro) {
            console.error("Não foi possível ler o carrinho:", erro);
            return [];
        }
    }

    function moeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function lerEnderecos() {
        try {
            const enderecos = JSON.parse(localStorage.getItem(chaveCliente("garfooEnderecosCliente")) || "[]");
            return Array.isArray(enderecos) ? enderecos : [];
        } catch {
            return [];
        }
    }

    function lerCartoes() {
        try {
            const cartoes = JSON.parse(localStorage.getItem(chaveCliente("garfooCartoesCliente")) || "[]");
            return Array.isArray(cartoes) ? cartoes : [];
        } catch {
            return [];
        }
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

    function prepararCartoes() {
        const cartoes = lerCartoes();
        seletorCartao.replaceChildren();
        avisoSemCartao.hidden = cartoes.length > 0;
        cartoes.forEach((cartao, indice) => {
            const opcao = document.createElement("option");
            opcao.value = String(indice);
            opcao.textContent = `${cartao.apelido || cartao.tipo} ···· ${cartao.finais}`;
            seletorCartao.append(opcao);
        });
        if (cartoes.length) {
            const novo = document.createElement("option");
            novo.value = "novo";
            novo.textContent = "Cadastrar outro cartão";
            seletorCartao.append(novo);
            rotuloCartaoSalvo.hidden = false;
            botaoCartaoNovo.hidden = false;
            formularioCartaoCheckout.hidden = false;
            formularioCartaoCheckout.hidden = seletorCartao.value !== "novo";
        } else {
            rotuloCartaoSalvo.hidden = true;
            botaoCartaoNovo.hidden = true;
            formularioCartaoCheckout.hidden = false;
        }
    }

    function prepararEnderecos() {
        const enderecos = lerEnderecos();
        avisoSemEndereco.hidden = enderecos.length > 0;
        seletorEndereco.replaceChildren();
        enderecos.forEach((endereco, indice) => {
            const opcao = document.createElement("option");
            opcao.value = String(indice);
            opcao.textContent = `${endereco.identificacao || "Endereço"} — ${endereco.rua}, ${endereco.numero} · ${endereco.cidade}`;
            seletorEndereco.append(opcao);
        });
        if (enderecos.length) {
            const opcaoNovo = document.createElement("option");
            opcaoNovo.value = "novo";
            opcaoNovo.textContent = "Cadastrar novo endereço";
            seletorEndereco.append(opcaoNovo);
            seletorEndereco.hidden = false;
            seletorEnderecoRotulo.hidden = false;
            botaoEnderecoNovo.hidden = false;
            formularioEnderecoPedido.hidden = seletorEndereco.value !== "novo";
        } else {
            seletorEndereco.hidden = true;
            seletorEnderecoRotulo.hidden = true;
            botaoEnderecoNovo.hidden = true;
            formularioEnderecoPedido.hidden = false;
        }
    }

    function taxaEntrega(produto) {
        const texto = String(produto.entrega || "");
        if (/grátis/i.test(texto)) return 0;
        const valor = texto.match(/R\$\s*([\d.,]+)/i)?.[1];
        if (!valor) return null;
        const normalizado = valor.replace(/\./g, "").replace(",", ".");
        const numero = Number(normalizado);
        return Number.isFinite(numero) ? numero : null;
    }

    function renderizar() {
        const produtos = lerCarrinho();
        const agrupados = produtos.reduce((grupos, produto) => {
            const restaurante = produto.restaurante || "Restaurante";
            (grupos[restaurante] ||= []).push(produto);
            return grupos;
        }, {});

        lista.innerHTML = Object.entries(agrupados).map(([restaurante, itens]) => `
            <section class="carrinho-grupo-produtos">
                <div class="carrinho-grupo">${itens.find(item => item.logo)?.logo
                    ? `<img class="carrinho-grupo-icone" src="${escaparHtml(itens.find(item => item.logo).logo)}" alt="Logo de ${escaparHtml(restaurante)}">`
                    : `<span class="carrinho-grupo-icone" aria-hidden="true">${escaparHtml(restaurante.slice(0, 1).toUpperCase())}</span>`
                }${escaparHtml(restaurante)}</div>
                ${itens.map(produto => {
                    const id = escaparHtml(produto.id);
                    const nome = escaparHtml(produto.nome);
                    const imagem = escaparHtml(produto.imagem);
                    const observacao = escaparHtml(produto.observacao);
                    const quantidade = Math.max(1, Number(produto.quantidade) || 1);
                    const preco = Number(produto.preco) || 0;
                    const valorFrete = taxaEntrega(produto);
                    const frete = valorFrete === null ? "Não informada" : valorFrete === 0 ? "Grátis" : moeda(valorFrete);
                    return `<article class="carrinho-produto" data-produto-carrinho="${id}">
                        <div class="carrinho-produto-info">
                            ${imagem ? `<img src="${imagem}" alt="${nome}">` : ""}
                            <span class="carrinho-produto-nome">${nome}${observacao ? `<small class="carrinho-produto-observacao">Obs.: ${observacao}</small>` : ""}</span>
                        </div>
                        <div class="carrinho-produto-preco"><span>${moeda(preco)}</span><small>Entrega: ${escaparHtml(frete)}</small></div>
                        <div class="carrinho-produto-acoes">
                            <div class="carrinho-quantidade" aria-label="Quantidade de ${nome}">
                                <button type="button" data-mudar-quantidade="-1" aria-label="Diminuir quantidade">−</button>
                                <output>${quantidade}</output>
                                <button type="button" data-mudar-quantidade="1" aria-label="Aumentar quantidade">+</button>
                            </div>
                            <button class="carrinho-remover" type="button" data-remover-produto>Remover</button>
                        </div>
                    </article>`;
                }).join("")}
            </section>
        `).join("");

        lista.querySelectorAll(".carrinho-produto-info img").forEach(imagem => {
            imagem.addEventListener("error", () => { imagem.hidden = true; }, { once: true });
        });
        lista.querySelectorAll(".carrinho-grupo-icone[src]").forEach(imagem => {
            imagem.addEventListener("error", () => {
                const fallback = document.createElement("span");
                fallback.className = "carrinho-grupo-icone";
                fallback.setAttribute("aria-hidden", "true");
                fallback.textContent = imagem.alt.replace(/^Logo de\s*/i, "").slice(0, 1).toUpperCase();
                imagem.replaceWith(fallback);
            }, { once: true });
        });

        const subtotal = produtos.reduce((soma, produto) => soma + (Number(produto.preco) || 0) * Math.max(1, Number(produto.quantidade) || 1), 0);
        const taxasRestaurantes = Object.values(agrupados).map(itens => taxaEntrega(itens[0]));
        const taxaTotal = taxasRestaurantes.some(taxa => taxa === null) ? null : taxasRestaurantes.reduce((soma, taxa) => soma + taxa, 0);
        const total = subtotal + (taxaTotal ?? 0);
        const quantidadeTotal = produtos.reduce((soma, produto) => soma + Math.max(1, Number(produto.quantidade) || 1), 0);
        vazio.hidden = produtos.length > 0;
        resumo.hidden = produtos.length === 0;
        totalEl.textContent = moeda(total);
        subtotalEl.textContent = moeda(subtotal);
        entregaTotalEl.textContent = taxaTotal === null ? "A confirmar" : taxaTotal === 0 ? "Grátis" : moeda(taxaTotal);
        quantidadeEl.textContent = String(quantidadeTotal);
    }

    lista.addEventListener("click", evento => {
        const linha = evento.target.closest("[data-produto-carrinho]");
        if (!linha) return;
        const id = linha.dataset.produtoCarrinho;
        const produtos = lerCarrinho();

        if (evento.target.closest("[data-remover-produto]")) {
            localStorage.setItem(chaveCarrinho, JSON.stringify(produtos.filter(produto => produto.id !== id)));
            renderizar();
            return;
        }

        const botaoQuantidade = evento.target.closest("[data-mudar-quantidade]");
        if (!botaoQuantidade) return;
        const produto = produtos.find(item => item.id === id);
        if (!produto) return;
        produto.quantidade = Math.max(1, (Number(produto.quantidade) || 1) + Number(botaoQuantidade.dataset.mudarQuantidade));
        localStorage.setItem(chaveCarrinho, JSON.stringify(produtos));
        renderizar();
    });

    function fecharModalConfirmacao() {
        modalConfirmacao.hidden = true;
        modalConfirmacao.setAttribute("aria-hidden", "true");
        document.body.classList.remove("carrinho-modal-aberto");
        botaoAbrirConfirmacao.focus();
    }

    botaoAbrirConfirmacao.addEventListener("click", () => {
        if (!lerCarrinho().length) return;
        prepararEnderecos();
        prepararCartoes();
        modalConfirmacao.hidden = false;
        modalConfirmacao.setAttribute("aria-hidden", "false");
        document.body.classList.add("carrinho-modal-aberto");
        const primeiroCampoEndereco = formularioEnderecoPedido.querySelector("input");
        const primeiroCampoCartao = formularioCartaoCheckout.querySelector("input, select");
        (formularioEnderecoPedido.hidden ? (formularioCartaoCheckout.hidden ? seletorCartao : primeiroCampoCartao) : primeiroCampoEndereco)?.focus();
    });

    modalConfirmacao.querySelectorAll("[data-fechar-confirmacao]").forEach(botao => {
        botao.addEventListener("click", fecharModalConfirmacao);
    });

    seletorEndereco.addEventListener("change", () => {
        formularioEnderecoPedido.hidden = seletorEndereco.value !== "novo";
    });
    botaoEnderecoNovo.addEventListener("click", () => {
        seletorEndereco.value = "novo";
        formularioEnderecoPedido.hidden = false;
        formularioEnderecoPedido.querySelector("input")?.focus();
    });
    seletorCartao.addEventListener("change", () => {
        formularioCartaoCheckout.hidden = seletorCartao.value !== "novo";
    });
    botaoCartaoNovo.addEventListener("click", () => {
        seletorCartao.value = "novo";
        formularioCartaoCheckout.hidden = false;
        campoNumeroCartao.focus();
    });
    campoNumeroCartao.addEventListener("input", () => {
        const digitos = campoNumeroCartao.value.replace(/\D/g, "").slice(0, 19);
        campoNumeroCartao.value = digitos.replace(/(.{4})/g, "$1 ").trim();
    });
    campoValidadeCartao.addEventListener("input", () => {
        const digitos = campoValidadeCartao.value.replace(/\D/g, "").slice(0, 4);
        campoValidadeCartao.value = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
    });
    campoCvvCartao.addEventListener("input", () => {
        campoCvvCartao.value = campoCvvCartao.value.replace(/\D/g, "").slice(0, 4);
    });
    campoCepCheckout.addEventListener("input", async () => {
        const cep = campoCepCheckout.value.replace(/\D/g, "").slice(0, 8);
        if (cep.length !== 8) {
            ultimoCepCheckout = "";
            consultaCepCheckout?.abort();
            statusCepCheckout.textContent = "";
            return;
        }
        if (cep === ultimoCepCheckout) return;
        ultimoCepCheckout = cep;
        consultaCepCheckout?.abort();
        consultaCepCheckout = new AbortController();
        statusCepCheckout.textContent = "Consultando CEP…";
        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: consultaCepCheckout.signal });
            if (!resposta.ok) throw new Error("Não foi possível consultar este CEP.");
            const resultado = await resposta.json();
            if (resultado.erro) throw new Error("CEP não encontrado.");
            formularioEnderecoPedido.querySelector('[name="rua"]').value = resultado.logradouro || "";
            formularioEnderecoPedido.querySelector('[name="bairro"]').value = resultado.bairro || "";
            formularioEnderecoPedido.querySelector('[name="cidade"]').value = resultado.localidade || "";
            formularioEnderecoPedido.querySelector('[name="uf"]').value = resultado.uf || "";
            statusCepCheckout.textContent = "Endereço preenchido pelo CEP.";
        } catch (erro) {
            if (erro.name === "AbortError") return;
            statusCepCheckout.textContent = erro.message || "Não foi possível consultar este CEP.";
        }
    });
    botaoSalvarEnderecoPedido.addEventListener("click", () => {
        const enderecos = lerEnderecos();
        const cartoes = lerCartoes();
        let endereco;
        if (!formularioEnderecoPedido.hidden) {
            const campos = [...formularioEnderecoPedido.querySelectorAll("input")];
            const invalido = campos.find(campo => !campo.checkValidity());
            if (invalido) { invalido.reportValidity(); return; }
            endereco = Object.fromEntries(campos.map(campo => [campo.name, campo.value.trim()]));
        } else {
            endereco = enderecos[Number(seletorEndereco.value)];
            if (!endereco) return;
        }
        let cartao;
        if (formularioCartaoCheckout.hidden) {
            cartao = cartoes[Number(seletorCartao.value)];
            if (!cartao) return;
        } else {
            const camposCartao = [...formularioCartaoCheckout.querySelectorAll("input, select")];
            const invalidoCartao = camposCartao.find(campo => !campo.checkValidity());
            if (invalidoCartao) { invalidoCartao.reportValidity(); return; }
            if (!cpfValido(campoCpfCheckout.value)) {
                campoCpfCheckout.setCustomValidity("Digite um CPF válido.");
                campoCpfCheckout.reportValidity();
                campoCpfCheckout.setCustomValidity("");
                return;
            }
            const numero = campoNumeroCartao.value.replace(/\D/g, "");
            if (numero.length < 13 || numero.length > 19) {
                campoNumeroCartao.setCustomValidity("Digite um número de cartão válido.");
                campoNumeroCartao.reportValidity();
                campoNumeroCartao.setCustomValidity("");
                return;
            }
            const [mes, ano] = campoValidadeCartao.value.split("/").map(Number);
            const agora = new Date();
            const anoAtual = Number(String(agora.getFullYear()).slice(-2));
            if (mes < 1 || mes > 12 || !ano || ano < anoAtual || (ano === anoAtual && mes < agora.getMonth() + 1)) {
                campoValidadeCartao.setCustomValidity("Informe uma validade no formato MM/AA.");
                campoValidadeCartao.reportValidity();
                campoValidadeCartao.setCustomValidity("");
                return;
            }
            if (campoCvvCartao.value.length < 3) {
                campoCvvCartao.setCustomValidity("Digite o código de segurança do cartão.");
                campoCvvCartao.reportValidity();
                campoCvvCartao.setCustomValidity("");
                return;
            }
            cartao = {
                tipo: formularioCartaoCheckout.querySelector('[name="tipoCartao"]').value,
                finais: numero.slice(-4),
                nomeTitular: formularioCartaoCheckout.querySelector('[name="nomeTitular"]').value.trim(),
                apelido: formularioCartaoCheckout.querySelector('[name="apelido"]').value.trim()
            };
            cartao.novo = true;
        }
        if (!formularioEnderecoPedido.hidden) {
            enderecos.push(endereco);
            localStorage.setItem(chaveCliente("garfooEnderecosCliente"), JSON.stringify(enderecos));
        }
        if (cartao.novo) {
            delete cartao.novo;
            cartoes.push(cartao);
            localStorage.setItem(chaveCliente("garfooCartoesCliente"), JSON.stringify(cartoes));
        }
        const produtosPedido = lerCarrinho();
        const gruposPedido = new Map();
        let subtotalPedido = 0;
        produtosPedido.forEach(produto => {
            const quantidade = Math.max(1, Number(produto.quantidade) || 1);
            subtotalPedido += (Number(produto.preco) || 0) * quantidade;
            const restaurante = produto.restaurante || "Restaurante";
            if (!gruposPedido.has(restaurante)) gruposPedido.set(restaurante, produto);
        });
        const taxasPedido = [...gruposPedido.values()].map(taxaEntrega);
        const taxaTotalPedido = taxasPedido.some(taxa => taxa === null) ? null : taxasPedido.reduce((soma, taxa) => soma + taxa, 0);
        const temposPedido = [...gruposPedido.values()].map(produto => {
            const intervalo = String(produto.entrega || "").match(/(\d+)\s*[–-]\s*(\d+)\s*min/i);
            return intervalo ? { minimo: Number(intervalo[1]), maximo: Number(intervalo[2]) } : null;
        });
        const previsaoEntregaMinutos = temposPedido.length && temposPedido.every(Boolean)
            ? { minimo: Math.max(...temposPedido.map(item => item.minimo)), maximo: Math.max(...temposPedido.map(item => item.maximo)) }
            : { minimo: 30, maximo: 45 };
        const dataHoraPedido = new Date().toISOString();
        let restaurantesCadastrados = [];
        try {
            const indice = JSON.parse(localStorage.getItem("garfoo-owner-restaurantes") || "{}");
            restaurantesCadastrados = Array.isArray(indice.restaurants) ? indice.restaurants : [];
        } catch { restaurantesCadastrados = []; }
        const normalizarNomeRestaurante = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
        const pedido = {
            id: `GF-${Date.now()}`,
            numero: `GF-${String(Date.now()).slice(-6)}`,
            dataHora: dataHoraPedido,
            status: "Confirmado",
            statusEntrega: "Aguardando confirmação do restaurante",
            statusAtualizadoEm: dataHoraPedido,
            clienteId: window.GarfooClienteStore.identidade().id,
            clienteEmail: window.GarfooClienteStore.identidade().email,
            clienteNome: (() => {
                try {
                    const usuario = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null");
                    const dados = usuario?.dados || usuario || {};
                    return dados.nomeUsuario || dados.nomeCompleto || dados.nome || usuario?.nomeUsuario || usuario?.nome || cartao.nomeTitular || "Cliente";
                } catch { return "Cliente"; }
            })(),
            itens: produtosPedido.map(produto => ({
                id: produto.id,
                nome: produto.nome || "Produto",
                restaurante: produto.restaurante || "Restaurante",
                codRestaurante: produto.codRestaurante || produto.restauranteId || restaurantesCadastrados.find(restaurante => normalizarNomeRestaurante(restaurante.nomeRes) === normalizarNomeRestaurante(produto.restaurante))?.id || null,
                imagem: produto.imagem || "",
                logo: produto.logo || "",
                entrega: produto.entrega || "",
                observacao: produto.observacao || "",
                quantidade: Math.max(1, Number(produto.quantidade) || 1),
                preco: Number(produto.preco) || 0
            })),
            subtotal: Number(subtotalPedido.toFixed(2)),
            taxaEntrega: taxaTotalPedido === null ? null : Number(taxaTotalPedido.toFixed(2)),
            previsaoEntregaMinutos,
            total: Number((subtotalPedido + (taxaTotalPedido ?? 0)).toFixed(2)),
            endereco,
            cartao: { tipo: cartao.tipo, finais: cartao.finais, apelido: cartao.apelido }
        };
        let pedidos = [];
        try {
            const salvos = JSON.parse(localStorage.getItem("garfooPedidosCliente") || "[]");
            pedidos = Array.isArray(salvos) ? salvos : [];
        } catch { pedidos = []; }
        pedidos.push(pedido);
        localStorage.setItem("garfooPedidosCliente", JSON.stringify(pedidos));
        localStorage.setItem(chaveCliente("garfooEnderecoPedido"), JSON.stringify(endereco));
        localStorage.setItem(chaveCliente("garfooCartaoPedido"), JSON.stringify(cartao));
        localStorage.removeItem(chaveCarrinho);
        localStorage.removeItem("garfooObservacaoPedido");
        campoNumeroCartao.value = "";
        campoCvvCartao.value = "";
        if (statusPedidoConfirmado) statusPedidoConfirmado.hidden = false;
        renderizar();
        fecharModalConfirmacao();
    });

    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !modalConfirmacao.hidden) fecharModalConfirmacao();
    });

    try {
        const usuario = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "null");
        const nomeUsuario = usuario?.dados?.nomeUsuario || usuario?.nomeUsuario;
        if (nomeUsuario) document.querySelector("[data-saudacao-usuario]").textContent = `Olá, ${nomeUsuario.trim().split(/\s+/)[0]}!`;
    } catch (erro) {
        console.error("Não foi possível recuperar o usuário logado:", erro);
    }
    renderizar();
})();
