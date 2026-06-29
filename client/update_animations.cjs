const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf-8');

if (!content.includes('--ease-smooth')) {
    content = content.replace(':root {', ':root {\n  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);\n  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);\n  --ease-slow: cubic-bezier(0.22, 1, 0.36, 1);');
}

content = content.replace(/@keyframes fadeSlideUp \{[\s\S]*?\}/, `@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}`);

content = content.replace(/@keyframes fadeIn \{[\s\S]*?\}/, `@keyframes fadeIn {
  from { opacity: 0; filter: blur(4px); }
  to { opacity: 1; filter: blur(0); }
}`);

content = content.replace(/([a-zA-Z-]+)\s+([0-9\.]+)s\s+(ease|ease-out|ease-in-out|cubic-bezier[^;,\)]+\))/g, (m, prop, dur, ease) => {
    // Increase duration slightly for luxurious feel, maxing out bounds
    let new_dur = Math.max(0.4, parseFloat(dur) * 1.5);
    return `${prop} ${new_dur.toFixed(2)}s var(--ease-smooth)`;
});

content = content.replace(/animation:\s*([a-zA-Z]+)\s+([0-9\.]+)s\s+(ease|ease-out|ease-in-out|cubic-bezier[^;,\)]+\))/g, (m, name, dur, ease) => {
    let new_dur = Math.max(0.6, parseFloat(dur) * 1.3);
    return `animation: ${name} ${new_dur.toFixed(2)}s var(--ease-smooth)`;
});

// Remove trailing spaces or duplicate var(--ease-smooth)
content = content.replace(/var\(--ease-smooth\)\s*var\(--ease-smooth\)/g, 'var(--ease-smooth)');

fs.writeFileSync('src/styles.css', content, 'utf-8');
console.log('Updated animations');
