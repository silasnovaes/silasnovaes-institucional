// assets/js/operadoras.js

document.addEventListener("DOMContentLoaded", function() {
    // Referências aos elementos HTML
    const discoverySteps = document.querySelectorAll(".discovery-step");
    const operadorasCards = document.querySelectorAll(".operadora-card");
    const nenhumaOperadoraMsg = document.getElementById("nenhuma-operadora");
    const resetButton = document.getElementById("reset-filters");
    const contactFormStep = document.getElementById("step-contato");
    const temPlanoSelect = document.getElementById("tem-plano");
    const grupoPlanoAtual = document.getElementById("grupo-plano-atual");
    const grupoValorAtual = document.getElementById("grupo-valor-atual");
    const contactForm = document.getElementById("contact-form");

    // Objeto para armazenar as seleções do usuário
    let userSelections = {
        regiao: null,
        profissao: null,
        vidas: null
    };

    // Objeto de regras de negócio das operadoras
    // Cada chave é o ID do card da operadora, e o valor é um objeto com suas regras.
    // As regras são baseadas nos data-attributes e nos requisitos do usuário.
    // Importante: A lógica de 'profissao' e 'vidas' aqui complementa o 'data-attributes' e define
    // as condições mais específicas para a recomendação.
    const operadoraRules = {
        'bradesco': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj'],
            vidas: ['3+']
        },
        'amil': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'] // 1 vida para adesão, 2+ para empresarial/familiar
        },
        'sulamerica': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'] // 1 vida para adesão, 3+ para empresarial/familiar
        },
        'unimed': { // Mantido como Unimed, mas a regra de seguros que você citou será aplicada.
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj'],
            vidas: ['3+']
        },
        'hapvida': {
            regioes: ['norte', 'nordeste'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'], // Qualquer pessoa
            vidas: ['1', '2', '3+']
        },
        'gndi': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+']
        },
        'select': {
            regioes: ['norte', 'nordeste'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'], // Qualquer pessoa
            vidas: ['1']
        },
        'sbsaude': {
            regioes: ['norte', 'nordeste'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'], // Estudantes, profissionais liberais, empresários, CLT, ou qualquer outra pessoa que exerça qualquer atividade profissional
            vidas: ['1']
        },
        'ampla': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'] // 1 vida coletivo por adesão e empresarial a partir de 3 ou +
        },
        'blue': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'] // 1 vida coletivo por adesão e empresarial a partir de 3 ou +
        },
        // Regra para 'Todos os demais cards' (placeholders)
        'placeholder': { // Usamos 'placeholder' como um ID genérico para os demais, o JS fará o match se não encontrar ID específico
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'] // Apenas contratos com 1 ou + vidas
        }
    };


    /**
     * Exibe o passo atual do formulário e oculta os outros.
     * @param {string} stepId O ID do elemento do passo a ser exibido (ex: 'step-regiao').
     */
    function showStep(stepId) {
        discoverySteps.forEach(step => {
            step.classList.remove("active");
        });
        const currentStep = document.getElementById(stepId);
        if (currentStep) {
            currentStep.classList.add("active");
            // Scrolla para o topo do formulário para o usuário ver a próxima pergunta
            currentStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Aplica os filtros aos cards das operadoras com base nas seleções do usuário.
     * As regras de negócio são aplicadas aqui para exibir/ocultar os cards.
     */
    function applyFilters() {
        let algumaVisivel = false;

        operadorasCards.forEach(card => {
            const operadoraId = card.id;
            const rules = operadoraRules[operadoraId] || operadoraRules['placeholder']; // Usa regra específica ou a regra padrão

            let matchRegiao = true;
            if (userSelections.regiao) {
                // Se a região selecionada é 'nacional', qualquer operadora que atenda 'nacional' ou a região específica dela serve
                // Se a operadora atende 'nacional', ela sempre será considerada um match para qualquer região.
                if (userSelections.regiao === 'nacional') {
                    matchRegiao = rules.regioes.includes('nacional') || rules.regioes.includes('norte') || rules.regioes.includes('nordeste') || rules.regioes.includes('sudeste') || rules.regioes.includes('sul') || rules.regioes.includes('centro-oeste');
                } else {
                    matchRegiao = rules.regioes.includes(userSelections.regiao) || rules.regioes.includes('nacional');
                }
            }
            
            let matchProfissao = true;
            if (userSelections.profissao) {
                matchProfissao = rules.profissoes.includes(userSelections.profissao);
            }

            let matchVidas = true;
            if (userSelections.vidas) {
                matchVidas = rules.vidas.includes(userSelections.vidas);
                // Lógica específica para Amil, SulAmérica, Ampla e Blue (1 vida coletivo por adesão, empresarial/familiar a partir de X vidas)
                // Esta lógica já está abstraída nos 'vidas' arrays das rules acima, mas pode ser refinada aqui se necessário for um AND complexo.
                // Por exemplo, para 'Amil' e 'SulAmérica', se 1 vida for selecionado, 'adesao' deve ser possível.
                // Se '2' ou '3+' vidas forem selecionadas, 'empresarial' ou 'familiar' devem ser possíveis.
                // Como 'vidas' já inclui todos os casos, a simples inclusão no array é suficiente para a maioria das regras.
                // Exemplo mais explícito para 1 vida vs 2/3+ vidas em operadoras específicas:
                if (operadoraId === 'amil' || operadoraId === 'sulamerica' || operadoraId === 'ampla' || operadoraId === 'blue') {
                    if (userSelections.vidas === '1') {
                        matchVidas = (userSelections.profissao === 'estudante' || userSelections.profissao === 'servidor' || userSelections.profissao === 'superior' || userSelections.profissao === 'autonomo' || userSelections.profissao === 'clt' || userSelections.profissao === 'cnpj'); // Adesão para diversas categorias
                    } else if (userSelections.vidas === '2' && (operadoraId === 'amil')) {
                        matchVidas = userSelections.profissao === 'cnpj'; // Amil 2 vidas CNPJ
                    } else if (userSelections.vidas === '2' && (operadoraId === 'sulamerica' || operadoraId === 'ampla' || operadoraId === 'blue')) {
                        matchVidas = false; // Essas não tem 2 vidas para CNPJ, pulam para 3+
                    } else if (userSelections.vidas === '3+') {
                        matchVidas = userSelections.profissao === 'cnpj'; // 3+ vidas CNPJ
                    }
                }
                // Bradesco e Unimed Seguros (com 3+ vidas CNPJ)
                if ((operadoraId === 'bradesco' || operadoraId === 'unimed') && userSelections.vidas !== '3+') {
                    matchVidas = false;
                }
                if ((operadoraId === 'bradesco' || operadoraId === 'unimed') && userSelections.profissao !== 'cnpj') {
                    matchProfissao = false;
                }

                // Select e Sb Saúde (apenas 1 vida, qualquer profissão)
                if ((operadoraId === 'select' || operadoraId === 'sbsaude') && userSelections.vidas !== '1') {
                    matchVidas = false;
                }
            }


            // Verifica se todos os critérios correspondem
            if (matchRegiao && matchProfissao && matchVidas) {
                card.style.display = "flex";
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

    /**
     * Reinicia todos os filtros e o formulário.
     */
    function resetFilters() {
        userSelections = {
            regiao: null,
            profissao: null,
            vidas: null
        };

        // Limpa todas as seleções de radio buttons
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });

        // Oculta o formulário de contato e seus campos condicionais
        contactFormStep.classList.remove("active");
        grupoPlanoAtual.style.display = 'none';
        grupoValorAtual.style.display = 'none';
        contactForm.reset(); // Limpa o formulário de contato

        // Exibe o primeiro passo do formulário de descoberta
        showStep("step-regiao");

        // Reseta a visibilidade de todas as operadoras
        operadorasCards.forEach(card => {
            card.style.display = "flex";
            card.classList.remove("hidden");
        });
        nenhumaOperadoraMsg.style.display = "none"; // Garante que a mensagem de 'nenhuma operadora' esteja oculta
    }

    // Adiciona event listeners para os radio buttons
    document.querySelectorAll(".discovery-step .option-card input[type='radio']").forEach(radio => {
        radio.addEventListener("change", function() {
            const groupName = this.name; // 'regiao', 'profissao', 'vidas'
            userSelections[groupName] = this.value; // Atualiza a seleção do usuário

            applyFilters(); // Aplica os filtros imediatamente

            // Avança para o próximo passo ou exibe o formulário de contato
            const nextStepId = this.dataset.nextStep;
            if (nextStepId) {
                showStep(nextStepId);
            }
        });
    });

    // Event listener para o botão de reset
    if (resetButton) {
        resetButton.addEventListener("click", resetFilters);
    }

    // Lógica para mostrar/ocultar campos adicionais no formulário de contato
    if (temPlanoSelect) {
        temPlanoSelect.addEventListener('change', function() {
            if (this.value === 'sim') {
                grupoPlanoAtual.style.display = 'block';
                grupoValorAtual.style.display = 'block';
            } else {
                grupoPlanoAtual.style.display = 'none';
                grupoValorAtual.style.display = 'none';
                // Opcional: Limpar os campos quando ocultos
                document.getElementById('plano-atual').value = '';
                document.getElementById('valor-atual').value = '';
            }
        });
    }

    // Lógica de submissão do formulário de contato (exemplo: enviar para um endpoint)
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Evita o recarregamento da página

            // Coleta os dados do formulário
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Adiciona as seleções de filtro ao objeto de dados
            data.filtroRegiao = userSelections.regiao;
            data.filtroProfissao = userSelections.profissao;
            data.filtroVidas = userSelections.vidas;

            // TODO: Aqui você implementaria o envio desses dados.
            // Ex: fetch('/api/send-contact', { method: 'POST', body: JSON.stringify(data) })
            //     .then(response => response.json())
            //     .then(result => {
            //         console.log('Sucesso:', result);
            //         alert('Sua solicitação foi enviada com sucesso! Em breve entraremos em contato.');
            //         contactForm.reset(); // Limpa o formulário após o envio
            //         resetFilters(); // Opcional: reiniciar os filtros após o envio do formulário
            //     })
            //     .catch(error => {
            //         console.error('Erro ao enviar:', error);
            //         alert('Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.');
            //     });

            console.log("Dados do formulário para envio:", data);
            alert('Formulário simulado enviado! Verifique o console para os dados coletados.');
            contactForm.reset(); // Limpa o formulário após a simulação
            resetFilters(); // Reinicia os filtros após a simulação
        });
    }

    // Inicia o processo exibindo o primeiro passo ao carregar a página
    showStep("step-regiao");
    // Garante que todas as operadoras estão visíveis no início
    applyFilters(); // Para garantir que a visibilidade inicial está correta com base nas regras (todos os userSelections null)

});