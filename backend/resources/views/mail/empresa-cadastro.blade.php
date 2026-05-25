<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bem-vindo ao Sinal RH</title>
<style>
  body { margin: 0; padding: 0; background: #f4f6fb; font-family: Arial, sans-serif; }
  .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #003366 0%, #002244 100%); padding: 36px 40px; }
  .logo { font-size: 22px; font-weight: 700; color: #ffffff; }
  .logo span { color: #e67e22; }
  .tagline { font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
  .body { padding: 36px 40px; }
  h1 { font-size: 20px; color: #003366; margin: 0 0 8px; }
  p { font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 16px; }
  .highlight { background: #f0f4fa; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .highlight p { margin: 0; font-size: 13px; }
  .highlight strong { color: #003366; }
  .btn { display: inline-block; background: #003366; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; margin: 8px 0 24px; }
  .footer { background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  .steps { margin: 20px 0; }
  .step { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
  .step-num { width: 24px; height: 24px; background: #003366; color: white; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .step-text { font-size: 13px; color: #374151; line-height: 1.5; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">Sinal<span>RH</span></div>
    <div class="tagline">by Sara Linhar Consultoria</div>
  </div>
  <div class="body">
    <h1>Bem-vindo, {{ $admin->nome }}! 🎉</h1>
    <p>
      Sua conta na plataforma <strong>Sinal RH</strong> foi criada com sucesso.
      A empresa <strong>{{ $empresa->nome_fantasia }}</strong> está pronta para começar.
    </p>

    <div class="highlight">
      <p><strong>Seu acesso:</strong></p>
      <p>E-mail: <strong>{{ $admin->email }}</strong></p>
      <p style="margin-top:4px;">Plano: <strong>{{ ucfirst($empresa->plano) }}</strong> · Até {{ $empresa->max_colaboradores }} colaboradores</p>
    </div>

    <a href="{{ env('FRONTEND_URL', 'http://localhost:5173') }}/admin/login" class="btn">
      Acessar o painel →
    </a>

    <p style="font-weight:600; color:#1f2a37; margin-top:8px;">Próximos passos:</p>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">Importe seus colaboradores via CSV — leva menos de 2 minutos.</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">Crie e publique sua primeira avaliação NR-1 (PGR de riscos psicossociais).</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">Acompanhe os indicadores de clima no dashboard em tempo real.</div>
      </div>
    </div>

    <p style="font-size:12px; color:#9ca3af;">
      Precisa de ajuda? Responda este e-mail — nossa equipe retorna em até 1 dia útil.
    </p>
  </div>
  <div class="footer">
    Sinal RH · Sara Linhar Consultoria · Este é um e-mail automático, por favor não responda diretamente.
  </div>
</div>
</body>
</html>
