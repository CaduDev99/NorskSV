const formPlanejar = document.getElementById('formPlanejar');
const formExtra = document.getElementById('formExtra');

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
