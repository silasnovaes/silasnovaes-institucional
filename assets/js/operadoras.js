// assets/js/operadoras.js

document.addEventListener("DOMContentLoaded", function() {
    const filtroTipo = document.getElementById("filtro-tipo");
    const filtroRegiao = document.getElementById("filtro-regiao");
    const filtroAbrangencia = document.getElementById("filtro-abrangencia");
    const botaoAplicar = document.getElementById("filtro-aplicar");
    const operadorasGrid = document.getElementById("operadoras-grid");
    const operadorasCards = operadorasGrid.querySelectorAll(".operadora-card");
    const nenhumaOperadoraMsg = document.getElementById("nenhuma-operadora");

    function aplicarFiltros() {
        const tipoSelecionado = filtroTipo.value;
        const regiaoSelecionada = filtroRegiao.value;
        const abrangenciaSelecionada = filtroAbrangencia.value;
        let algumaVisivel = false;

        operadorasCards.forEach(card => {
            const tiposCard = card.dataset.tipo || "";
            const regioesCard = card.dataset.regiao || "";
            const abrangenciasCard = card.dataset.abrangencia || "";

            const tipoMatch = tipoSelecionado === "todos" || tiposCard.includes(tipoSelecionado);
            const regiaoMatch = regiaoSelecionada === "todos" || regioesCard.includes(regiaoSelecionada);
            const abrangenciaMatch = abrangenciaSelecionada === "todos" || abrangenciasCard.includes(abrangenciaSelecionada);

            if (tipoMatch && regiaoMatch && abrangenciaMatch) {
                card.style.display = "flex"; // Ou "block" se preferir
                card.classList.remove("hidden");
                algumaVisivel = true;
            } else {
                card.style.display = "none";
                card.classList.add("hidden");
            }
        });

        // Mostra ou esconde a mensagem de "nenhuma operadora"
        if (algumaVisivel) {
            nenhumaOperadoraMsg.style.display = "none";
        } else {
            nenhumaOperadoraMsg.style.display = "block";
        }
    }

    if (botaoAplicar) {
        botaoAplicar.addEventListener("click", aplicarFiltros);
    }
    
    // Opcional: aplicar filtros ao mudar seleção (real-time)
    // if (filtroTipo) filtroTipo.addEventListener("change", aplicarFiltros);
    // if (filtroRegiao) filtroRegiao.addEventListener("change", aplicarFiltros);
    // if (filtroAbrangencia) filtroAbrangencia.addEventListener("change", aplicarFiltros);

    // Aplicar filtro inicial (caso necessário, mas geralmente começa mostrando tudo)
    // aplicarFiltros(); 
});