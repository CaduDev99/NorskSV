const tabPlanejar = document.getElementById('tabPlanejar');
const tabComprar = document.getElementById('tabComprar');
const secaoPlanejar = document.getElementById('secaoPlanejar');
const secaoComprar = document.getElementById('secaoComprar');

const formPlanejar = document.getElementById('formPlanejar');
const formExtra = document.getElementById('formExtra');
const modalFinalizar = document.getElementById('modalFinalizar');
const inputValorCaixa = document.getElementById('inputValorCaixa');
const resultadoDiferenca = document.getElementById('resultadoDiferenca');
const importListaFile = document.getElementById('importListaFile');

let modoModalAtual = 'compra';

tabPlanejar.addEventListener('click', function() {
    tabPlanejar.classList.add('active');
    tabComprar.classList.remove('active');
    secaoPlanejar.style.display = 'block';
    secaoComprar.style.display = 'none';
    renderizarTudo();
});

tabComprar.addEventListener('click', function() {
    tabComprar.classList.add('active');
    tabPlanejar.classList.remove('active');
    secaoComprar.style.display = 'block';
    secaoPlanejar.style.display = 'none';
    renderizarTudo();
});

document.getElementById('btnSalvarListaPlanejada').addEventListener('click', function() {
    if (listaCompras.length === 0) return alert('Adicione itens antes de salvar.');
    modoModalAtual = 'planejamento';
    document.getElementById('modalTitulo').textContent = '💾 Salvar Lista Planejada';
    document.getElementById('modalValorLista').textContent = listaCompras.length + ' item(ns)';
    document.getElementById('blocoConferenciaCaixa').style.display = 'none';
    modalFinalizar.style.display = 'flex';
});

document.getElementById('btnFinalizarCompra').addEventListener('click', function() {
    const resumo = calcularResumoCarrinho();
    if (resumo.pegosCount === 0) return alert('Marque ao menos um item como Peguei.');
    modoModalAtual = 'compra';
    document.getElementById('modalTitulo').textContent = '✅ Conferência de Caixa';
    document.getElementById('modalValorLista').textContent = formatarMoeda(resumo.valorTotal);
    document.getElementById('blocoConferenciaCaixa').style.display = 'block';
    inputValorCaixa.value = '';
    resultadoDiferenca.className = 'diff-box';
    resultadoDiferenca.textContent = 'Digite o valor pago no caixa para conferir.';
    modalFinalizar.style.display = 'flex';
});

inputValorCaixa.addEventListener('input', function() {
    const resumo = calcularResumoCarrinho();
    const valorCaixa = parseFloat(inputValorCaixa.value);
    if (isNaN(valorCaixa) || inputValorCaixa.value === '') {
        resultadoDiferenca.className = 'diff-box';
        resultadoDiferenca.textContent = 'Digite o valor pago no caixa para conferir.';
        return;
    }
    const dif = valorCaixa - resumo.valorTotal;
    if (Math.abs(dif) < 0.01) {
        resultadoDiferenca.className = 'diff-box diff-ok';
        resultadoDiferenca.textContent = '🎯 Bateu exato com o valor da sua lista!';
    } else if (dif > 0) {
        resultadoDiferenca.className = 'diff-box diff-alert';
        resultadoDiferenca.textContent = '⚠️ Caixa cobrou ' + formatarMoeda(dif) + ' A MAIS.';
    } else {
        resultadoDiferenca.className = 'diff-box diff-alert';
        resultadoDiferenca.textContent = 'ℹ️ Caixa cobrou ' + formatarMoeda(Math.abs(dif)) + ' A MENOS.';
    }
});

document.getElementById('btnFecharModal').addEventListener('click', function() { modalFinalizar.style.display = 'none'; });
document.getElementById('btnGerarPdfCompra').addEventListener('click', function() {
    gerarPdfMercado(modoModalAtual === 'compra', inputValorCaixa.value);
});
document.getElementById('btnBaixarJsonCompra').addEventListener('click', exportarBackupMercado);
document.getElementById('btnRestaurarLista').addEventListener('click', function() { importListaFile.click(); });
importListaFile.addEventListener('change', function(e) { importarBackupMercado(e, renderizarTudo); });

document.getElementById('btnPuxarEstoque').addEventListener('click', function() {
    if (puxarFaltantesDoEstoque()) renderizarTudo();
});

document.getElementById('btnLimparLista').addEventListener('click', function() {
    if (listaCompras.length > 0 && confirm('Apagar toda a lista de mercado?')) {
        listaCompras = [];
        salvarDadosMercado();
        renderizarTudo();
    }
});
formPlanejar.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('planNome').value.trim();
    if (!nome) return;

    listaCompras.push({
        id: Date.now(),
        nome: nome,
        marca: document.getElementById('planMarca').value.trim(),
        qtd: parseFloat(document.getElementById('planQtd').value) || 1,
        unidade: document.getElementById('planUnidade').value,
        preco: 0,
        status: 'pendente',
        extra: false
    });

    salvarDadosMercado();
    renderizarTudo();
    formPlanejar.reset();
    document.getElementById('planQtd').value = 1;
    document.getElementById('planUnidade').value = 'un';
});

formExtra.addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('extraNome').value.trim();
    if (!nome) return;

    listaCompras.push({
        id: Date.now(),
        nome: nome,
        marca: document.getElementById('extraMarca').value.trim(),
        qtd: parseFloat(document.getElementById('extraQtd').value) || 1,
        unidade: document.getElementById('extraUnidade').value,
        preco: parseFloat(document.getElementById('extraPreco').value) || 0,
        status: 'pego',
        extra: true
    });

    salvarDadosMercado();
    renderizarTudo();
    formExtra.reset();
    document.getElementById('extraQtd').value = 1;
    document.getElementById('extraUnidade').value = 'un';
});

function definirStatus(id, novoStatus) {
    const item = listaCompras.find(function(i) { return i.id === id; });
    if (item) {
        item.status = (item.status === novoStatus) ? 'pendente' : novoStatus;
        salvarDadosMercado();
        renderizarTudo();
    }
}

function atualizarCampo(id, campo, valor) {
    const item = listaCompras.find(function(i) { return i.id === id; });
    if (item) {
        if (campo === 'marca') item.marca = valor;
        if (campo === 'unidade') item.unidade = valor;
        if (campo === 'qtd') item.qtd = Math.max(0.1, parseFloat(valor) || 1);
        if (campo === 'preco') {
            item.preco = Math.max(0, parseFloat(valor) || 0);
            if (item.preco > 0 && item.status === 'pendente') {
                item.status = 'pego';
                salvarDadosMercado();
                renderizarTudo();
                return;
            }
        }
        salvarDadosMercado();
        atualizarBarraResumo();
    }
}

function removerItem(id) {
    listaCompras = listaCompras.filter(function(i) { return i.id !== id; });
    salvarDadosMercado();
    renderizarTudo();
}

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
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top: 16px;">Nenhum item na lista ainda.</p>';
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
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top: 16px;">Sua lista está vazia.</p>';
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

renderizarTudo();
