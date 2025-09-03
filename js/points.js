const scriptURL = "https://script.google.com/macros/s/AKfycbydCQ_VniXST7oWqtHxh6aVT6p1oSBepgJDsV1e6lPc835ycjW7_MGu86kQRxnsj_KU/exec";

// Menu toggle
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('nav-menu').classList.toggle('show');
});

const typewriterText = "Your Points";
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
    "You're Points.",
    "Yes",
    "Yuppie",
    "Innovators. Leaders. Problem Solvers.",
    "Where Passion Meets Precision.",
    "Code with Excellence."
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
  


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const result = document.getElementById("result");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64);

    result.innerHTML = "🔄 Connecting to server...";

    const callbackName = "jsonpCallback_" + Math.floor(Math.random() * 1000000);
    const script = document.createElement("script");

    window[callbackName] = function (data) {
      if (data.success) {
        result.innerHTML = `
          ✅ Welcome <b>${data.name}</b>!<br>
          📝 Meeting Points: <b>${data.meetingPoints}</b><br>
          🛠️ Service Points: <b>${data.servicePoints}</b>
        `;
      } else {
        result.innerHTML = "❌ Invalid username or password.";
      }
      cleanup();
    };

    script.onerror = function () {
      result.innerHTML = "❌ Server error.";
      cleanup();
    };

    function cleanup() {
      document.body.removeChild(script);
      delete window[callbackName];
    }

    script.src = `${scriptURL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(hashedPassword)}&callback=${callbackName}`;
    document.body.appendChild(script);
  });
});


// Fade in/out on scroll
const boxes = document.querySelectorAll('.container, .rules-panel');

function checkVisibility() {
  const triggerBottom = window.innerHeight * 0.9;

  boxes.forEach(box => {
    const boxTop = box.getBoundingClientRect().top;

    if (boxTop < triggerBottom) {
      box.classList.add('visible');
    } else {
      box.classList.remove('visible');
    }
  });
}

// Listen to scroll
window.addEventListener('scroll', checkVisibility);

// Initial check
checkVisibility();



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

