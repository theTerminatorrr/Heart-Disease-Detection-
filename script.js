// Field order MUST match the training columns (X in your notebook).
const FIELDS = [
  { k: 'age', label: 'Age', hint: 'years', type: 'num', min: 1, max: 120 },
  { k: 'sex', label: 'Sex', type: 'sel', opts: [[0, 'Female'], [1, 'Male']] },
  { k: 'cp', label: 'Chest pain type', type: 'sel', opts: [[0, '0 – Typical angina'], [1, '1 – Atypical angina'], [2, '2 – Non-anginal pain'], [3, '3 – Asymptomatic']] },
  { k: 'trestbps', label: 'Resting blood pressure', hint: 'mm Hg', type: 'num', min: 50, max: 260 },
  { k: 'chol', label: 'Cholesterol', hint: 'mg/dl', type: 'num', min: 50, max: 700 },
  { k: 'fbs', label: 'Fasting blood sugar > 120 mg/dl', type: 'sel', opts: [[0, 'No'], [1, 'Yes']] },
  { k: 'restecg', label: 'Resting ECG result', type: 'sel', opts: [[0, '0 – Normal'], [1, '1 – ST-T abnormality'], [2, '2 – LV hypertrophy']] },
  { k: 'thalach', label: 'Max heart rate achieved', hint: 'bpm', type: 'num', min: 50, max: 250 },
  { k: 'exang', label: 'Exercise-induced angina', type: 'sel', opts: [[0, 'No'], [1, 'Yes']] },
  { k: 'oldpeak', label: 'ST depression (oldpeak)', hint: 'decimal', type: 'num', min: 0, max: 10, step: '0.1' },
  { k: 'slope', label: 'Slope of peak exercise ST', type: 'sel', opts: [[0, '0 – Upsloping'], [1, '1 – Flat'], [2, '2 – Downsloping']] },
  { k: 'ca', label: 'Major vessels colored (fluoroscopy)', type: 'sel', opts: [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4']] },
  { k: 'thal', label: 'Thalassemia code', hint: 'dataset code', type: 'sel', opts: [[0, '0'], [1, '1'], [2, '2'], [3, '3']] },
];
const EXAMPLE = [48, 0, 2, 130, 275, 0, 1, 139, 0, 0.2, 2, 0, 2]; // same as input_data in your notebook

const box = document.getElementById('fields');
FIELDS.forEach(f => {
  const l = document.createElement('label');
  l.innerHTML = `<span>${f.label}${f.hint ? ` <small>(${f.hint})</small>` : ''}</span>`;
  let el;
  if (f.type === 'sel') {
    el = document.createElement('select');
    f.opts.forEach(([v, t]) => el.add(new Option(t, v)));
  } else {
    el = document.createElement('input');
    el.type = 'number'; el.inputMode = 'decimal';
    el.min = f.min; el.max = f.max; el.step = f.step || '1'; el.required = true;
  }
  el.id = f.k; l.appendChild(el); box.appendChild(l);
});

const model = (typeof MODEL !== "undefined") ? MODEL : null;
if (model && model.features.join() !== FIELDS.map(f => f.k).join()) console.warn("Feature order mismatch");

const form = document.getElementById('form');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('close');
let lastFocus = null;

document.getElementById('example').onclick = () =>
  FIELDS.forEach((f, i) => document.getElementById(f.k).value = EXAMPLE[i]);
form.addEventListener('reset', closeResult);

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!model) { return show('Model not loaded', 'model.js is missing. Run export_model.py and keep model.js next to index.html.', 0); }
  const x = []; let ok = true;
  FIELDS.forEach(f => {
    const el = document.getElementById(f.k);
    const v = parseFloat(el.value);
    const bad = isNaN(v) || (f.type === 'num' && (v < f.min || v > f.max));
    el.classList.toggle('bad', bad); if (bad) ok = false; x.push(v);
  });
  if (!ok) return show('Check your inputs', 'Highlighted fields are empty or out of range.', 0);
  const z = x.reduce((s, v, i) => s + v * model.coef[i], model.intercept);
  const p = 1 / (1 + Math.exp(-z));            // sigmoid, same as sklearn predict_proba
  show(p >= .5 ? 'Heart disease likely' : 'Heart disease unlikely', `Model probability of disease: ${(p * 100).toFixed(1)}%`, p);
});

function show(title, text, p) {
  lastFocus = document.activeElement;
  document.getElementById('verdict').textContent = title;
  document.getElementById('prob').textContent = text;
  const fill = document.getElementById('barfill');
  fill.style.width = '0%';
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = (p * 100) + '%'; }));
  closeBtn.focus();
}
function closeResult() {
  overlay.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
closeBtn.addEventListener('click', closeResult);
overlay.addEventListener('click', e => { if (e.target === overlay) closeResult(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeResult(); });
