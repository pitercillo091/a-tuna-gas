(() => {
  const game=globalThis.ATunaGas;
  const canvas=document.getElementById('poster');
  const ctx=canvas.getContext('2d');
  const {rect,ellipse,drawKart}=game.drawing;
  const layouts={
    horizontal:{size:[1200,630],title:[291,161,1.08],cta:[284,509],camera:[849,337,1.38,-.49],kartScale:1},
    cuadrada:{size:[1080,1080],title:[547,129,1.46],cta:[540,984],camera:[537,642,1.7,-.58],kartScale:1},
    vertical:{size:[1080,1920],title:[548,302,1.7],cta:[540,1701],camera:[554,1088,2.41,-.94],kartScale:1.08}
  };
  const format=new URLSearchParams(location.search).get('formato')||'horizontal';
  const layout=layouts[format]||layouts.horizontal;
  [canvas.width,canvas.height]=layout.size;
  const w=canvas.width,h=canvas.height;
  const track=game.tracks[0];
  // Each kart follows the centerline of a lane and uses its local track tangent.
  const racers=[
    ['guitarra','adoquin',-63,-48,1.28],
    ['canero','olivo',13,47,1.35],
    ['coki','farol',104,-49,1.45],
    ['guitarra-gafas','cohete',173,49,1.65],
    ['pena','peineta',262,-45,1.24],
    ['andres','perol',347,27,1.17]
  ].map(([character,vehicle,distance,lane,scale])=>({
    pilot:game.characters.find(item=>item.id===character),
    vehicle:game.vehicles.find(item=>item.id===vehicle),
    pose:track.at(distance,lane),
    scale:scale*layout.kartScale
  }));

  function world(draw){
    const [x,y,zoom,angle]=layout.camera;
    const focus=track.at(148);
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(angle);
    ctx.scale(zoom,zoom);
    ctx.translate(-focus.x,-focus.y);
    ctx.imageSmoothingEnabled=false;
    draw();
    ctx.restore();
  }

  function scene(){
    rect(ctx,'#182530',0,0,w,h);
    world(()=>ctx.drawImage(game.art.scenery(track),0,0,track.width,track.height));
    const dusk=ctx.createLinearGradient(0,0,w,h);
    dusk.addColorStop(0,'#15243084');dusk.addColorStop(.5,'#302a492b');dusk.addColorStop(1,'#321f3269');
    rect(ctx,dusk,0,0,w,h);
    const shade=format==='horizontal'?ctx.createLinearGradient(0,0,w*.61,0):ctx.createLinearGradient(0,0,0,h*.45);
    shade.addColorStop(0,'#132430');shade.addColorStop(.5,'#172530dc');shade.addColorStop(1,'#18293700');
    rect(ctx,shade,0,0,w,h);
    const bottom=ctx.createLinearGradient(0,h*.68,0,h);
    bottom.addColorStop(0,'#1d243300');bottom.addColorStop(1,'#121d2beb');
    rect(ctx,bottom,0,0,w,h);
  }

  function motionTrail({pose,scale,vehicle}){
    ctx.save();
    ctx.translate(pose.x,pose.y);
    ctx.rotate(pose.angle);
    ctx.scale(scale,scale);
    for(let i=0;i<7;i++){
      const y=(i%2===0?1:-1)*(14+(i*9)%13);
      const end=-27-(i*19)%37;
      const trail=ctx.createLinearGradient(end-64,0,end,0);
      trail.addColorStop(0,'#f3aa5c00');
      trail.addColorStop(1,i%2===0?vehicle.light+'b0':'#fff0bd90');
      rect(ctx,trail,end-(32+(i*19)%34),y,32+(i*19)%34,1+i%2);
    }
    ctx.restore();
  }

  function drawRacer({pose,pilot,vehicle,scale},index){
    const angle=pose.angle+Math.PI/2;
    const lead=vehicle.id==='cohete';
    if(lead)ellipse(ctx,'#efa46234',pose.x,pose.y,43*scale,31*scale);
    drawKart(ctx,vehicle,{...pose,angle,scale,pilot,time:.16+index*.08,
      state:{speed:225,boost:lead}});
    // Keep the original portrait upright and seated in the kart's cockpit.
    const head=game.portrait.heads.get(pilot.id);
    if(!head)throw Error('Falta el retrato de '+pilot.name);
    ctx.save();
    ctx.translate(Math.round(pose.x),Math.round(pose.y));
    ctx.rotate(angle);
    ctx.translate(0,5*scale);
    ctx.rotate(-angle-layout.camera[3]);
    ctx.drawImage(head,-18*scale,-24*scale,36*scale,39.6*scale);
    ctx.restore();
  }

  function title(x,y,scale){
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    ctx.transform(1,0,-.15,1,0,0);
    ctx.textAlign='center';
    ctx.textBaseline='alphabetic';
    function line(word,height,font,colors){
      ctx.font=font+'px "Archivo Black"';
      const metal=ctx.createLinearGradient(0,height-font*.75,0,height+font*.08);
      colors.forEach(([p,c])=>metal.addColorStop(p,c));
      ctx.lineJoin='round';
      ctx.strokeStyle='#23263b';
      ctx.lineWidth=6;
      for(let depth=11;depth>=1;depth-=2){
        ctx.fillStyle=depth>5?'#35263a':'#845c55';
        ctx.fillText(word,depth*.58,height+depth);
      }
      ctx.strokeText(word,0,height);
      ctx.fillStyle=metal;ctx.fillText(word,0,height);
    }
    line('A TUNA',28,83,[[0,'#fffde7'],[.41,'#fff0cf'],[.61,'#aebcc4'],[.85,'#edf2d8'],[1,'#aaaab0']]);
    line('GAS',153,148,[[0,'#fff5cb'],[.43,'#ffca6f'],[.7,'#f6a34f'],[1,'#e27b3d']]);
    for(let i=0;i<3;i++){
      const shine=ctx.createLinearGradient(-155,0,156,0);
      shine.addColorStop(0,'#f0794000');shine.addColorStop(.72,'#ffb75c');shine.addColorStop(1,'#ffeb9f00');
      rect(ctx,shine,-160+i*18,172+i*6,316-i*39,i===0?3:2);
    }
    ctx.restore();
  }

  function footer(x,y){
    ctx.save();
    ctx.textAlign='center';
    const isWide=format==='horizontal';
    ctx.font=(isWide?19:27)+'px "Space Mono"';
    ctx.fillStyle='#ffe2a4';
    ctx.fillText('30 CIRCUITOS · 2 SENTIDOS',x,y);
    ctx.font='800 '+(isWide?20:29)+'px Inter';
    ctx.fillStyle='#f6efe1';
    ctx.fillText('atunagas.aquiestalatuna.es',x,y+(isWide?32:43));
    ctx.restore();
  }

  async function paint(){
    await Promise.all([game.art.ready,document.fonts.load('83px "Archivo Black"'),
      document.fonts.load('24px "Space Mono"'),document.fonts.load('800 24px Inter')]);
    scene();
    world(()=>{
      racers.forEach(motionTrail);
      racers.forEach(drawRacer);
    });
    title(...layout.title);
    footer(...layout.cta);
    rect(ctx,'#e1bd7d',0,0,w,4);
    rect(ctx,'#bd855b',0,h-5,w,5);
    window.posterReady=true;
  }
  paint().catch(error=>{window.posterError=error.message;console.error(error);});
})();
