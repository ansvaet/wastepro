// Основной JavaScript файл для WastePro
class WasteProApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.setupAnimations();
        this.setupCalculator();
        this.setupFormValidation();
        this.setupLazyLoading();
        this.setupHeaderEffects();
        console.log('🚀 WastePro App initialized');
    }

    // Мобильное меню
    setupMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.nav');
        const navLinks = document.querySelectorAll('.nav-link');

        if (mobileMenuToggle && nav) {
            mobileMenuToggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                mobileMenuToggle.classList.toggle('active');
                document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
            });

            // Закрытие меню при клике на ссылку
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });

            // Закрытие меню при клике вне его
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav') && !e.target.closest('.mobile-menu-toggle')) {
                    nav.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    // Плавная прокрутка
    setupSmoothScroll() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Трекинг кликов по навигации
                    if (window.wasteProAnalytics) {
                        window.wasteProAnalytics.trackEvent('navigation_click', 'Engagement', targetId);
                    }
                }
            });
        });
    }

    // Анимации при скролле
    setupAnimations() {
        const animateOnScroll = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(animateOnScroll, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Элементы для анимации
        const animatedElements = document.querySelectorAll('.feature-card, .media-card, .calculator, .contact-info');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Калькулятор
    setupCalculator() {
        const calcForm = document.getElementById('calc-form');
        const results = document.getElementById('results');

        if (calcForm) {
            calcForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateSavings();
            });

            // Валидация в реальном времени
            // const inputs = calcForm.querySelectorAll('input[type="number"]');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.validateCalculatorInput(input);
                });
            });
        }
    }

    validateCalculatorInput(input) {
        const value = parseInt(input.value);
        if (value < 1) {
            input.setCustomValidity('Значение должно быть больше 0');
        } else {
            input.setCustomValidity('');
        }
    }

    calculateSavings() {
        const containers = parseInt(document.getElementById('containers').value) || 0;
        const price = parseInt(document.getElementById('price').value) || 0;
        
        if (containers < 1 || price < 1) {
            this.showError('Пожалуйста, введите корректные значения');
            return;
        }

        const compression = 3.5; // Средний коэффициент уплотнения
        const equipmentCost = 390000; // Стоимость оборудования

        // Расчеты
        const beforeVolume = containers * 1.1;
        const afterVolume = beforeVolume / compression;
        const beforeCost = beforeVolume * price;
        const afterCost = afterVolume * price;
        const economy = beforeCost - afterCost;
        const payback = economy > 0 ? Math.ceil(equipmentCost / economy) : 0;

        // Обновление UI
        this.updateResults(beforeCost, afterCost, economy, payback);
        
        // Показ результатов
        this.showResults();

        // Трекинг расчета
        if (window.wasteProAnalytics) {
            window.wasteProAnalytics.trackEvent('calculator_result', 'Engagement', {
                containers: containers,
                price: price,
                economy: economy,
                payback: payback
            });
        }
    }

    updateResults(beforeCost, afterCost, economy, payback) {
        document.getElementById('beforeCost').textContent = this.formatCurrency(beforeCost);
        document.getElementById('afterCost').textContent = this.formatCurrency(afterCost);
        document.getElementById('monthSave').textContent = this.formatCurrency(economy);
        document.getElementById('payback').textContent = payback > 0 ? `${payback} мес` : '∞ мес';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    showResults() {
        const results = document.getElementById('results');
        results.hidden = false;
        results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(message) {
        alert(message); // Можно заменить на красивый toast
    }

    // Валидация форм
    setupFormValidation() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
                
                input.addEventListener('input', () => {
                    this.clearFieldError(input);
                });
            });
        });
    }

    validateField(input) {
        const value = input.value.trim();
        
        // if (!value) {
        //     this.showFieldError(input, 'Это поле обязательно для заполнения');
        //     return false;
        // }

        if (input.type === 'tel') {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                this.showFieldError(input, 'Введите корректный номер телефона');
                return false;
            }
        }

        if (input.name === 'name' && value.length < 2) {
            this.showFieldError(input, 'Имя должно содержать минимум 2 символа');
            return false;
        }

        this.clearFieldError(input);
        return true;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;
        errorElement.textContent = message;
        
        input.style.borderColor = '#ef4444';
        input.parentNode.appendChild(errorElement);
    }

    clearFieldError(input) {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        input.style.borderColor = '';
    }

    // Ленивая загрузка
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Эффекты для хедера
    setupHeaderEffects() {
        const header = document.querySelector('.header');
        
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }
    }

    // Вспомогательные функции
    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const elementPosition = element.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    // Показать модальное окно
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // Скрыть модальное окно
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
}

// Глобальные функции для HTML атрибутов
function scrollToSection(sectionId) {
    if (window.wasteProApp) {
        window.wasteProApp.scrollToSection(sectionId);
    }
}

function calculate() {
    if (window.wasteProApp) {
        window.wasteProApp.calculateSavings();
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', (e) => {
    const modal = document.getElementById('successModal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// Закрытие модального окна при нажатии Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Инициализация при полной загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.wasteProApp = new WasteProApp();
});

// Обработка ошибок загрузки
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    
    if (window.wasteProAnalytics) {
        window.wasteProAnalytics.trackEvent('app_error', 'Error', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno
        });
    }
});