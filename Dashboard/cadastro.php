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
<link rel="stylesheet" href="assets/auth.css">
</head>
<body>
<div class="auth-shell">
    <section class="auth-brand">
        <div class="brand-mark">P</div>
        <span class="eyebrow">PURPLE FINANCE</span>
        <h1>Comece sua jornada<br><strong>hoje.</strong></h1>
        <p>Crie seu acesso e tenha seu painel financeiro sempre à mão.</p>
        <div class="brand-pills">
            <span>✓ Cadastro rápido</span>
            <span>✓ Senha protegida</span>
        </div>
    </section>

    <main class="auth-card register-card">
        <div class="auth-heading">
            <span>Primeiro acesso</span>
            <h2>Criar sua conta</h2>
            <p>Preencha os dados abaixo para começar.</p>
        </div>

        <?php if ($erro): ?><div class="alert error"><?= e($erro) ?></div><?php endif; ?>

        <form action="registrar.php" method="POST" class="auth-form">
            <label for="nome">Nome completo</label>
            <div class="input-wrap"><span>◉</span><input id="nome" name="nome" type="text" placeholder="Seu nome" required autocomplete="name" maxlength="120"></div>

            <label for="email">E-mail</label>
            <div class="input-wrap"><span>✉</span><input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autocomplete="email" maxlength="180"></div>

            <label for="telefone">Telefone</label>
            <div class="input-wrap"><span>⌕</span><input id="telefone" name="telefone" type="tel" placeholder="(27) 99999-9999" required autocomplete="tel" maxlength="25"></div>

            <label for="senha">Senha</label>
            <div class="input-wrap"><span>●</span><input id="senha" name="senha" type="password" placeholder="Mínimo de 6 caracteres" required minlength="6" autocomplete="new-password"><button type="button" class="toggle-pass" data-target="senha" aria-label="Mostrar senha">◉</button></div>

            <label for="confirmar_senha">Confirmar senha</label>
            <div class="input-wrap"><span>●</span><input id="confirmar_senha" name="confirmar_senha" type="password" placeholder="Repita sua senha" required minlength="6" autocomplete="new-password"><button type="button" class="toggle-pass" data-target="confirmar_senha" aria-label="Mostrar senha">◉</button></div>

            <button class="primary-btn" type="submit">Criar conta <span>→</span></button>
        </form>
        <p class="switch">Já possui uma conta? <a href="index.php">Voltar para o login</a></p>
    </main>
</div>
<script src="assets/auth.js"></script>
</body>
</html>
