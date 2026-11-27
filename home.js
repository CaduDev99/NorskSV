function carregarResumos() {
    const estoqueSalvo = JSON.parse(localStorage.getItem('meuEstoqueCasa')) || [];
    const faltando = estoqueSalvo.filter(function(i) { return i.quantidade <= i.minimo; }).length;
    const badgeEstoque = document.getElementById('resumoEstoque');
    
    if (badgeEstoque) {
        if (estoqueSalvo.length === 0) {
            badgeEstoque.textContent = 'Nenhum item cadastrado';
        } else if (faltando > 0) {
            badgeEstoque.textContent = estoqueSalvo.length + ' itens • ' + faltando + ' precisando repor';
            badgeEstoque.classList.add('badge-alert');
        } else {
            badgeEstoque.textContent = estoqueSalvo.length + ' itens • Tudo em dia';
        }
    }

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

    const contasSalvas = JSON.parse(localStorage.getItem('nrskContasCasa')) || [];
    const contasPendentes = contasSalvas.filter(function(c) { return !c.paga; }).length;
    const badgeContas = document.getElementById('resumoContas');
    
    if (badgeContas) {
        if (contasSalvas.length === 0) {
            badgeContas.textContent = 'Nenhuma conta lançada';
        } else if (contasPendentes > 0) {
            badgeContas.textContent = contasPendentes + ' conta(s) pendente(s)';
            badgeContas.classList.add('badge-alert');
        } else {
            badgeContas.textContent = 'Tudo em dia';
        }
    }
}

carregarResumos();
