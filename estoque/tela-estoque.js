const inputBusca = document.getElementById('busca');
const selectCategoria = document.getElementById('filtroCategoria');
const selectStatus = document.getElementById('filtroStatus');
const selectOrdenacao = document.getElementById('ordenacao');

inputBusca.addEventListener('keyup', renderizar);
selectCategoria.addEventListener('change', renderizar);
selectStatus.addEventListener('change', renderizar);
selectOrdenacao.addEventListener('change', renderizar);

function atualizarPainelResumo() {
    let totalKg = 0;
    let totalLitros = 0;
    let countRepor = 0;
    let countVencendo = 0;

    estoque.forEach(function(item) {
        const u = item.unidade || 'un';
        if (u === 'kg') totalKg += item.quantidade;
        if (u === 'g') totalKg += (item.quantidade / 1000);
        if (u === 'L') totalLitros += item.quantidade;
        if (u === 'ml') totalLitros += (item.quantidade / 1000);

        if (item.quantidade <= item.minimo) countRepor++;

        const dias = verificarValidade(item.dataValidade);
        if (dias !== null && dias <= 60) countVencendo++;
    });

    const kgFormatado = Math.round(totalKg * 100) / 100;
    const lFormatado = Math.round(totalLitros * 100) / 100;

    document.getElementById('resumoVolume').textContent = kgFormatado + ' kg • ' + lFormatado + ' L';
    document.getElementById('resumoRepor').textContent = countRepor + ' item(ns)';
    document.getElementById('resumoVencendo').textContent = countVencendo + ' item(ns)';
}

function obterItensFiltrados() {
    const termo = inputBusca.value.toLowerCase();
    const catFiltro = selectCategoria.value;
    const statusFiltro = selectStatus.value;
    const ordem = selectOrdenacao.value;

    const filtrados = estoque.filter(function(item) {
        const bateNome = item.nome.toLowerCase().includes(termo);
        const bateLocal = (item.local || '').toLowerCase().includes(termo);
        const bateCat = catFiltro === 'Todas' || item.categoria === catFiltro;
        
        const precisaComprar = item.quantidade <= item.minimo;
        const dias = verificarValidade(item.dataValidade);
        const pertoDeVencer = dias !== null && dias <= 60;

        let bateStatus = true;
        if (statusFiltro === 'Faltando') bateStatus = precisaComprar;
        if (statusFiltro === 'Vencendo') bateStatus = pertoDeVencer;

        return (bateNome || bateLocal) && bateCat && bateStatus;
    });

    return filtrados.sort(function(a, b) {
        if (ordem === 'nome') return a.nome.localeCompare(b.nome);
        if (ordem === 'validade') {
            if (!a.dataValidade) return 1;
            if (!b.dataValidade) return -1;
            return a.dataValidade.localeCompare(b.dataValidade);
        }
        if (ordem === 'antigo') {
            if (!a.dataArmazenamento) return 1;
            if (!b.dataArmazenamento) return -1;
            return a.dataArmazenamento.localeCompare(b.dataArmazenamento);
        }
        return b.id - a.id;
    });
}

function renderizar() {
    atualizarPainelResumo();
    const lista = document.getElementById('listaEstoque');
    const itensFiltrados = obterItensFiltrados();

    lista.innerHTML = '';

    if (itensFiltrados.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:var(--text-muted);margin-top:20px;">Nenhum item encontrado.</p>';
        return;
    }

    itensFiltrados.forEach(function(item) {
        const unidade = item.unidade || 'un';
        let statusClass = '';
        let badgeHtml = '<span class="badge badge-ok">Em dia</span>';

        if (item.quantidade === 0) {
            statusClass = 'out-of-stock';
            badgeHtml = '<span class="badge badge-out">Acabou!</span>';
        } else if (item.quantidade <= item.minimo) {
            statusClass = 'low-stock';
            badgeHtml = '<span class="badge badge-low">Estoque Baixo</span>';
        }

        const dias = verificarValidade(item.dataValidade);
        let validadeBadge = '';
        if (dias !== null) {
            if (dias < 0) {
                validadeBadge = '<span class="badge badge-out">Vencido há ' + Math.abs(dias) + 'd</span>';
                statusClass = 'out-of-stock';
            } else if (dias === 0) {
                validadeBadge = '<span class="badge badge-out">Vence hoje!</span>';
                statusClass = 'out-of-stock';
            } else if (dias <= 60) {
                validadeBadge = '<span class="badge badge-low">Vence em ' + dias + 'd</span>';
                if (statusClass === '') statusClass = 'low-stock';
            }
        }

        const localHtml = item.local ? '<span>📍 ' + item.local + '</span>' : '';
        let datasHtml = '';
        if (item.dataArmazenamento || item.dataValidade) {
            const txtArm = item.dataArmazenamento ? '<span>📦 Armazenado: <strong>' + formatarDataBR(item.dataArmazenamento) + '</strong></span>' : '';
            const txtVal = item.dataValidade ? '<span>⏳ Validade: <strong>' + formatarDataBR(item.dataValidade) + '</strong></span>' : '';
            datasHtml = '<div class="item-dates">' + txtArm + txtVal + '</div>';
        }

        const card = document.createElement('div');
        card.className = 'item-card ' + statusClass;
        card.innerHTML =
            '<div class="item-info">' +
                '<h3>' + item.nome + '</h3>' +
                '<div class="item-meta">' +
                    '<span>📁 ' + item.categoria + '</span>' +
                    localHtml +
                    '<span>⚠️ Mín: ' + item.minimo + ' ' + unidade + '</span>' +
                    badgeHtml +
                    validadeBadge +
                '</div>' +
                datasHtml +
            '</div>' +
            '<div class="item-controls">' +
                '<button type="button" class="qty-btn" onclick="alterarQuantidade(' + item.id + ', -1)">-</button>' +
                '<span class="qty-display">' + item.quantidade + ' ' + unidade + '</span>' +
                '<button type="button" class="qty-btn" onclick="alterarQuantidade(' + item.id + ', 1)">+</button>' +
                '<button type="button" class="btn-icon" onclick="iniciarEdicao(' + item.id + ')" title="Editar">✏️</button>' +
                '<button type="button" class="btn-icon" onclick="removerItem(' + item.id + ')" title="Excluir">🗑️</button>' +
            '</div>';
        lista.appendChild(card);
    });
}

renderizar();
