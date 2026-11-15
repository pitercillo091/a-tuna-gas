(() => {
  const game=globalThis.ATunaGas, canvas=document.getElementById('poster'), ctx=canvas.getContext('2d');
  const {rect,poly,ellipse}=game.drawing;
  const layouts={
    horizontal:{size:[1200,630], title:[246,91,.78], copy:[287,259,18,23]},
    cuadrada:{size:[1080,1080], title:[540,108,1.08], copy:[540,322,24,31]},
    vertical:{size:[1080,1920], title:[540,206,1.28], copy:[540,442,27,36]}
  };
  const format=new URLSearchParams(location.search).get('formato')||'horizontal';
  const layout=layouts[format]||layouts.horizontal;
  [canvas.width,canvas.height]=layout.size;
  const w=canvas.width,h=canvas.height,track=game.tracks[0];
  const racers=[['guitarra','adoquin'],['canero','olivo'],['coki','farol'],['guitarra-gafas','cohete'],['pena','peineta'],['andres','perol']]
    .map(([character,vehicle])=>({character:game.characters.find(item=>item.id===character),vehicle:game.vehicles.find(item=>item.id===vehicle)}));
  function scene(){
    rect(ctx,'#182530',0,0,w,h);
    ctx.save();ctx.translate(w*.68,h*.58);ctx.rotate(-.08);
    const zoom=format==='horizontal'?1.52:format==='vertical'?2.18:1.92;
    ctx.scale(zoom,zoom);ctx.translate(-1118,-1250);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(game.art.scenery(track),0,0,track.width,track.height);ctx.restore();
    const road=ctx.createLinearGradient(0,h*.18,0,h);road.addColorStop(0,'#22313c88');road.addColorStop(.5,'#172633aa');road.addColorStop(1,'#101b29ee');
    poly(ctx,[[w*.47,h*.16],[w*.78,h*.16],[w*.98,h],[w*.24,h]],road);
    for(let i=0;i<9;i++)rect(ctx,'#f1d494b0',w*.625-(8+i*2)/2,h*(.22+i*.095),8+i*2,30+i*4);
    const dusk=ctx.createLinearGradient(0,0,w,h);dusk.addColorStop(0,'#152430e8');dusk.addColorStop(.5,'#15243066');dusk.addColorStop(1,'#121d2bd9');rect(ctx,dusk,0,0,w,h);
    const shade=format==='horizontal'?ctx.createLinearGradient(0,0,w*.58,0):ctx.createLinearGradient(0,0,0,h*.44);shade.addColorStop(0,'#132430');shade.addColorStop(.58,'#172530d9');shade.addColorStop(1,'#18293700');rect(ctx,shade,0,0,w,h);
  }
  function title(x,y,scale){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.transform(1,0,-.15,1,0,0);ctx.textAlign='center';ctx.textBaseline='alphabetic';
    function line(word,height,font,colors){ctx.font=font+'px "Archivo Black"';const metal=ctx.createLinearGradient(0,height-font*.75,0,height+font*.08);colors.forEach(([p,c])=>metal.addColorStop(p,c));ctx.lineJoin='round';ctx.strokeStyle='#23263b';ctx.lineWidth=6;for(let d=11;d>=1;d-=2){ctx.fillStyle=d>5?'#35263a':'#845c55';ctx.fillText(word,d*.58,height+d);}ctx.strokeText(word,0,height);ctx.fillStyle=metal;ctx.fillText(word,0,height);}
    line('A TUNA',28,83,[[0,'#fffde7'],[.41,'#fff0cf'],[.61,'#aebcc4'],[.85,'#edf2d8'],[1,'#aaaab0']]);line('GAS',153,148,[[0,'#fff5cb'],[.43,'#ffca6f'],[.7,'#f6a34f'],[1,'#e27b3d']]);
    ctx.restore();
  }
  function copy(x,y,size,lineHeight){
    ctx.save();ctx.textAlign=format==='horizontal'?'left':'center';ctx.font='800 '+size+'px Inter';
    const lines=format==='horizontal'?['15 PILOTOS · 30 CIRCUITOS','LOPERA · ARJONA · BAÑOS DE LA ENCINA','JAÉN · CÓRDOBA Y MÁS PUEBLOS','¿SERÁS CAPAZ DE HACER EL MEJOR TIEMPO?']:['15 PILOTOS · 30 CIRCUITOS','LOPERA · ARJONA · BAÑOS DE LA ENCINA','JAÉN · CÓRDOBA Y MÁS PUEBLOS','¿SERÁS CAPAZ DE HACER','EL MEJOR TIEMPO?'];
    lines.forEach((lineText,i)=>{ctx.fillStyle=i===lines.length-1?'#fff0b7':'#f6efe1';ctx.fillText(lineText,x,y+i*lineHeight);});ctx.restore();
  }
  function front(racer,x,y,scale,tilt){ctx.save();ellipse(ctx,'#080e1b88',x,y+18*scale,155*scale,32*scale);game.sequences.paintFront(ctx,racer,x,y,scale,tilt);ctx.restore();}
  function footer(x,y){ctx.save();ctx.textAlign='center';ctx.font=(format==='horizontal'?19:27)+'px "Space Mono"';ctx.fillStyle='#ffe2a4';ctx.fillText('CORRE · DERRAPA · BUSCA EL MEJOR TIEMPO',x,y);ctx.font='800 '+(format==='horizontal'?20:29)+'px Inter';ctx.fillStyle='#f6efe1';ctx.fillText('atunagas.aquiestalatuna.es',x,y+(format==='horizontal'?32:43));ctx.restore();}
  async function paint(){
    await Promise.all([game.art.ready,document.fonts.load('83px "Archivo Black"'),document.fonts.load('800 28px Inter'),document.fonts.load('24px "Space Mono"')]);scene();
    if(format==='horizontal'){
      front(racers[0],720,390,.45,-.02);front(racers[1],865,390,.45,0);front(racers[2],1010,390,.45,.02);
      front(racers[3],720,505,.46,-.02);front(racers[4],865,505,.46,0);front(racers[5],1010,505,.46,.02);
    } else if(format==='cuadrada') {
      front(racers[0],350,625,.52,-.02);front(racers[1],540,625,.52,0);front(racers[2],730,625,.52,.02);
      front(racers[3],350,825,.55,-.02);front(racers[4],540,825,.55,0);front(racers[5],730,825,.55,.02);
    } else {
      const c=format==='vertical'?[[350,1010,.68,-.03],[730,1010,.68,.03],[540,1290,.88,0]]:[[370,610,.56,-.03],[710,610,.56,.03],[540,760,.72,0]];
      front(racers[0],...c[0]);front(racers[1],...c[1]);front(racers[2],...c[2]);
      front(racers[3],c[0][0],c[0][1]+205,c[0][2]*.96,0);front(racers[4],c[1][0],c[1][1]+205,c[1][2]*.96,0);front(racers[5],c[2][0],c[2][1]+260,c[2][2],0);
    }
    title(...layout.title);copy(...layout.copy);footer(w/2,h-(format==='horizontal'?70:54));rect(ctx,'#e1bd7d',0,0,w,4);rect(ctx,'#bd855b',0,h-5,w,5);window.posterReady=true;
  }
  paint().catch(error=>{window.posterError=error.message;console.error(error);});
})();

