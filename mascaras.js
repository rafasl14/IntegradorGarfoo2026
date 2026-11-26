(() => {
    const digitos = valor => String(valor || "").replace(/\D/g, "");

    function cpfOuCnpj(valor) {
        const numeros = digitos(valor).slice(0, 14);
        if (numeros.length <= 11) {
            return numeros
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
        }
        return numeros
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
            .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
    }

    function cpf(valor) {
        return digitos(valor).slice(0, 11)
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    }

    function telefone(valor) {
        const numeros = digitos(valor).slice(0, 11);
        if (numeros.length <= 2) return numeros;
        const ddd = numeros.slice(0, 2);
        const local = numeros.slice(2);
        if (local.length <= 4) return `(${ddd}) ${local}`;
        if (numeros.length <= 10) return `(${ddd}) ${local.slice(0, 4)}-${local.slice(4)}`;
        return `(${ddd}) ${local.slice(0, 5)}-${local.slice(5)}`;
    }

    function identificar(campo) {
        if (campo.dataset.mascara) return "";
        const nome = String(campo.name || "").toLowerCase();
        const autocomplete = String(campo.autocomplete || "").toLowerCase();
        const rotulo = campo.closest("label")?.textContent.toLowerCase() || "";
        if (nome === "cep" || autocomplete === "postal-code" || /\bcep\b/.test(rotulo)) return "cep";
        if (nome === "uf" || /\buf\b/.test(rotulo)) return "uf";
        if (nome === "cvv" || autocomplete === "cc-csc" || /\bcvv\b/.test(rotulo)) return "cvv";
        if (nome === "chavepix") {
            const tipo = String(campo.form?.elements.namedItem("tipoPix")?.value || "").toLowerCase();
            if (tipo === "cpf" || tipo === "cnpj") return tipo;
            if (tipo === "telefone") return "telefone";
        }
        if ((nome === "usuario" || campo.id === "usuario") && /e-mail.*cpf|cpf.*e-mail/.test(String(campo.placeholder || rotulo).toLowerCase())) return "login";
        if (nome === "cpf" || nome === "cnpj") return nome;
        if (nome === "documento" && /cpf|cnpj/.test(rotulo)) return "cpfcnpj";
        if (nome.includes("telefone") || autocomplete === "tel" || campo.type === "tel" || /telefone|celular/.test(rotulo)) return "telefone";
        return "";
    }

    function aplicar(campo) {
        const tipo = identificar(campo);
        if (!tipo) return;
        if (tipo === "login") {
            if (/[a-z@]/i.test(campo.value)) {
                if (campo.dataset.cpfMascarado === "true") campo.value = campo.value.replace(/[./-]/g, "");
                delete campo.dataset.cpfMascarado;
                return;
            }
            if (/^[\d./\-\s]*$/.test(campo.value)) {
                campo.value = cpf(campo.value);
                campo.dataset.cpfMascarado = "true";
            }
            return;
        }
        if (tipo === "cep") {
            const numeros = digitos(campo.value).slice(0, 8);
            campo.value = numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
        }
        else if (tipo === "uf") campo.value = campo.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
        else if (tipo === "cvv") campo.value = digitos(campo.value).slice(0, 4);
        else if (tipo === "telefone") campo.value = telefone(campo.value);
        else if (tipo === "cpf") campo.value = cpf(campo.value);
        else campo.value = cpfOuCnpj(campo.value);
    }

    document.addEventListener("input", evento => {
        const campo = evento.target;
        if (campo instanceof HTMLInputElement) aplicar(campo);
    });

    document.addEventListener("change", evento => {
        const campo = evento.target;
        if (campo instanceof HTMLSelectElement && campo.name === "tipoPix") {
            const chave = campo.form?.elements.namedItem("chavePix");
            if (chave) aplicar(chave);
        }
    });

    document.querySelectorAll("input").forEach(aplicar);
})();
