<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php'); exit;
}

$email = trim(strtolower($_POST['email'] ?? ''));
$senha = $_POST['senha'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $senha === '') {
    $_SESSION['login_erro'] = 'Informe um e-mail e uma senha válidos.';
    header('Location: index.php'); exit;
}

$stmt = $pdo->prepare('SELECT id, nome, email, senha FROM usuarios WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($senha, $usuario['senha'])) {
    $_SESSION['login_erro'] = 'E-mail ou senha incorretos.';
    header('Location: index.php'); exit;
}

session_regenerate_id(true);
$_SESSION['usuario_id'] = $usuario['id'];
$_SESSION['usuario_nome'] = $usuario['nome'];
$_SESSION['usuario_email'] = $usuario['email'];

header('Location: dashboard.php');
exit;
