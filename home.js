const btnBackupGeral = document.getElementById('btnBackupGeral');
const btnRestaurarGeral = document.getElementById('btnRestaurarGeral');
const importGeralFile = document.getElementById('importGeralFile');

btnBackupGeral.addEventListener('click', exportarBackupGeral);
btnRestaurarGeral.addEventListener('click', function() { importGeralFile.click(); });
importGeralFile.addEventListener('change', importarBackupGeral);

function carregarResumos() {
    // 1. Resumo do Estoque
    const estoqueSalvo = JSON.parse(localStorage.getItem('meuEstoqueCasa')) || [];
    const faltando = estoqueSalvo.filter(function(i) { return i.quantidade <= i.minimo; }).length;
    const badgeEstoque = document.getElementById('resumoEstoque');
    
    if (badgeEstoque) {
        badgeEstoque.classList.remove('badge-alert');
        if (estoqueSalvo.length === 0) {
            badgeEstoque.textContent = 'Nenhum item cadastrado';
        } else if (faltando > 0) {
            badgeEstoque.textContent = estoqueSalvo.length + ' itens • ' + faltando + ' precisando repor';
            badgeEstoque.classList.add('badge-alert');
        } else {
            badgeEstoque.textContent = estoqueSalvo.length + ' itens • Tudo em dia';
        }
    }

    // 2. Resumo do Mercado
    const listaMercado = JSON.parse(localStorage.getItem('nrskListaMercado')) || [];
    const pendentes = listaMercado.filter(function(i) { return i.status === 'pendente'; }).length;
    const badgeMercado = document.getElementById('resumoMercado');
    
    if (badgeMercado) {
        if (listaMercado.length === 0) {
            badgeMercado.textContent = 'Lista vazia';
        } else {
            badgeMercado.textContent = pendentes + ' pendente(s) de ' + listaMercado.length + ' item(ns)';
        }
    }

    // 3. Resumo das Contas da Casa
    const contasSalvas = JSON.parse(localStorage.getItem('nrskContasCasa')) || [];
    const contasPendentes = contasSalvas.filter(function(c) { return !c.paga; }).length;
    const badgeContas = document.getElementById('resumoContas');
    
    if (badgeContas) {
        badgeContas.classList.remove('badge-alert');
        if (contasSalvas.length === 0) {
            badgeContas.textContent = 'Nenhuma conta lançada';
        } else if (contasPendentes > 0) {
            badgeContas.textContent = contasPendentes + ' conta(s) pendente(s)';
            badgeContas.classList.add('badge-alert');
        } else {
            badgeContas.textContent = 'Tudo em dia';
        }
    }

    // 4. Resumo das Tarefas
    const tarefasSalvas = JSON.parse(localStorage.getItem('nrskTarefasCasa')) || [];
    const tarefasPendentes = tarefasSalvas.filter(function(t) { return !t.feita; }).length;
    const badgeTarefas = document.getElementById('resumoTarefas');
    
    if (badgeTarefas) {
        badgeTarefas.classList.remove('badge-alert');
        if (tarefasSalvas.length === 0) {
            badgeTarefas.textContent = 'Nenhuma tarefa';
        } else if (tarefasPendentes > 0) {
            badgeTarefas.textContent = tarefasPendentes + ' tarefa(s) pendente(s)';
            badgeTarefas.classList.add('badge-alert');
        } else {
            badgeTarefas.textContent = 'Tudo concluído';
        }
    }
}

function exportarBackupGeral() {
    const pacoteCompleto = {
        sistema: 'NRSK SV',
        dataBackup: new Date().toISOString(),
        estoque: JSON.parse(localStorage.getItem('meuEstoqueCasa')) || [],
        mercado: JSON.parse(localStorage.getItem('nrskListaMercado')) || [],
        contas: JSON.parse(localStorage.getItem('nrskContasCasa')) || [],
        tarefas: JSON.parse(localStorage.getItem('nrskTarefasCasa')) || []
    };

    const hoje = new Date();
    const dataNome = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pacoteCompleto));
    
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "backup_geral_nrsk_sv_" + dataNome + ".json");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importarBackupGeral(event) {
    const arquivo = event.target.files.item(0);
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if (dados && dados.sistema === 'NRSK SV') {
                if (!confirm('Isso vai substituir os dados atuais de Estoque, Mercado, Contas e Tarefas pelo backup selecionado. Deseja continuar?')) {
                    return;
                }
                if (Array.isArray(dados.estoque)) localStorage.setItem('meuEstoqueCasa', JSON.stringify(dados.estoque));
                if (Array.isArray(dados.mercado)) localStorage.setItem('nrskListaMercado', JSON.stringify(dados.mercado));
                if (Array.isArray(dados.contas)) localStorage.setItem('nrskContasCasa', JSON.stringify(dados.contas));
                if (Array.isArray(dados.tarefas)) localStorage.setItem('nrskTarefasCasa', JSON.stringify(dados.tarefas));
                
                carregarResumos();
                alert('Backup Geral restaurado com sucesso nos 4 módulos!');
            } else {
                alert('Arquivo inválido. Selecione um arquivo de Backup Geral do NRSK SV.');
            }
        } catch (err) {
            alert('Erro ao ler o arquivo de backup.');
        }
    };
    leitor.readAsText(arquivo);
    event.target.value = '';
}

carregarResumos();
