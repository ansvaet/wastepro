import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получение эквивалента __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к исходному и выходному HTML-файлу
const inputFilePath = path.join(__dirname, 'public', 'index.html');
const outputFilePath = path.join(__dirname, 'dist', 'index.html');

// Чтение исходного HTML-файла
let html = fs.readFileSync(inputFilePath, 'utf8');

// Замена идентификаторов на значения из .env
html = html.replace(/GTM-XXXXXX/g, process.env.GTM_ID || 'GTM-DEFAULT');
html = html.replace(/GA_MEASUREMENT_ID/g, process.env.GA_MEASUREMENT_ID || 'GA-DEFAULT');

// Создание выходной директории, если она не существует
fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

// Запись измененного HTML в выходной файл
fs.writeFileSync(outputFilePath, html);

console.log('HTML файл успешно обновлен с использованием переменных окружения.');