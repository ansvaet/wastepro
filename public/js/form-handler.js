// Обработчик форм для WastePro
class WasteProFormHandler {
    constructor() {
        this.forms = new Map();
        this.init();
    }

    init() {
        this.setupContactForm();
        this.setupNewsletterForm();
        console.log('📧 WastePro Form Handler initialized');
    }

    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            this.forms.set('contact', contactForm);
            
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleFormSubmit('contact', contactForm);
            });

            // Валидация в реальном времени
            const inputs = contactForm.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateInput(input));
                input.addEventListener('input', () => this.clearInputError(input));
            });
        }
    }

    setupNewsletterForm() {
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            this.forms.set('newsletter', newsletterForm);
            
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleFormSubmit('newsletter', newsletterForm);
            });
        }
    }

    async handleFormSubmit(formType, form) {
        const formData = this.getFormData(form);
        
        // Валидация
        if (!this.validateForm(form, formData)) {
            return;
        }

        // Показать индикатор загрузки
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        this.setButtonLoading(submitButton, true);

        try {
            const response = await fetch('/send-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    source: 'website',
                    form_type: formType,
                    page_url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.handleFormSuccess(form, formType, formData);
            } else {
                this.handleFormError(form, result.error || 'Ошибка при отправке формы');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.handleFormError(form, 'Ошибка соединения с сервером');
        } finally {
            this.setButtonLoading(submitButton, false, originalText);
        }
    }

    getFormData(form) {
        const formData = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.name) {
                formData[input.name] = input.value.trim();
            }
        });

        return formData;
    }

    validateForm(form, formData) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (!value) {
            isValid = false;
            errorMessage = 'Это поле обязательно для заполнения';
        } else if (input.type === 'tel') {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                isValid = false;
                errorMessage = 'Введите корректный номер телефона';
            }
        } else if (input.name === 'name' && value.length < 2) {
            isValid = false;
            errorMessage = 'Имя должно содержать минимум 2 символа';
        } else if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Введите корректный email адрес';
            }
        }

        if (!isValid) {
            this.showInputError(input, errorMessage);
        } else {
            this.clearInputError(input);
        }

        return isValid;
    }

    showInputError(input, message) {
        this.clearInputError(input);
        
        input.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;
        
        input.parentNode.appendChild(errorElement);
    }

    clearInputError(input) {
        input.classList.remove('error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    setButtonLoading(button, isLoading, originalText = '') {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<div class="loading-spinner"></div> Отправка...';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.textContent = originalText;
            button.style.opacity = '1';
        }
    }

    handleFormSuccess(form, formType, formData) {
        // Сброс формы
        form.reset();
        
        // Показать модальное окно успеха
        this.showSuccessModal();
        
        // Трекинг успешной отправки
        if (window.wasteProAnalytics) {
            window.wasteProAnalytics.trackEvent('form_success', 'Conversion', formType, 1);
            
            // Дополнительные данные для контактной формы
            if (formType === 'contact') {
                window.wasteProAnalytics.trackEvent('lead_generated', 'Conversion', {
                    form_type: formType,
                    name_length: formData.name ? formData.name.length : 0,
                    phone_length: formData.phone ? formData.phone.length : 0
                });
            }
        }

        console.log(`✅ ${formType} form submitted successfully`);
    }

    handleFormError(form, errorMessage) {
        // Показать ошибку пользователю
        this.showErrorToast(errorMessage);
        
        // Трекинг ошибки
        if (window.wasteProAnalytics) {
            window.wasteProAnalytics.trackEvent('form_error', 'Error', errorMessage);
        }

        console.error('❌ Form submission error:', errorMessage);
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Автоматическое закрытие через 5 секунд
            setTimeout(() => {
                this.hideSuccessModal();
            }, 5000);
        }
    }

    hideSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    showErrorToast(message) {
        // Создаем временное уведомление об ошибке
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        // Удаляем через 5 секунд
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }
}

// Стили для спиннера загрузки
const loadingSpinnerStyles = `
<style>
.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.input.error {
    border-color: #ef4444 !important;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}
</style>
`;

// Добавляем стили в документ
document.head.insertAdjacentHTML('beforeend', loadingSpinnerStyles);

// Инициализация обработчика форм
document.addEventListener('DOMContentLoaded', () => {
    window.wasteProFormHandler = new WasteProFormHandler();
});

// Глобальные функции для обработки форм
async function submitContactForm(event) {
    event.preventDefault();
    if (window.wasteProFormHandler) {
        const form = document.getElementById('contact-form');
        await window.wasteProFormHandler.handleFormSubmit('contact', form);
    }
}

function handleFormSubmission(event) {
    event.preventDefault();
    if (window.wasteProFormHandler) {
        const form = event.target;
        const formType = form.id === 'contact-form' ? 'contact' : 'newsletter';
        window.wasteProFormHandler.handleFormSubmit(formType, form);
    }
}