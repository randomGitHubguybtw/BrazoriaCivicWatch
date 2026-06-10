document.querySelectorAll("button:not(.search-button)")
  .forEach(b => b.outerHTML = `<a href="webpages/construction.html">${b.outerHTML}</a>`);
document.querySelectorAll(".card-container:not(.recent-meetings-button)")
  .forEach(b => b.outerHTML = `<a href="webpages/construction.html">${b.outerHTML}</a>`);


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