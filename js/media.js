document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('nav-menu').classList.toggle('show');
  });
  
  const typewriterText = "Media";
  const typewriterElement = document.getElementById("typewriter");
  let index = 0;
  
  function typeWriter() {
    if (index < typewriterText.length) {
      typewriterElement.textContent += typewriterText.charAt(index);
      index++;
      setTimeout(typeWriter, 100);
    }
  }
  
  const subtitles = [
    "A picture is worth a thousand words",
    "CSHS Scrapbook!",
    "Events, documented.",
    "CSHS Gallery"
    
  ];
  
  let subtitleIndex = 0;
  const subtitleElement = document.getElementById("subtitle");
  
  function cycleSubtitles() {
    subtitleElement.classList.remove("fade-in");
    setTimeout(() => {
      subtitleElement.textContent = subtitles[subtitleIndex];
      subtitleElement.classList.add("fade-in");
      subtitleIndex = (subtitleIndex + 1) % subtitles.length;
    }, 500);
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    typeWriter();
    cycleSubtitles();
    setInterval(cycleSubtitles, 4000);
  });
  
  



// NAVBAR

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  
  toggle.addEventListener('click', () => {
    nav.classList.toggle('show');
  });
  

// NAVBAR




  // ARROW CODE



  const scrollArrow = document.getElementById('scroll-arrow');
const heroSection = document.getElementById('hero');

scrollArrow.addEventListener('click', () => {
  window.scrollBy({
    top: window.innerHeight,
    behavior: 'smooth'
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    scrollArrow.style.opacity = entry.isIntersecting ? '1' : '0';
  });
}, {
  root: null,
  threshold: 0.1
});

observer.observe(heroSection);
