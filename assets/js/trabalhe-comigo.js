// assets/js/trabalhe-comigo.js

document.addEventListener("DOMContentLoaded", function() {
    // === Script para Validação e Envio do Formulário de Cadastro ===
    const formCadastro = document.getElementById('cadastro-form');
    const statusMessageCadastro = document.getElementById('form-cadastro-status-message');
    const submitButtonCadastro = document.getElementById('submit-cadastro-button');
    const formCadastroSection = document.getElementById('form-cadastro'); // Referência à seção do formulário

    if (formCadastro) {
        // Adiciona um 'event listener' para o evento de 'submit' do formulário
        formCadastro.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão do formulário para que o JS possa lidar com ele
            let isValid = true; // Flag para controlar a validade geral do formulário
            let firstInvalidField = null; // Para focar no primeiro campo inválido

            // Limpa mensagens de erro e estados de validação anteriores
            formCadastro.querySelectorAll('.form-control, .form-check-input').forEach(input => {
                input.classList.remove('is-invalid');
            });
            formCadastro.querySelectorAll('.form-error').forEach(error => {
                error.style.display = 'none';
            });
            statusMessageCadastro.style.display = 'none';
            statusMessageCadastro.className = 'form-message';

            // Validação de campos obrigatórios
            const requiredFields = formCadastro.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                let fieldError = null;

                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        isValid = false;
                        field.classList.add('is-invalid');
                        fieldError = document.getElementById(field.id + '-error');
                        if (!firstInvalidField) firstInvalidField = field;
                    }
                } else {
                    if (field.value.trim() === '') {
                        isValid = false;
                        field.classList.add('is-invalid');
                        fieldError = document.getElementById(field.id + '-error');
                        if (!firstInvalidField) firstInvalidField = field;
                    } else if (field.type === 'email') {
                        const emailPattern = /^[^\s@]+@[^\s@]+\.\S+$/;
                        if (!emailPattern.test(field.value.trim())) {
                            isValid = false;
                            field.classList.add('is-invalid');
                            fieldError = document.getElementById(field.id + '-error');
                            if (fieldError) fieldError.textContent = 'Informe um e-mail válido.';
                            if (!firstInvalidField) firstInvalidField = field;
                        }
                    } else if (field.type === 'tel') {
                        const phonePattern = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/; // Adjusted regex for flexibility
                        if (!phonePattern.test(field.value)) {
                            isValid = false;
                            field.classList.add('is-invalid');
                            fieldError = document.getElementById(field.id + '-error');
                            if (fieldError) fieldError.textContent = 'Informe um telefone válido (ex: (XX) 9XXXX-XXXX).';
                            if (!firstInvalidField) firstInvalidField = field;
                        }
                    }
                }
                if (fieldError) {
                    fieldError.style.display = 'block';
                }
            });

            if (isValid) {
                submitButtonCadastro.disabled = true;
                submitButtonCadastro.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

                // Simulação de sucesso para demonstração (remover em produção real)
                setTimeout(() => {
                    statusMessageCadastro.textContent = 'Sua candidatura foi enviada com sucesso! Entraremos em contato em breve.';
                    statusMessageCadastro.classList.add('success');
                    statusMessageCadastro.style.display = 'block';
                    formCadastro.reset();
                    submitButtonCadastro.disabled = false;
                    submitButtonCadastro.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Cadastro';
                    // Marcar que o formulário foi preenchido
                    localStorage.setItem('formCadastroPreenchido', 'true');
                    // Enviar evento de conversão para o Google Analytics (via dataLayer)
                    if (typeof dataLayer !== 'undefined') {
                        dataLayer.push({
                            'event': 'form_submission',
                            'form_name': 'trabalhe_comigo',
                            'form_status': 'success'
                        });
                    }
                }, 1500);

            } else {
                statusMessageCadastro.textContent = 'Por favor, corrija os erros no formulário.';
                statusMessageCadastro.classList.add('error');
                statusMessageCadastro.style.display = 'block';
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
            }
        });
    }

    // === Máscara de telefone para o campo de telefone do formulário de cadastro ===
    const phoneInputCadastro = document.getElementById('telefone-cadastro');
    if (phoneInputCadastro) {
        phoneInputCadastro.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
            value = value.substring(0, 11); // Limita a 11 dígitos (incluindo DDD e o '9' extra)

            // Aplica a máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
            if (value.length > 2) {
                value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
            }
            if (value.length > 7 && value.length <= 10) { // Para números com 8 ou 9 dígitos no meio (celulares/fixos)
                value = value.substring(0, value.length - 4) + '-' + value.substring(value.length - 4);
            } else if (value.length > 10) { // Para 11 dígitos (DDD + 9 digitos)
                value = value.substring(0, 10) + '-' + value.substring(10);
            }
            e.target.value = value;
        });
    }

    // === Script para Slider de Depoimentos da Equipe ===
    const depoimentosSlider = document.getElementById('depoimentos-equipe-slider');
    const depoimentos = depoimentosSlider ? Array.from(depoimentosSlider.children) : [];
    
    const prevButton = document.querySelector('.slider-control-prev');
    const nextButton = document.querySelector('.slider-control-next');
    const dotsContainer = document.getElementById('slider-dots-depoimentos');
    
    let currentIndex = 0;
    let slideInterval;

    function updateSlider() {
        if (depoimentosSlider) {
            // Remove a classe 'active' de todos os depoimentos primeiro
            depoimentos.forEach(dep => dep.classList.remove('active'));
            // Adiciona a classe 'active' apenas ao depoimento atual
            if (depoimentos[currentIndex]) {
                depoimentos[currentIndex].classList.add('active');
            }
            depoimentosSlider.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
        updateDots();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % depoimentos.length;
        updateSlider();
        resetInterval();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + depoimentos.length) % depoimentos.length;
        updateSlider();
        resetInterval();
    }

    function goToSlide(index) {
        if (index >= 0 && index < depoimentos.length) {
            currentIndex = index;
            updateSlider();
            resetInterval();
        }
    }

    function createDots() {
        if (dotsContainer) {
            dotsContainer.innerHTML = ''; // Limpa dots existentes antes de criar
            depoimentos.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.classList.add('slider-dot-depoimentos');
                dot.dataset.index = index;
                dot.setAttribute('aria-label', `Ir para o slide ${index + 1}`);
                dot.setAttribute('role', 'button');
                dot.addEventListener('click', function() {
                    goToSlide(parseInt(this.dataset.index));
                });
                dotsContainer.appendChild(dot);
            });
        }
    }

    function updateDots() {
        const dots = document.querySelectorAll('.slider-dot-depoimentos');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
            dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
        });
    }

    function startInterval() {
        if (depoimentos.length > 1) { // Só inicia o autoslide se houver mais de um depoimento
            slideInterval = setInterval(nextSlide, 5000);
        }
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    // Inicialização do Slider
    if (depoimentos.length > 0) {
        if (depoimentos.length > 1) {
            if (prevButton) {
                prevButton.addEventListener('click', prevSlide);
                prevButton.style.display = 'flex';
            }
            if (nextButton) {
                nextButton.addEventListener('click', nextSlide);
                nextButton.style.display = 'flex';
            }
            createDots();
        } else {
            // Se apenas um depoimento, esconde controles
            if (prevButton) prevButton.style.display = 'none';
            if (nextButton) nextButton.style.display = 'none';
            if (dotsContainer) dotsContainer.style.display = 'none';
        }
        updateSlider(); // Garante a posição inicial e o dot ativo
        startInterval();

        const depoimentosContainer = document.querySelector('.depoimentos-container');
        if (depoimentosContainer) {
            depoimentosContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
            depoimentosContainer.addEventListener('mouseleave', startInterval);
        }
        
        document.addEventListener('keydown', function(event) {
            const activeElement = document.activeElement;
            const isInsideSlider = activeElement.closest('.depoimentos-equipe-section') || activeElement.closest('.depoimentos-container');

            if (isInsideSlider) {
                if (event.key === 'ArrowLeft') {
                    prevSlide();
                } else if (event.key === 'ArrowRight') {
                    nextSlide();
                }
            }
        });

    } else {
        // Se não houver depoimentos, garanta que nada do slider apareça
        if (depoimentosSlider) depoimentosSlider.style.display = 'none';
        if (prevButton) prevButton.style.display = 'none';
        if (nextButton) nextButton.style.display = 'none';
        if (dotsContainer) dotsContainer.style.display = 'none';
    }

    // === Pop-ups e Rastreamento de Comportamento para Personalização ===

    const exitIntentPopup = document.getElementById('exit-intent-popup');
    const trabalheComigoPopup = document.getElementById('trabalhe-comigo-popup');
    const videoPopup = document.getElementById('video-popup');
    const closeButtons = document.querySelectorAll('.close-popup-btn, .close-popup-on-click');

    // Helper para abrir pop-up
    function openPopup(popupElement) {
        if (popupElement && !popupElement.classList.contains('active')) { // Verifica se já não está ativo
            popupElement.classList.add('active');
            document.body.classList.add('no-scroll');
            popupElement.setAttribute('aria-hidden', 'false');
            const focusableElements = popupElement.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': 'popup_view',
                    'popup_name': popupElement.id,
                    'page_path': window.location.pathname
                });
            }
        }
    }

    // Helper para fechar pop-up
    function closePopup(popupElement) {
        if (popupElement && popupElement.classList.contains('active')) {
            popupElement.classList.remove('active');
            document.body.classList.remove('no-scroll');
            popupElement.setAttribute('aria-hidden', 'true');
        }
    }

    // Event listeners para fechar pop-ups
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closePopup(exitIntentPopup);
            closePopup(trabalheComigoPopup);
            closePopup(videoPopup);
        });
    });

    // Pop-up "Trabalhe Comigo" na entrada da página
    // Será exibido apenas se o usuário não tiver preenchido o formulário ainda
    if (window.location.pathname.includes('trabalhe-comigo.html')) {
        if (!localStorage.getItem('formCadastroPreenchido')) {
            // Pequeno delay para não ser intrusivo no carregamento inicial da página
            setTimeout(() => {
                openPopup(trabalheComigoPopup);
            }, 1000); 
        }
    }
    
    // Rastreamento de scroll para pop-up de vídeo
    let scrolledToForm = false;
    window.addEventListener('scroll', function() {
        if (formCadastroSection) {
            const rect = formCadastroSection.getBoundingClientRect();
            // Verifica se a seção do formulário está visível na tela
            const isFormSectionVisible = rect.top < window.innerHeight && rect.bottom >= 0;

            // Se o usuário desceu até o formulário E ainda não preencheu
            if (isFormSectionVisible && !scrolledToForm && !localStorage.getItem('formCadastroPreenchido')) {
                scrolledToForm = true; // Marca que já desceu
                // Abrir pop-up de vídeo após um pequeno delay
                setTimeout(() => {
                    openPopup(videoPopup);
                }, 2000); 
                // Enviar evento de "Scroll to Form" para o Google Analytics
                if (typeof dataLayer !== 'undefined') {
                    dataLayer.push({
                        'event': 'scroll_to_element',
                        'element_id': 'form-cadastro',
                        'page_path': window.location.pathname
                    });
                }
            }
        }
    });

    // Pop-up de Intenção de Saída
    // Será exibido se o usuário tentar sair e ainda não tiver preenchido o formulário
    document.addEventListener('mouseleave', function(event) {
        // Verifica se o mouse está saindo da área da janela para cima (intenção de fechar aba/navegador)
        if (event.clientY < 10 && !localStorage.getItem('formCadastroPreenchido')) {
            // Evita que o pop-up apareça repetidamente na mesma sessão
            if (!sessionStorage.getItem('exitPopupShown')) {
                openPopup(exitIntentPopup);
                sessionStorage.setItem('exitPopupShown', 'true');
                // Enviar evento de "Exit Intent" para o Google Analytics
                if (typeof dataLayer !== 'undefined') {
                    dataLayer.push({
                        'event': 'exit_intent_popup',
                        'popup_name': 'exit_intent_popup',
                        'page_path': window.location.pathname
                    });
                }
            }
        }
    });
});