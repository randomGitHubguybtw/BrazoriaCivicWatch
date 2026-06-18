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
        clearInterval(timerInterval);
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

    // Sets up infinite loop visually by moving the last card to the front
    wheel.prepend(wheel.lastElementChild);

    const getScrollAmount = () => {
        const card = wheel.querySelector('.card-container');
        return card.offsetWidth + 15; // Width of card + the CSS gap
    };

    // Button / Slide Logic
    const slideNext = () => {
        if (isAnimating) return;
        isAnimating = true;
        
        const shiftAmount = getScrollAmount();
        
        wheel.style.transition = 'transform 0.3s ease';
        wheel.style.transform = `translateX(-${shiftAmount}px)`;
        
        setTimeout(() => {
            wheel.style.transition = 'none';
            wheel.appendChild(wheel.firstElementChild);
            wheel.style.transform = 'translateX(0)';
            isAnimating = false;
        }, 300);
    };

    const slidePrev = () => {
        if (isAnimating) return;
        isAnimating = true;
        
        const shiftAmount = getScrollAmount();
        
        wheel.style.transition = 'none';
        wheel.prepend(wheel.lastElementChild);
        wheel.style.transform = `translateX(-${shiftAmount}px)`;
        
        void wheel.offsetWidth; // Force CSS refresh
        
        wheel.style.transition = 'transform 0.3s ease';
        wheel.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            isAnimating = false;
        }, 300);
    };

    nextBtn.addEventListener('click', slideNext);
    prevBtn.addEventListener('click', slidePrev);

    // Swipe & Drag Logic
    const handleDragStart = (e) => {
        isDragging = true;
        startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        endX = startX; // Reset to prevent stale values blocking clicks
    };

    const handleDragEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        endX = e.type.includes('touch') ? e.changedTouches[0].clientX : e.clientX;
        const diff = startX - endX;
        
        // Threshold for a swipe to trigger
        if (diff > 50) {
            slideNext();
        } else if (diff < -50) {
            slidePrev();
        }
    };

    // Prevent accidental link clicks ONLY if the user was intentionally dragging/swiping
    wheel.addEventListener('click', (e) => {
        if (Math.abs(startX - endX) > 10) {
            e.preventDefault();
        }
    });


    wheel.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mouseup', handleDragEnd);
    
    wheel.addEventListener('touchstart', handleDragStart, { passive: true });
    wheel.addEventListener('touchend', handleDragEnd, { passive: true });
});