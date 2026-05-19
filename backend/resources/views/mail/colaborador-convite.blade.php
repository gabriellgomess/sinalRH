<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Convite Radar Pessoas</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2a37; line-height: 1.6;">
    <h1 style="font-size: 20px; color: #003366;">Voce foi convidado para o Radar Pessoas</h1>

    <p>Ola, {{ $colaborador->nome }}.</p>

    <p>
        {{ $empresa->nome_fantasia }} convidou voce para acessar o Radar Pessoas.
        Para ativar sua conta, defina sua senha pelo link abaixo.
    </p>

    <p>
        <a href="{{ $url }}" style="display: inline-block; background: #e67e22; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Definir minha senha
        </a>
    </p>

    <p style="font-size: 12px; color: #6b7280;">
        Este convite expira em 7 dias. Se voce nao solicitou este acesso, ignore este e-mail.
    </p>
</body>
</html>
