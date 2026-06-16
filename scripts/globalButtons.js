document.body.addEventListener('click', (event) => {
  
  const routeTarget = event.target.closest('.js-div-button, .js-sidebar-button, .js-footer-text, button');

  if (!routeTarget) return;
  if (routeTarget.classList.contains('js-search-button')) return;
  

  const destination = routeTarget.dataset.target || routeTarget.getAttribute('href');

  if (destination) {
    window.location.href = destination;
  } else {
    event.preventDefault();
    window.location.href = "webpages/construction.html";
  }
});