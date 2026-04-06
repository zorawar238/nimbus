const fs = require('fs');
const files = ['index.html', 'history.html', 'team.html', 'login.html'];
const script = `    <script>
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', savedTheme);
    </script>
</head>`;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace('</head>', script);
    fs.writeFileSync(f, content);
});
console.log('done');
