const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf-8');

// 1. Button active squish
content = content.replace(/\.btn:active \{\s*transform:[^;]+;/g, '.btn:active {\n  transform: scale(0.96);');

// 2. Choice active squish
content = content.replace(/\.choice:active \{\s*transform:[^;]+;/g, '.choice:active {\n  transform: scale(0.96);');

// 3. Button hover lift
if (content.includes('.btn:hover')) {
  // It might just be changing background.
}

// Better: just append the highly specific overriding CSS at the end!
const animationOverrides = `

/* =========================================
   ANIMATION OVERHAUL OVERRIDES 
   ========================================= */

/* Tactile Active States */
.btn:active, .choice:active, .custom-select-trigger:active, .chip:active, .iconbtn:active {
  transform: scale(0.95) !important;
}

/* Float Hovers */
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
}
.iconbtn:hover {
  transform: scale(1.1) rotate(4deg);
}

.choice {
  will-change: transform, box-shadow;
}
.choice:hover {
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
  border-color: var(--line-strong);
}

/* Tick Pop */
@keyframes tickPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}
.choice.selected .tick svg {
  animation: tickPop 0.35s var(--ease-bounce) both;
}

/* Progress Shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.progress span {
  position: relative;
  overflow: hidden;
}
.progress span::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: shimmer 2.5s infinite linear;
}

/* Blossom unfold for fadeSlideUp */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

content += animationOverrides;

fs.writeFileSync('src/styles.css', content, 'utf-8');
console.log('Appended animation overhaul overrides');
