<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#003366,#002244);padding:28px 36px;">
      <div style="font-size:20px;font-weight:700;color:#fff;">Sinal<span style="color:#e67e22;">RH</span></div>
      <div style="font-size:11px;color:rgba(255,255,255,.5);letter-spacing:1px;text-transform:uppercase;margin-top:2px;">Canal de Escuta · Confidencial</div>
    </div>
    <div style="padding:32px 36px;">
      <h1 style="font-size:18px;color:#003366;margin:0 0 12px;">Relato para tratamento externo</h1>
      <p style="font-size:14px;color:#4b5563;line-height:1.7;margin:0 0 16px;">
        Um relato do Canal de Escuta da empresa <strong>{{ $d['empresa'] }}</strong> foi encaminhado ao comitê/conselho externo por envolver o nível mais alto da organização. Por sigilo, este caso não é visível a nenhum usuário interno do sistema.
      </p>
      <div style="background:#f0f4fa;border-radius:8px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:#4b5563;"><strong style="color:#003366;">Referência:</strong> #{{ $d['ref'] }}</p>
        <p style="margin:0 0 6px;font-size:13px;color:#4b5563;"><strong style="color:#003366;">Categoria:</strong> {{ $d['categoria'] }}</p>
        <p style="margin:0 0 6px;font-size:13px;color:#4b5563;"><strong style="color:#003366;">Prioridade:</strong> {{ $d['prioridade'] }}</p>
        <p style="margin:0;font-size:13px;color:#4b5563;"><strong style="color:#003366;">Identificação:</strong> {{ $d['identificacao'] }}</p>
      </div>
      <p style="font-size:13px;color:#4b5563;line-height:1.7;margin:0 0 8px;"><strong style="color:#003366;">Relato:</strong></p>
      <div style="border-left:3px solid #e67e22;padding:8px 16px;background:#fafafa;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">{{ $d['texto'] }}</div>
      @if(!empty($d['url_tratamento']))
      <div style="margin:28px 0 8px;text-align:center;">
        <a href="{{ $d['url_tratamento'] }}" style="display:inline-block;background:#e67e22;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:bold;font-size:14px;">
          Tratar e responder este relato
        </a>
      </div>
      <p style="font-size:12px;color:#6b7280;line-height:1.6;margin:12px 0 0;text-align:center;">
        O link acima é a sua credencial de acesso a este caso — não o repasse.<br>
        Por lá você acompanha o status e conversa com quem relatou, mantendo o anonimato.
      </p>
      @endif
      <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:20px 0 0;">Mensagem confidencial. Trate conforme a política de sigilo da organização.</p>
    </div>
  </div>
</body>
</html>
