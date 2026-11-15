globalThis.ATunaGas.trackSpecs.push({
  id: 'arjona',
  town: 'Arjona',
  landmark: [1110,805],
  name: 'Serenata de Arjona',
  description: 'Adoquines, esquinas cerradas y un paso estrecho junto a las murallas de Santa María.',
  feature: 'Atajo por el Arco · Callejones estrechos',
  width: 2440, height: 1670, road: 99, laps: 3,
  palette: {ground: '#474d69', flecks: ['#505673','#565670','#414960','#5d5b76'], road: '#4f5062',
    texture: ['#626479','#414456'], curbA: '#dcb895', curbB: '#986180', shoulder: '#aa8790', lane: '#cda8a0',
    highlight: '#ffb4ce'},
  anchors: [
    [1040,1360],[1580,1360],[1940,1320],[2050,1140],[1910,970],[1510,1018],[1360,851],[1500,634],
    [1820,630],[1960,435],[1840,276],[1540,250],[1190,280],[1020,430],[880,470],[540,445],
    [350,535],[329,765],[430,912],[644,944],[730,1060],[694,1190],[772,1325]
  ],
  widths: [[.00,108],[.11,109],[.17,78],[.25,69],[.30,73],[.42,83],[.49,106],[.57,102],
    [.64,73],[.73,69],[.83,75],[.94,100],[1,108]],
  shortcut: {start: .269, end: .396, width: 38, label: 'Paso del Arco'},
  obstacleSpecs: [[.112,50,'flower'],[.19,-38,'flower'],[.278,-42,'stand'],[.509,-58,'flower'],
    [.62,38,'stand'],[.732,-40,'flower'],[.884,38,'stand'],[.334,21,'flower',true]],
  boxRows: [.071,.24,.487,.665,.835],
});
