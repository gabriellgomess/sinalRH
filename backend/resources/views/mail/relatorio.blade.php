<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório Sinal RH</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2a37; line-height: 1.6;">
    <h1 style="font-size: 20px; color: #003366;">Relatório Sinal RH</h1>

    <p>
        O relatório de <strong>{{ $empresa->nome_fantasia }}</strong>
        referente ao período <strong>{{ $relatorio->periodo }}</strong> está pronto.
    </p>

    <p>O PDF segue em anexo.</p>

    <p>
        Atenciosamente,<br>
        Sinal RH
    </p>
</body>
</html>
