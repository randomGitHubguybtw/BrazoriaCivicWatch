const API_BASE = 'https://api.brazoriacivicwatch.org';
const countdownElement = document.querySelector('.js-election-countdown');
let timeInterval;

const startCountdown = async () => {
    try {
        const userCity = sessionStorage.getItem('city');

        const [electionsResponse, seatsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/elections`),
            fetch(`${API_BASE}/api/seats`)
        ]);

        if (!electionsResponse.ok || !seatsResponse.ok) throw new Error("API error");
        
        const allElections = await electionsResponse.json();
        const allSeats = await seatsResponse.json();

        const relevantSeats = allSeats.filter(seat => 
            seat.scope === 'major' || 
            seat.scope === 'state' || 
            seat.scope === 'general' || 
            (seat.scope === 'local' && seat.city === userCity)
        );

        const validElectionIds = new Set(relevantSeats.map(seat => seat.election_id));
        const now = new Date();

        const upcoming = allElections
            .filter(el => {
                if (!validElectionIds.has(el.election_id)) return false;
                const [y, m, d] = el.date.split('-');
                const electionDate = new Date(y, m - 1, d);
                return electionDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcoming.length === 0) {
            if (countdownElement) countdownElement.innerHTML = "No upcoming elections";
            return;
        }

        const next = upcoming[0];
        const [y, m, d] = next.date.split('-');
        const targetDate = new Date(y, m - 1, d).getTime();

        sessionStorage.setItem('targetElection', next.election_id);

        if (timeInterval) clearInterval(timeInterval);

        timeInterval = setInterval(() => {
            const nowTime = new Date().getTime();
            const distance = targetDate - nowTime;

            const isVoteDay = new Date().toDateString() === new Date(y, m - 1, d).toDateString();

            if (isVoteDay) {
                clearInterval(timeInterval);
                if (countdownElement) countdownElement.innerHTML = "Vote day!";
                return;
            }

            if (distance < 0) {
                clearInterval(timeInterval);
                startCountdown();
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (countdownElement) {
                countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
        }, 1000);

    } catch (error) {
        if (countdownElement) countdownElement.innerHTML = "Error loading timer";
    }
};

startCountdown();

document.addEventListener('click', startCountdown);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        startCountdown();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('cardWheel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let isAnimating = false;
    let startX = 0;
    let endX = 0;
    let isDragging = false;
    let actionQueue = [];

    if (wheel) {
        wheel.prepend(wheel.lastElementChild);
    }

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

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            queueNext();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            queuePrev();
        });
    }

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

    if (wheel) {
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
    }
});