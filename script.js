// Toast Notification System
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Form Validation Functions
function validateName(name) {
    return name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    // Indian phone number format
    return /^[+]?[0-9]{10,13}$/.test(phone.replace(/\s/g, ''));
}

function validateDate(date) {
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
}

// Password strength validation
function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let strength = 0;
    let feedback = [];

    if (password.length >= minLength) strength++;
    else feedback.push('At least 8 characters');

    if (hasUpperCase) strength++;
    else feedback.push('One uppercase letter');

    if (hasLowerCase) strength++;
    else feedback.push('One lowercase letter');

    if (hasNumbers) strength++;
    else feedback.push('One number');

    if (hasSpecialChar) strength++;
    else feedback.push('One special character');

    // Calculate strength level
    let level = 'weak';
    let color = '#ef4444'; // red

    if (strength >= 5) {
        level = 'strong';
        color = '#10b981'; // green
    } else if (strength >= 3) {
        level = 'medium';
        color = '#f59e0b'; // amber
    }

    return {
        isValid: strength === 5,
        strength: strength,
        level: level,
        color: color,
        feedback: feedback
    };
}

function showValidation(input, isValid, message = '') {
    const formGroup = input.closest('.form-group');
    let validationMsg = formGroup.querySelector('.validation-message');
    let validationIcon = formGroup.querySelector('.validation-icon');

    // Create validation message if it doesn't exist
    if (!validationMsg) {
        validationMsg = document.createElement('div');
        validationMsg.className = 'validation-message';
        input.parentNode.appendChild(validationMsg);
    }

    // Create validation icon if it doesn't exist
    if (!validationIcon && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT') {
        validationIcon = document.createElement('span');
        validationIcon.className = 'validation-icon';
        formGroup.appendChild(validationIcon);
    }

    if (isValid) {
        input.classList.remove('invalid');
        input.classList.add('valid');
        validationMsg.classList.remove('show');
        if (validationIcon) {
            validationIcon.textContent = '✓';
            validationIcon.className = 'validation-icon valid';
        }
    } else {
        input.classList.remove('valid');
        input.classList.add('invalid');
        validationMsg.textContent = message;
        validationMsg.classList.add('show');
        if (validationIcon) {
            validationIcon.textContent = '✗';
            validationIcon.className = 'validation-icon invalid';
        }
    }
}

// Success Modal Functions
function showSuccessModal(bookingData) {
    const modal = document.getElementById('success-modal');
    const summary = document.getElementById('booking-summary');

    const serviceNames = {
        'pet-sitting': 'Pet Sitting',
        'dog-walking': 'Dog Walking',
        'pet-boarding': 'Pet Boarding',
        'grooming': 'Grooming',
        'vet-visits': 'Vet Visits',
        'training': 'Training Support'
    };

    summary.innerHTML = `
        <div class="booking-detail-item">
            <span class="booking-detail-label">Booking ID:</span>
            <span class="booking-detail-value">#${bookingData.id}</span>
        </div>
        <div class="booking-detail-item">
            <span class="booking-detail-label">Name:</span>
            <span class="booking-detail-value">${bookingData.name}</span>
        </div>
        <div class="booking-detail-item">
            <span class="booking-detail-label">Email:</span>
            <span class="booking-detail-value">${bookingData.email}</span>
        </div>
        <div class="booking-detail-item">
            <span class="booking-detail-label">Service:</span>
            <span class="booking-detail-value">${serviceNames[bookingData.service] || bookingData.service}</span>
        </div>
        <div class="booking-detail-item">
            <span class="booking-detail-label">Date:</span>
            <span class="booking-detail-value">${bookingData.bookingDate}</span>
        </div>
        <div class="booking-detail-item">
            <span class="booking-detail-label">Time:</span>
            <span class="booking-detail-value">${bookingData.bookingTime}</span>
        </div>
    `;

    modal.classList.add('active');
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('active');
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
const navMenu = document.getElementById('nav-menu');

mobileMenuBtn.addEventListener('click', () => {
    const isExpanded = mobileMenuBtn.classList.toggle('active');
    navMenu.classList.toggle('active');

    // Update ARIA attribute for accessibility
    mobileMenuBtn.setAttribute('aria-expanded', isExpanded);
});

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar Background on Scroll
const navbar = document.getElementById('main-navigation');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Intersection Observer for Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, observerOptions);

// Observe all service cards, testimonials, and feature items
const animateElements = document.querySelectorAll(
    '.service-card, .testimonial-card, .feature-item, .stat-item'
);

animateElements.forEach(el => {
    el.classList.add('scroll-reveal');
    observer.observe(el);
});

// Form Submission Handler with API Integration
const bookingForm = document.getElementById('booking-form');

// Real-time validation
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const dateInput = document.getElementById('booking-date');
const messageInput = document.getElementById('message');

if (nameInput) {
    nameInput.addEventListener('blur', () => {
        const isValid = validateName(nameInput.value);
        showValidation(nameInput, isValid, 'Name must be at least 2 characters and contain only letters');
    });
}

if (emailInput) {
    emailInput.addEventListener('blur', () => {
        const isValid = validateEmail(emailInput.value);
        showValidation(emailInput, isValid, 'Please enter a valid email address');
    });
}

if (phoneInput) {
    phoneInput.addEventListener('blur', () => {
        const isValid = validatePhone(phoneInput.value);
        showValidation(phoneInput, isValid, 'Please enter a valid phone number (10-13 digits)');
    });
}

if (dateInput) {
    dateInput.addEventListener('change', () => {
        const isValid = validateDate(dateInput.value);
        showValidation(dateInput, isValid, 'Please select a date in the future');
    });
}

// Character counter for message
if (messageInput) {
    const charCounter = document.createElement('div');
    charCounter.className = 'char-counter';
    messageInput.parentNode.appendChild(charCounter);

    messageInput.addEventListener('input', () => {
        const length = messageInput.value.length;
        const maxLength = 500;
        charCounter.textContent = `${length}/${maxLength} characters`;

        if (length > maxLength * 0.9) {
            charCounter.classList.add('warning');
        } else {
            charCounter.classList.remove('warning');
        }

        if (length > maxLength) {
            charCounter.classList.add('error');
            messageInput.value = messageInput.value.substring(0, maxLength);
        } else {
            charCounter.classList.remove('error');
        }
    });
}

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(bookingForm);
    const data = Object.fromEntries(formData);

    // Validate all fields
    let isValid = true;

    if (!validateName(data.name)) {
        showValidation(nameInput, false, 'Name must be at least 2 characters and contain only letters');
        isValid = false;
    }

    if (!validateEmail(data.email)) {
        showValidation(emailInput, false, 'Please enter a valid email address');
        isValid = false;
    }

    if (!validatePhone(data.phone)) {
        showValidation(phoneInput, false, 'Please enter a valid phone number');
        isValid = false;
    }

    if (!data.service) {
        showToast('Validation Error', 'Please select a service', 'error');
        isValid = false;
    }

    if (!validateDate(data.bookingDate)) {
        showValidation(dateInput, false, 'Please select a date in the future');
        isValid = false;
    }

    if (!isValid) {
        showToast('Validation Error', 'Please fix the errors in the form', 'error');
        return;
    }

    // Get submit button for loading state
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    try {
        // Parse pet information from message field
        const petInfo = data.message ? data.message.split(',') : [];
        const petName = petInfo[0]?.trim() || 'Pet';
        const petType = petInfo[1]?.trim() || 'Not specified';
        const petAge = petInfo[2]?.trim() || null;

        // Convert 12-hour time to 24-hour format
        let hour = parseInt(data.bookingHour);
        const minute = data.bookingMinute;
        const period = data.bookingPeriod;

        if (period === 'PM' && hour !== 12) {
            hour += 12;
        } else if (period === 'AM' && hour === 12) {
            hour = 0;
        }

        const bookingTime = `${hour.toString().padStart(2, '0')}:${minute}`;

        // Send booking to API
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                phone: data.phone,
                service: data.service,
                bookingDate: data.bookingDate,
                bookingTime: bookingTime,
                petName: petName,
                petType: petType,
                petAge: petAge,
                message: data.message
            })
        });

        const result = await response.json();

        if (result.success) {
            // Show success toast
            showToast('Success!', 'Your booking has been confirmed', 'success');

            // Show success modal
            showSuccessModal({
                id: result.data.id,
                name: data.name,
                email: data.email,
                service: data.service,
                bookingDate: data.bookingDate,
                bookingTime: `${data.bookingHour}:${data.bookingMinute} ${data.bookingPeriod}`
            });

            // Reset form
            bookingForm.reset();

            // Clear validation states
            document.querySelectorAll('.valid, .invalid').forEach(el => {
                el.classList.remove('valid', 'invalid');
            });
            document.querySelectorAll('.validation-icon').forEach(el => el.remove());

        } else {
            throw new Error(result.error || 'Failed to create booking');
        }

    } catch (error) {
        console.error('Booking error:', error);

        // Check if server is running
        if (error.message.includes('fetch') || error.name === 'TypeError') {
            showToast('Connection Error', 'Unable to connect to server. Please make sure the backend is running.', 'error');
        } else {
            showToast('Error', error.message, 'error');
        }
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
});


// Add hover effect to service cards
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = '';
    });
});

// Parallax effect for hero background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Add dynamic gradient animation to hero
const heroBackground = document.querySelector('.hero-background::before');
let hue = 35;

setInterval(() => {
    hue = (hue + 1) % 360;
    document.documentElement.style.setProperty('--primary-hue', hue);
}, 100);

// Counter animation for stats
const animateCounter = (element, target, duration = 2000) => {
    let start = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
};

// Trigger counter animation when stats are visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            const statNumbers = entry.target.querySelectorAll('.stat-number');

            statNumbers.forEach(stat => {
                const text = stat.textContent;
                if (text.includes('+')) {
                    const num = parseInt(text.replace(/\D/g, ''));
                    stat.textContent = '0+';
                    animateCounter(stat, num);
                    setTimeout(() => {
                        stat.textContent = num + '+';
                    }, 2000);
                }
            });
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// Add ripple effect to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

// Swipe Gestures for Testimonials (Mobile)
const testimonialsGrid = document.querySelector('.testimonials-grid');
if (testimonialsGrid && window.innerWidth <= 768) {
    let touchStartX = 0;
    let touchEndX = 0;
    let currentIndex = 0;
    const testimonialCards = document.querySelectorAll('.testimonial-card');

    testimonialsGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    testimonialsGrid.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentIndex < testimonialCards.length - 1) {
                // Swipe left - next
                currentIndex++;
            } else if (diff < 0 && currentIndex > 0) {
                // Swipe right - previous
                currentIndex--;
            }

            // Scroll to current testimonial
            testimonialCards[currentIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }
}

// Mobile Menu - Close on outside click
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('nav-menu');
    const menuBtn = document.getElementById('mobile-menu-toggle');

    if (navMenu && menuBtn) {
        if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            navMenu.classList.remove('active');
            menuBtn.classList.remove('active');
        }
    }
});

// Prevent zoom on input focus (iOS)
const inputs = document.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
    input.addEventListener('focus', function () {
        if (window.innerWidth <= 768) {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
            }
        }
    });

    input.addEventListener('blur', function () {
        if (window.innerWidth <= 768) {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        }
    });
});

// Image Slider for "Why Choose PawCare" Section
const initImageSlider = () => {
    const sliderContainer = document.querySelector('.image-slider');
    if (!sliderContainer) return;

    const slides = sliderContainer.querySelectorAll('.slider-img');
    const dots = sliderContainer.querySelectorAll('.slider-dot');
    const prevBtn = sliderContainer.querySelector('.slider-btn-prev');
    const nextBtn = sliderContainer.querySelector('.slider-btn-next');

    let currentSlide = 0;
    let autoSlideInterval;

    // Function to show specific slide
    const showSlide = (index) => {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Add active class to current slide and dot
        slides[index].classList.add('active');
        dots[index].classList.add('active');

        currentSlide = index;
    };

    // Next slide
    const nextSlide = () => {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    };

    // Previous slide
    const prevSlide = () => {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    };

    // Auto slide
    const startAutoSlide = () => {
        autoSlideInterval = setInterval(nextSlide, 4000); // Change slide every 4 seconds
    };

    const stopAutoSlide = () => {
        clearInterval(autoSlideInterval);
    };

    // Event listeners for navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoSlide();
            startAutoSlide(); // Restart auto-slide after manual navigation
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoSlide();
            startAutoSlide(); // Restart auto-slide after manual navigation
        });
    }

    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoSlide();
            startAutoSlide(); // Restart auto-slide after manual navigation
        });
    });

    // Touch/Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
    });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoSlide(); // Restart auto-slide after swipe
    });

    const handleSwipe = () => {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                prevSlide();
            }
        }
    };

    // Pause auto-slide on hover
    sliderContainer.addEventListener('mouseenter', stopAutoSlide);
    sliderContainer.addEventListener('mouseleave', startAutoSlide);

    // Start auto-slide
    startAutoSlide();
};

// Initialize slider when DOM is loaded
initImageSlider();

// Star Rating Functionality
const starRating = document.getElementById('star-rating');
if (starRating) {
    const stars = starRating.querySelectorAll('.star');
    const ratingInput = document.getElementById('feedback-rating');
    let selectedRating = 0;
    let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    stars.forEach((star, index) => {
        // Click event to select rating
        star.addEventListener('click', (e) => {
            e.preventDefault();
            selectedRating = index + 1;
            ratingInput.value = selectedRating;
            updateStars(selectedRating);
        });

        // Touch events for mobile
        if (isTouchDevice) {
            star.addEventListener('touchstart', (e) => {
                e.preventDefault();
                selectedRating = index + 1;
                ratingInput.value = selectedRating;
                updateStars(selectedRating);
            });
        } else {
            // Hover effect for desktop only
            star.addEventListener('mouseenter', () => {
                updateStars(index + 1);
            });
        }
    });

    // Reset to selected rating when mouse leaves (desktop only)
    if (!isTouchDevice) {
        starRating.addEventListener('mouseleave', () => {
            updateStars(selectedRating);
        });
    }

    // Function to update star display
    function updateStars(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.textContent = '★'; // Filled star
                star.classList.add('active');
            } else {
                star.textContent = '☆'; // Empty star
                star.classList.remove('active');
            }
        });
    }
}


// Feedback Form Submission
const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(feedbackForm);
        const data = Object.fromEntries(formData);

        // Validate rating
        if (!data.rating || data.rating < 1 || data.rating > 5) {
            showToast('Validation Error', 'Please select a rating', 'error');
            return;
        }

        // Get submit button for loading state
        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;

        try {
            // Send feedback to API
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    rating: parseInt(data.rating),
                    category: data.category,
                    message: data.message,
                    public: data.public === 'on'
                })
            });

            const result = await response.json();

            if (result.success) {
                showToast('Success!', 'Thank you for your feedback!', 'success');
                feedbackForm.reset();

                // Reset star rating
                const stars = document.querySelectorAll('#star-rating .star');
                stars.forEach(star => {
                    star.textContent = '☆';
                    star.classList.remove('active');
                });
                document.getElementById('feedback-rating').value = '';
            } else {
                throw new Error(result.message || 'Failed to submit feedback');
            }

        } catch (error) {
            console.error('Feedback error:', error);

            if (error.message.includes('fetch') || error.name === 'TypeError') {
                showToast('Connection Error', 'Unable to connect to server. Please make sure the backend is running.', 'error');
            } else {
                showToast('Error', error.message, 'error');
            }
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
        }
    });
}

console.log('🐾 PawCare website loaded successfully!');

