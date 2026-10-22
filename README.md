# ninuri-website
Static website for Atelier Ninuri (ninuri.de), migrated from WordPress.

Plain HTML, CSS and a little JavaScript, with no build step. Each page lives in its own folder, so the old WordPress addresses (`/keramik/`, `/kontaktformular/` …) keep working.

- `index.html`: start page with the tile mosaic
- `schmuck/`, `keramik/`, `skulpturen/`: work galleries (Gold/Silber, Porzellan/Steinzeug)
- `inspiration/`, `ueber-mich/`, `termine/`, `kontaktformular/`, `impressum/`: the other pages
- `css/style.css`, `js/main.js`: styles, mobile menu, scroll fade-in, gallery lightbox
- `assets/`: logo, favicon, self-hosted Montserrat font, images (`img/home/` mosaic tiles, `img/covers/` section banners, `img/works/` full size, `img/works/thumbs/` previews)

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Updating

- **Termine:** edit the `<ul class="events">` list in `termine/index.html`.
- **New piece in a gallery:** add a WebP of about 1920 px width to `assets/img/works/` and one of about 640 px to `assets/img/works/thumbs/` (same file name), then copy an `<li>` line in the matching `<ul class="gallery">` and change file name, `width`/`height` of the preview, `alt`, `data-caption` and the caption text.
- **Menu, footer:** they are repeated in every `index.html`; change all of them.

## Differences from the WordPress site

- The contact form is replaced by an e-mail button and the phone number (static hosting has no server to send mail).
- The Instagram feed on „Inspiration“ is replaced by a link to the Instagram profile, so no data goes to Instagram until a visitor clicks.
- The font is self-hosted; nothing loads from Google, Jetpack or other third parties, so the cookie banner is gone.
- The sliders on Schmuck, Keramik and Skulpturen are now grids with the same pieces, titles and order (alphabetical, as in WordPress); a click opens a lightbox.
- The tile labels on the start page (Keramik, Ketten, …) are real text over the photos instead of text baked into the images; the „Termine“ tile now links to the Termine page. The logo stays split over two tiles with the grid gap between them, as before.
- Impressum: added „Angaben gemäß § 5 DDG“ (from the contact data in the privacy text) and a paragraph on hosting by GitHub Pages; removed the Strato-specific 7-day log retention sentence and the contact form paragraph.
- Images were converted to WebP and resized (about 35 MB down to 4.6 MB).
