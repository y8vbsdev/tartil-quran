import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';

env.allowRemoteModels = true;

let transcriber = null;
let quranData = [];
let filteredAyahs = [];
let currentIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let audioStream = null;

const surahNames = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الانفطار", "الطفيفين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
];

const surahSelect = document.getElementById('surah-select');
const ayahDisplay = document.getElementById('ayah-display');
const recordBtn = document.getElementById('record-btn');
const statusText = document.getElementById('status');
const resultText = document.getElementById('result');
const prevBtn = document.getElementById('prev-ayah-btn');
const nextBtn = document.getElementById('next-ayah-btn');

async function init() {
    try {
        const response = await fetch('quran.json');
        if (!response.ok) throw new Error(`تعذر قراءة ملف JSON (${response.status})`);

        const data = await response.json();
        
        // دمج كافة المصفوفات الفرعية بغض النظر عن أسماء المفاتيح ("1", "2", "3"...)
        if (Array.isArray(data)) {
            quranData = data.flat();
        } else if (typeof data === 'object' && data !== null) {
            quranData = Object.values(data).flatMap(val => Array.isArray(val) ? val : [val]);
        }

        console.log("عدد الآيات الإجمالي المكتشف:", quranData.length);

        // بناء قائمة السور
        populateSurahOptions();

        // تحميل النموذج
        statusText.innerText = "جاري تحميل نموذج الذكاء الاصطناعي...";
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
            quantized: true
        });
        
        statusText.innerText = "جاهز للقراءة، اختر سورة للبدء";
        recordBtn.disabled = false;

    } catch (err) {
        console.error(err);
        ayahDisplay.innerText = "خطأ في تحميل النص";
        statusText.innerText = "تأكد من وجود ملف quran.json وبنيته الصحيحة";
    }
}

function populateSurahOptions() {
    surahSelect.innerHTML = '<option value="">-- اختر السورة --</option>';
    
    if (!quranData || quranData.length === 0) return;

    // جلب كافة أرقام السور الموجودة في البيانات
    const availableChapters = new Set();
    quranData.forEach(item => {
        if (item && item.chapter) {
            availableChapters.add(Number(item.chapter));
        }
    });

    // إضافة السور المتاحة للقائمة
    Array.from(availableChapters).sort((a, b) => a - b).forEach(chapNum => {
        const option = document.createElement('option');
        option.value = chapNum;
        const name = surahNames[chapNum - 1] ? `سورة ${surahNames[chapNum - 1]}` : `سورة رقم ${chapNum}`;
        option.textContent = `${chapNum}. ${name}`;
        surahSelect.appendChild(option);
    });
}

surahSelect.addEventListener('change', (e) => {
    const selectedChapter = e.target.value;
    resultText.innerText = "";
    
    if (selectedChapter === "") {
        filteredAyahs = [];
        ayahDisplay.innerText = "الرجاء اختيار سورة";
        updateNavButtons();
        return;
    }

    filteredAyahs = quranData.filter(item => Number(item.chapter) === Number(selectedChapter));

    currentIndex = 0;
    showCurrentAyah();
});

function showCurrentAyah() {
    if (filteredAyahs.length > 0 && currentIndex < filteredAyahs.length) {
        const item = filteredAyahs[currentIndex];
        const ayahText = item.text || "";
        const ayahNum = item.verse || (currentIndex + 1);
        
        if (ayahText) {
            ayahDisplay.innerText = `${ayahText} (${ayahNum})`;
        } else {
            ayahDisplay.innerText = "تعذر قراءة نص الآية";
        }
    } else {
        ayahDisplay.innerText = "اختر سورة لعرض الآيات";
    }

    updateNavButtons();
}

function updateNavButtons() {
    prevBtn.disabled = currentIndex <= 0 || filteredAyahs.length === 0;
    nextBtn.disabled = currentIndex >= filteredAyahs.length - 1 || filteredAyahs.length === 0;
}

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        showCurrentAyah();
        resultText.innerText = "";
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < filteredAyahs.length - 1) {
        currentIndex++;
        showCurrentAyah();
        resultText.innerText = "";
    }
});

recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(audioStream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = processAudio;

        mediaRecorder.start();
        isRecording = true;
        recordBtn.innerText = "إيقاف وتسجيل التلاوة";
        recordBtn.classList.add('recording');
        statusText.innerText = "جاري التسجيل الان...";
    } catch (err) {
        console.error("تعذر الوصول للميكروفون:", err);
        statusText.innerText = "يرجى السماح باستخدام الميكروفون";
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
        }

        isRecording = false;
        recordBtn.innerText = "ابدأ القراءة";
        recordBtn.classList.remove('recording');
        statusText.innerText = "جاري تحليل الصوت وتصحيح التلاوة...";
    }
}

async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    try {
        const output = await transcriber(audioUrl, {
            language: 'arabic',
            task: 'transcribe',
            repetition_penalty: 1.2,
            no_repeat_ngram_size: 3,
            no_speech_threshold: 0.6
        });

        let transcribedText = output.text.trim();
        transcribedText = removeRepetitions(transcribedText);

        resultText.innerText = `النص المسموع: "${transcribedText}"`;

        const currentAyah = ayahDisplay.innerText.replace(/\(\d+\)/g, "").trim();
        if (cleanText(transcribedText) === cleanText(currentAyah)) {
            statusText.innerText = "✅ التلاوة صحيحة أحسنت!";
        } else {
            statusText.innerText = "⚠️ يوجد اختلاف بين القراءة والنص الأصلي";
        }
    } catch (err) {
        console.error("خطأ أثناء تحليل الصوت:", err);
        statusText.innerText = "حدث خطأ أثناء معالجة الصوت";
    }
}

function cleanText(text) {
    return text
        .replace(/[\u064B-\u0652]/g, "")
        .replace(/[إأآا]/g, "ا")
        .replace(/ة/g, "ه")
        .trim();
}

function removeRepetitions(text) {
    return text.replace(/\b(\w+)( \1)+\b/gi, '$1');
}

init();