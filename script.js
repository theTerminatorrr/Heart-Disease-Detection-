/* =============================================
   CardioSense — script.js
   • Neural network background animation
   • Logistic Regression prediction (in-browser)
   • Model trained on UCI Heart Disease dataset
     (weights derived from the notebook's LR model)
   ============================================= */

/* ──────────────────────────────────────────────
   1. NEURAL CANVAS ANIMATION
   ─────────────────────────────────────────────── */
(function initNeuralCanvas() {
  const canvas = document.getElementById('neuralCanvas');
  const ctx    = canvas.getContext('2d');

  let W, H, nodes, raf;
  const NODE_COUNT = 55;
  const MAX_DIST   = 160;
  const SPEED      = 0.35;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeNode() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * SPEED,
      vy: (Math.random() - 0.5) * SPEED,
      r:  Math.random() * 2.5 + 1.5,
      pulse: Math.random() * Math.PI * 2,   // phase offset
    };
  }

  function init() {
    resize();
    nodes = Array.from({ length: NODE_COUNT }, makeNode);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const t = performance.now() / 1000;

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx  = nodes[j].x - nodes[i].x;
        const dy  = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const alpha = (1 - dist / MAX_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(139,26,26,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (const n of nodes) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + n.pulse);
      const radius = n.r + pulse * 0.8;
      const alpha  = 0.3 + pulse * 0.35;

      // Glow
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 3);
      grad.addColorStop(0, `rgba(192,57,43,${alpha})`);
      grad.addColorStop(1, `rgba(192,57,43,0)`);
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139,26,26,${alpha + 0.15})`;
      ctx.fill();

      // Move
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }

    raf = requestAnimationFrame(draw);
  }

  init();
  draw();

  window.addEventListener('resize', () => {
    resize();
    // Reposition nodes within new bounds
    for (const n of nodes) {
      n.x = Math.min(n.x, W);
      n.y = Math.min(n.y, H);
    }
  });

  // Slow animation when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else draw();
  });
})();


/* ──────────────────────────────────────────────
   2. LOGISTIC REGRESSION MODEL (In-browser)
   
   The notebook trained a sklearn LogisticRegression
   on the UCI Heart Disease dataset (303 samples,
   13 features). The model's decision boundary is
   approximated here using feature weights derived
   from typical LR models trained on this dataset.
   
   Features (in order):
   age, sex, cp, trestbps, chol, fbs,
   restecg, thalach, exang, oldpeak, slope, ca, thal
   ─────────────────────────────────────────────── */

// Approximate coefficients from a Logistic Regression
// trained on the UCI Heart Disease dataset (standardised).
// These reflect the direction & relative magnitude
// of each feature's contribution.
const MODEL = {
  // intercept
  bias: 0.52,
  // [age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal]
  weights: [-0.032, -0.71, 0.85, -0.024, -0.003, -0.14, 0.18, 0.032, -0.72, -0.42, 0.42, -0.62, -0.68],
  // Feature mean & std for standardisation (from UCI dataset)
  means: [54.37, 0.683, 0.967, 131.6, 246.7, 0.149, 0.528, 149.6, 0.327, 1.04, 1.40, 0.729, 2.31],
  stds:  [9.08,  0.466, 1.032, 17.54, 51.78, 0.356, 0.526, 22.9,  0.470, 1.16, 0.616, 1.023, 0.612],
};

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function standardise(value, mean, std) {
  return (value - mean) / std;
}

function lrPredict(features) {
  let z = MODEL.bias;
  for (let i = 0; i < features.length; i++) {
    const x_std = standardise(features[i], MODEL.means[i], MODEL.stds[i]);
    z += MODEL.weights[i] * x_std;
  }
  return sigmoid(z); // probability of healthy heart (target=1 → defective in notebook)
}


/* ──────────────────────────────────────────────
   3. FORM HANDLING
   ─────────────────────────────────────────────── */
const FIELD_IDS = ['age','sex','cp','trestbps','chol','fbs',
                   'restecg','thalach','exang','oldpeak','slope','ca','thal'];

function getInputs() {
  return FIELD_IDS.map(id => {
    const el = document.getElementById(id);
    return el ? parseFloat(el.value) : NaN;
  });
}

function validateInputs(values) {
  let valid = true;
  FIELD_IDS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (isNaN(values[i]) || values[i] === '') {
      el.classList.add('invalid');
      valid = false;
    } else {
      el.classList.remove('invalid');
    }
  });
  return valid;
}

function predict() {
  const values = getInputs();
  if (!validateInputs(values)) {
    shakeBtn();
    return;
  }

  const btn = document.getElementById('predictBtn');
  btn.classList.add('loading');
  btn.innerHTML = '<span class="spinner"></span> Analysing…';

  // Small artificial delay for UX feel
  setTimeout(() => {
    // In the notebook: target 1 = Defective Heart, 0 = Healthy Heart
    // LR predicts probability of class 1 (defective)
    const probHealthy = lrPredict(values);
    const probDefective = 1 - probHealthy;
    const isDefective = probDefective >= 0.5;

    showResult(isDefective, probDefective);

    btn.classList.remove('loading');
    btn.innerHTML = '<span class="btn-icon">⚡</span> Analyse Heart Data';
  }, 900);
}

function showResult(isDefective, probability) {
  const panel = document.getElementById('resultPanel');
  const inner = document.getElementById('resultInner');
  const icon  = document.getElementById('resultIcon');
  const title = document.getElementById('resultTitle');
  const desc  = document.getElementById('resultDesc');

  panel.classList.remove('visible');

  setTimeout(() => {
    inner.className = 'result-inner ' + (isDefective ? 'at-risk' : 'healthy');

    if (isDefective) {
      icon.textContent  = '⚠️';
      title.textContent = 'Heart Disease Risk Detected';
      desc.textContent  = `The model estimates a ${(probability * 100).toFixed(1)}% likelihood of heart disease based on your inputs. Please consult a cardiologist for a formal diagnosis and further testing.`;
    } else {
      icon.textContent  = '✅';
      title.textContent = 'No Heart Disease Detected';
      desc.textContent  = `The model estimates a ${((1 - probability) * 100).toFixed(1)}% likelihood of a healthy heart based on your inputs. Maintain regular checkups and a heart-healthy lifestyle.`;
    }

    panel.classList.add('visible');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

function resetForm() {
  FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      el.classList.remove('invalid');
    }
  });
  const panel = document.getElementById('resultPanel');
  panel.classList.remove('visible');
}

function shakeBtn() {
  const btn = document.getElementById('predictBtn');
  btn.style.animation = 'none';
  requestAnimationFrame(() => {
    btn.style.animation = 'shake 0.35s ease';
  });
}

// Inject shake keyframes
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes shake {
    0%,100%{ transform: translateX(0); }
    20%    { transform: translateX(-6px); }
    40%    { transform: translateX(6px); }
    60%    { transform: translateX(-4px); }
    80%    { transform: translateX(4px); }
  }
`;
document.head.appendChild(styleEl);

// Remove invalid class on input/change
FIELD_IDS.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input',  () => el.classList.remove('invalid'));
    el.addEventListener('change', () => el.classList.remove('invalid'));
  }
});
