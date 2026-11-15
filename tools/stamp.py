# 公開する前に 実行する: python3 tools/stamp.py
# js と maps の ファイルに「版の しるし(?v=…)」を つけて、 index.html に 書きこむ。
# ブラウザが 古い ファイルと 新しい ファイルを まぜて 使って、 ゲームが 止まるのを ふせぐ。
import glob, hashlib, json, os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = sorted(os.path.relpath(f, root) for d in ('js', 'maps') for f in glob.glob(os.path.join(root, d, '*.js')))
h = hashlib.sha1()
for f in files:
    h.update(f.encode()); h.update(open(os.path.join(root, f), 'rb').read())
v = h.hexdigest()[:8]
imap = {'imports': {'./' + f: './' + f + '?v=' + v for f in files}}
block = '<!-- 版の しるし(tools/stamp.py が 書きかえる) -->\n<script type="importmap">\n' + json.dumps(imap, ensure_ascii=False, indent=1) + '\n</script>\n<!-- /版の しるし -->'
p = os.path.join(root, 'index.html'); s = open(p, encoding='utf-8').read()
if '<!-- 版の しるし' in s:
    s = re.sub(r'<!-- 版の しるし.*?<!-- /版の しるし -->', lambda m: block, s, flags=re.S)
else:
    s = s.replace('<script type="module"', block + '\n<script type="module"', 1)
s = re.sub(r'<script type="module" src="js/main\.js[^"]*">', f'<script type="module" src="js/main.js?v={v}">', s)
open(p, 'w', encoding='utf-8').write(s)
print('stamp', v, len(files), 'files')
