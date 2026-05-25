<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Clima — {{ $relatorio->empresa->nome_fantasia }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 11px;
            color: #1f2a37;
            line-height: 1.6;
        }

        /* ── Capa ── */
        .capa {
            background: linear-gradient(135deg, #003366 0%, #002244 100%);
            color: white;
            padding: 60px 50px;
            min-height: 280px;
        }

        .capa-logo {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .capa-logo span { color: #e67e22; }

        .capa-subtitulo {
            font-size: 9px;
            opacity: 0.7;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 40px;
        }

        .capa-titulo {
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .capa-empresa {
            font-size: 16px;
            opacity: 0.85;
            margin-bottom: 4px;
        }

        .capa-periodo {
            font-size: 12px;
            color: #e67e22;
            font-weight: 600;
            margin-bottom: 30px;
        }

        .capa-meta {
            font-size: 9px;
            opacity: 0.6;
            margin-top: 20px;
        }

        /* ── Layout ── */
        .conteudo {
            padding: 40px 50px;
        }

        .secao {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .secao-titulo {
            font-size: 14px;
            font-weight: 700;
            color: #003366;
            border-bottom: 2px solid #003366;
            padding-bottom: 6px;
            margin-bottom: 14px;
        }

        /* ── Badges ── */
        .badge-ia {
            display: inline-block;
            background: #e67e22;
            color: white;
            font-size: 8px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 10px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            vertical-align: middle;
            margin-left: 8px;
        }

        /* ── KPIs ── */
        .kpis {
            display: table;
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin-bottom: 20px;
        }

        .kpi {
            display: table-cell;
            background: #f0f4fa;
            border-radius: 8px;
            padding: 14px;
            text-align: center;
            width: 25%;
        }

        .kpi-valor {
            font-size: 24px;
            font-weight: 700;
            color: #003366;
            display: block;
        }

        .kpi-label {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ── Texto ── */
        .resumo-texto {
            color: #374151;
            font-size: 11px;
            line-height: 1.8;
            text-align: justify;
        }

        /* ── Listas ── */
        .lista-card {
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 10px;
        }

        .lista-card.positivo { background: #f0fdf4; border-left: 4px solid #27ae60; }
        .lista-card.atencao  { background: #fff7ed; border-left: 4px solid #e67e22; }

        .lista-card ul { padding-left: 16px; margin: 0; }
        .lista-card li { margin-bottom: 6px; font-size: 11px; color: #374151; }

        /* ── Recomendações ── */
        .recomendacao {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }

        .rec-num {
            display: table-cell;
            width: 28px;
            background: #003366;
            color: white;
            font-weight: 700;
            font-size: 12px;
            text-align: center;
            border-radius: 50%;
            vertical-align: middle;
            padding: 4px;
        }

        .rec-texto {
            display: table-cell;
            padding-left: 12px;
            vertical-align: middle;
            font-size: 11px;
            color: #1f2a37;
        }

        /* ── Plano de Ação ── */
        table.plano {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
        }

        table.plano thead tr {
            background: #003366;
            color: white;
        }

        table.plano th {
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
        }

        table.plano td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e6ec;
            vertical-align: top;
        }

        table.plano tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        .td-prazo {
            white-space: nowrap;
            color: #e67e22;
            font-weight: 600;
        }

        /* ── Rodapé ── */
        .rodape {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #f8fafc;
            border-top: 1px solid #e2e6ec;
            padding: 8px 50px;
            font-size: 8px;
            color: #9ca3af;
            display: table;
            width: 100%;
        }

        .rodape-esq { display: table-cell; text-align: left; }
        .rodape-dir { display: table-cell; text-align: right; }

        /* ── Page break ── */
        .quebra { page-break-before: always; }
    </style>
</head>
<body>

    {{-- Capa --}}
    <div class="capa">
        <div class="capa-logo">Sinal<span>RH</span></div>
        <div class="capa-subtitulo">by Sara Linhar Consultoria</div>

        <div class="capa-titulo">Relatório Executivo de<br>Clima Organizacional</div>
        <div class="capa-empresa">{{ $relatorio->empresa->nome_fantasia }}</div>
        <div class="capa-periodo">Período: {{ $relatorio->periodo }}</div>

        <div class="capa-meta">
            Gerado em {{ now()->format('d/m/Y \à\s H:i') }} &nbsp;·&nbsp;
            Tipo: {{ ucfirst($relatorio->tipo) }} &nbsp;·&nbsp;
            Gerado com IA GPT-4o-mini
        </div>
    </div>

    <div class="conteudo">

        {{-- KPIs --}}
        <div class="secao">
            <div class="secao-titulo">Indicadores do Período</div>
            <div class="kpis">
                <div class="kpi">
                    <span class="kpi-valor">{{ $empresa->colaboradores()->where('status', 'ativo')->count() }}</span>
                    <span class="kpi-label">Colaboradores</span>
                </div>
                <div class="kpi">
                    <span class="kpi-valor">{{ $empresa->setores()->count() }}</span>
                    <span class="kpi-label">Setores</span>
                </div>
                <div class="kpi">
                    <span class="kpi-valor">{{ $mediaClima ?? '--' }}/100</span>
                    <span class="kpi-label">Índice de Clima</span>
                </div>
                <div class="kpi">
                    <span class="kpi-valor">{{ $totalCheckins ?? 0 }}</span>
                    <span class="kpi-label">Check-ins</span>
                </div>
            </div>
        </div>

        {{-- Resumo Executivo --}}
        <div class="secao">
            <div class="secao-titulo">
                Resumo Executivo
                <span class="badge-ia">IA</span>
            </div>
            @foreach(explode("\n\n", $relatorio->resumo_executivo) as $paragrafo)
                <p class="resumo-texto" style="margin-bottom: 10px;">{{ trim($paragrafo) }}</p>
            @endforeach
        </div>

        {{-- Pontos Positivos e de Atenção --}}
        <div class="secao" style="display: table; width: 100%;">
            <div style="display: table-cell; width: 48%; vertical-align: top; padding-right: 10px;">
                <div class="secao-titulo">Pontos Positivos</div>
                <div class="lista-card positivo">
                    <ul>
                        @foreach($relatorio->pontos_positivos as $ponto)
                            <li>{{ $ponto }}</li>
                        @endforeach
                    </ul>
                </div>
            </div>
            <div style="display: table-cell; width: 48%; vertical-align: top; padding-left: 10px;">
                <div class="secao-titulo">Pontos de Atenção</div>
                <div class="lista-card atencao">
                    <ul>
                        @foreach($relatorio->pontos_atencao as $ponto)
                            <li>{{ $ponto }}</li>
                        @endforeach
                    </ul>
                </div>
            </div>
        </div>

        {{-- Recomendações --}}
        <div class="secao quebra">
            <div class="secao-titulo">Recomendações</div>
            @foreach($relatorio->recomendacoes as $i => $rec)
                <div class="recomendacao">
                    <div class="rec-num">{{ $i + 1 }}</div>
                    <div class="rec-texto">{{ $rec }}</div>
                </div>
            @endforeach
        </div>

        {{-- Plano de Ação --}}
        <div class="secao">
            <div class="secao-titulo">Plano de Ação</div>
            <table class="plano">
                <thead>
                    <tr>
                        <th style="width: 15%;">Prazo</th>
                        <th style="width: 55%;">Ação</th>
                        <th style="width: 30%;">Responsável</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($relatorio->plano_acao as $acao)
                        <tr>
                            <td class="td-prazo">{{ $acao['prazo'] }}</td>
                            <td>{{ $acao['acao'] }}</td>
                            <td>{{ $acao['responsavel'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

    </div>

    {{-- Rodapé --}}
    <div class="rodape">
        <div class="rodape-esq">
            Sinal RH — Sara Linhar Consultoria &nbsp;·&nbsp; Confidencial
        </div>
        <div class="rodape-dir">
            {{ $relatorio->empresa->nome_fantasia }} &nbsp;·&nbsp; {{ $relatorio->periodo }} &nbsp;·&nbsp;
            Gerado em {{ now()->format('d/m/Y') }}
        </div>
    </div>

</body>
</html>
