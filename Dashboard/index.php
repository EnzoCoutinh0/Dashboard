<?php
require_once 'config.php';

if (!empty($_SESSION['usuario_id'])) {
    header('Location: dashboard.php');
    exit;
}

$erro = $_SESSION['login_erro'] ?? '';
unset($_SESSION['login_erro']);
$sucesso = $_SESSION['cadastro_sucesso'] ?? '';
unset($_SESSION['cadastro_sucesso']);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Entrar | Purple Finance</title>
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
        <h1>Suas finanças,<br><strong>mais simples.</strong></h1>
        <p>Uma experiência moderna para acompanhar cotações e organizar seu acesso com segurança.</p>
        <div class="brand-pills">
            <span><i class="dot"></i> Dados em tempo real</span>
            <span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg> Acesso seguro</span>
        </div>
        <div class="brand-preview" aria-hidden="true">
            <div class="brand-preview-head"><b>USD / BRL</b><span>Hoje</span></div>
            <div class="brand-preview-value"><strong>R$ 5,42</strong><em>+0,8%</em></div>
            <svg class="spark" viewBox="0 0 300 56" preserveAspectRatio="none"><defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".45"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs><path d="M0 44 C30 40 45 46 70 36 S110 30 130 33 170 18 195 22 240 10 260 14 290 6 300 5 V56 H0Z" fill="url(#sg)"/><path d="M0 44 C30 40 45 46 70 36 S110 30 130 33 170 18 195 22 240 10 260 14 290 6 300 5" fill="none" stroke="#a78bfa" stroke-width="2.2"/></svg>
        </div>
    </section>

    <main class="auth-card">
        <div class="mobile-logo"><div class="brand-mark">P</div></div>
        <div class="auth-heading">
            <span>Bem-vindo de volta</span>
            <h2>Entrar na sua conta</h2>
            <p>Acesse seu painel financeiro.</p>
        </div>

        <?php if ($erro): ?><div class="alert error" role="alert"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg><span><?= e($erro) ?></span></div><?php endif; ?>
        <?php if ($sucesso): ?><div class="alert success" role="status"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/></svg><span><?= e($sucesso) ?></span></div><?php endif; ?>

        <form action="autenticar.php" method="POST" class="auth-form">
            <label for="email">E-mail</label>
            <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>
                <input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autocomplete="email">
            </div>

            <label for="senha">Senha</label>
            <div class="input-wrap">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
                <input id="senha" name="senha" type="password" placeholder="Digite sua senha" required autocomplete="current-password">
                <button type="button" class="toggle-pass" data-target="senha" aria-label="Mostrar senha"><svg class="icon eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="icon eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.7M6.6 6.7C3.9 8.5 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg></button>
            </div>

            <button class="primary-btn" type="submit">Entrar <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </form>

        <p class="switch">Ainda não tem uma conta? <a href="cadastro.php">Criar conta</a></p>
    </main>
</div>
<script src="assets/auth.js?v=3"></script>
</body>
</html>
