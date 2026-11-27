let estoque = JSON.parse(localStorage.getItem('meuEstoqueCasa')) || [];

const form = document.getElementById('itemForm');
const boxFormulario = document.getElementById('boxFormulario');
const avisoEdicao = document.getElementById('avisoEdicao');
const btnSubmitForm = document.getElementById('btnSubmitForm');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const inputEditId = document.getElementById('editId');

const inputBusca = document.getElementById('busca');
const selectCategoria = document.getElementById('filtroCategoria');
const selectStatus = document.getElementById('filtroStatus');
const selectOrdenacao = document.getElementById('ordenacao');
const importFile = document.getElementById('importFile');

form.addEventListener('submit', salvarItemForm);
btnCancelarEdicao.addEventListener('click', cancelarEdicao);
inputBusca.addEventListener('keyup', renderizar);
selectCategoria.addEventListener('change', renderizar);
selectStatus.addEventListener('change', renderizar);
selectOrdenacao.addEventListener('change', renderizar);

document.getElementById('btnPdf').addEventListener('click', function() { gerarPDF(obterItensFiltrados()); });
document.getElementById('btnExportar').addEventListener('click', exportarDados);
document.getElementById('btnImportar').addEventListener('click', function() { importFile.click(); });
importFile.addEventListener('change', importarDados);

function salvarNoNavegador() {
    localStorage.setItem('meuEstoqueCasa', JSON.stringify(estoque));
}

function formatarDataBR(dataStr) {
    if (!dataStr) return '-';
    const p = dataStr.split('-');
    if (p.length !== 3) return dataStr;
    return p.at(2) + '/' + p.at(1) + '/' + p.at(0);
}

function verificarValidade(dataValidadeStr) {
    if (!dataValidadeStr) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const p = dataValidadeStr.split('-');
    if (p.length !== 3) return null;
    const validade = new Date(Number(p.at(0)), Number(p.at(1)) - 1, Number(p.at(2)));
    validade.setHours(0, 0, 0, 0);
    return Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
}

function salvarItemForm(e) {
    e.preventDefault();
    const idEdicao = inputEditId.value;

    const dadosItem = {
        id: idEdicao ? Number(idEdicao) : Date.now(),
        nome: document.getElementById('nome').value.trim(),
        categoria: document.getElementById('categoria').value,
        local: document.getElementById('local').value.trim(),
        quantidade: parseFloat(document.getElementById('quantidade').value),
        unidade: document.getElementById('unidade').value,
        minimo: parseFloat(document.getElementById('minimo').value),
        dataArmazenamento: document.getElementById('dataArmazenamento').value,
        dataValidade: document.getElementById('dataValidade').value
    };

    if (idEdicao) {
        const index = estoque.findIndex(function(i) { return i.id === Number(idEdicao); });
        if (index !== -1) estoque[index] = dadosItem;
        cancelarEdicao();
    } else {
        estoque.push(dadosItem);
        form.reset();
    }

    salvarNoNavegador();
    renderizar();
}
function iniciarEdicao(id) {
    const item = estoque.find(function(i) { return i.id === id; });
    if (!item) return;

    inputEditId.value = item.id;
    document.getElementById('nome').value = item.nome;
    document.getElementById('categoria').value = item.categoria;
    document.getElementById('local').value = item.local || '';
    document.getElementById('quantidade').value = item.quantidade;
    document.getElementById('unidade').value = item.unidade || 'un';
    document.getElementById('minimo').value = item.minimo;
    document.getElementById('dataArmazenamento').value = item.dataArmazenamento || '';
    document.getElementById('dataValidade').value = item.dataValidade || '';

    boxFormulario.classList.add('editing-mode');
    avisoEdicao.style.display = 'flex';
    btnSubmitForm.textContent = 'Salvar Alterações';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    inputEditId.value = '';
    form.reset();
    boxFormulario.classList.remove('editing-mode');
    avisoEdicao.style.display = 'none';
    btnSubmitForm.textContent = 'Adicionar ao Estoque';
}

function alterarQuantidade(id, direcao) {
    const item = estoque.find(function(i) { return i.id === id; });
    if (item) {
        const passo = (item.unidade === 'kg' || item.unidade === 'L') ? 0.5 : 1;
        const novaQtd = item.quantidade + (direcao * passo);
        item.quantidade = Math.max(0, Math.round(novaQtd * 100) / 100);
        salvarNoNavegador();
        renderizar();
    }
}

function removerItem(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        if (Number(inputEditId.value) === id) cancelarEdicao();
        estoque = estoque.filter(function(i) { return i.id !== id; });
        salvarNoNavegador();
        renderizar();
    }
}

function atualizarPainelResumo() {
    let totalKg = 0, totalLitros = 0, countRepor = 0, countVencendo = 0;

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

    document.getElementById('resumoVolume').textContent = (Math.round(totalKg * 100) / 100) + ' kg • ' + (Math.round(totalLitros * 100) / 100) + ' L';
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

function exportarDados() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(estoque));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "backup_estoque_nrsk_sv.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importarDados(event) {
    const arquivo = event.target.files.item(0);
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if (Array.isArray(dados)) {
                estoque = dados;
                salvarNoNavegador();
                renderizar();
                alert('Backup restaurado com sucesso!');
            }
        } catch (err) {
            alert('Erro ao ler o arquivo de backup.');
        }
    };
    leitor.readAsText(arquivo);
}

function gerarPDF(itensParaRelatorio) {
    if (itensParaRelatorio.length === 0) return alert('Nenhum item na lista atual para gerar PDF.');

    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const janelaPrint = window.open('', '_blank');

    const linhas = itensParaRelatorio.map(function(item) {
        const unidade = item.unidade || 'un';
        let status = item.quantidade === 0 ? 'ACABOU' : (item.quantidade <= item.minimo ? 'BAIXO' : 'Em dia');
        const dias = verificarValidade(item.dataValidade);
        if (dias !== null && dias < 0) status += ' / VENCIDO';
        else if (dias !== null && dias <= 60) status += ' / VENCE EM BREVE';

        return '<tr>' +
            '<td>' + item.nome + '</td>' +
            '<td>' + item.categoria + '</td>' +
            '<td>' + (item.local || '-') + '</td>' +
            '<td><strong>' + item.quantidade + ' ' + unidade + '</strong></td>' +
            '<td>' + formatarDataBR(item.dataArmazenamento) + '</td>' +
            '<td>' + formatarDataBR(item.dataValidade) + '</td>' +
            '<td>' + status + '</td>' +
        '</tr>';
    }).join('');

    janelaPrint.document.write(
        '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Estoque NRSK SV</title>' +
        '<style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:15px;font-size:12px}th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#2d4c3e;color:#fff}</style></head><body>' +
        '<h2>NRSK SV — Relatório de Estoque (' + dataEmissao + ')</h2>' +
        '<table><thead><tr><th>Item</th><th>Categoria</th><th>Local</th><th>Qtd</th><th>Armazenado</th><th>Validade</th><th>Status</th></tr></thead><tbody>' + linhas + '</tbody></table></body></html>'
    );
    janelaPrint.document.close();
    janelaPrint.focus();
    setTimeout(function() { janelaPrint.print(); }, 250);
}

renderizar();
