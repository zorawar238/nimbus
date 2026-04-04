// Common JS functionalities

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Theme configuration
    const themeToggle = document.getElementById("theme-toggle");
    const currentTheme = localStorage.getItem("theme");

    if (currentTheme) {
        document.documentElement.setAttribute("data-theme", currentTheme);
        updateThemeIcon(currentTheme);
    } else {
        // Defaults to user's system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute("data-theme", 'dark');
            updateThemeIcon('dark');
        }
    }

    themeToggle.addEventListener("click", () => {
        let theme = document.documentElement.getAttribute("data-theme");
        let switchTo = theme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", switchTo);
        localStorage.setItem("theme", switchTo);
        updateThemeIcon(switchTo);
    });

    function updateThemeIcon(theme) {
        themeToggle.innerHTML = '';
        const iconName = theme === "dark" ? "sun" : "moon";
        const iconNode = document.createElement('i');
        iconNode.setAttribute('data-lucide', iconName);
        themeToggle.appendChild(iconNode);
        lucide.createIcons();
    }
});

// Utility: Show Toast Notification
window.showToast = function(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};
