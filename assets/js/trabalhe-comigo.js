document.addEventListener("DOMContentLoaded", function() {
    // Script para Validação e Envio do Formulário de Cadastro
    const formCadastro = document.getElementById('cadastro-form');
    const statusMessageCadastro = document.getElementById('form-cadastro-status-message');
    const submitButtonCadastro = document.getElementById('submit-cadastro-button');

    if (formCadastro) {
        formCadastro.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão
            let isValid = true;

            // Limpa erros anteriores
            formCadastro.querySelectorAll('.form-control, .form-check-input').forEach(input => {
                input.classList.remove('is-invalid');
            });
            formCadastro.querySelectorAll('.form-error').forEach(error => {
                error.style.display = 'none';
            });
            statusMessageCadastro.style.display = 'none';
            statusMessageCadastro.className = 'form-message'; // Reseta classes de status

            // Validação simples
            const requiredFields = formCadastro.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                let fieldError = null;
                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        isValid = false;
                        field.classList.add('is-invalid');
                        fieldError = document.getElementById(field.id + '-error');
                    }
                } else {
                    if (field.value.trim() === '') {
                        isValid = false;
                        field.classList.add('is-invalid');
                        fieldError = document.getElementById(field.id + '-error');
                    } else if (field.type === 'email') {
                        const emailPattern = /^[^\s@]+@[^\s@]+\.\S+$/;
                        if (!emailPattern.test(field.value.trim())) {
                            isValid = false;
                            field.classList.add('is-invalid');
                            fieldError = document.getElementById(field.id + '-error');
                            if (fieldError) fieldError.textContent = 'Informe um e-mail válido.';
                        }
                    } else if (field.type === 'tel') {
                        const phonePattern = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
                        if (!phonePattern.test(field.value.replace(/\D/g,''))) {
                            isValid = false;
                            field.classList.add('is-invalid');
                            fieldError = document.getElementById(field.id + '-error');
                            if (fieldError) fieldError.textContent = 'Informe um telefone válido (ex: (XX) 9XXXX-XXXX).';
                        }
                    }
                }
                if (fieldError && !isValid) {
                    fieldError.style.display = 'block';
                }
            });

            if (isValid) {
                // Simula envio
                submitButtonCadastro.disabled = true;
                submitButtonCadastro.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                
                setTimeout(() => {
                    statusMessageCadastro.textContent = 'Sua candidatura foi enviada com sucesso! Entraremos em contato em breve.';
                    statusMessageCadastro.classList.add('success');
                    statusMessageCadastro.style.display = 'block';
                    formCadastro.reset(); // Limpa o formulário
                    submitButtonCadastro.disabled = false;
                    submitButtonCadastro.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Cadastro';
                }, 1500);

            } else {
                statusMessageCadastro.textContent = 'Por favor, corrija os erros no formulário.';
                statusMessageCadastro.classList.add('error');
                statusMessageCadastro.style.display = 'block';
            }
        });
    }

    // Máscara de telefone para o campo de telefone do formulário de cadastro
    const phoneInputCadastro = document.getElementById('telefone-cadastro');
    if (phoneInputCadastro) {
        phoneInputCadastro.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.substring(0, 11);

            if (value.length > 2) {
                value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
            }
            if (value.length > 9) {
                value = value.substring(0, 10) + '-' + value.substring(10);
            }
            e.target.value = value;
        });
    }

    // Script para Slider de Depoimentos da Equipe
    const slider = document.getElementById('depoimentos-equipe-slider');
    const dotsContainer = document.querySelector('.depoimentos-equipe-section .slider-controls');
    let slides = [];
    let dots = [];
    let currentIndex = 0;
    let autoSlideInterval;

    if (slider && dotsContainer) {
        slides = Array.from(slider.querySelectorAll('.depoimento'));
        dots = Array.from(dotsContainer.querySelectorAll('.slider-dot'));

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === index) {
                    slide.classList.add('active');
                }
            });
            dots.forEach((dot, i) => {
                dot.classList.remove('active');
                if (i === index) {
                    dot.classList.add('active');
                }
            });
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
        }

        function startAutoSlide() {
            autoSlideInterval = setInterval(nextSlide, 5000); // Muda a cada 5 segundos
        }

        function resetAutoSlide() {
            clearInterval(autoSlideInterval);
            startAutoSlide();
        }

        dots.forEach(dot => {
            dot.addEventListener('click', function() {
                const index = parseInt(this.dataset.slideIndex);
                showSlide(index);
                currentIndex = index; // Atualiza o índice para o autoslide
                resetAutoSlide(); // Reinicia o timer ao clicar
            });
        });

        // Inicializa o slider
        showSlide(currentIndex);
        startAutoSlide();

        // Pausa o autoslide ao passar o mouse sobre o slider ou dots
        slider.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        slider.addEventListener('mouseleave', startAutoSlide);
        dotsContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        dotsContainer.addEventListener('mouseleave', startAutoSlide);
    }
});