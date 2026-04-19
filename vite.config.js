import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
        // React 19 with automatic JSX runtime
        }),
        tailwindcss(),
        svgr(),
        tsconfigPaths()
    ],
    server: {
        port: 3000,
        open: true
    },
    preview: {
        port: 3000
    },
    build: {
        outDir: 'build',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'd3': ['d3'],
                    'react-vendor': ['react', 'react-dom']
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    },
    // Explicitly define env prefix for clarity
    envPrefix: 'VITE_'
});
