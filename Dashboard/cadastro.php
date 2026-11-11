<?php
require_once 'config.php';

if (!empty($_SESSION['usuario_id'])) {
    header('Location: dashboard.php');
    exit;
}

$erro = $_SESSION['cadastro_erro'] ?? '';
unset($_SESSION['cadastro_erro']);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Criar conta | Purple Finance</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/auth.css?v=3">
<meta name="theme-color" content="#07050c">
</head>
<body>
<div class="auth-shell">
    <section class="auth-brand">
        <div class="brand-mark">P</div>
        <span class="eyebrow">PURPLE FINANCE</span>
        <h1>Comece sua jornada<br><strong>hoje.</strong></h1>
        <p>Crie seu acesso e tenha seu painel financeiro sempre à mão.</p>
        <div class="brand-pills">
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg> Cadastro rápido</span>
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg> Senha protegida</span>
        </div>
    </section>

    <main class="auth-card register-card">
        <div class="mobile-logo"><div class="brand-mark">P</div></div>
        <div class="auth-heading">
            <span>Primeiro acesso</span>
            <h2>Criar sua conta</h2>
            <p>Preencha os dados abaixo para começar.</p>
        </div>

        <?php if ($erro): ?><div class="alert error" role="alert"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg><span><?= e($erro) ?></span></div><?php endif; ?>

        <form action="registrar.php" method="POST" class="auth-form">
            <label for="nome">Nome completo</label>
            <div class="input-wrap"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20.5c1.4-3.6 4.5-5.5 8-5.5s6.6 1.9 8 5.5"/></svg><input id="nome" name="nome" type="text" placeholder="Seu nome" required autocomplete="name" maxlength="120"></div>

            <label for="email">E-mail</label>
            <div class="input-wrap"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg><input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autocomplete="email" maxlength="180"></div>

            <label for="telefone">Telefone</label>
            <div class="input-wrap"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg><input id="telefone" name="telefone" type="tel" placeholder="(27) 99999-9999" required autocomplete="tel" maxlength="25"></div>

            <div class="form-row">
                <div>
                    <label for="senha">Senha</label>
            <div class="input-wrap"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg><input id="senha" name="senha" type="password" placeholder="Mín. 6 dígitos" required minlength="6" autocomplete="new-password"><button type="button" class="toggle-pass" data-target="senha" aria-label="Mostrar senha"><svg class="icon eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="icon eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7M6.6 6.7C3.9 8.5 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg></button></div>

                </div>
                <div>
                    <label for="confirmar_senha">Confirmar senha</label>
            <div class="input-wrap"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg><input id="confirmar_senha" name="confirmar_senha" type="password" placeholder="Repita" required minlength="6" autocomplete="new-password"><button type="button" class="toggle-pass" data-target="confirmar_senha" aria-label="Mostrar senha"><svg class="icon eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="icon eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7M6.6 6.7C3.9 8.5 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg></button></div>

                </div>
            </div>

            <button class="primary-btn" type="submit">Criar conta <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </form>
        <p class="switch">Já possui uma conta? <a href="index.php">Voltar para o login</a></p>
    </main>
</div>
<script src="assets/auth.js?v=3"></script>
</body>
</html>
