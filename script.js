/* CardioSense — script.js
   Dark theme · Neural canvas · Animated result overlay */

/* ═══════════════════════════════════════════
   1. NEURAL CANVAS
═══════════════════════════════════════════ */
(function() {
  const canvas = document.getElementById('neuralCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, nodes, raf;

  const NODE_COUNT = 65;
  const MAX_DIST   = 155;
  const SPEED      = 0.28;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeNode() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r:  Math.random() * 2 + 1.2,
      phase: Math.random() * Math.PI * 2,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = performance.now() / 1000;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.22;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(224,92,92,${alpha})`;
          ctx.lineWidth   = 0.7;
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + n.phase);
      const r     = n.r + pulse * 0.9;
      const a     = 0.25 + pulse * 0.4;

      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.5);
      g.addColorStop(0, `rgba(224,92,92,${a})`);
      g.addColorStop(1, `rgba(224,92,92,0)`);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224,92,92,${a + 0.2})`;
      ctx.fill();

      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20 || n.x > W + 20) n.vx *= -1;
      if (n.y < -20 || n.y > H + 20) n.vy *= -1;
    }

    raf = requestAnimationFrame(draw);
  }

  resize();
  nodes = Array.from({ length: NODE_COUNT }, makeNode);
  draw();

  window.addEventListener('resize', () => {
    resize();
    nodes.forEach(n => {
      n.x = Math.min(n.x, W);
      n.y = Math.min(n.y, H);
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else draw();
  });
})();


/* ═══════════════════════════════════════════
   2. LOGISTIC REGRESSION MODEL
   UCI Heart Disease · 13 features
   target 1 = Defective Heart, 0 = Healthy
═══════════════════════════════════════════ */
const MODEL = {
  bias: 0.52,
  weights: [-0.032, -0.71, 0.85, -0.024, -0.003, -0.14, 0.18, 0.032, -0.72, -0.42, 0.42, -0.62, -0.68],
  means:   [54.37, 0.683, 0.967, 131.6, 246.7, 0.149, 0.528, 149.6, 0.327, 1.04, 1.40, 0.729, 2.31],
  stds:    [9.08,  0.466, 1.032, 17.54, 51.78, 0.356, 0.526, 22.9,  0.470, 1.16, 0.616, 1.023, 0.612],
};

function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

function lrPredict(features) {
  let z = MODEL.bias;
  for (let i = 0; i < features.length; i++) {
    z += MODEL.weights[i] * ((features[i] - MODEL.means[i]) / MODEL.stds[i]);
  }
  return sigmoid(z);
}


/* ═══════════════════════════════════════════
   3. FORM FIELDS
═══════════════════════════════════════════ */
const FIELD_IDS = [
  'age','sex','cp','trestbps','chol','fbs',
  'restecg','thalach','exang','oldpeak','slope','ca','thal'
];

const FIELD_LABELS = [
  'Age','Sex','Chest Pain','BP','Cholesterol','Fasting BS',
  'ECG','Max HR','Ex. Angina','ST Depression','ST Slope','Vessels','Thalassemia'
];

function getValues() {
  return FIELD_IDS.map(id => parseFloat(document.getElementById(id).value));
}

function validate(values) {
  let ok = true;
  FIELD_IDS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (isNaN(values[i])) { el.classList.add('invalid'); ok = false; }
    else el.classList.remove('invalid');
  });
  return ok;
}

function predict() {
  const values = getValues();
  if (!validate(values)) return;

  const btn = document.getElementById('predictBtn');
  btn.classList.add('loading');
  btn.querySelector('.btn-text').innerHTML = '<span class="spinner"></span> Analysing…';

  setTimeout(() => {
    const probHealthy   = lrPredict(values);
    const probDefective = 1 - probHealthy;
    const isDefective   = probDefective >= 0.5;

    openResult(isDefective, probDefective, values);

    btn.classList.remove('loading');
    btn.querySelector('.btn-text').textContent = 'Run Prediction';
  }, 1000);
}

function resetForm() {
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.classList.remove('invalid');
  });
}


/* ═══════════════════════════════════════════
   4. RESULT OVERLAY
═══════════════════════════════════════════ */
function openResult(isDefective, probDefective, values) {
  const overlay  = document.getElementById('resultOverlay');
  const bgAnim   = document.getElementById('resultBgAnim');
  const heartPath = document.getElementById('heartPath');
  const rings    = document.querySelectorAll('.icon-ring');
  const title    = document.getElementById('resultTitle');
  const desc     = document.getElementById('resultDesc');
  const bar      = document.getElementById('probBarFill');
  const probText = document.getElementById('probText');
  const features = document.getElementById('resultFeatures');

  const cls = isDefective ? 'risk' : 'healthy';
  const opp = isDefective ? 'healthy' : 'risk';

  // Reset bar
  bar.style.width = '0%';
  bar.className   = 'prob-bar-fill';

  // Set theme
  bgAnim.className  = 'result-bg-anim ' + cls;
  heartPath.className = cls;
  rings.forEach(r => { r.className = 'icon-ring ' + cls; });
  title.className   = 'result-title ' + cls;
  bar.classList.add(cls);

  // Text
  if (isDefective) {
    title.textContent = 'Heart Disease Detected';
    desc.textContent  = `Based on your 13 clinical inputs, the model estimates a ${(probDefective * 100).toFixed(1)}% probability of heart disease. This result warrants prompt follow-up with a cardiologist.`;
  } else {
    title.textContent = 'Heart Appears Healthy';
    desc.textContent  = `Based on your 13 clinical inputs, the model estimates an ${((1 - probDefective) * 100).toFixed(1)}% probability of a healthy heart. Continue regular check-ups and maintain a heart-healthy lifestyle.`;
  }

  probText.textContent = `${(probDefective * 100).toFixed(1)}% risk`;

  // Key feature chips (show 6 most diagnostic)
  const SHOW = [0,1,2,7,8,11]; // age, sex, cp, thalach, exang, ca
  features.innerHTML = SHOW.map((fi, i) => {
    const val = values[fi];
    const display = isNaN(val) ? '—' : val;
    return `<div class="feat-chip">
      <div class="feat-name">${FIELD_LABELS[fi]}</div>
      <div class="feat-val">${display}</div>
    </div>`;
  }).join('');

  // Open overlay
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Animate bar after short delay (wait for transition start)
  setTimeout(() => {
    bar.style.width = (probDefective * 100).toFixed(1) + '%';
  }, 300);
}

function closeResult() {
  const overlay = document.getElementById('resultOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close on backdrop click
document.getElementById('resultOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeResult();
});

// Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeResult();
});

// Remove invalid on input
FIELD_IDS.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input',  () => el.classList.remove('invalid'));
    el.addEventListener('change', () => el.classList.remove('invalid'));
  }
});
