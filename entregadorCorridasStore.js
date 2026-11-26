(function () {
    const CHAVE = "garfoo-entregador-corridas";
    const armazenamentoEntregador = window.GarfooEntregadorDados;
    const CHAVE_HISTORICO = armazenamentoEntregador.chave("garfoo-entregador-historico-entregas");
    const CHAVE_DECISOES = armazenamentoEntregador.chave("garfoo-entregador-decisoes-corrida");
    const IDS_DEMONSTRACAO = new Set(["GF-605339", "GF-562112", "GF-108869", "GF-774037"]);
    const corridasIniciais = {
        atual: null,
        proximas: [],
        concluidas: [],
        recusadas: []
    };

    function limparCorridasDemonstracao(estado) {
        if (estado.atual && IDS_DEMONSTRACAO.has(String(estado.atual.id)) && !estado.atual.pedidoClienteId) estado.atual = null;
        ["proximas", "concluidas", "recusadas"].forEach(chave => {
            estado[chave] = (estado[chave] || []).filter(corrida => !IDS_DEMONSTRACAO.has(String(corrida.id)) || Boolean(corrida.pedidoClienteId));
        });
        return estado;
    }

    function ler() {
        try {
            const salvo = JSON.parse(localStorage.getItem(CHAVE) || "null");
            const estado = salvo && Array.isArray(salvo.proximas) && Array.isArray(salvo.concluidas)
                ? limparCorridasDemonstracao(salvo)
                : JSON.parse(JSON.stringify(corridasIniciais));
            localStorage.setItem(CHAVE, JSON.stringify(estado));
            return estado;
        } catch (erro) {
            console.warn("Não foi possível carregar as corridas do entregador:", erro);
            return JSON.parse(JSON.stringify(corridasIniciais));
        }
    }

    let estado = ler();
    function lerLista(chave) {
        try { const valor = JSON.parse(localStorage.getItem(chave) || "[]"); return Array.isArray(valor) ? valor : []; }
        catch { return []; }
    }
    let historicoPessoal = lerLista(CHAVE_HISTORICO).filter(corrida => !IDS_DEMONSTRACAO.has(String(corrida.id)) || Boolean(corrida.pedidoClienteId));
    let decisoesPessoais = lerLista(CHAVE_DECISOES);
    function salvarHistoricoPessoal() { localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historicoPessoal)); }
    function registrarDecisao(aceita) {
        decisoesPessoais.push({ aceita, em: new Date().toISOString() });
        localStorage.setItem(CHAVE_DECISOES, JSON.stringify(decisoesPessoais));
    }
    function inicioDoPeriodo(periodo, hoje = new Date()) {
        if (periodo === "total") return new Date(0);
        const inicio = new Date(hoje);
        inicio.setHours(0, 0, 0, 0);
        if (periodo === "semana") inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
        if (periodo === "mes") inicio.setDate(1);
        return inicio;
    }
    function obterIndicadores(periodo = "dia") {
        const inicio = inicioDoPeriodo(periodo);
        const entregas = historicoPessoal.filter(corrida => new Date(corrida.finalizadaEm) >= inicio);
        const decisoes = decisoesPessoais.filter(decisao => new Date(decisao.em) >= inicio);
        const aceitas = decisoes.filter(decisao => decisao.aceita).length;
        const recusadas = decisoes.length - aceitas;
        const minutos = entregas.reduce((total, corrida) => total + Number(corrida.duracaoMinutos || 0), 0);
        const distancia = entregas.reduce((total, corrida) => total + Number(corrida.distanciaKm || 0), 0);
        const ganhos = entregas.reduce((total, corrida) => total + Number(corrida.ganhoEntregador || 0), 0);
        return {
            entregas: entregas.length,
            aceitacao: decisoes.length ? Math.round(aceitas / decisoes.length * 100) : 0,
            conclusao: aceitas ? Math.round(entregas.length / aceitas * 100) : 0,
            tempoMedio: entregas.length ? Math.round(minutos / entregas.length) : 0,
            horas: minutos / 60,
            distancia,
            ganhos,
            totalDecisoes: decisoes.length,
            totalAceitas: aceitas
        };
    }
    let ganhosMigrados = false;
    estado.concluidas.forEach(corrida => {
        if (corrida.ganhoEntregador == null) { calcularGanho(corrida); ganhosMigrados = true; }
    });
    if (ganhosMigrados) localStorage.setItem(CHAVE, JSON.stringify(estado));
    function tarifas() {
        try {
            const salvas = JSON.parse(localStorage.getItem("garfooTarifasEntregador") || "{}");
            return {
                valorHora: Number(salvas.valorHora) || 8,
                valorKm: Number(salvas.valorKm) || 1.5,
                adicionalKm: Math.min(3.5, Math.max(2.5, Number(salvas.adicionalKm) || 2.5)),
                adicionalAtivo: Boolean(salvas.chuva || salvas.promocao || emHorarioPico())
            };
        } catch { return { valorHora: 8, valorKm: 1.5, adicionalKm: 2.5, adicionalAtivo: emHorarioPico() }; }
    }
    function emHorarioPico(data = new Date()) {
        const h = data.getHours();
        return (h >= 11 && h < 14) || (h >= 18 && h < 21);
    }
    function calcularGanho(corrida) {
        const tarifa = tarifas();
        const minutos = Math.max(1, Number(corrida.duracaoMinutos) || Math.ceil((new Date(corrida.finalizadaEm || Date.now()) - new Date(corrida.aceitoEm || Date.now())) / 60000));
        const distanciaEntre = (a, b) => {
            if (!a || !b) return 0;
            const rad = valor => valor * Math.PI / 180;
            const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
            const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
            return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        };
        const km = Math.max(0, Number(corrida.distanciaKm) || (distanciaEntre({ lat: -18.9078, lng: -48.2824 }, corrida.restauranteCoord) + distanciaEntre(corrida.restauranteCoord, corrida.clienteCoord)));
        corrida.distanciaKm = Number(km.toFixed(2));
        const adicional = tarifa.adicionalAtivo ? tarifa.adicionalKm : 0;
        corrida.duracaoMinutos = minutos;
        corrida.valorHoraAplicado = tarifa.valorHora;
        corrida.valorKmAplicado = tarifa.valorKm;
        corrida.adicionalKmAplicado = adicional;
        corrida.ganhoEntregador = Number((tarifa.valorHora * minutos / 60 + km * (tarifa.valorKm + adicional)).toFixed(2));
        return corrida.ganhoEntregador;
    }
    const dinheiro = valor => `R$ ${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    function pedidosDoCliente() {
        try {
            const pedidos = JSON.parse(localStorage.getItem("garfooPedidosCliente") || "[]");
            return Array.isArray(pedidos) ? pedidos : [];
        } catch { return []; }
    }

    function identidadeEntregadorLogado() {
        try {
            const sessao = JSON.parse(localStorage.getItem("garfooUsuarioLogado") || "{}");
            const dados = { ...(sessao.perfilEntregador || {}), ...(sessao.dados || sessao) };
            return {
                id: String(dados.id || dados.idUsuario || String(dados.cpf || "").replace(/\D/g, "") || sessao.id || ""),
                email: String(dados.emailUsuario || dados.email || sessao.emailUsuario || sessao.email || "").trim().toLocaleLowerCase("pt-BR"),
                nome: String(dados.nomeUsuario || dados.nomeCompleto || dados.nome || sessao.nomeUsuario || "Entregador")
            };
        } catch { return { id: "", email: "", nome: "Entregador" }; }
    }

    function traduzirPedidoCliente(pedido) {
        const item = pedido.itens?.[0] || {};
        const nomeRestaurante = item.restaurante || "Restaurante";
        const endereco = pedido.endereco || {};
        const enderecoCliente = typeof endereco === "string"
            ? endereco.trim()
            : (endereco.completo || endereco.enderecoCompleto || [
                endereco.rua || endereco.logradouro,
                endereco.numero,
                endereco.bairro || endereco.distrito,
                endereco.cidade || endereco.municipio,
                endereco.uf || endereco.estado || endereco.siglaEstado
            ].filter(Boolean).join(", "));
        const enderecosRestaurante = {
            "suba sushi": "Av. João Naves, 1234\nUberlândia, MG",
            "la morena": "Rua das Acácias, 145\nUberlândia, MG",
            "papa sushi": "Av. Rondon Pacheco, 850\nUberlândia, MG",
            "el rancho": "Rua João Felipe, 445\nUberlândia, MG"
        };
        const normalizado = nomeRestaurante.trim().toLocaleLowerCase("pt-BR");
        let enderecoRetirada = enderecosRestaurante[normalizado];
        if (!enderecoRetirada) {
            try {
                const indice = JSON.parse(localStorage.getItem("garfoo-owner-restaurantes") || "{}");
                const restaurante = (indice.restaurants || []).find(item => String(item.nomeRes || "").trim().toLocaleLowerCase("pt-BR") === normalizado);
                const dados = restaurante && JSON.parse(localStorage.getItem(`garfoo-owner-${restaurante.id}`) || "{}");
                enderecoRetirada = dados?.addresses?.[0] || dados?.restaurant?.enderecoRes;
                if (typeof enderecoRetirada === "object") {
                    enderecoRetirada = [enderecoRetirada.rua, enderecoRetirada.numero, enderecoRetirada.cidade, enderecoRetirada.uf].filter(Boolean).join(", ");
                }
            } catch (erro) { console.warn("Não foi possível localizar o endereço do restaurante:", erro); }
        }
        const nomesPossiveis = [pedido.clienteNome, pedido.nomeCliente, pedido.nomeCompletoCliente,
            pedido.cliente?.nome, pedido.cliente?.nomeUsuario, pedido.usuario?.dados?.nomeUsuario,
            pedido.usuario?.nomeUsuario, pedido.cartao?.nomeTitular, pedido.cartao?.titular,
            pedido.cartao?.nome, pedido.endereco?.nomeDestinatario].map(nome => String(nome || "").trim()).filter(Boolean);
        const nomeCliente = nomesPossiveis.find(nome => !/^cliente(?: garfoo)?$/i.test(nome)) || "Cliente";
        const ticket = pedido.numero || pedido.id;
        return {
            id: String(ticket), pedidoClienteId: String(pedido.id),
            restaurante: nomeRestaurante, imagem: item.logo || "./Fotos/logoFooter.png",
            enderecoRestaurante: enderecoRetirada || `${nomeRestaurante}\nEndereço de retirada não cadastrado`,
            cliente: nomeCliente, enderecoCliente: enderecoCliente || "Endereço de entrega informado no pedido",
            pagamento: pedido.cartao?.tipo || "Online", valor: Number(pedido.total || pedido.subtotal || 0),
            status: "disponivel", restauranteCoord: { lat: -18.9146, lng: -48.2750 },
            clienteCoord: { lat: -18.9228, lng: -48.2638 }
        };
    }

    function importarPedidosCliente() {
        const pedidos = pedidosDoCliente();
        pedidos.forEach(pedido => {
            if (!pedido || !pedido.id || ["Entregue", "Pedido entregue", "Cancelado", "Pedido cancelado"].includes(pedido.status)) return;
            const id = String(pedido.numero || pedido.id);
            const existe = estado.atual?.pedidoClienteId === String(pedido.id)
                || estado.proximas.some(corrida => corrida.pedidoClienteId === String(pedido.id))
                || estado.concluidas.some(corrida => corrida.pedidoClienteId === String(pedido.id));
            if (!existe) {
                const novaCorrida = traduzirPedidoCliente(pedido);
                if (!estado.atual || (!estado.atual.pedidoClienteId && estado.atual.status === "disponivel")) {
                    estado.atual = novaCorrida;
                } else {
                    estado.proximas.unshift(novaCorrida);
                }
            } else {
                const corridaSalva = estado.atual?.pedidoClienteId === String(pedido.id)
                    ? estado.atual
                    : estado.proximas.find(corrida => corrida.pedidoClienteId === String(pedido.id));
                if (corridaSalva) {
                    const dadosAtualizados = traduzirPedidoCliente(pedido);
                    corridaSalva.cliente = dadosAtualizados.cliente;
                    corridaSalva.enderecoCliente = dadosAtualizados.enderecoCliente;
                }
            }
        });
        localStorage.setItem(CHAVE, JSON.stringify(estado));
    }

    function salvar(evento) {
        localStorage.setItem(CHAVE, JSON.stringify(estado));
        renderizar();
        window.dispatchEvent(new CustomEvent(evento));
    }

    function promoverProxima() {
        estado.atual = estado.proximas.shift() || null;
        if (estado.atual) estado.atual.status = "disponivel";
    }

    function atualizarPedidoCliente(corrida, etapa, status) {
        if (corrida) corrida.entregador = corrida.entregador || identidadeEntregadorLogado();
        if (!corrida?.pedidoClienteId) return;
        const pedidos = pedidosDoCliente();
        const pedido = pedidos.find(item => String(item.id) === corrida.pedidoClienteId);
        if (!pedido) return;
        pedido.entregador = corrida.entregador;
        pedido.statusEntrega = etapa;
        pedido.status = status;
        pedido.statusAtualizadoEm = new Date().toISOString();
        if (etapa === "Pedido entregue") pedido.entregueEm = pedido.statusAtualizadoEm;
        localStorage.setItem("garfooPedidosCliente", JSON.stringify(pedidos));
    }

    function texto(no, valor) {
        if (no) no.textContent = valor || "";
    }

    function hora(valor) {
        return valor ? new Date(valor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
    }
    function chaveData(valor) {
        const data = new Date(valor);
        return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
    }

    function atualizarEtapas(corrida) {
        const etapas = document.querySelector(".entregador-etapas");
        if (!etapas) return;
        const ativa = corrida && ["aceita", "aguardando-retirada", "andamento"].includes(corrida.status);
        etapas.hidden = !ativa;
        if (!ativa) return;
        const nomes = corrida.status === "andamento"
            ? ["Aceito", "Retirada", "A caminho", "Entrega"]
            : corrida.status === "aguardando-retirada"
                ? ["Aceito", "Restaurante", "Aguardando retirada", "Entrega"]
                : ["Aceito", "Indo ao restaurante", "Retirada", "Entrega"];
        const horarios = [hora(corrida.aceitoEm), hora(corrida.iniciadoEm), corrida.status === "andamento" ? hora(new Date()) : "", ""];
        etapas.querySelectorAll("span").forEach((etapa, indice) => {
            const icone = etapa.querySelector("i");
            const horario = etapa.querySelector("small");
            if (icone) {
                const concluida = indice === 0 || (["aguardando-retirada", "andamento"].includes(corrida.status) && indice === 1)
                    || (corrida.status === "andamento" && indice === 2);
                icone.textContent = concluida ? "✓" : "•";
                icone.classList.toggle("feito", concluida);
            }
            const textoEtapa = [...etapa.childNodes].find(no => no.nodeType === Node.TEXT_NODE);
            if (textoEtapa) textoEtapa.textContent = nomes[indice] || "";
            texto(horario, horarios[indice]);
        });
    }

    function criarBotao(rotulo, acao, classe) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = rotulo;
        botao.dataset.acaoCorrida = acao;
        if (classe) botao.className = classe;
        return botao;
    }

    function renderizarAtual() {
        const card = document.querySelector(".entregador-proxima-corrida");
        if (!card) return;
        const corrida = estado.atual;
        const numero = card.querySelector(".entregador-identificador-pedido strong");
        const restaurante = card.querySelector(".entregador-corrida-restaurante strong");
        const imagem = card.querySelector(".entregador-corrida-restaurante img");
        const enderecoRestaurante = card.querySelector(".entregador-corrida-restaurante span");
        const cliente = card.querySelector(".entregador-corrida-cliente strong");
        const enderecoCliente = card.querySelector(".entregador-corrida-cliente p");
        const pagamento = card.querySelector(".entregador-corrida-total strong");
        const valor = card.querySelector(".entregador-corrida-total > b");
        const status = card.querySelector(".entregador-status-chip");
        const tempoCorrida = card.querySelector(".entregador-corrida-restaurante > b");
        const resumoRota = document.querySelector("[data-resumo-rota]");
        const resumoPagamento = card.querySelector(".entregador-corrida-total > b");
        const acoes = card.querySelector(".entregador-acoes-corrida");

        if (!corrida) {
            texto(restaurante, "Sem corridas disponíveis");
            texto(enderecoRestaurante, "Aguardando novas solicitações");
            texto(cliente, ""); texto(enderecoCliente, ""); texto(pagamento, ""); texto(valor, "");
            texto(status, "Sem corrida");
            if (imagem) imagem.hidden = true;
            if (tempoCorrida) tempoCorrida.hidden = true;
            texto(resumoRota, "Aguardando corrida");
            if (acoes) acoes.replaceChildren();
            atualizarEtapas(null);
            window.dispatchEvent(new CustomEvent("garfoo:corrida-sem-atual"));
            return;
        }

        if (imagem) { imagem.src = corrida.imagem; imagem.alt = corrida.restaurante; imagem.hidden = false; }
        const ativa = ["aceita", "aguardando-retirada", "andamento"].includes(corrida.status);
        const pedidoVinculado = pedidosDoCliente().find(pedido =>
            String(pedido.id) === String(corrida.pedidoClienteId || "")
            || String(pedido.numero || pedido.id) === String(corrida.id)
        );
        if (pedidoVinculado) {
            const dadosCliente = traduzirPedidoCliente(pedidoVinculado);
            corrida.cliente = dadosCliente.cliente;
            corrida.enderecoCliente = dadosCliente.enderecoCliente;
        }
        if (tempoCorrida) {
            tempoCorrida.hidden = !ativa;
            tempoCorrida.textContent = ativa ? "Calculando..." : "";
        }
        if (resumoRota) texto(resumoRota, ativa ? "Calculando rota..." : "Aceite para ver a rota");
        texto(numero, corrida.id);
        texto(restaurante, corrida.restaurante);
        texto(enderecoRestaurante, corrida.enderecoRestaurante);
        texto(cliente, corrida.cliente);
        texto(enderecoCliente, corrida.enderecoCliente);
        texto(pagamento, corrida.pagamento);
        texto(valor, dinheiro(corrida.valor));
        if (resumoPagamento) {
            const tarifa = tarifas();
            const km = Number(corrida.distanciaKm) || 0;
            const minutos = corrida.duracaoMinutos || 30;
            const estimativa = tarifa.valorHora * minutos / 60 + km * (tarifa.valorKm + (tarifa.adicionalAtivo ? tarifa.adicionalKm : 0));
            resumoPagamento.textContent = ativa ? `Estimativa de ganho: ${dinheiro(estimativa)}` : `Ganho estimado: ${dinheiro(estimativa)} · ${tarifa.valorHora}/h + ${tarifa.valorKm}/km${tarifa.adicionalAtivo ? ` + ${tarifa.adicionalKm}/km dinâmico` : ""}`;
        }
        const rotulosStatus = {
            disponivel: "Disponível",
            aceita: "Aceita",
            "aguardando-retirada": "Aguardando retirada",
            andamento: "Pedido em rota"
        };
        texto(status, rotulosStatus[corrida.status] || "Disponível");
        atualizarEtapas(corrida);
        if (acoes) {
            if (corrida.status === "disponivel") acoes.replaceChildren(criarBotao("Recusar", "recusar", "recusar"), criarBotao("Aceitar corrida", "aceitar", "aceitar"));
            else if (corrida.status === "aceita") acoes.replaceChildren(criarBotao("Ir ao restaurante", "iniciar", "aceitar"));
            else if (corrida.status === "aguardando-retirada") acoes.replaceChildren(criarBotao("Confirmar retirada", "retirar", "aceitar"));
            else acoes.replaceChildren(criarBotao("Finalizar entrega", "finalizar", "aceitar"));
        }
        window.dispatchEvent(new CustomEvent("garfoo:corrida-renderizada", { detail: corrida }));
    }

    function renderizarProximas() {
        const grade = document.querySelector(".entregador-pedidos-grid");
        if (!grade) return;
        grade.replaceChildren();
        estado.proximas.forEach(corrida => {
            const artigo = document.createElement("article");
            const cabecalho = document.createElement("div");
            const imagem = document.createElement("img");
            imagem.src = corrida.imagem; imagem.alt = corrida.restaurante;
            const nome = document.createElement("strong"); nome.textContent = corrida.restaurante;
            const distancia = document.createElement("span"); distancia.textContent = "Próxima";
            cabecalho.append(imagem, nome, distancia);
            const endereco = document.createElement("p"); endereco.textContent = corrida.enderecoRestaurante;
            const rodape = document.createElement("footer");
            const valor = document.createElement("b"); valor.textContent = `R$ ${corrida.valor.toFixed(2).replace(".", ",")}`;
            rodape.append(valor, criarBotao("Aceitar", "aceitar-disponivel", ""));
            rodape.lastElementChild.dataset.corridaId = corrida.id;
            artigo.append(cabecalho, endereco, rodape);
            grade.append(artigo);
        });
        if (!estado.proximas.length) {
            const vazio = document.createElement("p");
            vazio.textContent = "Não há outros pedidos próximos no momento.";
            grade.append(vazio);
        }
    }

    function renderizarHistorico() {
        const lista = document.querySelector(".lista-corridas");
        if (lista) {
            lista.querySelectorAll("[data-corrida-dinamica]").forEach(no => no.remove());
            lista.querySelector("[data-historico-vazio]")?.remove();
            if (!historicoPessoal.length) {
                const vazio = document.createElement("p");
                vazio.dataset.historicoVazio = "";
                vazio.className = "corridas-vazio";
                vazio.textContent = "Suas entregas finalizadas aparecerão aqui.";
                lista.append(vazio);
            }
            historicoPessoal.forEach(corrida => {
                const artigo = document.createElement("article");
                artigo.className = "card-pagina corrida-card";
                artigo.dataset.corridaDinamica = "";
                artigo.dataset.statusCorrida = "entregue";
                const cabecalho = document.createElement("div"); cabecalho.className = "corrida-topo";
                const titulo = document.createElement("strong"); titulo.textContent = `Pedido ${corrida.id} · ${corrida.restaurante}`;
                const status = document.createElement("span"); status.className = "status entregue"; status.textContent = "Entregue";
                cabecalho.append(titulo, status);
                const retirada = document.createElement("p"); retirada.innerHTML = "<b>Retirada</b> "; retirada.append(document.createTextNode(corrida.enderecoRestaurante.replace("\n", ", ")));
                const entrega = document.createElement("p"); entrega.innerHTML = "<b>Entrega</b> "; entrega.append(document.createTextNode(corrida.enderecoCliente.replace("\n", ", ")));
                const rodape = document.createElement("footer");
                const data = document.createElement("span"); data.textContent = new Date(corrida.finalizadaEm).toLocaleString("pt-BR");
                const valor = document.createElement("strong"); valor.textContent = dinheiro(corrida.ganhoEntregador);
                rodape.append(data, valor);
                artigo.append(cabecalho, retirada, entrega, rodape);
                lista.prepend(artigo);
            });
        }

        const pagamentos = document.querySelector(".pagamentos");
        if (pagamentos) {
            pagamentos.querySelectorAll("[data-corrida-dinamica]").forEach(no => no.remove());
            const filtroData = pagamentos.querySelector("[data-filtro-ganhos]")?.value;
            const concluidasFiltradas = historicoPessoal.filter(corrida => !filtroData || chaveData(corrida.finalizadaEm) === filtroData);
            concluidasFiltradas.forEach(corrida => {
                const linha = document.createElement("article"); linha.dataset.corridaDinamica = "";
                const info = document.createElement("span");
                const titulo = document.createElement("strong"); titulo.textContent = `Corrida ${corrida.id}`;
                const detalhe = document.createElement("small"); detalhe.textContent = `${new Date(corrida.finalizadaEm).toLocaleDateString("pt-BR")} · ${corrida.restaurante}`;
                info.append(titulo, detalhe);
                const valor = document.createElement("b"); valor.textContent = dinheiro(corrida.ganhoEntregador);
                const pago = document.createElement("em"); pago.textContent = "Concluída";
                linha.append(info, valor, pago);
                pagamentos.append(linha);
            });
        }

        const agora = new Date();
        const totalHoje = obterIndicadores("dia").ganhos;
        const resumos = [...document.querySelectorAll(".resumo-ganhos > article")];
        if (resumos.length) {
            const mesmaSemana = data => { const inicio = new Date(agora); inicio.setDate(agora.getDate() - ((agora.getDay() + 6) % 7)); inicio.setHours(0, 0, 0, 0); return data >= inicio; };
            const mesmoMes = data => data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
            const somar = predicate => historicoPessoal.filter(corrida => predicate(new Date(corrida.finalizadaEm)))
                .reduce((soma, corrida) => soma + Number(corrida.ganhoEntregador || 0), 0);
            const totalGeral = somar(() => true);
            const exibirValor = valor => `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const valoresAdicionais = [totalGeral, totalHoje, somar(mesmaSemana), somar(mesmoMes)];
            resumos.forEach((resumo, indice) => {
                const campo = resumo.querySelector("strong");
                if (!campo) return;
                campo.textContent = exibirValor(valoresAdicionais[indice] || 0);
            });
        }
        const ganhoInicio = document.querySelector("[data-ganho-hoje]");
        if (ganhoInicio) ganhoInicio.textContent = dinheiro(totalHoje);
    }

    function renderizarIndicadoresInicio() {
        const hoje = obterIndicadores("dia");
        const geral = obterIndicadores("total");
        const semana = obterIndicadores("semana");
        const formatoDinheiro = valor => `R$ ${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const campoEntregas = document.querySelector("[data-entregas-hoje]");
        const campoAceitacao = document.querySelector("[data-taxa-aceitacao]");
        const legendaAceitacao = document.querySelector("[data-aceitacao-legenda]");
        const ganhoSemana = document.querySelector("[data-ganho-semana]");
        const distanciaTotal = document.querySelector("[data-distancia-total]");
        const distanciaEntregas = document.querySelector("[data-distancia-entregas]");
        const tempoMedio = document.querySelector("[data-tempo-medio]");
        if (campoEntregas) campoEntregas.textContent = String(hoje.entregas);
        if (campoAceitacao) campoAceitacao.textContent = `${geral.aceitacao}%`;
        if (legendaAceitacao) legendaAceitacao.textContent = geral.totalDecisoes ? `${geral.totalAceitas} aceitas · ${geral.totalDecisoes - geral.totalAceitas} recusadas` : "Sem corridas avaliadas";
        if (ganhoSemana) ganhoSemana.textContent = formatoDinheiro(semana.ganhos);
        if (distanciaTotal) distanciaTotal.textContent = `${historicoPessoal.reduce((total, corrida) => total + Number(corrida.distanciaKm || 0), 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
        if (distanciaEntregas) distanciaEntregas.textContent = `Em ${historicoPessoal.length} corridas realizadas`;
        if (tempoMedio) {
            const minutos = historicoPessoal.reduce((total, corrida) => total + Number(corrida.duracaoMinutos || 0), 0);
            tempoMedio.textContent = `${historicoPessoal.length ? Math.round(minutos / historicoPessoal.length) : 0} min`;
        }
    }
    function renderizar() { renderizarAtual(); renderizarProximas(); renderizarHistorico(); renderizarIndicadoresInicio(); }
    function aceitarAtual() {
        estado = ler();
        if (!estado.atual || estado.atual.status !== "disponivel") return;
        registrarDecisao(true);
        estado.atual.status = "aceita";
        estado.atual.aceitoEm = new Date().toISOString();
        estado.atual.entregador = identidadeEntregadorLogado();
        atualizarPedidoCliente(estado.atual, "Em preparo", "Confirmado");
        salvar("garfoo:corrida-aceita");
    }
    function iniciarAtual() {
        if (!estado.atual || estado.atual.status !== "aceita") return;
        estado.atual.status = "aguardando-retirada";
        estado.atual.iniciadoEm = new Date().toISOString();
        atualizarPedidoCliente(estado.atual, "Aguardando a retirada do pedido", "Confirmado");
        salvar("garfoo:corrida-iniciada");
    }
    function confirmarRetirada() {
        if (!estado.atual || estado.atual.status !== "aguardando-retirada") return;
        estado.atual.status = "andamento";
        estado.atual.retiradoEm = new Date().toISOString();
        atualizarPedidoCliente(estado.atual, "Pedido em rota", "Confirmado");
        salvar("garfoo:corrida-em-rota");
    }
    function finalizarAtual() {
        if (!estado.atual || estado.atual.status !== "andamento") return;
        estado.atual.status = "entregue";
        estado.atual.finalizadaEm = new Date().toISOString();
        calcularGanho(estado.atual);
        atualizarPedidoCliente(estado.atual, "Pedido entregue", "Entregue");
        estado.concluidas.unshift(estado.atual);
        historicoPessoal.unshift(JSON.parse(JSON.stringify(estado.atual)));
        salvarHistoricoPessoal();
        promoverProxima();
        salvar("garfoo:corrida-finalizada");
    }
    function recusarAtual() {
        if (!estado.atual || estado.atual.status !== "disponivel") return;
        registrarDecisao(false);
        estado.recusadas.push(estado.atual);
        promoverProxima();
        salvar("garfoo:corrida-recusada");
    }
    function aceitarDisponivel(id) {
        estado = ler();
        if (estado.atual && estado.atual.status !== "disponivel") return;
        const index = estado.proximas.findIndex(corrida => corrida.id === id);
        if (index < 0) return;
        registrarDecisao(true);
        if (estado.atual) estado.proximas.push(estado.atual);
        estado.atual = estado.proximas.splice(index, 1)[0];
        estado.atual.status = "aceita";
        estado.atual.aceitoEm = new Date().toISOString();
        estado.atual.entregador = identidadeEntregadorLogado();
        atualizarPedidoCliente(estado.atual, "Em preparo", "Confirmado");
        salvar("garfoo:corrida-aceita");
    }

    document.addEventListener("click", evento => {
        const botao = evento.target.closest("[data-acao-corrida]");
        if (!botao) return;
        const acao = botao.dataset.acaoCorrida;
        if (acao === "aceitar") aceitarAtual();
        if (acao === "iniciar") iniciarAtual();
        if (acao === "retirar") confirmarRetirada();
        if (acao === "finalizar") finalizarAtual();
        if (acao === "recusar") recusarAtual();
        if (acao === "aceitar-disponivel") aceitarDisponivel(botao.dataset.corridaId);
    });
    document.addEventListener("change", evento => {
        if (evento.target.matches("[data-filtro-ganhos]")) renderizarHistorico();
    });

    window.addEventListener("storage", evento => {
        if (evento.key === CHAVE) { estado = ler(); renderizar(); }
        if (evento.key === CHAVE_HISTORICO) { historicoPessoal = lerLista(CHAVE_HISTORICO); renderizar(); }
        if (evento.key === CHAVE_DECISOES) { decisoesPessoais = lerLista(CHAVE_DECISOES); renderizar(); }
        if (evento.key === "garfooPedidosCliente") {
            estado = ler();
            importarPedidosCliente();
            const pedidos = pedidosDoCliente();
            const cancelados = new Set(pedidos.filter(pedido => ["Cancelado", "Pedido cancelado"].includes(pedido.status)).map(pedido => String(pedido.id)));
            estado.proximas = estado.proximas.filter(corrida => !cancelados.has(corrida.pedidoClienteId));
            if (estado.atual?.pedidoClienteId && cancelados.has(estado.atual.pedidoClienteId) && estado.atual.status === "disponivel") {
                estado.recusadas.push(estado.atual);
                promoverProxima();
                window.dispatchEvent(new CustomEvent("garfoo:corrida-recusada"));
            }
            localStorage.setItem(CHAVE, JSON.stringify(estado));
            renderizar();
        }
    });
    window.setInterval(() => {
        if (estado.atual && ["aceita", "andamento"].includes(estado.atual.status)) atualizarEtapas(estado.atual);
    }, 15000);
    window.GarfooCorridas = {
        obterAtual: () => estado.atual,
        obterEstado: () => estado,
        obterHistorico: () => historicoPessoal.map(corrida => ({ ...corrida })),
        obterIndicadores,
        renderizar,
        aceitarAtual,
        iniciarAtual,
        finalizarAtual,
        confirmarRetirada,
        recusarAtual,
        registrarRota: (distanciaKm, duracaoMinutos) => {
            if (!estado.atual) return;
            estado.atual.distanciaKm = Number(distanciaKm) || 0;
            if (duracaoMinutos) estado.atual.duracaoRotaMinutos = Number(duracaoMinutos);
            localStorage.setItem(CHAVE, JSON.stringify(estado));
            renderizarAtual();
        }
    };
    importarPedidosCliente();
    renderizar();
})();
