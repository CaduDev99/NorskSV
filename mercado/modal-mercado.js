const tabPlanejar = document.getElementById('tabPlanejar');
const tabComprar = document.getElementById('tabComprar');
const secaoPlanejar = document.getElementById('secaoPlanejar');
const secaoComprar = document.getElementById('secaoComprar');

const modalFinalizar = document.getElementById('modalFinalizar');
const inputValorCaixa = document.getElementById('inputValorCaixa');
const resultadoDiferenca = document.getElementById('resultadoDiferenca');
const importListaFile = document.getElementById('importListaFile');
const btnEnviarEstoque = document.getElementById('btnEnviarEstoque');

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
    if (btnEnviarEstoque) btnEnviarEstoque.style.display = 'none';
    modalFinalizar.style.display = 'flex';
});

document.getElementById('btnFinalizarCompra').addEventListener('click', function() {
    const resumo = calcularResumoCarrinho();
    if (resumo.pegosCount === 0) return alert('Marque ao menos um item como Peguei.');
    modoModalAtual = 'compra';
    document.getElementById('modalTitulo').textContent = '✅ Conferência de Caixa';
    document.getElementById('modalValorLista').textContent = formatarMoeda(resumo.valorTotal);
    document.getElementById('blocoConferenciaCaixa').style.display = 'block';
    if (btnEnviarEstoque) btnEnviarEstoque.style.display = 'block';
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

document.getElementById('btnFecharModal').addEventListener('click', function() {
    modalFinalizar.style.display = 'none';
});

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

if (btnEnviarEstoque) {
    btnEnviarEstoque.addEventListener('click', function() {
        if (typeof enviarComprasParaEstoque !== 'function') {
            alert('Erro: atualize o arquivo dados-mercado.js primeiro.');
            return;
        }
        if (enviarComprasParaEstoque()) {
            if (confirm('Deseja remover da lista de mercado os itens que já foram enviados ao estoque?')) {
                listaCompras = listaCompras.filter(function(i) { return i.status !== 'pego'; });
                salvarDadosMercado();
                renderizarTudo();
            }
            modalFinalizar.style.display = 'none';
        }
    });
}

renderizarTudo();
