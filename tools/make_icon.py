# Draws the home-screen icon (a little pixel lantern) at 192 and 512 pixels.
from PIL import Image
P={'.':None,'k':(26,20,30),'b':(92,58,40),'B':(140,92,56),'g':(255,214,102),'G':(255,240,170),'o':(240,150,50),'w':(255,255,230)}
ART=["................",
     "......kkkk......",
     ".....k....k.....",
     "......kkkk......",
     ".....kBBBBk.....",
     "....kbbbbbbk....",
     "....kbGGggbk....",
     "....kbGwggbk....",
     "....kbgGgobk....",
     "....kbggoobk....",
     "....kbgooobk....",
     "....kbbbbbbk....",
     ".....kBBBBk.....",
     "......kkkk......",
     "................",
     "................"]
def make(sz):
    im=Image.new("RGBA",(16,16),(30,24,44,255))
    # soft glow
    for y in range(16):
        for x in range(16):
            d=((x-7.5)**2+(y-8)**2)**.5
            if d<7:
                a=int((7-d)/7*70);im.putpixel((x,y),(30+a,24+int(a*.8),44+int(a*.2),255))
    for y,row in enumerate(ART):
        for x,c in enumerate(row[:16]):
            if P.get(c):im.putpixel((x,y),P[c]+(255,))
    return im.resize((sz,sz),Image.NEAREST)
for s in (192,512,180):make(s).save(f"docs/icon-{s}.png")
