# Purple Finance — Login + Dashboard

Projeto PHP com MySQL para XAMPP.

## Instalação

1. Copie a pasta para `C:\xampp\htdocs\`.
2. Inicie **Apache** e **MySQL** no XAMPP.
3. Abra `http://localhost/phpmyadmin`.
4. Importe `database.sql`.
5. Abra `http://localhost/Tela-Login-Roxo/`.

O cadastro grava automaticamente `nome`, `email`, `telefone` e senha com `password_hash()` na tabela `usuarios`.

## Banco
Banco: `sistema_login`
Tabela: `usuarios`

Se o MySQL tiver senha no usuário `root`, altere `$pass` em `config.php`.

## GitHub e segurança

O arquivo `.gitignore` deste projeto evita o envio acidental de configurações locais, credenciais, logs, dependências e arquivos compactados.

Antes de publicar o projeto, nunca adicione ao repositório:

- senhas reais;
- chaves de API;
- tokens de acesso;
- arquivos `.env` com segredos;
- dados reais de usuários;
- dumps ou backups do banco de dados;
- arquivos ZIP gerados para distribuição.

O `database.sql` deste projeto contém somente a estrutura necessária para criar o banco e a tabela de usuários.

A configuração atual do `config.php` é voltada para o ambiente local do XAMPP. Em um servidor de produção, recomenda-se utilizar variáveis de ambiente ou uma configuração protegida fora do código versionado.
