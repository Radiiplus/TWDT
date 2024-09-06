class DynamicLoader {
    constructor(options = {}) {
        this.options = {
            color: options.color || 'blue',
            size: options.size || 'big',
            type: options.type || 'spinner',
            useOverlay: options.useOverlay !== false,
            targetElement: options.targetElement || document.querySelector('button') || null, 
            ...options
        };
        this.overlay = null;
        this.loadingContainer = null;
        this.injectStyles();  
        this.createElements();
    }

    injectStyles() {
        const styles = `
            .dynamic-loader-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }

            .dynamic-loader-container {
                display: inline-block;
            }

            .preloader-wrapper {
                display: inline-block;
                width: 64px;
                height: 64px;
                position: relative;
            }

            .spinner-layer {
                position: absolute;
                width: 100%;
                height: 100%;
                opacity: 0;
                border-color: #26a69a;
            }

            .spinner-blue-only, .spinner-red-only, .spinner-yellow-only, .spinner-green-only {
                border-color: #4285f4;
            }

            .circle-clipper {
                display: inline-block;
                position: relative;
                width: 50%;
                height: 100%;
                overflow: hidden;
                border-color: inherit;
            }

            .circle-clipper .circle {
                width: 200%;
                height: 100%;
                border-width: 3px;
                border-style: solid;
                border-color: inherit;
                border-bottom-color: transparent !important;
                border-radius: 50%;
                animation: rotate 1.25s infinite;
                position: absolute;
                top: 0;
                right: 0;
                bottom: 0;
            }

            .active .spinner-layer {
                opacity: 1;
                animation: fill-unfill-rotate 5332ms infinite both;
            }

            @keyframes fill-unfill-rotate {
                12.5% { transform: rotate(135deg); }
                25% { transform: rotate(270deg); }
                37.5% { transform: rotate(405deg); }
                50% { transform: rotate(540deg); }
                62.5% { transform: rotate(675deg); }
                75% { transform: rotate(810deg); }
                87.5% { transform: rotate(945deg); }
                to { transform: rotate(1080deg); }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
    }

    createElements() {
        if (this.options.useOverlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'dynamic-loader-overlay';
            this.overlay.style.display = 'none'; 

            this.loadingContainer = document.createElement('div');
            this.loadingContainer.className = 'dynamic-loader-container';

            this.overlay.appendChild(this.loadingContainer);
            document.body.appendChild(this.overlay);
        } else {
            this.loadingContainer = document.createElement('div');
            this.loadingContainer.className = 'dynamic-loader-container';

            if (this.options.targetElement) {
                this.options.targetElement.style.position = 'relative';
                this.options.targetElement.appendChild(this.loadingContainer);
                this.loadingContainer.style.position = 'absolute';
                this.loadingContainer.style.top = '50%';
                this.loadingContainer.style.left = '50%';
                this.loadingContainer.style.transform = 'translate(-50%, -50%)';
            } else {
                document.body.appendChild(this.loadingContainer);
            }
        }
    }

    show() {
        if (this.options.useOverlay) {
            this.loadingContainer.innerHTML = this.getLoaderHTML();
            this.overlay.style.display = 'flex';
        } else {
            this.loadingContainer.innerHTML = this.getLoaderHTML();
            this.loadingContainer.style.display = 'block';
        }
    }

    hide() {
        if (this.options.useOverlay) {
            this.overlay.style.display = 'none';
        } else {
            this.loadingContainer.style.display = 'none';
        }
    }

    stop() {
        this.hide();
    }

    getLoaderHTML() {
        const { color, size } = this.options;
        return `
            <div class="preloader-wrapper ${size} active">
                <div class="spinner-layer spinner-${color}-only">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                    </div>
                    <div class="gap-patch">
                        <div class="circle"></div>
                    </div>
                    <div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>
            </div>
        `;
    }

    async wrapPromise(promise) {
        this.show();
        try {
            const result = await promise;
            return result;
        } finally {
            this.stop();
        }
    }

    wrapFunction(fn) {
        return async (...args) => {
            this.show();
            try {
                const result = await fn(...args);
                return result;
            } finally {
                this.stop();
            }
        };
    }

    wrapFetch() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            this.show();
            try {
                const result = await originalFetch(...args);
                return result;
            } finally {
                this.stop();
            }
        };
    }
}
