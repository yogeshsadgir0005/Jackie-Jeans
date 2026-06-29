const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf-8');

// Replace any duration > 0.4s to be 0.25s or 0.3s except specific ones like progress or breathe/ripple
content = content.replace(/([a-zA-Z-]+)\s+([0-9\.]+)s\s+var\(--ease-smooth\)/g, (m, prop, dur) => {
    let old_dur = parseFloat(dur);
    // if old_dur is high, we scale it down drastically to make it snappy
    let new_dur = 0.2; // default snappy transition
    if (prop === 'width') new_dur = 0.4; // progress bar
    if (prop === 'animation') {
        if (old_dur > 1.0) new_dur = old_dur; // keep long loops like ripple
        else new_dur = 0.3; // fade in animations
    } else {
        if (old_dur > 0.5) new_dur = 0.25;
        else new_dur = 0.15;
    }
    return `${prop} ${new_dur}s var(--ease-smooth)`;
});

content = content.replace(/animation:\s*([a-zA-Z]+)\s+([0-9\.]+)s\s+var\(--ease-smooth\)/g, (m, name, dur) => {
    let old_dur = parseFloat(dur);
    let new_dur = 0.3;
    if (old_dur > 1.0) new_dur = old_dur;
    return `animation: ${name} ${new_dur}s var(--ease-smooth)`;
});

// Remove the blur from keyframes so it doesn't look laggy
content = content.replace(/filter:\s*blur\([^\)]+\);/g, '');

fs.writeFileSync('src/styles.css', content, 'utf-8');
console.log('Sped up animations');
