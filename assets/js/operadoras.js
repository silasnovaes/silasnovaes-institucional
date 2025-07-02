// assets/js/operadoras.js

document.addEventListener("DOMContentLoaded", function() {
    // Referências aos elementos HTML
    const discoverySteps = document.querySelectorAll(".discovery-step");
    const operadorasCards = document.querySelectorAll(".operadora-card");
    const nenhumaOperadoraMsg = document.getElementById("nenhuma-operadora");
    const resetButton = document.getElementById("reset-filters");
    const messageAboveReset = document.getElementById("message-above-reset");
    // const discoveryFormContainer = document.querySelector(".discovery-form-container"); // Não mais usado diretamente, mas mantido como referência

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
    const openContactFormButtons = document.querySelectorAll(".open-contact-form-btn"); // Seleciona todos os botões com essa classe

    // Elementos da Mensagem Flutuante
    const floatingMessage = document.getElementById("floating-message");
    const floatingMessageText = floatingMessage.querySelector("p"); // Aponta diretamente para o <p>
    const closeFloatingMessageButton = floatingMessage.querySelector(".close-floating-message-btn");

    // NOVO POP-UP: Informações da Ferramenta
    const toolInfoPopup = document.getElementById("tool-info-popup");
    const closeToolInfoPopupButtons = toolInfoPopup ? toolInfoPopup.querySelectorAll(".close-popup-btn") : []; // Seleciona todos os botões de fechar dentro dele

    // Objeto para armazenar as seleções do usuário
    let userSelections = {
        regiao: null,
        profissao: null,
        vidas: null
    };

    // Variáveis de controle para exibição de pop-ups e mensagens
    let contactPopupAutoShown = sessionStorage.getItem('contactPopupAutoShown_Operadoras') === 'true'; 
    let exitPopupShown = sessionStorage.getItem('exitPopupShown_Operadoras') === 'true'; 
    let floatingMessageDisplayed = sessionStorage.getItem('floatingMessageDisplayed_Operadoras') === 'true'; 
    let toolInfoPopupShown = sessionStorage.getItem('toolInfoPopupShown_Operadoras') === 'true';

    // Objeto de regras de negócio das operadoras
    // NOTA: Para cenários reais, estas regras deveriam vir de um backend ou um JSON externo.
    // As "prioridadeRecomendacao" são usadas para determinar qual card recebe o selo de "Melhor opção".
    const operadoraRules = {
        'unimed': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'],
            prioridadeRecomendacao: 4 // Ajustado para ser menos prioritário que Bradesco/Amil/SulAmérica
        },
        'bradesco': {
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj'], // Bradesco foca em CNPJ, especialmente 3+ vidas
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
        // Placeholders para demonstrar filtragem
        'placeholder': { // Usado para cards com id='placeholder' ou similar
            regioes: ['norte', 'nordeste', 'sudeste', 'sul', 'centro-oeste', 'nacional'],
            profissoes: ['cnpj', 'estudante', 'servidor', 'autonomo', 'superior', 'clt'],
            vidas: ['1', '2', '3+'],
            prioridadeRecomendacao: 99
        }
    };

    /**
     * Helper para exibir/ocultar pop-ups.
     * Controla também o scroll do body.
     * @param {HTMLElement} popupElement O elemento do pop-up (overlay).
     * @param {boolean} show Se deve exibir (true) ou ocultar (false).
     */
    function togglePopup(popupElement, show) {
        if (!popupElement) return; // Garante que o elemento existe

        if (show) {
            popupElement.classList.add("active");
            document.body.classList.add("no-scroll"); // Adiciona classe para bloquear scroll
        } else {
            popupElement.classList.remove("active");
            document.body.classList.remove("no-scroll"); // Remove classe para reabilitar scroll
        }
    }

    /**
     * Exibe o passo atual do formulário e oculta os outros.
     * @param {string} stepId O ID do elemento do passo a ser exibido (ex: 'step-regiao').
     */
    function showStep(stepId) {
        // Garante que os passos individuais estão visíveis para rolagem
        discoverySteps.forEach(step => {
            step.classList.remove("active");
            step.classList.add("hidden-step"); // Oculta com transição
        });
        
        // Esconde a mensagem "Veja abaixo..." quando um novo passo é exibido
        messageAboveReset.classList.remove('active');

        const currentStep = document.getElementById(stepId);
        if (currentStep) {
            currentStep.classList.remove("hidden-step"); // Remove ocultação
            currentStep.classList.add("active"); // Ativa
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

        // Limpa estados de recomendação anteriores
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
                    // Uma operadora é considerada "nacional" se explicitamente marcada como 'nacional'
                    // OU se suas regras cobrem todas as regiões (simplificado para este exemplo)
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
                // Lógica mais complexa para número de vidas
                if (userSelections.vidas === '1') {
                    matchVidas = rules.vidas.includes('1');
                } else if (userSelections.vidas === '2') {
                    matchVidas = rules.vidas.includes('2') || rules.vidas.includes('3+'); // Se aceita 3+, geralmente aceita 2
                } else if (userSelections.vidas === '3+') {
                    matchVidas = rules.vidas.includes('3+');
                }
                
                // Exceções e regras específicas baseadas no ICP
                // Bradesco e Unimed costumam ser mais restritos a 3+ vidas PJ
                if ((operadoraId === 'bradesco' || operadoraId === 'unimed') && userSelections.vidas !== '3+') {
                    matchVidas = false;
                }
                // Amil aceita 1+ mas é forte em Adesão para 1-2 vidas.
                // Select e SB Saúde focam mais em 1 vida em algumas regiões.
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

        // Mostra a mensagem "Veja abaixo..." quando todos os filtros são preenchidos
        if (userSelections.regiao && userSelections.profissao && userSelections.vidas) {
            messageAboveReset.classList.add('active');
            // Exibe o pop-up de informações da ferramenta, se não foi mostrado
            if (!toolInfoPopupShown) {
                setTimeout(() => {
                    togglePopup(toolInfoPopup, true);
                    toolInfoPopupShown = true;
                    sessionStorage.setItem('toolInfoPopupShown_Operadoras', 'true');
                    UserTracker.pushToDataLayer({
                        'event': 'tool_info_popup_displayed',
                        'page_path': window.location.pathname,
                        'user_selections': userSelections
                    });
                }, 1500); // Pequeno delay para não sobrepor a rolagem
            }
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

        // Garante que todos os pop-ups e mensagens flutuantes estão fechados
        togglePopup(contactPopup, false);
        contactPopupAutoShown = false; 
        sessionStorage.setItem('contactPopupAutoShown_Operadoras', 'false');

        togglePopup(exitIntentPopup, false);
        exitPopupShown = false; 
        sessionStorage.setItem('exitPopupShown_Operadoras', 'false');

        toggleFloatingMessage(false);
        floatingMessageDisplayed = false; 
        sessionStorage.setItem('floatingMessageDisplayed_Operadoras', 'false');

        togglePopup(toolInfoPopup, false);
        toolInfoPopupShown = false;
        sessionStorage.setItem('toolInfoPopupShown_Operadoras', 'false');

        // Reseta o formulário de contato do pop-up
        popupGrupoPlanoAtual.style.display = 'none';
        popupGrupoValorAtual.style.display = 'none';
        popupContactForm.reset();

        // Garante que todos os passos estejam visíveis e não ocultos com hidden-step
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
        UserTracker.pushToDataLayer({
            'event': 'filters_reset',
            'page_path': window.location.pathname
        });
    }

    /**
     * Função para abrir o pop-up de contato.
     */
    function openContactPopup() {
        togglePopup(contactPopup, true);
        UserTracker.pushToDataLayer({ 'event': 'contact_popup_opened', 'type': 'manual_cta', 'page_path': window.location.pathname });
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
        if (exitPopupShown || contactPopup.classList.contains('active') || toolInfoPopup.classList.contains('active')) {
            console.log("Exit Intent: Popup já exibido ou outro popup ativo. Abortando.");
            return;
        }

        let personalizedText = "Não encontrou o que procurava? Deixe seus dados e um especialista te ajuda a encontrar o plano ideal!";
        let displayRegion = region ? region.replace(/-/g, ' ').toUpperCase() : ''; 
        let displayProfession = profession ? profession.replace(/-/g, ' ').toUpperCase() : ''; 

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
        sessionStorage.setItem('exitPopupShown_Operadoras', 'true');
        UserTracker.pushToDataLayer({ 'event': 'exit_intent_popup_displayed', 'region': region, 'profession': profession, 'vidas': userSelections.vidas, 'page_path': window.location.pathname });
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
        if (show && !floatingMessageDisplayed) {
            let message = "Descubra planos na região";
            let displayRegion = userSelections.regiao ? userSelections.regiao.charAt(0).toUpperCase() + userSelections.regiao.slice(1) : '';

            // Padroniza a frase para "Descubra planos na região X!"
            if (displayRegion) {
                message = `Descubra planos na região ${displayRegion}!`;
            } else {
                message = "Encontre o plano de saúde ideal!"; // Mensagem padrão se a região não foi selecionada
            }
            
            floatingMessageText.textContent = message;
            floatingMessage.classList.add("active");
            floatingMessageDisplayed = true;
            sessionStorage.setItem('floatingMessageDisplayed_Operadoras', 'true');
            UserTracker.pushToDataLayer({ 'event': 'floating_message_displayed', 'region': userSelections.regiao, 'profession': userSelections.profissao, 'vidas': userSelections.vidas, 'page_path': window.location.pathname });
        } else if (!show) {
            floatingMessage.classList.remove("active");
        }
    }

    /**
     * Função para rastrear eventos importantes para o DataLayer.
     * Usa o UserTracker global para garantir consistência.
     * @param {string} eventName Nome do evento.
     * @param {object} eventData Dados associados ao evento.
     */
    function trackEvent(eventName, eventData) {
        UserTracker.pushToDataLayer(eventData); // Reutiliza a função global
    }

    /**
     * Função para relatar o desempenho dos filtros.
     */
    function trackFilterPerformance() {
        const visibleCardsCount = document.querySelectorAll(".operadora-card:not(.hidden)").length;
        const totalCardsCount = operadorasCards.length;
        
        trackEvent('Filter_Performance', {
            'event': 'filter_performance', // Nome do evento para o GA
            regiao_selecionada: userSelections.regiao,
            profissao_selecionada: userSelections.profissao,
            vidas_selecionadas: userSelections.vidas,
            operadoras_visiveis: visibleCardsCount,
            operadoras_total: totalCardsCount,
            nenhuma_operadora_exibida: visibleCardsCount === 0,
            page_path: window.location.pathname
        });
    }


    // --- Event Listeners ---

    // Adiciona event listeners para os radio buttons dos passos do formulário
    document.querySelectorAll(".discovery-step .option-card input[type='radio']").forEach(radio => {
        radio.addEventListener("change", function() {
            const groupName = this.name;
            userSelections[groupName] = this.value;

            applyFilters(); // Aplica filtros e decide a recomendação

            const nextAction = this.dataset.nextAction;
            const nextStepId = this.dataset.nextStep;

            if (nextAction === "scroll-to-operadoras") {
                // Oculta apenas os passos de pergunta, não o contêiner principal
                discoverySteps.forEach(step => {
                    step.classList.add('hidden-step'); 
                });
                
                // Rola para a seção de operadoras com offset para o header fixo
                const targetSection = document.getElementById('lista-operadoras-titulo');
                const headerHeight = document.querySelector('header.bloco').offsetHeight; // Altura do cabeçalho
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - headerHeight - 20, // 20px de padding extra
                        behavior: 'smooth'
                    });
                }
                
                // Pop-up de contato automático após as escolhas, se ainda não mostrado
                if (!contactPopupAutoShown) {
                    setTimeout(() => {
                        openContactPopup();
                        contactPopupAutoShown = true;
                        sessionStorage.setItem('contactPopupAutoShown_Operadoras', 'true');
                    }, 500); // Pequeno atraso para não ser muito abrupto
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
            const data = {
                event: 'form_submission', // Evento para o GA
                form_name: 'operadoras_cotacao_popup',
                page_path: window.location.pathname,
                // Coleta de dados do formulário
                nome: formData.get('nome'),
                email: formData.get('email'),
                telefone: formData.get('telefone'),
                tem_plano: formData.get('tem-plano'),
                plano_atual: formData.get('plano-atual') || 'N/A',
                valor_atual: formData.get('valor-atual') || 'N/A',
                formacao_area: formData.get('formacao-area') || 'N/A',
                idades: formData.get('idades'),
                doenca_preexistente: formData.get('doenca-preexistente'),
                // Adiciona dados dos filtros
                filtro_regiao: userSelections.regiao,
                filtro_profissao: userSelections.profissao,
                filtro_vidas: userSelections.vidas
            };
            
            UserTracker.pushToDataLayer(data); // Envia para o dataLayer global

            // TODO: Aqui você implementaria o envio real desses dados para o seu backend/serviço de e-mail/CRM.
            console.log("Dados do formulário para envio (via DataLayer):", data);
            alert('Formulário de Cotação simulado enviado! Verifique o console para os dados coletados e o DataLayer.');
            
            closeContactPopup();
            popupContactForm.reset();
            resetFilters(); // Resetar tudo após submissão bem-sucedida
        });
    }

    // Botões estilizados nos cards de operadoras e mensagem flutuante abrem o pop-up de contato
    openContactFormButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            // Apenas feche outros pop-ups se eles estiverem abertos
            if (exitIntentPopup.classList.contains('active')) {
                closeExitIntentPopup(); 
            }
            if (toolInfoPopup.classList.contains('active')) {
                togglePopup(toolInfoPopup, false);
            }
            openContactPopup();
        });
    });

    // Fechar pop-ups ao clicar no botão X
    if (closeContactPopupButton) closeContactPopupButton.addEventListener("click", closeContactPopup);
    if (closeExitIntentPopupButton) closeExitIntentPopupButton.addEventListener("click", closeExitIntentPopup);
    // Adiciona listener para fechar o NOVO pop-up da ferramenta
    closeToolInfoPopupButtons.forEach(btn => {
        btn.addEventListener("click", () => togglePopup(toolInfoPopup, false));
    });

    // Fechar pop-ups ao clicar fora (no overlay)
    if (contactPopup) contactPopup.addEventListener("click", function(event) {
        if (event.target === contactPopup) {
            closeContactPopup();
        }
    });
    if (exitIntentPopup) exitIntentPopup.addEventListener("click", function(event) {
        if (event.target === exitIntentPopup) {
            closeExitIntentPopup();
        }
    });
    // Fechar NOVO pop-up da ferramenta ao clicar fora
    if (toolInfoPopup) toolInfoPopup.addEventListener("click", function(event) {
        if (event.target === toolInfoPopup) {
            togglePopup(toolInfoPopup, false);
        }
    });


    // Lógica para Pop-up de Saída (Exit-Intent Pop-up)
    document.addEventListener('mouseleave', function(event) {
        // Dispara apenas se o mouse sair para fora da janela (y < 0) e não houver pop-ups abertos
        if (event.clientY <= 0 && 
            !contactPopup.classList.contains('active') && 
            !toolInfoPopup.classList.contains('active')) {
            setTimeout(() => {
                openExitIntentPopup(userSelections.regiao, userSelections.profissao);
            }, 1000);
        }
    });

    // Fechar mensagem flutuante
    if (closeFloatingMessageButton) {
        closeFloatingMessageButton.addEventListener('click', () => toggleFloatingMessage(false));
    }

    // Inicializa o processo exibindo o primeiro passo ao carregar a página
    showStep("step-regiao");
    applyFilters(); // Aplica os filtros iniciais (todos visíveis)
    UserTracker.pushToDataLayer({ 'event': 'page_load_operadoras', 'initial_state': 'filters_not_applied' });


    // Limpa flags de sessão que podem ter sido setadas em outras páginas
    sessionStorage.removeItem('formSubmittedSuccessfully');
    sessionStorage.removeItem('clickedBannerReduceMonthly'); 
    sessionStorage.removeItem('authorityPopupShownOnAboutPage');
    sessionStorage.removeItem('trabalheComigoPopupShown');
    sessionStorage.removeItem('videoPopupShown');
    sessionStorage.removeItem('exitPopupShown'); // Limpa a flag de exit intent de trabalhe-comigo

    // Para facilitar os testes, você pode descomentar as linhas abaixo para limpar as flags
    // a cada carregamento da página "Operadoras". REMOVA EM AMBIENTE DE PRODUÇÃO!
    // sessionStorage.removeItem('contactPopupAutoShown_Operadoras');
    // sessionStorage.removeItem('exitPopupShown_Operadoras');
    // sessionStorage.removeItem('floatingMessageDisplayed_Operadoras');
    // sessionStorage.removeItem('toolInfoPopupShown_Operadoras');
});