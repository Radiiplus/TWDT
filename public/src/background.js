// background.js
function injectCSS() {
    const css = `
        body {
            margin: 0;
            height: 100vh;
            background-color: #4B0082;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            position: relative;
        }

        .blurred-circle {
            position: absolute;
            width: 50%;
            height: 40%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
            filter: blur(80px);
            opacity: 0.4;
            z-index: 0;
        }

        .circle1 { top: 10%; left: 5%; }
        .circle2 { top: 60%; right: 10%; }
        .circle3 { bottom: 15%; left: 30%; }

        .circle-container {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }

        .color-change-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.7);
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            z-index: 1;
        }

        .color-change-button .material-icons {
            font-size: 24px;
            color: #333;
        }
    `;

    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getComplementaryColor(color) {
    const num = parseInt(color.replace("#", ""), 16);
    const R = 255 - ((num >> 16) & 0xFF);
    const G = 255 - ((num >> 8) & 0xFF);
    const B = 255 - (num & 0xFF);
    return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16).slice(1).toUpperCase()}`;
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255))
                .toString(16).slice(1).toUpperCase()}`;
}

function randomPosition() {
    const top = Math.random() * 80;
    const left = Math.random() * 80;
    return { top: `${top}%`, left: `${left}%` };
}

function changeColors() {
    const baseColor = getRandomColor();
    const darkColor = darkenColor(baseColor, 30);
    const lightColor = lightenColor(baseColor, 50);
    const compColor = getComplementaryColor(baseColor);

    document.body.style.backgroundColor = darkColor;

    document.querySelectorAll('.blurred-circle').forEach(el => {
        const { top, left } = randomPosition();
        el.style.top = top;
        el.style.left = left;
        const gradient = `radial-gradient(circle, ${lightColor} 0%, ${compColor} 70%)`;
        el.style.background = gradient;
    });

    localStorage.setItem('backgroundColor', darkColor);
    localStorage.setItem('circleColor', lightColor);
}

function applySavedColors() {
    const darkColor = localStorage.getItem('backgroundColor') || '#4B0082';
    const lightColor = localStorage.getItem('circleColor') || lightenColor(darkColor, 50);

    document.body.style.backgroundColor = darkColor;
    document.querySelectorAll('.blurred-circle').forEach(el => {
        const { top, left } = randomPosition();
        el.style.top = top;
        el.style.left = left;
        const gradient = `radial-gradient(circle, ${lightColor} 0%, rgba(255, 255, 255, 0) 70%)`;
        el.style.background = gradient;
    });
}

injectCSS();
applySavedColors();

document.getElementById('colorChangeButton').addEventListener('click', changeColors);
