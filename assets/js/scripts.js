// assets/js/scripts.js

// Objeto global para armazenar dados da sessão do usuário para personalização
// Este objeto será exposto globalmente para que scripts de páginas específicas possam acessá-lo.
window.silasNovaesUserSession = {
    sessionId: null, // ID único para a sessão atual
    userId: null, // ID único persistente para o usuário (localStorage)
    currentPage: null, // Informações da página atual
    history: [], // Histórico de interações na sessão atual
    preferences: { // Preferências inferidas para personalização (persistidas no localStorage)
        interestedInHealthPlan: false,
        interestedInDentalPlan: false,
        contactedBefore: false,
        lastVisitedPage: null,
        visitedPagesCount: {}, // Contagem de visitas por página
        timeSpentOnPages: {}, // Tempo gasto por página
        scrollDepthAchieved: {}, // Maior profundidade de scroll atingida por página
        formInteractions: {}, // Histórico de interações com formulários (e progresso de preenchimento)
        cameFromHighIntentPage: false, // Indica se o usuário veio de uma página de alta intenção/conversão
        leadScore: 0, // Pontuação para qualificação do lead
        leadTemperature: 'Frio' // Temperatura do lead: Frio, Morno, Quente, Super Quente
    },
    // Método para atualizar as preferências do usuário com base no comportamento
    updatePreference: function(key, value) {
        this.preferences[key] = value;
        UserTracker.saveUserPersistentData(); // Salva no localStorage após cada atualização relevante
    },
    // Método para adicionar um evento ao histórico da sessão
    addInteraction: function(interaction) {
        this.history.push(interaction);
        // Garante que o histórico não cresça indefinidamente para evitar problemas de memória/armazenamento
        if (this.history.length > 50) { // Limite razoável de interações por sessão
            this.history.shift(); // Remove o evento mais antigo
        }
        // Salva a sessão no sessionStorage imediatamente após adicionar ao histórico
        try {
            sessionStorage.setItem('silasNovaesUserSession', JSON.stringify({
                sessionId: this.sessionId,
                currentPage: this.currentPage,
                history: this.history
            }));
        } catch (e) {
            console.error("UserTracker: Erro ao salvar sessão no sessionStorage:", e);
        }
    }
};

// Funções globais que podem ser acessadas por outras páginas
// ==========================================================

// Função para alternar o menu de navegação em telas pequenas
function toggleMenu() {
    const menu = document.getElementById('menu');
    const menuToggle = document.querySelector('.menu-toggle');
    if (menu && menuToggle) {
        menu.classList.toggle('active');
        menuToggle.classList.toggle('active');
        const isExpanded = menuToggle.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
        document.body.classList.toggle('no-scroll', isExpanded);
    } else {
        console.warn("toggleMenu: Elementos 'menu' ou 'menu-toggle' não encontrados.");
    }
}

// Header scroll effect
window.addEventListener("scroll", function() {
    const header = document.querySelector("header.bloco");
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }
});

// Função para inicializar as animações de elementos ao scroll (Intersection Observer)
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(".animate-fade-in");
    // Se não há elementos a animar, não inicializa o observer
    if (animatedElements.length === 0) {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target); // Para a animação ocorrer apenas uma vez
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }); // O elemento deve estar 10% visível, com uma margem de -50px na parte inferior

    animatedElements.forEach(element => {
        // Inicializa o estado invisível e transicionável
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

                    // Fecha outros FAQs abertos
                    faqItems.forEach(otherItem => {
                        const otherButton = otherItem.querySelector(".faq-question");
                        const otherAnswer = otherItem.querySelector(".faq-answer");
                        if (otherButton && otherAnswer && otherButton !== questionButton && otherButton.getAttribute("aria-expanded") === "true") {
                            otherButton.setAttribute("aria-expanded", "false");
                            otherAnswer.setAttribute("hidden", "true");
                            otherItem.classList.remove("active");
                        }
                    });

                    // Abre ou fecha o FAQ clicado
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

// === MÓDULO DE RASTREAMENTO DE COMPORTAMENTO DO USUÁRIO (UserTracker) ===
// Este módulo é responsável por coletar e armazenar dados de interação do usuário
// para futura personalização e análise via Google Analytics (DataLayer).
const UserTracker = (function() {
    let timerInterval; // Para rastrear tempo na página
    let startTime; // Hora de início para calcular tempo na página
    let lastScrollY = 0; // Para otimizar o rastreamento de scroll
    // Objeto para controlar quais eventos de profundidade de scroll já foram enviados por página
    let scrollDepthEventSent = {};

    // Páginas que, se forem o referrer, indicam alta intenção do usuário.
    const HIGH_INTENT_REFERRERS = ['/formulario.html', '/contatos.html', '/operadoras.html'];

    // Funções auxiliares
    function generateUniqueId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Carrega ou inicializa dados persistentes do usuário no localStorage
    function loadOrCreateUserPersistentData() {
        try {
            const storedUserPreferences = localStorage.getItem('silasNovaesUserPreferences');
            if (storedUserPreferences) {
                const parsedPreferences = JSON.parse(storedUserPreferences);
                // Mescla as preferências carregadas com as atuais (mantendo métodos e outras propriedades não persistentes)
                Object.assign(window.silasNovaesUserSession.preferences, parsedPreferences);
                window.silasNovaesUserSession.userId = parsedPreferences.userId; // Garante que o userId seja carregado
                console.log("UserTracker: Preferências de usuário carregadas do localStorage.", window.silasNovaesUserSession.preferences);
            } else {
                // Se não há dados, gera um novo userId e inicializa a pontuação
                window.silasNovaesUserSession.userId = generateUniqueId();
                window.silasNovaesUserSession.preferences.leadScore = 0;
                window.silasNovaesUserSession.preferences.leadTemperature = 'Frio';
                console.log("UserTracker: Novo userId gerado e preferências inicializadas.");
            }
            saveUserPersistentData(); // Salva para garantir que o userId inicial seja persistido
        } catch (e) {
            console.error("UserTracker: Erro ao carregar ou inicializar dados persistentes:", e);
            // Fallback para garantir userId mesmo em erro
            if (!window.silasNovaesUserSession.userId) {
                window.silasNovaesUserSession.userId = generateUniqueId();
            }
        }
    }

    // Salva dados persistentes do usuário no localStorage
    function saveUserPersistentData() {
        try {
            // Guarda apenas as preferências que queremos persistir
            const dataToPersist = {
                userId: window.silasNovaesUserSession.userId,
                interestedInHealthPlan: window.silasNovaesUserSession.preferences.interestedInHealthPlan,
                interestedInDentalPlan: window.silasNovaesUserSession.preferences.interestedInDentalPlan,
                contactedBefore: window.silasNovaesUserSession.preferences.contactedBefore,
                visitedPagesCount: window.silasNovaesUserSession.preferences.visitedPagesCount,
                timeSpentOnPages: window.silasNovaesUserSession.preferences.timeSpentOnPages,
                scrollDepthAchieved: window.silasNovaesUserSession.preferences.scrollDepthAchieved,
                formInteractions: window.silasNovaesUserSession.preferences.formInteractions,
                leadScore: window.silasNovaesUserSession.preferences.leadScore,
                leadTemperature: window.silasNovaesUserSession.preferences.leadTemperature
            };
            localStorage.setItem('silasNovaesUserPreferences', JSON.stringify(dataToPersist));
            // console.log("UserTracker: Dados de usuário persistentes salvos no localStorage."); // Depuração
        } catch (e) {
            console.error("UserTracker: Erro ao salvar dados persistentes no localStorage:", e);
        }
    }

    // Envia dados para o Google Analytics via dataLayer (requer GTM/GA4 configurado)
    function pushToDataLayer(eventData) {
        if (typeof dataLayer !== 'undefined') {
            // Adiciona userId, leadScore e leadTemperature a todos os eventos enviados ao dataLayer
            eventData.user_id = window.silasNovaesUserSession.userId;
            eventData.lead_score = window.silasNovaesUserSession.preferences.leadScore;
            eventData.lead_temperature = window.silasNovaesUserSession.preferences.leadTemperature;
            dataLayer.push(eventData);
            console.log("DataLayer Push:", eventData); // Para depuração
        } else {
            console.warn("DataLayer não encontrado. Evento não enviado para GA:", eventData);
        }
    }

    // Calcula a pontuação do lead com base nas interações
    function calculateLeadScore() {
        let score = 0;
        const prefs = window.silasNovaesUserSession.preferences;
        const currentPath = window.location.pathname;

        // Regras de Pontuação:
        if (prefs.visitedPagesCount['/formulario.html'] && prefs.visitedPagesCount['/formulario.html'] > 0) {
            score += 20 * prefs.visitedPagesCount['/formulario.html']; // Visitar a página "Formulário"
        }
        if (prefs.visitedPagesCount['/operadoras.html'] && prefs.visitedPagesCount['/operadoras.html'] > 0) {
            score += 15 * prefs.visitedPagesCount['/operadoras.html']; // Visitar a página "Operadoras"
        }
        if (prefs.visitedPagesCount['/sobre.html'] && prefs.visitedPagesCount['/sobre.html'] > 0) {
            score += 10 * prefs.visitedPagesCount['/sobre.html']; // Visitar a página "Sobre"
        }

        // Preenchimento de formulário (50% ou mais)
        for (const formId in prefs.formInteractions) {
            if (prefs.formInteractions[formId].progress >= 0.5 && !prefs.formInteractions[formId].scoredFiftyPercent) {
                score += 25; // Preencher 50% do formulário
                prefs.formInteractions[formId].scoredFiftyPercent = true; // Marca para não pontuar novamente
                console.log(`Lead scored +25 for 50% form completion on ${formId}`); // Depuração
            }
        }

        // Clicar em "Cote seu Plano" (precisamos rastrear isso como um evento de clique específico)
        // Isso seria tratado no trackClicks com base no texto/ID do botão.
        // Exemplo: if (lastClickText.includes("Cote seu Plano")) score += 15;
        // Por ora, vamos assumir que o "Cote seu Plano" levará ao formulário, o que já gera pontos.

        // Passar mais de 2 minutos em uma página de conteúdo relevante
        for (const pagePath in prefs.timeSpentOnPages) {
            if (prefs.timeSpentOnPages[pagePath] >= 120) { // 120 segundos = 2 minutos
                // Adicione lógica para identificar "páginas de conteúdo relevante" se necessário
                // Por enquanto, todos os tempos > 2min pontuam
                score += 5; // Poderíamos fazer um cálculo mais sofisticado para evitar múltiplos +5 na mesma página
                // Idealmente, isso seria um flag `hasScoredTimeOnPage` por página.
            }
        }

        // Atualiza a pontuação global do lead
        window.silasNovaesUserSession.updatePreference('leadScore', score);
        window.silasNovaesUserSession.updatePreference('leadTemperature', determineLeadTemperature(score));

        // Dispara evento de qualificação de lead se a temperatura mudou ou atingiu um novo nível
        const oldTemperature = localStorage.getItem('lastLeadTemperature') || 'Frio';
        if (window.silasNovaesUserSession.preferences.leadTemperature !== oldTemperature) {
            pushToDataLayer({
                'event': 'lead_qualified',
                'current_temperature': window.silasNovaesUserSession.preferences.leadTemperature,
                'current_score': window.silasNovaesUserSession.preferences.leadScore,
                'previous_temperature': oldTemperature
            });
            localStorage.setItem('lastLeadTemperature', window.silasNovaesUserSession.preferences.leadTemperature);
        }

        console.log("UserTracker: Lead Score atualizado para:", window.silasNovaesUserSession.preferences.leadScore, "| Temperatura:", window.silasNovaesUserSession.preferences.leadTemperature); // Depuração
        saveUserPersistentData(); // Salva pontuação atualizada
    }

    // Determina a temperatura do lead com base na pontuação
    function determineLeadTemperature(score) {
        if (score >= 80) return 'Super Quente';
        if (score >= 50) return 'Quente';
        if (score >= 20) return 'Morno';
        return 'Frio';
    }


    // Rastreamento de visualização de página
    function trackPageView() {
        const pagePath = window.location.pathname;
        const pageTitle = document.title;
        const referrer = document.referrer;

        window.silasNovaesUserSession.currentPage = {
            url: pagePath,
            title: pageTitle,
            timestamp: new Date().toISOString()
        };

        // Atualiza contagem de visitas por página
        window.silasNovaesUserSession.preferences.visitedPagesCount[pagePath] =
            (window.silasNovaesUserSession.preferences.visitedPagesCount[pagePath] || 0) + 1;
        window.silasNovaesUserSession.updatePreference('lastVisitedPage', pagePath);

        // Verifica se a página de origem é de alta intenção e atualiza a preferência global
        let isHighIntentReferrer = false;
        for (const ref of HIGH_INTENT_REFERRERS) {
            if (referrer.includes(ref)) {
                isHighIntentReferrer = true;
                break;
            }
        }
        window.silasNovaesUserSession.updatePreference('cameFromHighIntentPage', isHighIntentReferrer);

        window.silasNovaesUserSession.addInteraction({
            type: 'page_view',
            pageUrl: pagePath,
            pageTitle: pageTitle,
            referrer: referrer,
            timestamp: new Date().toISOString(),
            isHighIntentReferrer: isHighIntentReferrer // Adiciona ao histórico de sessão
        });

        pushToDataLayer({
            'event': 'page_view_custom', // Custom event para não conflitar com o padrão do GA4
            'page_path': pagePath,
            'page_title': pageTitle,
            'page_referrer': referrer,
            'user_agent': navigator.userAgent
        });
        // Reinicia o rastreador de tempo e scroll para a nova página
        startPageTimer();
        resetScrollDepthEvents();
        calculateLeadScore(); // Recalcula a pontuação ao carregar uma nova página
    }

    // Inicia o timer para calcular tempo na página
    function startPageTimer() {
        if (timerInterval) {
            clearInterval(timerInterval); // Limpa qualquer timer anterior
        }
        startTime = Date.now();
        const currentPagePath = window.location.pathname; // Captura o path da página atual

        timerInterval = setInterval(() => {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            window.silasNovaesUserSession.preferences.timeSpentOnPages[currentPagePath] = timeSpent;
            // Opcional: Enviar evento de tempo para GA a cada X segundos (ex: 30s, 60s)
            // if (timeSpent % 30 === 0 && timeSpent > 0) {
            //     pushToDataLayer({
            //         'event': 'time_on_page',
            //         'page_path': currentPagePath,
            //         'time_spent_seconds': timeSpent
            //     });
            // }
            calculateLeadScore(); // Recalcula pontuação periodicamente com o tempo
        }, 5000); // Atualiza a cada 5 segundos
    }


    // Rastreamento de cliques em links e botões
    function trackClicks() {
        document.addEventListener('click', function(event) {
            const target = event.target.closest('a, button, input[type="submit"], .botao-primario, .botao-secundario');
            if (target) {
                const clickData = {
                    type: 'click',
                    timestamp: new Date().toISOString(),
                    elementType: target.tagName,
                    elementId: target.id || '',
                    elementClass: target.className || '',
                    elementText: target.textContent ? target.textContent.trim().substring(0, 100) : (target.value ? target.value.trim().substring(0, 100) : 'N/A'),
                    pageUrl: window.location.href
                };

                if (target.tagName === 'A' && target.href) {
                    clickData.targetUrl = target.href;
                } else if (target.tagName === 'BUTTON' || target.type === 'submit') {
                    clickData.formAction = target.form ? (target.form.action || window.location.href) : '';
                }

                window.silasNovaesUserSession.addInteraction(clickData);

                pushToDataLayer({
                    'event': 'user_interaction',
                    'interaction_type': 'click',
                    'click_element_type': clickData.elementType,
                    'click_element_id': clickData.elementId,
                    'click_element_class': clickData.elementClass,
                    'click_element_text': clickData.elementText,
                    'page_path': window.location.pathname,
                    'target_url': clickData.targetUrl || ''
                });
                calculateLeadScore(); // Recalcula pontuação após um clique
            }
        }, { capture: true }); // Capture: true para pegar eventos em fase de captura
    }

    // Rastreamento de scroll depth (profundidade de rolagem)
    function trackScrollDepth() {
        function calculateScrollDepth() {
            const documentHeight = document.documentElement.scrollHeight;
            const viewportHeight = window.innerHeight;
            const scrollTop = window.scrollY;

            // Se o conteúdo é menor ou igual à viewport, consideramos 100% rolado
            if (documentHeight <= viewportHeight) return 100;

            const scrollPercentage = Math.min(100, Math.round((scrollTop + viewportHeight) / documentHeight * 100));
            return scrollPercentage;
        }

        function sendScrollEvent(percentage) {
            const pagePath = window.location.pathname;
            const eventData = {
                type: 'scroll_depth',
                timestamp: new Date().toISOString(),
                pageUrl: window.location.href,
                scrollPercentage: percentage
            };
            window.silasNovaesUserSession.addInteraction(eventData);

            // Garante que a maior profundidade de scroll seja registrada para a página atual
            window.silasNovaesUserSession.preferences.scrollDepthAchieved[pagePath] = Math.max(
                window.silasNovaesUserSession.preferences.scrollDepthAchieved[pagePath] || 0,
                percentage
            );
            window.silasNovaesUserSession.updatePreference('scrollDepthAchieved', window.silasNovaesUserSession.preferences.scrollDepthAchieved);


            pushToDataLayer({
                'event': 'scroll_depth',
                'page_path': pagePath,
                'scroll_percentage': percentage
            });
            calculateLeadScore(); // Recalcula pontuação após atingir nova profundidade
        }

        function handleScroll() {
            const currentScrollY = window.scrollY;
            // Otimização: calcula e envia evento apenas se houver uma mudança significativa ou se a página acabou de carregar (lastScrollY=0)
            // Também impede spam de eventos em rolagem mínima
            if (Math.abs(currentScrollY - lastScrollY) < 50 && currentScrollY !== 0 && lastScrollY !== 0) {
                 return;
            }
            lastScrollY = currentScrollY;

            const percentage = calculateScrollDepth();
            const pagePath = window.location.pathname;

            // Inicializa o controle de eventos de profundidade para a página atual se não existir
            if (!scrollDepthEventSent[pagePath]) {
                scrollDepthEventSent[pagePath] = { '25': false, '50': false, '75': false, '100': false };
            }

            if (percentage >= 25 && !scrollDepthEventSent[pagePath]['25']) {
                sendScrollEvent(25);
                scrollDepthEventSent[pagePath]['25'] = true;
            }
            if (percentage >= 50 && !scrollDepthEventSent[pagePath]['50']) {
                sendScrollEvent(50);
                scrollDepthEventSent[pagePath]['50'] = true;
            }
            if (percentage >= 75 && !scrollDepthEventSent[pagePath]['75']) {
                sendScrollEvent(75);
                scrollDepthEventSent[pagePath]['75'] = true;
            }
            if (percentage >= 90 && !scrollDepthEventSent[pagePath]['100']) { // Usar 90-95% para "100%"
                sendScrollEvent(100);
                scrollDepthEventSent[pagePath]['100'] = true;
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true }); // Passive para melhor performance de scroll
    }

    // Reinicia os flags de eventos de scroll depth ao mudar de página
    function resetScrollDepthEvents() {
        const pagePath = window.location.pathname;
        scrollDepthEventSent[pagePath] = { '25': false, '50': false, '75': false, '100': false };
    }


    // Rastreamento de interações com formulários (ex: preenchimento de campos, submissão)
    function trackFormInteractions() {
        document.addEventListener('focusin', function(event) {
            const target = event.target;
            if (target.form && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                const formId = target.form.id || target.form.name || 'unnamed_form';
                if (!window.silasNovaesUserSession.preferences.formInteractions[formId]) {
                    window.silasNovaesUserSession.preferences.formInteractions[formId] = { started: false, submitted: false, progress: 0 };
                }
                if (!window.silasNovaesUserSession.preferences.formInteractions[formId].started) {
                    const eventData = {
                        type: 'form_interaction',
                        interactionType: 'form_start',
                        formId: formId,
                        timestamp: new Date().toISOString(),
                        pageUrl: window.location.href
                    };
                    window.silasNovaesUserSession.addInteraction(eventData);
                    pushToDataLayer({
                        'event': 'form_engagement',
                        'form_id': formId,
                        'engagement_type': 'form_start',
                        'page_path': window.location.pathname
                    });
                    window.silasNovaesUserSession.preferences.formInteractions[formId].started = true;
                    calculateLeadScore(); // Recalcula pontuação ao iniciar um formulário
                }
            }
        }, true); // Use capture phase for form interactions

        // Adiciona listener para eventos de input e change para rastrear progresso
        document.addEventListener('input', function(event) {
            const target = event.target;
            if (target.form && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                const formId = target.form.id || target.form.name || 'unnamed_form';
                trackFormProgress(target.form); // Chama a nova função de rastreamento de progresso
            }
        }, true);

        document.addEventListener('submit', function(event) {
            const targetForm = event.target;
            if (targetForm.tagName === 'FORM') {
                const formId = targetForm.id || targetForm.name || 'unnamed_form';
                const eventData = {
                    type: 'form_interaction',
                    interactionType: 'form_submit',
                    formId: formId,
                    timestamp: new Date().toISOString(),
                    pageUrl: window.location.href
                };
                window.silasNovaesUserSession.addInteraction(eventData);
                pushToDataLayer({
                    'event': 'form_engagement',
                    'form_id': formId,
                    'engagement_type': 'form_submit',
                    'page_path': window.location.pathname
                });
                if (!window.silasNovaesUserSession.preferences.formInteractions[formId]) {
                    window.silasNovaesUserSession.preferences.formInteractions[formId] = { started: false, submitted: false, progress: 0 };
                }
                window.silasNovaesUserSession.preferences.formInteractions[formId].submitted = true;
                calculateLeadScore(); // Recalcula pontuação ao submeter um formulário
            }
        });
    }

    // Rastreia o progresso de preenchimento de um formulário
    function trackFormProgress(formElement) {
        if (!formElement) return;

        const formId = formElement.id || formElement.name || 'unnamed_form';
        const formFields = Array.from(formElement.querySelectorAll('input:not([type="submit"]):not([type="hidden"]), textarea, select'));

        if (formFields.length === 0) return;

        let filledFields = 0;
        formFields.forEach(field => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                if (field.checked) {
                    filledFields++;
                }
            } else if (field.value.trim() !== '') {
                filledFields++;
            }
        });

        const progress = filledFields / formFields.length;
        window.silasNovaesUserSession.preferences.formInteractions[formId].progress = progress;
        // console.log(`Form ${formId} progress: ${(progress * 100).toFixed(2)}%`); // Depuração

        calculateLeadScore(); // Recalcula pontuação com base no progresso
    }


    // Inicializa todos os rastreadores
    function init() {
        loadOrCreateUserPersistentData(); // Carrega ou cria dados persistentes do usuário
        // Carrega ou inicializa a sessão do navegador
        try {
            const storedSession = sessionStorage.getItem('silasNovaesUserSession');
            if (storedSession) {
                const parsedSession = JSON.parse(storedSession);
                window.silasNovaesUserSession.sessionId = parsedSession.sessionId;
                window.silasNovaesUserSession.currentPage = parsedSession.currentPage;
                window.silasNovaesUserSession.history = parsedSession.history;
            } else {
                window.silasNovaesUserSession.sessionId = generateUniqueId();
                window.silasNovaesUserSession.addInteraction({
                    type: 'session_start',
                    timestamp: new Date().toISOString(),
                    pageUrl: window.location.href,
                    pageTitle: document.title,
                    referrer: document.referrer
                });
            }
        } catch (e) {
            console.error("UserTracker: Erro ao carregar ou inicializar sessão:", e);
            if (!window.silasNovaesUserSession.sessionId) {
                window.silasNovaesUserSession.sessionId = generateUniqueId();
            }
        }

        trackPageView(); // Rastreia a visualização da página atual e atualiza cameFromHighIntentPage
        trackClicks(); // Rastreia cliques
        trackScrollDepth(); // Rastreia a profundidade de rolagem
        trackFormInteractions(); // Rastreia interações com formulários

        calculateLeadScore(); // Calcula a pontuação inicial ao carregar a página
    }

    return {
        init: init,
        saveUserPersistentData: saveUserPersistentData, // Expõe para salvar manualmente se necessário
        getSessionData: () => JSON.parse(sessionStorage.getItem('silasNovaesUserSession')) || window.silasNovaesUserSession,
        getUserPreferences: () => window.silasNovaesUserSession.preferences, // Expõe preferências persistentes
        pushToDataLayer: pushToDataLayer // Expõe para que outros módulos possam enviar eventos GA com userId, etc.
    };
})();


// === MÓDULO DE GERENCIAMENTO DE POP-UPS E FORMULÁRIOS GLOBAIS ===
// Responsável por criar e exibir pop-ups com conteúdo dinâmico, incluindo formulários.
window.GlobalPopupManager = (function() {
    let currentPopupOverlay = null;

    // Cria e exibe um pop-up genérico
    function showPopup(contentHtml, options = {}) {
        hidePopup(); // Garante que apenas um pop-up esteja ativo por vez

        const {
            title = '',
            message = '',
            addClass = '',
            enableCloseBtn = true,
            closeOnClickOutside = true,
            onClose = () => {},
            onFormSubmit = () => {} // Callback para formulários dentro do popup
        } = options;

        currentPopupOverlay = document.createElement('div');
        currentPopupOverlay.className = `popup-overlay ${addClass}`;

        const popupContainer = document.createElement('div');
        popupContainer.className = 'popup-container';

        let popupContent = '';
        if (title) {
            popupContent += `<h2 class="popup-title">${title}</h2>`;
        }
        if (message) {
            popupContent += `<p class="popup-message">${message}</p>`;
        }
        popupContent += contentHtml; // O conteúdo principal, que pode ser um formulário

        popupContainer.innerHTML = popupContent;

        if (enableCloseBtn) {
            const closeButton = document.createElement('button');
            closeButton.className = 'popup-close-btn';
            closeButton.innerHTML = '&times;'; // Ícone 'X'
            closeButton.setAttribute('aria-label', 'Fechar pop-up');
            closeButton.addEventListener('click', () => {
                hidePopup();
                onClose();
            });
            popupContainer.appendChild(closeButton);
        }

        currentPopupOverlay.appendChild(popupContainer);
        document.body.appendChild(currentPopupOverlay);

        // Força o reflow para garantir a transição
        setTimeout(() => {
            currentPopupOverlay.classList.add('active');
            document.body.classList.add('no-scroll'); // Desativa o scroll do body
        }, 10); // Pequeno atraso para permitir que o CSS seja aplicado antes da transição

        if (closeOnClickOutside) {
            currentPopupOverlay.addEventListener('click', function(event) {
                if (event.target === currentPopupOverlay) {
                    hidePopup();
                    onClose();
                }
            });
        }

        // Adiciona listeners para submissão de formulários dentro do pop-up
        const formInsidePopup = popupContainer.querySelector('form');
        if (formInsidePopup) {
            formInsidePopup.addEventListener('submit', function(e) {
                e.preventDefault(); // Impede o envio padrão para gerenciar via JS
                onFormSubmit(formInsidePopup); // Chama o callback com o formulário
                // Aqui você pode adicionar sua lógica de envio AJAX
                console.log("Formulário submetido no pop-up:", new FormData(formInsidePopup));
                // Exemplo: Simular um envio bem-sucedido e fechar o popup
                alert('Formulário enviado com sucesso!');
                UserTracker.pushToDataLayer({
                    'event': 'custom_form_submitted',
                    'form_id': formInsidePopup.id || 'popup_form',
                    'form_data': 'collected' // Não enviar dados sensíveis para o GA
                });
                hidePopup(); // Fecha o pop-up após a submissão (ou após sucesso do AJAX)
                onClose(); // Executa callback de fechamento
            });

            // Rastreia o progresso do formulário dentro do pop-up
            formInsidePopup.addEventListener('input', function(event) {
                UserTracker.trackFormProgress(formInsidePopup);
            }, true);
        }
    }

    // Oculta o pop-up atualmente ativo
    function hidePopup() {
        if (currentPopupOverlay) {
            currentPopupOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll'); // Reativa o scroll do body
            currentPopupOverlay.addEventListener('transitionend', function handler() {
                if (currentPopupOverlay && !currentPopupOverlay.classList.contains('active')) {
                    currentPopupOverlay.remove();
                    currentPopupOverlay = null;
                }
                currentPopupOverlay.removeEventListener('transitionend', handler);
            });
        }
    }

    // --- Funções de criação de HTML para formulários padrão ---
    function createSimplifiedQuotationForm() {
        return `
            <form id="simplifiedQuotationForm" class="popup-form">
                <p class="popup-message">Quer reduzir o valor das suas mensalidades em até 40%, mantendo exatamente as mesmas coberturas e com uma rede credenciada muito parecida com a sua atual? Preencha abaixo que eu te enviarei opções.</p>
                <div class="form-group">
                    <label for="simplified-name">Nome Completo:</label>
                    <input type="text" id="simplified-name" name="name" placeholder="Seu nome" required>
                </div>
                <div class="form-group">
                    <label for="simplified-email">E-mail:</label>
                    <input type="email" id="simplified-email" name="email" placeholder="seu.email@exemplo.com" required>
                </div>
                <div class="form-group">
                    <label for="simplified-whatsapp">WhatsApp:</label>
                    <input type="tel" id="simplified-whatsapp" name="whatsapp" placeholder="(XX) XXXXX-XXXX" required pattern="\\(?\\d{2}\\)?\\s?\\d{4,5}\\-?\\d{4}">
                </div>
                <button type="submit" class="botao-primario form-submit-btn">Receber Opções!</button>
            </form>
        `;
    }

    function createFullQuotationForm() {
        // Este formulário seria o "principal" da página de formulário
        return `
            <form id="fullQuotationForm" class="popup-form">
                <p class="popup-message">Preencha com mais detalhes para uma cotação ainda mais precisa.</p>
                <div class="form-group">
                    <label for="full-name">Nome Completo:</label>
                    <input type="text" id="full-name" name="name" placeholder="Seu nome" required>
                </div>
                <div class="form-group">
                    <label for="full-email">E-mail:</label>
                    <input type="email" id="full-email" name="email" placeholder="seu.email@exemplo.com" required>
                </div>
                <div class="form-group">
                    <label for="full-whatsapp">WhatsApp:</label>
                    <input type="tel" id="full-whatsapp" name="whatsapp" placeholder="(XX) XXXXX-XXXX" required pattern="\\(?\\d{2}\\)?\\s?\\d{4,5}\\-?\\d{4}">
                </div>
                <div class="form-group">
                    <label for="full-phone">Telefone Fixo (Opcional):</label>
                    <input type="tel" id="full-phone" name="phone" placeholder="(XX) XXXX-XXXX">
                </div>
                <div class="form-group">
                    <label for="full-company-cnpj">CNPJ da Empresa (se aplicável):</label>
                    <input type="text" id="full-company-cnpj" name="cnpj" placeholder="XX.XXX.XXX/XXXX-XX" pattern="\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}">
                </div>
                <div class="form-group">
                    <label for="full-num-beneficiaries">Número de Beneficiários:</label>
                    <input type="number" id="full-num-beneficiaries" name="beneficiaries" min="1" required>
                </div>
                <div class="form-group">
                    <label for="full-current-plan">Possui plano de saúde atualmente?</label>
                    <select id="full-current-plan" name="current_plan">
                        <option value="">Selecione</option>
                        <option value="sim">Sim</option>
                        <option value="nao">Não</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="full-message">Mensagem ou Observações:</label>
                    <textarea id="full-message" name="message" rows="4" placeholder="Detalhes adicionais sobre sua necessidade..."></textarea>
                </div>
                <button type="submit" class="botao-primario form-submit-btn">Solicitar Cotação Completa</button>
            </form>
        `;
    }

    function createWorkWithUsForm() {
        return `
            <form id="workWithUsForm" class="popup-form">
                <p class="popup-message">Junte-se à equipe Silas Novaes! Preencha para enviar seu currículo ou saber mais.</p>
                <div class="form-group">
                    <label for="work-name">Nome Completo:</label>
                    <input type="text" id="work-name" name="name" placeholder="Seu nome" required>
                </div>
                <div class="form-group">
                    <label for="work-email">E-mail:</label>
                    <input type="email" id="work-email" name="email" placeholder="seu.email@exemplo.com" required>
                </div>
                <div class="form-group">
                    <label for="work-whatsapp">WhatsApp:</label>
                    <input type="tel" id="work-whatsapp" name="whatsapp" placeholder="(XX) XXXXX-XXXX" required pattern="\\(?\\d{2}\\)?\\s?\\d{4,5}\\-?\\d{4}">
                </div>
                <div class="form-group">
                    <label for="work-resume">Link para o Currículo (Ex: LinkedIn, Google Drive):</label>
                    <input type="url" id="work-resume" name="resume_link" placeholder="https://linkedin.com/in/seu-perfil" required>
                </div>
                <div class="form-group">
                    <label for="work-interest">Área de Interesse:</label>
                    <textarea id="work-interest" name="interest" rows="3" placeholder="Ex: Vendas, Marketing, Suporte ao Cliente..."></textarea>
                </div>
                <button type="submit" class="botao-primario form-submit-btn">Enviar Inscrição</button>
            </form>
        `;
    }

    // Função que decide qual formulário de cotação retornar com base na temperatura do lead
    function getDynamicQuotationFormHtml() {
        const leadTemperature = UserTracker.getUserPreferences().leadTemperature;
        console.log("GlobalPopupManager: Temperatura do lead para formulário dinâmico:", leadTemperature); // Depuração

        if (leadTemperature === 'Quente' || leadTemperature === 'Super Quente') {
            return createFullQuotationForm();
        } else {
            return createSimplifiedQuotationForm();
        }
    }


    return {
        showPopup: showPopup,
        hidePopup: hidePopup,
        createSimplifiedQuotationForm: createSimplifiedQuotationForm,
        createFullQuotationForm: createFullQuotationForm,
        createWorkWithUsForm: createWorkWithUsForm,
        getDynamicQuotationFormHtml: getDynamicQuotationFormHtml // Método exposto para uso das páginas
    };
})();


// Funções que devem ser executadas após o DOM ser completamente carregado
document.addEventListener("DOMContentLoaded", function() {
    // Adiciona event listener para o botão de toggle do menu
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }

    // Opcional: Fechar o menu ao clicar em um item (se o menu estiver ativo)
    const menu = document.getElementById('menu');
    if (menu) {
        const menuLinks = menu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                const toggleBtn = document.querySelector('.menu-toggle');
                if (menu.classList.contains('active')) {
                    menu.classList.remove('active');
                    if (toggleBtn) {
                        toggleBtn.classList.remove('active');
                        toggleBtn.setAttribute('aria-expanded', 'false');
                    }
                    document.body.classList.remove('no-scroll');
                }
            });
        });
    }

    // Inicializa todas as funcionalidades globais
    initScrollAnimations();
    initFaq(); // Assumindo que você pode ter FAQs em outras páginas no futuro
    updateFooterYear();
    UserTracker.init(); // Inicializa o rastreador de comportamento do usuário
});

// Listener para o evento 'popstate' para rastrear navegação via botão Voltar/Avançar do navegador
window.addEventListener('popstate', function(event) {
    // Garante que o rastreador de página seja chamado quando o URL muda sem um carregamento completo
    UserTracker.trackPageView(); // Chama a função de rastreamento de page view novamente
});