(() => {
  const game=globalThis.ATunaGas;
  const backward=angle=>Math.atan2(-Math.sin(angle),-Math.cos(angle));

  function inverse(base){
    const {total,wrap}=base;
    const fraction=original=>1-original;
    const relocate=(position,index,amount)=>Math.max(.052,Math.min(.958,position+(index%2?1:-1)*amount));
    const samples=base.samples.map((_,i)=>{
      const j=(base.samples.length-i)%base.samples.length;
      const p=base.samples[j];
      const edge=base.samples[(j-1+base.samples.length)%base.samples.length];
      return {x:p.x,y:p.y,s:wrap(-p.s),len:edge.len,angle:backward(edge.angle),dx:-edge.dx,dy:-edge.dy};
    });
    const shortcut=base.shortcut&&{...base.shortcut,start:fraction(base.shortcut.end),end:fraction(base.shortcut.start)};
    const reversePose=pose=>({...pose,angle:backward(pose.angle)});
    return {...base,id:base.id+'-2',name:base.town+' 2',direction:2,
      description:base.description+' Salida en sentido inverso.',
      feature:'Sentido inverso · '+base.feature,
      samples,shortcut,branch:[...base.branch].reverse(),
      branchStart:shortcut?total-base.branchEnd:0,branchEnd:shortcut?total-base.branchStart:0,
      crossings:base.crossings?.map(fraction),
      sectors:base.sectors?.map(([progress,label])=>[fraction(progress),label]).reverse(),
      boxRows:base.boxRows.map((progress,index)=>relocate(fraction(progress),index,.027)).sort((a,b)=>a-b),
      obstacleSpecs:base.obstacleSpecs.map(([progress,lane,kind,branch],index)=>{
        const position=fraction(progress);
        const next=branch?Math.max(shortcut.start+.01,Math.min(shortcut.end-.01,position-.016))
          :relocate(position,index,.021);
        const width=branch?shortcut.width:base.roadAt(-next*total);
        return [next,(index%2?1:-1)*Math.min(width*.67,Math.abs(lane)),kind,branch];
      }),
      at:(distance,lane=0)=>reversePose(base.at(-distance,-lane)),
      atBranch:(distance,lane=0)=>reversePose(base.atBranch(total-distance,-lane)),
      roadAt:distance=>base.roadAt(-distance),
      elevation:distance=>base.elevation(-distance),
      slope:distance=>-base.slope(-distance),
      project(x,y,near,onBranch){
        const pose=base.project(x,y,near===undefined?undefined:wrap(-near),onBranch);
        return {...reversePose(pose),s:wrap(-pose.s),offset:-pose.offset};
      }
    };
  }
  game.tracks=game.trackSpecs.flatMap(spec=>{
    const base=game.createTrack({...spec,region:spec.id,routeTitle:spec.name,name:spec.town+' 1',direction:1});
    return [base,inverse(base)];
  });
})();
