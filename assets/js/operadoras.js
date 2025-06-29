// assets/js/operadoras.js

document.addEventListener("DOMContentLoaded", function() {
    // Referências aos elementos HTML
    const discoverySteps = document.querySelectorAll(".discovery-step");
    const operadorasCards = document.querySelectorAll(".operadora-card");
    const nenhumaOperadoraMsg = document.getElementById("nenhuma-operadora");
    const resetButton = document.getElementById("reset-filters");
    const messageAboveReset = document.getElementById("message-above-reset");
    const discoveryFormContainer = document.querySelector(".discovery-form-container"); 

    // Elementos do Pop-up de Contato
    const contactPopup = document.getElementById("contact-popup");
    const closeContactPopupButton = contactPopup.querySelector(".close-popup-btn");
    const popupTemPlanoSelect = document.getElementById("popup-tem-plano");
    const popupGrupoPlanoAtual = document.getElementById("popup-grupo-plano-atual");
    const popupGrupoValorAtual = document.getElementById("popup-grupo-valor-atual");
    const popupContactForm = document.getElementById("popup-contact-form");

    // Elementos do Pop-up de Saída
    const exitIntentPopup = document.getElementById("exit-intent-popup");
    const closeExitIntentPopupButton = exitIntentPopup.querySelector(".close-popup-btn");
    const exitPopupTitle = document.getElementById("exit-popup-title");
    const exitPopupText = document.getElementById("exit-popup-text");
    const openContactFormButtons = document.querySelectorAll(".open-contact-form-btn"); 

    // Elementos da Mensagem Flutuante
    const floatingMessage = document.getElementById("floating-message");
    const floatingMessageText = floatingMessage.querySelector("p"); // Aponta diretamente para o <p>
    const closeFloatingMessageButton = floatingMessage.querySelector(".close-floating-message-btn");

    // Objeto para armazenar as seleções do usuário
    let userSelections = {
        regiao: null,
        profissao: null,
        vidas: null
    };

    // Variáveis de controle para exibição de pop-ups e mensagens
    let contactPopupAutoShown = false; 
    let exitPopupShown = false; 
    let floatingMessageDisplayed = false; 

    // Objeto de regras de negócio das operadoras
    const operadoraRules = {
        'bradesco': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj'],
            vidas: ['3+'],
            prioridadeRecomendacao: 1
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
            profissoes: ['cnpj'],
            vidas: ['3+'],
            prioridadeRecomendacao: 4
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
            vidas: ['1', '2', '3+'], 
            prioridadeRecomendacao: 9
        },
        'blue': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'], 
            prioridadeRecomendacao: 10
        },
        'placeholder': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'],
            prioridadeRecomendacao: 99
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
            document.body.style.overflow = "hidden"; 
        } else {
            popupElement.classList.remove("active");
            document.body.style.overflow = ""; 
        }
    }

    /**
     * Exibe o passo atual do formulário e oculta os outros.
     * @param {string} stepId O ID do elemento do passo a ser exibido (ex: 'step-regiao').
     */
    function showStep(stepId) {
        // Terceiro Ajuste: Garante que os passos individuais estão visíveis para rolagem
        discoverySteps.forEach(step => {
            step.classList.remove("active", "hidden-step"); // Remove hidden-step também
        });
        
        // Esconde a mensagem "Veja abaixo..." quando um novo passo é exibido
        messageAboveReset.classList.remove('active');

        const currentStep = document.getElementById(stepId);
        if (currentStep) {
            currentStep.classList.add("active");
            currentStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Aplica os filtros aos cards das operadoras com base nas seleções do usuário.
     * Também lida com a recomendação da melhor operadora.
     */
    function applyFilters() {
        let algumaVisivel = false;
        let recommendedOperadoraCard = null;
        let lowestPriority = Infinity;

        operadorasCards.forEach(card => {
            card.classList.remove("recommended");
            const existingBadge = card.querySelector(".recommendation-badge");
            if (existingBadge) {
                existingBadge.remove();
            }
        });

        operadorasCards.forEach(card => {
            const operadoraId = card.id;
            const isPlaceholder = card.classList.contains('placeholder');
            const rules = operadoraRules[operadoraId] || (isPlaceholder ? operadoraRules['placeholder'] : null);
            
            if (!rules) {
                card.style.display = "none";
                card.classList.add("hidden");
                return;
            }

            let matchRegiao = true;
            if (userSelections.regiao) {
                if (userSelections.regiao === 'nacional') {
                    matchRegiao = rules.regioes.includes('nacional') || 
                                  (rules.regioes.includes('norte') && rules.regioes.includes('nordeste') && 
                                   rules.regioes.includes('sudeste') && rules.regioes.includes('sul') && 
                                   rules.regioes.includes('centro-oeste'));
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
                
                if (userSelections.vidas === '2') {
                    if (operadoraId === 'amil' && userSelections.profissao === 'cnpj') {
                        // Amil aceita 2 vidas para CNPJ (Empresarial)
                    } else if (operadoraId === 'sulamerica' || operadoraId === 'ampla' || operadoraId === 'blue') {
                        matchVidas = false;
                    }
                } else if (userSelections.vidas === '3+') {
                    if ((operadoraId === 'bradesco' || operadoraId === 'unimed') && userSelections.profissao !== 'cnpj') {
                        matchProfissao = false;
                    }
                } else if (userSelections.vidas === '1') {
                     if ((operadoraId === 'bradesco' || operadoraId === 'unimed')) {
                        matchVidas = false;
                    }
                }

                if ((operadoraId === 'select' || operadoraId === 'sbsaude') && userSelections.vidas !== '1') {
                    matchVidas = false;
                }
            }

            if (matchRegiao && matchProfissao && matchVidas) {
                card.style.display = "flex";
                card.classList.remove("hidden");
                algumaVisivel = true;

                if (userSelections.regiao && userSelections.profissao && userSelections.vidas) {
                    const currentPriority = rules.prioridadeRecomendacao;
                    if (currentPriority < lowestPriority) {
                        lowestPriority = currentPriority;
                        recommendedOperadoraCard = card;
                    }
                }
            } else {
                card.style.display = "none";
                card.classList.add("hidden");
            }
        });

        if (recommendedOperadoraCard) {
            recommendedOperadoraCard.classList.add("recommended");
            const existingBadge = recommendedOperadoraCard.querySelector(".recommendation-badge");
            if (existingBadge) {
                existingBadge.remove();
            }
            const badge = document.createElement("span");
            badge.classList.add("recommendation-badge");
            badge.textContent = "Melhor opção para você";
            recommendedOperadoraCard.prepend(badge);
        }

        if (algumaVisivel) {
            nenhumaOperadoraMsg.style.display = "none";
        } else {
            nenhumaOperadoraMsg.style.display = "block";
        }

        // Terceiro Ajuste: Mostra a mensagem "Veja abaixo..." quando todos os filtros são preenchidos
        if (userSelections.regiao && userSelections.profissao && userSelections.vidas) {
            messageAboveReset.classList.add('active');
        } else {
            messageAboveReset.classList.remove('active');
        }

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

        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });

        togglePopup(contactPopup, false);
        contactPopupAutoShown = false; 
        togglePopup(exitIntentPopup, false);
        exitPopupShown = false; 
        toggleFloatingMessage(false);
        floatingMessageDisplayed = false; 

        popupGrupoPlanoAtual.style.display = 'none';
        popupGrupoValorAtual.style.display = 'none';
        popupContactForm.reset();

        // Terceiro Ajuste: Garante que todos os passos estejam visíveis e não ocultos com hidden-step
        discoverySteps.forEach(step => {
            step.classList.remove("active", "hidden-step"); // Remove active e hidden-step
        });
        showStep("step-regiao"); // Volta para o primeiro passo

        operadorasCards.forEach(card => {
            card.style.display = "flex";
            card.classList.remove("hidden", "recommended");
            const existingBadge = card.querySelector(".recommendation-badge");
            if (existingBadge) {
                existingBadge.remove();
            }
        });
        nenhumaOperadoraMsg.style.display = "none";
        messageAboveReset.classList.remove('active'); // Oculta a mensagem "Veja abaixo..."
    }

    /**
     * Função para abrir o pop-up de contato.
     */
    function openContactPopup() {
        togglePopup(contactPopup, true);
        trackEvent('Contact_Popup_Opened', { type: 'manual' });
    }

    /**
     * Função para fechar o pop-up de contato.
     */
    function closeContactPopup() {
        togglePopup(contactPopup, false);
    }

    /**
     * Função para abrir o pop-up de saída.
     * @param {string} region Região selecionada pelo usuário, se houver.
     * @param {string} profession Profissão selecionada pelo usuário, se houver.
     */
    function openExitIntentPopup(region, profession) {
        if (exitPopupShown || contactPopup.classList.contains('active')) return;

        let personalizedText = "Não encontrou o que procurava? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!";
        let displayRegion = region ? region.toUpperCase() : ''; // Altere esta linha para deixar a região inteira em maiúsculas
        let displayProfession = profession ? profession.toUpperCase() : ''; // Altere esta linha para deixar a profissão inteira em maiúsculas

        if (displayProfession && displayRegion) {
            personalizedText = `Interessado em planos para <strong>${displayProfession}</strong> na região <strong>${displayRegion}</strong>? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!`;
        } else if (displayProfession) {
            personalizedText = `Interessado em planos para <strong>${displayProfession}</strong>? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!`;
        } else if (displayRegion) {
            personalizedText = `Interessado em planos em <strong>${displayRegion}</strong>? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!`;
        }
        
        exitPopupText.innerHTML = personalizedText;

        togglePopup(exitIntentPopup, true);
        exitPopupShown = true;
        trackEvent('Exit_Intent_Popup_Displayed', { region: region, profession: profession, vidas: userSelections.vidas });
    }

    /**
     * Função para fechar o pop-up de saída.
     */
    function closeExitIntentPopup() {
        togglePopup(exitIntentPopup, false);
    }

    /**
     * Função para exibir a mensagem flutuante.
     * @param {boolean} show Se deve exibir (true) ou ocultar (false).
     */
    function toggleFloatingMessage(show) {
        if (show) {
            let message = "Descubra planos na região";
            let displayRegion = userSelections.regiao ? userSelections.regiao.charAt(0).toUpperCase() + userSelections.regiao.slice(1) : '';

            // Segundo Ajuste: Padroniza a frase para "Descubra planos na região X!"
            if (displayRegion) {
                message = `Descubra planos na região ${displayRegion}!`;
            } else {
                message = "Encontre o plano de saúde ideal!"; // Mensagem padrão se a região não foi selecionada
            }
            
            floatingMessageText.textContent = message;
            floatingMessage.classList.add("active");
            floatingMessageDisplayed = true;
            trackEvent('Floating_Message_Displayed', { region: userSelections.regiao, profession: userSelections.profissao, vidas: userSelections.vidas });
        } else {
            floatingMessage.classList.remove("active");
        }
    }

    /**
     * Função para rastrear eventos importantes.
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
     * Função para relatar o desempenho dos filtros.
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
            const groupName = this.name;
            userSelections[groupName] = this.value;

            applyFilters();

            const nextAction = this.dataset.nextAction;
            const nextStepId = this.dataset.nextStep;

            if (nextAction === "scroll-to-operadoras") {
                // Terceiro Ajuste: Oculta apenas os passos de pergunta, não o contêiner principal
                discoverySteps.forEach(step => {
                    step.classList.add('hidden-step'); 
                });
                
                // Quarto Ajuste: Rola para a seção de operadoras com offset para o header fixo
                const targetSection = document.getElementById('lista-operadoras-titulo');
                const headerHeight = document.querySelector('header.bloco').offsetHeight; // Altura do cabeçalho
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - headerHeight - 20, // 20px de padding extra
                        behavior: 'smooth'
                    });
                }
                
                if (!contactPopupAutoShown) {
                    openContactPopup();
                    contactPopupAutoShown = true;
                }
                
                if (!floatingMessageDisplayed) {
                    toggleFloatingMessage(true);
                }
            } else if (nextStepId) {
                showStep(nextStepId);
                if (!floatingMessageDisplayed) {
                    toggleFloatingMessage(true);
                }
            }
        });
    });

    // Event listener para o botão de reset
    if (resetButton) {
        resetButton.addEventListener("click", resetFilters);
    }

    // Lógica para mostrar/ocultar campos adicionais no FORMULÁRIO POP-UP de contato
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

    // Lógica de submissão do formulário de contato do POP-UP
    if (popupContactForm) {
        popupContactForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const formData = new FormData(popupContactForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            data.filtroRegiao = userSelections.regiao;
            data.filtroProfissao = userSelections.profissao;
            data.filtroVidas = userSelections.vidas;
            
            trackEvent('Contact_Form_Submission', data);

            // TODO: Aqui você implementaria o envio real desses dados para o seu backend/serviço.
            console.log("Dados do formulário para envio:", data);
            alert('Formulário simulado enviado! Verifique o console para os dados coletados.');
            closeContactPopup();
            popupContactForm.reset();
            resetFilters();
        });
    }

    // Segundo Ajuste: Botões estilizados nos cards de operadoras abrem o pop-up de contato
    // Reutiliza a classe 'open-contact-form-btn' para os novos botões nos cards
    openContactFormButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            // Apenas feche o exit-intent-popup se ele estiver aberto
            if (exitIntentPopup.classList.contains('active')) {
                closeExitIntentPopup(); 
            }
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

    // Controlar a exibição do pop-up de contato no scroll
    const operadorasSectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !contactPopupAutoShown && 
                userSelections.regiao && userSelections.profissao && userSelections.vidas) {
                openContactPopup();
                contactPopupAutoShown = true;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    // O observador deve observar o elemento que é visível quando o scroll chega nas operadoras
    // A seção de operadoras principal é um bom alvo.
    operadorasSectionObserver.observe(document.querySelector(".operadoras-section")); 


    // Lógica para Pop-up de Saída (Exit-Intent Pop-up)
    document.addEventListener('mouseleave', function(event) {
        if (event.clientY <= 0) {
            setTimeout(() => {
                openExitIntentPopup(userSelections.regiao, userSelections.profissao);
            }, 1000);
        }
    });

    // Fechar mensagem flutuante
    if (closeFloatingMessageButton) {
        closeFloatingMessageButton.addEventListener('click', () => toggleFloatingMessage(false));
    }

    // Inicia o processo exibindo o primeiro passo ao carregar a página
    showStep("step-regiao");
    applyFilters(); 
    trackEvent('Page_Load_Operadoras', { initial_state: 'all_visible' });

    // Oculta a mensagem "Veja abaixo..." inicialmente
    messageAboveReset.classList.remove('active');
});