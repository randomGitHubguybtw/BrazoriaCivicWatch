const photosArray = [
    'icons/NotifierFinanceCivicWatchTitle.png',
    'icons/NotifierFinanceNoneYet.png'
];

document.addEventListener("DOMContentLoaded", () => {
    const criminalContainer = document.querySelector('.criminal-card-container');
    const notifierContainer = document.querySelector('.notifier-container');
    
    if (!criminalContainer && !notifierContainer) return;

    let lastScrollY = window.scrollY;
    let isScrollingDown = true;

    window.addEventListener('scroll', () => {
        isScrollingDown = window.scrollY >= lastScrollY;
        lastScrollY = window.scrollY;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const swayEl = entry.target.querySelector('.polaroid-sway');
            
            if (entry.isIntersecting) {
                if (isScrollingDown || !entry.target.hasAttribute('data-seen')) {
                    if (swayEl) {
                        swayEl.classList.remove('animating');
                        void swayEl.offsetWidth; 
                        swayEl.classList.add('animating');
                    }
                    entry.target.setAttribute('data-seen', 'true');
                }
            } else {
                if (swayEl) {
                    swayEl.classList.remove('animating');
                }
            }
        });
    }, { threshold: 0.15 });

    photosArray.forEach(src => {
        const isNotifier = src.toLowerCase().includes('notifier');
        const targetContainer = isNotifier ? notifierContainer : criminalContainer;
        
        if (!targetContainer) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'polaroid-wrapper';

        const randomRotation = (Math.random() * 20 - 10).toFixed(1);
        const randomY = (Math.random() * 80 - 40).toFixed(1);
        const randomScale = (Math.random() * 0.2 + 0.85).toFixed(2);
        
        wrapper.style.transform = `translateY(${randomY}px) rotate(${randomRotation}deg) scale(${randomScale})`;

        const swayContainer = document.createElement('div');
        swayContainer.className = 'polaroid-sway';

        const direction = Math.random() > 0.5 ? 1 : -1;
        const sway1 = (Math.random() * 2 + 2) * direction;
        const sway2 = (Math.random() * 1.5 + 1.5) * -direction;
        const sway3 = (Math.random() * 1 + 1) * direction;
        const sway4 = (Math.random() * 0.5 + 0.5) * -direction;
        const sway5 = (Math.random() * 0.5 + 0.2) * direction;
        const duration = (Math.random() * 0.3 + 0.5).toFixed(2);

        swayContainer.style.setProperty('--sway-1', `${sway1}deg`);
        swayContainer.style.setProperty('--sway-2', `${sway2}deg`);
        swayContainer.style.setProperty('--sway-3', `${sway3}deg`);
        swayContainer.style.setProperty('--sway-4', `${sway4}deg`);
        swayContainer.style.setProperty('--sway-5', `${sway5}deg`);
        swayContainer.style.setProperty('--sway-duration', `${duration}s`);

        const isFlipped = Math.random() > 0.5;
        const pin = document.createElement('img');
        pin.src = 'icons/pin.webp';
        pin.className = `pin ${isFlipped ? 'flipped' : 'unflipped'}`;

        const img = new Image();
        img.alt = "Pinned photo";

        if (isNotifier) {
            wrapper.setAttribute('data-is-notifier', 'true');
            const paperWrapper = document.createElement('div');
            paperWrapper.className = 'notifier-paper';
            img.className = 'notifier-image';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);

                let firstVisibleY = 0;
                try {
                    const centerX = Math.floor(canvas.width / 2);
                    const imgData = ctx.getImageData(centerX, 0, 1, canvas.height).data;
                    
                    for (let y = 0; y < canvas.height; y++) {
                        if (imgData[y * 4 + 3] > 10) { 
                            firstVisibleY = y;
                            break;
                        }
                    }
                } catch (e) {
                    firstVisibleY = img.naturalHeight * 0.05; 
                }

                const percentY = (firstVisibleY / canvas.height) * 100;
                wrapper.style.setProperty('--pin-y', `${percentY}%`);
                swayContainer.style.transformOrigin = `50% ${percentY}%`;
            };

            paperWrapper.appendChild(img);
            swayContainer.appendChild(paperWrapper);
        } else {
            const polaroid = document.createElement('div');
            polaroid.className = 'polaroid';
            polaroid.appendChild(img);
            swayContainer.appendChild(polaroid);
        }
        
        img.src = src;

        wrapper.appendChild(pin);
        wrapper.appendChild(swayContainer);

        targetContainer.appendChild(wrapper);
        observer.observe(wrapper);
    });
});