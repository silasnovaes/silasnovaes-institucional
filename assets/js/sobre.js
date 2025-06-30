// assets/js/sobre.js

document.addEventListener("DOMContentLoaded", function() {
    // --- Elementos do Pop-up ---
    const popupOverlay = document.getElementById('personalized-popup-overlay');
    const popupContent = popupOverlay.querySelector('.personalized-popup-content');
    const popupTitle = popupOverlay.querySelector('.popup-title');
    const popupMessage = popupOverlay.querySelector('.popup-message');
    const popupVideoContainer = popupOverlay.querySelector('.popup-video-container');
    const popupVideoIframe = popupVideoContainer.querySelector('iframe');
    const popupCta = popupOverlay.querySelector('.popup-cta');
    const popupSocialLinks = popupOverlay.querySelector('.popup-social-links');
    const closePopupBtn = popupOverlay.querySelector('.close-popup-btn');

    let popupShown = sessionStorage.getItem('popupShownOnAboutPage'); // Usar sessionStorage para a sessão atual

    // --- Rastreamento de Tempo de Permanência por Seção ---
    // Mapeia IDs do HTML para categorias de interesse
    const sectionsToObserve = {
        'conheca_silas_video': document.getElementById('video-conheca-silas'),
        'historia_e_jornada': document.getElementById('historia-section'),
        'trajetoria_section_add': document.getElementById('trajetoria-section'), // Adicionamos separadamente mas agruparemos
        'filosofia_e_metodo': document.getElementById('filosofia-section'),
        'metodo_section_add': document.getElementById('metodo-section'), // Adicionamos separadamente mas agruparemos
        'conquistas_section_add': document.getElementById('conquistas-section') // Adicionamos separadamente mas agruparemos
    };

    const activeSections = {}; // { sectionId: { startTime: timestamp, category: '...' } }
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
                    // Se a seção entrar na viewport, inicia o timer
                    activeSections[sectionHtmlId] = { startTime: Date.now(), category: category };
                } else {
                    // Se a seção sair da viewport, calcula e acumula o tempo
                    if (activeSections[sectionHtmlId]) {
                        const duration = Date.now() - activeSections[sectionHtmlId].startTime;
                        sectionDurations[category] += duration;
                        delete activeSections[sectionHtmlId]; // Remove do controle de seções ativas
                    }
                }
            }
        });
    }, observerOptions);

    // Observa todas as seções relevantes
    for (const key in sectionsToObserve) {
        if (sectionsToObserve[key]) {
            sectionObserver.observe(sectionsToobserve[key]);
        }
    }

    // --- Funções para o Pop-up ---
    function showPopup(title, message, ctaType, ctaLink, videoSrc = null) {
        popupTitle.textContent = title;
        popupMessage.textContent = message;

        // Esconde todos os elementos opcionais por padrão
        popupVideoContainer.style.display = 'none';
        popupVideoIframe.src = ''; // Limpa o src do iframe para parar o vídeo
        popupCta.style.display = 'none';
        popupSocialLinks.style.display = 'none';

        // Mostra elementos com base no tipo de CTA
        if (ctaType === 'video' && videoSrc) {
            popupVideoContainer.style.display = 'block';
            popupVideoIframe.src = videoSrc; // Define o src para o vídeo no pop-up
        } else if (ctaType === 'social') {
            popupSocialLinks.style.display = 'flex';
        } else { // Padrão: CTA de link
            popupCta.style.display = 'inline-block';
            popupCta.textContent = ctaType; // Aqui ctaType é o texto do botão
            popupCta.href = ctaLink;
        }
        
        popupOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        sessionStorage.setItem('popupShownOnAboutPage', 'true'); // Usar sessionStorage
        // Opcional: Enviar evento para Google Analytics
        if (typeof gtag === 'function') {
            gtag('event', 'popup_exibido', {
                'event_category': 'engajamento',
                'event_label': title
            });
        }
    }

    function hidePopup() {
        popupOverlay.classList.remove('active');
        document.body.style.overflow = '';
        popupVideoIframe.src = ''; // Garante que o vídeo pare ao fechar
    }

    closePopupBtn.addEventListener('click', hidePopup);
    popupOverlay.addEventListener('click', function(event) {
        if (event.target === popupOverlay) {
            hidePopup();
        }
    });

    // --- Lógica para Pop-up de Saída (Exit Intent) ---
    document.addEventListener('mouseleave', function(event) {
        // Verifica se o mouse saiu pela parte superior da janela
        if (event.clientY < 10 && !popupShown) {
            // Antes de mostrar o pop-up, calcula a duração final para seções ainda ativas
            for (const sectionHtmlId in activeSections) {
                const item = activeSections[sectionHtmlId];
                sectionDurations[item.category] += (Date.now() - item.startTime);
            }

            let predominantInterest = 'geral'; // Padrão
            let maxDuration = 0;

            for (const category in sectionDurations) {
                if (sectionDurations[category] > maxDuration) {
                    maxDuration = sectionDurations[category];
                    predominantInterest = category;
                }
            }

            // Exibe o pop-up com base no interesse predominante
            switch (predominantInterest) {
                case 'conheca_silas_video':
                    showPopup(
                        'Ainda quer saber mais sobre mim?',
                        'Percebi que você se interessou pela minha apresentação. Que tal um vídeo exclusivo para ir além e entender como minha jornada pode transformar a saúde da sua família?',
                        'video',
                        'https://www.youtube.com/embed/SUA_VIDEO_ID_POPUP?controls=1&modestbranding=1&rel=0&autoplay=1' // URL do vídeo de pop-up
                    );
                    break;
                case 'historia_e_jornada':
                    showPopup(
                        'Minha Jornada, Sua Confiança!',
                        'Você explorou minha história e trajetória. Conecte-se nas redes sociais para acompanhar mais de perto a minha dedicação e expertise!',
                        'social' // Indica que deve exibir os links sociais
                    );
                    break;
                case 'filosofia_e_metodo':
                    showPopup(
                        'Sua Saúde Merece o Melhor Método!',
                        'Minha filosofia é clara: excelência e transparência. Deixe-me aplicar meu método comprovado para encontrar o plano de saúde perfeito para você e sua família.',
                        'Solicitar Cotação Personalizada',
                        'formulario.html'
                    );
                    break;
                default: // Interesse geral ou não detectado (pouco tempo na página, por exemplo)
                    showPopup(
                        'Ficou com Alguma Dúvida?',
                        'Minha missão é simplificar a escolha do seu plano de saúde. Estou à disposição para conversar e tirar todas as suas dúvidas sem compromisso.',
                        'Falar com o Silas no WhatsApp',
                        'https://wa.me/5583991092624'
                    );
                    break;
            }
        }
    });

    // Limpa a flag do pop-up da sessionStorage quando a sessão termina (navegador fecha)
    // Para testar, você pode limpar manualmente o sessionStorage no console do navegador.
    // sessionStorage.clear(); ou sessionStorage.removeItem('popupShownOnAboutPage');

    // Reativação da animação de fade-in global
    const animatedElements = document.querySelectorAll(".animate-fade-in");
    const observerFadeIn = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observerFadeIn.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(element => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.8s ease, transform 0.8s ease";
        observerFadeIn.observe(element);
    });
});