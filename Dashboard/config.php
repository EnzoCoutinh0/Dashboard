<?php
declare(strict_types=1);

session_start();

// Valores padrão do XAMPP local. Em produção, defina as variáveis de ambiente
// DB_HOST, DB_NAME, DB_USER e DB_PASS em vez de colocar senhas neste arquivo.
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'sistema_login';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    die('Não foi possível conectar ao banco de dados. Verifique o MySQL no XAMPP e importe o arquivo database.sql.');
}

function e(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function requireLogin(): void {
    if (empty($_SESSION['usuario_id'])) {
        header('Location: index.php');
        exit;
    }
}
