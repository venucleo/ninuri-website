"""Copy the latest Instagram posts of @atelier_ninuri into the site.

Run daily by .github/workflows/instagram.yml. It fetches the newest posts
through the Instagram API (token in the INSTAGRAM_TOKEN environment variable),
saves a square WebP of each into assets/instagram/ and rewrites the marked
block in inspiration/index.html. Visitors only ever load these local copies,
so no data goes to Instagram until someone clicks a post.

Usage: python scripts/instagram.py            (live, needs INSTAGRAM_TOKEN)
       python scripts/instagram.py --sample F (offline test with a JSON file
                                               shaped like the API response)
"""
import html
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'instagram')
PAGE = os.path.join(ROOT, 'inspiration', 'index.html')
API = 'https://graph.instagram.com'
COUNT = 12
SIZE = 640  # square tiles, sharp in a six-column grid on retina screens


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read()


def fetch_posts(token):
    query = urllib.parse.urlencode({
        'fields': 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
        'limit': COUNT, 'access_token': token})
    return json.loads(get(f'{API}/me/media?{query}'))['data']


def refresh_token(token):
    """Long-lived tokens last 60 days; refreshing extends them."""
    query = urllib.parse.urlencode({'grant_type': 'ig_refresh_token', 'access_token': token})
    data = json.loads(get(f'{API}/refresh_access_token?{query}'))
    return data['access_token'], data.get('expires_in', 0)


def square(data):
    im = Image.open(io.BytesIO(data)).convert('RGB')
    side = min(im.size)
    left, top = (im.width - side) // 2, (im.height - side) // 2
    return im.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS)


def alt_text(caption):
    # First line of the caption without hashtags, as a short description
    text = (caption or '').split('\n')[0]
    text = re.sub(r'#\S+', '', text).strip()
    return (text[:120] + '…') if len(text) > 120 else (text or 'Beitrag von Atelier Ninuri auf Instagram')


def build_block(items):
    lis = '\n'.join(
        f'        <li style="background:{i["color"]}"><a href="{html.escape(i["permalink"])}" rel="noopener">'
        f'<img src="../assets/instagram/{i["id"]}.webp" width="{SIZE}" height="{SIZE}" loading="lazy" decoding="async" '
        f'alt="{html.escape(i["alt"])}"></a></li>'
        for i in items)
    return f'      <ul class="photo-strip instagram-feed">\n{lis}\n      </ul>'


def main():
    sample = sys.argv[sys.argv.index('--sample') + 1] if '--sample' in sys.argv else None
    if sample:
        posts = json.load(open(sample, encoding='utf-8'))['data']
        load = lambda url: open(os.path.join(os.path.dirname(sample), url), 'rb').read()  # noqa: E731
    else:
        token = os.environ['INSTAGRAM_TOKEN']
        new_token, expires = refresh_token(token)
        print(f'Token valid for {expires // 86400} more days')
        if new_token != token and os.environ.get('GITHUB_OUTPUT'):
            print(f'::add-mask::{new_token}')  # never show the token in the public log
            with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
                f.write(f'new_token={new_token}\n')
        posts = fetch_posts(new_token)
        load = get

    os.makedirs(OUT, exist_ok=True)
    items = []
    for p in posts[:COUNT]:
        url = p.get('thumbnail_url') if p.get('media_type') == 'VIDEO' else p.get('media_url')
        if not url:
            continue
        path = os.path.join(OUT, f'{p["id"]}.webp')
        if not os.path.exists(path):  # posts do not change, so each is fetched once
            square(load(url)).save(path, 'WEBP', quality=78, method=6)
        color = Image.open(path).resize((1, 1), Image.BOX).getpixel((0, 0))
        items.append({'id': p['id'], 'permalink': p['permalink'], 'alt': alt_text(p.get('caption')),
                      'color': '#%02x%02x%02x' % color})
    if not items:
        sys.exit('No posts returned, page left unchanged')

    # Drop images of posts that are no longer among the newest
    keep = {f'{i["id"]}.webp' for i in items}
    for name in os.listdir(OUT):
        if name.endswith('.webp') and name not in keep:
            os.remove(os.path.join(OUT, name))

    page = open(PAGE, encoding='utf-8').read()
    new = re.sub(r'(<!-- instagram:start -->\n).*?(\n\s*<!-- instagram:end -->)',
                 lambda m: m.group(1) + build_block(items) + m.group(2), page, flags=re.S)
    if new == page:
        print('Feed unchanged')
    else:
        open(PAGE, 'w', encoding='utf-8', newline='\n').write(new)
        print(f'Feed updated with {len(items)} posts')


if __name__ == '__main__':
    main()
