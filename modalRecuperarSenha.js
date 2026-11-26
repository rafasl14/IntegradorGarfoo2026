(() => {
  function fecharRecuperacao() {
    const modal = document.getElementById('modal-recuperacao');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-recuperacao-aberto');
  }

  function abrirRecuperacao() {
    let modal = document.getElementById('modal-recuperacao');
    if (!modal) {
      modal = document.createElement('section');
      modal.id = 'modal-recuperacao';
      modal.className = 'modal-recuperacao';
      modal.hidden = true;
      modal.innerHTML = `
        <div class="modal-recuperacao-fundo" data-fechar-recuperacao></div>
        <div class="modal-recuperacao-conteudo">
          <div class="modal-recuperacao-ilustracao" aria-hidden="true"><div class="modal-recuperacao-circulo"></div><img src="Garfoologin.png" alt=""></div>
          <div class="modal-recuperacao-caixa" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-recuperacao">
          <button class="modal-recuperacao-fechar" type="button" aria-label="Fechar recuperação de senha" data-fechar-recuperacao>&times;</button>
          <h2 id="titulo-modal-recuperacao">Esqueceu sua senha?</h2>
          <p>Sem problemas, vamos te ajudar. <br>
          <br>Informe o e-mail cadastrado na sua conta e enviaremos um link para você criar uma nova senha.</p>
          <form id="form-modal-recuperacao">
            <label class="modal-recuperacao-campo">E-mail<input name="email" type="email" placeholder="Digite seu e-mail cadastrado" autocomplete="email" required></label>
            <button class="modal-recuperacao-enviar" type="submit">Enviar link de recuperação</button>
            <p class="modal-recuperacao-mensagem" role="status"></p>
          </form>
          <p class="modal-recuperacao-voltar">Lembrou a senha? <a href="#" data-voltar-login>Voltar para o login</a></p>
          </div>
        </div>`;
      document.body.append(modal);
      modal.querySelectorAll('[data-fechar-recuperacao]').forEach(botao => botao.addEventListener('click', fecharRecuperacao));
      modal.querySelector('[data-voltar-login]').addEventListener('click', evento => {
        evento.preventDefault();
        fecharRecuperacao();
        window.abrirLogin?.();
      });
      modal.querySelector('form').addEventListener('submit', evento => {
        evento.preventDefault();
        modal.querySelector('.modal-recuperacao-mensagem').textContent = 'Instruções enviadas para o seu e-mail.';
      });
    }
    modal.hidden = false;
    document.body.classList.add('modal-recuperacao-aberto');
    modal.querySelector('input').focus();
  }

  window.abrirRecuperacao = abrirRecuperacao;
  window.fecharRecuperacao = fecharRecuperacao;
  document.addEventListener('keydown', evento => { if (evento.key === 'Escape') fecharRecuperacao(); });
})();
