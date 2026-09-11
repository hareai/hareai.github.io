#!/usr/bin/env bash
# Rebuild public/fonts/LXGWWenKai.woff2 from the published site's actual
# characters. Not part of `npm run build` — full source TTF is ~25MB.
#
#   npm run subset-wenkai
#   # or
#   bash scripts/subset-wenkai.sh
#
# Scan: src/, lonefox.config.ts, and the consumed lonefox theme sources.
# Skip: vanilla/ (unpublished), dist, node_modules (except lonefox/src).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SRC_DIR="$ROOT/tools/fonts-src"
CHAR_FILE="$SRC_DIR/chars.txt"
TTF="$SRC_DIR/LXGWWenKai-Regular.ttf"
OUT="$ROOT/public/fonts/LXGWWenKai.woff2"
TAG="${WENKAI_TAG:-v1.522}"
TTF_URL="https://github.com/lxgw/LxgwWenKai/releases/download/${TAG}/LXGWWenKai-Regular.ttf"

if ! python3 -c 'from fontTools.ttLib import TTFont; import brotli' 2>/dev/null; then
  echo "need python3-fonttools and python3-brotli (apt), not a venv." >&2
  exit 1
fi

mkdir -p "$SRC_DIR" "$(dirname "$OUT")"

python3 - "$ROOT" "$CHAR_FILE" <<'PY'
import sys
from pathlib import Path

root = Path(sys.argv[1])
out = Path(sys.argv[2])
exts = {".md", ".astro", ".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".html", ".txt"}

# Always keep CJK punctuation so titles/quotes don't fall back.
seed = (
    "「」『』【】（）《》…—–·•、。，：；！？～—‐"
    "　"  # ideographic space
)

chars: set[str] = set(seed)

def take(path: Path) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return
    chars.update(text)

for path in (root / "src").rglob("*"):
    if path.is_file() and path.suffix.lower() in exts:
        take(path)

cfg = root / "lonefox.config.ts"
if cfg.is_file():
    take(cfg)

theme = root / "node_modules" / "lonefox" / "src"
if theme.is_dir():
    for path in theme.rglob("*"):
        if path.is_file() and path.suffix.lower() in exts:
            take(path)

# Drop ASCII control chars; keep everything the posts actually use.
usable = {ch for ch in chars if ch.isprintable() or ch in "\n\t"}
out.write_text("".join(sorted(usable)), encoding="utf-8")
print(f"chars {len(usable)} -> {out}")
PY

if [[ ! -f "$TTF" ]]; then
  echo "fetch $TTF_URL"
  curl -fsSL --retry 3 -o "$TTF.partial" "$TTF_URL"
  mv "$TTF.partial" "$TTF"
fi

python3 - "$TTF" <<'PY'
from fontTools.ttLib import TTFont
import sys
font = TTFont(sys.argv[1])
name = font["name"].getDebugName(1)
n = len(font["glyf"].glyphs) if "glyf" in font else "?"
print(f"source {name!r} glyphs={n} bytes={__import__('pathlib').Path(sys.argv[1]).stat().st_size}")
if name and "WenKai" not in name:
    raise SystemExit(f"unexpected font name: {name}")
PY

tmp="$OUT.tmp"
python3 -m fontTools.subset "$TTF" \
  --text-file="$CHAR_FILE" \
  --flavor=woff2 \
  --output-file="$tmp" \
  --layout-features='kern,liga,clig,ccmp,locl,mark,mkmk' \
  --no-hinting

mv "$tmp" "$OUT"

python3 - "$OUT" "$ROOT" <<'PY'
from pathlib import Path
import re
import sys
from fontTools.ttLib import TTFont

woff, root = Path(sys.argv[1]), Path(sys.argv[2])
font = TTFont(str(woff))
cmap = set()
for table in font["cmap"].tables:
    cmap.update(table.cmap.keys())

cjk_re = re.compile(r"[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]")
blog = root / "src" / "content" / "blog"
missing: list[str] = []
per: dict[str, str] = {}
for p in sorted(blog.glob("*.md")):
    miss = "".join(sorted({ch for ch in cjk_re.findall(p.read_text(encoding="utf-8")) if ord(ch) not in cmap}))
    if miss:
        per[p.name] = miss
        missing.extend(miss)

print(f"subset {woff} bytes={woff.stat().st_size} cmap={len(cmap)}")
if per:
    print("MISSING hanzi in published posts:")
    for name, miss in per.items():
        print(f"  {name}: {len(miss)} {miss}")
    raise SystemExit(1)
print("published posts: 0 missing hanzi")
PY

echo "wrote $OUT"
