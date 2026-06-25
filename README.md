# CardioSense — Heart Disease Predictor
## Deployment Guide (GitHub Pages)

---

### Files in this project
```
index.html   ← Main page (structure + form)
style.css    ← Beige theme + neural canvas styles
script.js    ← Neural animation + LR prediction logic
README.md    ← This file
```

---

## Step-by-step: Deploy to GitHub Pages (FREE)

### Step 1 — Create a GitHub account
Go to https://github.com and sign up if you don't have an account.

---

### Step 2 — Create a new repository
1. Click the **"+"** icon (top right) → **"New repository"**
2. Repository name: `heart-disease-predictor` (or any name you like)
3. Set visibility to **Public**
4. Do **NOT** check "Add a README file"
5. Click **"Create repository"**

---

### Step 3 — Upload your files
On the new empty repository page:
1. Click **"uploading an existing file"** link
2. Drag and drop all 3 files:
   - `index.html`
   - `style.css`
   - `script.js`
3. Scroll down → type a commit message like `"Initial commit"`
4. Click **"Commit changes"**

---

### Step 4 — Enable GitHub Pages
1. Go to your repository → click **"Settings"** tab
2. In the left sidebar, click **"Pages"**
3. Under **"Branch"**, select `main` and folder `/root`
4. Click **"Save"**

---

### Step 5 — Access your live website
After ~1–2 minutes, your site will be live at:
```
https://YOUR-USERNAME.github.io/heart-disease-predictor/
```
Replace `YOUR-USERNAME` with your actual GitHub username.

You can find this URL in Settings → Pages (it appears at the top once deployed).

---

## Optional: Update your site later
If you want to change the files after deployment:
1. Go to your repository
2. Click the file you want to edit
3. Click the **pencil icon** (Edit)
4. Make changes → commit

Changes go live within ~1 minute.

---

## How the prediction works
The website runs a **Logistic Regression** model directly in the browser (no server needed). The model weights are derived from training on the UCI Heart Disease dataset — the same approach used in the Python notebook. It uses the same 13 features your notebook trained on.

> ⚠️ This is for educational use only. Not a substitute for professional medical advice.
