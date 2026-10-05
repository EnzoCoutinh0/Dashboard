<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: cadastro.php'); exit;
}

$nome = trim($_POST['nome'] ?? '');
$email = trim(strtolower($_POST['email'] ?? ''));
$telefone = trim($_POST['telefone'] ?? '');
$senha = $_POST['senha'] ?? '';
$confirmar = $_POST['confirmar_senha'] ?? '';

if ($nome === '' || strlen($nome) < 3) {
    $_SESSION['cadastro_erro'] = 'Digite seu nome completo.';
    header('Location: cadastro.php'); exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['cadastro_erro'] = 'Digite um e-mail válido.';
    header('Location: cadastro.php'); exit;
}
if ($telefone === '') {
    $_SESSION['cadastro_erro'] = 'Informe seu telefone.';
    header('Location: cadastro.php'); exit;
}
if (strlen($senha) < 6) {
    $_SESSION['cadastro_erro'] = 'A senha precisa ter pelo menos 6 caracteres.';
    header('Location: cadastro.php'); exit;
}
if ($senha !== $confirmar) {
    $_SESSION['cadastro_erro'] = 'As senhas não coincidem.';
    header('Location: cadastro.php'); exit;
}

$check = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) {
    $_SESSION['cadastro_erro'] = 'Este e-mail já está cadastrado.';
    header('Location: cadastro.php'); exit;
}

$hash = password_hash($senha, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)');
$stmt->execute([$nome, $email, $telefone, $hash]);

$_SESSION['cadastro_sucesso'] = 'Conta criada com sucesso! Agora faça seu login.';
header('Location: index.php');
exit;
