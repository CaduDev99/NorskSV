let listaTarefas = JSON.parse(localStorage.getItem('nrskTarefasCasa')) || [];

function salvarTarefas() {
    localStorage.setItem('nrskTarefasCasa', JSON.stringify(listaTarefas));
}

function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const p = dataStr.split('-');
    return p + '/' + p + '/' + p;
}

function exportarBackupTarefas() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(listaTarefas));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "tarefas_nrsk_sv.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importarBackupTarefas(event, callback) {
    const arquivo = event.target.files.item(0);
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if (Array.isArray(dados)) {
                listaTarefas = dados;
                salvarTarefas();
                callback();
                alert('Tarefas restauradas com sucesso!');
            }
        } catch (err) {
            alert('Erro ao ler arquivo.');
        }
    };
    leitor.readAsText(arquivo);
}

function gerarPdfTarefas(tarefasFiltradas) {
    if (tarefasFiltradas.length === 0) return alert('Nenhuma tarefa para gerar PDF.');
    const janela = window.open('', '_blank');

    const linhas = tarefasFiltradas.map(function(t) {
        const prazo = t.data ? formatarDataBR(t.data) + (t.hora ? ' às ' + t.hora : '') : 'Sem prazo';
        return '<tr><td>' + t.titulo + '</td><td>' + t.categoria + '</td><td>' + t.prioridade.toUpperCase() + '</td><td>' + prazo + '</td><td>' + (t.feita ? 'Concluída' : 'Pendente') + '</td></tr>';
    }).join('');

    janela.document.write(
        '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Lista de Tarefas</title>' +
        '<style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#2d4c3e;color:#fff}</style></head><body>' +
        '<h2>NRSK SV — Tarefas e Compromissos</h2>' +
        '<table><thead><tr><th>Tarefa</th><th>Categoria</th><th>Prioridade</th><th>Data / Hora</th><th>Status</th></tr></thead><tbody>' + linhas + '</tbody></table></body></html>'
    );
    janela.document.close();
    janela.focus();
    setTimeout(function() { janela.print(); }, 250);
}
