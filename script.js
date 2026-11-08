document.addEventListener('DOMContentLoaded', () =>{
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const toTop = document.getElementById('toTop');
  const toast = document.getElementById('toast');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  /* ---------- Toast helper ---------- */
  let toastTimer;

  function showToast(message){
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() =>{
      toast.classList.remove('show');
    }, 3200);
  }

  /* ---------- Mobile menu ---------- */
  function setMenu(open){
    navLinks.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  menuToggle.addEventListener('click', () =>{
    setMenu(!navLinks.classList.contains('open'));
  });

  document.addEventListener('keydown', (e) =>{
    if (e.key === 'Escape'){
      setMenu(false);
    }
  });

  /* ---------- Smooth scrolling (nav links + hero buttons) ---------- */
  function scrollToTarget(selector){
    const target = document.querySelector(selector);

    if (target){
      target.scrollIntoView({ behavior: scrollBehavior });
    }
  }

  navLinks.querySelectorAll('a').forEach((link) =>{
    link.addEventListener('click', (e) =>{
      e.preventDefault();
      scrollToTarget(link.getAttribute('href'));
      setMenu(false);
    });
  });

  document.querySelector('.logo').addEventListener('click', (e) =>{
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  });

  document.querySelectorAll('[data-scroll]').forEach((btn) =>{
    btn.addEventListener('click', () =>{
      scrollToTarget(btn.dataset.scroll);
    });
  });

  /* ---------- Navbar shadow + back-to-top ---------- */
  function onScroll(){
    navbar.classList.toggle('scrolled', window.scrollY > 10);
    toTop.classList.toggle('show', window.scrollY > 500);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', () =>{
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  });

  /* ---------- Highlight current section in navbar ---------- */
  const sections = document.querySelectorAll('main section[id]');
  const linkMap = {};

  navLinks.querySelectorAll('a').forEach((a) =>{
    linkMap[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window){
    const observer = new IntersectionObserver((entries) =>{
      entries.forEach((entry) =>{
        if (entry.isIntersecting){
          Object.values(linkMap).forEach((a) =>{
            a.classList.remove('active');
          });

          if (linkMap[entry.target.id]){
            linkMap[entry.target.id].classList.add('active');
          }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) =>{
      observer.observe(s);
    });
  }

  /* ---------- Project card hover interaction ---------- */
  document.querySelectorAll('.project').forEach((card) =>{
    card.addEventListener('mousemove', (e) =>{
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', `${e.clientX - r.left}px`);
      card.style.setProperty('--y', `${e.clientY - r.top}px`);
      card.classList.add('is-active');
    });

    card.addEventListener('mouseleave', () =>{
      card.classList.remove('is-active');
    });

    card.addEventListener('focusin', () =>{
      card.classList.add('is-active');
    });

    card.addEventListener('focusout', () =>{
      card.classList.remove('is-active');
    });
  });

  /* ---------- Placeholder links ----------
     Replace href="#" in index.html with your real URL and
     remove the class "placeholder-link" to make it a normal link. */
  document.querySelectorAll('.placeholder-link').forEach((link) =>{
    link.addEventListener('click', (e) =>{
      if (link.getAttribute('href') === '#'){
        e.preventDefault();
        showToast(link.dataset.hint || 'Add your real link in index.html');
      }
    });
  });

  /* ---------- Contact form validation + Formspree ---------- */
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {
    name: (v) => (v.length < 2 ? 'Please enter your name (at least 2 characters).' : ''),
    email: (v) => (!v ? 'Please enter your email address.' : !emailPattern.test(v) ? 'Please enter a valid email, like name@example.com.' : ''),
    message: (v) => (v.length < 10 ? 'Please write a message of at least 10 characters.' : '')
  };

  function validateField(name){
    const input = form.elements[name];
    const error = rules[name](input.value.trim());

    document.getElementById(`${name}Error`).textContent = error;
    input.closest('.field').classList.toggle('invalid', Boolean(error));
    input.setAttribute('aria-invalid', String(Boolean(error)));

    return !error;
  }

  Object.keys(rules).forEach((name) =>{
    form.elements[name].addEventListener('blur', () =>{
      validateField(name);
    });

    form.elements[name].addEventListener('input', () =>{
      success.hidden = true;

      if (form.elements[name].closest('.field').classList.contains('invalid')){
        validateField(name);
      }
    });
  });

  form.addEventListener('submit', async (e) =>{
    e.preventDefault();
    const results = Object.keys(rules).map(validateField);

    if (!results.every(Boolean)){
      const firstInvalid = form.querySelector('.invalid input, .invalid textarea');

      if (firstInvalid){
        firstInvalid.focus();
      }

      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try{
      const response = await fetch(form.action,{
        method: 'POST',
        headers:{ 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (response.ok){
        form.reset();
        success.hidden = false;
        success.scrollIntoView({ behavior: scrollBehavior, block: 'nearest' });
      }
      else{
        const data = await response.json().catch(() => ({}));
        const message = data.errors
          ? data.errors.map((err) => err.message).join(', ')
          : 'Something went wrong. Please try again.';

        showToast(message);
      }
    }
    catch (error){
      showToast('Network error. Please check your connection and try again.');
    }
    finally{
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
});