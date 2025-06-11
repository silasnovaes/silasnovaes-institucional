document.addEventListener("DOMContentLoaded", function() {
    // Script para Validação e Envio do Formulário de Contato
    const form = document.getElementById('contato-form-v2');
    const statusMessage = document.getElementById('form-contato-status-message-v2');
    const submitButton = document.getElementById('submit-contato-button-v2');

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

            // Validação simples (pode ser aprimorada)
            const requiredFields = form.querySelectorAll('[required]');
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
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                
                setTimeout(() => {
                    statusMessage.textContent = 'Mensagem enviada com sucesso! Entraremos em contato em breve.';
                    statusMessage.classList.add('success');
                    statusMessage.style.display = 'block';
                    form.reset(); // Limpa o formulário
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem Agora';
                }, 1500);

            } else {
                statusMessage.textContent = 'Por favor, corrija os erros no formulário.';
                statusMessage.classList.add('error');
                statusMessage.style.display = 'block';
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
            }
            e.target.value = value;
        });
    }
});