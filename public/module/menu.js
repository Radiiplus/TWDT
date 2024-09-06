function addMenuItems(items) {
    const $menu = $('#menu');
    if ($menu.length) {
        items.forEach(item => {
            const $menuItem = $('<div></div>', {
                class: 'menu-item',
                html: `<span class="material-icons">${item.icon}</span>`,
                click: function() {
                    window.location.href = item.url;
                    item.onClick();
                }
            });
            $menu.append($menuItem);
        });
    }
}

const menuItems = [
    {
        icon: 'home',
        url: '/',
        onClick: function() { console.log('Home clicked'); }
    },
    {
        icon: 'person',
        url: '/profile',
        onClick: function() { console.log('Profile clicked'); }
    },
    {
        icon: 'settings',
        url: '/settings',
        onClick: function() { console.log('Settings clicked'); }
    }
];

$(document).ready(function() {
    addMenuItems(menuItems);
});
