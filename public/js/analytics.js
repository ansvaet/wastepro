// Упрощенная аналитика для разработки
class WasteProAnalytics {
    constructor() {
        console.log('📊 WastePro Analytics initialized (Development Mode)');
        this.setupBasicTracking();
    }

    setupBasicTracking() {
        // Базовый трекинг событий
        document.addEventListener('DOMContentLoaded', () => {
            this.trackEvent('page_view', 'Engagement', 'Home Page');
        });

        // Трекинг кликов по CTA
        document.addEventListener('click', (e) => {
            if (e.target.matches('.cta-button, .submit-btn, .calculate-btn')) {
                this.trackEvent('cta_click', 'Conversion', e.target.textContent.trim());
            }
        });
    }

    trackEvent(eventName, category, label) {
        console.log('🎯 Event:', { eventName, category, label });
        
        // Отправка на сервер (если доступно)
        if (typeof fetch === 'function') {
            fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: eventName,
                    category: category,
                    label: label,
                    timestamp: new Date().toISOString()
                })
            }).catch(() => {/* Ignore errors in development */});
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.wasteProAnalytics = new WasteProAnalytics();
});