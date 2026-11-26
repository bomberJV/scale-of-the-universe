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
    // The Local arm, the one the Sun is in. It is as full as the others (Xu et al. 2013, ApJ 769,
    // 15: its star formation, length and pitch are those of an arm, not of a spur), and it is not
    // a loose piece. Brandon, 2026-11-26: "Do you not notice how the arm the sun sits in connects
    // to nothing on either end????" Three things are measured about where it goes:
    //   - From 34° to the Sun it follows the maser fit, as before.
    //   - Past the Sun it opens out. Gaia's hot stars trace it at least 4 kpc on into the third
    //     quadrant (Poggio et al. 2021, A&A 651, A104: about R = 10 kpc at −20°), and young
    //     giants about 2 kpc farther, to R = 11.3 kpc at −35° (arXiv:2605.12603). That is where
    //     this model draws the Perseus arm: Reid et al. give those masers to Perseus. So the arm
    //     runs into the Perseus arm's line there. Whether that stretch is Perseus or the Local arm
    //     is a matter of naming that the papers dispute; that the stars are continuous is not.
    //   - A spur leaves it at Cygnus X and bridges to the Sagittarius arm (below).
    // Beyond 34° nothing has been measured, so that end thins out and stops.
    {name:'Local arm'}
  ];
  arms[4].path=outward();arms[4].label=arms[4].path.find(point=>point[1]===-7).slice(0,2);
  // The Local arm's centre line: the maser fit down to 6°, then a pitch that grows to 24° by −6°
  // and holds until the line meets the Perseus arm's, at about −34°.
  function outward(){
    const path=[],other=arms[3].path;
    for(let a=34,R=local(34);;a-=.5){
      if(a>=6)R=local(a);
      path.push([R,a,true]);
      const there=other.find(point=>point[1]===a);
      if(there&&R>=there[0])break;
      const t=Math.min(1,Math.max(0,(6-(a-.5))/12));
      R*=Math.exp(.5*rad*Math.tan((11.4+12.6*t*t*(3-2*t))*rad));
    }
    return path;
  }
  // The Local arm thins out over its last 8° at the end no one has measured past, and over its
  // last 6° where it runs into the Perseus arm, so the two are not counted twice there.
  const ends=(arm,i)=>arm.name==='Local arm'?Math.min(1,(i+.5)/16,.25+(arm.path.length-.5-i)/16):1;
  // The spur between the Local and Sagittarius arms (Xu et al. 2016, Sci. Adv. 2, e1600878):
  // five masers with measured distances lie along it, and a lane of CO runs the same way from
  // Cygnus X to the Sagittarius arm near longitude 50°. Longitude [deg] and distance [kpc] from
  // that paper's tables; Reid et al. 2019 list the same five as the Local arm's spur.
  const spurMasers=[[59.48,1.87],[59.78,2.16],[58.77,3.34],[59.83,3.95],[54.11,4.33]].map(([l,d])=>[d*Math.sin(l*rad),8.15-d*Math.cos(l*rad)]);
  // Its line, as [kpc toward longitude 90°, kpc from the centre along the line to the Sun]: from
  // the Local arm's centre line at Cygnus X, through the masers, to the Sagittarius arm's.
  const spur=(()=>{
    const from=(R,a)=>[R*Math.sin(a*rad),R*Math.cos(a*rad)],mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const through=[from(local(9.5),9.5),mid(spurMasers[0],spurMasers[1]),spurMasers[2],mid(spurMasers[3],spurMasers[4]),from(sagittarius(37.5),37.5)];
    // A Catmull-Rom curve through those points, then points 70 pc apart along it.
    const fine=[];
    for(let i=0;i+1<through.length;i++){
      const [p0,p1,p2,p3]=[through[Math.max(0,i-1)],through[i],through[i+1],through[Math.min(through.length-1,i+2)]];
      for(let k=0;k<40;k++){const t=k/40;fine.push([0,1].map(c=>.5*(2*p1[c]+(p2[c]-p0[c])*t+(2*p0[c]-5*p1[c]+4*p2[c]-p3[c])*t*t+(3*p1[c]-p0[c]-3*p2[c]+p3[c])*t**3)))}
    }
    fine.push(through[through.length-1]);
    const line=[fine[0]];let need=.07;
    for(let i=1;i<fine.length;i++){
      let a=fine[i-1],left=Math.hypot(fine[i][0]-a[0],fine[i][1]-a[1]);
      while(left>=need){const f=need/left;a=[a[0]+(fine[i][0]-a[0])*f,a[1]+(fine[i][1]-a[1])*f];line.push(a);left-=need;need=.07}
      need-=left;
    }
    return line;
  })();
  const laid=([across,along],z=0)=>[sunToCentre-along*kpc,across*kpc,z*kpc];
  const points=[];
  // kind: 0 arm, 1 bright knot in an arm, 2 disc between the arms, 3 bar and bulge.
  const add=(v,kind,size)=>points.push([v[0],v[1],v[2],kind,size]);
  for(const arm of arms){
    // Arms widen with radius: 336 pc at the Sun's radius, 36 pc more per kiloparsec.
    for(let i=1;i<arm.path.length;i++){
      const [R,azimuth]=arm.path[i],length=R*.5*rad,taper=Math.min(1,(R-barEnd+.6)/1.2,(edge-R)/2.5)*ends(arm,i);
      let n=length*taper*104;n=Math.floor(n)+(random()<n%1?1:0);
      for(let k=0;k<n;k++){
        // Most points keep to the measured width of the arm. A fifth spread wider, as older stars do.
        const wide=random()<.2?2.6:1,width=Math.max(.15,.336+.036*(R-8.15))*wide,knot=wide===1&&random()<.014;
        add(place(R+normal()*width,azimuth+random()*.5,normal()*(knot?.04:.09)),knot?1:0,knot?1.2+.8*random():.72+1.05*random()**3);
      }
    }
  }
  // The spur's dots: three fifths as many per length as an arm's and 200 pc wide. Neither figure
  // is measured. It is a lesser feature than the arms it joins: five masers in 2.6 kpc.
  for(let i=1;i<spur.length;i++){
    const a=spur[i-1],b=spur[i],step=Math.hypot(b[0]-a[0],b[1]-a[1]),along=[(b[0]-a[0])/step,(b[1]-a[1])/step];
    let n=step*.6*104;n=Math.floor(n)+(random()<n%1?1:0);
    for(let k=0;k<n;k++){
      const wide=random()<.2?2.6:1,knot=wide===1&&random()<.014,u=random()*step,v=normal()*.2*wide;
      add(laid([a[0]+along[0]*u-along[1]*v,a[1]+along[1]*u+along[0]*v],normal()*(knot?.04:.09)),knot?1:0,knot?1.2+.8*random():.72+1.05*random()**3);
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
  // Close in, the neighborhood of the Sun is left to the cataloged stars: no model point within
  // 2,500 light-years of it, and fewer than the model has out to 6,500. That gap must close as
  // the frame widens, or the Sun sits in a hole in its own arm with a clump of cataloged stars
  // in the middle of it (Brandon, 2026-11-25: "the part of the galaxy we zoom out of seems like
  // a random block just inserted into the galaxy, not part of a spiral"). So no point is thrown
  // away: each carries `near`, the size of the gap (1 close in, 0 from far out) at which it
  // comes into the picture. Points that were always drawn have 1 or more.
  for(const point of points){const d=Math.hypot(point[0],point[1],point[2]);point.push(d>6500?2:Math.min(2,d/(2500+4000*random())))}
  const kept=points.sort((a,b)=>a[3]-b[3]);
  const count=kept.length,X=new Float32Array(count),Y=new Float32Array(count),Z=new Float32Array(count),size=new Float32Array(count),kind=new Uint8Array(count),near=new Float32Array(count);
  kept.forEach(([x,y,z,k,s,n],i)=>{X[i]=x;Y[i]=y;Z[i]=z;kind[i]=k;size[i]=s;near[i]=n});
  // Each arm's centre line, cut into short runs, for the light along it.
  const lanes=arms.flatMap(arm=>{
    // The Local arm's light is one run with rounded ends. It starts 4° in from the unmeasured
    // end, so that its core ends where the dots do (cut square it would end in a hard edge
    // across the disc), and stops 5° short of the Perseus arm's line, whose light it runs into.
    if(arm.name==='Local arm'){const run=arm.path.slice(8,-10),R=run[Math.floor(run.length/2)][0];return [{of:arm.name,at:run.map(([r,a])=>place(r,a)),strength:Math.min(1,(R-barEnd+.4)/1.4,(edge-R)/3.5),width:Math.max(.15,.336+.036*(R-8.15))*kpc,round:true}]}
    const runs=[];
    for(let i=0;i+1<arm.path.length;i+=24){
      const run=arm.path.slice(i,i+25),R=run[Math.floor(run.length/2)][0];
      runs.push({of:arm.name,at:run.map(([r,a])=>place(r,a)),strength:Math.min(1,(R-barEnd+.4)/1.4,(edge-R)/3.5),width:Math.max(.15,.336+.036*(R-8.15))*kpc});
    }
    return runs;
  });
  // The spur's light, fainter and narrower than an arm's. Both its ends lie inside an arm's.
  lanes.push({of:'Local spur',at:spur.map(point=>laid(point)),strength:.6,width:.2*kpc});
  return {count,X,Y,Z,size,kind,near,sunToCentre,kpc,lanes,labels:arms.map(arm=>({name:arm.name,at:place(...arm.label)})),spur:{masers:spurMasers.map(point=>laid(point)),line:spur.map(point=>laid(point))}};
})();
