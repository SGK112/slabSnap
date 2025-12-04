/**
 * REMODELY.AI Website JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe feature cards, category cards, testimonials
    document.querySelectorAll('.feature-card, .category-card, .testimonial-card, .material-card, .step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Stats counter animation
    const statsSection = document.querySelector('.hero-stats');
    let hasAnimated = false;

    const animateStats = () => {
        if (hasAnimated) return;

        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const text = stat.textContent;
            const number = parseInt(text.replace(/[^0-9]/g, ''));
            const suffix = text.replace(/[0-9]/g, '');
            let current = 0;
            const increment = number / 50;
            const duration = 1500;
            const stepTime = duration / 50;

            const counter = setInterval(() => {
                current += increment;
                if (current >= number) {
                    stat.textContent = number + suffix;
                    clearInterval(counter);
                } else {
                    stat.textContent = Math.floor(current) + suffix;
                }
            }, stepTime);
        });
        hasAnimated = true;
    };

    // Trigger stats animation when visible
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // App store link handlers (placeholder - update with real links)
    document.querySelectorAll('[href="#download"]').forEach(link => {
        // Keep scroll behavior for these links
    });

    // Add hover effect to category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.02)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });
    });

    // Form handling for future newsletter signup
    const handleNewsletterSubmit = (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        console.log('Newsletter signup:', email);
        // Add actual newsletter signup logic here
    };

    // Generic Modal Functions
    const openModal = (modal) => {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    const closeAllModals = () => {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    };

    // Contact Modal
    const contactModal = document.getElementById('contactModal');
    const closeModalBtn = document.getElementById('closeModal');
    document.querySelectorAll('a[href="#contact"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(contactModal);
        });
    });
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeAllModals);

    // Privacy Modal
    const privacyModal = document.getElementById('privacyModal');
    const closePrivacyBtn = document.getElementById('closePrivacyModal');
    document.querySelectorAll('a[href="#privacy"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(privacyModal);
        });
    });
    if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', closeAllModals);

    // Terms Modal
    const termsModal = document.getElementById('termsModal');
    const closeTermsBtn = document.getElementById('closeTermsModal');
    document.querySelectorAll('a[href="#terms"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(termsModal);
        });
    });
    if (closeTermsBtn) closeTermsBtn.addEventListener('click', closeAllModals);

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            // Get subject text
            const subjectSelect = document.getElementById('subject');
            const subjectText = subjectSelect.options[subjectSelect.selectedIndex].text;

            // Create mailto link - emails go to help.remodely@gmail.com but show info@remodely.ai
            const mailtoSubject = encodeURIComponent(`[REMODELY.AI] ${subjectText} from ${name}`);
            const mailtoBody = encodeURIComponent(
                `Name: ${name}\n` +
                `Email: ${email}\n` +
                `Subject: ${subjectText}\n\n` +
                `Message:\n${message}\n\n` +
                `---\nSent from REMODELY.AI website contact form`
            );

            // Open mailto with the actual receiving email
            window.location.href = `mailto:help.remodely@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

            // Show success message in modal
            const modalContent = contactModal.querySelector('.modal');
            modalContent.innerHTML = `
                <button class="modal-close" onclick="location.reload()">
                    <span class="material-symbols-outlined">close</span>
                </button>
                <div class="form-success show">
                    <span class="material-symbols-outlined">check_circle</span>
                    <h3>Opening Email Client</h3>
                    <p>Your default email app should open shortly.<br>If not, email us at <a href="mailto:info@remodely.ai">info@remodely.ai</a></p>
                    <button type="button" class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">Done</button>
                </div>
            `;
        });
    }

    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroBg = document.querySelector('.hero-bg');
        if (heroBg && scrolled < 800) {
            heroBg.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
});
