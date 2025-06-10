// Highlight active nav link on scroll
document.addEventListener('DOMContentLoaded', function () {
  const links = document.querySelectorAll('.nav-item');
  const sections = Array.from(links).map(link => document.querySelector(link.getAttribute('href')));
  
  function onScroll() {
    let scrollPos = window.scrollY + 80;
    let activeIdx = 0;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].offsetTop <= scrollPos) {
        activeIdx = i;
      }
    }
    links.forEach((l, i) => l.classList.toggle('active', i === activeIdx));
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Smooth scroll for navigation links
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Handle contact form submission
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      // Get form data
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');
      
      // Validate fields
      if (!name || !email || !message) {
        alert('Please fill in all fields.');
        return;
      }
      
      // Show loading state
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      
      try {
        // Using Formspree service (you'll need to sign up at formspree.io)
        const response = await fetch('https://formspree.io/f/mqabpdla', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message,
            _replyto: email
          })
        });
        
        if (response.ok) {
          alert('Message sent successfully! Thank you for reaching out.');
          contactForm.reset();
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to send message. Please try again or contact directly at hridoyahmedddd@gmail.com');
      } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});