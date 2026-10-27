from PIL import Image, ImageDraw, ImageFont
F='/home/claude/Constancia/Resources/Fonts/ConstanciaC-%s.otf'
N='/tmp/claude-0/-home-claude/c5ab6c94-5b52-5d5a-a090-f5874504244f/scratchpad/dl/nunito.ttf'
img=Image.new('RGB',(1700,760),'white'); d=ImageDraw.Draw(img)
y=20
for st,wv in (('Regular',400),('Semibold',600),('Bold',700)):
    f=ImageFont.truetype(F%st,150)
    d.text((30,y+170),'Cc Çç',font=f,fill='#336633',anchor='ls')
    # mistura com Nunito: "Controlle Constância"
    nf=ImageFont.truetype(N,96); nf.set_variation_by_axes([wv])
    cf=ImageFont.truetype(F%st,96)
    x=560
    for ch in 'Controlle · Constância ç':
        fnt=cf if ch in 'cCçÇ' else nf
        d.text((x,y+170),ch,font=fnt,anchor='ls',fill='#336633' if fnt is cf else '#1C1C1E')
        x+=d.textlength(ch,font=fnt)
    y+=250
img.save('/home/claude/Constancia/Brand/previews/font-preview.png')
