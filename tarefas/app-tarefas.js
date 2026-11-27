const formTarefa = document.getElementById('formTarefa');
const filtroCatTarefa = document.getElementById('filtroCatTarefa');
const importTarefasFile = document.getElementById('importTarefasFile');

const tabPendentes = document.getElementById('tabPendentes');
const tabHistorico = document.getElementById('tabHistorico');
const btnLimparHistorico = document.getElementById('btnLimparHistorico');

let abaAtual = 'pendentes'; // 'pendentes' ou 'historico'

tabPendentes.addEventListener('click', function() {
    abaAtual = 'pendentes';
    tabPendentes.classList.add('active');
    tabHistorico.classList.remove('active');
    btnLimparHistorico.style.display = 'none';
    renderizarTarefas();
});

tabHistorico.addEventListener('click', function() {
    abaAtual = 'historico';
    tabHistorico.classList.add('active');
    tabPendentes.classList.remove('active');
    btnLimparHistorico.style.display = 'block';
    renderizarTarefas();
});

btnLimparHistorico.addEventListener('click', function() {
    const temConcluidas = listaTarefas.some(function(t) { return t.feita; });
    if (!temConcluidas) return;
    if (confirm('Deseja apagar permanentemente todo o histórico de tarefas concluídas?')) {
        listaTarefas = listaTarefas.filter(function(t) { return !t.feita; });
        salvarTarefas();
        renderizarTarefas();
    }
});

formTarefa.addEventListener('submit', function(e) {
    e.preventDefault();
    listaTarefas.push({
        id: Date.now(),
        titulo: document.getElementById('tarefaTitulo').value.trim(),
        categoria: document.getElementById('tarefaCategoria').value,
        prioridade: document.getElementById('tarefaPrioridade').value,
        data: document.getElementById('tarefaData').value,
        hora: document.getElementById('tarefaHora').value,
        feita: false,
        concluidaEm: ''
    });
    salvarTarefas();
    renderizarTarefas();
    formTarefa.reset();
    document.getElementById('tarefaPrioridade').value = 'media';
});

filtroCatTarefa.addEventListener('change', renderizarTarefas);
document.getElementById('btnPdfTarefas').addEventListener('click', function() {
    gerarPdfTarefas(obterTarefasFiltradas(), abaAtual === 'historico');
});
document.getElementById('btnExportarTarefas').addEventListener('click', exportarBackupTarefas);
document.getElementById('btnImportarTarefas').addEventListener('click', function() { importTarefasFile.click(); });
importTarefasFile.addEventListener('change', function(e) { importarBackupTarefas(e, renderizarTarefas); });

function alternarTarefa(id) {
    const tarefa = listaTarefas.find(function(t) { return t.id === id; });
    if (tarefa) {
        tarefa.feita = !tarefa.feita;
        if (tarefa.feita) {
            const agora = new Date();
            const dataBR = agora.toLocaleDateString('pt-BR');
            const horaBR = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            tarefa.concluidaEm = dataBR + ' às ' + horaBR;
        } else {
            tarefa.concluidaEm = '';
        }
        salvarTarefas();
        renderizarTarefas();
    }
}

function removerTarefa(id) {
    if (confirm('Excluir esta tarefa?')) {
        listaTarefas = listaTarefas.filter(function(t) { return t.id !== id; });
        salvarTarefas();
        renderizarTarefas();
    }
}

function obterTarefasFiltradas() {
    const catSel = filtroCatTarefa.value;
    const pesoPrio = { 'alta': 1, 'media': 2, 'baixa': 3 };

    return listaTarefas.filter(function(t) {
        const bateAba = (abaAtual === 'pendentes' && !t.feita) || (abaAtual === 'historico' && t.feita);
        const bateCat = catSel === 'Todas' || t.categoria === catSel;
        return bateAba && bateCat;
    }).sort(function(a, b) {
        if (abaAtual === 'historico') return b.id - a.id;
        return (pesoPrio[a.prioridade] || 2) - (pesoPrio[b.prioridade] || 2);
    });
}

function renderizarTarefas() {
    const container = document.getElementById('listaTarefas');
    const filtradas = obterTarefasFiltradas();
    
    document.getElementById('countPendentes').textContent = listaTarefas.filter(function(t) { return !t.feita; }).length;
    document.getElementById('countConcluidas').textContent = listaTarefas.filter(function(t) { return t.feita; }).length;

    container.innerHTML = '';

    if (filtradas.length === 0) {
        const msg = abaAtual === 'historico' ? 'Nenhuma tarefa concluída no histórico ainda.' : 'Nenhuma tarefa pendente.';
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);margin-top:20px;">' + msg + '</p>';
        return;
    }

    filtradas.forEach(function(t) {
        const badgeClass = t.prioridade === 'alta' ? 'badge-alta' : (t.prioridade === 'media' ? 'badge-media' : 'badge-baixa');
        const badgeLabel = t.prioridade === 'alta' ? 'Alta' : (t.prioridade === 'media' ? 'Média' : 'Baixa');
        const prazoHtml = t.data ? '<span>📅 Prazo: ' + formatarDataBR(t.data) + (t.hora ? ' às ' + t.hora : '') + '</span>' : '';
        const conclusaoHtml = (t.feita && t.concluidaEm) ? '<span>✅ Concluída em: <strong>' + t.concluidaEm + '</strong></span>' : '';

        const card = document.createElement('div');
        card.className = 'task-card prio-' + t.prioridade + (t.feita ? ' concluida' : '');
        card.innerHTML =
            '<div class="task-left" onclick="alternarTarefa(' + t.id + ')">' +
                '<input type="checkbox" ' + (t.feita ? 'checked' : '') + ' onclick="event.stopPropagation(); alternarTarefa(' + t.id + ')">' +
                '<div class="task-info">' +
                    '<h3>' + t.titulo + '</h3>' +
                    '<div class="task-meta">' +
                        '<span>📁 ' + t.categoria + '</span>' +
                        '<span class="badge ' + badgeClass + '">' + badgeLabel + '</span>' +
                        prazoHtml +
                        conclusaoHtml +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="btn-delete" onclick="removerTarefa(' + t.id + ')" title="Excluir">🗑️</button>';
        container.appendChild(card);
    });
}

renderizarTarefas();
