// Minimal Animation System - Loading Only

document.addEventListener('DOMContentLoaded', function() {
    
    // ==== LOADING ANIMATION ONLY ====
    function createLoadingAnimation() {
        const loader = document.createElement('div');
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <div class="loader-text">Loading...</div>
            </div>
        `;
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(4, 8, 16, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 1;
            transition: opacity 0.5s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            .loader-spinner {
                width: 50px;
                height: 50px;
                border: 3px solid rgba(100, 255, 255, 0.1);
                border-top: 3px solid hsl(var(--neon-cyan));
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 20px;
            }
            
            .loader-text {
                color: rgba(255, 255, 255, 0.8);
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                text-align: center;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loader);

        // Remove loader after page load
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 500);
        }, 1000);
    }

    // Show loading animation
    createLoadingAnimation();

    console.log('✅ Loading animation system ready');
});
