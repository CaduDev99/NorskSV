function atualizarBarraResumo() {
    const resumo = calcularResumoCarrinho();
    document.getElementById('resumoProgresso').textContent = resumo.pegosCount + ' de ' + resumo.totalCount;
    document.getElementById('resumoTotal').textContent = formatarMoeda(resumo.valorTotal);
}

function renderizarTudo() {
    renderizarPlanejamento();
    renderizarCorredor();
    atualizarBarraResumo();
}

function renderizarPlanejamento() {
    const container = document.getElementById('listaPlanejamento');
    document.getElementById('qtdPlanejados').textContent = listaCompras.length;
    container.innerHTML = '';

    if (listaCompras.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top: 16px;">Nenhum item na lista ainda. Adicione acima ou puxe do estoque.</p>';
        return;
    }

    listaCompras.forEach(function(item) {
        const unidade = item.unidade || 'un';
        const marcaTexto = item.marca ? ' • Marca: ' + item.marca : '';
        const div = document.createElement('div');
        div.className = 'plan-item';
        div.innerHTML = 
            '<div class="plan-item-info">' +
                '<strong>' + item.nome + '</strong>' +
                '<span>Quantidade: ' + item.qtd + ' ' + unidade + marcaTexto + '</span>' +
            '</div>' +
            '<button type="button" class="btn-delete" onclick="removerItem(' + item.id + ')" title="Remover">🗑️</button>';
        container.appendChild(div);
    });
}

function renderizarCorredor() {
    const container = document.getElementById('listaCorredor');
    container.innerHTML = '';

    if (listaCompras.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top: 16px;">Sua lista está vazia. Use o campo abaixo para adicionar itens extras.</p>';
        return;
    }

    const ordem = { 'pendente': 1, 'pego': 2, 'faltou': 3 };
    const ordenada = [...listaCompras].sort(function(a, b) {
        return (ordem[a.status] || 1) - (ordem[b.status] || 1);
    });

    ordenada.forEach(function(item) {
        const unidadeAtual = item.unidade || 'un';
        const classeStatus = item.status === 'pego' ? 'status-pego' : (item.status === 'faltou' ? 'status-faltou' : '');
        const badgeExtra = item.extra ? '<span class="badge-extra">Extra</span>' : '';

        const unidadesOpcoes = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx'].map(function(u) {
            return '<option value="' + u + '" ' + (unidadeAtual === u ? 'selected' : '') + '>' + u + '</option>';
        }).join('');

        const card = document.createElement('div');
        card.className = 'shop-card ' + classeStatus;
        card.innerHTML = 
            '<div class="shop-top">' +
                '<div class="shop-title">' + item.nome + badgeExtra + '</div>' +
                '<div class="shop-actions">' +
                    '<button type="button" class="btn-status ' + (item.status === 'pego' ? 'active-pego' : '') + '" onclick="definirStatus(' + item.id + ', \'pego\')">✅ Peguei</button>' +
                    '<button type="button" class="btn-status ' + (item.status === 'faltou' ? 'active-faltou' : '') + '" onclick="definirStatus(' + item.id + ', \'faltou\')">❌ Não tinha</button>' +
                '</div>' +
            '</div>' +
            '<div class="shop-inputs">' +
                '<div class="field">' +
                    '<label>Marca</label>' +
                    '<input type="text" value="' + (item.marca || '') + '" placeholder="Ex: Tio João" onchange="atualizarCampo(' + item.id + ', \'marca\', this.value)">' +
                '</div>' +
                '<div class="field">' +
                    '<label>Qtd / Unid.</label>' +
                    '<div class="qtd-unidade-group">' +
                        '<input type="number" value="' + item.qtd + '" min="0.1" step="any" onchange="atualizarCampo(' + item.id + ', \'qtd\', this.value)">' +
                        '<select onchange="atualizarCampo(' + item.id + ', \'unidade\', this.value)">' + unidadesOpcoes + '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="field">' +
                    '<label>Preço Unit. (R$)</label>' +
                    '<input type="number" value="' + (item.preco || '') + '" placeholder="0,00" min="0" step="0.01" onchange="atualizarCampo(' + item.id + ', \'preco\', this.value)">' +
                '</div>' +
            '</div>';
        container.appendChild(card);
    });
}
