# Plano de Execução — Relato Anônimo Público (Canal de Escuta)

> Documento de planejamento. Nenhuma alteração de código foi feita.
> Criado: 28/07/2026 — v1

**Problema**: hoje o relato anônimo é feito dentro do app logado (`/app/escuta`). Mesmo com `colaborador_id = null`, o fato de estar autenticado gera desconfiança — o colaborador não tem como *verificar* que o anonimato é real.

**Solução**: página pública sem login, com **link único por empresa** (não expõe a carteira de clientes), que gera **protocolo de acompanhamento** e permite diálogo anônimo bidirecional com o comitê. Além de resolver a desconfiança, fortalece a adequação à Lei 14.457/2022 (canal de denúncias com garantia de anonimato).

## 1. Fluxo do denunciante

```
1. Recebe o link/QR divulgado internamente pela empresa
   → sinalrh.saralinhar.com.br/escuta/{slug}
2. Página pública com logo/nome da empresa + garantias de anonimato
3. Preenche o relato (mesmos campos do formulário interno:
   categoria, envolvidos, texto — sem nenhum dado pessoal obrigatório)
4. Recebe o PROTOCOLO (ex.: ESC-7K2M-9XQ4-TR) — exibido uma única vez,
   com aviso para guardar (copiar/baixar .txt)
5. Acompanhamento: /escuta/acompanhar → digita o protocolo
   → vê status + mensagens do comitê → pode responder (diálogo anônimo)
```

O precedente técnico já existe no projeto: `/avaliacao/nr1/:codigo` é página pública com acesso por código.

## 2. Identificação da empresa — link único (slug)

```
ALTER empresas
  + escuta_slug (string 40, unique, nullable)
  + escuta_publica_ativa (bool default false)
```

- Slug gerado ao ativar: `nome-fantasia-slugificado` + sufixo aleatório de 4 chars (ex.: `acme-x7k2`) — evita adivinhação por enumeração de nomes.
- **Nenhum endpoint lista empresas publicamente.** A página só resolve slug exato; slug inválido retorna erro genérico.
- Ativação/desativação e regeneração do slug na tela de Configurações do canal (`/admin`) — regenerar invalida o link antigo (útil se vazar para fora da empresa).
- Gate: além do slug ativo, empresa precisa do produto `canal_escuta` vigente.

## 3. Protocolo e acompanhamento

```
ALTER relatos_escuta
  + origem (interno|publico, default interno)
  + protocolo (string 20, unique, nullable)

escuta_mensagens               ← diálogo denunciante ↔ comitê (NOVA)
  id, relato_id (FK), autor (denunciante|equipe)
  user_id (FK users nullable — quem da equipe respondeu; NUNCA exposto na API pública)
  texto (TEXT), lida_em (nullable), timestamps
```

- **Protocolo**: `ESC-` + 10 caracteres alfanuméricos sem ambíguos (sem 0/O/1/I) ≈ 50 bits de entropia. O protocolo **é** a credencial: quem o tem, acessa o relato. Por isso: alta entropia + throttle agressivo na consulta (5 tentativas/min por IP) + resposta idêntica para "não existe" e "errado".
- Gerar protocolo **também para relatos internos** daqui em diante (unifica a referência nas tratativas; para o colaborador logado é só um bônus de acompanhamento).
- `escuta_mensagens` é separada de `escuta_notas` de propósito: notas são internas da equipe; mensagens são visíveis ao denunciante. Nenhum campo de autoria individual sai na API pública (denunciante vê apenas "Comitê").
- Roteamento por conflito de interesse **reaproveitado**: o formulário público pergunta `tipo_envolvido` (mesmo campo atual) e a mesma regra define `grupo_destino` (rh|diretoria|presidencia|comite_externo). Extrair a lógica hoje no `EscutaController` do app para um service compartilhado (`EscutaRoteamentoService`).

## 4. Anonimato verificável (o argumento de confiança)

A página pública deve *afirmar e cumprir*:

- Sem login, sem cookie de sessão, sem analytics na página.
- **IP não é gravado no relato.** Rate-limit usa contadores transitórios em cache (chave por IP com TTL), que expiram — decisão documentada para sustentar a promessa "não rastreamos quem envia".
- Campos de identificação (nome/contato) **não existem** no formulário público; se o denunciante quiser se identificar, escreve no texto por vontade própria.
- `relatos_escuta.origem = publico` sempre terá `colaborador_id = null` por construção.
- Texto curto na página explicando isso em linguagem simples (é o que diferencia da desconfiança do canal logado).

## 5. Anti-abuso

| Camada | Implementação |
|---|---|
| Rate limit de envio | `throttle` Laravel: 3 relatos/hora por IP no POST público |
| Rate limit de consulta | 5 consultas/min por IP (anti força-bruta de protocolo) |
| Honeypot | Campo oculto no form; preenchido = descarte silencioso |
| Tempo mínimo | Token do form emitido no GET; POST aceito só após 10s |
| Limites de payload | Texto 10–5000 chars; sem anexos na v1 |
| Slug regenerável | Se o link vazar externamente, empresa gera outro |

Captcha (Cloudflare Turnstile) fica como opção de fase 2, só se houver abuso real — captcha atrita justamente o usuário assustado que queremos acolher.

## 6. Backend — endpoints

### Público (`/api/publico/escuta/*`, sem auth, throttled)
```
GET  {slug}                    nome fantasia + logo + categorias + form token
                               (404 genérico se slug inativo/produto vencido)
POST {slug}/relato             cria relato origem=publico → retorna protocolo
POST acompanhar                body: protocolo → status + mensagens do comitê
POST acompanhar/responder      body: protocolo + texto → nova escuta_mensagem (autor=denunciante)
```

### Admin (`/api/admin/escuta/*`, existente — acréscimos)
```
GET  escuta/config             slug atual, status, link completo, QR
POST escuta/config/ativar | desativar | regenerar-slug
POST escuta/{relato}/mensagem  responde ao denunciante (autor=equipe)
```
Tela `CanalEscuta.jsx` ganha: badge de origem (interno/público), aba "Mensagens ao denunciante" separada das notas internas, indicador de resposta não lida do denunciante.

## 7. Frontend — páginas públicas (novas)

| Rota | Página |
|---|---|
| `/escuta/:slug` | Formulário público: identidade visual da empresa, garantias de anonimato, campos do relato, tela de sucesso com protocolo (copiar / baixar .txt) |
| `/escuta/acompanhar` | Campo de protocolo → linha do tempo de status + mensagens + caixa de resposta |

- Mobile-first (o acesso será majoritariamente por QR no celular).
- Rota pública no `AppRoutes.jsx`, fora dos layouts autenticados (mesmo nível de `/avaliacao/nr1/:codigo`).
- Configurações do admin exibem o link + QR code pronto para baixar/imprimir (cartaz de divulgação).

## 8. Fases de entrega

| Fase | Escopo |
|---|---|
| **1** | Migrations (slug, origem, protocolo, `escuta_mensagens`) + service de roteamento compartilhado + endpoints públicos de envio + página `/escuta/:slug` + config admin com QR |
| **2** | Acompanhamento: consulta por protocolo, diálogo bidirecional, acréscimos na tela admin, protocolo também nos relatos internos |
| **3** | Refinos: baixar cartaz pronto (PDF com QR), Turnstile se necessário, métricas de uso na Plataforma |

## 9. Decisões em aberto

- **Protocolo em claro no banco**: necessário para a equipe referenciar o caso; a segurança vem da entropia + throttle. Alternativa (hash como senha) impediria o admin de ver o protocolo — descartada por atrito operacional.
- **Prazo de resposta**: definir SLA padrão exibido na página ("você terá retorno em até X dias úteis") — configurável por empresa?
- **Relato público sem setor**: `setor_id` fica null (denunciante pode indicar setor denunciado, não o próprio). Confirmar se algum relatório/índice atual assume setor preenchido.
- **E-mail opcional para notificação**: permitir que o denunciante deixe um e-mail *apenas* para avisos de nova mensagem? Aumenta retorno ao canal, mas enfraquece a narrativa de anonimato absoluto. Sugestão: não na v1.
