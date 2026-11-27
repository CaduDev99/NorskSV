const formConta = document.getElementById('formConta');
const filtroMes = document.getElementById('filtroMes');
const filtroStatusConta = document.getElementById('filtroStatusConta');
const importContasFile = document.getElementById('importContasFile');

formConta.addEventListener('submit', function(e) {
    e.preventDefault();
    listaContas.push({
        id: Date.now(),
        nome: document.getElementById('contaNome').value.trim(),
        categoria: document.getElementById('contaCategoria').value,
        valor: parseFloat(document.getElementById('contaValor').value),
        vencimento: document.getElementById('contaVencimento').value,
        recorrente: document.getElementById('contaRecorrente').value === 'fixa',
        paga: false
    });
    salvarContas();
    atualizarFiltroMeses();
    renderizarContas();
    formConta.reset();
});

filtroMes.addEventListener('change', renderizarContas);
filtroStatusConta.addEventListener('change', renderizarContas);
document.getElementById('btnPdfContas').addEventListener('click', function() { gerarPdfContas(obterContasFiltradas()); });
document.getElementById('btnExportarContas').addEventListener('click', exportarBackupContas);
document.getElementById('btnImportarContas').addEventListener('click', function() { importContasFile.click(); });
importContasFile.addEventListener('change', function(e) {
    importarBackupContas(e, function() {
        atualizarFiltroMeses();
        renderizarContas();
    });
});

function alternarPagamento(id) {
    const conta = listaContas.find(function(c) { return c.id === id; });
    if (!conta) return;

    conta.paga = !conta.paga;

    if (conta.paga && conta.recorrente && !conta.proximaGerada) {
        if (confirm('Conta fixa paga! Deseja lançar automaticamente a fatura do próximo mês?')) {
            conta.proximaGerada = true;
            listaContas.push({
                id: Date.now() + 1,
                nome: conta.nome,
                categoria: conta.categoria,
                valor: conta.valor,
                vencimento: avancarUmMes(conta.vencimento),
                recorrente: true,
                paga: false
            });
        }
    }
    salvarContas();
    atualizarFiltroMeses();
    renderizarContas();
}

function removerConta(id) {
    if (confirm('Excluir esta conta?')) {
        listaContas = listaContas.filter(function(c) { return c.id !== id; });
        salvarContas();
        atualizarFiltroMeses();
        renderizarContas();
    }
}

function atualizarFiltroMeses() {
    const valorAtual = filtroMes.value;
    const meses = new Set();
    listaContas.forEach(function(c) {
        if (c.vencimento) meses.add(c.vencimento.substring(0, 7));
    });

    filtroMes.innerHTML = '<option value="Todos">Todos os meses</option>';
    Array.from(meses).sort().forEach(function(ym) {
        const p = ym.split('-');
        const opt = document.createElement('option');
        opt.value = ym;
        opt.textContent = p[1] + '/' + p[0];
        filtroMes.appendChild(opt);
    });
    if (Array.from(meses).includes(valorAtual)) filtroMes.value = valorAtual;
}

function obterContasFiltradas() {
    const mesSel = filtroMes.value;
    const statusSel = filtroStatusConta.value;

    return listaContas.filter(function(c) {
        const bateMes = mesSel === 'Todos' || (c.vencimento && c.vencimento.startsWith(mesSel));
        const bateStatus = statusSel === 'Todos' || (statusSel === 'Pagas' && c.paga) || (statusSel === 'Pendentes' && !c.paga);
        return bateMes && bateStatus;
    }).sort(function(a, b) {
        return a.vencimento.localeCompare(b.vencimento);
    });
}

function renderizarContas() {
    const container = document.getElementById('listaContas');
    const filtradas = obterContasFiltradas();
    container.innerHTML = '';

    let total = 0, pago = 0, pendente = 0;
    filtradas.forEach(function(c) {
        total += c.valor;
        if (c.paga) pago += c.valor; else pendente += c.valor;
    });

    document.getElementById('totalGeral').textContent = formatarMoeda(total);
    document.getElementById('totalPago').textContent = formatarMoeda(pago);
    document.getElementById('totalPendente').textContent = formatarMoeda(pendente);

    if (filtradas.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);margin-top:20px;">Nenhuma conta encontrada.</p>';
        return;
    }

    filtradas.forEach(function(c) {
        const dias = diasAteVencimento(c.vencimento);
        let cardClass = '';
        let badge = '<span class="badge badge-ok">Em dia</span>';

        if (c.paga) {
            cardClass = 'status-paga';
            badge = '<span class="badge badge-ok">Paga</span>';
        } else if (dias < 0) {
            cardClass = 'status-atrasada';
            badge = '<span class="badge badge-late">Vencida há ' + Math.abs(dias) + 'd</span>';
        } else if (dias <= 5) {
            cardClass = 'status-alerta';
            badge = '<span class="badge badge-warn">Vence em ' + dias + 'd</span>';
        }

        const card = document.createElement('div');
        card.className = 'bill-card ' + cardClass;
        card.innerHTML =
            '<div class="bill-info">' +
                '<h3>' + c.nome + (c.recorrente ? ' 🔄' : '') + '</h3>' +
                '<div class="bill-meta">' +
                    '<span>📁 ' + c.categoria + '</span>' +
                    '<span>📅 Vence: <strong>' + formatarDataBR(c.vencimento) + '</strong></span>' +
                    badge +
                '</div>' +
            '</div>' +
            '<div class="bill-actions">' +
                '<span class="bill-value">' + formatarMoeda(c.valor) + '</span>' +
                '<button type="button" class="btn-pay ' + (c.paga ? 'paid' : '') + '" onclick="alternarPagamento(' + c.id + ')">' + (c.paga ? '✅ Paga' : 'Marcar Paga') + '</button>' +
                '<button type="button" class="btn-delete" onclick="removerConta(' + c.id + ')" title="Excluir">🗑️</button>' +
            '</div>';
        container.appendChild(card);
    });
}

atualizarFiltroMeses();
renderizarContas();
