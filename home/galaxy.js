// A model of the Milky Way's disc for the scales no star catalogue reaches. The spiral arms
// follow the log-periodic fits to maser parallaxes in Reid et al. 2019 (ApJ 885, 131, Table 2)
// where arms have been measured, and continue at a fixed pitch where they have not. Each point
// stands for a great many stars. Coordinates are light-years from the Sun: x toward the
// galactic centre, y toward galactic longitude 90°, z toward the north galactic pole.
const milkyWay = (() => {
  const rad=Math.PI/180,tau=2*Math.PI;
  // Reid et al. adopt 8.15 kpc from the Sun to the centre. The page uses 26,700 light-years.
  const sunToCentre=26700,kpc=sunToCentre/8.15;
  let seed=90377;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const normal=()=>Math.sqrt(-2*Math.log(1-random()))*Math.cos(tau*random());
  // Galactocentric radius [kpc] and azimuth [deg]: azimuth is 0 toward the Sun and grows in
  // the direction of rotation.
  const place=(R,azimuth,z=0)=>[sunToCentre-R*kpc*Math.cos(azimuth*rad),R*kpc*Math.sin(azimuth*rad),z*kpc];
  // ln(R/Rkink) = −(β − βkink) tan ψ, with one pitch angle on each side of the kink.
  const fitted=(kink,Rkink,below,above)=>azimuth=>Rkink*Math.exp(-(azimuth-kink)*rad*Math.tan((azimuth<kink?below:above)*rad));
  const norma=fitted(18,4.46,-1,19.5),scutum=fitted(23,4.91,14.1,12.1),sagittarius=fitted(24,6.04,17.1,1),local=fitted(9,8.26,11.4,11.4),perseus=fitted(40,8.87,10.3,8.7),outer=fitted(18,12.24,3,9.4);
  const edge=15.5,barEnd=3.5,pitch=Math.tan(12*rad);
  // Trace an arm outward (falling azimuth) through its pieces. Pieces with a fit are measured;
  // the rest continue from the last point at the stated pitch until they reach a radius.
  function trace(pieces){
    const path=[];let azimuth=null,R=null,turn=0;
    for(const piece of pieces){
      if(piece.fit){
        for(let a=piece.from;a>=piece.to;a-=.5)path.push([piece.fit(a),a+turn,true]);
        azimuth=piece.to+turn;R=piece.fit(piece.to);turn+=piece.wrap||0;
      }else{
        const slope=piece.pitch??pitch;
        for(let a=azimuth-.5;;a-=.5){const r=R*Math.exp((azimuth-a)*rad*slope);if(r>piece.until||(piece.downTo!==undefined&&a<piece.downTo))break;path.push([r,a,false])}
        const last=path[path.length-1];azimuth=last[1];R=last[0];
      }
    }
    return path;
  }
  // An arm's unmeasured inner part, traced inward from where its fit ends to the end of the bar.
  function inward(fit,from){
    const path=[],R=fit(from);
    for(let a=from+.5;;a+=.5){const r=R*Math.exp(-(a-from)*rad*pitch);if(r<barEnd)break;path.unshift([r,a,false])}
    return path;
  }
  // The Norma arm continues as the Outer arm one turn later. Between the two measured
  // stretches it takes the pitch that joins them, about 9.5°.
  const join=Math.log(outer(71)/norma(5))/((5-(71-360))*rad);
  const arms=[
    {name:'Norma arm',label:[norma(30),30],path:trace([{fit:norma,from:54,to:5},{pitch:join,until:99,downTo:71-360},{fit:a=>outer(a+360),from:71-360,to:-16-360},{pitch:Math.tan(10*rad),until:edge}])},
    {name:'Scutum–Centaurus arm',label:[scutum(48),48],path:trace([{fit:scutum,from:104,to:0},{until:edge}])},
    {name:'Sagittarius arm',label:[sagittarius(-12),-12],path:[...inward(sagittarius,97),...trace([{fit:sagittarius,from:97,to:2},{until:edge}])]},
    {name:'Perseus arm',label:[perseus(22),22],path:[...inward(perseus,115),...trace([{fit:perseus,from:115,to:-23},{until:edge}])]},
    {name:'Local arm',label:[local(-7),-7],spur:true,path:trace([{fit:local,from:34,to:-8}])}
  ];
  const points=[];
  // kind: 0 arm, 1 bright knot in an arm, 2 disc between the arms, 3 bar and bulge.
  const add=(v,kind,size)=>points.push([v[0],v[1],v[2],kind,size]);
  for(const arm of arms){
    // Arms widen with radius: 336 pc at the Sun's radius, 36 pc more per kiloparsec.
    for(let i=1;i<arm.path.length;i++){
      const [R,azimuth]=arm.path[i],length=R*.5*rad,taper=Math.min(1,(R-barEnd+.6)/1.2,(edge-R)/2.5)*(arm.spur?.55:1);
      let n=length*taper*104;n=Math.floor(n)+(random()<n%1?1:0);
      for(let k=0;k<n;k++){
        // Most points keep to the measured width of the arm. A fifth spread wider, as older stars do.
        const wide=random()<.2?2.6:1,width=Math.max(.15,.336+.036*(R-8.15))*wide,knot=wide===1&&random()<.014;
        add(place(R+normal()*width,azimuth+random()*.5,normal()*(knot?.04:.09)),knot?1:0,knot?1.2+.8*random():.72+1.05*random()**3);
      }
    }
  }
  // An exponential disc, scale length 2.6 kpc, about 300 pc thick.
  for(let i=0;i<6500;i++){
    const R=-2.6*Math.log((1-random())*(1-random()));
    if(R<2.2||R>edge+.5){i--;continue}
    add(place(R,360*random(),normal()*.3),2,.6+.6*random()**3);
  }
  // The long bar: half-length about 5 kpc, its near end 28° ahead of the line to the Sun.
  const barAngle=28*rad,along=[-Math.cos(barAngle),Math.sin(barAngle)],across=[Math.sin(barAngle),Math.cos(barAngle)];
  for(let i=0;i<6500;i++){
    const round=i%5<2,s=normal()*(round?.9:2.3),t=normal()*(round?.9:.62);
    add([sunToCentre+(s*along[0]+t*across[0])*kpc,(s*along[1]+t*across[1])*kpc,normal()*(round?.6:.4)*kpc],3,.65+1.1*random()**3);
  }
  // Leave the neighbourhood of the Sun to the catalogued stars.
  const kept=points.filter(([x,y,z])=>{const d=Math.hypot(x,y,z);return d>6500||random()<(d-2500)/4000}).sort((a,b)=>a[3]-b[3]);
  const count=kept.length,X=new Float32Array(count),Y=new Float32Array(count),Z=new Float32Array(count),size=new Float32Array(count),kind=new Uint8Array(count);
  kept.forEach(([x,y,z,k,s],i)=>{X[i]=x;Y[i]=y;Z[i]=z;kind[i]=k;size[i]=s});
  // Each arm's centre line, cut into short runs, for the light along it.
  const lanes=arms.flatMap(arm=>{
    const runs=[];
    for(let i=0;i+1<arm.path.length;i+=24){
      const run=arm.path.slice(i,i+25),R=run[Math.floor(run.length/2)][0];
      runs.push({at:run.map(([r,a])=>place(r,a)),strength:Math.min(1,(R-barEnd+.4)/1.4,(edge-R)/3.5)*(arm.spur?.6:1),width:Math.max(.15,.336+.036*(R-8.15))*kpc});
    }
    return runs;
  });
  return {count,X,Y,Z,size,kind,sunToCentre,kpc,lanes,labels:arms.map(arm=>({name:arm.name,at:place(...arm.label)}))};
})();
