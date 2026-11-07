const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// UI Translations Dictionary
const UI_STRINGS = {
    en: {
        nav: {
            features: "Features",
            infra: "Infra",
            safety: "Safety",
            stack: "Stack",
            pricing: "Pricing",
            support: "Support",
            docs: "Docs",
            security: "Security",
            dashboard: "Dashboard",
            subscribe: "Subscribe_",
            connect: "Connect_"
        },
        footer: {
            title: "CYBAT AI",
            subtitle: "// AUTONOMOUS_SECURITY_ORCHESTRATION<br>// ENGINE_V3.0_ACTIVE",
            navigation: "Navigation",
            ecosystem: "Ecosystem",
            earlyAccess: "Early Access",
            roadmap: "Roadmap",
            privacy: "Privacy",
            terms: "Terms",
            rights: "© 2026 Cybat AI. All Rights Reserved. // encrypted_connection_established"
        },
        langSwitch: {
            label: "Language"
        }
    },
    es: {
        nav: {
            features: "Funciones",
            infra: "Infra",
            safety: "IA Segura",
            stack: "Stack",
            pricing: "Precios",
            support: "Soporte",
            docs: "Docs",
            security: "Seguridad",
            dashboard: "Panel",
            subscribe: "Suscribir_",
            connect: "Contacto_"
        },
        footer: {
            title: "CYBAT AI",
            subtitle: "// ORQUESTACIÓN_DE_SEGURIDAD_AUTÓNOMA<br>// MOTOR_V3.0_ACTIVO",
            navigation: "Navegación",
            ecosystem: "Ecosistema",
            earlyAccess: "Acceso Anticipado",
            roadmap: "Hoja de Ruta",
            privacy: "Privacidad",
            terms: "Términos",
            rights: "© 2026 Cybat AI. Todos los derechos reservados. // conexion_cifrada_establecida"
        },
        langSwitch: {
            label: "Idioma"
        }
    }
};

// Initial language detection
const initialLang = (() => {
    try {
        const urlParam = new URLSearchParams(window.location.search).get('lang');
        if (urlParam && (urlParam === 'es' || urlParam === 'en')) return urlParam;
        const stored = localStorage.getItem('cybat_lang');
        if (stored && (stored === 'es' || stored === 'en')) return stored;
        const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (navLang.startsWith('es')) return 'es';
    } catch (e) {}
    return 'en';
})();

// Helper function to create a reactive, language-aware view wrapper component
function createView(name, isHome = false) {
    return {
        name: `view-wrapper-${name}`,
        template: `<component :is="currentComp" v-if="currentComp" />`,
        data() {
            return {
                currentComp: null
            };
        },
        computed: {
            currentLang() {
                return this.$root.currentLang || 'en';
            }
        },
        watch: {
            currentLang: {
                immediate: true,
                handler(lang) {
                    this.loadView(lang);
                }
            }
        },
        methods: {
            loadView(lang) {
                if (isHome && _globe) {
                    destroyLandingGlobe();
                }
                const url = lang === 'es' ? `./views/es/${name}.html` : `./views/${name}.html`;
                fetch(url)
                    .then(res => {
                        if (!res.ok) {
                            // Fallback to English view if Spanish file is missing
                            return fetch(`./views/${name}.html`).then(r => {
                                if (!r.ok) throw new Error(`Failed to load view: ${name}`);
                                return r.text();
                            });
                        }
                        return res.text();
                    })
                    .then(html => {
                        this.currentComp = {
                            name: `${name}-${lang}`,
                            template: html,
                            mounted() {
                                if (isHome) this.$nextTick(initLandingGlobe);
                            },
                            unmounted() {
                                if (isHome) destroyLandingGlobe();
                            }
                        };
                    })
                    .catch(err => {
                        console.error(`Failed to load view ${name}:`, err);
                    });
            }
        }
    };
}

// Copy-to-clipboard for code snippets (docs pages)
function cybatCopyCode(buttonOrPreId) {
    const button = typeof buttonOrPreId === 'string' ? document.getElementById(buttonOrPreId) : buttonOrPreId;
    const pre = typeof buttonOrPreId === 'string'
        ? document.getElementById(buttonOrPreId)
        : button.closest('.code-copy-wrap')?.querySelector('pre');
    if (!pre) return;
    const text = pre.innerText;

    const showCopied = () => {
        const original = button.innerHTML;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        button.classList.add('text-mint');
        setTimeout(() => {
            button.innerHTML = original;
            button.classList.remove('text-mint');
        }, 1500);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showCopied).catch(() => {});
        return;
    }
    // Fallback for non-secure contexts / browsers without the Clipboard API.
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); showCopied(); } catch (e) { /* no-op */ }
    document.body.removeChild(textarea);
}
window.cybatCopyCode = cybatCopyCode;

// ── Landing page globe ────────────────────────────────────────────────────────

let _globe = null;
let _globeResizeObs = null;
let _globeArcTimer = null;

const DEMO_POINTS = [
    { lat: 40.71, lng: -74.01, color: '#A78BFA', alt: 0, r: 0.45 }, // New York
    { lat: 51.51, lng:  -0.13, color: '#2DD4BF', alt: 0, r: 0.35 }, // London
    { lat: 35.68, lng: 139.65, color: '#A78BFA', alt: 0, r: 0.42 }, // Tokyo
    { lat: 50.11, lng:   8.68, color: '#A78BFA', alt: 0, r: 0.38 }, // Frankfurt
    { lat:  1.35, lng: 103.82, color: '#2DD4BF', alt: 0, r: 0.32 }, // Singapore
    { lat: 19.08, lng:  72.88, color: '#A78BFA', alt: 0, r: 0.36 }, // Mumbai
    { lat:-23.55, lng: -46.63, color: '#2DD4BF', alt: 0, r: 0.30 }, // São Paulo
    { lat:  4.71, lng: -74.07, color: '#A78BFA', alt: 0, r: 0.30 }, // Bogotá
    { lat: 55.76, lng:  37.62, color: '#A78BFA', alt: 0, r: 0.40 }, // Moscow
    { lat:-33.87, lng: 151.21, color: '#2DD4BF', alt: 0, r: 0.28 }, // Sydney
];

// Expanded arc pool — rotated through over time for a live-scanning effect
const ARC_POOL = [
    { startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng:  -0.13 }, // NY → London
    { startLat: 55.76, startLng:  37.62, endLat: 50.11, endLng:   8.68 }, // Moscow → Frankfurt
    { startLat: 35.68, startLng: 139.65, endLat:  1.35, endLng: 103.82 }, // Tokyo → Singapore
    { startLat: 19.08, startLng:  72.88, endLat:  1.35, endLng: 103.82 }, // Mumbai → Singapore
    { startLat:  4.71, startLng: -74.07, endLat: 40.71, endLng: -74.01 }, // Bogotá → NY
    { startLat:-23.55, startLng: -46.63, endLat: 51.51, endLng:  -0.13 }, // São Paulo → London
    { startLat: 55.76, startLng:  37.62, endLat: 40.71, endLng: -74.01 }, // Moscow → NY
    { startLat: 35.68, startLng: 139.65, endLat: 19.08, endLng:  72.88 }, // Tokyo → Mumbai
    { startLat:-33.87, startLng: 151.21, endLat:  1.35, endLng: 103.82 }, // Sydney → Singapore
    { startLat:  4.71, startLng: -74.07, endLat: 51.51, endLng:  -0.13 }, // Bogotá → London
    { startLat: 40.71, startLng: -74.01, endLat: 50.11, endLng:   8.68 }, // NY → Frankfurt
    { startLat:-23.55, startLng: -46.63, endLat: 40.71, endLng: -74.01 }, // São Paulo → NY
];

const ARCS_VISIBLE = 3; // how many arcs show at once
let _arcHead = 0;

function nextArcs() {
    const slice = [];
    for (let i = 0; i < ARCS_VISIBLE; i++) {
        slice.push(ARC_POOL[(_arcHead + i) % ARC_POOL.length]);
    }
    _arcHead = (_arcHead + 1) % ARC_POOL.length;
    return slice;
}

function initLandingGlobe() {
    const el = document.getElementById('landing-globe');
    if (!el || typeof Globe === 'undefined' || _globe) return;

    _globe = Globe()(el)
        .width(el.clientWidth)
        .height(el.clientHeight)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-day.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .atmosphereColor('#8B7BD8')
        .atmosphereAltitude(0.22)
        .pointsData(DEMO_POINTS)
        .pointColor('color')
        .pointAltitude('alt')
        .pointRadius('r')
        .arcsData(nextArcs())
        .arcColor(() => ['rgba(167,139,250,0.9)', 'rgba(45,212,191,0.4)'])
        .arcDashLength(0.4)
        .arcDashGap(0.25)
        .arcDashAnimateTime(2200)
        .arcStroke(0.35)
        .arcAltitude(0.18);

    _globe.controls().autoRotate      = true;
    _globe.controls().autoRotateSpeed = 0.4;
    _globe.controls().enableZoom      = false;
    _globe.controls().enablePan       = false;
    _globe.controls().enableRotate    = false;
    _globe.pointOfView({ lat: 20, lng: -30, altitude: 2.6 });

    // Cycle to a new set of arcs every 2.5 s
    _globeArcTimer = setInterval(() => {
        _globe?.arcsData(nextArcs());
    }, 2500);

    _globeResizeObs = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (width && height) _globe?.width(width).height(height);
    });
    _globeResizeObs.observe(el);
}

function destroyLandingGlobe() {
    clearInterval(_globeArcTimer);
    _globeArcTimer = null;
    _globeResizeObs?.disconnect();
    _globeResizeObs = null;
    try { _globe?.renderer()?.dispose(); } catch {}
    const el = document.getElementById('landing-globe');
    if (el) el.replaceChildren();
    _globe = null;
}

// ─────────────────────────────────────────────────────────────────────────────

const routes = [
    { path: '/', component: createView('home', true) },
    { path: '/privacy', component: createView('privacy') },
    { path: '/roadmap', component: createView('roadmap') },
    { path: '/connect', component: createView('contact') },
    { path: '/early-access', component: createView('early-access') },
    { path: '/features', component: createView('features') },
    { path: '/infrastructure', component: createView('infrastructure') },
    { path: '/stack', component: createView('stack') },
    { path: '/terms', component: createView('terms') },
    { path: '/ai-safety', component: createView('ai-safety') },
    { path: '/pricing', component: createView('pricing') },
    { path: '/support', component: createView('support') },
    { path: '/security', component: createView('security') },
    { path: '/contact-thanks', component: createView('contact-thanks') },
    { path: '/docs', component: createView('docs') },
    { path: '/docs/getting-started', component: createView('docs-getting-started') },
    { path: '/docs/cloudflare', component: createView('docs-cloudflare') },
    { path: '/docs/sdk-python', component: createView('docs-sdk-python') },
    { path: '/docs/sdk-node', component: createView('docs-sdk-node') },
    { path: '/docs/sdk-php', component: createView('docs-sdk-php') },
    { path: '/docs/sdk-java', component: createView('docs-sdk-java') },
    { path: '/docs/user-guide', component: createView('docs-user-guide') },
    { path: '/docs/release-notes', component: createView('docs-release-notes') },
    { path: '/docs/security-specs', component: createView('docs-security-specs') },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, _from, savedPosition) {
        if (savedPosition) return savedPosition;
        if (to.hash) return { el: to.hash, behavior: 'smooth' };
        return { top: 0 };
    }
});

// Helper to update documentation typography sizing on <html>
function updateDocsTheme(path) {
    const isDocs = typeof path === 'string' && path.startsWith('/docs');
    document.documentElement.classList.toggle('is-docs-page', isDocs);
}

// Initial check based on current hash before router settles
if (window.location.hash.replace(/^#/, '').startsWith('/docs')) {
    document.documentElement.classList.add('is-docs-page');
}

// Track page views on route change & sync docs typography
router.afterEach((to) => {
    updateDocsTheme(to.path);
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
            page_title: to.name || to.path,
            page_location: window.location.href,
            page_path: to.path
        });
    }
});

const app = createApp({
    data() {
        return {
            currentLang: initialLang,
            isMounted: false,
            isMobileMenuOpen: false,
            activeFaq: null,
            partnerForm: {
                name: '',
                email: '',
                company: '',
                message: ''
            },
            formStatus: 'idle', // idle, sending, success, error
            partners: [],
            faqs: [
                {
                    question: "Do you store my request data?",
                    question_es: "¿Almacenan los datos de mis peticiones?",
                    answer: "No. Cybat AI operates on a <b>Zero-Retention</b> architecture. Request telemetry captured by the SDK is processed in-flight within secure, stateless Cloud Run functions and is discarded immediately after analysis. Your data never hits a persistent disk in our infrastructure.",
                    answer_es: "No. Cybat AI opera bajo una arquitectura de <b>Cero Retención</b>. La telemetría capturada por el SDK se procesa al vuelo en funciones stateless seguras de Cloud Run y se descarta inmediatamente tras el análisis. Tus datos nunca tocan un disco persistente en nuestra infraestructura."
                },
                {
                    question: "Does this slow down my application?",
                    question_es: "¿Ralentiza esto mi aplicación?",
                    answer: "Not at all. The SDK captures each request's outcome only after your server has already sent the response, then buffers and reports it to Cybat asynchronously. This 'fire-and-forget' mechanism ensures our analysis happens outside your user's request path, adding exactly 0ms of latency to your application response times.",
                    answer_es: "En absoluto. El SDK captura el resultado de cada petición solo después de que tu servidor ya ha emitido la respuesta, almacenándola en búfer y enviándola a Cybat de forma asíncrona. Este mecanismo asegura que el análisis se realice fuera del flujo crítico, añadiendo exactamente 0 ms de latencia a tus tiempos de respuesta."
                },
                {
                    question: "How hard is the integration?",
                    question_es: "¿Qué tan compleja es la integración?",
                    answer: "Integration is effortless. Simply subscribe through the <b>Google Cloud Marketplace</b>, activate your account in seconds, and add our single-line SDK middleware to your application. You are up and running in <b>less than 5 minutes</b>.",
                    answer_es: "La integración es sencilla. Simplemente suscríbete a través de <b>Google Cloud Marketplace</b>, activa tu cuenta en segundos y añade nuestro middleware SDK de una sola línea a tu aplicación. Estarás protegido en <b>menos de 5 minutos</b>."
                }
            ]
        };
    },
    mounted() {
        this.isMounted = true;
        this.applyLanguageSideEffects(this.currentLang);
        this.fetchPartners();
    },
    methods: {
        t(key) {
            const keys = key.split('.');
            let obj = UI_STRINGS[this.currentLang] || UI_STRINGS['en'];
            for (const k of keys) {
                if (!obj || obj[k] === undefined) {
                    let fallback = UI_STRINGS['en'];
                    for (const fb of keys) {
                        if (!fallback || fallback[fb] === undefined) return key;
                        fallback = fallback[fb];
                    }
                    return fallback;
                }
                obj = obj[k];
            }
            return obj;
        },
        setLang(lang) {
            if (lang !== 'en' && lang !== 'es') return;
            this.currentLang = lang;
            try {
                localStorage.setItem('cybat_lang', lang);
            } catch (e) {}
            this.applyLanguageSideEffects(lang);
        },
        applyLanguageSideEffects(lang) {
            document.documentElement.lang = lang;
            if (lang === 'es') {
                document.title = "Cybat AI | Seguridad Autónoma con Agentes de IA para Google Cloud";
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    metaDesc.setAttribute('content', 'Despliega Cybat AI para proteger tu infraestructura en GCP con seguridad autónoma impulsada por Gemini. Telemetría SDK en tiempo real, detección de amenazas en subsegundos y mitigación automatizada con Cloud Armor.');
                }
            } else {
                document.title = "Cybat AI | Autonomous AI-Agent Security for Google Cloud";
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    metaDesc.setAttribute('content', 'Deploy Cybat AI to protect your GCP surface with Gemini-powered autonomous security. Real-time SDK-based telemetry, sub-second threat detection, and automated Cloud Armor mitigation.');
                }
            }
        },
        async fetchPartners() {
            try {
                const response = await fetch('./partners.json');
                if (response.ok) {
                    this.partners = await response.json();
                }
            } catch (e) {
                console.warn('Failed to fetch partners:', e);
            }
        },
        async submitPartnerForm() {
            this.formStatus = 'sending';
            try {
                const endpoint = 'https://formspree.io/f/xnjvbjra';
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.partnerForm)
                });

                if (response.ok) {
                    this.formStatus = 'success';
                    this.partnerForm = { name: '', email: '', company: '', message: '' };
                } else {
                    this.formStatus = 'error';
                }
            } catch (e) {
                console.error('Partner signup failed:', e);
                this.formStatus = 'error';
            }
        },
        toggleFaq(index) {
            this.activeFaq = this.activeFaq === index ? null : index;
        },
        toggleMobileMenu() {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
        },
        closeMobileMenu() {
            this.isMobileMenuOpen = false;
        }
    },
    template: `
        <div class="flex flex-col min-h-screen">
            <nav class="site-nav py-4 md:py-5 px-4 md:px-8 border-b border-white/5 bg-ai-obsidian/80 backdrop-blur-xl sticky top-0 z-50">
                <div class="max-w-7xl mx-auto flex justify-between items-center relative">
                    <router-link to="/" class="flex items-center group shrink-0 mr-4 xl:mr-8" @click="closeMobileMenu">
                        <span class="text-3xl font-heading font-black tracking-tighter uppercase italic">Cybat</span>
                        <div class="site-dot w-4 h-4 bg-ai-lavender ml-1 animate-pulse shadow-[0_0_10px_#A78BFA]"></div>
                    </router-link>

                    <!-- Desktop Menu -->
                    <div class="site-links hidden lg:flex items-center gap-3 xl:gap-5 text-[13px] xl:text-sm font-mono font-bold uppercase tracking-[0.06em] text-white/50 whitespace-nowrap">
                        <router-link to="/features" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.features') }}</router-link>
                        <router-link to="/infrastructure" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.infra') }}</router-link>
                        <router-link to="/ai-safety" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.safety') }}</router-link>
                        <router-link to="/stack" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.stack') }}</router-link>
                        <router-link to="/pricing" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.pricing') }}</router-link>
                        <router-link to="/support" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.support') }}</router-link>
                        <router-link to="/docs" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.docs') }}</router-link>
                        <router-link to="/security" class="hover:text-ai-lavender transition-colors whitespace-nowrap">{{ t('nav.security') }}</router-link>
                        
                        <!-- Desktop Language Switcher -->
                        <div class="lang-switch flex items-center rounded-full p-0.5 border text-xs font-mono select-none shrink-0" role="group" aria-label="Language Selector">
                            <button type="button" @click="setLang('en')" :class="currentLang === 'en' ? 'lang-active font-bold shadow-xs' : 'hover:opacity-100'" class="px-2.5 py-1 rounded-full transition-all duration-150" title="English">EN</button>
                            <button type="button" @click="setLang('es')" :class="currentLang === 'es' ? 'lang-active font-bold shadow-xs' : 'hover:opacity-100'" class="px-2.5 py-1 rounded-full transition-all duration-150" title="Español">ES</button>
                        </div>

                        <a href="https://console.cloud.google.com/marketplace/product/cybat-public/cybat-intelligence-engine" target="_blank" rel="noopener" class="site-cta bg-ai-lavender text-ai-obsidian px-4 xl:px-5 py-2 ml-1 xl:ml-2 hover:bg-white transition-colors font-bold tracking-[0.12em] shrink-0 whitespace-nowrap text-xs xl:text-sm">{{ t('nav.subscribe') }}</a>
                    </div>

                    <!-- Mobile Menu Button -->
                    <button @click="toggleMobileMenu" class="lg:hidden text-white/50 hover:text-white focus:outline-none" aria-label="Toggle Navigation">
                        <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 8h16M4 16h16" />
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Mobile Menu Dropdown -->
                <div v-show="isMobileMenuOpen" class="site-mobile lg:hidden absolute top-full left-0 w-full bg-ai-obsidian border-b border-white/5 shadow-2xl flex flex-col p-8 space-y-4 z-40">
                    <!-- Mobile Language Switcher -->
                    <div class="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
                        <span class="mobile-lang-label text-white/50 uppercase tracking-widest">{{ t('langSwitch.label') }}</span>
                        <div class="lang-switch flex items-center rounded-full p-0.5 border" role="group" aria-label="Language Selector">
                            <button type="button" @click="setLang('en')" :class="currentLang === 'en' ? 'lang-active font-bold shadow-xs' : 'hover:opacity-100'" class="px-3 py-1 rounded-full font-mono text-xs transition-colors" title="English">EN</button>
                            <button type="button" @click="setLang('es')" :class="currentLang === 'es' ? 'lang-active font-bold shadow-xs' : 'hover:opacity-100'" class="px-3 py-1 rounded-full font-mono text-xs transition-colors" title="Español">ES</button>
                        </div>
                    </div>

                    <router-link to="/features" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.features') }}</router-link>
                    <router-link to="/infrastructure" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.infra') }}</router-link>
                    <router-link to="/ai-safety" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.safety') }}</router-link>
                    <router-link to="/stack" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.stack') }}</router-link>
                    <router-link to="/pricing" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.pricing') }}</router-link>
                    <router-link to="/support" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.support') }}</router-link>
                    <router-link to="/docs" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.docs') }}</router-link>
                    <router-link to="/security" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">{{ t('nav.security') }}</router-link>
                    <router-link to="/connect" @click="closeMobileMenu" class="site-cta block bg-ai-lavender text-ai-obsidian font-heading font-black uppercase text-center px-5 py-4 text-sm mt-4">{{ t('nav.connect') }}</router-link>
                </div>
            </nav>

            <div class="flex-grow" v-if="isMounted">
                <router-view></router-view>
            </div>

            <footer class="site-footer bg-ai-obsidian py-32 border-t border-white/5 relative overflow-hidden">
                <div class="aurora aurora-lavender w-96 h-96 -bottom-48 -left-48 opacity-10"></div>
                <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-20 relative z-10">
                    <div class="col-span-2">
                        <div class="text-white font-heading font-black text-2xl mb-8 uppercase italic tracking-tighter">{{ t('footer.title') }}</div>
                        <p class="max-w-sm text-sm text-white/40 leading-relaxed font-mono mb-8" v-html="t('footer.subtitle')"></p>
                    </div>
                    <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-8">{{ t('footer.navigation') }}</h4>
                        <ul class="space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
                            <li><router-link to="/features" class="hover:text-ai-lavender transition-colors">{{ t('nav.features') }}</router-link></li>
                            <li><router-link to="/pricing" class="hover:text-ai-lavender transition-colors">{{ t('nav.pricing') }}</router-link></li>
                            <li><router-link to="/support" class="hover:text-ai-lavender transition-colors">{{ t('nav.support') }}</router-link></li>
                            <li><router-link to="/docs" class="hover:text-ai-lavender transition-colors">{{ t('nav.docs') }}</router-link></li>
                            <li><router-link to="/security" class="hover:text-ai-mint transition-colors">{{ t('nav.security') }}</router-link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-8">{{ t('footer.ecosystem') }}</h4>
                        <ul class="space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
                            <li><router-link to="/early-access" class="hover:text-ai-lavender transition-colors">{{ t('footer.earlyAccess') }}</router-link></li>
                            <li><router-link to="/roadmap" class="hover:text-ai-lavender transition-colors">{{ t('footer.roadmap') }}</router-link></li>
                            <li><a href="https://linkedin.com/company/cybat-ai" target="_blank" rel="noopener" class="hover:text-ai-lavender transition-colors">LinkedIn</a></li>
                        </ul>
                    </div>
                </div>
                <div class="max-w-7xl mx-auto px-6 mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div class="font-mono text-xs uppercase tracking-[0.2em] text-white/40 text-center md:text-left">
                        {{ t('footer.rights') }}
                    </div>
                    <div class="flex gap-8 font-mono text-xs uppercase tracking-widest text-white/40">
                        <router-link to="/privacy" class="hover:text-white transition-colors">{{ t('footer.privacy') }}</router-link>
                        <router-link to="/terms" class="hover:text-white transition-colors">{{ t('footer.terms') }}</router-link>
                    </div>
                </div>
            </footer>
        </div>
    `
});
app.use(router);
app.mount('#app');
