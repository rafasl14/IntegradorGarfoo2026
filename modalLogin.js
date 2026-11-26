(() => {
  const destinos = { cliente: 'cliente.html', proprietario: 'proprietario.html', entregador: 'entregadorComLogin.html' };

  function criarModal() {
    if (document.getElementById('modal-login')) return document.getElementById('modal-login');
    const modal = document.createElement('section');
    modal.id = 'modal-login';
    modal.className = 'modal-login';
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-login-fundo" data-fechar-login></div>
      <div class="modal-login-conteudo">
        <div class="modal-login-ilustracao" aria-hidden="true"><div class="modal-login-circulo"></div><img src="Garfoologin.png" alt=""></div>
        <div class="modal-login-caixa" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-login">
          <button class="modal-login-fechar" type="button" aria-label="Fechar login" data-fechar-login>&times;</button>
          <h2 id="titulo-modal-login">Bem-vindo de volta!</h2>
          <p>Faça login para continuar.</p>
          <form id="form-modal-login">
            <label class="modal-login-campo">Usuário<input name="usuario" type="text" placeholder="Digite o e-mail ou CPF" autocomplete="username" required></label>
            <label class="modal-login-campo">Senha<input name="senha" type="password" placeholder="************" autocomplete="current-password" required></label>
            <a href="#" data-abrir-recuperacao>Esqueci minha senha</a>
            <button class="modal-login-enviar" type="submit">Entrar</button>
            <p class="modal-login-mensagem" role="status"></p>
          </form>
          <div class="modal-login-links"><p>Ainda não possui conta? <a href="#" data-ir-cadastro>Cadastre-se</a></p></div>
        </div>
      </div>`;
    document.body.append(modal);
    modal.querySelectorAll('[data-fechar-login]').forEach(botao => botao.addEventListener('click', fecharLogin));
    modal.querySelector('[data-ir-cadastro]').addEventListener('click', evento => {
      evento.preventDefault(); fecharLogin();
      document.querySelector('[data-abrir-cadastro]')?.click();
    });
    modal.querySelector('[data-abrir-recuperacao]').addEventListener('click', evento => {
      evento.preventDefault(); fecharLogin(); window.abrirRecuperacao?.();
    });
    modal.querySelector('form').addEventListener('submit', async evento => {
      evento.preventDefault();
      const formulario = evento.currentTarget;
      const identificador = formulario.elements.namedItem('usuario').value.trim();
      const senha = formulario.elements.namedItem('senha').value;
      const mensagem = modal.querySelector('.modal-login-mensagem');
      let conta = await window.GarfooContas?.localizarAdministrador(identificador, senha) || null;
      if (!conta) conta = await window.GarfooContas?.localizarUsuarioJSON(identificador, senha) || null;
      if (!conta) conta = window.GarfooContas?.localizarConta(identificador, senha) || null;
      if (!conta) {
        try {
          const atual = JSON.parse(localStorage.getItem('garfooUsuarioLogado') || 'null');
          const dados = atual?.dados || {};
          const entrada = identificador.includes('@')
            ? String(dados.emailUsuario || '').trim().toLocaleLowerCase('pt-BR') === identificador.toLocaleLowerCase('pt-BR')
            : identificador.replace(/\D/g, '').length === 11 && String(dados.cpf || '').replace(/\D/g, '') === identificador.replace(/\D/g, '');
          if (entrada && dados.senhaUsuario === senha && (window.GarfooContas?.destinoDaConta(atual) || destinos[atual.tipo])) {
            conta = atual;
            window.GarfooContas?.salvarConta(conta);
          }
        } catch {}
      }
      const destino = window.GarfooContas?.destinoDaConta(conta) || destinos[conta?.tipo];
      if (!conta || !destino) {
        mensagem.textContent = 'E-mail/CPF ou senha não conferem.';
        return;
      }
      conta.modoAtivo = window.GarfooContas?.tipoDaConta(conta) || conta.tipo;
      conta.autenticadoEm = new Date().toISOString();
      localStorage.setItem('garfooUsuarioLogado', JSON.stringify(conta));
      window.location.href = destino;
    });
    return modal;
  }

  function abrirLogin() {
    const modal = criarModal();
    modal.hidden = false; modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-login-aberto');
    modal.querySelector('input').focus();
  }
  function fecharLogin() {
    const modal = document.getElementById('modal-login');
    if (!modal) return;
    modal.hidden = true; modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-login-aberto');
  }
  function criarModalRecuperacao() {
    if (document.getElementById('modal-recuperacao')) return document.getElementById('modal-recuperacao');
    const modal = document.createElement('section');
    modal.id = 'modal-recuperacao';
    modal.className = 'modal-recuperacao';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal-recuperacao-fundo" data-fechar-recuperacao></div>
      <div class="modal-recuperacao-caixa" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-recuperacao">
        <button class="modal-recuperacao-fechar" type="button" aria-label="Fechar recuperação de senha" data-fechar-recuperacao>&times;</button>
        <h2 id="titulo-modal-recuperacao">Recuperar senha</h2>
        <p>Informe seu e-mail para receber as instruções de recuperação.</p>
        <form id="form-modal-recuperacao">
          <label class="modal-login-campo">E-mail<input name="email" type="email" placeholder="Digite seu e-mail" autocomplete="email" required></label>
          <button class="modal-login-enviar" type="submit">Enviar</button>
          <p class="modal-recuperacao-mensagem" role="status"></p>
        </form>
      </div>`;
    document.body.append(modal);
    modal.querySelectorAll('[data-fechar-recuperacao]').forEach(botao => botao.addEventListener('click', fecharRecuperacao));
    modal.querySelector('form').addEventListener('submit', async evento => {
      evento.preventDefault();
      modal.querySelector('.modal-recuperacao-mensagem').textContent = 'Instruções enviadas para o seu e-mail.';
    });
    return modal;
  }
  function abrirRecuperacao() {
    const modal = criarModalRecuperacao();
    modal.hidden = false;
    document.body.classList.add('modal-recuperacao-aberto');
    modal.querySelector('input').focus();
  }
  function fecharRecuperacao() {
    const modal = document.getElementById('modal-recuperacao');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-recuperacao-aberto');
  }
  window.abrirLogin = abrirLogin;
  window.abrirRecuperacao = abrirRecuperacao;
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-abrir-login]').forEach(botao => botao.addEventListener('click', evento => { evento.preventDefault(); abrirLogin(); }));
  });
  document.addEventListener('keydown', evento => { if (evento.key === 'Escape') { fecharLogin(); fecharRecuperacao(); } });
})();
