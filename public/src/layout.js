function createLayout(includeHeader, includeFooter) {
    const style = document.createElement('style');
    style.textContent = `
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            font-family: 'Prata', 'Roboto', sans-serif;
            display: flex;
            flex-direction: column;
        }
        .header, .footer {
            width: 100%;
            z-index: 1000;
            border-radius: 15px;
            border: 1.5px solid rgba(80, 80, 80, 0.4);
            background-color: transparent;
            backdrop-filter: blur(10px);
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
        }
        .header {
            height: 5%;
            flex-shrink: 0;
        }
        .footer {
            height: 5%;
            flex-shrink: 0;
        }
        .flex-body {
            flex: 1;
            width: 100%;
            overflow-y: auto;
            padding: 1%;
            background-color: transparent;
            border-radius: 15px;
            border: 2px solid rgba(80, 80, 80, 0.3);
            box-sizing: border-box;
            margin: 0; 
        }
        @media (min-width: 1024px) {
            .header, .footer {
                
            }
            .flex-body {
                margin: 1%;
                width: calc(100% - 2%); 
            }
        }
    `;
    document.head.appendChild(style);

    if (includeHeader) {
        const header = document.createElement('header');
        header.className = 'header';
        document.body.appendChild(header);
    }

    const main = document.createElement('main');
    main.className = 'flex-body';
    document.body.appendChild(main);

    if (includeFooter) {
        const footer = document.createElement('footer');
        footer.className = 'footer';
        const currentYear = new Date().getFullYear();
        footer.innerHTML = `
            <div class="content has-text-centered">
                <p>© ${currentYear} Riffconnect. All rights reserved.</p>
            </div>
        `;
        document.body.appendChild(footer);
    }
}
