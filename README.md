# Norman Cowie Pottery

A simple, fast website for Norman's handmade stoneware. Plain HTML and CSS, no build tools needed.

## Files

- `index.html` — all the page content (text, gallery, contact details)
- `style.css` — colours, fonts, and layout
- `script.js` — the spinning pottery wheel, the drawn gallery pots and glaze filter, and the kiln thermometer
- `images/` — put photos of pots and of Norman here

## Things to fill in

Search `index.html` for square brackets `[ ]` and replace them:

- When and how Norman started potting, and where his studio is
- Market name and schedule
- Town or area
- Email address (`norman@example.com` appears twice on one line)
- Instagram link

## Adding real photos

1. Copy a photo into the `images` folder, e.g. `images/blue-bowl.jpg`.
2. In `index.html`, find the piece and replace its empty `<div class="pot-art"></div>` with:
   `<div class="pot-art"><img src="images/blue-bowl.jpg" alt="Short description of the pot"></div>`
3. Keep the piece's `data-glaze` set correctly so the glaze filter buttons still work.
4. Keep photos under about 500 KB each (resize to ~1600 px wide) so the site loads fast.

## Publishing with VS Code + GitHub Pages

1. Open this folder in VS Code (File > Open Folder).
2. Click the Source Control icon in the left sidebar, then **Publish to GitHub**. Sign in if asked, and choose a **public** repository (e.g. `norman-pottery`).
3. On github.com, open the repository > **Settings** > **Pages**.
4. Under "Build and deployment", set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
5. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/norman-pottery/`.

## Making changes later

Edit files in VS Code, then in Source Control: type a short message (e.g. "Add new mugs"), click **Commit**, then **Sync Changes**. The live site updates within a couple of minutes.

## Optional: a custom domain

Buy a domain (e.g. `normanspottery.com.au`), add it under Settings > Pages > Custom domain, and follow GitHub's DNS instructions.
