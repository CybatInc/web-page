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
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

const app = createApp({});
app.use(router);
app.mount('#app');