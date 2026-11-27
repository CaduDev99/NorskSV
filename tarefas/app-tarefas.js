const formTarefa = document.getElementById('formTarefa');
const filtroCatTarefa = document.getElementById('filtroCatTarefa');
const filtroStatusTarefa = document.getElementById('filtroStatusTarefa');
const importTarefasFile = document.getElementById('importTarefasFile');

formTarefa.addEventListener('submit', function(e) {
    e.preventDefault();
    listaTarefas.push({
        id: Date.now(),
        titulo: document.getElementById('tarefaTitulo').value.trim(),
        categoria: document.getElementById('tarefaCategoria').value,
        prioridade: document.getElementById('tarefaPrioridade').value,
        data: document.getElementById('tarefaData').value,
        hora: document.getElementById('tarefaHora').value,
        feita: false
    });
    salvarTarefas();
    renderizarTarefas();
    formTarefa.reset();
    document.getElementById('tarefaPrioridade').value = 'media';
});

filtroCatTarefa.addEventListener('change', renderizarTarefas);
filtroStatusTarefa.addEventListener('change', renderizarTarefas);
document.getElementById('btnPdfTarefas').addEventListener('click', function() { gerarPdfTarefas(obterTarefasFiltradas()); });
document.getElementById('btnExportarTarefas').addEventListener('click', exportarBackupTarefas);
document.getElementById('btnImportarTarefas').addEventListener('click', function() { importTarefasFile.click(); });
importTarefasFile.addEventListener('change', function(e) { importarBackupTarefas(e, renderizarTarefas); });

function alternarTarefa(id) {
    const tarefa = listaTarefas.find(function(t) { return t.id === id; });
    if (tarefa) {
        tarefa.feita = !tarefa.feita;
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
    const statusSel = filtroStatusTarefa.value;
    const pesoPrio = { 'alta': 1, 'media': 2, 'baixa': 3 };

    return listaTarefas.filter(function(t) {
        const bateCat = catSel === 'Todas' || t.categoria === catSel;
        const bateStatus = statusSel === 'Todas' || (statusSel === 'Pendentes' && !t.feita) || (statusSel === 'Concluidas' && t.feita);
        return bateCat && bateStatus;
    }).sort(function(a, b) {
        if (a.feita !== b.feita) return Number(a.feita) - Number(b.feita);
        return (pesoPrio[a.prioridade] || 2) - (pesoPrio[b.prioridade] || 2);
    });
}

function renderizarTarefas() {
    const container = document.getElementById('listaTarefas');
    const filtradas = obterTarefasFiltradas();
    container.innerHTML = '';

    if (filtradas.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);margin-top:20px;">Nenhuma tarefa encontrada.</p>';
        return;
    }

    filtradas.forEach(function(t) {
        const badgeClass = t.prioridade === 'alta' ? 'badge-alta' : (t.prioridade === 'media' ? 'badge-media' : 'badge-baixa');
        const badgeLabel = t.prioridade === 'alta' ? 'Alta' : (t.prioridade === 'media' ? 'Média' : 'Baixa');
        const prazoHtml = t.data ? '<span>📅 ' + formatarDataBR(t.data) + (t.hora ? ' às ' + t.hora : '') + '</span>' : '';

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
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="btn-delete" onclick="removerTarefa(' + t.id + ')" title="Excluir">🗑️</button>';
        container.appendChild(card);
    });
}

renderizarTarefas();
