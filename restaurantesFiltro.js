(() => {
    const seletores = document.querySelectorAll(".busca-cliente select[aria-label='Filtrar por restaurante']");
    if (!seletores.length) return;

    fetch("cardapios_restaurantes.json?v=20261114-7")
        .then(resposta => {
            if (!resposta.ok) throw new Error("Não foi possível carregar os restaurantes.");
            return resposta.json();
        })
        .then(dados => {
            const normalizar = nome => String(nome || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .replace(/\s+/g, " ")
                .toLocaleLowerCase("pt-BR");
            const nomes = [...new Set((dados.restaurantes || [])
                .map(restaurante => String(restaurante.nomeRes || "").trim())
                .filter(nome => nome && normalizar(nome) !== "la tour des saveurs"))]
                .sort((a, b) => a.localeCompare(b, "pt-BR"));

            seletores.forEach(seletor => {
                const selecionado = seletor.value || seletor.selectedOptions[0]?.textContent.trim();
                seletor.replaceChildren(new Option("Todos os restaurantes", ""));
                nomes.forEach(nome => seletor.add(new Option(nome, nome)));
                if (selecionado && [...seletor.options].some(opcao => opcao.value === selecionado)) {
                    seletor.value = selecionado;
                }
            });
        })
        .catch(erro => console.error("Erro ao atualizar o filtro de restaurantes:", erro));
})();
