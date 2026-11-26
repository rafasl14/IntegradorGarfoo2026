/* =========================================================
   Garfoo Admin — admin.js
   A estrutura (menu, topo, filtros, tabelas) está em cada arquivo .html.
   Aqui ficam só os dados de exemplo e o comportamento:
   linhas das tabelas, filtros, status editável, apagar/restaurar e configurações.
   Troque os dados de exemplo pelos da sua API quando for integrar.
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;

/* ---------- Dados de exemplo (uma linha por registro) ---------- */
const DADOS = {
  usuarios: [
    ["#1001", "João Silva", "joao.silva@email.com", "(34) 99999-1111", "28/05/2024", "Ativo"],
    ["#1002", "Maria Oliveira", "maria.oliveira@email.com", "(34) 99999-2222", "27/05/2024", "Ativo"],
    ["#1003", "Pedro Santos", "pedro.santos@email.com", "(34) 99999-3333", "25/05/2024", "Ativo"],
    ["#1004", "Juliana Costa", "juliana.costa@email.com", "(34) 99999-4444", "24/05/2024", "Bloqueado"],
    ["#1005", "Lucas Martins", "lucas.martins@email.com", "(34) 99999-5555", "23/05/2024", "Inativo"],
    ["#1006", "Ana Paula", "ana.paula@email.com", "(34) 99999-6666", "22/05/2024", "Ativo"],
    ["#1007", "Rafael Lima", "rafael.lima@email.com", "(34) 99999-7777", "21/05/2024", "Ativo"],
    ["#1008", "Carolina Alves", "carolina.alves@email.com", "(34) 99999-8888", "20/05/2024", "Bloqueado"],
    ["#1009", "Bruno Ferreira", "bruno.ferreira@email.com", "(34) 99999-9999", "19/05/2024", "Ativo"],
    ["#1010", "Fernando Rocha", "fernando.rocha@email.com", "(34) 99999-0000", "18/05/2024", "Ativo"]
  ],
  restaurantes: [
    ["#3001", "La Bella Itália", "Giovanni R.", "(34) 99999-1111", "4,8", "Ativa"],
    ["#3002", "Sushi House", "Kenji Nakamura", "(34) 99999-2222", "4,7", "Ativa"],
    ["#3003", "Taco Mania", "Carlos Hernández", "(34) 99999-3333", "4,6", "Pendente"],
    ["#3004", "Crepes & Cia", "Sophie Martin", "(34) 99999-4444", "4,5", "Ativa"],
    ["#3005", "Sabor do Chef", "Marcos Paulo", "(34) 99999-5555", "4,9", "Ativa"],
    ["#3006", "Tempero de Casa", "Ana Carolina", "(34) 99999-6666", "4,2", "Suspensa"],
    ["#3007", "Kyoto Japanese Food", "Yuki Tanaka", "(34) 99999-7777", "4,8", "Ativa"],
    ["#3008", "Cantina Romana", "Luigi Verdi", "(34) 99999-8888", "4,4", "Pendente"]
  ],
  entregadores: [
    ["#3001", "Carlos Mendes", "Honda CG 160", "ABC1D23", "12345678901", "4,9", "Ativo"],
    ["#3002", "Ana Laura", "Yamaha Fazer 250", "DEF4G56", "22345678902", "4,8", "Ativo"],
    ["#3003", "Rafael Lima", "Honda CG 150", "GHI7J89", "32345678903", "4,7", "Ativo"],
    ["#3004", "Bruno Alves", "Honda CG 160", "JKL0M12", "42345678904", "4,6", "Pendente"],
    ["#3005", "Gabriel Souza", "Yamaha Factor 150", "MNO3P45", "52345678905", "4,8", "Ativo"],
    ["#3006", "Thiago Silva", "Honda CG 150", "QRS6T78", "62345678906", "4,5", "Suspensa"],
    ["#3007", "Lucas Pereira", "Yamaha Fazer 250", "UVW9X01", "72345678907", "4,7", "Ativo"]
  ],
  pedidos: [
    ["#98765", "30/05 14:35", "João Silva", "La Bella Itália", "Carlos Mendes", "R$ 85,90", "Em preparo"],
    ["#98764", "30/05 14:10", "Maria Oliveira", "Sushi House", "Ana Laura", "R$ 67,50", "Em rota"],
    ["#98763", "30/05 13:55", "Pedro Santos", "Taco Mania", "Rafael Lima", "R$ 42,30", "Aguardando"],
    ["#98762", "30/05 13:20", "Juliana Costa", "Crepes & Cia", "Bruno Alves", "R$ 58,00", "Entregue"],
    ["#98761", "30/05 12:45", "Lucas Martins", "Sabor do Chef", "Gabriel Souza", "R$ 73,20", "Entregue"],
    ["#98760", "30/05 12:10", "Ana Paula", "Tempero da Casa", "—", "R$ 38,90", "Cancelado"]
  ],
  pagamentos: [
    ["#P12345", "#98765", "João Silva", "R$ 85,90", "Cartão de Crédito", "30/05/2024 14:35", "Pago"],
    ["#P12344", "#98764", "Maria Oliveira", "R$ 67,50", "PIX", "30/05/2024 14:10", "Pago"],
    ["#P12343", "#98763", "Pedro Santos", "R$ 42,30", "Cartão de Débito", "30/05/2024 13:55", "Pendente"],
    ["#P12342", "#98762", "Juliana Costa", "R$ 55,00", "Dinheiro", "30/05/2024 13:20", "Pago"],
    ["#P12341", "#98761", "Lucas Martins", "R$ 73,20", "Cartão de Crédito", "30/05/2024 12:45", "Pago"],
    ["#P12340", "#98760", "Ana Paula", "R$ 38,90", "PIX", "30/05/2024 12:10", "Estornado"],
    ["#P12339", "#98759", "Carolina Alves", "R$ 49,90", "PIX", "30/05/2024 11:40", "Pendente"],
    ["#P12338", "#98758", "Bruno Ferreira", "R$ 91,00", "Cartão de Crédito", "30/05/2024 11:15", "Pago"]
  ],
  avaliacoes: [
    ["João Silva", "La Bella Itália", "5,0", "Ótimo atendimento e comida deliciosa!", "30/05/2024", "r"],
    ["Maria Oliveira", "Sushi House", "4,5", "Sushi fresco e muito bem preparado.", "30/05/2024", "r"],
    ["Pedro Santos", "Taco Mania", "4,0", "Bem saboroso, entrega rápida.", "30/05/2024", "r"],
    ["Juliana Costa", "Crepes & Cia", "5,0", "Simplesmente perfeito!", "29/05/2024", "r"],
    ["Lucas Martins", "Sabor do Chef", "4,5", "Recomendo demais!", "29/05/2024", "r"],
    ["Ana Paula", "Tempero da Casa", "3,5", "Pode melhorar o tempo de entrega.", "29/05/2024", "r"],
    ["João Silva", "Carlos Mendes", "5,0", "Entregador muito educado.", "30/05/2024", "e"],
    ["Maria Oliveira", "Ana Laura", "4,5", "Chegou antes do previsto.", "30/05/2024", "e"]
  ],
  categorias: [
    ["#1", "Mexicana", "Entradas", "Entradas de restaurantes de culinária mexicana", "14", "Ativa"],
    ["#2", "Mexicana", "Pratos Principais", "Pratos Principais de restaurantes de culinária mexicana", "18", "Ativa"],
    ["#3", "Mexicana", "Sobremesas", "Sobremesas de restaurantes de culinária mexicana", "11", "Ativa"],
    ["#4", "Mexicana", "Bebidas", "Bebidas de restaurantes de culinária mexicana", "13", "Ativa"],
    ["#5", "Mexicana", "Massas", "Massas de restaurantes de culinária mexicana", "7", "Inativa"],
    ["#6", "Japonesa", "Entradas", "Entradas de restaurantes de culinária japonesa", "12", "Ativa"],
    ["#7", "Japonesa", "Pratos Principais", "Pratos Principais de restaurantes de culinária japonesa", "15", "Ativa"],
    ["#8", "Japonesa", "Sobremesas", "Sobremesas de restaurantes de culinária japonesa", "9", "Ativa"],
    ["#9", "Japonesa", "Bebidas", "Bebidas de restaurantes de culinária japonesa", "10", "Ativa"],
    ["#10", "Japonesa", "Massas", "Massas de restaurantes de culinária japonesa", "6", "Ativa"],
    ["#11", "Italiana", "Entradas", "Entradas de restaurantes de culinária italiana", "16", "Ativa"],
    ["#12", "Italiana", "Pratos Principais", "Pratos Principais de restaurantes de culinária italiana", "20", "Ativa"],
    ["#13", "Italiana", "Sobremesas", "Sobremesas de restaurantes de culinária italiana", "12", "Ativa"],
    ["#14", "Italiana", "Bebidas", "Bebidas de restaurantes de culinária italiana", "14", "Ativa"],
    ["#15", "Italiana", "Massas", "Massas de restaurantes de culinária italiana", "20", "Ativa"],
    ["#16", "Francesa", "Entradas", "Entradas de restaurantes de culinária francesa", "10", "Ativa"],
    ["#17", "Francesa", "Pratos Principais", "Pratos Principais de restaurantes de culinária francesa", "12", "Ativa"],
    ["#18", "Francesa", "Sobremesas", "Sobremesas de restaurantes de culinária francesa", "7", "Ativa"],
    ["#19", "Francesa", "Bebidas", "Bebidas de restaurantes de culinária francesa", "8", "Ativa"],
    ["#20", "Francesa", "Massas", "Massas de restaurantes de culinária francesa", "5", "Inativa"]
  ],
  suporte: [
    ["#T1001", "Problema com pedido", "João Silva", "Pedido", "Aberto", "30/05/2024 14:25"],
    ["#T1002", "Dúvida sobre pagamento", "Maria Oliveira", "Pagamento", "Em andamento", "30/05/2024 13:40"],
    ["#T1003", "Erro no cadastro", "Pedro Santos", "Conta", "Respondido", "30/05/2024 12:15"],
    ["#T1004", "Entrega atrasada", "Juliana Costa", "Pedido", "Aberto", "30/05/2024 11:50"],
    ["#T1005", "Restaurantes não aparecem", "Lucas Martins", "Restaurante", "Fechado", "29/05/2024 17:30"]
  ],
  logs: [
    ["30/05/2024 14:35", "Admin", "Login", "Login realizado com sucesso", "177.23.45.10"],
    ["30/05/2024 14:32", "Admin", "Cadastro", "Cadastro de restaurante La Bella Itália", "189.54.112.37"],
    ["30/05/2024 14:20", "Admin", "Edição", "Pedido #98765 atualizado para Em preparo", "201.17.88.4"],
    ["30/05/2024 14:10", "Admin", "Bloqueio", "Usuário João Silva bloqueado", "177.92.31.205"],
    ["30/05/2024 14:05", "Admin", "Edição", "Categoria Mexicana editada", "187.11.240.66"]
  ],
  proprietarios: [
    ["#2001", "Giovanni R.", "giovanni.r@email.com", "(34) 99999-1111", "La Bella Itália", "Ativo"],
    ["#2002", "Kenji Nakamura", "kenji.nakamura@email.com", "(34) 99999-2222", "Sushi House", "Ativo"],
    ["#2003", "Carlos Hernández", "carlos.hernandez@email.com", "(34) 99999-3333", "Taco Mania", "Ativo"],
    ["#2004", "Sophie Martin", "sophie.martin@email.com", "(34) 99999-4444", "Crepes & Cia", "Ativo"],
    ["#2005", "Marcos Paulo", "marcos.paulo@email.com", "(34) 99999-5555", "Sabor do Chef", "Ativo"],
    ["#2006", "Ana Carolina", "ana.carolina@email.com", "(34) 99999-6666", "Tempero de Casa", "Bloqueado"],
    ["#2007", "Yuki Tanaka", "yuki.tanaka@email.com", "(34) 99999-7777", "Kyoto Japanese Food", "Ativo"],
    ["#2008", "Luigi Verdi", "luigi.verdi@email.com", "(34) 99999-8888", "Cantina Romana", "Inativo"]
  ]
};

/* ---------- Tabelas: cores e opções de status, tipos dos itens apagados, botões de ação ---------- */
const COR = { Ativo: 'ok', Ativa: 'ok', Pago: 'ok', Entregue: 'ok', Respondido: 'ok', Pendente: 'warn', Aguardando: 'warn', 'Em preparo': 'warn',
  Bloqueado: 'bad', Suspensa: 'bad', Estornado: 'bad', Cancelado: 'bad', Aberto: 'bad', Fechado: 'bad', Inativo: 'off', Inativa: 'off',
  'Em rota': 'info', 'Em andamento': 'info' };
const STOPS = { usuarios: ['Ativo', 'Inativo', 'Bloqueado'], proprietarios: ['Ativo', 'Inativo', 'Bloqueado'], restaurantes: ['Ativa', 'Pendente', 'Suspensa'], entregadores: ['Ativo', 'Pendente', 'Suspensa'],
  pedidos: ['Em preparo', 'Aguardando', 'Em rota', 'Entregue', 'Cancelado'], pagamentos: ['Pago', 'Pendente', 'Estornado'], categorias: ['Ativa', 'Inativa'],
  suporte: ['Aberto', 'Em andamento', 'Respondido', 'Fechado'] };
const TIPOS = { usuarios: 'Usuário', restaurantes: 'Restaurante', proprietarios: 'Proprietário', entregadores: 'Entregador', categorias: 'Categoria' };
const ACT = { edit: ['edit', 'edit', 'Editar'], trash: ['trash', 'del', 'Apagar'], undo: ['undo', 'restore', 'Restaurar'], purge: ['trash', 'purge', 'Excluir definitivamente'] };

/* ---------- Preferências do site (salvas no navegador) ---------- */
const LOGO0 = './Fotos/logoFooter.png';
const CFG0 = { nome: 'Garfoo', email: 'suporte@garfoo.com', tel: '(34) 99999-0000', end: 'Rua das Flores, 123 - Uberlândia, MG', logo: '', adm: { nome: 'Administrador', email: 'admin@garfoo.com', tel: '' } };
const cfg = (() => { try { const x = JSON.parse(localStorage.getItem('garfoo_cfg') || '{}'); return { ...CFG0, ...x, adm: { ...CFG0.adm, ...(x.adm || {}) } }; } catch { return { ...CFG0, adm: { ...CFG0.adm } }; } })();
const ler = (k, v) => { try { return JSON.parse(localStorage.getItem('garfoo_' + k)) ?? v; } catch { return v; } };
const gravar = (k, v) => { try { localStorage.setItem('garfoo_' + k, JSON.stringify(v)); } catch {} };

/* Preenche nome, e-mail, logo e inicial nos elementos marcados com data-cfg */
function aplicarCfg() {
  $$('[data-cfg]').forEach(el => { el.textContent = el.dataset.cfg.split('.').reduce((o, k) => o[k], cfg); });
  $$('[data-cfg-logo]').forEach(img => { img.src = cfg.logo || LOGO0; img.alt = cfg.nome; });
  $$('[data-cfg-ini]').forEach(el => { el.textContent = (cfg.adm.nome.trim()[0] || 'A').toUpperCase(); });
  const t = $('h1')?.textContent.trim(); if (t) document.title = `${t} — ${cfg.nome}`;
}

/* Menu lateral (celular) e menu da conta */
function menu() {
  const alt = () => $('#side').classList.toggle('open');
  $('#bg').onclick = alt; $('#scrim').onclick = alt;
  const btn = $('[data-admin-profile-button]'), mn = $('[data-admin-profile-menu]');
  $('[data-mudar-cliente]').addEventListener('click', () => { try { sessionStorage.setItem('garfooRetornoAdmin', '1'); } catch {} });
  btn.addEventListener('click', ev => { ev.stopPropagation(); mn.hidden = !mn.hidden; btn.setAttribute('aria-expanded', String(!mn.hidden)); });
  document.addEventListener('click', ev => { if (!ev.target.closest('.admin-profile')) { mn.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
}

/* ---------- Telas de listagem (linhas + filtros + abas + paginação) ---------- */
function lista(key) {
  const TAM = 8, tab = $('#tabela'), d = tab.dataset;
  const c = { st: d.status ? +d.status : null, rt: d.rating ? +d.rating : null, nota: d.nota ? +d.nota : null, acts: d.acoes ? d.acoes.split(' ') : null };
  const ncols = $$('thead th', tab).length - (c.acts ? 1 : 0);
  const abas = $('.abas'), tabcol = abas?.dataset.col ? +abas.dataset.col : c.st;
  let apag = ler('apagados', []); const stat = ler('status', {});
  const agora = () => new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const est = { q: '', nome: '', aba: abas ? $('button', abas).dataset.v : '', pg: 1 };

  /* linhas atuais: sem as apagadas e com os status editados */
  const fonte = () => key === 'apagados' ? apag.map(a => [a.row[0], TIPOS[a.page], a.nome || a.row[1], a.em, a.page])
    : (DADOS[key] || []).filter(l => !apag.some(a => a.page === key && a.row[0] === l[0])).map(l => { const v = stat[key + ':' + l[0]]; if (v && c.st != null) { l = [...l]; l[c.st] = v; } return l; });
  const nota = n => { const v = parseFloat(n.replace(',', '.')), r = Math.round(v); return `<span class="star">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span> ${n}`; };
  const celula = (v, i, l) => i === c.st ? `<select class="pill pill-sel ${COR[v] || 'off'}" data-id="${esc(l[0])}" aria-label="Status de ${esc(l[0])}">${STOPS[key].map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`
    : i === c.rt ? `<span class="star">★</span> ${v}` : i === c.nota ? nota(v) : v;
  const filtros = () => $$('.filtros select[data-col]').filter(s => !s.closest('[hidden]'));
  const q = $('#q'), sug = $('#sug'), resumo = $('#resumo');
  const sem = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function desenhar() {
    const sels = filtros();
    let r = fonte().filter(l => (!est.q || sem(l.slice(0, ncols).join(' ')).includes(est.q)) && (!est.aba || l[tabcol] === est.aba) && (!est.nome || l[1] === est.nome) && sels.every(s => !s.value || l[+s.dataset.col] === s.value));
    const paginas = Math.max(1, Math.ceil(r.length / TAM)); est.pg = Math.min(est.pg, paginas);
    r = r.slice((est.pg - 1) * TAM, est.pg * TAM);
    $('#tb').innerHTML = r.length ? r.map(l => `<tr data-id="${esc(l[0])}" data-pg="${l[4] || ''}">${Array.from({ length: ncols }, (_, i) => `<td>${celula(l[i], i, l)}</td>`).join('')}${c.acts ? `<td><div class="acoes">${c.acts.map(a => `<button type="button" data-act="${ACT[a][1]}" title="${ACT[a][2]}" aria-label="${ACT[a][2]}">${ic(ACT[a][0])}</button>`).join('')}</div></td>` : ''}</tr>`).join('')
      : `<tr><td class="vazio-t" colspan="${ncols + (c.acts ? 1 : 0)}">${d.vazio || 'Nenhum registro encontrado. Ajuste os filtros para ver mais resultados.'}</td></tr>`;
    if (resumo) { /* resumo do restaurante/entregador escolhido */
      const nome = est.nome, rs = nome ? fonte().filter(l => l[tabcol] === est.aba && l[1] === nome) : [];
      const m = rs.length ? (rs.reduce((t, l) => t + parseFloat(l[2].replace(',', '.')), 0) / rs.length).toFixed(1).replace('.', ',') : '';
      resumo.hidden = !rs.length; resumo.innerHTML = rs.length ? `<b>${esc(nome)}</b><span><i class="star">★</i> média ${m}</span><span>${rs.length} avaliaç${rs.length > 1 ? 'ões' : 'ão'}</span>` : '';
    }
    $('#pag').innerHTML = paginas > 1 ? Array.from({ length: paginas }, (_, i) => `<button data-p="${i + 1}" ${i + 1 === est.pg ? 'aria-current="page"' : ''}>${i + 1}</button>`).join('') : '';
  }
  /* aba ativa: mostra só o título e o filtro daquela aba (data-aba) */
  const ajustarAba = () => { $$('[data-aba]').forEach(el => { el.hidden = el.dataset.aba !== est.aba; if (el.hidden) $$('select', el).forEach(s => s.value = ''); });
    if (sug) { q.value = ''; est.q = ''; est.nome = ''; sug.hidden = true; q.placeholder = q.getAttribute('data-ph-' + est.aba) || q.placeholder; } };
  /* barra de pesquisa com sugestões (avaliações): digite e escolha o restaurante/entregador da lista */
  function sugerir() {
    if (!sug) return;
    const t = sem(q.value.trim()), ops = JSON.parse(q.getAttribute('data-ops-' + est.aba)).filter(o => !t || sem(o).includes(t));
    sug.innerHTML = ops.length ? ops.map(o => `<button type="button" role="option" data-n="${esc(o)}">${esc(o)}</button>`).join('') : '<span class="sug-vazio">Nenhum resultado</span>';
    sug.hidden = false;
  }
  if (sug) {
    q.addEventListener('focus', sugerir);
    sug.onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; est.nome = b.dataset.n; q.value = b.dataset.n; est.q = sem(q.value); sug.hidden = true; est.pg = 1; desenhar(); };
    document.addEventListener('click', e => { if (!e.target.closest('.busca')) sug.hidden = true; });
    q.addEventListener('keydown', e => { if (e.key === 'Escape') sug.hidden = true; });
  }

  $('#tb').onchange = e => { const x = e.target.closest('select[data-id]'); if (!x) return; stat[key + ':' + x.dataset.id] = x.value; gravar('status', stat); desenhar(); };
  $('#tb').onclick = e => { const b = e.target.closest('[data-act]'); if (!b) return;
    const tr = b.closest('tr'), id = tr.dataset.id, ac = b.dataset.act, pg = tr.dataset.pg;
    if (ac === 'del') { const l = fonte().find(x => x[0] === id); const nome = key === 'categorias' ? `${l[1]} — ${l[2]}` : l[1]; if (!l || !confirm(`Apagar "${nome}"? O item vai para "Itens apagados" e pode ser restaurado.`)) return; apag.unshift({ page: key, row: l, nome, em: agora() }); }
    else if (ac === 'restore' || ac === 'purge') { if (ac === 'purge' && !confirm('Excluir definitivamente? Esta ação não pode ser desfeita.')) return; apag = apag.filter(a => !(a.page === pg && a.row[0] === id)); }
    else return;
    gravar('apagados', apag); desenhar(); };
  if (q) q.oninput = () => { est.q = sem(q.value); est.pg = 1; if (sug) { est.nome = ''; sugerir(); } desenhar(); };
  $$('.filtros select[data-col]').forEach(s => s.onchange = () => { est.pg = 1; desenhar(); });
  $$('.abas button').forEach(b => b.onclick = () => { $$('.abas button').forEach(x => x.setAttribute('aria-selected', x === b)); est.aba = b.dataset.v; est.pg = 1; ajustarAba(); desenhar(); });
  $('#pag').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { est.pg = +b.dataset.p; desenhar(); } };
  ajustarAba(); desenhar();
}

/* ---------- Configurações (site + minha conta) ---------- */
function configuracoes() {
  const f = $('#cfg'), set = (n, v) => { f.elements[n].value = v; };
  set('nome', cfg.nome); set('email', cfg.email); set('tel', cfg.tel); set('end', cfg.end);
  set('a_nome', cfg.adm.nome); set('a_email', cfg.adm.email); set('a_tel', cfg.adm.tel);
  if (cfg.adm.senhaHash) f.elements.a_senha.placeholder = 'Deixe em branco para manter a senha atual';

  let logo = cfg.logo;
  const msg = (t, erro) => { const o = $('#ok'); o.textContent = t; o.style.color = erro ? 'var(--bad)' : 'var(--ok)'; };
  /* lê a imagem e reduz para no máx. 400 px de largura (cabe no armazenamento do navegador) */
  const lerLogo = file => new Promise(res => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => {
    const w0 = im.naturalWidth || 400, h0 = im.naturalHeight || 120, k = Math.min(1, 400 / w0), cv = document.createElement('canvas');
    cv.width = Math.round(w0 * k); cv.height = Math.round(h0 * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/png')); }; im.src = r.result; }; r.readAsDataURL(file); });

  $('#bt-logo').onclick = () => $('#f-logo').click();
  $('#f-logo').onchange = async e => { const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) return msg('Escolha um arquivo de imagem.', true);
    logo = await lerLogo(file); $('#logo-prev').src = logo; msg('Logo escolhida. Clique em "Salvar alterações".'); };
  $('#bt-padrao').onclick = () => { logo = ''; $('#logo-prev').src = LOGO0; msg('Logo padrão selecionada. Clique em "Salvar alterações".'); };

  f.onsubmit = async e => { e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    let senhaSalt = cfg.adm.senhaSalt || '', senhaHash = cfg.adm.senhaHash || '';
    if (d.a_senha || d.a_senha_confirmacao) {
      if (d.a_senha.length < 8) return msg('A senha do administrador precisa ter pelo menos 8 caracteres.', true);
      if (d.a_senha !== d.a_senha_confirmacao) return msg('As senhas não conferem.', true);
      if (!crypto.subtle) return msg('Este navegador não oferece validação segura de senha. Acesse pelo XAMPP em localhost.', true);
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      senhaSalt = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${senhaSalt}:${d.a_senha}`));
      senhaHash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    }
    const novo = { nome: d.nome.trim() || CFG0.nome, email: d.email.trim(), tel: d.tel.trim(), end: d.end.trim(), logo,
      adm: { nome: d.a_nome.trim() || CFG0.adm.nome, email: d.a_email.trim(), tel: d.a_tel.trim(), senhaSalt, senhaHash } };
    try { localStorage.setItem('garfoo_cfg', JSON.stringify(novo)); } catch { return msg('Não foi possível salvar (imagem muito grande?).', true); }
    Object.assign(cfg, novo); aplicarCfg(); msg('Alterações salvas.'); };
}

/* ---------- Dados reais compartilhados entre os perfis ---------- */
function sincronizarDadosReais() {
  const lerLocal = (chave, padrao) => {
    try { const valor = JSON.parse(localStorage.getItem(chave)); return valor ?? padrao; }
    catch { return padrao; }
  };
  const nome = conta => conta?.dados?.nomeUsuario || conta?.dados?.nomeCompleto || conta?.nomeUsuario || conta?.nome || "Sem nome";
  const email = conta => conta?.dados?.emailUsuario || conta?.dados?.email || conta?.emailUsuario || conta?.email || "";
  const telefone = conta => conta?.dados?.telefone || conta?.dados?.telefoneUsuario || conta?.dados?.telefoneRes || conta?.telefone || "";
  const perfil = conta => String(conta?.tipo || conta?.tipoUsuario || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const contas = lerLocal("garfooContasCadastradas", null);
  const dono = conta => conta?.perfilProprietario || (perfil(conta).includes("propriet") ? conta?.dados || {} : {});
  const entregador = conta => conta?.perfilEntregador || (perfil(conta).includes("entreg") ? conta?.dados || {} : {});
  const formatarData = value => {
    if (!value) return "—";
    const data = new Date(value);
    return Number.isNaN(data.getTime()) ? String(value) : data.toLocaleString("pt-BR");
  };
  const dinheiro = value => `R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const statusPedido = pedido => {
    const status = pedido.statusEntrega || pedido.status || "Aguardando confirmação";
    if (/entregue/i.test(status)) return "Entregue";
    if (/cancelad/i.test(status)) return "Cancelado";
    if (/rota|caminho/i.test(status)) return "Em rota";
    if (/preparo|retirada|confirmad/i.test(status)) return "Em preparo";
    return "Aguardando";
  };

  if (Array.isArray(contas)) {
    DADOS.usuarios = contas.map((conta, i) => [String(conta.id || conta.idUsuario || conta.dados?.cpf || `conta-${i + 1}`), nome(conta), email(conta), telefone(conta), formatarData(conta.criadoEm || conta.dataCadastro), "Ativo"]);
    DADOS.proprietarios = contas.filter(conta => dono(conta).nomeRes || perfil(conta).includes("propriet")).map((conta, i) => {
      const restaurante = dono(conta);
      return [String(conta.id || conta.idUsuario || `proprietario-${i + 1}`), nome(conta), email(conta), telefone(conta), restaurante.nomeRes || "Restaurante não informado", "Ativo"];
    });
    DADOS.entregadores = contas.filter(conta => entregador(conta).tipoVeiculo || perfil(conta).includes("entreg")).map((conta, i) => {
      const cadastro = entregador(conta);
      return [String(conta.id || conta.idUsuario || `entregador-${i + 1}`), nome(conta), [cadastro.modeloVeiculo, cadastro.tipoVeiculo || cadastro.veiculo, cadastro.anoVeiculo].filter(Boolean).join(" · ") || "—", cadastro.placaVeiculo || cadastro.placa || "—", cadastro.numeroCnhEntregador || cadastro.cnh || "—", String(cadastro.avaliacao || cadastro.avaliacaoEntregador || "—"), "Ativo"];
    });
  } else { DADOS.usuarios = []; DADOS.proprietarios = []; DADOS.entregadores = []; }

  const indiceRestaurantes = lerLocal("garfoo-owner-restaurantes", null);
  const restaurantesAdmin = [...(indiceRestaurantes?.restaurants || [])];
  if (Array.isArray(contas)) contas.forEach((conta, i) => {
    const restaurante = dono(conta);
    if (!restaurante.nomeRes || restaurantesAdmin.some(item => String(item.id) === String(restaurante.codRestaurante) || String(item.nomeRes || "").toLocaleLowerCase("pt-BR") === String(restaurante.nomeRes).toLocaleLowerCase("pt-BR"))) return;
    restaurantesAdmin.push({ id: restaurante.codRestaurante || `restaurante-conta-${i + 1}`, ownerId: restaurante.codProprie || conta.id || conta.idUsuario, nomeRes: restaurante.nomeRes, linkLogoRes: restaurante.linkLogoRes });
  });
  if (indiceRestaurantes || restaurantesAdmin.length) {
    DADOS.restaurantes = restaurantesAdmin.map((item, i) => {
      const salvo = lerLocal(`garfoo-owner-${item.id}`, {});
      const restaurante = { ...(salvo.restaurant || {}), ...item };
      const proprietario = Array.isArray(contas) ? contas.find(conta => String(dono(conta).codProprie || conta.dados?.codProprie || "") === String(item.ownerId || restaurante.codProprie || "")) : null;
      return [String(item.id || `restaurante-${i + 1}`), restaurante.nomeRes || "Restaurante", proprietario ? nome(proprietario) : String(item.ownerName || "—"), restaurante.telefoneRes || "—", String(restaurante.avaliacaoRes || "—"), restaurante.statusRes || "Ativa"];
    });
  } else DADOS.restaurantes = [];

  const pedidos = lerLocal("garfooPedidosCliente", null);
  const corridas = lerLocal("garfoo-entregador-corridas", null);
  if (Array.isArray(pedidos)) {
    const corridasRegistradas = [corridas?.atual, ...(corridas?.proximas || []), ...(corridas?.concluidas || [])].filter(Boolean);
    DADOS.pedidos = pedidos.map((pedido, i) => {
      const item = pedido.itens?.[0] || {};
      const nomeRestaurante = item.restaurante || "Restaurante";
      const corrida = corridasRegistradas.find(registro => String(registro.pedidoClienteId || "") === String(pedido.id || ""));
      const entregadorNome = pedido.entregador?.nome || corrida?.entregador?.nome || corrida?.nomeEntregador || "—";
      return [String(pedido.numero || pedido.id || `pedido-${i + 1}`), formatarData(pedido.dataHora || pedido.dataHoraPedido), pedido.clienteNome || pedido.nomeCliente || "Cliente", nomeRestaurante, entregadorNome, dinheiro(pedido.total ?? pedido.subtotal), statusPedido(pedido)];
    });
    DADOS.pagamentos = pedidos.map((pedido, i) => {
      const pago = Boolean(pedido.pagamentoConfirmado || pedido.pago || pedido.statusPagamento === "Pago");
      const cancelado = /cancelad/i.test(pedido.statusEntrega || pedido.status || "");
      return [`#P-${pedido.numero || pedido.id || i + 1}`, String(pedido.numero || pedido.id || `pedido-${i + 1}`), pedido.clienteNome || pedido.nomeCliente || "Cliente", dinheiro(pedido.total ?? pedido.subtotal), pedido.cartao?.tipo || pedido.metodoPagamento || "Não informado", formatarData(pedido.dataHora || pedido.dataHoraPedido), cancelado ? "Estornado" : pago ? "Pago" : "Pendente"];
    });
    const avaliacoes = [];
    pedidos.forEach(pedido => {
      const dadosCliente = pedido.avaliacoesCliente || {};
      const restaurantesAvaliados = Object.values(dadosCliente.restaurantes || {});
      if (!restaurantesAvaliados.length && dadosCliente.restaurante) restaurantesAvaliados.push(dadosCliente.restaurante);
      restaurantesAvaliados.forEach(avaliacao => avaliacoes.push([pedido.clienteNome || "Cliente", avaliacao.restauranteNome || pedido.itens?.[0]?.restaurante || "Restaurante", Number(avaliacao.nota || 0).toFixed(1).replace(".", ","), avaliacao.comentario || "", formatarData(avaliacao.criadaEm), "r"]));
      if (dadosCliente.entregador) {
        const avaliacao = dadosCliente.entregador;
        avaliacoes.push([pedido.clienteNome || "Cliente", avaliacao.entregadorNome || pedido.entregador?.nome || "Entregador", Number(avaliacao.nota || 0).toFixed(1).replace(".", ","), avaliacao.comentario || "", formatarData(avaliacao.criadaEm), "e"]);
      }
      const avaliacaoCliente = pedido.avaliacoesEntregador?.cliente;
      if (avaliacaoCliente) avaliacoes.push([pedido.entregador?.nome || "Entregador", pedido.clienteNome || "Cliente", Number(avaliacaoCliente.nota || 0).toFixed(1).replace(".", ","), avaliacaoCliente.comentario || "", formatarData(avaliacaoCliente.criadaEm), "e"]);
    });
    DADOS.avaliacoes = avaliacoes;
  } else { DADOS.pedidos = []; DADOS.pagamentos = []; DADOS.avaliacoes = []; }

  /* Entregas finalizadas que não estão vinculadas a um pedido de cliente também entram no painel. */
  if (corridas && Array.isArray(corridas.concluidas)) {
    const idsPedidos = new Set((DADOS.pedidos || []).map(row => row[0]));
    const corridasSemPedido = corridas.concluidas.filter(corrida => !corrida.pedidoClienteId && !idsPedidos.has(String(corrida.id))).map(corrida => [String(corrida.id), formatarData(corrida.finalizadaEm), corrida.cliente || "Cliente", corrida.restaurante || "Restaurante", corrida.entregador?.nome || "Entregador", dinheiro(corrida.ganhoEntregador ?? corrida.valor), "Entregue"]);
    DADOS.pedidos = [...(DADOS.pedidos || []), ...corridasSemPedido];
  }
  if (document.querySelector("[data-dashboard-value]")) atualizarDashboardReal();
}

function atualizarDashboardReal() {
  const numero = valor => Number(valor || 0).toLocaleString("pt-BR");
  const reais = valor => `R$ ${Number(valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const parseReais = valor => Number(String(valor || "0").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;
  const receita = (DADOS.pedidos || []).reduce((total, row) => total + parseReais(row[5]), 0);
  const pagos = (DADOS.pagamentos || []).filter(row => row[6] === "Pago").reduce((total, row) => total + parseReais(row[3]), 0);
  const valores = { usuarios: DADOS.usuarios.length, restaurantes: DADOS.restaurantes.length, entregadores: DADOS.entregadores.length,
    pedidos: DADOS.pedidos.length, pagamentos: DADOS.pagamentos.length, receita: reais(receita), pagos: reais(pagos) };
  $$('[data-dashboard-value]').forEach(el => { el.textContent = valores[el.dataset.dashboardValue] ?? "0"; });
  const corpo = $('[data-dashboard-status]');
  if (corpo) {
    const estados = ["Em preparo", "Aguardando", "Em rota", "Entregue", "Cancelado"];
    const classes = { "Em preparo": "warn", Aguardando: "warn", "Em rota": "info", Entregue: "ok", Cancelado: "bad" };
    corpo.innerHTML = estados.map(status => {
      const quantidade = DADOS.pedidos.filter(row => row[6] === status).length;
      const participacao = DADOS.pedidos.length ? (quantidade / DADOS.pedidos.length * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0";
      return `<tr><td><span class="pill ${classes[status]}">${esc(status === "Aguardando" ? "Aguardando confirmação" : status)}</span></td><td>${numero(quantidade)}</td><td>${participacao}%</td></tr>`;
    }).join("");
  }
}

/* ---------- Inicialização ---------- */
sincronizarDadosReais();
menu(); aplicarCfg();
const pagina = document.body.dataset.page;
if (pagina === 'configuracoes') configuracoes();
else if ($('#tabela')) lista(pagina);
window.addEventListener('storage', evento => {
  if (['garfooContasCadastradas', 'garfoo-owner-restaurantes', 'garfooPedidosCliente', 'garfoo-entregador-corridas'].includes(evento.key) || evento.key?.startsWith('garfoo-owner-')) location.reload();
});
