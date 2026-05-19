<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>PGR — Avaliação de Riscos Psicossociais NR-1</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            color: #1f2a37;
            line-height: 1.6;
        }

        /* ── Capa ── */
        .capa {
            background: linear-gradient(135deg, #003366 0%, #002244 100%);
            color: white;
            padding: 60px 50px 50px;
            min-height: 760px;
            page-break-after: always;
        }

        .capa-logo { font-size: 18px; font-weight: 700; margin-bottom: 3px; }
        .capa-logo span { color: #e67e22; }
        .capa-sub { font-size: 8px; opacity: 0.6; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 50px; }
        .capa-badge {
            display: inline-block;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            padding: 4px 14px;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #e67e22;
            margin-bottom: 18px;
        }
        .capa-titulo { font-size: 26px; font-weight: 700; line-height: 1.25; margin-bottom: 10px; }
        .capa-empresa { font-size: 16px; opacity: 0.95; margin-bottom: 4px; }
        .capa-cnpj { font-size: 10px; opacity: 0.7; margin-bottom: 30px; }

        .capa-info-box {
            background: rgba(255,255,255,0.08);
            border-left: 3px solid #e67e22;
            border-radius: 4px;
            padding: 14px 18px;
            margin-bottom: 14px;
        }
        .capa-info-box p { font-size: 9px; line-height: 1.7; margin: 0; }
        .capa-info-box .label { opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; font-size: 7px; }
        .capa-info-box .valor { font-size: 11px; font-weight: 600; margin-top: 2px; }

        .capa-rodape {
            position: absolute;
            bottom: 60px;
            left: 50px;
            right: 50px;
            font-size: 8px;
            opacity: 0.5;
            border-top: 1px solid rgba(255,255,255,0.2);
            padding-top: 10px;
        }

        /* ── Conteúdo ── */
        .conteudo { padding: 40px 50px 60px; }

        .secao { margin-bottom: 28px; page-break-inside: avoid; }

        .secao-titulo {
            font-size: 13px;
            font-weight: 700;
            color: #003366;
            border-bottom: 2px solid #003366;
            padding-bottom: 6px;
            margin-bottom: 14px;
        }

        .subtitulo-secao {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 12px;
            font-style: italic;
        }

        /* ── Sumário ── */
        .sumario {
            list-style: none;
            padding: 0;
        }
        .sumario li {
            display: table;
            width: 100%;
            padding: 8px 0;
            border-bottom: 1px dotted #cbd5e1;
            font-size: 11px;
        }
        .sumario li .titulo {
            display: table-cell;
            width: 85%;
            color: #1f2a37;
        }
        .sumario li .num {
            font-weight: 700;
            color: #003366;
            margin-right: 8px;
        }
        .sumario li .pagina {
            display: table-cell;
            text-align: right;
            color: #6b7280;
            font-size: 10px;
        }

        /* ── Identificação ── */
        .ident-tabela {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }
        .ident-tabela td { padding: 7px 12px; border-bottom: 1px solid #e2e6ec; }
        .ident-tabela td.label { background: #f8fafc; color: #6b7280; font-weight: 600; width: 35%; text-transform: uppercase; letter-spacing: 0.5px; font-size: 8px; }
        .ident-tabela td.valor { color: #1f2a37; font-weight: 500; }

        /* ── Score geral ── */
        .score-geral {
            display: table;
            width: 100%;
            margin-bottom: 22px;
        }

        .score-box {
            display: table-cell;
            text-align: center;
            background: #f0f4fa;
            border-radius: 10px;
            padding: 18px 10px;
            width: 25%;
        }

        .score-box + .score-box { border-left: 6px solid white; }

        .score-num { font-size: 28px; font-weight: 700; color: #003366; }
        .score-num.verde   { color: #27ae60; }
        .score-num.amarelo { color: #f39c12; }
        .score-num.vermelho { color: #e74c3c; }
        .score-label { font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }

        /* ── Tabela por seção ── */
        table.secoes {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        table.secoes thead tr { background: #003366; color: white; }
        table.secoes th { padding: 8px 10px; text-align: left; font-weight: 600; }
        table.secoes td { padding: 8px 10px; border-bottom: 1px solid #e2e6ec; vertical-align: middle; }
        table.secoes tbody tr:nth-child(even) { background: #f8fafc; }

        .barra-container { background: #e2e6ec; border-radius: 4px; height: 8px; width: 80px; display: inline-block; vertical-align: middle; }
        .barra-fill { height: 100%; border-radius: 4px; }
        .barra-verde    { background: #27ae60; }
        .barra-amarelo  { background: #f39c12; }
        .barra-vermelho { background: #e74c3c; }

        /* ── Plano de ação ── */
        table.plano {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }

        table.plano thead tr { background: #003366; color: white; }
        table.plano th { padding: 6px 8px; text-align: left; font-weight: 600; font-size: 8px; }
        table.plano td { padding: 6px 8px; border-bottom: 1px solid #e2e6ec; vertical-align: top; }
        table.plano tbody tr:nth-child(even) { background: #f8fafc; }

        .badge-status {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 8px;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-planejada   { background: #e0e7ff; color: #3730a3; }
        .status-em_andamento { background: #fef3c7; color: #92400e; }
        .status-concluida   { background: #dcfce7; color: #166534; }
        .status-cancelada   { background: #f3f4f6; color: #6b7280; }

        /* ── Aprovação ── */
        .aprovacao-box {
            border: 2px solid #003366;
            border-radius: 10px;
            padding: 22px 24px;
            margin-top: 10px;
            background: #f8fafc;
        }

        .aprovacao-titulo {
            font-size: 11px;
            font-weight: 700;
            color: #003366;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        .assinatura-linha {
            display: table;
            width: 100%;
            margin-top: 18px;
        }

        .assinatura-campo {
            display: table-cell;
            padding-right: 24px;
            vertical-align: bottom;
            width: 50%;
        }

        .assinatura-linha-baixo {
            border-top: 1px solid #1f2a37;
            padding-top: 5px;
            font-size: 9px;
            color: #1f2a37;
            font-weight: 600;
        }

        /* ── Metodologia ── */
        .metodologia {
            font-size: 9.5px;
            line-height: 1.8;
            color: #444;
        }

        .metodologia p { margin-bottom: 8px; }
        .metodologia strong { color: #003366; }

        /* ── Caixa de aviso ── */
        .caixa-info {
            background: #f0f4fa;
            border-left: 4px solid #003366;
            border-radius: 0 6px 6px 0;
            padding: 12px 16px;
            margin-bottom: 14px;
            font-size: 9px;
            line-height: 1.6;
        }

        .caixa-versao {
            background: #fef3c7;
            border-left: 4px solid #e67e22;
            border-radius: 0 6px 6px 0;
            padding: 10px 14px;
            font-size: 9px;
            color: #78350f;
            margin-bottom: 14px;
        }

        /* ── Rodapé fixo ── */
        .rodape {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #f8fafc;
            border-top: 1px solid #e2e6ec;
            padding: 6px 50px;
            font-size: 8px;
            color: #9ca3af;
            display: table;
            width: 100%;
        }
        .rodape-esq { display: table-cell; text-align: left; }
        .rodape-dir { display: table-cell; text-align: right; }

        .quebra { page-break-before: always; }

        .badge-nivel {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .nivel-alto    { background: #fee2e2; color: #b91c1c; }
        .nivel-medio   { background: #fef3c7; color: #92400e; }
        .nivel-baixo   { background: #dcfce7; color: #166534; }

        .badge-prioridade {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 6px;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .prio-alta  { background: #fee2e2; color: #b91c1c; }
        .prio-media { background: #fef3c7; color: #92400e; }
        .prio-baixa { background: #dcfce7; color: #166534; }

        .pill-s { display: inline-block; background: #dcfce7; color: #166534; padding: 1px 6px; border-radius: 8px; font-weight: 700; font-size: 9px; }
        .pill-p { display: inline-block; background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 8px; font-weight: 700; font-size: 9px; }
        .pill-n { display: inline-block; background: #fee2e2; color: #b91c1c; padding: 1px 6px; border-radius: 8px; font-weight: 700; font-size: 9px; }
    </style>
</head>
<body>

{{-- ─────────────────────── CAPA ─────────────────────── --}}
<div class="capa">
    <div class="capa-logo">Radar<span>Pessoas</span></div>
    <div class="capa-sub">by Sara Linhar Consultoria</div>

    <div class="capa-badge">PGR · NR-1 · Portaria MTE 1.419/2024</div>
    <div class="capa-titulo">Programa de Gerenciamento de<br>Riscos Psicossociais</div>

    <div class="capa-empresa">{{ $empresa->nome_fantasia }}</div>
    @if($empresa->cnpj)
    <div class="capa-cnpj">CNPJ: {{ $empresa->cnpj }}</div>
    @endif

    <div class="capa-info-box">
        <p class="label">Documento</p>
        <p class="valor">{{ $nr1->titulo }}</p>
    </div>

    <div class="capa-info-box">
        <p class="label">Versão · Código · Data de Aplicação</p>
        <p class="valor">
            v{{ $nr1->versao ?? '1.0' }}
             · {{ $nr1->codigo }}
            @if($nr1->aplicada_em)
             · {{ \Carbon\Carbon::parse($nr1->aplicada_em)->format('d/m/Y') }}
            @endif
        </p>
    </div>

    @if($nr1->aprovado_por)
    <div class="capa-info-box">
        <p class="label">Aprovação</p>
        <p class="valor">
            {{ $nr1->aprovado_por }}
            @if($nr1->aprovado_cargo) — {{ $nr1->aprovado_cargo }} @endif
            <br>
            <span style="font-size:9px; opacity:0.7;">em {{ \Carbon\Carbon::parse($nr1->aprovado_em)->format('d/m/Y') }}</span>
        </p>
    </div>
    @endif

    <div class="capa-rodape">
        Documento gerado em {{ now()->format('d/m/Y \à\s H:i') }} ·
        Confidencial · Uso interno e regulatório (MTE)
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
                <td class="label">Total de Colaboradores Ativos</td>
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
                <strong>Instrumento de avaliação.</strong> Checklist anônimo estruturado em 7 dimensões
                psicossociais alinhadas à norma ISO 45003:2021 (Saúde e segurança ocupacional — Diretrizes
                para gestão de riscos psicossociais): (1) Demandas do Trabalho, (2) Autonomia e Controle,
                (3) Clareza de Papel e Expectativas, (4) Relacionamentos no Ambiente de Trabalho,
                (5) Reconhecimento e Reforço Positivo, (6) Segurança Psicológica e
                (7) Condições Organizacionais.
            </p>
            <p>
                <strong>Escala de respostas.</strong> Cada item é avaliado em escala trifásica
                — S (Satisfatório), P (Parcialmente Satisfatório), N (Não Satisfatório).
                O score percentual de cada dimensão é calculado como (S + P×0,5) / total × 100,
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
                Não Satisfatório (N) são automaticamente classificados como riscos psicossociais
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
            <div class="score-box">
                <div class="score-num {{ $scoreClass }}">
                    {{ $scoreGeral !== null ? $scoreGeral . '%' : 'N/D' }}
                </div>
                <div class="score-label">Score Geral PGR</div>
            </div>
            <div class="score-box">
                <div class="score-num">{{ $scores['total_respondentes'] }}</div>
                <div class="score-label">Respondentes</div>
            </div>
            <div class="score-box">
                <div class="score-num" style="color:#27ae60;">{{ $totalS }}</div>
                <div class="score-label">Satisfatório (S)</div>
            </div>
            <div class="score-box">
                <div class="score-num" style="color:#e74c3c;">{{ $totalN }}</div>
                <div class="score-label">Não satisfatório (N)</div>
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
        <p class="subtitulo-secao">Score percentual e nível de risco para cada uma das 7 dimensões avaliadas.</p>
        <table class="secoes">
            <thead>
                <tr>
                    <th style="width:38%;">Dimensão</th>
                    <th style="width:12%;">Score</th>
                    <th style="width:18%;">Nível de Risco</th>
                    <th style="width:18%;">Resultado</th>
                    <th style="width:7%;">S</th>
                    <th style="width:7%;">N</th>
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
            Itens com 30% ou mais de respostas Não Satisfatório (N), classificados como riscos prioritários
            para o Programa de Gerenciamento de Riscos (PGR) nos termos da Portaria MTE 1.419/2024.
        </p>
        <table class="secoes">
            <thead>
                <tr>
                    <th style="width:8%;">#</th>
                    <th style="width:42%;">Fator de Risco Identificado</th>
                    <th style="width:13%;">Dimensão</th>
                    <th style="width:13%;">% Não Sat.</th>
                    <th style="width:12%;">Total N</th>
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
                    <div class="assinatura-campo">
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
                    <div class="assinatura-campo">
                        <div style="height:32px;"></div>
                        <div class="assinatura-linha-baixo">
                            Sara Linhar Consultoria
                        </div>
                        <div style="font-size:8px; color:#666; margin-top:3px;">
                            Consultora Técnica em Saúde e Segurança Ocupacional
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
    <div class="rodape-esq">
        Radar Pessoas · Sara Linhar Consultoria · PGR/NR-1 · Portaria MTE 1.419/2024 · Documento confidencial
    </div>
    <div class="rodape-dir">
        {{ $empresa->nome_fantasia }} · Código {{ $nr1->codigo }} · v{{ $nr1->versao ?? '1.0' }} · {{ now()->format('d/m/Y') }}
    </div>
</div>

</body>
</html>
