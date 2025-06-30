// assets/js/scripts.js

// Funções globais que podem ser acessadas por outras páginas

// Função para alternar o menu de navegação em telas pequenas
function toggleMenu() {
    const menu = document.getElementById('menu');
    const menuToggle = document.querySelector('.menu-toggle');
    menu.classList.toggle('active');
    menuToggle.classList.toggle('active');
    const isExpanded = menuToggle.classList.contains('active');
    menuToggle.setAttribute('aria-expanded', isExpanded);
    // Adiciona ou remove overflow-hidden ao body quando o menu está aberto
    document.body.classList.toggle('no-scroll', isExpanded);
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

// Função para inicializar as animações de elementos ao scroll
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(".animate-fade-in");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target); // Para a animação ocorrer apenas uma vez
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(element => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        observer.observe(element);
    });
}

// Função para inicializar a lógica do FAQ (assumindo a existência de elementos FAQ)
function initFaq() {
    const faqItems = document.querySelectorAll(".faq-item");

    if (faqItems.length > 0) { // Garante que só executa se houver FAQs
        faqItems.forEach(item => {
            const questionButton = item.querySelector(".faq-question");
            const answerDiv = item.querySelector(".faq-answer");

            if (questionButton && answerDiv) {
                questionButton.addEventListener("click", function() {
                    const isExpanded = questionButton.getAttribute("aria-expanded") === "true";

                    faqItems.forEach(otherItem => {
                        const otherButton = otherItem.querySelector(".faq-question");
                        const otherAnswer = otherItem.querySelector(".faq-answer");
                        if (otherButton && otherAnswer && otherButton !== questionButton && otherButton.getAttribute("aria-expanded") === "true") {
                            otherButton.setAttribute("aria-expanded", "false");
                            otherAnswer.setAttribute("hidden", "true");
                            otherItem.classList.remove("active");
                        }
                    });

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
    }
}

// Função para atualizar o ano no footer
function updateFooterYear() {
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
}

// === Funcionalidade de Rastreamento de Cliques e Comportamento para Personalização ===
// Esta função coleta dados básicos de interação do usuário para uso futuro em personalização
// e envio para o Google Analytics (via dataLayer, para GTM/GA4).
function initUserBehaviorTracker() {
    // Inicializa o array de interações do usuário, mantido na sessão (ou local storage se for persistente)
    // Para esta versão, usaremos sessionStorage para rastrear a sessão atual.
    function loadSessionInteractions() {
        try {
            const interactions = sessionStorage.getItem('userSessionInteractions');
            return interactions ? JSON.parse(interactions) : [];
        } catch (e) {
            console.error("Erro ao carregar interações da sessão:", e);
            return [];
        }
    }

    function saveSessionInteractions(interactions) {
        try {
            sessionStorage.setItem('userSessionInteractions', JSON.stringify(interactions));
        } catch (e) {
            console.error("Erro ao salvar interações da sessão:", e);
        }
    }

    // Rastrear cliques em links e botões em todo o site
    document.addEventListener('click', function(event) {
        const target = event.target.closest('a, button, .botao-primario, .botao-secundario');
        if (target) {
            const clickData = {
                timestamp: new Date().toISOString(),
                elementType: target.tagName,
                elementId: target.id || '',
                elementClass: target.className || '',
                elementText: target.textContent.trim().substring(0, 100), // Limita o texto para evitar logs muito longos
                pageUrl: window.location.href,
                // Adicione aqui dados específicos para o seu ICP se relevante
                // Ex: Se fosse um botão de "cotar plano MEI", você poderia adicionar 'plan_type: MEI'
            };
            
            // Adiciona a interação ao histórico da sessão
            const sessionHistory = loadSessionInteractions();
            sessionHistory.push(clickData);
            saveSessionInteractions(sessionHistory);

            // Envia o evento para o Google Analytics (via DataLayer, se GTM estiver presente)
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    'event': 'user_interaction',
                    'interaction_type': 'click',
                    'click_element_type': clickData.elementType,
                    'click_element_id': clickData.elementId,
                    'click_element_text': clickData.elementText,
                    'page_path': window.location.pathname
                });
            }
        }
    }, { capture: true }); // Capture: true para pegar eventos em fase de captura

    // Rastrear visualização de página no carregamento
    // Já é geralmente feito pelo GA4 config tag via GTM, mas pode ser um fallback ou para dados mais detalhados
    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
            'event': 'page_view_custom', // Evento customizado para evitar conflito com 'page_view' padrão do GA4
            'page_path': window.location.pathname,
            'page_title': document.title,
            'page_referrer': document.referrer,
            'user_agent': navigator.userAgent
        });
    }

    // Exemplo de como você pode usar os dados rastreados (placeholder para lógica de personalização)
    window.getUserSessionHistory = loadSessionInteractions; // Expõe a função para outras partes do script, se necessário
}


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
                document.body.classList.remove('no-scroll');
            }
        });
    });

    // Inicializa todas as funcionalidades globais
    initScrollAnimations();
    initFaq();
    updateFooterYear();
    initUserBehaviorTracker(); // Inicializa o rastreador de comportamento do usuário
});