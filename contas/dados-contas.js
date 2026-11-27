let listaContas = JSON.parse(localStorage.getItem('nrskContasCasa')) || [];

function salvarContas() {
    localStorage.setItem('nrskContasCasa', JSON.stringify(listaContas));
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataBR(dataStr) {
    if (!dataStr) return '-';
    const p = dataStr.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
}

function diasAteVencimento(dataStr) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const p = dataStr.split('-');
    const venc = new Date(p[0], p[1] - 1, p[2]);
    venc.setHours(0, 0, 0, 0);
    return Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
}

function avancarUmMes(dataStr) {
    const p = dataStr.split('-');
    let ano = parseInt(p[0], 10);
    let mes = parseInt(p[1], 10);
    const dia = p[2];

    mes += 1;
    if (mes > 12) {
        mes = 1;
        ano += 1;
    }
    return ano + '-' + String(mes).padStart(2, '0') + '-' + dia;
}

function exportarBackupContas() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(listaContas));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "contas_nrsk_sv.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function importarBackupContas(event, callback) {
    const arquivo = event.target.files.item(0);
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            if (Array.isArray(dados)) {
                listaContas = dados;
                salvarContas();
                callback();
                alert('Contas restauradas com sucesso!');
            }
        } catch (err) {
            alert('Erro ao ler arquivo.');
        }
    };
    leitor.readAsText(arquivo);
}

function gerarPdfContas(contasFiltradas) {
    if (contasFiltradas.length === 0) return alert('Nenhuma conta para gerar PDF.');
    const janela = window.open('', '_blank');
    const total = contasFiltradas.reduce(function(s, c) { return s + c.valor; }, 0);

    const linhas = contasFiltradas.map(function(c) {
        return '<tr><td>' + c.nome + '</td><td>' + c.categoria + '</td><td>' + formatarDataBR(c.vencimento) + '</td><td><strong>' + formatarMoeda(c.valor) + '</strong></td><td>' + (c.paga ? 'Paga' : 'Pendente') + '</td></tr>';
    }).join('');

    janela.document.write(
        '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório de Contas</title>' +
        '<style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:15px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#2d4c3e;color:#fff}</style></head><body>' +
        '<h2>NRSK SV — Relatório de Contas (' + formatarMoeda(total) + ')</h2>' +
        '<table><thead><tr><th>Conta</th><th>Categoria</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead><tbody>' + linhas + '</tbody></table></body></html>'
    );
    janela.document.close();
    janela.focus();
    setTimeout(function() { janela.print(); }, 250);
}
