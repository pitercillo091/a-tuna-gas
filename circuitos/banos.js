globalThis.ATunaGas.trackSpecs.push({
  id: 'banos',
  town: 'Baños de la Encina',
  landmark: [1245,486],
  name: 'Cuesta de Burgalimar',
  description: 'Sube al castillo por las curvas del cerro y baja hacia la recta del molino.',
  feature: 'Subida y bajada · Recta del Molino',
  width: 2510, height: 1750, road: 96, laps: 3,
  palette: {ground: '#766746', flecks: ['#84724b','#6d633f','#90774c','#625d46'], road: '#575356',
    texture: ['#676064','#4c464a'], curbA: '#ead4a4', curbB: '#875d45', shoulder: '#bc9563', lane: '#bdb282',
    highlight: '#ffce7c'},
  anchors: [
    [995,1390],[1280,1390],[1795,1390],[2160,1340],[2215,1170],[2090,1050],[1840,1057],
    [1590,848],[1735,664],[2020,465],[1750,222],[1410,215],[1090,240],[790,340],
    [614,485],[850,688],[1030,890],[812,1114],[423,990],[305,1160],[491,1350],[752,1390]
  ],
  widths: [[0,100],[.135,119],[.17,110],[.205,99],[.26,95],[.38,77],[.57,76],[.645,64],[.79,74],[.86,86],[.89,94],[1,100]],
  elevations: [[0,1],[.19,0],[.29,23],[.36,34],[.43,59],[.55,93],[.61,94],
    [.67,74],[.76,42],[.88,13],[1,1]],
  obstacleSpecs: [[.103,58,'sack'],[.237,-44,'bale'],[.347,42,'sack'],[.479,-39,'bale'],
    [.598,40,'sack'],[.699,-43,'bale'],[.809,45,'bale'],[.91,-50,'sack']],
  boxRows: [.079,.174,.314,.505,.664,.898],
});
