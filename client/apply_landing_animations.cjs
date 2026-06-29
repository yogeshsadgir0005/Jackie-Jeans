const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf-8');

const landingOverrides = `

/* =========================================
   LANDING PAGE ANIMATIONS
   ========================================= */

/* Ambient Breathing Background */
@keyframes ambientGlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.landing {
  position: relative;
  z-index: 1;
}

/* We create a pseudo element behind .landing for the ambient glow */
.landing::before {
  content: '';
  position: absolute;
  top: -10%; left: -10%; right: -10%; bottom: -10%;
  z-index: -1;
  background: radial-gradient(circle at 50% 30%, rgba(55,80,255,0.06) 0%, rgba(255,255,255,0) 60%),
              radial-gradient(circle at 80% 80%, rgba(255,100,100,0.04) 0%, rgba(255,255,255,0) 50%);
  background-size: 200% 200%;
  animation: ambientGlow 15s ease infinite;
  pointer-events: none;
}

/* Magnetic Mode Cards */
.mode-card {
  transition: transform 0.4s var(--ease-bounce), box-shadow 0.4s var(--ease-bounce), border-color 0.4s ease;
  will-change: transform, box-shadow;
}

.mode-card:hover {
  transform: scale(1.04) translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04);
  border-color: var(--line-strong);
}

.mode-card:hover .mc-icon {
  transform: scale(1.1) rotate(-5deg);
  transition: transform 0.3s var(--ease-bounce);
}

.mode-card:hover .mc-arrow {
  transform: translateX(6px);
  transition: transform 0.3s var(--ease-bounce);
}

/* Floating Meta Icons */
@keyframes floatMeta {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.meta > div svg {
  animation: floatMeta 3s ease-in-out infinite;
}
.meta > div:nth-child(2) svg {
  animation-delay: 0.4s;
}
.meta > div:nth-child(3) svg {
  animation-delay: 0.8s;
}

`;

content += landingOverrides;

fs.writeFileSync('src/styles.css', content, 'utf-8');
console.log('Appended landing page overrides');
