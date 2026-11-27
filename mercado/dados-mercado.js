let listaCompras = JSON.parse(localStorage.getItem('nrskListaMercado')) || [];

function salvarDadosMercado() {
    localStorage.setItem('nrskListaMercado', JSON.stringify(listaCompras));
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function puxarFaltantesDoEstoque() {
    const estoqueAtual = JSON.parse(localStorage.getItem('meuEstoqueCasa')) || [];
    const faltantes = estoqueAtual.filter(function(i) { return i.quantidade <= i.minimo; });

    if (faltantes.length === 0) {
        alert('Nenhum item com estoque baixo ou zerado no momento!');
        return false;
    }

    let adicionados = 0;
    faltantes.forEach(function(itemEst) {
        const jaExiste = listaCompras.some(function(i) {
            return i.nome.toLowerCase() === itemEst.nome.toLowerCase() && i.status === 'pendente';
        });

        if (!jaExiste) {
            const sugestaoQtd = Math.max(1, itemEst.minimo - itemEst.quantidade);
            listaCompras.push({
                id: Date.now() + Math.random(),
                nome: itemEst.nome,
                marca: '',
                qtd: sugestaoQtd,
                unidade: itemEst.unidade || 'un',
                preco: 0,
                status: 'pendente',
                extra: false
            });
            adicionados++;
        }
    });

    if (adicionados > 0) {
        salvarDadosMercado();
        alert(adicionados + ' item(ns) trazido(s) do estoque para a lista!');
        return true;
    } else {
        alert('Todos os itens em falta já estão na sua lista.');
        return false;
    }
}

function calcularResumoCarrinho() {
    const totalItens = listaCompras.length;
    const itensPegos = listaCompras.filter(function(i) { return i.status === 'pego'; });
    
    const valorTotal = itensPegos.reduce(function(soma, item) {
        return soma + (item.qtd * item.preco);
    }, 0);

    return {
        pegosCount: itensPegos.length,
        totalCount: totalItens,
        valorTotal: valorTotal
    };
}

function exportarBackupMercado() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(listaCompras));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "lista_mercado_nrsk_sv.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importarBackupMercado(event, callbackSucesso) {
    const arquivo = event.target.files.item(0);
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if (Array.isArray(dados)) {
                listaCompras = dados;
                salvarDadosMercado();
                callbackSucesso();
                alert('Lista restaurada com sucesso!');
            }
        } catch (err) {
            alert('Erro ao ler o arquivo da lista.');
        }
    };
    leitor.readAsText(arquivo);
}

function enviarComprasParaEstoque() {
    const itensPegos = listaCompras.filter(function(i) { return i.status === 'pego'; });
    if (itensPegos.length === 0) {
        alert('Nenhum item marcado como "✅ Peguei" para enviar.');
        return false;
    }

    let estoqueAtual = JSON.parse(localStorage.getItem('meuEstoqueCasa')) || [];
    
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hojeISO = ano + '-' + mes + '-' + dia;

    let atualizados = 0;
    let criados = 0;

    itensPegos.forEach(function(itemMercado) {
        const nomeLimpo = itemMercado.nome.trim();
        const indexExistente = estoqueAtual.findIndex(function(e) {
            return e.nome.toLowerCase() === nomeLimpo.toLowerCase();
        });

        if (indexExistente !== -1) {
            const novaQtd = Number(estoqueAtual[indexExistente].quantidade) + Number(itemMercado.qtd);
            estoqueAtual[indexExistente].quantidade = Math.round(novaQtd * 100) / 100;
            estoqueAtual[indexExistente].dataArmazenamento = hojeISO;
            atualizados++;
        } else {
            estoqueAtual.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                nome: nomeLimpo,
                categoria: 'Alimentos',
                quantidade: Number(itemMercado.qtd),
                unidade: itemMercado.unidade || 'un',
                minimo: 1,
                dataArmazenamento: hojeISO,
                dataValidade: ''
            });
            criados++;
        }
    });

    localStorage.setItem('meuEstoqueCasa', JSON.stringify(estoqueAtual));
    alert('Estoque atualizado com sucesso!\n• ' + atualizados + ' item(ns) somado(s)\n• ' + criados + ' novo(s) cadastrado(s)');
    return true;
}

function gerarPdfMercado(apenasComprados, valorPagoCaixa) {
    const itensFiltrados = apenasComprados
        ? listaCompras.filter(function(i) { return i.status === 'pego'; })
        : listaCompras;

    if (itensFiltrados.length === 0) {
        alert(apenasComprados ? 'Nenhum item marcado como pego para gerar PDF.' : 'A lista está vazia.');
        return;
    }

    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const janelaPrint = window.open('', '_blank');
    const resumo = calcularResumoCarrinho();

    const linhas = itensFiltrados.map(function(item) {
        const subtotal = item.qtd * (item.preco || 0);
        const statusLabel = item.status === 'pego' ? 'Comprado' : (item.status === 'faltou' ? 'Não tinha' : 'Pendente');
        return '<tr>' +
            '<td>' + item.nome + (item.extra ? ' <em>(Extra)</em>' : '') + '</td>' +
            '<td>' + (item.marca || '-') + '</td>' +
            '<td>' + item.qtd + ' ' + (item.unidade || 'un') + '</td>' +
            '<td>' + formatarMoeda(item.preco) + '</td>' +
            '<td><strong>' + formatarMoeda(subtotal) + '</strong></td>' +
            '<td>' + statusLabel + '</td>' +
        '</tr>';
    }).join('');

    let rodapeFinanceiro = '';
    if (apenasComprados) {
        const caixaNum = parseFloat(valorPagoCaixa);
        let linhaCaixa = '';
        if (!isNaN(caixaNum) && caixaNum > 0) {
            const dif = caixaNum - resumo.valorTotal;
            const textoDif = Math.abs(dif) < 0.01
                ? 'Valor bateu exato com a lista!'
                : (dif > 0 ? 'Caixa cobrou ' + formatarMoeda(dif) + ' a mais' : 'Caixa cobrou ' + formatarMoeda(Math.abs(dif)) + ' a menos');
            linhaCaixa = '<p><strong>Valor Pago no Caixa:</strong> ' + formatarMoeda(caixaNum) + ' (' + textoDif + ')</p>';
        }
        rodapeFinanceiro = '<div class="resumo-box">' +
            '<p><strong>Total Calculado na Lista:</strong> ' + formatarMoeda(resumo.valorTotal) + '</p>' +
            linhaCaixa +
        '</div>';
    }

    const tituloDoc = apenasComprados ? 'Comprovante de Compra — NRSK SV' : 'Lista de Compras — NRSK SV';

    janelaPrint.document.write(
        '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>' + tituloDoc + '</title>' +
        '<style>' +
        'body { font-family: Arial, sans-serif; color: #111; padding: 20px; }' +
        '.header { display: flex; justify-content: space-between; border-bottom: 2px solid #2d4c3e; padding-bottom: 10px; margin-bottom: 20px; }' +
        '.header h1 { color: #2d4c3e; margin: 0; font-size: 20px; }' +
        'table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }' +
        'th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }' +
        'th { background-color: #2d4c3e; color: #fff; }' +
        'tr:nth-child(even) { background-color: #f4f6f5; }' +
        '.resumo-box { background: #f4f6f5; border-left: 4px solid #2d4c3e; padding: 12px; font-size: 14px; }' +
        '</style></head><body>' +
        '<div class="header"><h1>' + tituloDoc + '</h1><span>Data: ' + dataEmissao + '</span></div>' +
        '<table><thead><tr><th>Item</th><th>Marca</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th><th>Status</th></tr></thead>' +
        '<tbody>' + linhas + '</tbody></table>' +
        rodapeFinanceiro +
        '</body></html>'
    );

    janelaPrint.document.close();
    janelaPrint.focus();
    setTimeout(function() { janelaPrint.print(); }, 250);
}
