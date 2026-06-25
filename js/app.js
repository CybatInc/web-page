const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// Helper function to fetch external HTML templates as async components
const loadTemplate = (name) => {
    return () => fetch(`./views/${name}.html`)
        .then(res => {
            if (!res.ok) throw new Error(`Failed to load template: ${name}`);
            return res.text();
        })
        .then(html => ({
            template: html
        }));
};

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
        .backgroundColor('#030712')
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .atmosphereColor('#6d28d9')
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
    {
        path: '/',
        component: () => fetch('./views/home.html')
            .then(res => { if (!res.ok) throw new Error('Failed to load home'); return res.text(); })
            .then(html => ({
                template: html,
                mounted()   { this.$nextTick(initLandingGlobe); },
                unmounted() { destroyLandingGlobe(); }
            }))
    },
    { path: '/privacy', component: loadTemplate('privacy') },
    { path: '/roadmap', component: loadTemplate('roadmap') },
    { path: '/connect', component: loadTemplate('contact') },
    { path: '/early-access', component: loadTemplate('early-access') },
    { path: '/features', component: loadTemplate('features') },
    { path: '/infrastructure', component: loadTemplate('infrastructure') },
    { path: '/stack', component: loadTemplate('stack') },
    { path: '/terms', component: loadTemplate('terms') },
    { path: '/ai-safety', component: loadTemplate('ai-safety') },
    { path: '/pricing', component: loadTemplate('pricing') },
    { path: '/support', component: loadTemplate('support') },
    { path: '/security', component: loadTemplate('security') },
    { path: '/docs', component: loadTemplate('docs') },
    { path: '/docs/getting-started', component: loadTemplate('docs-getting-started') },
    { path: '/docs/user-guide', component: loadTemplate('docs-user-guide') },
    { path: '/docs/release-notes', component: loadTemplate('docs-release-notes') },
    { path: '/docs/security-specs', component: loadTemplate('docs-security-specs') },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// Track page views on route change
router.afterEach((to) => {
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
                    question: "Do you store my logs?",
                    answer: "No. Cybat AI operates on a <b>Zero-Retention</b> architecture. Logs are processed in-flight within secure, stateless GKE pods and are discarded immediately after analysis. Your data never hits a persistent disk in our infrastructure."
                },
                {
                    question: "Does this slow down my application?",
                    answer: "Not at all. Cybat AI ingests logs via <b>Pub/Sub</b> asynchronously. This 'fire-and-forget' mechanism ensures that our analysis happens outside your user's request path, adding exactly 0ms of latency to your application response times."
                },
                {
                    question: "How hard is the integration?",
                    answer: "Integration is effortless. You just need to install the Cybat AI client using <b>Google Cloud Marketplace</b> and it will be ready in <b>less than 30 minutes</b>."
                }
            ]
        };
    },
    mounted() {
        this.isMounted = true;
        this.fetchPartners();
    },
    methods: {
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
                // Return to Formspree for direct email notifications
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
            <nav class="p-4 md:p-8 border-b border-white/5 bg-ai-obsidian/80 backdrop-blur-xl sticky top-0 z-50">
                <div class="max-w-7xl mx-auto flex justify-between items-center relative">
                    <router-link to="/" class="flex items-center group" @click="closeMobileMenu">
                        <span class="text-3xl font-heading font-black tracking-tighter uppercase italic">Cybat</span>
                        <div class="w-4 h-4 bg-ai-lavender ml-1 animate-pulse shadow-[0_0_10px_#A78BFA]"></div>
                    </router-link>

                    <!-- Desktop Menu -->
                    <div class="hidden md:flex items-center space-x-6 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/50">
                        <router-link to="/features" class="hover:text-ai-lavender transition-colors">Features</router-link>
                        <router-link to="/infrastructure" class="hover:text-ai-lavender transition-colors">Infra</router-link>
                        <router-link to="/ai-safety" class="hover:text-ai-lavender transition-colors">Safety</router-link>
                        <router-link to="/stack" class="hover:text-ai-lavender transition-colors">Stack</router-link>
                        <router-link to="/pricing" class="hover:text-ai-lavender transition-colors">Pricing</router-link>
                        <router-link to="/support" class="hover:text-ai-lavender transition-colors">Support</router-link>
                        <router-link to="/docs" class="hover:text-ai-lavender transition-colors">Docs</router-link>
                        <router-link to="/security" class="hover:text-ai-lavender transition-colors">Security</router-link>
                        <a href="https://console.cloud.google.com/marketplace/product/cybat-public/cybat-intelligence-engine" target="_blank" rel="noopener" class="bg-ai-lavender text-ai-obsidian px-5 py-2 ml-2 hover:bg-white transition-colors font-bold tracking-[0.2em]">Subscribe_</a>
                    </div>

                    <!-- Mobile Menu Button -->
                    <button @click="toggleMobileMenu" class="md:hidden text-white/50 hover:text-white focus:outline-none">
                        <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 8h16M4 16h16" />
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Mobile Menu Dropdown -->
                <div v-show="isMobileMenuOpen" class="md:hidden absolute top-full left-0 w-full bg-ai-obsidian border-b border-white/5 shadow-2xl flex flex-col p-8 space-y-4 z-40">
                    <router-link to="/features" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Features</router-link>
                    <router-link to="/infrastructure" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Infra</router-link>
                    <router-link to="/ai-safety" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">AI Safety</router-link>
                    <router-link to="/stack" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Stack</router-link>
                    <router-link to="/pricing" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Pricing</router-link>
                    <router-link to="/support" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Support</router-link>
                    <router-link to="/docs" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Docs</router-link>
                    <router-link to="/security" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Security</router-link>
                    <router-link to="/connect" @click="closeMobileMenu" class="block bg-ai-lavender text-ai-obsidian font-heading font-black uppercase text-center px-5 py-4 text-sm mt-4">Connect_</router-link>
                </div>
            </nav>

            <div class="flex-grow" v-if="isMounted">
                <router-view></router-view>
            </div>

            <footer class="bg-ai-obsidian py-32 border-t border-white/5 relative overflow-hidden">
                <div class="aurora aurora-lavender w-96 h-96 -bottom-48 -left-48 opacity-10"></div>
                <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-20 relative z-10">
                    <div class="col-span-2">
                        <div class="text-white font-heading font-black text-2xl mb-8 uppercase italic tracking-tighter">CYBAT AI</div>
                        <p class="max-w-sm text-sm text-white/40 leading-relaxed font-mono mb-8">
                            // AUTONOMOUS_SECURITY_ORCHESTRATION<br>
                            // ENGINE_V3.0_ACTIVE
                        </p>
                    </div>
                    <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-8">Navigation</h4>
                        <ul class="space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
                            <li><router-link to="/features" class="hover:text-ai-lavender transition-colors">Features</router-link></li>
                            <li><router-link to="/pricing" class="hover:text-ai-lavender transition-colors">Pricing</router-link></li>
                            <li><router-link to="/support" class="hover:text-ai-lavender transition-colors">Support</router-link></li>
                            <li><router-link to="/docs" class="hover:text-ai-lavender transition-colors">Docs</router-link></li>
                            <li><router-link to="/security" class="hover:text-ai-mint transition-colors">Security</router-link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-8">Ecosystem</h4>
                        <ul class="space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
                            <li><router-link to="/early-access" class="hover:text-ai-lavender transition-colors">Early Access</router-link></li>
                            <li><router-link to="/roadmap" class="hover:text-ai-lavender transition-colors">Roadmap</router-link></li>
                            <li><a href="https://linkedin.com/company/cybat-ai" target="_blank" class="hover:text-ai-lavender transition-colors">LinkedIn</a></li>
                        </ul>
                    </div>
                </div>
                <div class="max-w-7xl mx-auto px-6 mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div class="font-mono text-xs uppercase tracking-[0.2em] text-white/40 text-center md:text-left">
                        © 2026 Cybat AI. All Rights Reserved. // encrypted_connection_established
                    </div>
                    <div class="flex gap-8 font-mono text-xs uppercase tracking-widest text-white/40">
                        <router-link to="/privacy" class="hover:text-white transition-colors">Privacy</router-link>
                        <router-link to="/terms" class="hover:text-white transition-colors">Terms</router-link>
                    </div>
                </div>
            </footer>
        </div>
    `
});
app.use(router);
app.mount('#app');