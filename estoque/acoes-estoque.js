const form = document.getElementById('itemForm');
const boxFormulario = document.getElementById('boxFormulario');
const avisoEdicao = document.getElementById('avisoEdicao');
const btnSubmitForm = document.getElementById('btnSubmitForm');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const inputEditId = document.getElementById('editId');
const importFile = document.getElementById('importFile');

form.addEventListener('submit', salvarItemForm);
btnCancelarEdicao.addEventListener('click', cancelarEdicao);

document.getElementById('btnPdf').addEventListener('click', function() { gerarPDF(obterItensFiltrados()); });
document.getElementById('btnExportar').addEventListener('click', exportarDados);
document.getElementById('btnImportar').addEventListener('click', function() { importFile.click(); });
importFile.addEventListener('change', function(e) { importarDados(e, renderizar); });

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
