<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Lembrete de Avaliação NR-1</title>
</head>
<body style="font-family: Arial, sans-serif; color: #1f2a37; line-height: 1.6;">
    <h1 style="font-size: 20px; color: #003366;">Lembrete: Avaliação de Saúde e Segurança Psicossocial (NR-1)</h1>

    <p>Olá, {{ $colaborador->nome }}.</p>

    <p>
        A sua empresa, <strong>{{ $empresa->nome_fantasia }}</strong>, está realizando uma pesquisa interna de percepção sobre saúde mental e segurança psicossocial relacionada ao trabalho (em conformidade com a NR-1).
    </p>

    <p>
        O seu feedback é de extrema importância para nos ajudar a identificar fatores de risco e construir ações de melhoria contínua para o ambiente de trabalho.
    </p>

    <p style="background: #f3f4f6; border-left: 4px solid #003366; padding: 12px; font-style: italic; border-radius: 4px; font-size: 14px;">
        <strong>Garantia de Anonimato:</strong> Em conformidade com as diretrizes de SSO e a LGPD, esta pesquisa é totalmente <strong>anônima</strong>. As informações de resposta são coletadas e consolidadas de forma coletiva, impossibilitando a identificação individual de qualquer resposta.
    </p>

    <p>
        Caso você ainda não tenha participado, por favor responda clicando no link abaixo:
    </p>

    <p>
        <a href="{{ $url }}" style="display: inline-block; background: #e67e22; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Responder Pesquisa NR-1
        </a>
    </p>

    <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
        *Se você já respondeu a esta pesquisa nos últimos dias, por favor desconsidere este e-mail. Obrigado!*
    </p>
</body>
</html>
