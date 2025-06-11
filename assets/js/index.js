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

        // Removido: O loop que adicionava/removia a classe 'active' nos slides.
        // A visibilidade e posicionamento agora são controlados via transform no container.

        function showSlideHome(index) {
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
            // Removido: O loop que adicionava/removia a classe 'active' nos slides aqui também.
        }

        function nextSlideHome() {
            currentIndexHome = (currentIndexHome + 1) % slidesHome.length;
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
                currentIndexHome = index; // Atualiza o índice para o autoslide
                resetAutoSlideHome(); // Reinicia o timer ao clicar
            });
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