import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// // Генерируем nonce для CSP
// const generateNonce = () => {
//     return Buffer.from(crypto.randomBytes(16)).toString('base64');
// };

// Middleware для добавления nonce
// app.use((req, res, next) => {
//     res.locals.nonce = generateNonce();
//     next();
// });

// Middleware 
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: [
                "'self'", 
                "https://www.googletagmanager.com", 
                "https://www.google-analytics.com",
                "'unsafe-inline'"
            ],
            connectSrc: ["'self'", "https://api.telegram.org", "https://www.google-analytics.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"], 
            frameSrc: ["'self'", "https://www.googletagmanager.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "data:", "https:"],
            manifestSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Компрессия
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Слишком много запросов с этого IP',
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

// CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Статические файлы
app.use(express.static('public', {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, path) => {
        
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        }
    }
}));

// Парсинг JSON
app.use(express.json({ limit: '10kb' }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Analytics endpoint
app.post('/api/analytics', (req, res) => {
    try {
        const { event, category, label, value, user_id } = req.body;
        
        console.log('📊 Analytics Event:', { 
            event, 
            category, 
            label, 
            value, 
            user_id: user_id || 'anonymous',
            timestamp: new Date().toISOString(),
            user_agent: req.get('User-Agent'),
            ip: req.ip
        });
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обработчик формы
app.post('/send-form', async (req, res) => {
    try {
        const { name, phone, source = 'website', form_type = 'contact' } = req.body;
        
        // Валидация
        if (!name?.trim() || !phone?.trim()) {
            return res.status(400).json({ 
                error: 'Заполните все поля',
                code: 'VALIDATION_ERROR'
            });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({
                error: 'Имя должно содержать минимум 2 символа',
                code: 'INVALID_NAME'
            });
        }

        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return res.status(400).json({
                error: 'Введите корректный номер телефона',
                code: 'INVALID_PHONE'
            });
        }

        const cleanName = name.trim();
        const cleanPhone = phone.trim();

        // Отправка в Telegram
        const message = `📥 Новая заявка с сайта WastePro:\n\nИмя: ${cleanName}\nТелефон: ${cleanPhone}\nИсточник: ${source}\nТип формы: ${form_type}\nВремя: ${new Date().toLocaleString()}`;
        
        if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
            const tgResponse = await fetch(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: process.env.CHAT_ID,
                        text: message,
                        parse_mode: 'HTML'
                    }),
                    timeout: 10000
                }
            );

            if (!tgResponse.ok) {
                console.error('Telegram API error:', await tgResponse.text());
            }
        }

        // Логируем успешную отправку формы
        console.log('Form submitted:', { 
            name: cleanName, 
            phone: cleanPhone, 
            source,
            form_type,
            timestamp: new Date().toISOString(),
            ip: req.ip
        });

        res.status(200).json({ 
            success: true,
            message: 'Заявка успешно отправлена'
        });
        
    } catch (error) {
        console.error('Form submission error:', error);
        
        res.status(500).json({ 
            error: 'Ошибка сервера',
            code: 'SERVER_ERROR'
        });
    }
});

// Обработка 404 
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        code: 'API_NOT_FOUND'
    });
});


app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('🔥 Unhandled error:', error);
    res.status(500).json({ 
        error: 'Внутренняя ошибка сервера',
        code: 'INTERNAL_ERROR'
    });
});

const PORT = process.env.PORT || 3000;

app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Google Analytics: ${process.env.GA_MEASUREMENT_ID || 'Not configured'}`);
    console.log(`🏷️ Google Tag Manager: ${process.env.GTM_ID || 'Not configured'}`);
});