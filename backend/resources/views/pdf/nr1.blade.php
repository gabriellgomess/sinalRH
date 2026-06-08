<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>PGR — Avaliação de Riscos Psicossociais NR-1</title>
    <style>
        /* ── Margem física zero global para cobrir capa full-bleed ── */
        @page {
            size: A4 portrait;
            margin: 0px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif; }

        /* ── Paddings globais no body definem as margens reais das paginas internas ── */
        html, body {
            padding-top: 38pt;
            padding-left: 45pt;
            padding-right: 45pt;
            padding-bottom: 55pt;
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 9.5px;
            color: #2c3e50;
            line-height: 1.5;
            background: #ffffff;
        }

        /* ── Capa full-bleed (A4 = 595×842pt) com compensação de paddings e z-index ── */
        .capa {
            position: absolute;
            top: -38pt;
            left: -45pt;
            width: 595pt;
            height: 842pt;
            background-color: #0b132b;
            color: #ffffff;
            padding: 80pt 55pt 60pt 55pt;
            box-sizing: border-box;
            overflow: hidden;
            z-index: 1000;
        }

        .capa-logo {
            font-size: 22pt;
            font-weight: 700;
            margin-bottom: 4pt;
            letter-spacing: 0.5px;
            color: #ffffff;
        }
        .capa-logo span { color: #e0a96d; } /* Ouro quente */
        .capa-sub {
            font-size: 7.5pt;
            opacity: 0.55;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #ffffff;
        }

        .capa-badge {
            display: inline-block;
            background: rgba(224, 169, 109, 0.12);
            border: 1px solid rgba(224, 169, 109, 0.35);
            border-radius: 4px;
            padding: 6pt 14pt;
            font-size: 8pt;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #e0a96d;
        }

        .capa-rodape {
            position: absolute;
            bottom: 45pt;
            left: 55pt;
            right: 55pt;
            font-size: 7.5pt;
            opacity: 0.45;
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            padding-top: 12pt;
            letter-spacing: 0.5px;
            color: #ffffff;
        }

        /* ── Conteúdo: margens vêm do @page; força início em nova página ── */
        .conteudo {
            padding: 0;
            page-break-before: always;
        }

        .secao { margin-bottom: 32px; page-break-inside: avoid; }

        .secao-titulo {
            font-size: 12px;
            font-weight: 700;
            color: #0b132b;
            border-bottom: 2px solid #e0a96d;
            padding-bottom: 6px;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .subtitulo-secao {
            font-size: 9px;
            color: #64748b;
            margin-bottom: 14px;
            font-style: italic;
        }

        /* ── Sumário Corporativo ── */
        .sumario {
            list-style: none;
            padding: 0;
        }
        .sumario li {
            display: table;
            width: 100%;
            padding: 9px 0;
            border-bottom: 1px dotted #cbd5e1;
            font-size: 10.5px;
        }
        .sumario li .titulo {
            display: table-cell;
            width: 85%;
            color: #1e293b;
        }
        .sumario li .num {
            font-weight: 700;
            color: #0b132b;
            margin-right: 6px;
        }
        .sumario li .pagina {
            display: table-cell;
            text-align: right;
            color: #64748b;
            font-weight: 600;
            font-size: 9.5px;
        }

        /* ── Tabela de Identificação ── */
        .ident-tabela {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .ident-tabela td {
            padding: 8px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9.5px;
        }
        .ident-tabela tr:last-child td { border-bottom: 0; }
        .ident-tabela td.label {
            background: #f8fafc;
            color: #475569;
            font-weight: 700;
            width: 32%;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 7.5px;
        }
        .ident-tabela td.valor {
            color: #0f172a;
            font-weight: 500;
        }

        /* ── Indicadores e Dashboard ── */
        .score-geral {
            display: table;
            width: 100%;
            margin-bottom: 24px;
            border-collapse: separate;
            border-spacing: 8px 0;
        }

        .score-box {
            display: table-cell;
            text-align: center;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-top: 3px solid #64748b;
            border-radius: 6px;
            padding: 14px 10px;
            width: 25%;
            vertical-align: middle;
        }
        .score-box.verde { border-top-color: #2a9d8f; }
        .score-box.amarelo { border-top-color: #e9c46a; }
        .score-box.vermelho { border-top-color: #e76f51; }

        .score-num { font-size: 24px; font-weight: 700; color: #0b132b; }
        .score-num.verde   { color: #2a9d8f; }
        .score-num.amarelo { color: #d97706; }
        .score-num.vermelho { color: #e76f51; }
        
        .score-label {
            font-size: 7.5px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 700;
            margin-top: 4px;
        }

        /* ── Tabelas Gerais ── */
        table.secoes {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 6px;
        }
        table.secoes thead tr {
            background: #0b132b;
            color: white;
        }
        table.secoes th {
            padding: 8px 10px;
            text-align: left;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 7.5px;
            letter-spacing: 0.5px;
        }
        table.secoes td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
            color: #334155;
        }
        table.secoes tbody tr:nth-child(even) { background: #f8fafc; }

        /* Progress Bars */
        .barra-container {
            background: #e2e8f0;
            border-radius: 10px;
            height: 7px;
            width: 90px;
            display: inline-block;
            vertical-align: middle;
            overflow: hidden;
        }
        .barra-fill { height: 100%; border-radius: 10px; }
        .barra-verde    { background: #2a9d8f; }
        .barra-amarelo  { background: #e9c46a; }
        .barra-vermelho { background: #e76f51; }

        /* ── Plano de Ação Premium ── */
        table.plano {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
        }
        table.plano thead tr {
            background: #0b132b;
            color: white;
        }
        table.plano th {
            padding: 7px 8px;
            text-align: left;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 7px;
            letter-spacing: 0.5px;
        }
        table.plano td {
            padding: 7px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
            color: #334155;
        }
        table.plano tbody tr:nth-child(even) { background: #f8fafc; }

        /* Badges de Status e Prioridades */
        .badge-status {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 6.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .status-planejada   { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
        .status-em_andamento { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .status-concluida   { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .status-cancelada   { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }

        .badge-prioridade {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 3px;
            font-size: 6.5px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .prio-alta  { background: #fee2e2; color: #b91c1c; }
        .prio-media { background: #fef3c7; color: #92400e; }
        .prio-baixa { background: #dcfce7; color: #166534; }

        .pill-s { display: inline-block; background: #dcfce7; color: #15803d; padding: 1.5px 6px; border-radius: 4px; font-weight: 700; font-size: 8px; }
        .pill-p { display: inline-block; background: #fef3c7; color: #a16207; padding: 1.5px 6px; border-radius: 4px; font-weight: 700; font-size: 8px; }
        .pill-n { display: inline-block; background: #fee2e2; color: #b91c1c; padding: 1.5px 6px; border-radius: 4px; font-weight: 700; font-size: 8px; }

        /* ── Caixa de Mensagens/Avisos ── */
        .caixa-info {
            background: #f8fafc;
            border-left: 3px solid #0b132b;
            border-radius: 0 6px 6px 0;
            padding: 10px 14px;
            margin-bottom: 16px;
            font-size: 8.5px;
            color: #475569;
            border: 1px solid #e2e8f0;
            border-left-width: 3px;
        }

        .caixa-versao {
            background: #fffbeb;
            border-left: 3px solid #d97706;
            border-radius: 0 6px 6px 0;
            padding: 10px 14px;
            font-size: 8.5px;
            color: #b45309;
            margin-bottom: 16px;
            border: 1px solid #fef3c7;
            border-left-width: 3px;
        }

        /* ── Termo de Aprovação Formal ── */
        .aprovacao-box {
            border: 1px solid #e2e8f0;
            border-top: 3px solid #e0a96d;
            border-radius: 8px;
            padding: 20px 24px;
            margin-top: 12px;
            background: #f8fafc;
        }

        .aprovacao-titulo {
            font-size: 10px;
            font-weight: 700;
            color: #0b132b;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .assinatura-linha {
            display: table;
            width: 100%;
            margin-top: 24px;
        }

        .assinatura-campo {
            display: table-cell;
            padding-right: 30px;
            vertical-align: bottom;
            width: 50%;
        }

        .assinatura-linha-baixo {
            border-top: 1px solid #475569;
            padding-top: 6px;
            font-size: 8.5px;
            color: #1e293b;
            font-weight: 700;
        }

        /* ── Metodologia Ocupacional ── */
        .metodologia {
            font-size: 9px;
            line-height: 1.6;
            color: #475569;
        }
        .metodologia p { margin-bottom: 10px; }
        .metodologia strong { color: #0b132b; font-weight: 700; }

        /* ── Rodapé Fixo (dentro da margem inferior de 55pt) ── */
        .rodape {
            position: fixed;
            bottom: -35pt;
            left: 0;
            right: 0;
            height: 18pt;
            border-top: 1px solid #e2e8f0;
            padding-top: 5pt;
            font-size: 7pt;
            color: #94a3b8;
            background: transparent;
        }

        .quebra { page-break-before: always; }

        .badge-nivel {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .nivel-alto    { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .nivel-medio   { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
        .nivel-baixo   { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    </style>
</head>
<body>

{{-- ─────────────────────── CAPA ─────────────────────── --}}
<div class="capa">
    {{-- Marca --}}
    <div style="margin-bottom: 90pt;">
        <img src="{{ public_path('images/logo_horizontal_white.png') }}" style="height: 95px; display: block;">
    </div>

    {{-- Badge regulatório --}}
    <div class="capa-badge">PGR · NR-1 · Portaria MTE 1.419/2024</div>

    {{-- Bloco-título com barra dourada lateral --}}
    <table style="width: 100%; border-collapse: collapse; margin-top: 24pt; margin-bottom: 40pt;">
        <tr>
            <td style="width: 4pt; background-color: #e0a96d; padding: 0;"></td>
            <td style="padding-left: 18pt; vertical-align: middle;">
                <div style="font-size: 26pt; font-weight: 700; color: #ffffff; line-height: 1.2; margin-bottom: 14pt;">
                    Programa de Gerenciamento de<br>Riscos Psicossociais
                </div>
                <div style="font-size: 15pt; font-weight: 600; color: #e0a96d; margin-bottom: 4pt;">
                    {{ $empresa->nome_fantasia }}
                </div>
                @if($empresa->cnpj)
                <div style="font-size: 9pt; color: #8c9bb4; letter-spacing: 0.3px;">
                    CNPJ: {{ $empresa->cnpj }}
                </div>
                @endif
            </td>
        </tr>
    </table>

    {{-- Cards informativos (border-collapse para evitar overflow) --}}
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 6pt;">
                <div style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.10); border-radius: 6px; padding: 14pt 16pt;">
                    <div style="color: #8c9bb4; text-transform: uppercase; letter-spacing: 0.8px; font-size: 6.5pt; font-weight: 700; margin-bottom: 6pt;">Documento</div>
                    <div style="font-size: 10pt; font-weight: 600; color: #ffffff;">{{ $nr1->titulo }}</div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 6pt;">
                <div style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.10); border-radius: 6px; padding: 14pt 16pt;">
                    <div style="color: #8c9bb4; text-transform: uppercase; letter-spacing: 0.8px; font-size: 6.5pt; font-weight: 700; margin-bottom: 6pt;">Versão · Código · Aplicação</div>
                    <div style="font-size: 10pt; font-weight: 600; color: #ffffff;">
                        v{{ $nr1->versao ?? '1.0' }} · {{ $nr1->codigo }}
                        @if($nr1->aplicada_em)
                         · {{ \Carbon\Carbon::parse($nr1->aplicada_em)->format('d/m/Y') }}
                        @endif
                    </div>
                </div>
            </td>
        </tr>
    </table>

    @if($nr1->aprovado_por)
    <div style="margin-top: 12pt; background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.10); border-radius: 6px; padding: 14pt 16pt;">
        <div style="color: #8c9bb4; text-transform: uppercase; letter-spacing: 0.8px; font-size: 6.5pt; font-weight: 700; margin-bottom: 6pt;">Aprovação Regulatória Formal</div>
        <div style="font-size: 10pt; font-weight: 600; color: #ffffff;">
            Aprovado por <strong>{{ $nr1->aprovado_por }}</strong>@if($nr1->aprovado_cargo) ({{ $nr1->aprovado_cargo }})@endif em {{ \Carbon\Carbon::parse($nr1->aprovado_em)->format('d/m/Y') }}
        </div>
    </div>
    @endif

    <div class="capa-rodape">
        Documento oficial e restrito gerado em {{ now()->format('d/m/Y \à\s H:i') }} ·
        Confidencial · Uso interno e regulatório de SSO (MTE)
    </div>
</div>

{{-- ─────────────────── SUMÁRIO ─────────────────── --}}
<div class="conteudo">

    <div class="secao">
        <div class="secao-titulo">Sumário</div>
        <ol class="sumario">
            <li><span class="titulo"><span class="num">1.</span> Identificação da Empresa e do Documento</span><span class="pagina">3</span></li>
            <li><span class="titulo"><span class="num">2.</span> Metodologia e Base Normativa</span><span class="pagina">3</span></li>
            <li><span class="titulo"><span class="num">3.</span> Indicadores Gerais da Avaliação</span><span class="pagina">4</span></li>
            <li><span class="titulo"><span class="num">4.</span> Avaliação por Dimensão Psicossocial (ISO 45003)</span><span class="pagina">4</span></li>
            @if(count($scores['itens_criticos']) > 0)
            <li><span class="titulo"><span class="num">5.</span> Inventário de Riscos Psicossociais Identificados</span><span class="pagina">5</span></li>
            @endif
            @if(isset($planoAcoes) && $planoAcoes->count() > 0)
            <li><span class="titulo"><span class="num">{{ count($scores['itens_criticos']) > 0 ? 6 : 5 }}.</span> Plano de Ação Corretiva e Preventiva</span><span class="pagina">6</span></li>
            @endif
            <li>
                <span class="titulo">
                    <span class="num">{{ 5 + (count($scores['itens_criticos']) > 0 ? 1 : 0) + (isset($planoAcoes) && $planoAcoes->count() > 0 ? 1 : 0) }}.</span>
                    Aprovação e Vigência do Documento
                </span>
                <span class="pagina">7</span>
            </li>
        </ol>
    </div>

    {{-- ─────────────────── 1. IDENTIFICAÇÃO ─────────────────── --}}
    <div class="secao">
        <div class="secao-titulo">1. Identificação da Empresa e do Documento</div>

        @if($nr1->versaoOrigem)
        <div class="caixa-versao">
            <strong>Reavaliação:</strong> este documento (v{{ $nr1->versao }}) revisa a versão anterior
            <strong>v{{ $nr1->versaoOrigem->versao }}</strong>
            @if($nr1->versaoOrigem->aplicada_em)
             aplicada em {{ \Carbon\Carbon::parse($nr1->versaoOrigem->aplicada_em)->format('d/m/Y') }},
            @endif
            em conformidade com a periodicidade exigida pela NR-1.
        </div>
        @endif

        <table class="ident-tabela">
            <tr>
                <td class="label">Razão Social</td>
                <td class="valor">{{ $empresa->razao_social ?? $empresa->nome_fantasia }}</td>
            </tr>
            <tr>
                <td class="label">Nome Fantasia</td>
                <td class="valor">{{ $empresa->nome_fantasia }}</td>
            </tr>
            @if($empresa->cnpj)
            <tr>
                <td class="label">CNPJ</td>
                <td class="valor">{{ $empresa->cnpj }}</td>
            </tr>
            @endif
            @if($empresa->email_contato)
            <tr>
                <td class="label">E-mail de Contato</td>
                <td class="valor">{{ $empresa->email_contato }}</td>
            </tr>
            @endif
            <tr>
                <td class="label">Total de Empregados Ativos</td>
                <td class="valor">{{ $totalColaboradores ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Total de Setores</td>
                <td class="valor">{{ $totalSetores ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Título do Documento</td>
                <td class="valor">{{ $nr1->titulo }}</td>
            </tr>
            <tr>
                <td class="label">Versão / Código</td>
                <td class="valor">v{{ $nr1->versao ?? '1.0' }} · {{ $nr1->codigo }}</td>
            </tr>
            @if($nr1->aplicada_em)
            <tr>
                <td class="label">Data de Aplicação</td>
                <td class="valor">{{ \Carbon\Carbon::parse($nr1->aplicada_em)->format('d/m/Y') }}</td>
            </tr>
            @endif
            @if($nr1->proxima_avaliacao_em)
            <tr>
                <td class="label">Próxima Reavaliação Prevista</td>
                <td class="valor"><strong>{{ \Carbon\Carbon::parse($nr1->proxima_avaliacao_em)->format('d/m/Y') }}</strong></td>
            </tr>
            @endif
            <tr>
                <td class="label">Status do Documento</td>
                <td class="valor">{{ ucfirst($nr1->status) }}</td>
            </tr>
        </table>
    </div>

    {{-- ─────────────────── 2. METODOLOGIA ─────────────────── --}}
    <div class="secao">
        <div class="secao-titulo">2. Metodologia e Base Normativa</div>

        <div class="metodologia">
            <p>
                <strong>Base legal.</strong> NR-1 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais
                (Portaria MTE n.º 1.419, de 21 de agosto de 2024), que determina a identificação, avaliação
                e controle de riscos psicossociais no Programa de Gerenciamento de Riscos (PGR).
            </p>
            <p>
                <strong>Instrumento de avaliação.</strong> Checklist anônimo estruturado em 10 dimensões
                psicossociais alinhadas à norma ISO 45003:2021 (Saúde e segurança ocupacional — Diretrizes
                para gestão de riscos psicossociais): (1) Demandas de Trabalho, (2) Controle e Autonomia,
                (3) Clareza de Papel e Expectativas, (4) Relacionamentos e Justiça Organizacional,
                (5) Reconhecimento e Recompensa, (6) Suporte e Segurança Psicológica,
                (7) Condições Organizacionais e Comunicação, (8) Gestão de Mudanças,
                (9) Segurança e Situações Críticas e (10) Integração e Trabalho Remoto.
            </p>
            <p>
                <strong>Escala de respostas.</strong> Cada item é avaliado em escala Likert de 1 a 5, onde as respostas 4 e 5 são classificadas como Favoráveis (F), a resposta 3 como Neutra (P) e as respostas 1 e 2 como Desfavoráveis (D).
                O score percentual de cada dimensão é calculado como (F + P×0,5) / total × 100,
                resultando em três níveis de risco:
                <span class="badge-nivel nivel-baixo">≥ 70% Baixo</span>
                <span class="badge-nivel nivel-medio">40–69% Moderado</span>
                <span class="badge-nivel nivel-alto">&lt; 40% Alto</span>
            </p>
            <p>
                <strong>Confidencialidade / LGPD.</strong> Os respondentes são identificados apenas
                por setor, faixa etária e sexo, sem coleta de nome, CPF ou e-mail, em conformidade
                com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
            <p>
                <strong>Critério de criticidade.</strong> Itens com 30% ou mais de respostas
                Desfavoráveis (1 e 2) são automaticamente classificados como riscos psicossociais
                prioritários e compõem o inventário desta avaliação.
            </p>
        </div>
    </div>

    {{-- ─────────────────── 3. INDICADORES GERAIS ─────────────────── --}}
    <div class="secao quebra">
        <div class="secao-titulo">3. Indicadores Gerais da Avaliação</div>
        @php
            $scoreGeral = $scores['score_geral'];
            $scoreClass = $scoreGeral === null ? 'vermelho' : ($scoreGeral >= 70 ? 'verde' : ($scoreGeral >= 40 ? 'amarelo' : 'vermelho'));
            $totalS = $scores['global']['S'] ?? 0;
            $totalP = $scores['global']['P'] ?? 0;
            $totalN = $scores['global']['N'] ?? 0;
        @endphp
        <div class="score-geral">
            <div class="score-box {{ $scoreClass }}">
                <div class="score-num {{ $scoreClass }}">
                    {{ $scoreGeral !== null ? $scoreGeral . '%' : 'N/D' }}
                </div>
                <div class="score-label">Score Geral PGR</div>
            </div>
            <div class="score-box">
                <div class="score-num">{{ $scores['total_respondentes'] }}</div>
                <div class="score-label">Respondentes</div>
            </div>
            <div class="score-box verde">
                <div class="score-num verde">{{ $totalS }}</div>
                <div class="score-label">Favoráveis (4 e 5)</div>
            </div>
            <div class="score-box vermelho">
                <div class="score-num vermelho">{{ $totalN }}</div>
                <div class="score-label">Desfavoráveis (1 e 2)</div>
            </div>
        </div>
        @if(!empty($filtros) && array_filter($filtros))
        <div class="caixa-info">
            <strong>Recorte aplicado:</strong>
            @foreach($filtros as $k => $v)
                @if($v) {{ str_replace('_', ' ', $k) }}: <strong>{{ $v }}</strong>; @endif
            @endforeach
        </div>
        @endif
    </div>

    {{-- ─────────────────── 4. SCORE POR DIMENSÃO ─────────────────── --}}
    <div class="secao">
        <div class="secao-titulo">4. Avaliação por Dimensão Psicossocial (ISO 45003)</div>
        <p class="subtitulo-secao">Score percentual e nível de risco para cada uma das 10 dimensões avaliadas.</p>
        <table class="secoes">
            <thead>
                <tr>
                    <th style="width:38%;">Dimensão</th>
                    <th style="width:12%;">Score</th>
                    <th style="width:18%;">Nível de Risco</th>
                    <th style="width:18%;">Resultado</th>
                    <th style="width:7%;">F</th>
                    <th style="width:7%;">D</th>
                </tr>
            </thead>
            <tbody>
                @foreach($scores['por_secao'] as $secao)
                    @php
                        $sc = $secao['score'];
                        $bc = $sc === null ? 'barra-vermelho' : ($sc >= 70 ? 'barra-verde' : ($sc >= 40 ? 'barra-amarelo' : 'barra-vermelho'));
                        $nivel = $sc === null ? '—' : ($sc >= 70 ? 'Baixo risco' : ($sc >= 40 ? 'Risco moderado' : 'Alto risco'));
                        $nlvClass = $sc === null ? '' : ($sc >= 70 ? 'nivel-baixo' : ($sc >= 40 ? 'nivel-medio' : 'nivel-alto'));
                        $width = $sc !== null ? round($sc) : 0;
                    @endphp
                    <tr>
                        <td>{{ $secao['secao'] }}. {{ $secao['label'] }}</td>
                        <td><span style="font-weight:700; color:#003366;">{{ $sc !== null ? $sc.'%' : '—' }}</span></td>
                        <td><span class="badge-nivel {{ $nlvClass }}">{{ $nivel }}</span></td>
                        <td>
                            <div class="barra-container">
                                <div class="barra-fill {{ $bc }}" style="width:{{ $width }}%"></div>
                            </div>
                        </td>
                        <td><span class="pill-s">{{ $secao['S'] }}</span></td>
                        <td><span class="pill-n">{{ $secao['N'] }}</span></td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    {{-- ─────────────────── 5. INVENTÁRIO DE RISCOS ─────────────────── --}}
    @if(count($scores['itens_criticos']) > 0)
    <div class="secao quebra">
        <div class="secao-titulo">5. Inventário de Riscos Psicossociais Identificados</div>
        <p class="subtitulo-secao">
            Itens com 30% ou mais de respostas Desfavoráveis (1 e 2), classificados como riscos prioritários
            para o Programa de Gerenciamento de Riscos (PGR) nos termos da Portaria MTE 1.419/2024.
        </p>
        <table class="secoes">
            <thead>
                <tr>
                    <th style="width:8%;">#</th>
                    <th style="width:42%;">Fator de Risco Identificado</th>
                    <th style="width:13%;">Dimensão</th>
                    <th style="width:13%;">% Desfav.</th>
                    <th style="width:12%;">Total D</th>
                    <th style="width:12%;">Respondentes</th>
                </tr>
            </thead>
            <tbody>
                @foreach($scores['itens_criticos'] as $i => $item)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $item['label'] }}</td>
                    <td>Seção {{ $item['secao'] }}</td>
                    <td><span class="pill-n">{{ $item['pct_n'] }}%</span></td>
                    <td>{{ $item['N'] }}</td>
                    <td>{{ $item['total'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- ─────────────────── 6. PLANO DE AÇÃO ─────────────────── --}}
    @if(isset($planoAcoes) && $planoAcoes->count() > 0)
    <div class="secao {{ count($scores['itens_criticos']) > 0 ? '' : 'quebra' }}">
        <div class="secao-titulo">{{ count($scores['itens_criticos']) > 0 ? 6 : 5 }}. Plano de Ação Corretiva e Preventiva</div>
        <p class="subtitulo-secao">
            Ações planejadas para eliminação ou controle dos riscos psicossociais identificados,
            com designação de responsáveis e prazos, conforme Art. 1.1.2 da NR-1.
        </p>
        <table class="plano">
            <thead>
                <tr>
                    <th style="width:4%;">#</th>
                    <th style="width:20%;">Risco Identificado</th>
                    <th style="width:22%;">Ação Proposta</th>
                    <th style="width:14%;">Responsável</th>
                    <th style="width:9%;">Setor</th>
                    <th style="width:8%;">Prazo</th>
                    <th style="width:7%;">Prior.</th>
                    <th style="width:8%;">Status</th>
                    <th style="width:8%;">Evidências</th>
                </tr>
            </thead>
            <tbody>
                @foreach($planoAcoes as $i => $acao)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $acao->risco_descricao }}</td>
                    <td>{{ $acao->acao }}</td>
                    <td>
                        {{ $acao->responsavel }}
                        @if($acao->responsavel_cargo)
                        <br><span style="color:#666;">{{ $acao->responsavel_cargo }}</span>
                        @endif
                    </td>
                    <td>{{ $acao->setor?->nome ?? '—' }}</td>
                    <td>{{ $acao->data_prevista ? \Carbon\Carbon::parse($acao->data_prevista)->format('d/m/Y') : '—' }}</td>
                    <td>
                        <span class="badge-prioridade prio-{{ $acao->prioridade }}">
                            {{ $acao->prioridade }}
                        </span>
                    </td>
                    <td>
                        <span class="badge-status status-{{ $acao->status }}">
                            {{ str_replace('_', ' ', $acao->status) }}
                        </span>
                    </td>
                    <td style="text-align:center;">
                        @php $qtd = $acao->anexos->count(); @endphp
                        @if($qtd > 0)
                            <span style="background:#dcfce7; color:#166534; padding:1px 6px; border-radius:8px; font-weight:700; font-size:8px;">
                                {{ $qtd }} anexo{{ $qtd > 1 ? 's' : '' }}
                            </span>
                        @else
                            <span style="color:#9ca3af;">—</span>
                        @endif
                    </td>
                </tr>
                @if($acao->anexos->count() > 0)
                <tr>
                    <td></td>
                    <td colspan="8" style="background:#f0f4fa; padding:6px 10px; font-size:8px;">
                        <strong style="color:#003366;">Evidências documentais:</strong>
                        @foreach($acao->anexos as $anexo)
                            <span style="display:inline-block; background:white; border:1px solid #cbd5e1; border-radius:4px; padding:1px 6px; margin:2px 4px 2px 0;">
                                {{ $anexo->nome_original }}
                                <span style="color:#6b7280;">({{ round($anexo->tamanho_bytes / 1024) }} KB)</span>
                            </span>
                        @endforeach
                    </td>
                </tr>
                @endif
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    {{-- ─────────────────── APROVAÇÃO ─────────────────── --}}
    @php
        $numAprovacao = 5
            + (count($scores['itens_criticos']) > 0 ? 1 : 0)
            + (isset($planoAcoes) && $planoAcoes->count() > 0 ? 1 : 0);
    @endphp
    <div class="secao quebra">
        <div class="secao-titulo">{{ $numAprovacao }}. Aprovação e Vigência do Documento</div>

        <div class="aprovacao-box">
            <div class="aprovacao-titulo">Termo de Aprovação Formal</div>
            <p style="font-size:9.5px; color:#1f2a37; margin-bottom:14px; line-height:1.7;">
                Este Programa de Gerenciamento de Riscos Psicossociais foi elaborado em conformidade com
                a NR-1 (Portaria MTE nº 1.419/2024) e aprovado pelo responsável abaixo identificado,
                comprometendo-se a empresa <strong>{{ $empresa->nome_fantasia }}</strong>
                @if($empresa->cnpj)
                (CNPJ {{ $empresa->cnpj }})
                @endif
                com a implementação das medidas de controle previstas no Plano de Ação.
            </p>

            @if($nr1->aprovado_por)
                <div class="assinatura-linha">
                    <div class="assinatura-campo" style="width: 100%;">
                        <div style="height:32px;"></div>
                        <div class="assinatura-linha-baixo">
                            {{ $nr1->aprovado_por }}
                        </div>
                        <div style="font-size:8px; color:#666; margin-top:3px;">
                            @if($nr1->aprovado_cargo){{ $nr1->aprovado_cargo }} · @endif
                            Responsável pelo PGR
                        </div>
                        <div style="font-size:8px; color:#666; margin-top:1px;">
                            Aprovado em {{ \Carbon\Carbon::parse($nr1->aprovado_em)->format('d/m/Y') }}
                        </div>
                    </div>
                </div>

                @if($nr1->proxima_avaliacao_em)
                <div style="margin-top:20px; padding:10px 14px; background:#003366; color:white; border-radius:6px; font-size:9.5px;">
                    <strong>Vigência:</strong> A próxima reavaliação deste PGR está prevista para
                    <strong>{{ \Carbon\Carbon::parse($nr1->proxima_avaliacao_em)->format('d/m/Y') }}</strong>,
                    conforme periodicidade exigida pela NR-1 ou sempre que houver alteração significativa
                    nas condições de trabalho.
                </div>
                @endif

            @else
                <p style="font-size:9px; color:#92400e; background:#fef3c7; padding:8px 12px; border-radius:6px; margin-bottom:18px;">
                    ⚠ Este documento ainda não possui aprovação formal registrada.
                    Para validade regulatória, complete a aprovação no painel administrativo.
                </p>

                <div class="assinatura-linha">
                    <div class="assinatura-campo">
                        <div style="height:50px;"></div>
                        <div style="border-top:1px solid #1f2a37; padding-top:5px; font-size:9px; color:#444;">
                            Nome / Cargo do Responsável
                        </div>
                    </div>
                    <div class="assinatura-campo">
                        <div style="height:50px;"></div>
                        <div style="border-top:1px solid #1f2a37; padding-top:5px; font-size:9px; color:#444;">
                            Data
                        </div>
                    </div>
                </div>
            @endif
        </div>
    </div>

</div>

{{-- Rodapé fixo --}}
<div class="rodape">
    <table style="width: 100%; border-collapse: collapse; border: none; margin: 0; padding: 0;">
        <tr>
            <td style="text-align: left; font-size: 7pt; color: #94a3b8; border: none; padding: 0; font-family: 'DejaVu Sans', Arial, sans-serif;">
                Sinal RH · Sara Linhar Consultoria · PGR/NR-1 · Portaria MTE 1.419/2024 · Confidencial
            </td>
            <td style="text-align: right; font-size: 7pt; color: #94a3b8; border: none; padding: 0; font-family: 'DejaVu Sans', Arial, sans-serif;">
                {{ $empresa->nome_fantasia }} · Código {{ $nr1->codigo }} · v{{ $nr1->versao ?? '1.0' }} · {{ now()->format('d/m/Y') }}
            </td>
        </tr>
    </table>
</div>

</body>
</html>
