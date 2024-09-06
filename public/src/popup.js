function createPopup() {
    if (document.getElementById('popup-menu')) return;

    const style = document.createElement('style');
    style.textContent = `
        .popup {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border-radius: 15px;
            width: 80%;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            opacity: 80%;
        }

        .popup.is-active {
            display: block;
        }

        .popup-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
        }

        .popup-overlay.is-active {
            display: block;
        }
    `;

    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'popup-overlay';
    overlay.className = 'popup-overlay';
    overlay.onclick = togglePopup;

    const popup = document.createElement('div');
    popup.id = 'popup-menu';
    popup.className = 'popup';

    const closeButton = document.createElement('button');
    closeButton.className = 'delete';
    closeButton.setAttribute('aria-label', 'close');
    closeButton.onclick = togglePopup;

    popup.appendChild(closeButton);

    const contentDiv = document.createElement('div');
    contentDiv.id = 'popup-content';

    popup.appendChild(contentDiv);
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

function togglePopup() {
    const popup = document.getElementById('popup-menu');
    const overlay = document.getElementById('popup-overlay');
    if (popup && overlay) {
        popup.classList.toggle('is-active');
        overlay.classList.toggle('is-active');
    }
}

function addContentToPopup(content) {
    const popupContent = document.getElementById('popup-content');
    if (popupContent) {
        popupContent.innerHTML = content;
    }
}
