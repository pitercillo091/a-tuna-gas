(() => {
  const game = globalThis.ATunaGas;
  const {rect, ellipse, poly} = game.drawing;

  function brick(ctx, x, y, w, h, face, mortar) {
    rect(ctx, face, x, y, w, h);
    for (let row = 5; row < h; row += 9) {
      rect(ctx, mortar, x, y + row, w, 1);
      for (let col = row % 2 === 1 ? 7 : 14; col < w; col += 16) {
        rect(ctx, mortar, x + col, Math.max(y, y + row - 8), 1, Math.min(row, 8));
      }
    }
  }

  function tower(ctx, x, y, w, h, stone, lit, dark, keep) {
    poly(ctx, [[x,y],[x+w+17,y+11],[x+w+33,y+h+33],[x+12,y+h+31]], '#20263565');
    brick(ctx, x, y, w, h, stone, dark);
    rect(ctx, dark, x + w - 6, y, 6, h);
    rect(ctx, lit, x - 3, y - 4, w + 7, 8);
    for (let n = x - 2; n < x + w; n += 12) {
      rect(ctx, dark, n + 2, y - 13, 9, 11);
      rect(ctx, lit, n, y - 14, 9, 8);
    }
    if (keep) {
      rect(ctx, dark, x + w * .45, y + 16, 6, 16);
      rect(ctx, lit, x + w * .45 + 1, y + 30, 8, 2);
    }
  }

  function arjona(ctx, {plaza, house, tree, tent, bunting, rand}) {
    const roof = ['#674654','#a55b70','#83485b','#e3b396'];
    const ivory = ['#5d4f62','#93788a','#79657c','#f2d5b0'];
    plaza(ctx, 718, 1104, 1080, 112);
    plaza(ctx, 847, 573, 413, 550);
    plaza(ctx, 1300, 380, 385, 145);
    for (const [x,y,w,h] of [[765,1119,111,68],[905,1122,98,66],[1055,1118,108,72],[1184,1123,105,65],
      [1460,1118,105,72],[1620,1128,104,59],[883,599,91,63],[987,587,111,72],[1115,608,112,63],
      [876,802,90,70],[874,919,99,58],[1035,963,139,62],[1376,400,111,73],[1499,402,81,58]]) {
      house(ctx,x,y,w,h, x % 3 ? ivory : roof);
    }
    ellipse(ctx, '#282d4580', 1098, 806, 133, 85);
    tower(ctx, 1040, 712, 180, 105, '#9b7d83', '#d5a99c', '#785c75', false);
    brick(ctx, 1015, 726, 141, 90, '#c59991', '#aa7c84');
    poly(ctx, [[1009,728],[1081,691],[1162,728],[1156,760],[1014,760]], '#61445c');
    poly(ctx, [[1012,728],[1081,695],[1158,728],[1081,747]], '#b96c7a');
    tower(ctx, 1009, 678, 43, 114, '#bc9b96', '#edd2ac', '#8b677e', false);
    rect(ctx, '#6e4d64', 1020, 701, 19, 26);
    ellipse(ctx, '#e0b280', 1029, 707, 6, 8);
    rect(ctx, '#6e4d64', 1027, 679, 4, 14);
    rect(ctx, '#f4cf90', 1023, 681, 11, 2);
    rect(ctx, '#624862', 1072, 784, 20, 30);
    ellipse(ctx, '#624862', 1082, 786, 10, 10);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0cfac';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('SANTA MARÍA', 1099, 845);
    for (const [x,y] of [[1327,1137],[1382,1133],[1185,884],[873,1055],[813,1152]]) {
      tent(ctx,x,y,'#99546e');
      tree(ctx,x + 37,y + 16,.8,rand);
    }
    bunting(ctx,[914,1221],[1040,1216]);
    bunting(ctx,[1062,1211],[1219,1213]);
    bunting(ctx,[1250,1218],[1395,1214]);
    for (const [x,y] of [[1449,1484],[1577,1489],[1092,1495],[823,1489]]) {
      house(ctx,x,y,121,73,roof);
    }
  }

  function banos(ctx, {plaza, house, tree, tent, bunting, rand}) {
    const roof = ['#75492e','#b98a5b','#935f49','#edcf9b'];
    const chalk = ['#624c44','#a67a60','#87624d','#e5d2ab'];
    for (let i = 0; i < 8; i++) {
      ellipse(ctx, ['#705b45','#8a713f','#927c4e','#a38a58'][Math.min(3, i >> 1)],
        1290, 600 - 7 * i, 540 - 35 * i, 286 - 21 * i);
    }
    const wall = '#a77751';
    const lit = '#e0b779';
    const dark = '#805a44';
    poly(ctx, [[1043,475],[1382,453],[1514,504],[1519,644],[1412,725],[1073,686],[1017,628]], '#594939a3');
    poly(ctx, [[1030,468],[1372,443],[1499,496],[1504,629],[1395,697],[1068,663],[1004,610]], dark);
    poly(ctx, [[1039,455],[1368,430],[1488,485],[1488,610],[1390,678],[1069,644],[1017,595]], wall);
    poly(ctx, [[1067,475],[1368,450],[1460,500],[1457,600],[1379,654],[1080,623],[1045,590]], '#ccab70');
    ellipse(ctx,'#a08157',1270,563,125,51);
    for (const [x, y, w, h] of [[1017,480,47,91],[1087,458,41,71],[1176,448,44,72],[1271,436,48,76],
      [1360,440,49,84],[1451,473,55,90],[1461,568,47,76],[1385,621,54,75],[1262,619,44,67],
      [1153,608,46,67],[1055,583,45,71]]) {
      tower(ctx,x,y,w,h,wall,lit,dark,true);
    }
    tower(ctx, 1332, 517, 64, 112, '#b6875c', '#f3cf91', dark, true);
    brick(ctx, 1173, 543, 49, 36, '#aa855c', '#89684d');
    ctx.fillStyle = '#fbdaa1';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BURGALIMAR', 1260, 716);
    plaza(ctx, 820, 1156, 768, 110);
    for (const [x,y,w,h] of [[840,1171,104,65],[960,1177,86,58],[1080,1172,105,60],[1220,1177,98,59],
      [1340,1172,93,67],[1468,1167,95,63],[1720,1514,109,79],[1870,1516,109,77],[2100,1511,105,71]]) {
      house(ctx,x,y,w,h,x % 3 ? roof : chalk);
    }
    for (const [x,y] of [[1054,1245],[1337,1230],[1485,1253]]) {
      tree(ctx,x,y,1.05,rand);
      tent(ctx,x + 32,y - 16,'#9a6242');
    }
    bunting(ctx,[899,1278],[1039,1274]);
    bunting(ctx,[1087,1275],[1225,1279]);

    const x=1680, y=1233;
    ellipse(ctx,'#59443475',x + 13,y+20,72,41);
    ellipse(ctx,'#b48d5b',x,y+17,49,37);
    rect(ctx,'#d8b27b',x-36,y-28,72,57);
    for (let i=0;i<6;i++) rect(ctx,'#b38a5c',x-34,y-24+i*9,68,2);
    poly(ctx,[[x-39,y-27],[x,y-64],[x+39,y-27],[x,y-14]],'#795b4b');
    poly(ctx,[[x-38,y-28],[x,y-63],[x+12,y-29],[x,y-20]],'#ac7554');
    rect(ctx,'#634f43',x-10,y+8,20,23);
    ctx.save();
    ctx.translate(x,y-24);
    ctx.rotate(.38);
    for (let i=0;i<4;i++) {
      ctx.rotate(Math.PI/2);
      rect(ctx,'#675445',-2,-52,4,52);
      rect(ctx,'#efd6a2',2,-55,12,31);
      for (let n=-51;n<-24;n+=6) rect(ctx,'#a2815e',2,n,12,2);
    }
    ellipse(ctx,'#a46e46',0,0,7,7);
    ctx.restore();
  }

  function gates(ctx, track) {
    if (track.region !== 'arjona') return;
    const s = track.branchStart + (track.branchEnd - track.branchStart) * .52;
    const p = track.atBranch(s);
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(p.angle);
    for (const y of [-55, 55]) {
      rect(ctx,'#342f49',-18,y-15,35,30);
      rect(ctx,'#bc9789',-20,y-16,35,25);
      rect(ctx,'#f0c8ac',-24,y-15,35,8);
      rect(ctx,'#ffc17a',-4,y-19,7,7);
    }
    for (const x of [-110, -54, 47]) {
      poly(ctx, [[x-6,-12],[x,-12],[x+9,0],[x,12],[x-6,12],[x+3,0]], '#ffe0a7');
    }
    ctx.restore();
  }

  game.scenes = {arjona, banos, gates};
})();
