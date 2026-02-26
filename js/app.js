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

const routes = [
    { path: '/', component: loadTemplate('home') },
    { path: '/privacy', component: loadTemplate('privacy') },
    { path: '/roadmap', component: loadTemplate('roadmap') },
    { path: '/connect', component: loadTemplate('contact') },
    { path: '/early-access', component: loadTemplate('early-access') },
    { path: '/features', component: loadTemplate('features') },
    { path: '/infrastructure', component: loadTemplate('infrastructure') },
    { path: '/stack', component: loadTemplate('stack') },
    { path: '/terms', component: loadTemplate('terms') },
    { path: '/ai-safety', component: loadTemplate('ai-safety') },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
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
                    <div class="hidden md:flex items-center space-x-10 text-xs font-mono font-bold uppercase tracking-[0.2em] text-white/50">
                        <router-link to="/features" class="hover:text-ai-lavender transition-colors">Features</router-link>
                        <router-link to="/infrastructure" class="hover:text-ai-lavender transition-colors">Infra</router-link>
                        <router-link to="/ai-safety" class="hover:text-ai-lavender transition-colors">AI Safety</router-link>
                        <router-link to="/stack" class="hover:text-ai-lavender transition-colors">Stack</router-link>
                        <router-link to="/connect" class="bg-ai-lavender text-ai-obsidian px-8 py-3 hover:bg-white transition-colors font-bold">Connect_</router-link>
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
                <div v-show="isMobileMenuOpen" class="md:hidden absolute top-full left-0 w-full bg-ai-obsidian border-b border-white/5 shadow-2xl flex flex-col p-8 space-y-6 z-40">
                    <router-link to="/features" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Features</router-link>
                    <router-link to="/infrastructure" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Infra</router-link>
                    <router-link to="/ai-safety" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">AI Safety</router-link>
                    <router-link to="/stack" @click="closeMobileMenu" class="block text-white/50 hover:text-ai-lavender font-mono text-sm font-bold uppercase tracking-[0.2em] py-2">Stack</router-link>
                    <router-link to="/connect" @click="closeMobileMenu" class="block bg-ai-lavender text-ai-obsidian font-heading font-black uppercase text-center px-5 py-5 text-sm">Connect_</router-link>
                </div>
            </nav>

            <div class="flex-grow">
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
                            <li><router-link to="/infrastructure" class="hover:text-ai-lavender transition-colors">Infrastructure</router-link></li>
                            <li><router-link to="/ai-safety" class="hover:text-ai-lavender transition-colors">AI Safety</router-link></li>
                            <li><router-link to="/connect" class="hover:text-ai-lavender transition-colors">Connect</router-link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-widest text-white/20 mb-8">Ecosystem</h4>
                        <ul class="space-y-4 text-xs font-bold uppercase tracking-widest text-white/50">
                            <li><router-link to="/early-access" class="hover:text-ai-lavender transition-colors">Early Access</router-link></li>
                            <li><router-link to="/roadmap" class="hover:text-ai-lavender transition-colors">Roadmap</router-link></li>
                            <li><a href="https://linkedin.com" class="hover:text-ai-lavender transition-colors">LinkedIn</a></li>
                        </ul>
                    </div>
                </div>
                <div class="max-w-7xl mx-auto px-6 mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div class="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20 text-center md:text-left">
                        © 2024 Cybat AI. All Rights Reserved. // encrypted_connection_established
                    </div>
                    <div class="flex gap-8 font-mono text-[8px] uppercase tracking-widest text-white/20">
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