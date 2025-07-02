// assets/js/sobre.js

document.addEventListener("DOMContentLoaded", function() {
    // --- Elementos do Pop-up Personalizado (Autoridade) ---
    const authorityPopupOverlay = document.getElementById('authority-popup-overlay');
    const closeAuthorityPopupBtn = authorityPopupOverlay ? authorityPopupOverlay.querySelector('.close-popup-btn') : null;
    const authorityPopupTitle = authorityPopupOverlay ? authorityPopupOverlay.querySelector('.popup-title') : null;
    const authorityPopupMessage = authorityPopupOverlay ? authorityPopupOverlay.querySelector('.popup-message') : null;
    const authorityPopupVideoContainer = authorityPopupOverlay ? authorityPopupOverlay.querySelector('.popup-video-container') : null;
    const authorityPopupVideoIframe = authorityPopupVideoContainer ? authorityPopupVideoContainer.querySelector('iframe') : null;
    const authorityPopupCta = authorityPopupOverlay ? authorityPopupOverlay.querySelector('.popup-cta') : null;
    const authorityPopupSocialLinks = authorityPopupOverlay ? authorityPopupOverlay.querySelector('.popup-social-links') : null;

    // A flag de "já mostrado" para o pop-up de autoridade nesta sessão
    let authorityPopupShown = sessionStorage.getItem('authorityPopupShownOnAboutPage');

    // --- Rastreamento de Tempo de Permanência por Seção (Lógica Original MANTIDA) ---
    const sectionsToObserveHtmlIds = [
        'video-conheca-silas',
        'historia-section',
        'trajetoria-section',
        'filosofia-section',
        'metodo-section',
        'conquistas-section'
    ];

    const activeSections = {}; // { sectionHtmlId: { startTime: timestamp, category: '...' } }
    const sectionDurations = { // Para acumular o tempo de visualização por categoria
        'conheca_silas_video': 0,
        'historia_e_jornada': 0,
        'filosofia_e_metodo': 0
    };

    // Mapeamento de IDs do HTML para as categorias de interesse final
    const sectionCategoryMap = {
        'video-conheca-silas': 'conheca_silas_video',
        'historia-section': 'historia_e_jornada',
        'trajetoria-section': 'historia_e_jornada',
        'filosofia-section': 'filosofia_e_metodo',
        'metodo-section': 'filosofia_e_metodo',
        'conquistas-section': 'filosofia_e_metodo' // Conquistas também se alinha com expertise/método
    };

    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.3 // Aciona quando 30% da seção está visível
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const sectionHtmlId = entry.target.id;
            const category = sectionCategoryMap[sectionHtmlId];

            if (category) {
                if (entry.isIntersecting) {
                    activeSections[sectionHtmlId] = { startTime: Date.now(), category: category };
                } else {
                    if (activeSections[sectionHtmlId]) {
                        const duration = Date.now() - activeSections[sectionHtmlId].startTime;
                        sectionDurations[category] += duration;
                        delete activeSections[sectionHtmlId];
                    }
                }
            }
        });
    }, observerOptions);

    sectionsToObserveHtmlIds.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            sectionObserver.observe(section);
        }
    });

    // --- Funções para o Pop-up Personalizado (Autoridade) ---
    /**
     * Exibe o pop-up de autoridade com conteúdo dinâmico.
     * @param {string} title - Título do pop-up.
     * @param {string} message - Mensagem do pop-up.
     * @param {string} ctaText - Texto do botão CTA (se type for 'link' ou 'social').
     * @param {string} ctaLink - Link do CTA (se type for 'link').
     * @param {string} displayType - Tipo de conteúdo a exibir ('video', 'link', 'social', 'text_only').
     * @param {string} videoSrc - URL do vídeo para o iframe (se displayType for 'video').
     */
    function showPersonalizedPopup(title, message, ctaText = '', ctaLink = '', displayType = 'text_only', videoSrc = null) {
        if (!authorityPopupOverlay || authorityPopupShown === 'true') {
            console.log("Pop-up de Autoridade já exibido nesta sessão ou elemento não encontrado. Não acionando novamente.");
            return; // Garante que o pop-up existe e não foi mostrado nesta sessão
        }

        // Preenche o conteúdo básico
        if (authorityPopupTitle) authorityPopupTitle.textContent = title;
        if (authorityPopupMessage) authorityPopupMessage.textContent = message;

        // Esconde todos os elementos opcionais por padrão
        if (authorityPopupVideoContainer) authorityPopupVideoContainer.style.display = 'none';
        if (authorityPopupVideoIframe) authorityPopupVideoIframe.src = ''; 
        if (authorityPopupCta) authorityPopupCta.style.display = 'none';
        if (authorityPopupSocialLinks) authorityPopupSocialLinks.style.display = 'none';

        // Mostra elementos com base no displayType
        if (displayType === 'video' && videoSrc && authorityPopupVideoContainer && authorityPopupVideoIframe) {
            authorityPopupVideoContainer.style.display = 'block';
            authorityPopupVideoIframe.src = videoSrc;
        } else if (displayType === 'social' && authorityPopupSocialLinks) {
            authorityPopupSocialLinks.style.display = 'flex'; // Usar flex para os ícones sociais
        } else if (displayType === 'link' && authorityPopupCta) {
            authorityPopupCta.style.display = 'inline-block';
            authorityPopupCta.textContent = ctaText;
            authorityPopupCta.href = ctaLink;
        } else if (displayType === 'text_only') {
            // No caso de text_only, os elementos ficam escondidos, apenas título e mensagem visíveis
        }

        authorityPopupOverlay.classList.add('active'); // Ativa a visibilidade do overlay
        document.body.classList.add('no-scroll'); // Bloqueia o scroll do body
        sessionStorage.setItem('authorityPopupShownOnAboutPage', 'true'); // Marca o pop-up como exibido
        authorityPopupShown = 'true'; // Atualiza a flag em memória

        if (typeof dataLayer !== 'undefined') {
            dataLayer.push({
                'event': 'popup_autoridade_exibido',
                'event_category': 'engajamento',
                'event_label': title,
                'origin_page': document.referrer,
                'lead_temperature_at_popup': window.silasNovaesUserSession.preferences.leadTemperature
            });
        }
        console.log("Pop-up de Autoridade ACIONADO."); // Para depuração
    }

    /**
     * Oculta o pop-up de autoridade.
     */
    function hidePersonalizedPopup() {
        if (authorityPopupOverlay && authorityPopupOverlay.classList.contains('active')) {
            authorityPopupOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll'); // Reabilita o scroll do body
            if (authorityPopupVideoIframe) authorityPopupVideoIframe.src = ''; // Pausa o vídeo ao fechar
            console.log("Pop-up de Autoridade ESCONDIDO."); // Para depuração
        }
    }

    // --- Lógica de Exit Intent para a Página 'Sobre' (com personalização via leadTemperature) ---
    document.documentElement.addEventListener('mouseleave', function(e) {
        // Verifica se o mouse saiu para a parte superior da janela (clássico exit intent)
        if (e.clientY < 5 && e.relatedTarget === null) {
            console.log("Exit Intent detectado (mouse saiu para o topo)."); // Para depuração
            
            // Verifica se o pop-up de autoridade já foi mostrado nesta sessão
            if (sessionStorage.getItem('authorityPopupShownOnAboutPage')) {
                console.log("Pop-up de Autoridade já exibido nesta sessão. Não acionando novamente.");
                return; // Não mostra novamente se já foi exibido
            }

            // Acesso à preferência global atualizada pelo UserTracker
            const userPreferences = window.silasNovaesUserSession.preferences;
            const cameFromHighIntent = userPreferences.cameFromHighIntentPage;
            const leadTemperature = userPreferences.leadTemperature;
            console.log("UserTracker: cameFromHighIntentPage:", cameFromHighIntent, "| Lead Temperature:", leadTemperature); // Para depuração

            // PRIORIDADE 1: Se veio de uma página de alta intenção (indica interesse forte recente)
            if (cameFromHighIntent) {
                showPersonalizedPopup(
                    'Sua Saúde Merece a Melhor Orientação!',
                    'Percebemos seu interesse em serviços de saúde! Assista ao vídeo e descubra como a experiência de Silas Novaes pode te guiar na escolha do plano perfeito. Nossos clientes avaliam nossos serviços com excelência.',
                    'Receber Cotação Gratuita', 
                    'formulario.html',       
                    'video',                  
                    'https://www.youtube.com/embed/SUA_VIDEO_ID_POPUP?controls=1&modestbranding=1&rel=0&autoplay=1' // Vídeo de depoimentos/autoridade
                );
                // Limpa a flag de alta intenção na sessão do UserTracker para evitar re-disparos desnecessários
                window.silasNovaesUserSession.updatePreference('cameFromHighIntentPage', false);
                return; // Sai, pois o pop-up prioritário já foi mostrado
            }

            // PRIORIDADE 2: Baseado na temperatura do lead (engajamento geral no site)
            if (leadTemperature === 'Quente' || leadTemperature === 'Super Quente') {
                showPersonalizedPopup(
                    'Pronto para ter o Melhor Plano de Saúde?',
                    'Seu alto engajamento mostra que você está buscando a melhor solução. Converse diretamente com Silas Novaes e finalize sua cotação sem compromisso!',
                    'Solicitar Minha Cotação Agora',
                    'formulario.html',
                    'link' // Apenas um link, sem vídeo ou social
                );
            } else if (leadTemperature === 'Morno' || leadTemperature === 'Frio') {
                // Se o lead está frio/morno, focamos em construir mais confiança e autoridade
                showPersonalizedPopup(
                    'Construa Sua Confiança com um Especialista!',
                    'Você está na página Cerca de Silas. Entendemos que a confiança é fundamental. Explore minhas redes sociais e veja como posso ajudar você e sua família a encontrar o plano ideal.',
                    '', // CTA text, not used for 'social'
                    '', // CTA link, not used for 'social'
                    'social' // Exibe apenas os links sociais
                );
            } else {
                // Fallback genérico se a temperatura não se encaixar em nenhum dos casos acima (ou for "Frio" e não veio de alta intenção)
                showPersonalizedPopup(
                    'Ficou com Alguma Dúvida?',
                    'Minha missão é simplificar a escolha do seu plano de saúde. Estou à disposição para conversar e tirar todas as suas dúvidas sem compromisso.',
                    'Falar com o Silas no WhatsApp',
                    'https://wa.me/5583991092624',
                    'link'
                );
            }
        }
    });

    // REMOVIDO: O listener de 'mouseenter' em headerNavLinks.
    // MOTIVO: A lógica de personalização agora é centralizada no evento 'mouseleave' (exit intent),
    // que é mais abrangente e lida com a prioridade de 'cameFromHighIntentPage' e 'leadTemperature'.
    // A manutenção de dois gatilhos separados com lógica de personalização sobreposta poderia
    // levar a comportamentos inesperados ou duplicação desnecessária.

    // --- Eventos de Fechamento do Pop-up Personalizado ---
    if (authorityPopupOverlay) {
        if (closeAuthorityPopupBtn) {
            closeAuthorityPopupBtn.addEventListener('click', hidePersonalizedPopup);
        }
        authorityPopupOverlay.addEventListener('click', function(event) {
            if (event.target === authorityPopupOverlay) {
                hidePersonalizedPopup();
            }
        });
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && authorityPopupOverlay.classList.contains('active')) {
                hidePersonalizedPopup();
            }
        });
        if (authorityPopupCta) {
            // Garante que o CTA do pop-up também feche o pop-up
            authorityPopupCta.addEventListener('click', hidePersonalizedPopup);
        }
    }

    // --- Lógica para parar de rastrear tempo ao sair da página ---
    window.addEventListener('beforeunload', () => {
        for (const sectionHtmlId in activeSections) {
            const item = activeSections[sectionHtmlId];
            if (item) {
                sectionDurations[item.category] += (Date.now() - item.startTime);
            }
        }
        // Opcional: salvar sectionDurations em sessionStorage/localStorage para persistência entre visitas
        // sessionStorage.setItem('silasAboutPageDurations', JSON.stringify(sectionDurations));
    });

    // Limpa flags de sessão que podem ter sido setadas em outras páginas
    // Isso é importante para que o comportamento do pop-up de saída do formulário e banner
    // seja resetado quando o usuário visita a página 'Sobre'.
    sessionStorage.removeItem('formSubmittedSuccessfully');
    sessionStorage.removeItem('clickedBannerReduceMonthly'); 
    
    // Para facilitar os testes, você pode descomentar a linha abaixo para limpar a flag do pop-up de autoridade
    // a cada carregamento da página "Sobre". REMOVA EM AMBIENTE DE PRODUÇÃO!
    // sessionStorage.removeItem('authorityPopupShownOnAboutPage');
});