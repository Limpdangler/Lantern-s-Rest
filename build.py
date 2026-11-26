import re
parts=["util.js","data.js","sprites.js","chars.js","chars2.js","mons2.js","world.js","terrain.js","rules.js","combat.js","explore.js","ex5e.js","subs.js","living.js","dress.js","classfx.js","save.js","effects.js","rules2.js","social.js","ui.js","main.js"]
js="\n".join(open("src/"+p).read() for p in parts)
css=open("src/style.css").read()
body=open("src/body.html").read()
head='''<meta charset="utf-8">\n<title>Lantern Crawl</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;600&display=swap">
'''
out=head+"<style>\n"+css+"\n</style>\n\n"+body+"\n<script>\n(function(){\n\"use strict\";\n"+js+"\n})();\n</script>\n"
open("dist/lantern-crawl.html","w").write(out)
open("dist/check.js","w").write("(function(){\n\"use strict\";\n"+js+"\n})();")
# ---- the GitHub Pages copy (docs/): a full web page that can be installed on a phone and played offline ----
import hashlib
ver=hashlib.md5(out.encode()).hexdigest()[:10]
app_head='''<!doctype html>
<html lang="en"><head>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#1e182c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Lantern's Rest">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-180.png">
'''
sw_reg='''<script>if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))navigator.serviceWorker.register("sw.js").catch(function(){});</script>'''
page=out.replace('<meta charset="utf-8">',app_head+'<meta charset="utf-8">',1).replace('<style>','<style>html,body{margin:0;background:#000}\n',1)+sw_reg
open("docs/index.html","w").write(page)
open("docs/sw.js","w").write(open("tools/sw_template.js").read().replace("__VERSION__",ver))
print(len(out),"· app version",ver)
