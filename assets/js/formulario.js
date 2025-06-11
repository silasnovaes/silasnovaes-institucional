document.addEventListener("DOMContentLoaded", function() {
    // Script básico de validação de formulário
    const form = document.getElementById('cotacao-form');
    const formMessage = document.getElementById('form-message');

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão
            let isValid = true;

            // Limpa erros anteriores
            document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.form-control.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            formMessage.style.display = 'none';
            formMessage.className = 'form-message'; // Reseta classes da mensagem

            // Validação simples (exemplo)
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                let fieldValid = true;
                const errorElement = document.getElementById(field.id + '-error');

                if (field.type === 'checkbox' && !field.checked) {
                    fieldValid = false;
                } else if (field.type === 'radio') {
                    // Verifica se algum radio do grupo foi marcado
                    const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
                    if (!Array.from(radioGroup).some(radio => radio.checked)) {
                       // Marca o erro apenas no container do grupo, se houver
                       const groupErrorElement = document.getElementById(field.name.replace('_','-') + '-error');
                       if(groupErrorElement) groupErrorElement.style.display = 'block';
                       isValid = false; // Marca inválido para o form, mas não individualmente cada radio
                       fieldValid = true; // Evita marcar cada radio como inválido
                    } else {
                       const groupErrorElement = document.getElementById(field.name.replace('_','-') + '-error');
                       if(groupErrorElement) groupErrorElement.style.display = 'none';
                    }
                } else if (field.value.trim() === '') {
                    fieldValid = false;
                } else if (field.type === 'email' && !/\S+@\S+\.\S+/.test(field.value)) {
                    fieldValid = false;
                    if(errorElement) errorElement.textContent = 'Informe um e-mail válido.';
                } else if (field.type === 'tel') {
                    // Regex simples para telefone (pode ser melhorada)
                    const phonePattern = /^\(\d{2}\)\s?\d{5}-?\d{4}$/;
                    if (!phonePattern.test(field.value)) {
                        fieldValid = false;
                        if(errorElement) errorElement.textContent = 'Formato inválido. Use (00) 00000-0000.';
                    }
                }

                if (!fieldValid) {
                    isValid = false;
                    field.classList.add('is-invalid');
                    if (errorElement) {
                        // Define mensagem de erro padrão se não houver uma específica
                        if (!errorElement.textContent || errorElement.textContent === 'Informe um e-mail válido.' || errorElement.textContent === 'Formato inválido. Use (00) 00000-0000.') {
                           // Não sobrescreve erros específicos de formato
                        } else {
                           errorElement.textContent = 'Este campo é obrigatório.';
                        }
                        errorElement.style.display = 'block';
                    }
                }
            });

            // Se o formulário for válido, simula o envio
            if (isValid) {
                console.log('Formulário válido, enviando dados (simulação)...');
                // Aqui você adicionaria a lógica de envio real (AJAX, etc.)
                formMessage.textContent = 'Obrigado! Sua solicitação de cotação foi enviada com sucesso. Entraremos em contato em breve.';
                formMessage.classList.add('success');
                formMessage.style.display = 'block';
                form.reset(); // Limpa o formulário
            } else {
                console.log('Formulário inválido.');
                formMessage.textContent = 'Por favor, corrija os erros indicados no formulário.';
                formMessage.classList.add('error');
                formMessage.style.display = 'block';
                // Foca no primeiro campo inválido
                const firstInvalidField = form.querySelector('.is-invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
            }
        });
    }

    // Máscara de telefone simples (exemplo)
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
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
});