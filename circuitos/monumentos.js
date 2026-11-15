(() => {
  const game = globalThis.ATunaGas;
  const {poly,rect,ellipse} = game.drawing;
  function sign(ctx,x,y,text,tint='#f6d79d') {
    ctx.textAlign='center';
    ctx.font='bold 13px monospace';
    rect(ctx,'#252832c8',x-ctx.measureText(text).width/2-7,y-13,ctx.measureText(text).width+14,17);
    ctx.fillStyle=tint;
    ctx.fillText(text,x,y);
  }
  function stone(ctx,x,y,w,h,colors) {
    const [light,face,shadow]=colors;
    rect(ctx,shadow,x+4,y+8,w,h);
    rect(ctx,face,x,y,w,h);
    for(let row=3;row<h-2;row+=8) {
      rect(ctx,shadow,x,y+row,w,1);
      for(let col=(row%3+1)*5;col<w-1;col+=14) rect(ctx,shadow,x+col,y+row-2,1,3);
    }
    rect(ctx,light,x,y,w,2);
    rect(ctx,shadow,x+w-5,y+2,5,h-2);
  }
  const honey=['#f5d096','#b99068','#805e54'];
  const ivory=['#ffe5b1','#d3bb9a','#a28476'];
  const red=['#e2b48b','#ad745d','#6d4b4d'];
  function tower(ctx,x,y,w,h,colors) {
    stone(ctx,x,y,w,h,colors);
    rect(ctx,colors[0],x-2,y+4,w+4,3);
    for(let col=0;col<w;col+=10) {
      rect(ctx,colors[2],x+col,y-7,7,9);
      rect(ctx,colors[0],x+col,y-8,6,5);
    }
    rect(ctx,'#3c3940',x+w/2-2,y+16,4,11);
  }
  function castle(ctx,x,y,colors,label,shape) {
    ctx.save();
    ctx.translate(x,y);
    const contour=shape==='lopera' ? [[-117,34],[-98,-53],[-20,-82],[87,-66],[119,36],[4,75]] :
      [[-119,-40],[92,-52],[117,35],[72,69],[-109,52]];
    ellipse(ctx,'#27273667',16,25,142,80);
    poly(ctx,contour.map(([a,b])=>[a+6,b+15]),colors[2]);
    poly(ctx,contour,colors[1]);
    poly(ctx,contour.map(([a,b])=>[a*.84,b*.78]),'#bf9d73');
    const towers=shape==='lopera'
      ? [[-120,13,30,62],[-112,-66,31,60],[-31,-92,34,56],[74,-79,34,67],[96,18,35,62]]
      : [[-119,-51,39,84],[-114,18,34,55],[75,-64,43,104],[69,23,38,50]];
    for(const args of towers) tower(ctx,...args,colors);
    tower(ctx,-15,-53,63,95,colors);
    rect(ctx,'#3f3c44',-5,42,22,20);
    ellipse(ctx,'#3f3c44',6,43,11,8);
    sign(ctx,5,91,label);
    ctx.restore();
  }
  function church(ctx,x,y,label,colors,s=1) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(s,s);
    ellipse(ctx,'#392e3990',12,28,133,80);
    stone(ctx,-111,-45,225,106,colors);
    poly(ctx,[[-104,-45],[0,-88],[104,-45],[0,-15]],'#936654');
    poly(ctx,[[-104,-45],[0,-88],[15,-51],[0,-15]],'#bd8867');
    stone(ctx,-76,4,152,62,colors);
    for(const d of [-63,60]) {
      tower(ctx,d-15,-66,38,113,colors);
      rect(ctx,'#523e43',d-4,-26,15,16);
      ellipse(ctx,'#523e43',d+4,-26,7,8);
      poly(ctx,[[d-18,-68],[d+23,-68],[d+3,-91]],'#655860');
    }
    for(let d=-39;d<=39;d+=39) {
      rect(ctx,'#4d4146',d-6,31,12,21);
      ellipse(ctx,'#4d4146',d,31,6,8);
      rect(ctx,colors[0],d-12,23,2,32);
    }
    sign(ctx,0,87,label);
    ctx.restore();
  }
  const rivers = {
    'villa-del-rio':{y:870, swing:90, freq:670, width:94, color:'#467f85', bank:'#9bb482'},
    montoro:{y:1000,swing:235,freq:580,width:123,color:'#426d81',bank:'#aa9875'},
    cordoba:{y:1610,swing:115,freq:980,width:188,color:'#406e80',bank:'#9d8b81'},
    'puente-genil':{y:1030,swing:128,freq:650,width:122,color:'#426e86',bank:'#9b9783'},
    marmolejo:{y:936,swing:182,freq:780,width:133,color:'#52868b',bank:'#9da784'},
    'el-carpio':{y:970,swing:86,freq:560,width:98,color:'#66818b',bank:'#a19778'},
    villafranca:{y:1045,swing:105,freq:700,width:144,color:'#497780',bank:'#a6b684'}
  };
  const riverY=(x,r)=>r.y+Math.sin(x/r.freq+.43)*r.swing;
  function river(ctx,track,rand){
    const r=rivers[track.region];
    if(!r) return;
    const line=(color,w)=>{
      ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=w;
      for(let x=0;x<=track.width+18;x+=18) {
        if(x===0) ctx.moveTo(x,riverY(x,r)); else ctx.lineTo(x,riverY(x,r));
      }
      ctx.stroke();
    };
    line('#475a5f',r.width+44);
    line(r.bank,r.width+33);
    line(r.color,r.width);
    line('#79a4a176',r.width*.55);
    for(let i=0;i<550;i++){
      const x=rand()*track.width;
      const y=riverY(x,r)+(rand()-.5)*r.width*.85;
      rect(ctx,i%3?'#85b5ad48':'#314f7150',x,y,8+rand()*24,1.5);
    }
  }

  function bridge(ctx,x,y,colors,text){
    ellipse(ctx,'#263c4a6e',x,y+21,138,33);
    stone(ctx,x-137,y-22,274,52,colors);
    for(let i=-104;i<=104;i+=42){
      rect(ctx,'#354956',x+i-15,y+8,30,22);
      ellipse(ctx,'#354956',x+i,y+8,15,11);
      ellipse(ctx,'#779b9870',x+i+3,y+28,10,3);
      rect(ctx,colors[0],x+i-17,y-6,3,12);
    }
    rect(ctx,colors[0],x-143,y-24,286,6);
    rect(ctx,colors[2],x-141,y-17,281,5);
    sign(ctx,x,y-38,text);
  }

  function parcels(ctx,track,{house,plaza,tree,rand},lots,colors){
    let index=0;
    const water=rivers[track.region];
    for(const [x,y,count] of lots) {
      for(let i=0;i<count;i++){
        const px=x+i*95;
        const py=y+(i%2)*13;
        const near=track.project(px,py);
        if(Math.abs(near.offset)<near.road+84 || (water && Math.abs(py-riverY(px,water))<water.width*.7)) continue;
        if(i===0) plaza(ctx,px-13,py-12,99,82);
        house(ctx,px,py,71+rand()*12,44+rand()*13,colors[index++%colors.length]);
        if(i%2) tree(ctx,px-10,py+49,.68,rand);
      }
    }
  }

  const roofs=[
    ['#72504d','#b37460','#995b52','#ecc5a2'], ['#735b59','#ae877c','#997769','#eed4ad'],
    ['#494b5c','#89758a','#6a617a','#ddbd9f'], ['#64514b','#a38975','#8e7062','#e8c6a7']
  ];

  function polygonRoof(ctx,x,y,w,h) {
    poly(ctx,[[x-w,y],[x-w*.65,y-h*.78],[x,y-h],[x+w*.64,y-h*.78],[x+w,y]],'#84a4a1');
    poly(ctx,[[x-w*.2,y],[x-w*.13,y-h*.77],[x,y-h],[x+w*.14,y-h*.77],[x+w*.2,y]],'#c4d0b3');
    rect(ctx,'#d3bd8b',x-w-3,y-1,2*w+6,5);
  }

  function paint(ctx,track,tools){
    const {plaza,tree,rand,house}=tools;
    const [x,y]=track.landmark;
    river(ctx,track,rand);
    const lots = {
      'villa-del-rio':[[690,686,4],[1290,1035,6],[899,1220,8]],
      montoro:[[1780,646,5],[1870,729,5],[1900,802,6],[668,1320,8]],
      bailen:[[790,1153,5],[1630,1235,7],[850,890,6],[1125,520,6]],
      porcuna:[[979,1068,9],[895,448,6],[1490,485,7],[1160,1390,8]],
      arjonilla:[[974,1030,10],[1100,1170,6],[1038,800,6],[1175,650,5]],
      jaen:[[964,1905,6],[1200,1836,10],[1575,1792,12],[1840,1965,13],[1050,1675,10],[2510,1010,7]],
      'puente-genil':[[720,760,5],[1400,1121,7],[1030,1250,8],[1780,1422,6]],
      marmolejo:[[825,740,5],[1160,1140,8],[1590,1090,6],[1740,1300,5]],
      adamuz:[[825,1504,7],[1140,1440,9],[1430,1370,7],[1075,720,4]],
      'el-carpio':[[760,1112,6],[985,1205,6],[1420,1248,5],[1480,1030,4]],
      villafranca:[[715,1320,7],[1350,1390,8],[1340,1230,7],[930,552,4]],
      cordoba:[[2260,1510,8],[2400,2000,11],[1460,1630,8],[1030,1735,11],[2240,763,6],[2690,589,7]]
    };
    if(track.region==='lopera'){
      castle(ctx,x,y,ivory,'CASTILLO DE LOPERA','lopera');
      return;
    }
    parcels(ctx,track,tools,lots[track.region] || [],track.region==='arjonilla' ? [roofs[2],roofs[1]] : roofs);
    if(track.region==='villa-del-rio'){
      bridge(ctx,x,y,honey,'PUENTE ROMANO · ARROYO SALADO');
      church(ctx,1220,1190,'VIRGEN DE LA ESTRELLA',ivory,.62);
      for(let i=0;i<6;i++) tree(ctx,1110+i*58,1068+Math.sin(i)*20,.62,rand);
    } else if(track.region==='montoro'){
      bridge(ctx,x,y,red,'PUENTE DE LAS DONADAS');
      church(ctx,1890,650,'CASCO HISTÓRICO',red,.78);
      for(let j=0;j<5;j++) ellipse(ctx,'#987e6840',2150,675+j*14,209+j*19,65+j*3);
    } else if(track.region==='bailen'){
      plaza(ctx,x-196,y-65,449,145);
      for(let i=0;i<5;i++){
        const ox=x-138+i*73;
        ellipse(ctx,'#6c473d',ox,y-4,29,25);
        ellipse(ctx,'#c67a4e',ox,y-12,26,21);
        for(let j=-14;j<18;j+=7) rect(ctx,'#995940',ox-19,y+j,38,1);
        rect(ctx,'#7a4840',ox+7,y-28,13,27);
        ellipse(ctx,'#5b413b',ox+13,y-30,7,4);
      }
      stone(ctx,848,938,223,81,honey);
      rect(ctx,'#6b5e52',829,930,246,18);
      sign(ctx,951,1041,'MUSEO DE LA BATALLA · 1808');
      sign(ctx,x,y+61,'HORNOS DE BAILÉN');
    } else if(track.region==='porcuna'){
      plaza(ctx,x-108,y-49,223,155);
      const hex=[[-49,-30],[-20,-60],[25,-58],[59,-30],[59,62],[29,94],[-19,94],[-49,61]];
      poly(ctx,hex.map(([a,b])=>[x+a+13,y+b+14]),'#4f504970');
      poly(ctx,hex.map(([a,b])=>[x+a,y+b]),honey[2]);
      stone(ctx,x-35,y-43,75,120,ivory);
      poly(ctx,hex.slice(0,4).map(([a,b])=>[x+a,y+b]),ivory[0]);
      for(let i=0;i<7;i++) rect(ctx,ivory[0],x-33+i*10,y-47,5,7);
      rect(ctx,'#504a45',x-3,y+23,8,19);
      for(let i=0;i<10;i++) tree(ctx,971+i*63,1258,.86,rand);
      sign(ctx,x,y+115,'TORRE DE BOABDIL');
    } else if(track.region==='arjonilla'){
      castle(ctx,x,y,honey,'CASTILLO DEL TROVADOR MACÍAS','square');
      for(let row=0;row<3;row++) for(let i=0;i<7;i++){
        ellipse(ctx,'#664c59',1051+i*28,1162+row*22,8,7);
        ellipse(ctx,i%2?'#c0887c':'#d6b17d',1051+i*28,1159+row*22,6,5);
      }
    } else if(track.region==='jaen'){
      church(ctx,x,y,'CATEDRAL DE JAÉN',ivory,1.3);
      for(let i=0;i<7;i++) ellipse(ctx,'#7c887250',2280,658+i*9,350+i*29,143+i*8);
      castle(ctx,2330,684,honey,'CASTILLO DE SANTA CATALINA','square');
      for(let row=0;row<4;row++) for(let i=0;i<8;i++) {
        const xx=790+i*88,yy=1780+row*95;
        if(Math.abs(track.project(xx,yy).offset)>155)tree(ctx,xx,yy,.8,rand);
      }
    } else if(track.region==='puente-genil'){
      const brick=['#e6b185','#b67b61','#74525a'];
      plaza(ctx,x-185,y-85,367,164);
      stone(ctx,x-141,y-75,281,115,brick);
      for(let i=0;i<6;i++){
        const wx=x-117+i*48;
        rect(ctx,'#4e525e',wx,y-37,20,50);
        ellipse(ctx,'#4e525e',wx+10,y-37,10,13);
        rect(ctx,'#c8b49c',wx+3,y-34,14,2);
      }
      for(let i=0;i<5;i++)poly(ctx,[[x-138+i*53,y-79],[x-111+i*53,y-115],[x-86+i*53,y-79]],'#a65b53');
      tower(ctx,x+103,y-121,35,130,brick);
      bridge(ctx,2020,1060,brick,'MIRAGENIL');
      sign(ctx,x,y+69,'FÁBRICA LA ALIANZA');
    } else if(track.region==='marmolejo') {
      plaza(ctx,x-186,y-72,375,174);
      stone(ctx,x-121,y-38,242,88,ivory);
      ellipse(ctx,'#5e8588',x,y-34,45,58);
      polygonRoof(ctx,x,y-41,42,49);
      for(const dx of [-91,-49,48,90]){
        rect(ctx,'#5a6e73',x+dx-8,y-11,16,29);
        ellipse(ctx,'#5a6e73',x+dx,y-12,8,9);
      }
      sign(ctx,x,y+69,'BALNEARIO DE MARMOLEJO');
      for(let j=0;j<7;j++){
        ellipse(ctx,'#597f68',x-151+j*49,y+94,18,12);
        for(let i=0;i<3;i++)ellipse(ctx,j%2?'#f4ad9e':'#e7d787',x-163+j*49+i*10,y+90,4,4);
      }
      bridge(ctx,1750,1081,ivory,'SAN BARTOLOMÉ');
    } else if(track.region==='adamuz') {
      plaza(ctx,x-143,y-71,304,136);
      tower(ctx,x-28,y-93,56,147,honey);
      ellipse(ctx,'#46434d',x,y-62,23,23);
      ellipse(ctx,'#ffdda0',x,y-62,20,20);
      rect(ctx,'#46434d',x-1,y-75,2,14);
      rect(ctx,'#46434d',x,y-63,11,2);
      sign(ctx,x,y+58,'TORRE DEL RELOJ');
      church(ctx,1335,1210,'SAN ANDRÉS',honey,.83);
      for(let r=0;r<4;r++)for(let i=0;i<8;i++){
        const ox=965+i*74,oy=1040+r*108;
        const near=track.project(ox,oy);
        if(Math.abs(near.offset)>near.road+60)tree(ctx,ox,oy,.65,rand);
      }
    } else if(track.region==='el-carpio') {
      castle(ctx,x,y,red,'TORRE DE GARCI MÉNDEZ','square');
      for(let i=0;i<12;i++){
        rect(ctx,'#5e5963',987+i*34,1040,31,23);
        rect(ctx,'#bcaa91',985+i*34,1034,35,9);
        poly(ctx,[[991+i*34,1062],[1004+i*34,1060],[1018+i*34,1085],[997+i*34,1083]],'#b7c6ae93');
      }
      sign(ctx,1195,1029,'AZUD DE EL CARPIO');
    } else if(track.region==='villafranca') {
      bridge(ctx,x,y,ivory,'PUENTE DE HIERRO');
      for(let i=0;i<7;i++){
        const zx=x-129+i*42;
        rect(ctx,'#344953',zx,y-49,5,46);
        poly(ctx,[[zx,y-49],[zx+4,y-49],[zx+44,y-6],[zx+39,y-6]],'#49666d');
      }
      rect(ctx,'#5f8588',x-139,y-49,276,8);
      rect(ctx,'#8fa8a0',x-138,y-50,274,2);
      tower(ctx,1115,1255,44,113,ivory);
      ellipse(ctx,'#ebcf98',1137,1284,12,12);
      rect(ctx,'#484351',1137,1276,2,10);
      sign(ctx,1150,1382,'TORRE DEL RELOJ');
      for(let i=0;i<7;i++){
        const xx=870+i*95,yy=667+(i%2)*49;
        const near=track.project(xx,yy);
        if(Math.abs(near.offset)>near.road+53)tree(ctx,xx,yy,1.1,rand);
      }
    } else if(track.region==='cordoba'){
      const mx=2810,my=1570;
      plaza(ctx,mx-194,my-124,390,268);
      stone(ctx,mx-172,my-104,337,199,ivory);
      rect(ctx,'#c39473',mx-155,my-90,176,163);
      for(let i=0;i<7;i++) {
        const ax=mx-151+i*43;
        rect(ctx,'#815f5c',ax,my-91,25,130);
        rect(ctx,'#deb08b',ax,my-91,21,126);
        for(let j=0;j<9;j++) rect(ctx,j%2?'#d18c77':'#efc7a0',ax+2,my-89+j*13,17,4);
      }
      tower(ctx,mx+111,my-129,39,97,honey);
      for(let i=0;i<7;i++)tree(ctx,mx-113+i*33,my+66,.55,rand);
      sign(ctx,mx,my+113,'MEZQUITA-CATEDRAL');
      bridge(ctx,3490,1654,ivory,'PUENTE ROMANO');
      castle(ctx,3550,1910,honey,'TORRE DE LA CALAHORRA','square');
      for(let d=0;d<4;d++){
        plaza(ctx,1750+d*98,1230-d%2*82,66,62);
        for(let i=0;i<4;i++){
          ellipse(ctx,'#668b6b',1760+d*98+i*15,1246-d%2*82,6,6);
          ellipse(ctx,'#e8969d',1762+d*98+i*15,1243-d%2*82,3,3);
        }
      }
    }
  }
  function rails(ctx,track) {
    const r=rivers[track.region];
    if(!r) return;
    for(let s=0;s<track.total;s+=8){
      const p=track.at(s);
      if(Math.abs(p.y-riverY(p.x,r))>r.width*.7)continue;
      for(const side of [-1,1]) {
        const edge=track.at(s,side*(track.roadAt(s)+5));
        rect(ctx,'#655d58',edge.x-4,edge.y-4,10,10);
        rect(ctx,'#e6c59b',edge.x-3,edge.y-3,8,5);
      }
    }
  }

  game.landmarks={paint,rails};
})();
