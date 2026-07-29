import Vue from 'vue'
import Vuetify from 'vuetify'
import { Touch, Ripple } from 'vuetify/lib/directives'

Vue.use(Vuetify, {
    directives: { Touch, Ripple },
})

export default new Vuetify({
    theme: {
        // FORGE ships a light glass theme; Vuetify must agree or its own
        // components keep painting white-on-white icons and text.
        dark: false,
        options: { customProperties: true },
        themes: {
            // Vuetify's stock #1976d2 measured 4.47:1 on the FORGE panel surface,
            // just under WCAG AA. Match the corrected --forge-signal token so stock
            // controls inherit an accessible blue instead of being patched one by one.
            light: {
                primary: '#0060c0',
            },
        },
    },
    icons: {
        iconfont: 'mdiSvg',
    },
    breakpoint: {
        mobileBreakpoint: 768,
    },
})
