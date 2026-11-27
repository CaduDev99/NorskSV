let estoque = JSON.parse(localStorage.getItem('meuEstoqueCasa')) || [];

function salvarNoNavegador() {
    localStorage.setItem('meuEstoqueCasa', JSON.stringify(estoque));
}

function formatarDataBR(dataStr) {
    if (!dataStr) return '-';
    const partes = dataStr.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function verificarValidade(dataValidadeStr) {
    if (!dataValidadeStr) return null;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const partes = dataValidadeStr.split('-');
    const validade = new Date(partes[0], partes[1] - 1, partes[2]);
    validade.setHours(0, 0, 0, 0);
    
    const diffTempo = validade - hoje;
    return Math.ceil(diffTempo / (1000 * 60 * 60 * 24));
}

function exportarDados() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(estoque));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "backup_nrsk_sv.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importarDados(event) {
    const arquivo = event.target.files[0];
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
    if (itensParaRelatorio.length === 0) {
        alert('Não há itens na lista atual para gerar PDF.');
        return;
    }

    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const janelaPrint = window.open('', '_blank');

    const linhasTabela = itensParaRelatorio.map(function(item) {
        const unidade = item.unidade || 'un';
        let statusTexto = 'Em dia';
        if (item.quantidade === 0) statusTexto = 'ACABOU';
        else if (item.quantidade <= item.minimo) statusTexto = 'BAIXO';

        const dias = verificarValidade(item.dataValidade);
        if (dias !== null && dias < 0) statusTexto += ' / VENCIDO';
        else if (dias !== null && dias <= 30) statusTexto += ' / VENCE EM BREVE';

        return '<tr>' +
            '<td>' + item.nome + '</td>' +
            '<td>' + item.categoria + '</td>' +
            '<td><strong>' + item.quantidade + ' ' + unidade + '</strong></td>' +
            '<td>' + item.minimo + ' ' + unidade + '</td>' +
            '<td>' + formatarDataBR(item.dataArmazenamento) + '</td>' +
            '<td>' + formatarDataBR(item.dataValidade) + '</td>' +
            '<td>' + statusTexto + '</td>' +
        '</tr>';
    }).join('');

    const htmlRelatorio = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">' +
        '<title>Relatório NRSK SV</title>' +
        '<style>' +
        'body { font-family: Arial, sans-serif; color: #111; padding: 20px; }' +
        '.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2d4c3e; padding-bottom: 10px; margin-bottom: 20px; }' +
        '.header h1 { color: #2d4c3e; margin: 0; font-size: 22px; }' +
        'table { width: 100%; border-collapse: collapse; font-size: 13px; }' +
        'th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }' +
        'th { background-color: #2d4c3e; color: #fff; }' +
        'tr:nth-child(even) { background-color: #f4f6f5; }' +
        '</style></head><body>' +
        '<div class="header"><h1>NRSK SV — Relatório de Estoque</h1>' +
        '<span>Emitido em: ' + dataEmissao + ' | Total: ' + itensParaRelatorio.length + ' item(ns)</span></div>' +
        '<table><thead><tr><th>Item</th><th>Categoria</th><th>Qtd Atual</th><th>Mínimo</th><th>Armazenado em</th><th>Validade</th><th>Status</th></tr></thead>' +
        '<tbody>' + linhasTabela + '</tbody></table></body></html>';

    janelaPrint.document.write(htmlRelatorio);
    janelaPrint.document.close();
    janelaPrint.focus();
    setTimeout(function() { janelaPrint.print(); }, 250);
}
const form = document.getElementById('itemForm');
const inputBusca = document.getElementById('busca');
const selectCategoria = document.getElementById('filtroCategoria');
const selectStatus = document.getElementById('filtroStatus');
const btnPdf = document.getElementById('btnPdf');
const btnExportar = document.getElementById('btnExportar');
const btnImportar = document.getElementById('btnImportar');
const importFile = document.getElementById('importFile');

form.addEventListener('submit', adicionarItem);
inputBusca.addEventListener('keyup', renderizar);
selectCategoria.addEventListener('change', renderizar);
selectStatus.addEventListener('change', renderizar);
btnPdf.addEventListener('click', function() { gerarPDF(obterItensFiltrados()); });
btnExportar.addEventListener('click', exportarDados);
btnImportar.addEventListener('click', function() { importFile.click(); });
importFile.addEventListener('change', importarDados);

function adicionarItem(e) {
    e.preventDefault();
    
    const novoItem = {
        id: Date.now(),
        nome: document.getElementById('nome').value.trim(),
        categoria: document.getElementById('categoria').value,
        quantidade: parseFloat(document.getElementById('quantidade').value),
        unidade: document.getElementById('unidade').value,
        minimo: parseFloat(document.getElementById('minimo').value),
        dataArmazenamento: document.getElementById('dataArmazenamento').value,
        dataValidade: document.getElementById('dataValidade').value
    };

    estoque.push(novoItem);
    salvarNoNavegador();
    renderizar();
    form.reset();
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
        estoque = estoque.filter(function(i) { return i.id !== id; });
        salvarNoNavegador();
        renderizar();
    }
}

function obterItensFiltrados() {
    const termoBusca = inputBusca.value.toLowerCase();
    const catFiltro = selectCategoria.value;
    const statusFiltro = selectStatus.value;

    return estoque.filter(function(item) {
        const bateNome = item.nome.toLowerCase().includes(termoBusca);
        const bateCat = catFiltro === 'Todas' || item.categoria === catFiltro;
        const precisaComprar = item.quantidade <= item.minimo;
        
        const diasParaVencer = verificarValidade(item.dataValidade);
        const pertoDeVencer = diasParaVencer !== null && diasParaVencer <= 30;

        let bateStatus = true;
        if (statusFiltro === 'Faltando') bateStatus = precisaComprar;
        if (statusFiltro === 'Vencendo') bateStatus = pertoDeVencer;

        return bateNome && bateCat && bateStatus;
    });
}

function renderizar() {
    const lista = document.getElementById('listaEstoque');
    const itensFiltrados = obterItensFiltrados();

    lista.innerHTML = '';

    if (itensFiltrados.length === 0) {
        lista.innerHTML = '<p style="text-align:center; color: var(--text-muted); margin-top: 20px;">Nenhum item encontrado.</p>';
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

        const diasParaVencer = verificarValidade(item.dataValidade);
        let validadeBadge = '';
        
        if (diasParaVencer !== null) {
            if (diasParaVencer < 0) {
                validadeBadge = '<span class="badge badge-out">Vencido há ' + Math.abs(diasParaVencer) + ' dia(s)</span>';
                statusClass = 'out-of-stock';
            } else if (diasParaVencer === 0) {
                validadeBadge = '<span class="badge badge-out">Vence hoje!</span>';
                statusClass = 'out-of-stock';
            } else if (diasParaVencer <= 30) {
                validadeBadge = '<span class="badge badge-low">Vence em ' + diasParaVencer + ' dia(s)</span>';
                if (statusClass === '') statusClass = 'low-stock';
            }
        }

        let datasHtml = '';
        if (item.dataArmazenamento || item.dataValidade) {
            const txtArm = item.dataArmazenamento ? '<span>📦 Armazenado em: <strong>' + formatarDataBR(item.dataArmazenamento) + '</strong></span>' : '';
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
                    '<span>⚠️ Mínimo: ' + item.minimo + ' ' + unidade + '</span>' +
                    badgeHtml +
                    validadeBadge +
                '</div>' +
                datasHtml +
            '</div>' +
            '<div class="item-controls">' +
                '<button class="qty-btn" onclick="alterarQuantidade(' + item.id + ', -1)">-</button>' +
                '<span class="qty-display">' + item.quantidade + ' ' + unidade + '</span>' +
                '<button class="qty-btn" onclick="alterarQuantidade(' + item.id + ', 1)">+</button>' +
                '<button class="btn-delete" onclick="removerItem(' + item.id + ')" title="Excluir">🗑️</button>' +
            '</div>';
        lista.appendChild(card);
    });
}

renderizar();
