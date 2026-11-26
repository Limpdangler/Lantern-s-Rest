import re
parts=["util.js","data.js","sprites.js","chars.js","chars2.js","mons2.js","world.js","terrain.js","rules.js","combat.js","explore.js","ex5e.js","subs.js","living.js","dress.js","classfx.js","save.js","effects.js","ui.js","main.js"]
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
print(len(out))
