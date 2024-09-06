function createMenu() {
    console.log('Creating menu...');

    const style = `
        .sidebar {
            position: fixed;
            right: -60px;
            top: 20%;
            width: 60px;
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            transition: right 0.3s ease;
            z-index: 1000;
            padding: 10px 0;
            box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
            border-radius: 15px 0 0 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .sidebar.is-active {
            right: 0;
        }

        .sidebar-item {
            padding: 10px 0;
            cursor: pointer;
            text-align: center;
            width: 100%;
        }

        .sidebar-item:hover {
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 0;
        }

        .material-icons {
            font-size: 24px;
        }
    `;

    const menuHTML = `
        <div class="sidebar" id="sidebar">
            <a class="sidebar-item" id="colorChangeButton">
                <span class="material-icons">palette</span>
            </a>
        </div>
    `;

    const styleElement = document.createElement('style');
    styleElement.innerHTML = style;
    document.head.appendChild(styleElement);

    document.body.insertAdjacentHTML('beforeend', menuHTML);

    document.addEventListener('DOMContentLoaded', () => {
        console.log('Document loaded and ready');
        const sidebar = document.getElementById('sidebar');

        const colorChangeButton = document.getElementById('colorChangeButton');
        if (colorChangeButton) {
            colorChangeButton.addEventListener('click', changeColors);
        } else {
            console.error('Color change button not found');
        }
    });
}

function addMenuItems(items) {
    const sidebar = document.getElementById('sidebar');

    if (sidebar) {
        items.forEach(item => {
            const div = document.createElement('a');
            div.className = 'sidebar-item';
            div.href = item.url || '#';

            if (item.id) {
                div.id = item.id;
            }
            if (item.class) {
                div.classList.add(item.class);
            }

            div.innerHTML = `<span class="material-icons">${item.icon}</span>`;
            
            if (item.onClick) {
                div.addEventListener('click', item.onClick);
            }

            sidebar.appendChild(div);
        });
    } else {
        console.error('Sidebar not found');
    }
}

createMenu();
