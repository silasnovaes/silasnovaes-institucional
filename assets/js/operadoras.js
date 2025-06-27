// assets/js/operadoras.js

document.addEventListener("DOMContentLoaded", function() {
    // Referências aos elementos HTML
    const discoverySteps = document.querySelectorAll(".discovery-step");
    const operadorasCards = document.querySelectorAll(".operadora-card");
    const nenhumaOperadoraMsg = document.getElementById("nenhuma-operadora");
    const resetButton = document.getElementById("reset-filters");
    
    // Elementos do Pop-up de Contato (Nº 2)
    const contactPopup = document.getElementById("contact-popup");
    const closeContactPopupButton = contactPopup.querySelector(".close-popup-btn");
    const popupTemPlanoSelect = document.getElementById("popup-tem-plano");
    const popupGrupoPlanoAtual = document.getElementById("popup-grupo-plano-atual");
    const popupGrupoValorAtual = document.getElementById("popup-grupo-valor-atual");
    const popupContactForm = document.getElementById("popup-contact-form");
    const operadorasSection = document.querySelector(".operadoras-section"); // Para observar o scroll

    // Elementos do Pop-up de Saída (Nº 4)
    const exitIntentPopup = document.getElementById("exit-intent-popup");
    const closeExitIntentPopupButton = exitIntentPopup.querySelector(".close-popup-btn");
    const exitPopupTitle = document.getElementById("exit-popup-title");
    const exitPopupText = document.getElementById("exit-popup-text");
    const popupTriggerButtons = document.querySelectorAll(".popup-trigger-button"); // Botões que abrem o pop-up de contato

    // Elementos da Mensagem Flutuante (Nº 5)
    const floatingMessage = document.getElementById("floating-message");
    const floatingMessageText = document.getElementById("floating-message-text");
    const closeFloatingMessageButton = floatingMessage.querySelector(".close-floating-message-btn");

    // Objeto para armazenar as seleções do usuário
    let userSelections = {
        regiao: null,
        profissao: null,
        vidas: null
    };

    // Variável para controlar se o pop-up de contato já foi exibido
    let contactPopupShown = false;
    // Variável para controlar se o pop-up de saída já foi exibido
    let exitPopupShown = false;
    // Variável para controlar se a mensagem flutuante já foi exibida
    let floatingMessageShown = false;

    // Objeto de regras de negócio das operadoras
    // Cada chave é o ID do card da operadora, e o valor é um objeto com suas regras.
    const operadoraRules = {
        'bradesco': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj'],
            vidas: ['3+'],
            prioridadeRecomendacao: 1 // Prioridade mais alta
        },
        'amil': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'],
            prioridadeRecomendacao: 2
        },
        'sulamerica': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'],
            prioridadeRecomendacao: 3
        },
        'unimed': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj'], // Apenas CNPJ para Unimed Seguros
            vidas: ['3+'], // Apenas 3+ vidas
            prioridadeRecomendacao: 4 // Menor prioridade para recomendação direta
        },
        'hapvida': {
            regioes: ['norte', 'nordeste'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'],
            prioridadeRecomendacao: 5
        },
        'gndi': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'],
            prioridadeRecomendacao: 6
        },
        'select': {
            regioes: ['norte', 'nordeste'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1'],
            prioridadeRecomendacao: 7
        },
        'sbsaude': {
            regioes: ['norte', 'nordeste'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1'],
            prioridadeRecomendacao: 8
        },
        'ampla': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'], // 1 adesão, 3+ empresarial
            prioridadeRecomendacao: 9
        },
        'blue': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'], // 1 adesão, 3+ empresarial
            prioridadeRecomendacao: 10
        },
        // Regra para 'Todos os demais cards' (placeholders)
        'placeholder': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'], // Apenas contratos com 1 ou + vidas
            prioridadeRecomendacao: 99 // Prioridade mais baixa
        }
    };

    /**
     * Helper para exibir/ocultar pop-ups.
     * @param {HTMLElement} popupElement O elemento do pop-up (overlay).
     * @param {boolean} show Se deve exibir (true) ou ocultar (false).
     */
    function togglePopup(popupElement, show) {
        if (show) {
            popupElement.classList.add("active");
            document.body.style.overflow = "hidden"; // Impede scroll do body
        } else {
            popupElement.classList.remove("active");
            document.body.style.overflow = ""; // Restaura scroll do body
        }
    }

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
     * Também lida com a recomendação da melhor operadora. (Nº 1)
     */
    function applyFilters() {
        let algumaVisivel = false;
        let recommendedOperadora = null; // Armazena a operadora mais recomendada
        let lowestPriority = 100; // Começa com uma prioridade alta para encontrar a mais baixa

        // Remove destaques e badges existentes
        operadorasCards.forEach(card => {
            card.classList.remove("recommended");
            const existingBadge = card.querySelector(".recommendation-badge");
            if (existingBadge) {
                existingBadge.remove();
            }
        });

        operadorasCards.forEach(card => {
            const operadoraId = card.id;
            // Se o card é um placeholder, usamos a regra genérica. Caso contrário, usamos a regra específica.
            const isPlaceholder = card.classList.contains('placeholder');
            const rules = operadoraRules[operadoraId] || (isPlaceholder ? operadoraRules['placeholder'] : null);
            
            // Se não houver regras definidas para a operadora (e não é um placeholder), ocultamos.
            if (!rules) {
                card.style.display = "none";
                card.classList.add("hidden");
                return; // Pula para o próximo card
            }

            let matchRegiao = true;
            if (userSelections.regiao) {
                if (userSelections.regiao === 'nacional') {
                    // Se o usuário quer nacional, a operadora deve atender nacional OU ter abrangência em todas as regiões principais
                    matchRegiao = rules.regioes.includes('nacional') || 
                                  (rules.regioes.includes('norte') && rules.regioes.includes('nordeste') && 
                                   rules.regioes.includes('sudeste') && rules.regioes.includes('sul') && 
                                   rules.regioes.includes('centro-oeste'));
                } else {
                    // Se o usuário quer uma região específica, a operadora deve atender essa região OU ser nacional
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
                
                // Lógica de exceção para 2 vidas (Amil) e 3+ vidas (Bradesco, Unimed Seguros)
                if (userSelections.vidas === '2') {
                    if (operadoraId === 'amil' && userSelections.profissao === 'cnpj') {
                        // Amil aceita 2 vidas para CNPJ (Empresarial)
                    } else if (operadoraId === 'sulamerica' || operadoraId === 'ampla' || operadoraId === 'blue') {
                        matchVidas = false; // Essas operadoras não aceitam 2 vidas empresariais, pulam de 1 para 3+
                    }
                } else if (userSelections.vidas === '3+') {
                    if ((operadoraId === 'bradesco' || operadoraId === 'unimed') && userSelections.profissao !== 'cnpj') {
                        matchProfissao = false; // Bradesco/Unimed só aceitam 3+ vidas com CNPJ
                    }
                } else if (userSelections.vidas === '1') {
                     if ((operadoraId === 'bradesco' || operadoraId === 'unimed')) {
                        matchVidas = false; // Bradesco/Unimed não aceitam 1 vida
                    }
                }

                // Select e Sb Saúde (apenas 1 vida, qualquer profissão)
                if ((operadoraId === 'select' || operadoraId === 'sbsaude') && userSelections.vidas !== '1') {
                    matchVidas = false;
                }
            }


            // Verifica se todos os critérios correspondem
            if (matchRegiao && matchProfissao && matchVidas) {
                card.style.display = "flex"; // Ou "block" se preferir
                card.classList.remove("hidden");
                algumaVisivel = true;

                // Lógica de recomendação (Nº 1)
                if (userSelections.regiao && userSelections.profissao && userSelections.vidas) { // Apenas recomenda se todos os filtros foram aplicados
                    const currentPriority = rules.prioridadeRecomendacao;
                    if (currentPriority < lowestPriority) {
                        lowestPriority = currentPriority;
                        recommendedOperadora = card;
                    }
                }
            } else {
                card.style.display = "none";
                card.classList.add("hidden");
            }
        });

        // Aplica o destaque na operadora mais recomendada (Nº 1)
        if (recommendedOperadora) {
            recommendedOperadora.classList.add("recommended");
            const badge = document.createElement("span");
            badge.classList.add("recommendation-badge");
            badge.textContent = "Melhor opção para você";
            recommendedOperadora.prepend(badge); // Adiciona o badge no início do card
        }

        // Mostra ou esconde a mensagem de "nenhuma operadora"
        if (algumaVisivel) {
            nenhumaOperadoraMsg.style.display = "none";
        } else {
            nenhumaOperadoraMsg.style.display = "block";
        }

        // Tracking de Desempenho dos Filtros (Nº 6)
        trackFilterPerformance();
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

        // Oculta o pop-up de contato se estiver ativo
        togglePopup(contactPopup, false);
        contactPopupShown = false; // Reseta o controle do pop-up
        exitPopupShown = false; // Reseta o controle do pop-up de saída
        toggleFloatingMessage(false); // Oculta a mensagem flutuante
        floatingMessageShown = false; // Reseta o controle da mensagem flutuante

        // Limpa e oculta os campos condicionais do pop-up de contato
        popupGrupoPlanoAtual.style.display = 'none';
        popupGrupoValorAtual.style.display = 'none';
        popupContactForm.reset(); // Limpa o formulário de contato do pop-up

        // Exibe o primeiro passo do formulário de descoberta
        showStep("step-regiao");

        // Reseta a visibilidade de todas as operadoras
        operadorasCards.forEach(card => {
            card.style.display = "flex";
            card.classList.remove("hidden", "recommended");
            const existingBadge = card.querySelector(".recommendation-badge");
            if (existingBadge) {
                existingBadge.remove();
            }
        });
        nenhumaOperadoraMsg.style.display = "none"; // Garante que a mensagem de 'nenhuma operadora' esteja oculta
    }

    /**
     * Função para abrir o pop-up de contato. (Nº 2)
     */
    function openContactPopup() {
        togglePopup(contactPopup, true);
        contactPopupShown = true;
    }

    /**
     * Função para fechar o pop-up de contato. (Nº 2)
     */
    function closeContactPopup() {
        togglePopup(contactPopup, false);
    }

    /**
     * Função para abrir o pop-up de saída. (Nº 4)
     * @param {string} region Região selecionada pelo usuário, se houver.
     * @param {string} profession Profissão selecionada pelo usuário, se houver.
     */
    function openExitIntentPopup(region, profession) {
        if (exitPopupShown || contactPopupShown) return; // Não mostra se já mostrou ou se o outro pop-up está aberto

        let personalizedText = "Não encontrou o que procurava? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!";
        if (profession && region) {
            personalizedText = `Interessado em planos para **${profession}** em **${region.charAt(0).toUpperCase() + region.slice(1)}**? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!`;
        } else if (profession) {
            personalizedText = `Interessado em planos para **${profession}**? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!`;
        } else if (region) {
            personalizedText = `Interessado em planos em **${region.charAt(0).toUpperCase() + region.slice(1)}**? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!`;
        }
        
        exitPopupText.innerHTML = personalizedText; // Usa innerHTML para permitir o bold

        togglePopup(exitIntentPopup, true);
        exitPopupShown = true;
        trackEvent('Exit_Intent_Popup_Displayed', { region: region, profession: profession, vidas: userSelections.vidas }); // Tracking (Nº 3)
    }

    /**
     * Função para fechar o pop-up de saída. (Nº 4)
     */
    function closeExitIntentPopup() {
        togglePopup(exitIntentPopup, false);
    }

    /**
     * Função para exibir a mensagem flutuante. (Nº 5)
     */
    function toggleFloatingMessage(show) {
        if (show) {
            let message = "Precisa de ajuda para encontrar o plano ideal?";
            if (userSelections.profissao && userSelections.vidas === '3+') {
                message = `Silas Novaes é especialista em planos empresariais para mais de 3 vidas. Fale conosco!`;
            } else if (userSelections.profissao) {
                message = `Planos de saúde personalizados para ${userSelections.profissao.charAt(0).toUpperCase() + userSelections.profissao.slice(1)}!`;
            } else if (userSelections.regiao) {
                message = `Descubra planos na região ${userSelections.regiao.charAt(0).toUpperCase() + userSelections.regiao.slice(1)}!`;
            }
            floatingMessageText.textContent = message;
            floatingMessage.classList.add("active");
            floatingMessageShown = true;
        } else {
            floatingMessage.classList.remove("active");
        }
    }

    /**
     * Função para rastrear eventos importantes. (Nº 3 & 6)
     * Pode ser integrada com Google Analytics ou outro serviço de BI.
     * @param {string} eventName Nome do evento.
     * @param {object} eventData Dados associados ao evento.
     */
    function trackEvent(eventName, eventData) {
        console.log(`Tracking Event: ${eventName}`, eventData);
        // Exemplo de integração com Google Analytics 4 (gtag.js):
        // if (typeof gtag === 'function') {
        //     gtag('event', eventName, eventData);
        // }
        // Exemplo de integração com Google Tag Manager (dataLayer):
        // if (typeof dataLayer === 'object') {
        //     dataLayer.push({
        //         'event': eventName,
        //         ...eventData
        //     });
        // }
    }

    /**
     * Função para relatar o desempenho dos filtros. (Nº 6)
     */
    function trackFilterPerformance() {
        const visibleCardsCount = document.querySelectorAll(".operadora-card:not(.hidden)").length;
        const totalCardsCount = operadorasCards.length;
        
        trackEvent('Filter_Performance', {
            regiao_selecionada: userSelections.regiao,
            profissao_selecionada: userSelections.profissao,
            vidas_selecionadas: userSelections.vidas,
            operadoras_visiveis: visibleCardsCount,
            operadoras_total: totalCardsCount,
            nenhuma_operadora_exibida: visibleCardsCount === 0
        });
    }


    // --- Event Listeners ---

    // Adiciona event listeners para os radio buttons dos passos do formulário
    document.querySelectorAll(".discovery-step .option-card input[type='radio']").forEach(radio => {
        radio.addEventListener("change", function() {
            const groupName = this.name; // 'regiao', 'profissao', 'vidas'
            userSelections[groupName] = this.value; // Atualiza a seleção do usuário

            applyFilters(); // Aplica os filtros imediatamente

            // Avança para o próximo passo
            const nextStepId = this.dataset.nextStep;
            if (nextStepId) {
                showStep(nextStepId);
                // Exibe a mensagem flutuante após a primeira interação de filtro
                if (!floatingMessageShown) {
                    toggleFloatingMessage(true);
                }
            }
        });
    });

    // Event listener para o botão de reset
    if (resetButton) {
        resetButton.addEventListener("click", resetFilters);
    }

    // Lógica para mostrar/ocultar campos adicionais no FORMULÁRIO POP-UP de contato (Nº 2)
    if (popupTemPlanoSelect) {
        popupTemPlanoSelect.addEventListener('change', function() {
            if (this.value === 'sim') {
                popupGrupoPlanoAtual.style.display = 'block';
                popupGrupoValorAtual.style.display = 'block';
            } else {
                popupGrupoPlanoAtual.style.display = 'none';
                popupGrupoValorAtual.style.display = 'none';
                document.getElementById('popup-plano-atual').value = '';
                document.getElementById('popup-valor-atual').value = '';
            }
        });
    }

    // Lógica de submissão do formulário de contato do POP-UP (Nº 2)
    if (popupContactForm) {
        popupContactForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Evita o recarregamento da página

            // Coleta os dados do formulário
            const formData = new FormData(popupContactForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Adiciona as seleções de filtro ao objeto de dados
            data.filtroRegiao = userSelections.regiao;
            data.filtroProfissao = userSelections.profissao;
            data.filtroVidas = userSelections.vidas;
            
            trackEvent('Contact_Form_Submission', data); // Tracking (Nº 3)

            // TODO: Aqui você implementaria o envio real desses dados para o seu backend/serviço.
            // Ex: fetch('/api/send-contact', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } })
            //     .then(response => response.json())
            //     .then(result => {
            //         console.log('Sucesso:', result);
            //         alert('Sua solicitação foi enviada com sucesso! Em breve entraremos em contato.');
            //         closeContactPopup(); // Fecha o pop-up
            //         popupContactForm.reset(); // Limpa o formulário
            //         resetFilters(); // Opcional: reiniciar os filtros após o envio do formulário
            //     })
            //     .catch(error => {
            //         console.error('Erro ao enviar:', error);
            //         alert('Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.');
            //     });

            console.log("Dados do formulário para envio:", data);
            alert('Formulário simulado enviado! Verifique o console para os dados coletados.');
            closeContactPopup(); // Fecha o pop-up
            popupContactForm.reset(); // Limpa o formulário
            resetFilters(); // Reinicia os filtros após a simulação
        });
    }

    // Abertura do pop-up de contato através de botões com classe 'popup-trigger-button'
    popupTriggerButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            openContactPopup();
        });
    });

    // Fechar pop-ups ao clicar no botão X
    closeContactPopupButton.addEventListener("click", closeContactPopup);
    closeExitIntentPopupButton.addEventListener("click", closeExitIntentPopup);
    // Fechar pop-ups ao clicar fora (no overlay)
    contactPopup.addEventListener("click", function(event) {
        if (event.target === contactPopup) {
            closeContactPopup();
        }
    });
    exitIntentPopup.addEventListener("click", function(event) {
        if (event.target === exitIntentPopup) {
            closeExitIntentPopup();
        }
    });

    // Controlar a exibição do pop-up de contato no scroll (Nº 2)
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.2 // 20% do elemento visível
    };

    const operadorasSectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Se a seção de operadoras está visível e o pop-up de contato ainda não foi mostrado
            if (entry.isIntersecting && !contactPopupShown && userSelections.regiao && userSelections.profissao && userSelections.vidas) {
                openContactPopup();
                observer.unobserve(entry.target); // Para de observar após mostrar
            }
        });
    }, observerOptions);

    operadorasSectionObserver.observe(operadorasSection);


    // Lógica para Pop-up de Saída (Exit-Intent Pop-up) (Nº 4)
    document.addEventListener('mouseleave', function(event) {
        // Verifica se o mouse saiu pela parte superior da janela (geralmente indica intenção de fechar)
        if (event.clientY <= 0) {
            // Adiciona um pequeno atraso para não ser muito intrusivo
            setTimeout(() => {
                openExitIntentPopup(userSelections.regiao, userSelections.profissao);
            }, 1000); // 1 segundo de atraso
        }
    });

    // Fechar mensagem flutuante (Nº 5)
    if (closeFloatingMessageButton) {
        closeFloatingMessageButton.addEventListener('click', () => toggleFloatingMessage(false));
    }


    // Inicia o processo exibindo o primeiro passo ao carregar a página
    showStep("step-regiao");
    // Garante que todas as operadoras estão visíveis no início (userSelections estão nulas)
    applyFilters(); 
    trackEvent('Page_Load_Operadoras', { initial_state: 'all_visible' }); // Tracking inicial (Nº 3)
});