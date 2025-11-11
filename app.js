const slidesTrack = document.querySelector('.slides');
const slides = Array.from(document.querySelectorAll('.slide'));
const dockItems = Array.from(document.querySelectorAll('.dock-item'));
const statusLabel = document.querySelector('[data-dynamic="label"]');
const cursorGlow = document.querySelector('.cursor-glow');
const scrollHint = document.querySelector('.scroll-hint');
let currentIndex = 0;
let isTransitioning = false;
let lastNavigate = 0;
const NAVIGATION_COOLDOWN = 650;

const clampIndex = (index) => {
  if (index < 0) return slides.length - 1;
  if (index >= slides.length) return 0;
  return index;
};

const updateDock = (index) => {
  dockItems.forEach((item) => {
    const isActive = Number(item.dataset.target) === index;
    item.classList.toggle('is-active', isActive);
    if (!isActive) {
      item.style.removeProperty('--scale');
    }
  });
};

const updateSlides = (index) => {
  slidesTrack.style.transform = `translateX(-${index * 100}vw)`;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle('is-active', slideIndex === index);
    slide.setAttribute('aria-hidden', slideIndex !== index);
  });
  statusLabel.textContent = slides[index].dataset.label;
  updateDock(index);
  if (scrollHint) {
    scrollHint.classList.add('is-hidden');
  }
};

const goToIndex = (index) => {
  const now = Date.now();
  if (isTransitioning || now - lastNavigate < NAVIGATION_COOLDOWN) {
    return;
  }
  const nextIndex = clampIndex(index);
  if (nextIndex === currentIndex) {
    return;
  }
  isTransitioning = true;
  lastNavigate = now;
  currentIndex = nextIndex;
  updateSlides(currentIndex);
};

const goToDelta = (delta) => {
  goToIndex(currentIndex + delta);
};

slidesTrack.addEventListener('transitionend', () => {
  isTransitioning = false;
});

// Dock navigation

dockItems.forEach((item) => {
  item.addEventListener('click', () => {
    const target = Number(item.dataset.target);
    goToIndex(target);
  });
});

// Keyboard navigation

document.addEventListener('keydown', (event) => {
  const activeElement = document.activeElement;
  const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
  if (isTyping) return;

  switch (event.key) {
    case 'ArrowRight':
    case 'PageDown':
      event.preventDefault();
      goToDelta(1);
      break;
    case 'ArrowLeft':
    case 'PageUp':
      event.preventDefault();
      goToDelta(-1);
      break;
    case 'Home':
      event.preventDefault();
      goToIndex(0);
      break;
    case 'End':
      event.preventDefault();
      goToIndex(slides.length - 1);
      break;
    default:
      break;
  }
});

// Mouse wheel navigation

const handleWheel = (event) => {
  if (window.innerWidth <= 900) {
    return;
  }
  const dominantAxis = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  if (Math.abs(dominantAxis) < 30) {
    return;
  }
  event.preventDefault();
  goToDelta(dominantAxis > 0 ? 1 : -1);
};

slidesTrack.addEventListener('wheel', handleWheel, { passive: false });

// Touch and pointer swipe navigation

let pointerStartX = null;
let pointerId = null;

slidesTrack.addEventListener('pointerdown', (event) => {
  pointerStartX = event.clientX;
  pointerId = event.pointerId;
  slidesTrack.setPointerCapture(pointerId);
});

slidesTrack.addEventListener('pointermove', (event) => {
  if (pointerStartX === null || pointerId !== event.pointerId) return;
});

const endPointer = (event) => {
  if (pointerStartX === null || pointerId !== event.pointerId) return;
  const deltaX = event.clientX - pointerStartX;
  if (Math.abs(deltaX) > 80) {
    goToDelta(deltaX < 0 ? 1 : -1);
  }
  slidesTrack.releasePointerCapture(pointerId);
  pointerStartX = null;
  pointerId = null;
};

slidesTrack.addEventListener('pointerup', endPointer);
slidesTrack.addEventListener('pointercancel', endPointer);

// Dock hover magnification

const dock = document.querySelector('.dock');

if (dock) {
  dock.addEventListener('mousemove', (event) => {
    const { clientX } = event;
    dockItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distance = Math.abs(clientX - itemCenter);
      const scale = Math.max(1, 2 - distance / 160);
      item.style.setProperty('--scale', scale.toFixed(2));
    });
  });

  dock.addEventListener('mouseleave', () => {
    dockItems.forEach((item) => {
      item.style.removeProperty('--scale');
    });
  });
}

// Cursor glow tracking

if (cursorGlow) {
  const moveGlow = (event) => {
    cursorGlow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  };

  document.addEventListener('pointermove', moveGlow);
  document.addEventListener('pointerdown', () => {
    cursorGlow.classList.add('is-active');
  });
  document.addEventListener('pointerup', () => {
    cursorGlow.classList.remove('is-active');
  });
}

// Initialize state

updateSlides(currentIndex);
