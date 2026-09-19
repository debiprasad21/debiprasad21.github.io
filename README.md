# Debiprasad Dash — Portfolio

Single-page static site. No build step, no framework, no dependencies.
Content base: **CV MASTER v3.0 (2026-09-18)**.

## Run it

Open the folder in VS Code → Live Server extension → right-click `index.html` → Open with Live Server.

Or from a terminal here:

```bash
python -m http.server 8000     # http://localhost:8000
```

## Structure

```
portfolio/
├── index.html          all content — search "EDIT:" for the spots that need you
├── 404.html            shown for bad URLs on GitHub Pages
├── css/style.css       all styling — colours in :root at the top
├── js/main.js          nav, scroll reveal, circuit line, progress bar
├── assets/
│   ├── img/            favicon.svg + your profile.jpg, og-cover.png
│   └── docs/           your CV PDF
├── .nojekyll           serve files as-is on GitHub Pages
├── robots.txt
├── .gitignore
└── EDIT_GUIDE.md       full end-to-end walkthrough — read this one
```

## Next steps

See `EDIT_GUIDE.md`. Short version: add your photo and CV PDF → edit the `EDIT:` spots →
push to a public repo named `debiprasad21.github.io` → Settings → Pages → deploy from `main`.
