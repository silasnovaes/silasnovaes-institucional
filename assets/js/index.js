document.addEventListener("DOMContentLoaded", function() {
    // Script para Slider de Depoimentos na Home
    const sliderHome = document.getElementById('depoimentos-slider');
    const dotsContainerHome = document.getElementById('depoimentos-home-controls');
    let slidesHome = [];
    let dotsHome = [];
    let currentIndexHome = 0;
    let autoSlideIntervalHome;

    if (sliderHome && dotsContainerHome) {
        slidesHome = Array.from(sliderHome.querySelectorAll('.depoimento'));
        dotsHome = Array.from(dotsContainerHome.querySelectorAll('.slider-dot'));

        // Se houver apenas um slide, desativa o autoslide e os controles
        if (slidesHome.length <= 1) {
            dotsContainerHome.style.display = 'none'; // Esconde os indicadores
            return; // Sai da função, não inicializa o slider
        }

        function showSlideHome(index) {
            // Garante que o índice esteja dentro dos limites
            if (index >= slidesHome.length) {
                index = 0;
            } else if (index < 0) {
                index = slidesHome.length - 1;
            }
            currentIndexHome = index; // Atualiza o índice global

            // Calcula o valor do transform com base no índice do slide atual
            // Cada slide tem 100% de largura, então move em -index * 100%
            sliderHome.style.transform = `translateX(-${index * 100}%)`;

            // Atualiza o ponto de controle (dot) ativo
            dotsHome.forEach((dot, i) => {
                dot.classList.remove('active');
                if (i === index) {
                    dot.classList.add('active');
                }
            });
        }

        function nextSlideHome() {
            currentIndexHome = (currentIndexHome + 1) % slidesHome.length;
            showSlideHome(currentIndexHome);
        }

        function prevSlideHome() {
            currentIndexHome = (currentIndexHome - 1 + slidesHome.length) % slidesHome.length;
            showSlideHome(currentIndexHome);
        }

        function startAutoSlideHome() {
            autoSlideIntervalHome = setInterval(nextSlideHome, 5000); // Muda a cada 5 segundos
        }

        function resetAutoSlideHome() {
            clearInterval(autoSlideIntervalHome);
            startAutoSlideHome();
        }

        dotsHome.forEach(dot => {
            dot.addEventListener('click', function() {
                const index = parseInt(this.dataset.slideIndex);
                showSlideHome(index);
                resetAutoSlideHome(); // Reinicia o timer ao clicar
            });
        });

        // ADICIONADO: Navegação por teclado para acessibilidade
        document.addEventListener('keydown', function(event) {
            if (sliderHome.contains(document.activeElement) || document.activeElement.closest('#depoimentos-slider')) {
                if (event.key === 'ArrowLeft') {
                    prevSlideHome();
                    resetAutoSlideHome();
                } else if (event.key === 'ArrowRight') {
                    nextSlideHome();
                    resetAutoSlideHome();
                }
            }
        });


        // Configuração inicial
        showSlideHome(currentIndexHome); // Garante que o primeiro slide seja exibido corretamente
        startAutoSlideHome();

        // Pausa/retoma o autoslide ao passar o mouse sobre o slider ou dots
        sliderHome.addEventListener('mouseenter', () => clearInterval(autoSlideIntervalHome));
        sliderHome.addEventListener('mouseleave', startAutoSlideHome);
        dotsContainerHome.addEventListener('mouseenter', () => clearInterval(autoSlideIntervalHome));
        dotsContainerHome.addEventListener('mouseleave', startAutoSlideHome);
    }
});