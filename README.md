# ninuri-website
Static website for Atelier Ninuri (ninuri.de), migrated from WordPress.

Plain HTML, CSS and a little JavaScript, with no build step. Each page lives in its own folder, so the old WordPress addresses (`/keramik/`, `/kontaktformular/` …) keep working.

- `index.html`: start page with the tile mosaic
- `schmuck/`, `keramik/`, `skulpturen/`: work galleries (Gold/Silber, Porzellan/Steinzeug)
- `inspiration/`, `ueber-mich/`, `termine/`, `kontaktformular/`, `impressum/`: the other pages
- `css/style.css`, `js/main.js`: styles, mobile menu, scroll fade-in, gallery lightbox
- `assets/`: logo (`img/logo.svg`: the mark as three curves, n transparent, corners rounded), favicon, self-hosted Montserrat font, images (`img/home/` mosaic tiles, `img/covers/` section banners, `img/works/` full size, `img/works/thumbs/` previews)

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Updating

- **Termine:** edit the `<ul class="events">` list in `termine/index.html`.
- **New piece in a gallery:** add a WebP of about 1920 px width to `assets/img/works/` and one of about 640 px to `assets/img/works/thumbs/` (same file name), then copy an `<li>` line in the matching `<ul class="gallery">` and change file name, `width`/`height` of the preview, `alt`, `data-caption` and the caption text.
- **Menu, footer:** they are repeated in every `index.html`; change all of them.

## Instagram feed

Once a day, the GitHub Action `.github/workflows/instagram.yml` runs `scripts/instagram.py`. It fetches the 12 newest posts of @atelier_ninuri, saves a square copy of each in `assets/instagram/` and updates the grid on the Inspiration page. Visitors only load these copies, so nothing goes to Instagram until someone clicks a post. Until a token is set up, the page shows six atelier photos instead.

One-time setup:

1. In the Instagram app, switch @atelier_ninuri to a **professional account** (Creator or Business): Settings → Account type and tools. This is free.
2. On developers.facebook.com, create an app with the use case for the **Instagram API with Instagram Login**. Add @atelier_ninuri under the Instagram settings and generate an **access token**; it is a long-lived token, valid for 60 days, with read access to the account's posts.
3. In this repository on GitHub: Settings → Secrets and variables → Actions → New repository secret, name `INSTAGRAM_TOKEN`, value: the token.
4. Actions tab → "Instagram feed" → Run workflow. After a minute the posts appear on the Inspiration page.

The job renews the token on every run. To store the renewed token automatically, also add a secret `GH_ADMIN_TOKEN`: a fine-grained personal access token for this repository only, with the single permission "Secrets: Read and write". Without it, generate a new token in the Meta app every 60 days and replace `INSTAGRAM_TOKEN`.

Test offline without a token: `python scripts/instagram.py --sample sample.json`, where `sample.json` looks like the API response (`{"data": [{"id", "caption", "media_type", "media_url", "permalink"}]}`) and `media_url` names image files next to it.

## Differences from the WordPress site

- The contact form is replaced by an e-mail button and the phone number (static hosting has no server to send mail).
- The Instagram feed on „Inspiration“ is now a daily copy of the latest posts (see above) instead of a plugin, so no data goes to Instagram until a visitor clicks.
- The font is self-hosted; nothing loads from Google, Jetpack or other third parties, so the cookie banner is gone.
- The sliders on Schmuck, Keramik and Skulpturen are now grids with the same pieces, titles and order (alphabetical, as in WordPress); a click opens a lightbox.
- The tile labels on the start page (Keramik, Ketten, …) are real text over the photos instead of text baked into the images; the „Termine“ tile now links to the Termine page. The logo stays split over two tiles with the grid gap between them, as before.
- Impressum: added „Angaben gemäß § 5 DDG“ (from the contact data in the privacy text) and a paragraph on hosting by GitHub Pages; removed the Strato-specific 7-day log retention sentence and the contact form paragraph.
- Images were converted to WebP and resized (about 35 MB down to 4.6 MB).
