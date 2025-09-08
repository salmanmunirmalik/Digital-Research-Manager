import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      plugins: [
        // Minimal React plugin - no refresh
        react(),
        // Bundle analyzer (only in production)
        isProduction && visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true
        })
      ].filter(Boolean),
      
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      },
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@components': path.resolve(__dirname, 'components'),
          '@pages': path.resolve(__dirname, 'pages'),
          '@services': path.resolve(__dirname, 'services'),
          '@utils': path.resolve(__dirname, 'utils'),
          '@contexts': path.resolve(__dirname, 'contexts'),
          '@types': path.resolve(__dirname, 'types.ts')
        }
      },
      
      build: {
        // Preserve the server directory during build
        emptyOutDir: false,
        
        // Performance optimizations
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction,
            pure_funcs: isProduction ? ['console.log'] : []
          }
        },
        
        // Code splitting and chunk optimization
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          },
          output: {
            // Manual chunk splitting for better caching
            manualChunks: {
              // Vendor chunks
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ui-vendor': ['@heroicons/react'],
              'utils-vendor': ['uuid', 'bcryptjs'],
              
              // Feature chunks
              'dashboard': [
                './pages/DashboardPage.tsx',
                './components/SideNav.tsx'
              ],
              'auth': [
                './pages/LoginPage.tsx',
                './pages/RegisterPage.tsx',
                './contexts/AuthContext.tsx'
              ],
              'protocols': [
                './pages/ProtocolsPage.tsx'
              ],
              'inventory': [
                './pages/InventoryPage.tsx'
              ],
              'calculators': [
                './pages/CalculatorHubPage.tsx',
                './services/calculators.ts'
              ]
            },
            
            // Optimize chunk file names for better caching
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
              return `js/[name]-[hash].js`;
            },
            entryFileNames: 'js/[name]-[hash].js',
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              const ext = info[info.length - 1];
              if (/\.(css)$/.test(assetInfo.name)) {
                return `css/[name]-[hash].${ext}`;
              }
              return `assets/[name]-[hash].${ext}`;
            }
          }
        },
        
        // Bundle size optimization
        chunkSizeWarningLimit: 1000,
        
        // Source map configuration
        sourcemap: !isProduction
      },
      
      // Development server optimization
      server: {
        port: 5173,
        host: true,
        // Enable HMR optimization
        hmr: {
          overlay: true
        },
        // Serve static files
        fs: {
          allow: ['..']
        }
      },
      
      // CSS optimization
      css: {
        devSourcemap: !isProduction,
        // PostCSS configuration moved to postcss.config.js for better ES module compatibility
      },
      
      // Dependency optimization
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@heroicons/react/24/outline'
        ],
        exclude: ['@google/genai']
      }
    };
});
