const formularioSuporte = document.querySelector("[data-form-suporte]");
const endpointSuporte = window.GARFOO_SUPORTE_API_URL?.trim();
const camposSuporte = ["nome", "email", "assunto", "categoria", "mensagem"];

try {
    const armazenamento = window.GarfooEntregadorDados;
    const configuracao = armazenamento.ler("garfoo-entregador-config", {});
    const nome = armazenamento.ehEntregador ? (armazenamento.cadastro.nomeUsuario || configuracao?.conta?.nome || "") : "";
    document.querySelectorAll("[data-driver-name]").forEach(item => item.textContent = nome || "Entregador");
    const campoNome = formularioSuporte?.elements.namedItem("nome");
    if (campoNome && nome) campoNome.value = nome;
} catch (erro) {
    console.warn("Não foi possível carregar os dados do perfil.", erro);
}

function validarCampoSuporte(campo) {
    const valor = campo.value.trim();
    let erro = "";
    if (!valor) erro = "Este campo é obrigatório.";
    else if (campo.name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) erro = "Informe um e-mail válido.";
    else if (campo.name === "mensagem" && valor.length < 10) erro = "Descreva o problema com pelo menos 10 caracteres.";
    const mensagem = formularioSuporte.querySelector(`[data-erro-campo="${campo.name}"]`);
    if (mensagem) mensagem.textContent = erro;
    campo.setAttribute("aria-invalid", String(Boolean(erro)));
    return !erro;
}

formularioSuporte?.querySelectorAll("input, select, textarea").forEach(campo => {
    campo.addEventListener("input", () => {
        if (campo.value.trim()) validarCampoSuporte(campo);
        const estado = formularioSuporte.querySelector("[data-status-suporte]");
        if (estado) estado.textContent = "";
    });
});

formularioSuporte?.addEventListener("submit", async evento => {
    evento.preventDefault();
    const campos = camposSuporte.map(nome => formularioSuporte.elements.namedItem(nome));
    const primeiroInvalido = campos.find(campo => !validarCampoSuporte(campo));
    const estado = formularioSuporte.querySelector("[data-status-suporte]");
    const botao = formularioSuporte.querySelector("[data-enviar-suporte]");
    if (primeiroInvalido) {
        estado.textContent = "Revise os campos destacados antes de continuar.";
        primeiroInvalido.focus();
        return;
    }

    const payload = Object.fromEntries(campos.map(campo => [campo.name, campo.value.trim()]));
    formularioSuporte.setAttribute("aria-busy", "true");
    botao.disabled = true;

    if (!endpointSuporte) {
        botao.textContent = "Validando…";
        estado.textContent = "Sua solicitação está válida, mas ainda não foi transmitida. O serviço de suporte (API) não está configurado.";
        formularioSuporte.removeAttribute("aria-busy");
        botao.disabled = false;
        botao.textContent = "Enviar mensagem";
        return;
    }

    botao.textContent = "Enviando…";
    estado.textContent = "Enviando solicitação ao suporte…";
    try {
        const resposta = await fetch(endpointSuporte, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        estado.textContent = "Solicitação transmitida ao serviço de suporte.";
        formularioSuporte.reset();
        campos.forEach(campo => campo.removeAttribute("aria-invalid"));
    } catch (erro) {
        console.error("Não foi possível transmitir a solicitação de suporte:", erro);
        estado.textContent = "Não foi possível transmitir sua solicitação. Tente novamente mais tarde.";
    } finally {
        formularioSuporte.removeAttribute("aria-busy");
        botao.disabled = false;
        botao.textContent = "Enviar mensagem";
    }
});
