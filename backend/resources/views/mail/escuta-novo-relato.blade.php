<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#003366,#002244);padding:28px 36px;">
      <div style="font-size:20px;font-weight:700;color:#fff;">Sinal<span style="color:#e67e22;">RH</span></div>
      <div style="font-size:11px;color:rgba(255,255,255,.5);letter-spacing:1px;text-transform:uppercase;margin-top:2px;">Canal de Escuta</div>
    </div>
    <div style="padding:32px 36px;">
      <h1 style="font-size:18px;color:#003366;margin:0 0 12px;">Novo relato para o seu grupo</h1>
      <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 16px;">
        Há um novo relato aguardando tratamento no Canal de Escuta de <strong>{{ $empresaNome }}</strong>, direcionado ao grupo <strong>{{ $grupoLabel }}</strong> (prioridade {{ $prioridade }}).
      </p>
      <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 16px;">
        Por sigilo, o conteúdo não é enviado por e-mail. Acesse o painel para visualizar e tratar o relato.
      </p>
      <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:20px 0 0;">Se você não faz parte deste grupo de tratamento, ignore este aviso.</p>
    </div>
  </div>
</body>
</html>
