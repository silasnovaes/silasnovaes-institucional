// assets/js/formulario.js

document.addEventListener("DOMContentLoaded", function() {
    const dynamicFormContainer = document.getElementById('dynamic-form-container');
    const formExitPopup = document.getElementById('form-exit-popup');
    const closeFormPopupButtons = formExitPopup ? formExitPopup.querySelectorAll('.close-popup-btn') : []; // Seleciona todos os botões de fechar

    // Funções auxiliares para localStorage
    const STORAGE_PREFIX = 'silas_form_data_'; // Prefixo para evitar conflitos no localStorage

    /**
     * Salva o valor de um campo no localStorage.
     * Adaptado para eventos delegados.
     * @param {HTMLElement} field - O elemento do campo (input, select, textarea).
     */
    function saveFormData(field) {
        if (!field || !field.id && !field.name) return; // Garante que o campo tenha ID ou name

        try {
            if (field.type === 'radio' || field.type === 'checkbox') {
                localStorage.setItem(STORAGE_PREFIX + field.name, field.checked ? field.value : (field.type === 'checkbox' ? field.checked : ''));
            } else if (field.tagName === 'SELECT' && field.multiple) {
                const selectedOptions = Array.from(field.options).filter(option => option.selected).map(option => option.value);
                localStorage.setItem(STORAGE_PREFIX + field.id, JSON.stringify(selectedOptions));
            } else {
                localStorage.setItem(STORAGE_PREFIX + (field.id || field.name), field.value);
            }
        } catch (e) {
            console.warn("localStorage não disponível ou quota excedida: ", e);
        }
    }

    /**
     * Carrega os dados salvos do localStorage para preencher o formulário.
     * Deve ser chamado APÓS o formulário ser injetado no DOM.
     * @param {HTMLElement} formElement - O elemento <form> recém-injetado.
     */
    function loadFormData(formElement) {
        if (!formElement) return;

        const formElements = formElement.elements;
        for (let i = 0; i < formElements.length; i++) {
            const field = formElements[i];
            const storedValue = localStorage.getItem(STORAGE_PREFIX + (field.id || field.name));

            if (storedValue !== null) {
                try {
                    if (field.type === 'radio') {
                        formElement.querySelectorAll(`input[name="${field.name}"]`).forEach(radio => {
                            if (radio.value === storedValue) {
                                radio.checked = true;
                            }
                        });
                    } else if (field.type === 'checkbox') {
                        field.checked = (storedValue === 'true' || storedValue === field.value); 
                    } else if (field.tagName === 'SELECT' && field.multiple) {
                        const values = JSON.parse(storedValue);
                        Array.from(field.options).forEach(option => {
                            option.selected = values.includes(option.value);
                        });
                    } else {
                        field.value = storedValue;
                    }
                } catch (e) {
                    console.error("Erro ao carregar dado do localStorage para campo", field.id || field.name, e);
                }
            }
        }
        // Garante que campos condicionais sejam atualizados após o carregamento
        updateConditionalFields(formElement);
    }

    /**
     * Limpa todos os dados do formulário do localStorage.
     * @param {HTMLElement} formElement - O elemento <form> atual.
     */
    function clearFormData(formElement) {
        if (!formElement) return;
        const formElements = formElement.elements;
        for (let i = 0; i < formElements.length; i++) {
            const field = formElements[i];
            if (localStorage.getItem(STORAGE_PREFIX + (field.id || field.name)) !== null) {
                localStorage.removeItem(STORAGE_PREFIX + (field.id || field.name));
            }
        }
    }

    /**
     * Atualiza a visibilidade dos campos "operadora_atual" e "tempo_plano_atual".
     * @param {HTMLElement} formElement - O elemento <form> atual.
     */
    function updateConditionalFields(formElement) {
        const planoAtualSelect = formElement.querySelector('#plano_atual');
        const campoOperadoraAtualGroup = formElement.querySelector('#campo_operadora_atual_group');
        const campoTempoPlanoAtualGroup = formElement.querySelector('#campo_tempo_plano_atual_group');

        if (!planoAtualSelect || !campoOperadoraAtualGroup || !campoTempoPlanoAtualGroup) return;

        if (planoAtualSelect.value === 'sim') {
            campoOperadoraAtualGroup.style.display = 'flex';
            campoTempoPlanoAtualGroup.style.display = 'flex';
            // Adiciona atributo required para os campos se eles forem visíveis
            campoOperadoraAtualGroup.querySelector('input').setAttribute('required', 'true');
            campoTempoPlanoAtualGroup.querySelector('input').setAttribute('required', 'true');
        } else {
            campoOperadoraAtualGroup.style.display = 'none';
            campoTempoPlanoAtualGroup.style.display = 'none';
            // Remove atributo required e limpa valores dos campos ocultados
            campoOperadoraAtualGroup.querySelector('input').removeAttribute('required');
            campoTempoPlanoAtualGroup.querySelector('input').removeAttribute('required');
            campoOperadoraAtualGroup.querySelector('input').value = '';
            campoTempoPlanoAtualGroup.querySelector('input').value = '';
            localStorage.removeItem(STORAGE_PREFIX + 'operadora_atual');
            localStorage.removeItem(STORAGE_PREFIX + 'tempo_plano_atual');
        }
    }

    /**
     * Aplica a máscara de telefone a um campo input.
     * @param {HTMLElement} phoneInput - O elemento input do telefone.
     */
    function applyPhoneMask(phoneInput) {
        if (!phoneInput) return;
        phoneInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
            value = value.substring(0, 11); // Limita a 11 dígitos para (XX) XXXXX-XXXX

            if (value.length > 2) {
                value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
            }
            if (value.length > 9) { // Para celular (9 dígitos + DDD)
                value = value.substring(0, 9) + '-' + value.substring(9);
            } else if (value.length > 8) { // Para fixos (8 dígitos + DDD)
                 value = value.substring(0, 8) + '-' + value.substring(8);
            }
            e.target.value = value;
        });
    }

    /**
     * Valida um campo individual do formulário.
     * @param {HTMLElement} field - O campo a ser validado.
     * @returns {boolean} True se o campo é válido, false caso contrário.
     */
    function validateField(field) {
        let fieldValid = true;
        const errorElement = document.getElementById(field.id + '-error');

        // Limpa estado de validação anterior
        field.classList.remove('is-invalid');
        if (errorElement) errorElement.style.display = 'none';

        if (field.hasAttribute('required')) {
            if (field.type === 'checkbox') {
                if (!field.checked) {
                    fieldValid = false;
                }
            } else if (field.type === 'radio') {
                // Para grupos de rádio, verifica se algum está selecionado
                const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
                if (!Array.from(radioGroup).some(radio => radio.checked)) {
                    fieldValid = false;
                    const groupErrorElement = document.getElementById(field.name.replace(/_/g,'-') + '-error');
                    if (groupErrorElement) groupErrorElement.style.display = 'block'; // Mostra erro do grupo
                } else {
                    const groupErrorElement = document.getElementById(field.name.replace(/_/g,'-') + '-error');
                    if (groupErrorElement) groupErrorElement.style.display = 'none'; // Esconde erro do grupo
                }
            } else if (field.value.trim() === '') {
                fieldValid = false;
            }
        }
        
        // Validações de formato, se o campo for obrigatório ou se tiver valor
        if (fieldValid && field.value.trim() !== '') {
            if (field.type === 'email' && !/\S+@\S+\.\S+/.test(field.value)) {
                fieldValid = false;
                if(errorElement) errorElement.textContent = 'Informe um e-mail válido.';
            } else if (field.type === 'tel') {
                // Regex para aceitar formatos como (XX) XXXXX-XXXX, (XX) XXXX-XXXX, XX9XXXXXXXX, XXXXXXXXXX
                const phonePattern = /^\(?[1-9]{2}\)?\s?(?:9\d{4}|[2-578]\d{3})-?\d{4}$/; 
                if (!phonePattern.test(field.value.replace(/\D/g,''))) { // Valida apenas dígitos
                    fieldValid = false;
                    if(errorElement) errorElement.textContent = 'Formato inválido. Use (00) 00000-0000.';
                }
            } else if (field.id === 'idades') {
                // Valida idades: números separados por vírgula
                const ages = field.value.split(',').map(s => parseInt(s.trim()));
                if (!ages.every(age => !isNaN(age) && age > 0 && age < 120)) { // Idade razoável
                    fieldValid = false;
                    if(errorElement) errorElement.textContent = 'Idades inválidas. Use números separados por vírgula (Ex: 30, 28, 5).';
                }
            }
        }

        if (!fieldValid) {
            field.classList.add('is-invalid');
            if (errorElement && field.type !== 'radio') { // Não mostra erro individual para rádio, já tratado no grupo
                errorElement.style.display = 'block';
            }
        }
        return fieldValid;
    }


    /**
     * Injeta o formulário apropriado no contêiner dinâmico e configura os listeners.
     */
    function injectAndSetupForm() {
        const leadTemperature = window.silasNovaesUserSession.preferences.leadTemperature;
        console.log("Formulário: Temperatura do lead para personalização:", leadTemperature);

        let formHtmlToInject;
        if (leadTemperature === 'Frio') {
            formHtmlToInject = GlobalPopupManager.createSimplifiedQuotationForm();
        } else {
            // Para Morno, Quente, Super Quente, usa a lógica dinâmica que decide entre Simplificado e Completo
            formHtmlToInject = GlobalPopupManager.getDynamicQuotationFormHtml();
        }
        
        dynamicFormContainer.innerHTML = formHtmlToInject;

        const injectedForm = dynamicFormContainer.querySelector('form');
        if (injectedForm) {
            // Reatribui o ID 'cotacao-form' e remove o 'id' que veio do GlobalPopupManager (ex: 'simplifiedQuotationForm')
            // Assim, todos os listeners podem referenciar 'cotacao-form'
            const originalFormId = injectedForm.id; // Guarda o ID original (e.g., 'simplifiedQuotationForm')
            injectedForm.id = 'cotacao-form'; // Renomeia para o ID esperado

            // Adiciona listeners para salvar e validar dados em campos DINÂMICOS
            injectedForm.addEventListener('input', function(event) {
                saveFormData(event.target);
                // Chama updateConditionalFields se o campo for o de "plano_atual"
                if (event.target.id === 'plano_atual' || event.target.id === 'popup-tem-plano') { // Adicionado popup-tem-plano para compatibilidade
                    updateConditionalFields(injectedForm);
                }
                // Dispara o UserTracker para rastrear progresso do formulário
                UserTracker.trackFormProgress(injectedForm);
            });

            injectedForm.addEventListener('change', function(event) { // Para radios/checkboxes/selects
                saveFormData(event.target);
                if (event.target.id === 'plano_atual' || event.target.id === 'popup-tem-plano') {
                    updateConditionalFields(injectedForm);
                }
                UserTracker.trackFormProgress(injectedForm);
            });
            
            injectedForm.addEventListener('focusout', function(event) { // Valida ao sair do campo
                validateField(event.target);
            });

            // Re-aplica máscara de telefone ao campo de telefone, se existir
            const phoneInput = injectedForm.querySelector('input[type="tel"]');
            if (phoneInput) {
                applyPhoneMask(phoneInput);
            }
            
            // Re-bind do listener de submissão do formulário
            injectedForm.addEventListener('submit', function(event) {
                event.preventDefault(); // Previne o envio padrão
                
                // Validação antes do envio
                let isFormValid = true;
                const formElements = injectedForm.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const field = formElements[i];
                    // Valida apenas campos visíveis e com id ou name
                    if (field.offsetParent !== null && (field.id || field.name) && field.type !== 'submit' && field.type !== 'button') {
                        // Para grupos de rádio, valida apenas uma vez por grupo
                        if (field.type === 'radio' && injectedForm.querySelector(`input[name="${field.name}"]:checked`)) {
                            // Se já tem um marcado, o grupo é válido. Pula para o próximo.
                            // Mas se for o primeiro rádio do grupo, realiza a validação do grupo.
                            if (field !== injectedForm.querySelector(`input[name="${field.name}"]`)) continue;
                        }
                        if (!validateField(field)) {
                            isFormValid = false;
                        }
                    }
                }

                const formMessage = injectedForm.querySelector('.form-message');
                if (isFormValid) {
                    console.log('Formulário válido, enviando dados (simulação)...');
                    // Simula o envio bem-sucedido
                    formMessage.textContent = 'Obrigado! Sua solicitação de cotação foi enviada com sucesso. Entraremos em contato em breve.';
                    formMessage.classList.add('success');
                    formMessage.style.display = 'block';
                    injectedForm.reset(); // Limpa o formulário após o sucesso
                    clearFormData(injectedForm); // Limpa os dados salvos no localStorage

                    // UserTracker para submissão
                    UserTracker.pushToDataLayer({
                        'event': 'form_submission',
                        'form_id': injectedForm.id,
                        'form_status': 'success',
                        'lead_temperature': leadTemperature
                    });

                    sessionStorage.removeItem('clickedBannerReduceMonthly'); 
                    sessionStorage.setItem('formSubmittedSuccessfully', 'true'); 
                    document.body.classList.remove('no-scroll'); 
                    // Volta o formulário para o estado inicial para próxima visita se quiser
                    // injectAndSetupForm(); 

                } else {
                    console.log('Formulário inválido. Por favor, corrija os erros.');
                    formMessage.textContent = 'Por favor, corrija os erros indicados no formulário.';
                    formMessage.classList.add('error');
                    formMessage.style.display = 'block';
                    document.body.classList.remove('no-scroll'); 

                    const firstInvalidField = injectedForm.querySelector('.is-invalid:not([type="hidden"]), .form-error[style*="block"]');
                    if (firstInvalidField) {
                        const targetField = firstInvalidField.closest('.form-group, .form-check-group').querySelector('input, select, textarea');
                        if (targetField) targetField.focus();
                    }
                }
            });

            // Carrega dados preexistentes após a injeção e configuração
            loadFormData(injectedForm);
            // Garante que a visibilidade dos campos condicionais seja correta após o carregamento
            updateConditionalFields(injectedForm);
        }
    }


    // === Lógica do Pop-up de Saída (Exit Intent) ===
    /**
     * Exibe o pop-up de saída se as condições forem atendidas.
     */
    function showFormExitPopup() {
        // Verifica se já não está ativo e se não há outros popups ativos
        if (formExitPopup && 
            !formExitPopup.classList.contains('active') &&
            !document.body.classList.contains('no-scroll')) // Verifica se o scroll está bloqueado por outro popup
        {
            // Condições para mostrar o pop-up:
            // 1. O usuário veio para esta página através do clique no banner da home.
            // 2. O pop-up ainda não foi mostrado nesta sessão.
            // 3. O formulário NÃO foi submetido com sucesso nesta sessão.
            if (sessionStorage.getItem('clickedBannerReduceMonthly') === 'true' && 
                !sessionStorage.getItem('formExitPopupShown') &&
                !sessionStorage.getItem('formSubmittedSuccessfully')) 
            {
                formExitPopup.classList.add('active'); 
                document.body.classList.add('no-scroll'); 
                sessionStorage.setItem('formExitPopupShown', 'true');
                console.log("Pop-up de saída ACIONADO."); 
                UserTracker.pushToDataLayer({
                    'event': 'form_exit_popup_displayed',
                    'page_path': window.location.pathname,
                    'context': 'came_from_banner_and_not_submitted'
                });
            } else {
                console.log("Condições para pop-up de saída NÃO atendidas. Ou já exibido/submetido."); 
            }
        } else {
            console.log("Pop-up de saída já ativo ou outro popup bloqueando.");
        }
    }

    /**
     * Oculta o pop-up de saída e limpa flags relevantes.
     */
    function hideFormExitPopup() {
        if (formExitPopup && formExitPopup.classList.contains('active')) {
            formExitPopup.classList.remove('active');
            document.body.classList.remove('no-scroll'); 
            sessionStorage.removeItem('clickedBannerReduceMonthly'); // Remove a flag do banner ao fechar o pop-up
            console.log("Pop-up de saída ESCONDIDO."); 
        }
    }

    // === Event Listeners do Pop-up de Saída ===
    if (formExitPopup) {
        // 1. Detecção de mouse saindo do topo da janela (clássico Exit Intent)
        document.documentElement.addEventListener('mouseleave', function(e) {
            if (e.clientY < 5 && e.relatedTarget === null) {
                console.log("Mouse saiu para o topo da janela."); 
                showFormExitPopup();
            }
        });
        
        // 2. Detecção de mouse sobre links de navegação do cabeçalho
        const headerNavLinks = document.querySelectorAll('header nav ul li a');
        headerNavLinks.forEach(link => {
            if (!link.href.includes('formulario.html') && !link.href.includes('#')) {
                link.addEventListener('mouseenter', function() {
                    console.log("Mouse sobre link de navegação diferente do formulário."); 
                    showFormExitPopup();
                });
            }
        });

        // Eventos de Fechamento do Pop-up
        closeFormPopupButtons.forEach(button => {
            button.addEventListener('click', hideFormExitPopup);
        });

        formExitPopup.addEventListener('click', function(event) {
            if (event.target === formExitPopup) {
                hideFormExitPopup();
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && formExitPopup.classList.contains('active')) {
                hideFormExitPopup();
            }
        });
    }

    // --- Limpeza de flags de sessão (para garantir um comportamento limpo ao entrar nesta página) ---
    sessionStorage.removeItem('contactPopupAutoShown_Operadoras');
    sessionStorage.removeItem('exitPopupShown_Operadoras');
    sessionStorage.removeItem('floatingMessageDisplayed_Operadoras');
    sessionStorage.removeItem('toolInfoPopupShown_Operadoras');
    sessionStorage.removeItem('trabalheComigoPopupShown');
    sessionStorage.removeItem('videoPopupShown');
    sessionStorage.removeItem('exitPopupShown'); // Limpa a flag de exit intent de trabalhe-comigo
    sessionStorage.removeItem('authorityPopupShownOnAboutPage'); // Limpa a flag do pop-up da página Sobre

    // Para facilitar os testes, você pode descomentar as linhas abaixo para limpar as flags
    // a cada carregamento da página "Formulário". REMOVA EM AMBIENTE DE PRODUÇÃO!
    // sessionStorage.removeItem('clickedBannerReduceMonthly');
    // sessionStorage.removeItem('formExitPopupShown');
    // sessionStorage.removeItem('formSubmittedSuccessfully');

    // === Inicialização do Formulário Dinâmico ===
    injectAndSetupForm();
});