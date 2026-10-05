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
<link rel="stylesheet" href="assets/auth.css">
</head>
<body>
<div class="auth-shell">
    <section class="auth-brand">
        <div class="brand-mark">P</div>
        <span class="eyebrow">PURPLE FINANCE</span>
        <h1>Suas finanças,<br><strong>mais simples.</strong></h1>
        <p>Uma experiência moderna para acompanhar cotações e organizar seu acesso com segurança.</p>
        <div class="brand-pills">
            <span>● Dados em tempo real</span>
            <span>✓ Acesso seguro</span>
        </div>
    </section>

    <main class="auth-card">
        <div class="mobile-logo"><div class="brand-mark">P</div></div>
        <div class="auth-heading">
            <span>Bem-vindo de volta</span>
            <h2>Entrar na sua conta</h2>
            <p>Acesse seu painel financeiro.</p>
        </div>

        <?php if ($erro): ?><div class="alert error"><?= e($erro) ?></div><?php endif; ?>
        <?php if ($sucesso): ?><div class="alert success"><?= e($sucesso) ?></div><?php endif; ?>

        <form action="autenticar.php" method="POST" class="auth-form">
            <label for="email">E-mail</label>
            <div class="input-wrap">
                <span>✉</span>
                <input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autocomplete="email">
            </div>

            <label for="senha">Senha</label>
            <div class="input-wrap">
                <span>●</span>
                <input id="senha" name="senha" type="password" placeholder="Digite sua senha" required autocomplete="current-password">
                <button type="button" class="toggle-pass" data-target="senha" aria-label="Mostrar senha">◉</button>
            </div>

            <button class="primary-btn" type="submit">Entrar <span>→</span></button>
        </form>

        <p class="switch">Ainda não tem uma conta? <a href="cadastro.php">Criar conta</a></p>
    </main>
</div>
<script src="assets/auth.js"></script>
</body>
</html>
