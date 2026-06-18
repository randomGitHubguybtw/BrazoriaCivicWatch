const targetDate = new Date('2026-11-03T00:00:00').getTime();

const countdownElement = document.querySelector('.js-election-countdown');

const timeInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    if (distance < 0) {
        clearInterval(timeInterval);
        countdownElement.innerHTML = "Go Vote!";
    }
}, 1000);

document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('cardWheel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let isAnimating = false;
    let startX = 0;
    let endX = 0;
    let isDragging = false;
    let actionQueue = [];

    wheel.prepend(wheel.lastElementChild);

    const getScrollAmount = () => {
        const card = wheel.querySelector('.card-container');
        return card.offsetWidth + 15;
    };

    const processQueue = () => {
        if (isAnimating || actionQueue.length === 0) return;
        isAnimating = true;
        
        const action = actionQueue.shift();
        const shiftAmount = getScrollAmount();
        
        const duration = Math.max(50, 150 - (actionQueue.length * 30));

        if (action === 'next') {
            wheel.style.transition = `transform ${duration}ms ease`;
            wheel.style.transform = `translateX(-${shiftAmount}px)`;
            
            setTimeout(() => {
                wheel.style.transition = 'none';
                wheel.appendChild(wheel.firstElementChild);
                wheel.style.transform = 'translateX(0)';
                isAnimating = false;
                processQueue();
            }, duration);
        } else if (action === 'prev') {
            wheel.style.transition = 'none';
            wheel.prepend(wheel.lastElementChild);
            wheel.style.transform = `translateX(-${shiftAmount}px)`;
            
            void wheel.offsetWidth;
            
            wheel.style.transition = `transform ${duration}ms ease`;
            wheel.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                isAnimating = false;
                processQueue();
            }, duration);
        }
    };

    const queueNext = () => {
        if (actionQueue.length < 5) actionQueue.push('next');
        processQueue();
    };

    const queuePrev = () => {
        if (actionQueue.length < 5) actionQueue.push('prev');
        processQueue();
    };

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        queueNext();
    });

    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        queuePrev();
    });

    const handleDragStart = (e) => {
        isDragging = true;
        startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        endX = startX;
    };

    const handleDragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        endX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
        const diff = startX - endX;
        
        if (diff > 50) {
            queueNext();
        } else if (diff < -50) {
            queuePrev();
        }
    };

    wheel.addEventListener('click', (e) => {
        if (Math.abs(startX - endX) > 10) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    wheel.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mouseup', handleDragEnd);
    
    wheel.addEventListener('touchstart', handleDragStart, { passive: true });
    wheel.addEventListener('touchend', handleDragEnd, { passive: true });
});