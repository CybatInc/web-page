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
    { path: '/contact', component: loadTemplate('contact') },
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
    methods: {
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
    mounted() {
        this.isMounted = true;
    }
});
app.use(router);
app.mount('#app');