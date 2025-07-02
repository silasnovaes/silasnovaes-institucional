// assets/js/contato.js

document.addEventListener("DOMContentLoaded", function() {
    // === Script para Validação e Envio do Formulário de Contato ===
    const form = document.getElementById('contato-form-v2');
    const statusMessage = document.getElementById('form-contato-status-message-v2');
    const submitButton = document.getElementById('submit-contato-button-v2');

    // === Novo Pop-up de Boas-Vindas Personalizado ===
    const contactPageWelcomePopupShown = sessionStorage.getItem('contactPageWelcomePopupShown') === 'true';

    /**
     * Exibe o pop-up de boas-vindas personalizado com base na temperatura do lead.
     * Usa o GlobalPopupManager para consistência.
     */
    function showPersonalizedWelcomePopup() {
        if (contactPageWelcomePopupShown) {
            console.log("Pop-up de boas-vindas da página de contato já exibido nesta sessão. Abortando.");
            return;
        }

        const leadTemperature = window.silasNovaesUserSession.preferences.leadTemperature;
        let title, message, ctaHtml;

        console.log("Página de Contato: Temperatura do lead:", leadTemperature);

        if (leadTemperature === 'Frio' || leadTemperature === 'Morno') {
            title = "Ainda não tem certeza?";
            message = "Fale com Silas pelo WhatsApp sem compromisso para tirar suas dúvidas rapidamente. É o canal mais fácil e direto para começar!";
            ctaHtml = `
                <a href="https://wa.me/5583991092624" target="_blank" rel="noopener noreferrer" class="botao-primario">
                    <i class="fab fa-whatsapp"></i> Falar no WhatsApp
                </a>
                <button type="button" class="botao-secundario close-popup-btn">Prefiro o formulário</button>
            `;
        } else { // Quente ou Super Quente
            title = "Pronto para dar o próximo passo?";
            message = "Seu alto engajamento mostra que você está decidido! Preencha o formulário ou ligue para Silas Novaes e finalize sua cotação agora!";
            ctaHtml = `
                <a href="#conteudo-principal" class="botao-primario close-popup-btn">Preencher Formulário</a>
                <a href="tel:+5583991092624" class="botao-secundario">
                    <i class="fas fa-phone-alt"></i> Ligar Agora
                </a>
            `;
        }

        // Usa o GlobalPopupManager para exibir o pop-up
        window.GlobalPopupManager.showPopup(
            ctaHtml, // Conteúdo HTML com os botões
            {
                title: title,
                message: message,
                addClass: 'contact-welcome-popup', // Classe CSS opcional para estilização específica
                enableCloseBtn: true, // Já existe um botão no ctaHtml, mas podemos manter o 'x'
                closeOnClickOutside: true,
                onClose: () => {
                    sessionStorage.setItem('contactPageWelcomePopupShown', 'true');
                    console.log("Pop-up de boas-vindas da página de contato fechado.");
                },
                onFormSubmit: (form) => {
                    // Não há formulário principal aqui, os CTAs são links/botões simples
                    console.log("CTA acionado no pop-up de boas-vindas da página de contato.");
                }
            }
        );
        window.GlobalPopupManager.pushToDataLayer({ // Usa o pushToDataLayer do GlobalPopupManager
            'event': 'contact_welcome_popup_displayed',
            'lead_temperature': leadTemperature,
            'popup_type': (leadTemperature === 'Frio' || leadTemperature === 'Morno') ? 'whatsapp_focus' : 'form_call_focus',
            'page_path': window.location.pathname
        });
    }


    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão
            let isValid = true;

            // Limpa erros anteriores
            form.querySelectorAll('.form-control, .form-check-input').forEach(input => {
                input.classList.remove('is-invalid');
            });
            form.querySelectorAll('.form-error').forEach(error => {
                error.style.display = 'none';
            });
            statusMessage.style.display = 'none';
            statusMessage.className = 'form-message'; // Reseta classes de status

            // Validação
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                let fieldValid = true;
                const errorElement = document.getElementById(field.id + '-error');
                
                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        fieldValid = false;
                    }
                } else {
                    if (field.value.trim() === '') {
                        fieldValid = false;
                    } else if (field.type === 'email') {
                        const emailPattern = /^[^\s@]+@[^\s@]+\.\S+$/;
                        if (!emailPattern.test(field.value.trim())) {
                            fieldValid = false;
                            if (errorElement) errorElement.textContent = 'Informe um e-mail válido.';
                        }
                    } else if (field.type === 'tel') {
                        // Regex para aceitar formatos como (XX) XXXXX-XXXX, (XX) XXXX-XXXX, XX9XXXXXXXX, XXXXXXXXXX
                        const phonePattern = /^\(?[1-9]{2}\)?\s?(?:9\d{4}|[2-578]\d{3})-?\d{4}$/; 
                        if (!phonePattern.test(field.value.replace(/\D/g,''))) { // Valida apenas dígitos
                            fieldValid = false;
                            if (errorElement) errorElement.textContent = 'Formato inválido. Use (00) 00000-0000.';
                        }
                    }
                }
                
                if (!fieldValid) {
                    isValid = false;
                    field.classList.add('is-invalid');
                    if (errorElement) {
                        errorElement.style.display = 'block';
                    }
                }
            });

            if (isValid) {
                // Simula envio
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                
                // Coleta dados para o DataLayer
                const formData = new FormData(form);
                const data = {
                    event: 'form_submission',
                    form_name: 'contato_principal',
                    page_path: window.location.pathname,
                    nome: formData.get('nome_contato'),
                    email: formData.get('email_contato'),
                    telefone: formData.get('telefone_contato'),
                    assunto: formData.get('assunto_contato'),
                    mensagem: formData.get('mensagem_contato'),
                    consentimento: formData.get('consentimento_contato') === 'sim'
                };
                window.UserTracker.pushToDataLayer(data); // Envia para o DataLayer

                setTimeout(() => {
                    statusMessage.textContent = 'Mensagem enviada com sucesso! Entraremos em contato em breve.';
                    statusMessage.classList.add('success');
                    statusMessage.style.display = 'block';
                    form.reset(); // Limpa o formulário
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem Agora';
                    console.log("Formulário de Contato enviado.");
                }, 1500);

            } else {
                statusMessage.textContent = 'Por favor, corrija os erros no formulário.';
                statusMessage.classList.add('error');
                statusMessage.style.display = 'block';
                const firstInvalidField = form.querySelector('.is-invalid, .form-error[style*="block"]');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
            }
        });
    }

    // Máscara de telefone para o campo de telefone do formulário de contato
    const phoneInputContato = document.getElementById('telefone-contato-v2');
    if (phoneInputContato) {
        phoneInputContato.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.substring(0, 11);

            if (value.length > 2) {
                value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
            }
            if (value.length > 9) {
                value = value.substring(0, 10) + '-' + value.substring(10);
            } else if (value.length > 8) {
                 value = value.substring(0, 8) + '-' + value.substring(8);
            }
            e.target.value = value;
        });
    }

    // --- Limpeza de flags de sessão (para garantir um comportamento limpo ao entrar nesta página) ---
    sessionStorage.removeItem('contactPopupAutoShown_Operadoras');
    sessionStorage.removeItem('exitPopupShown_Operadoras');
    sessionStorage.removeItem('floatingMessageDisplayed_Operadoras');
    sessionStorage.removeItem('toolInfoPopupShown_Operadoras');
    sessionStorage.removeItem('trabalheComigoPopupShown');
    sessionStorage.removeItem('videoPopupShown');
    sessionStorage.removeItem('exitPopupShown');
    sessionStorage.removeItem('authorityPopupShownOnAboutPage');
    sessionStorage.removeItem('clickedBannerReduceMonthly');
    sessionStorage.removeItem('formExitPopupShown');
    sessionStorage.removeItem('formSubmittedSuccessfully');

    // === Inicializa o pop-up de boas-vindas da página de contato ===
    // Pequeno atraso para não ser intrusivo no carregamento inicial
    setTimeout(showPersonalizedWelcomePopup, 1500); 
});