(() => {
  const state = {
    restaurant: null,
    menu: [],
    orders: [],
    addresses: [],
    data: null,
    editingId: null,
    restaurants: [],
    ownerName: "",
    ownerId: null,
    activeRestaurantId: null,
    deletedRestaurantIds: []
  };

  const RESTAURANTS_KEY = "garfoo-owner-restaurantes";
  const CLIENT_ORDERS_KEY = "garfooPedidosCliente";

  const normalizedName = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");

  function ordersForRestaurant(id, restaurant) {
    let pedidosCliente = [];
    try {
      const saved = JSON.parse(localStorage.getItem(CLIENT_ORDERS_KEY) || "[]");
      pedidosCliente = Array.isArray(saved) ? saved : [];
    } catch { pedidosCliente = []; }
    const nome = normalizedName(restaurant?.nomeRes);
    return pedidosCliente.flatMap(pedido => {
      const itensRestaurante = (pedido.itens || []).filter(item => {
        const idItem = item.codRestaurante ?? item.restauranteId ?? item.idRestaurante;
        if (idItem != null && String(idItem).trim()) return String(idItem) === String(id);
        return nome && normalizedName(item.restaurante) === nome;
      });
      if (!itensRestaurante.length) return [];
      const subtotalRestaurante = itensRestaurante.reduce((total, item) => total + Number(item.preco || 0) * Math.max(1, Number(item.quantidade) || 1), 0);
      return [{
        codPedido: pedido.numero || pedido.id,
        dataHoraPedido: pedido.dataHora || pedido.dataHoraPedido || "",
        statusPedido: pedido.statusEntrega || pedido.status || "Aguardando confirmação do restaurante",
        valorPedido: subtotalRestaurante,
        clienteNome: pedido.clienteNome || pedido.nomeCliente || "Cliente",
        itens: itensRestaurante,
        pedidoClienteId: pedido.id
      }];
    });
  }

  const $ = selector => document.querySelector(selector);

  const money = value =>
    Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const escapeHtml = value =>
    String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[char]);

  function save() {
    if (!state.restaurant) return false;

    const restaurantName = String(state.restaurant.nomeRes || "").trim();
    if (!restaurantName) {
      alert("Informe o nome do restaurante antes de salvar.");
      $("#restaurant-form [name=nomeRes]")?.focus();
      return false;
    }

    localStorage.setItem(
      `garfoo-owner-${state.restaurant.codRestaurante}`,
      JSON.stringify({
        restaurant: state.restaurant,
        menu: state.menu,
        addresses: state.addresses
      })
    );

    const existing = state.restaurants.findIndex(
      item => String(item.id) === String(state.restaurant.codRestaurante)
    );

    const summary = {
      id: state.restaurant.codRestaurante,
      ownerId: state.ownerId,
      nomeRes: restaurantName,
      linkLogoRes: state.restaurant.linkLogoRes || "./Fotos/logoFooter.png"
    };

    if (existing >= 0) state.restaurants[existing] = summary;
    else state.restaurants.push(summary);

    state.activeRestaurantId = state.restaurant.codRestaurante;
    persistRestaurantIndex();
    renderSidebarRestaurants();
    renderSidebarStore();
    return true;
  }

  function persistRestaurantIndex() {
    localStorage.setItem(RESTAURANTS_KEY, JSON.stringify({
      restaurants: state.restaurants,
      activeId: state.activeRestaurantId,
      deletedIds: state.deletedRestaurantIds
    }));
  }

  function getOwnerName(savedUser, ownerFromData) {
    const possibleNames = [
      savedUser?.dados?.nomeUsuario,
      savedUser?.nomeUsuario,
      savedUser?.dados?.nomeCompletoUsuario,
      savedUser?.nomeCompletoUsuario,
      savedUser?.dados?.nomeCadastro,
      savedUser?.nomeCadastro,
      savedUser?.dados?.nome,
      savedUser?.nome,
      ownerFromData?.nomeUsuario,
      ownerFromData?.nome
    ];

    const name = possibleNames.find(value =>
      typeof value === "string" && value.trim() && !value.includes("@")
    );

    return name ? name.trim() : "Proprietário";
  }

  function renderOwnerName() {
    $("#topbar-owner-name").textContent = state.ownerName;
    $("#topbar-greeting-name").textContent = `Olá, ${state.ownerName}!`;
  }

  function renderSidebarStore() {
    if (!state.restaurant) return;

    $("#sidebar-name").textContent =
      state.restaurant.nomeRes || "Novo restaurante";

    $("#sidebar-logo").src =
      state.restaurant.linkLogoRes || "./Fotos/logoFooter.png";
  }

  function renderSidebarRestaurants() {
    const list = $("#sidebar-restaurant-list");
    if (!list) return;

    list.innerHTML = state.restaurants.map(restaurant => `
      <div class="sidebar-restaurant-row">
        <button type="button" class="sidebar-restaurant-option"
          data-restaurant-id="${escapeHtml(restaurant.id)}"
          aria-current="${String(restaurant.id) === String(state.activeRestaurantId)}">
          <img src="${escapeHtml(restaurant.linkLogoRes || "./Fotos/logoFooter.png")}" alt="">
          <span>${escapeHtml(restaurant.nomeRes || "Novo restaurante")}</span>
        </button>
        <button type="button" class="delete-restaurant-option"
          data-delete-restaurant="${escapeHtml(restaurant.id)}"
          aria-label="Apagar ${escapeHtml(restaurant.nomeRes || "restaurante")}" title="Apagar restaurante">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    `).join("");
  }

  function deleteRestaurantById(id) {
    const restaurant = state.restaurants.find(
      item => String(item.id) === String(id)
    );

    if (!restaurant) return;

    if (state.restaurants.length <= 1) {
      alert("É necessário manter pelo menos um restaurante cadastrado.");
      return;
    }

    const confirmed = confirm(
      `Tem certeza de que deseja apagar o restaurante "${restaurant.nomeRes}"? Essa ação não poderá ser desfeita.`
    );

    if (!confirmed) return;

    state.restaurants = state.restaurants.filter(
      item => String(item.id) !== String(id)
    );

    state.deletedRestaurantIds = [
      ...new Set([...state.deletedRestaurantIds, String(id)])
    ];

    localStorage.removeItem(`garfoo-owner-${id}`);

    const wasActive = String(state.activeRestaurantId) === String(id);

    if (wasActive) {
      const nextRestaurant = state.restaurants[0];
      state.activeRestaurantId = nextRestaurant.id;
      persistRestaurantIndex();
      loadRestaurantById(nextRestaurant.id);
    } else {
      persistRestaurantIndex();
      renderSidebarRestaurants();
      renderSidebarStore();
    }
  }

  function loadRestaurantById(id) {
    const summary = state.restaurants.find(
      item => String(item.id) === String(id)
    );

    if (!summary) return;

    const stored = JSON.parse(
      localStorage.getItem(`garfoo-owner-${id}`) || "{}"
    );

    const base = state.data?.restaurantes?.find(
      item => String(item.codRestaurante) === String(id)
    ) || {};

    state.restaurant = {
      nomeRes: "",
      telefoneRes: "",
      descricao: "",
      horarioRes: "",
      statusRes: "Ativo",
      avaliacaoRes: 0,
      linkLogoRes: "",
      codProprie: state.ownerId,
      ...base,
      ...(stored.restaurant || {}),
      codRestaurante: id
    };

    state.menu = (stored.menu || base.cardapio || []).map(normalizeItem);

    state.addresses =
      stored.addresses || [state.restaurant.enderecoRes].filter(Boolean);

    state.orders = [
      ...(state.data?.pedidos || []).filter(order => String(order.codRestaurante) === String(id)),
      ...ordersForRestaurant(id, state.restaurant)
    ];

    state.activeRestaurantId = id;

    persistRestaurantIndex();
    renderAll();
    renderSidebarRestaurants();
    renderSidebarStore();
    closeStoreDropdown();
  }

  function startNewRestaurant() {
    const id = `novo-${Date.now()}`;

    state.restaurant = {
      codRestaurante: id,
      codProprie: state.ownerId,
      nomeRes: "",
      telefoneRes: "",
      descricao: "",
      horarioRes: "",
      statusRes: "Ativo",
      avaliacaoRes: 0,
      linkLogoRes: ""
    };

    state.menu = [];
    state.addresses = [];
    state.orders = [];
    state.activeRestaurantId = id;

    state.restaurants.push({
      id,
      ownerId: state.ownerId,
      nomeRes: "Novo restaurante",
      linkLogoRes: "./Fotos/logoFooter.png"
    });

    persistRestaurantIndex();
    renderAll();
    renderSidebarRestaurants();
    renderSidebarStore();
    closeStoreDropdown();
    if (!$("#restaurant-form")) {
      location.href = "proprietario.html";
      return;
    }

    switchView("restaurante");
    location.hash = "restaurante";
    $("#restaurant-form [name=nomeRes]")?.focus();
  }

  function closeStoreDropdown() {
    const toggle = $("#sidebar-store-toggle");
    const dropdown = $("#sidebar-store-dropdown");

    if (!toggle || !dropdown) return;

    dropdown.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  function normalizeItem(item) {
    const category = item.produto?.categoria || item.categoria;

    return {
      id: item.codItemCardapio ?? item.id ?? crypto.randomUUID(),
      nome: item.produto?.nomeProd ?? item.nome ?? "Novo prato",
      descricao: item.produto?.descricaoProd ?? item.descricao ?? "",
      imagem: item.produto?.linkFotoProd ?? item.imagem ?? "",
      preco: Number(item.precoItemCardapio ?? item.preco ?? 0),
      categoria: typeof category === "object"
        ? category.nomeCategoria
        : (category || "Outros")
    };
  }

  function inserirDadosLeVerre(data) {
    const restaurant = data.restaurantes?.find(
      item => item.codRestaurante === 1
    );

    if (!restaurant) return;

    restaurant.codProprie = 101;
    restaurant.nomeRes = "Le Verre";
    restaurant.enderecoRes =
      restaurant.enderecoRes ||
      "Av. João Naves de Ávila, 1200, Uberlândia - MG";

    restaurant.telefoneRes =
      restaurant.telefoneRes || "(34) 99123-4567";

    restaurant.horarioRes = restaurant.horarioRes || "08:00-22:00";
    restaurant.statusRes = "Ativo";
    restaurant.avaliacaoRes = 4.8;

    const pedidosExtras = [
      {
        codPedido: 901,
        dataHoraPedido: "2026-11-12 12:20:00",
        statusPedido: "Entregue",
        valorPedido: 128.8,
        codUsuario: 1,
        codRestaurante: 1
      },
      {
        codPedido: 902,
        dataHoraPedido: "2026-11-13 19:10:00",
        statusPedido: "Entregue",
        valorPedido: 94.9,
        codUsuario: 2,
        codRestaurante: 1
      },
      {
        codPedido: 903,
        dataHoraPedido: "2026-11-14 20:05:00",
        statusPedido: "Em preparo",
        valorPedido: 76.5,
        codUsuario: 3,
        codRestaurante: 1
      }
    ];

    pedidosExtras.forEach(pedido => {
      if (!data.pedidos.some(item => item.codPedido === pedido.codPedido)) {
        data.pedidos.push(pedido);
      }
    });

    data.avaliacoesRestaurante ||= [];

    const avaliacoesExtras = [
      {
        codAvaR: 901,
        notaRes: 5,
        comentarioAvaRes: "Excelente experiência, pratos muito bem preparados.",
        dataAvaRes: "2026-11-12",
        codUsuario: 1,
        codPedido: 901
      },
      {
        codAvaR: 902,
        notaRes: 5,
        comentarioAvaRes: "Entrega rápida e apresentação impecável.",
        dataAvaRes: "2026-11-13",
        codUsuario: 2,
        codPedido: 902
      }
    ];

    avaliacoesExtras.forEach(avaliacao => {
      if (!data.avaliacoesRestaurante.some(
        item => item.codAvaR === avaliacao.codAvaR
      )) {
        data.avaliacoesRestaurante.push(avaliacao);
      }
    });
  }
    async function init() {
    try {
      const data = await fetch("cardapios_restaurantes.json")
        .then(response => {
          if (!response.ok) throw new Error("Falha ao carregar o JSON");
          return response.json();
        });

      state.data = data;

      const savedUser = JSON.parse(
        localStorage.getItem("garfooUsuarioLogado") || "null"
      );

      const loginNome = String(
        savedUser?.dados?.nomeUsuario || savedUser?.nomeUsuario || ""
      ).trim();

      const loginSenha = String(
        savedUser?.dados?.senhaUsuario || savedUser?.senhaUsuario || ""
      );

      const annaLaura =
        loginNome.toLowerCase() === "annalaura@garfoo.com" &&
        loginSenha === "12345";

      const restaurantId =
        new URLSearchParams(location.search).get("restaurante");

      const ownerId = Number(
        savedUser?.perfilProprietario?.codProprie || savedUser?.dados?.codProprie || savedUser?.codProprie || 101
      );

      state.ownerId = ownerId;

      if (annaLaura) inserirDadosLeVerre(data);

      const base =
        (annaLaura && data.restaurantes.find(
          item => item.codRestaurante === 1
        )) ||
        data.restaurantes.find(
          item => String(item.codRestaurante) === String(restaurantId)
        ) ||
        data.restaurantes.find(item => item.codProprie === ownerId) ||
        data.restaurantes[0];

      const owner = data.usuarios?.find(
        user => user.codUsuario === ownerId
      );

      state.ownerName = getOwnerName(savedUser, owner);
      renderOwnerName();

      $("#topbar-avatar").src =
        owner?.fotoUsuario ||
        owner?.linkFotoUsuario ||
        "./Fotos/carlosAvatar.png";

      const savedIndex = JSON.parse(
        localStorage.getItem(RESTAURANTS_KEY) || "null"
      );

      state.deletedRestaurantIds = Array.isArray(savedIndex?.deletedIds)
        ? savedIndex.deletedIds.map(String)
        : [];

      state.restaurants = Array.isArray(savedIndex?.restaurants)
        ? savedIndex.restaurants.filter(
            item => !item.ownerId || Number(item.ownerId) === ownerId
          )
        : [];

      if (
        base &&
        !state.deletedRestaurantIds.includes(String(base.codRestaurante)) &&
        !state.restaurants.some(
          item => String(item.id) === String(base.codRestaurante)
        )
      ) {
        state.restaurants.unshift({
          id: base.codRestaurante,
          ownerId,
          nomeRes: base.nomeRes || "Meu restaurante",
          linkLogoRes: base.linkLogoRes || "./Fotos/logoFooter.png"
        });
      }

      const requestedId =
        restaurantId &&
        state.restaurants.some(
          item => String(item.id) === String(restaurantId)
        )
          ? restaurantId
          : null;

      const preferredId =
        requestedId || savedIndex?.activeId || base?.codRestaurante;

      const selectedId = state.restaurants.some(
        item => String(item.id) === String(preferredId)
      )
        ? preferredId
        : state.restaurants[0]?.id;

      const selectedExists = state.restaurants.some(
        item => String(item.id) === String(selectedId)
      );

      if (selectedExists) {
        loadRestaurantById(selectedId);
      } else if (
        base &&
        !state.deletedRestaurantIds.includes(String(base.codRestaurante))
      ) {
        state.restaurant = { ...base };

        const stored = JSON.parse(
          localStorage.getItem(
            `garfoo-owner-${base.codRestaurante}`
          ) || "{}"
        );

        state.restaurant = {
          ...state.restaurant,
          ...(stored.restaurant || {})
        };

        state.menu = (stored.menu || base.cardapio || []).map(normalizeItem);
        state.addresses =
          stored.addresses || [base.enderecoRes].filter(Boolean);

        state.orders = [
          ...data.pedidos.filter(order => String(order.codRestaurante) === String(base.codRestaurante)),
          ...ordersForRestaurant(base.codRestaurante, state.restaurant)
        ];

        state.activeRestaurantId = base.codRestaurante;

        persistRestaurantIndex();
        renderAll();
        renderSidebarRestaurants();
        renderSidebarStore();
      } else {
        startNewRestaurant();
      }
    } catch (error) {
      console.error(error);

      ($(".restaurant-grid") || $(".view")).insertAdjacentHTML(
        "beforebegin",
        '<p class="hint">Não foi possível carregar os dados do restaurante.</p>'
      );
    }
  }

  function renderAll() {
    renderRestaurant();
    renderAddresses();
    renderMenu();
    renderOrders();
    renderReports();
    renderReviews();
  }

  window.addEventListener("storage", event => {
    if (event.key !== CLIENT_ORDERS_KEY || !state.restaurant) return;
    state.orders = [
      ...(state.data?.pedidos || []).filter(order => String(order.codRestaurante) === String(state.activeRestaurantId)),
      ...ordersForRestaurant(state.activeRestaurantId, state.restaurant)
    ];
    renderOrders();
  });

  function renderRestaurant() {
    const restaurant = state.restaurant;
    const form = $("#restaurant-form");

    if (!form) return;

    $("#restaurant-name").textContent =
      restaurant.nomeRes || "Seu restaurante";

    renderSidebarStore();

    $("#restaurant-logo").src =
      restaurant.linkLogoRes || "./Fotos/logoFooter.png";

    $("#restaurant-rating").textContent =
      `★ ${Number(restaurant.avaliacaoRes || 0)
        .toFixed(1)
        .replace(".", ",")} · Avaliação média`;

    form.nomeRes.value = restaurant.nomeRes || "";
    form.telefoneRes.value = restaurant.telefoneRes || "";
    form.descricao.value = restaurant.descricao || "";
    form.horarioRes.value = restaurant.horarioRes || "";
    form.statusRes.value = restaurant.statusRes || "Ativo";

    $("#restaurant-image").value =
      restaurant.linkLogoRes || "";
  }

  function renderAddresses() {
    if (!$("#address-list")) return;

    $("#address-list").innerHTML = state.addresses.length
      ? state.addresses.map((address, index) => `
          <div class="address-row">
            <span>⌖</span>
            <input value="${escapeHtml(address)}" data-address="${index}">
            <button type="button" class="remove-button" data-remove-address="${index}">
              Remover
            </button>
          </div>
        `).join("")
      : '<p class="hint">Nenhum endereço cadastrado.</p>';
  }

  function salesFor(itemId) {
    return (state.data?.itensPedido || [])
      .filter(
        item => String(item.codItemCardapio) === String(itemId)
      )
      .reduce(
        (total, item) => total + Number(item.quantItemPed || 0),
        0
      );
  }

  function renderMenu() {
    if (!$("#menu-list")) return;

    const search = $("#menu-search").value.trim().toLowerCase();

    const items = state.menu.filter(item =>
      `${item.nome} ${item.descricao} ${item.categoria}`
        .toLowerCase()
        .includes(search)
    );

    $("#menu-count").textContent = `${items.length} item(ns)`;

    $("#menu-list").innerHTML = items.map(item => `
      <article class="menu-item">
        <div>
          <h3>${escapeHtml(item.nome)}</h3>
          <p>${escapeHtml(item.descricao)}</p>
          <div class="menu-meta">
            <small>${escapeHtml(item.categoria)}</small>
            <span class="sales-count">${salesFor(item.id)} venda(s)</span>
          </div>
        </div>

        <input
          class="price-input"
          type="number"
          min="0"
          step="0.01"
          value="${item.preco}"
          data-price="${item.id}"
        >

        <div class="item-actions">
          <button type="button" data-edit-item="${item.id}">✎</button>
          <button type="button" data-remove-item="${item.id}">⌫</button>
        </div>
      </article>
    `).join("") ||
      '<div class="panel">Nenhum item encontrado.</div>';
  }

  function renderOrders() {
    $("#pedido-badge").textContent = state.orders.filter(
      order => order.statusPedido !== "Entregue"
    ).length;

    if (!$("#orders-list")) return;

    $("#orders-list").innerHTML = state.orders.length
      ? `
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Status</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${state.orders.map(order => `
              <tr>
                <td>#${order.codPedido}</td>
                <td>${escapeHtml(order.dataHoraPedido)}</td>
                <td>${escapeHtml(order.clienteNome || "Cliente")}</td>
                <td>${escapeHtml((order.itens || []).map(item => `${item.quantidade || 1}× ${item.nome || "Prato"}`).join(", ") || "—")}</td>
                <td><span class="tag">${escapeHtml(order.statusPedido)}</span></td>
                <td>${money(order.valorPedido)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `
      : '<p class="hint">Ainda não há pedidos.</p>';
  }
    function getRestaurantReviews() {
    const reviews =
      state.data?.avaliacoesRestaurante ||
      state.data?.avaliacoesRes ||
      [];

    const ordersById = new Map(
      (state.data?.pedidos || []).map(
        order => [String(order.codPedido), order]
      )
    );

    const usersById = new Map(
      (state.data?.usuarios || []).map(
        user => [String(user.codUsuario), user]
      )
    );

    return reviews.filter(review => {
      const linkedOrder = ordersById.get(String(review.codPedido));

      const reviewRestaurantId =
        review.codRestaurante ??
        review.restaurante?.codRestaurante;

      const orderRestaurantId = linkedOrder?.codRestaurante;
      const targetId = state.restaurant?.codRestaurante;

      if (reviewRestaurantId != null) {
        return String(reviewRestaurantId) === String(targetId);
      }

      if (orderRestaurantId != null) {
        return String(orderRestaurantId) === String(targetId);
      }

      return false;
    }).map(review => {
      const user = usersById.get(String(review.codUsuario));

      const rawDate =
        review.dataAvaliacaoRes ??
        review.dataAvaRes ??
        review.dataAvaliacao;

      const rawComment =
        review.comentarioRes ??
        review.comentarioAvaRes ??
        review.comentario ??
        "";

      const date = parseReviewDate(rawDate);

      return {
        ...review,
        displayName:
          review.nomeUsuario ||
          user?.nomeUsuario ||
          user?.nome ||
          "Cliente",
        displayDate: date
          ? date.toLocaleDateString("pt-BR")
          : "Data não informada",
        parsedDate: date,
        comment: String(rawComment || "").trim(),
        rating: Math.round(Number(review.notaRes) || 0),
        hiddenByModeration: isReviewHiddenByModeration(review)
      };
    }).filter(
      review => review.rating >= 1 && review.rating <= 5
    );
  }

  function parseReviewDate(value) {
    if (!value) return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const text = String(value).trim();

    const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnly) {
      return new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      );
    }

    const parsed = new Date(text);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function isReviewHiddenByModeration(review) {
    const explicitFlags = [
      review.comentarioOculto,
      review.comentarioOcultado,
      review.foiOcultado,
      review.oculto,
      review.moderacaoAutomatica,
      review.comentarioModerado,
      review.ocultadoPorModeracao,
      review.foiModerado
    ];

    if (
      explicitFlags.some(
        value => value === true || value === 1 || value === "true"
      )
    ) {
      return true;
    }

    const status = String(
      review.statusModeracao ??
      review.statusModeracaoRes ??
      review.statusComentario ??
      review.statusComentarioRes ??
      review.statusAvaliacao ??
      ""
    ).toLowerCase();

    return /ocult|bloque|removid/.test(status);
  }

  function filterReviewsByPeriod(reviews, period) {
    if (period === "all") return reviews;

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return reviews.filter(review => {
      if (!review.parsedDate) return false;

      const date = new Date(
        review.parsedDate.getFullYear(),
        review.parsedDate.getMonth(),
        review.parsedDate.getDate()
      );

      if (period === "today") {
        return date.getTime() === today.getTime();
      }

      if (period === "7days") {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);

        return date >= start && date <= today;
      }

      if (period === "month") {
        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth()
        );
      }

      return true;
    });
  }

  function renderReviewStars(rating) {
    const rounded = Math.max(
      0,
      Math.min(5, Math.round(Number(rating) || 0))
    );

    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  }

  function renderReviews() {
    if (!$("#reviews-list")) return;

    const allReviews = getRestaurantReviews();

    const averageFromRestaurant =
      state.restaurant?.mediaAvaliacaoRes;

    const fallbackAverage =
      state.restaurant?.avaliacaoRes;

    const computedAverage = allReviews.length
      ? allReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / allReviews.length
      : 0;

    const average =
      averageFromRestaurant !== undefined &&
      averageFromRestaurant !== null &&
      averageFromRestaurant !== ""
        ? Number(averageFromRestaurant)
        : (
            fallbackAverage !== undefined &&
            fallbackAverage !== null &&
            fallbackAverage !== ""
              ? Number(fallbackAverage)
              : computedAverage
          );

    const safeAverage = Number.isFinite(average)
      ? Math.max(0, Math.min(5, average))
      : 0;

    $("#reviews-average").textContent =
      safeAverage.toFixed(1).replace(".", ",");

    $("#reviews-average-stars").textContent =
      renderReviewStars(safeAverage);

    $("#reviews-average-stars").setAttribute(
      "aria-label",
      `${safeAverage.toFixed(1).replace(".", ",")} de 5 estrelas`
    );

    $("#reviews-average-caption").textContent =
      `${allReviews.length} avaliação(ões) consideradas`;

    $("#reviews-total").textContent =
      allReviews.length.toLocaleString("pt-BR");

    const distribution = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: allReviews.filter(
        review => review.rating === star
      ).length
    }));

    $("#reviews-distribution").innerHTML =
      distribution.map(item => {
        const percent = allReviews.length
          ? (item.count / allReviews.length) * 100
          : 0;

        return `
          <div class="review-distribution-row">
            <span class="review-distribution-label">${item.star} ★</span>

            <div
              class="review-progress-track"
              role="progressbar"
              aria-label="${item.star} estrelas"
              aria-valuemin="0"
              aria-valuemax="${allReviews.length}"
              aria-valuenow="${item.count}"
            >
              <span style="width:${percent.toFixed(2)}%"></span>
            </div>

            <span class="review-distribution-count">${item.count}</span>
          </div>
        `;
      }).join("");

    const period = $("#reviews-period").value;
    const type = $("#reviews-type").value;

    let filtered = filterReviewsByPeriod(allReviews, period);

    if (type === "comments") {
      filtered = filtered.filter(
        review => review.comment.length > 0
      );
    }

    const recentAverage = filtered.length
      ? filtered.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / filtered.length
      : null;

    $("#reviews-recent-average").textContent =
      recentAverage === null
        ? "—"
        : recentAverage.toFixed(1).replace(".", ",");

    $("#reviews-recent-caption").textContent =
      recentAverage === null
        ? "Nenhuma avaliação neste filtro"
        : `Média de ${filtered.length} avaliação(ões) filtrada(s)`;

    $("#reviews-results-count").textContent =
      `${filtered.length} ${
        filtered.length === 1
          ? "avaliação encontrada"
          : "avaliações encontradas"
      }`;

    $("#reviews-list").innerHTML = filtered.length
      ? filtered
          .sort(
            (a, b) =>
              (b.parsedDate?.getTime() || 0) -
              (a.parsedDate?.getTime() || 0)
          )
          .map(review => `
            <article class="review-item">
              <div class="review-item-top">
                <div class="review-customer">
                  <span class="review-avatar" aria-hidden="true">
                    ${escapeHtml(
                      String(review.displayName)
                        .trim()
                        .charAt(0)
                        .toUpperCase() || "C"
                    )}
                  </span>

                  <div>
                    <strong>${escapeHtml(review.displayName)}</strong>
                    <span>${escapeHtml(review.displayDate)}</span>
                  </div>
                </div>

                <span
                  class="review-item-stars"
                  aria-label="${review.rating} de 5 estrelas"
                >
                  ${renderReviewStars(review.rating)}
                </span>
              </div>

              <p class="review-comment">
                ${
                  review.comment
                    ? escapeHtml(review.comment)
                    : '<span class="review-no-comment">Avaliação sem comentário escrito</span>'
                }
              </p>

              ${
                review.hiddenByModeration
                  ? '<span class="review-moderation-badge">Comentário ocultado automaticamente por moderação</span>'
                  : ""
              }
            </article>
          `)
          .join("")
      : '<div class="reviews-empty">Nenhuma avaliação corresponde aos filtros selecionados.</div>';
  }

  function renderReports() {
    if (!$("#report-cards")) return;

    const delivered = state.orders.filter(
      order => order.statusPedido === "Entregue"
    );

    const total = delivered.reduce(
      (sum, order) => sum + Number(order.valorPedido || 0),
      0
    );

    const bestSeller = state.menu
      .map(item => ({
        name: item.nome,
        sales: salesFor(item.id)
      }))
      .sort((a, b) => b.sales - a.sales)[0]?.name || "Sem dados";

    const cards = [
      ["Pedidos entregues", delivered.length],
      ["Faturamento", money(total)],
      ["Ticket médio", money(total / (delivered.length || 1))],
      ["Item mais famoso", bestSeller]
    ];

    $("#report-cards").innerHTML = cards.map(([label, value]) => `
      <article class="report-card">
        <span>${label}</span>
        <strong>${escapeHtml(value)}</strong>
      </article>
    `).join("");

    $("#report-summary").textContent =
      `${state.restaurant.nomeRes} recebeu ${state.orders.length} pedido(s) no período carregado.`;
  }

  function switchView(view) {
    const valid = [
      "restaurante",
      "cardapio",
      "pedidos",
      "relatorios",
      "avaliacoes",
      "configuracoes",
      "ajuda"
    ];

    const target = document.body.dataset.view ||
      (valid.includes(view) ? view : "restaurante");

    document.querySelectorAll(".view").forEach(section => {
      section.classList.toggle(
        "active",
        section.id === target
      );
    });

    document.querySelectorAll(".nav-link").forEach(link => {
      link.classList.toggle(
        "active",
        link.dataset.view === target
      );
    });

    $("#save-all").hidden = [
      "pedidos",
      "relatorios",
      "avaliacoes",
      "configuracoes",
      "ajuda"
    ].includes(target);
  }

  function openDialog(item) {
    const form = $("#item-form");

    state.editingId = item?.id || null;

    $("#dialog-title").textContent =
      item ? "Editar prato" : "Novo prato";

    form.nome.value = item?.nome || "";
    form.descricao.value = item?.descricao || "";
    form.preco.value = item?.preco || "";
    form.categoria.value = item?.categoria || "";
    form.imagem.value = item?.imagem || "";

    $("#item-dialog").showModal();
  }

  const helpItems = [
    [
      "Um cliente pediu um prato que houve um imprevisto na cozinha. O que faço?",
      "Abra os detalhes do pedido no painel e clique em Cancelar Pedido. Faça isso o quanto antes para avisar o cliente imediatamente."
    ],
    [
      "Meu restaurante aparece como fechado para os clientes, como abro?",
      "Verifique se o status do restaurante está como Aberto e se o horário atual está dentro do período cadastrado."
    ],
    [
      "Onde vejo quanto meu restaurante faturou?",
      "Na tela de Relatórios você acompanha receitas diária, mensal e anual, além do total de pedidos."
    ],
    [
      "Como altero o horário de funcionamento do restaurante?",
      "Acesse Configurações e ajuste o horário de funcionamento. Fora desse período, a loja fecha automaticamente."
    ],
    [
      "Preciso fechar o restaurante mais cedo. O que faço?",
      "Na página Meu restaurante, altere o status para Pausado. A loja deixa de receber pedidos imediatamente."
    ],
    [
      "Tenho mais de um restaurante",
      "Sim. Um mesmo proprietário pode administrar vários restaurantes, cada um com dados e cardápio próprios."
    ],
    [
      "Como cadastro prato ou bebida?",
      "Acesse Cardápio, clique em Novo prato e informe nome, descrição, preço, categoria e imagem."
    ],
    [
      "Acabou um ingrediente",
      "Pause o item no cardápio para ocultá-lo temporariamente, sem apagar preço, foto ou descrição."
    ],
    [
      "Como altero preço ou descrição?",
      "No Cardápio, clique no ícone de editar do item desejado, atualize os dados e salve."
    ],
    [
      "Preciso aceitar pedidos manualmente?",
      "Não. Os pedidos entram automaticamente na fila do painel para a cozinha iniciar o preparo."
    ],
    [
      "Onde vejo observações do cliente?",
      "As observações registradas pelo cliente aparecem nos detalhes do pedido."
    ],
    [
      "Recebi um comentário ofensivo ou desrespeitoso nas avaliações. O que acontece?",
      "O Garfoo não permite comentários ofensivos. Avaliações com conteúdo impróprio são removidas da plataforma."
    ]
  ];

  function renderHelp(search = "") {
    if (!$("#help-list")) return;

    const items = helpItems.filter(([title, text]) =>
      `${title} ${text}`.toLowerCase().includes(search.toLowerCase())
    );

    $("#help-list").innerHTML = items.map(([title, text]) => `
      <details class="panel help-item">
        <summary>${title}</summary>
        <p>${text}</p>
      </details>
    `).join("") ||
      '<p class="hint">Nenhuma dúvida encontrada.</p>';
  }
    document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        setTimeout(() => switchView(location.hash.slice(1)));
      });
    });

    window.addEventListener("hashchange", () => {
      switchView(location.hash.slice(1));
    });

    $("#reviews-period")?.addEventListener("change", renderReviews);
    $("#reviews-type")?.addEventListener("change", renderReviews);

    $("#restaurant-form")?.addEventListener("input", event => {
      if (!event.target.name || !state.restaurant) return;

      state.restaurant[event.target.name] = event.target.value;

      if (event.target.name === "nomeRes") {
        renderSidebarStore();
      }
    });

    $("#restaurant-image")?.addEventListener("input", event => {
      state.restaurant.linkLogoRes = event.target.value;

      $("#restaurant-logo").src =
        event.target.value || "./Fotos/logoFooter.png";

      renderSidebarStore();
    });

    $("#save-all").addEventListener("click", () => {
      const saved = save();

      if (!saved) return;

      renderRestaurant();

      $("#save-all").textContent = "Alterações salvas!";

      setTimeout(() => {
        $("#save-all").textContent = "Salvar alterações";
      }, 1800);
    });

    $("#add-address")?.addEventListener("click", () => {
      state.addresses.push("");
      renderAddresses();
    });

    $("#address-list")?.addEventListener("input", event => {
      if (event.target.dataset.address !== undefined) {
        state.addresses[Number(event.target.dataset.address)] =
          event.target.value;
      }
    });

    $("#address-list")?.addEventListener("click", event => {
      const index = event.target.dataset.removeAddress;

      if (index !== undefined) {
        state.addresses.splice(Number(index), 1);
        renderAddresses();
        save();
      }
    });

    $("#menu-search")?.addEventListener("input", renderMenu);

    $("#menu-list")?.addEventListener("input", event => {
      const item = state.menu.find(
        entry => String(entry.id) === event.target.dataset.price
      );

      if (item) {
        item.preco = Number(event.target.value);
        save();
      }
    });

    $("#menu-list")?.addEventListener("click", event => {
      const id =
        event.target.dataset.editItem ||
        event.target.dataset.removeItem;

      if (!id) return;

      if (event.target.dataset.removeItem) {
        state.menu = state.menu.filter(
          item => String(item.id) !== id
        );

        save();
        renderMenu();
        return;
      }

      openDialog(
        state.menu.find(item => String(item.id) === id)
      );
    });

    $("#new-item")?.addEventListener("click", () => openDialog());

    $(".close-dialog")?.addEventListener("click", () => {
      $("#item-dialog").close();
    });

    $("#item-form")?.addEventListener("submit", event => {
      event.preventDefault();

      const data = new FormData(event.currentTarget);

      const item = {
        id: state.editingId || crypto.randomUUID(),
        nome: data.get("nome"),
        descricao: data.get("descricao"),
        preco: Number(data.get("preco")),
        categoria: data.get("categoria") || "Outros",
        imagem: data.get("imagem")
      };

      const index = state.menu.findIndex(
        entry => String(entry.id) === String(item.id)
      );

      if (index >= 0) {
        state.menu[index] = item;
      } else {
        state.menu.unshift(item);
      }

      save();
      $("#item-dialog").close();
      renderMenu();
    });

    // SELETOR DE RESTAURANTES NO RODAPÉ DO MENU LATERAL
    const storeToggle = $("#sidebar-store-toggle");
    const storeDropdown = $("#sidebar-store-dropdown");

    storeToggle.addEventListener("click", event => {
      event.stopPropagation();

      const open = storeDropdown.hidden;

      storeDropdown.hidden = !open;
      storeToggle.setAttribute("aria-expanded", String(open));
    });

    $("#sidebar-restaurant-list").addEventListener("click", event => {
      const deleteButton = event.target.closest(
        "[data-delete-restaurant]"
      );

      if (deleteButton) {
        event.stopPropagation();

        deleteRestaurantById(
          deleteButton.dataset.deleteRestaurant
        );

        return;
      }

      const option = event.target.closest("[data-restaurant-id]");

      if (!option) return;

      loadRestaurantById(option.dataset.restaurantId);
    });

    $("#add-restaurant").addEventListener(
      "click",
      startNewRestaurant
    );

    document.addEventListener("click", event => {
      if (!event.target.closest(".sidebar-store-switcher")) {
        closeStoreDropdown();
      }
    });

    // MENU DE ALTERNÂNCIA DE MODO
    $("#settings-form")?.addEventListener("submit", event => {
      event.preventDefault();

      localStorage.setItem(
        `garfoo-owner-settings-${state.restaurant.codRestaurante}`,
        JSON.stringify(
          Object.fromEntries(new FormData(event.currentTarget))
        )
      );

      const button = event.currentTarget.querySelector("button");

      button.textContent = "Configurações salvas!";

      setTimeout(() => {
        button.textContent = "Salvar configurações";
      }, 1800);
    });

    $("#report-error")?.addEventListener("click", () => {
      $("#support-dialog").showModal();
    });

    $(".close-support")?.addEventListener("click", () => {
      $("#support-dialog").close();
    });

    $("#support-form")?.addEventListener("submit", event => {
      event.preventDefault();

      const chamados = JSON.parse(
        localStorage.getItem("garfoo-chamados") || "[]"
      );

      chamados.push({
        ...Object.fromEntries(new FormData(event.currentTarget)),
        criadoEm: new Date().toISOString()
      });

      localStorage.setItem(
        "garfoo-chamados",
        JSON.stringify(chamados)
      );

      event.currentTarget.reset();

      setTimeout(() => {
        $("#support-dialog").close();
      }, 1800);
    });

    $("#help-search")?.addEventListener("input", event => {
      renderHelp(event.target.value);
    });

    renderHelp();

    init().then(() => {
      switchView(location.hash.slice(1));
    });
  });
})();
