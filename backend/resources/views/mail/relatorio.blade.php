<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatorio Radar Pessoas</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2a37; line-height: 1.6;">
    <h1 style="font-size: 20px; color: #003366;">Relatorio Radar Pessoas</h1>

    <p>
        O relatorio de <strong>{{ $empresa->nome_fantasia }}</strong>
        referente ao periodo <strong>{{ $relatorio->periodo }}</strong> esta pronto.
    </p>

    <p>O PDF segue em anexo.</p>

    <p>
        Atenciosamente,<br>
        Radar Pessoas
    </p>
</body>
</html>
