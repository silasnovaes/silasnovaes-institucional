// assets/js/scripts.js

// Função para alternar o menu de navegação em telas pequenas
function toggleMenu() {
    const menu = document.getElementById('menu');
    const menuToggle = document.querySelector('.menu-toggle');
    menu.classList.toggle('active');
    menuToggle.classList.toggle('active');
    const isExpanded = menuToggle.classList.contains('active');
    menuToggle.setAttribute('aria-expanded', isExpanded);
}

// Header scroll effect
window.addEventListener("scroll", function() {
    const header = document.querySelector("header.bloco");
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

// Funções que devem ser executadas após o DOM ser completamente carregado
document.addEventListener("DOMContentLoaded", function() {
    // Adiciona event listener para o botão de toggle do menu
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu); 
    }

    // Opcional: Fechar o menu ao clicar em um item (se o menu estiver ativo)
    const menuLinks = document.querySelectorAll('#menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            const menu = document.getElementById('menu');
            const toggleBtn = document.querySelector('.menu-toggle');
            if (menu.classList.contains('active')) {
                menu.classList.remove('active');
                toggleBtn.classList.remove('active');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Animação de elementos ao scroll (se você quiser usar, adicione a classe 'animate-fade-in' aos elementos no HTML)
    const animatedElements = document.querySelectorAll(".animate-fade-in");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1"; 
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target); // Para a animação ocorrer apenas uma vez
            }
        });
    }, { threshold: 0.1 }); 
    
    animatedElements.forEach(element => {
        element.style.opacity = "0"; 
        element.style.transform = "translateY(20px)"; 
        element.style.transition = "opacity 0.8s ease, transform 0.8s ease"; 
        observer.observe(element);
    });

    // Lógica para o FAQ (Perguntas Frequentes)
    // Suporta HTML com <button> e hidden/aria-expanded
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        const questionButton = item.querySelector(".faq-question");
        const answerDiv = item.querySelector(".faq-answer");

        if (questionButton && answerDiv) {
            questionButton.addEventListener("click", function() {
                const isExpanded = questionButton.getAttribute("aria-expanded") === "true";

                // Fecha todos os outros FAQs abertos
                faqItems.forEach(otherItem => {
                    const otherButton = otherItem.querySelector(".faq-question");
                    const otherAnswer = otherItem.querySelector(".faq-answer");
                    if (otherButton && otherAnswer && otherButton !== questionButton && otherButton.getAttribute("aria-expanded") === "true") {
                        otherButton.setAttribute("aria-expanded", "false");
                        otherAnswer.setAttribute("hidden", "true");
                        otherItem.classList.remove("active"); 
                    }
                });

                // Alterna o FAQ clicado
                questionButton.setAttribute("aria-expanded", !isExpanded);
                if (isExpanded) {
                    answerDiv.setAttribute("hidden", "true");
                    item.classList.remove("active"); 
                } else {
                    answerDiv.removeAttribute("hidden");
                    item.classList.add("active"); 
                }
            });
        }
    });

    // Script para ano atual no footer
    // Verifica se o elemento existe antes de tentar acessá-lo
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});