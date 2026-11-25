// The camera pulls back from the Earth to the Milky Way on one continuous logarithmic
// scale, and nothing drawn on the way is dropped before the end. Positions and distances
// are real unless a comment says otherwise. Vectors are
// galactic: x toward the galactic centre, y toward longitude 90°, z toward the north pole.
const cosmicZoom = (() => {
  const tau=2*Math.PI,rad=Math.PI/180,kmPerAu=149597870.7,auPerLightYear=63241.077;
  const earthRadius=6378.137/kmPerAu,moonDistance=384400/kmPerAu,sunRadius=695700/kmPerAu;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  // J2000 equatorial to galactic (Hipparcos and Tycho Catalogues, vol. 1, eq. 1.5.11).
  const toGalactic=[[-.0548755604,-.8734370902,-.4838350155],[.4941094279,-.4448296300,.7469822445],[-.8676661490,-.1980763734,.4559837762]];
  const cosTilt=Math.cos(23.4392911*rad),sinTilt=Math.sin(23.4392911*rad);
  const fromEquatorial=v=>toGalactic.map(row=>dot(row,v));
  const fromEcliptic=([x,y,z])=>fromEquatorial([x,y*cosTilt-z*sinTilt,y*sinTilt+z*cosTilt]);
  const pointing=(longitude,latitude,r=1)=>[r*Math.cos(latitude*rad)*Math.cos(longitude*rad),r*Math.cos(latitude*rad)*Math.sin(longitude*rad),r*Math.sin(latitude*rad)];
  const days=Date.now()/86400000+2440587.5-2451545,centuries=days/36525,year=2000+days/365.25;

  // Keplerian orbit: a [au], e, inclination, node and argument of perihelion [deg], mean
  // anomaly today [deg]. Returns today's position and the whole ellipse.
  function orbit(a,e,inclination,node,argument,anomaly){
    const I=inclination*rad,O=node*rad,cosI=Math.cos(I),sinI=Math.sin(I),cosO=Math.cos(O),sinO=Math.sin(O);
    const place=E=>{
      const u=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2))+argument*rad,r=a*(1-e*Math.cos(E));
      return fromEcliptic([r*(cosO*Math.cos(u)-sinO*Math.sin(u)*cosI),r*(sinO*Math.cos(u)+cosO*Math.sin(u)*cosI),r*Math.sin(u)*sinI]);
    };
    const mean=(anomaly*rad)%tau;let E=mean;
    for(let i=0;i<12;i++)E-=(E-e*Math.sin(E)-mean)/(1-e*Math.cos(E));
    return {at:place(E),path:Array.from({length:144},(_,i)=>place(i*tau/144)),reach:a*(1+e)};
  }
  // JPL "Approximate Positions of the Planets", Table 1 (1800–2050 AD): a [au], e, I [deg],
  // mean longitude [deg] and its rate [deg/century], longitude of perihelion and of the node [deg].
  const planets=[
    ['Mercury',.38709927,.20563593,7.00497902,252.25032350,149472.67411175,77.45779628,48.33076593,'#c9c2b4',1.5],
    ['Venus',.72333566,.00677672,3.39467605,181.97909950,58517.81538729,131.60246718,76.67984255,'#ecd9a0',2],
    ['Earth',1.00000261,.01671123,-.00001531,100.46457166,35999.37244981,102.93768193,0,'#9fd28c',2.1],
    ['Mars',1.52371034,.09339410,1.84969142,-4.55343205,19140.30268499,-23.94362959,49.55953891,'#e08a5c',1.8],
    ['Jupiter',5.20288700,.04838624,1.30439695,34.39644051,3034.74612775,14.72847983,100.47390909,'#e3c6a0',3.3],
    ['Saturn',9.53667594,.05386179,2.48599187,49.95424423,1222.49362201,92.59887831,113.66242448,'#e6d7a3',3],
    ['Uranus',19.18916464,.04725744,.77263783,313.23810451,428.48202785,170.95427630,74.01692503,'#a9dfe0',2.5],
    ['Neptune',30.06992276,.00859048,1.77004347,-55.12002969,218.45945325,44.96476227,131.78422574,'#8fa9ee',2.5],
    ['Pluto',39.48211675,.24882730,17.14001206,238.92903833,145.20780515,224.06891629,110.30393684,'#d8c4ae',1.6]
  ].map(([name,a,e,I,L,rate,peri,node,ink,size])=>({name,ink,size,...orbit(a,e,I,node,peri-node,L+rate*centuries-peri)}));
  const earth=planets[2],pluto=planets[8];
  // Sedna: barycentric elements, epoch 2020, perihelion July 2076, period about 11,390 years.
  const sedna={name:'Sedna',ink:'#e2a48c',size:1.6,...orbit(506,.8496,11.9307,144.248,311.352,(year-2076.545)/11390*360)};
  // Low-precision lunar longitude and distance (Astronomical Almanac).
  const moonAnomaly=(134.963+13.064993*days)*rad,moonLongitude=218.316+13.176396*days+6.289*Math.sin(moonAnomaly);
  const moon=fromEcliptic(pointing(moonLongitude,0,(385001-20905*Math.cos(moonAnomaly))/kmPerAu));
  const moonPath=Array.from({length:96},(_,i)=>fromEcliptic(pointing(i*360/96,0,moonDistance)));
  // Heliocentric distance on 18 November 2026 and speed [au, au/yr]; direction of travel as
  // right ascension and declination [deg].
  const probes=[['Voyager 1',172.4,3.569,259.5,12.23],['Voyager 2',144.4,3.219,302.5,-59.43]].map(([name,r,speed,ra,dec])=>{
    const distance=r+speed*(year-2026.88);
    return {name:name+' · '+Math.round(distance)+' AU',at:fromEquatorial(pointing(ra,dec,distance)),distance};
  });

  // The three known interstellar objects, each on its hyperbola past the Sun and now on its way
  // out: perihelion distance [au], eccentricity, inclination, node and argument of perihelion
  // [deg, ecliptic J2000], and time of perihelion [JD, TDB]. Heliocentric two-body motion from
  // these elements; the small non-gravitational accelerations and the planets' pulls after the
  // epoch are left out (well under 1 au today).
  //   1I/ʻOumuamua and 2I/Borisov: JPL SBDB solutions as tabulated by de la Fuente Marcos &
  //     de la Fuente Marcos (2020, A&A 643, A18, tables 1 and 3).
  //   3I/ATLAS: the osculating elements at 27 October 2026, after its pass of Jupiter in March
  //     2026 (Wikipedia's infobox from JPL SBDB, read 2026-11-21); perihelion 29 October 2025
  //     11:45 UT.
  // Checked on 2026-11-21: 55.5, 49.6 and 13.5 au from the Sun, toward Pegasus, Telescopium and
  // Gemini; 3I at 4.51 au on its discovery date and 68.3 km/s at perihelion, as published.
  const gauss=.01720209895;   // the Gaussian gravitational constant [au^1.5 a day]
  const visitors=[['1I/ʻOumuamua',.255912,1.20113,122.7417,24.5969,241.8105,2458006.0073],
    ['2I/Borisov',2.006624,3.356191,44.052626,308.14892,209.12461,2458826.04489],
    ['3I/ATLAS',1.3564,6.12347,175.24,323.03,128.80,2460977.9896]].map(([name,q,e,inclination,node,argument,perihelion])=>{
    const a=q/(e-1),I=inclination*rad,O=node*rad,cosI=Math.cos(I),sinI=Math.sin(I),cosO=Math.cos(O),sinO=Math.sin(O);
    // H is the hyperbolic anomaly: 0 at perihelion, negative on the way in.
    const place=H=>{
      const u=2*Math.atan(Math.sqrt((e+1)/(e-1))*Math.tanh(H/2))+argument*rad,r=a*(e*Math.cosh(H)-1);
      return fromEcliptic([r*(cosO*Math.cos(u)-sinO*Math.sin(u)*cosI),r*(sinO*Math.cos(u)+cosO*Math.sin(u)*cosI),r*Math.sin(u)*sinI]);
    };
    const mean=gauss/a**1.5*(days+2451545-perihelion);
    let H=Math.sign(mean)*Math.log(2*Math.abs(mean)/e+1.8);
    for(let i=0;i<40;i++)H-=(e*Math.sinh(H)-H-mean)/(e*Math.cosh(H)-1);
    const distance=a*(e*Math.cosh(H)-1);
    // Its path: in from three times as far as it now is, round the Sun, and out to where it is.
    const far=Math.acosh((3*Math.max(distance,q)/a+1)/e),steps=120;
    return {name:name+' · '+Math.round(distance)+' AU',distance,at:place(H),
      path:Array.from({length:steps+1},(_,i)=>place(-far+(H+far)*(i/steps)**.6)),
      // The share of the path, by points, that is the way in.
      inbound:Math.round(steps*(far/(H+far))**(1/.6))};
  });

  // Labels fade in and out over about a quarter of a second, whatever the scrolling does.
  const tags=new Map();let frame=0,lastTime=0,wake=()=>{};
  let seed=4127;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const normal=()=>Math.sqrt(-2*Math.log(1-random()))*Math.cos(tau*random());
  // The belt and the cloud are populations, not individual observed bodies. The points are
  // scattered over the regions the populations occupy.
  const belt=Array.from({length:460},()=>{
    const a=random()<.24?39.4+.5*normal():42+6*random(),inclination=Math.abs(normal())*5.5;
    return orbit(a,.04+.08*random(),inclination,360*random(),360*random(),360*random()).at;
  });
  const cloudInner=2000,cloudOuter=100000;
  const cloud=Array.from({length:1200},()=>{
    const r=cloudInner*(cloudOuter/cloudInner)**random(),z=2*random()-1,turn=tau*random(),s=Math.sqrt(1-z*z);
    return [r*s*Math.cos(turn),r*s*Math.sin(turn),r*z];
  });

  // Catalogued stars, nearest first, in light-years.
  const count=starCatalog.count,far=starCatalog.farthest;
  // The catalog's own table stops at 8,000 light-years, where 1,800 stars are still drawn:
  // twice as many dots as the model has round the Sun, and each one larger. From farther out
  // only the supergiants could be picked out, so the limit keeps rising with the frame.
  const limits=[...starCatalog.limits,[16000,-3.7],[32000,-4.6],[60000,-5.2]];
  const starX=new Float32Array(count),starY=new Float32Array(count),starZ=new Float32Array(count);
  const starDistance=new Float32Array(count),starMagnitude=new Float32Array(count),starInk=new Uint8Array(count);
  {
    const raw=atob(starCatalog.packed),word=i=>raw.charCodeAt(i)|raw.charCodeAt(i+1)<<8;
    for(let i=0;i<count;i++){
      const o=8*i,d=Math.exp(word(o+4)/65535*Math.log(far)),v=pointing(word(o)/65536*360,word(o+2)/65535*180-90,d);
      starX[i]=v[0];starY[i]=v[1];starZ[i]=v[2];starDistance[i]=d;starMagnitude[i]=raw.charCodeAt(o+6)/8-10;
      starInk[i]=clamp(Math.round((raw.charCodeAt(o+7)/80-.5+.3)/2.3*7),0,7);
    }
  }
  // Faintest absolute magnitude drawn when the frame reaches this far from the Sun.
  function limit(reach){
    if(reach<=limits[0][0])return limits[0][1];
    for(let i=1;i<limits.length;i++)if(reach<=limits[i][0]){
      const [a,ma]=limits[i-1],[b,mb]=limits[i];
      return ma+(mb-ma)*Math.log(reach/a)/Math.log(b/a);
    }
    return limits[limits.length-1][1];
  }
  // Blue-white through orange, by B−V colour.
  const inks=['#a9c1ff','#c6d6ff','#eef1ff','#fff7ea','#ffe9c9','#ffd5a1','#ffbd7d','#ffa25f'];
  // The glow drawn for each ink, made again in the page's colours when its theme changes.
  const sprites=[];
  function makeSprites(){
    sprites.length=0;
    for(const ink of inks.slice(0,8)){
      const c=document.createElement('canvas');c.width=c.height=64;
      const g=c.getContext('2d'),glow=g.createRadialGradient(32,32,0,32,32,32);
      glow.addColorStop(0,'#ffffff');glow.addColorStop(.16,'#ffffff');glow.addColorStop(.3,ink+'c8');glow.addColorStop(.55,ink+'38');glow.addColorStop(1,ink+'00');
      g.fillStyle=glow;g.fillRect(0,0,64,64);sprites.push(c);
    }
    const c=document.createElement('canvas');c.width=c.height=64;
    const g=c.getContext('2d'),glow=g.createRadialGradient(32,32,0,32,32,32);
    glow.addColorStop(0,'#fff4f6');glow.addColorStop(.2,'#ffc3d2d0');glow.addColorStop(.55,'#ff9fba40');glow.addColorStop(1,'#ff9fba00');
    g.fillStyle=glow;g.fillRect(0,0,64,64);sprites.push(c);
  }
  inks.push('#ffb3c6');makeSprites();
  // Galactic longitude and latitude [deg] and distance [ly].
  const landmarks=[
    ['Hyades',180.06,-22.34,153],['Pleiades',166.57,-23.52,444],['Orion Nebula',209.01,-19.38,1344],
    ['Lagoon Nebula',6.0,-1.2,4100],['Eagle Nebula',16.95,.79,5700],['Crab Nebula',184.56,-5.78,6500],
    ['Carina Nebula',287.6,-.65,8500],['47 Tucanae',305.9,-44.89,14500],['Omega Centauri',309.1,14.97,17000],
    ['M13',59.01,40.91,22200],['Galactic centre',359.944,-.046,26700]
  ].map(([name,l,b,d])=>({name,d,at:pointing(l,b,d)}));
  const rings=[1,10,100,1000,10000].map(r=>({r,name:r.toLocaleString('en-US')+(r===1?' light-year':' light-years'),path:Array.from({length:120},(_,i)=>pointing(i*3,0,r))}));
  // The two smallest circles lie in the plane of the planets instead.
  for(const [name,r] of [['1 light-month',30.4375/365.25],['1 light-day',1/365.25]])rings.unshift({r,name,path:Array.from({length:120},(_,i)=>fromEcliptic(pointing(i*3,0,r)))});

  // Other galaxies, behind everything else: galactic longitude and latitude [deg], distance and
  // optical diameter [ly], and for the discs, their inclination and the position angle of the long
  // axis on the sky [deg east of north]. Local Group directions and distances are McConnachie's
  // (2012, AJ 144, 4, table 2; distances in kpc × 3,261.56). Beyond it, distances out to
  // Centaurus A are Wikipedia's list of nearest galaxies and directions were checked against
  // An Atlas of the Universe's list (2026-11-18); M83 and farther, and every size and
  // orientation, are rounded catalogue values (NED) that have not been looked up again.
  // A disc is tilted so the side toward position angle − 90° (the northwest, for Andromeda) is
  // the near side.
  const celestialPole=pointing(122.93192,27.12825);
  // The dwarf spheroidals are spread so thin that even the nearest cannot be seen by eye, so they
  // are drawn at a fraction of the others' strength.
  const diffuse=new Set(['Sagittarius dwarf','Fornax dwarf','Leo I','Leo II','Sculptor dwarf','Sextans dwarf','Carina dwarf','Draco dwarf','Ursa Minor dwarf','Andromeda I','Andromeda II','Pisces dwarf','Phoenix dwarf','Tucana dwarf','Cetus dwarf']);
  const otherGalaxies=[
    ['Andromeda',121.2,-21.6,2554000,152000,'spiral',77,38],['Triangulum',133.6,-31.3,2639000,61000,'spiral',55,23],
    ['Large Magellanic Cloud',280.5,-32.9,166000,32000,'cloud',35,150],['Small Magellanic Cloud',302.8,-44.3,209000,19000,'cloud',60,45],
    ['NGC 6822',25.3,-18.4,1497000,7000,'cloud',50,10],['IC 1613',129.7,-60.6,2462000,10000,'cloud',38,50],['WLM',75.9,-73.6,3043000,8000,'cloud',70,4],
    ['M110',120.7,-21.1,2688000,17000,'dwarf'],['M32',121.15,-21.98,2626000,6500,'dwarf'],['NGC 147',119.8,-14.3,2205000,10000,'dwarf'],
    ['NGC 185',120.8,-14.5,2012000,8000,'dwarf'],['IC 10',119,-3.3,2590000,5000,'dwarf'],['Leo A',196.9,52.4,2603000,4000,'dwarf'],
    ['Sagittarius dwarf',5.6,-14.2,85000,10000,'dwarf'],['Fornax dwarf',237.1,-65.7,479000,6000,'dwarf'],['Leo I',226,49.1,828000,2000,'dwarf'],
    ['Leo II',220.2,67.2,760000,1200,'dwarf'],['Sculptor dwarf',287.5,-83.2,280000,3000,'dwarf'],['Sextans dwarf',243.5,42.3,280000,3000,'dwarf'],
    ['Carina dwarf',260.1,-22.2,342000,2000,'dwarf'],['Draco dwarf',86.4,34.7,248000,2000,'dwarf'],['Ursa Minor dwarf',105,44.8,248000,2000,'dwarf'],
    ['Andromeda I',121.7,-24.8,2430000,2000,'dwarf'],['Andromeda II',128.9,-29.2,2127000,4000,'dwarf'],['Pisces dwarf',126.8,-40.9,2508000,1500,'dwarf'],
    ['Pegasus dwarf',94.8,-43.6,3001000,3000,'dwarf'],['Phoenix dwarf',272.2,-68.9,1354000,2000,'dwarf'],['Tucana dwarf',322.9,-47.4,2893000,2000,'dwarf'],
    ['Cetus dwarf',101.5,-72.9,2462000,3000,'dwarf'],['Aquarius dwarf',34,-31.3,3496000,2000,'dwarf'],
    ['NGC 300',299.2,-79.4,6100000,47000,'spiral',40,111],['NGC 55',332.7,-75.7,6500000,70000,'spiral',80,108],
    ['IC 342',138.2,10.6,10700000,75000,'spiral',31,0],['Sculptor Galaxy',97.4,-88,11400000,90000,'spiral',76,52],
    ['M82',141.4,40.6,11500000,37000,'cloud',80,65],['Bode’s Galaxy',142.1,40.9,11800000,90000,'spiral',59,157],
    ['Centaurus A',309.5,19.4,12000000,60000,'dwarf'],['NGC 4945',305.3,13.3,11700000,75000,'spiral',78,43],
    ['Southern Pinwheel',314.6,32,15200000,55000,'spiral',24,45],['M94',123.4,76,16000000,50000,'spiral',35,115],
    ['Black Eye Galaxy',315.7,84.4,17000000,54000,'spiral',60,115],['Pinwheel Galaxy',102,59.8,20900000,170000,'spiral',18,39],
    ['Whirlpool Galaxy',104.9,68.6,23000000,76000,'spiral',22,163],['M106',138.3,68.8,23700000,135000,'spiral',72,150],
    ['Sombrero Galaxy',298.5,51.1,31000000,50000,'spiral',84,90],['M87',283.8,74.5,53500000,120000,'dwarf']
  ].map(([name,l,b,d,size,kind,inclination=0,angle=0])=>{
    const at=pointing(l,b,d),sight=at.map(v=>v/d),unit=v=>{const n=Math.hypot(...v);return v.map(c=>c/n)};
    const east=unit(cross(celestialPole,sight)),north=cross(sight,east),pa=angle*rad,tilt=inclination*rad;
    const major=north.map((v,i)=>v*Math.cos(pa)+east[i]*Math.sin(pa)),across=cross(sight,major);
    const axis=sight.map((v,i)=>-v*Math.cos(tilt)-across[i]*Math.sin(tilt));
    return {name,d,size,kind,at,major,minor:unit(cross(axis,major)),big:kind!=='dwarf',faint:diffuse.has(name)};
  });
  // One picture for each kind of galaxy, drawn once into a square and laid on the disc with the
  // disc's own orientation, so its tilt is real while its detail stands in for what is there.
  const pictures={};
  function picture(kind){
    if(pictures[kind])return pictures[kind];
    const c=document.createElement('canvas');c.width=c.height=256;
    const g=c.getContext('2d');g.translate(128,128);
    let s=kind==='spiral'?911:577;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
    const gauss=()=>Math.sqrt(-2*Math.log(1-r()))*Math.cos(tau*r());
    const wash=(radius,stops,sy=1)=>{g.save();g.scale(1,sy);const f=g.createRadialGradient(0,0,0,0,0,radius);for(const [at,ink] of stops)f.addColorStop(at,ink);g.fillStyle=f;g.beginPath();g.arc(0,0,radius,0,tau);g.fill();g.restore()};
    if(kind==='spiral'){
      wash(128,[[0,'#fff1d6'],[.08,'#ffe2b6f4'],[.22,'#efd0b0a8'],[.5,'#b4bee86a'],[.8,'#98a6e030'],[1,'#98a6e000']]);
      // Two arms on logarithmic spirals, about 12 degrees of pitch.
      for(let arm=0;arm<2;arm++)for(let k=0;k<900;k++){
        const t=k/900*10.4,radius=15*Math.exp(.205*t)*(1+.07*gauss()),turn=t+arm*Math.PI+.14*gauss();
        g.globalAlpha=.5+.5*r();g.fillStyle=r()<.06?'#ffb3c6':'#e4eaff';
        const size=r()<.12?3.4:2.2;g.fillRect(radius*Math.cos(turn)-size/2,radius*Math.sin(turn)-size/2,size,size);
      }
      g.globalAlpha=.4;g.strokeStyle='#1b1410';g.lineWidth=3.2;
      for(let arm=0;arm<2;arm++){g.beginPath();for(let t=1.2;t<9.6;t+=.05){const radius=14*Math.exp(.205*t),turn=t+arm*Math.PI-.22;g.lineTo(radius*Math.cos(turn),radius*Math.sin(turn))}g.stroke()}
      g.globalAlpha=1;wash(22,[[0,'#fff8e8'],[.4,'#ffe7c2b0'],[1,'#ffd9a000']]);
    }else if(kind==='cloud'){
      wash(120,[[0,'#e4e6fa90'],[.5,'#c6cdf246'],[1,'#b4bdf000']],.8);
      g.save();g.rotate(.2);wash(70,[[0,'#fff2e0c0'],[.5,'#f6e4d060'],[1,'#f0dcc800']],.28);g.restore();
      for(let k=0;k<46;k++){
        const x=gauss()*42,y=gauss()*32,radius=6+18*r();
        const f=g.createRadialGradient(x,y,0,x,y,radius);f.addColorStop(0,r()<.25?'#ffc8d6a0':'#eef0ffa0');f.addColorStop(1,'#eef0ff00');
        g.fillStyle=f;g.beginPath();g.arc(x,y,radius,0,tau);g.fill();
      }
    }else wash(128,[[0,'#f3ecdc'],[.25,'#e6dccab0'],[.6,'#d6cdbd38'],[1,'#d6cdbd00']]);
    return pictures[kind]=c;
  }

  // Two orthographic views, each a screen-right and a screen-down vector. The first looks
  // down on the planets' orbits; the second is the galaxy shot's view of the disc.
  const rolled=(right,down,t)=>[right.map((v,i)=>v*Math.cos(t)-down[i]*Math.sin(t)),right.map((v,i)=>v*Math.sin(t)+down[i]*Math.cos(t))];
  const solarView=rolled(fromEcliptic([1,0,0]),fromEcliptic([0,-.42,-Math.sqrt(1-.42*.42)]),-.28);
  const disc=studioScenes.galaxyView(.4),toCentre=[-Math.cos(disc.angle),-Math.sin(disc.angle)],along=[-Math.sin(disc.angle),Math.cos(disc.angle)];
  const galaxyView=rolled([toCentre[0],along[0],0],[toCentre[1]*disc.flat,along[1]*disc.flat,-Math.sqrt(1-disc.flat**2)],disc.tilt);
  const sunToCentre=milkyWay.sunToCentre,discRadius=sunToCentre/disc.radius*auPerLightYear,centreAt=[sunToCentre,0,0];
  // One rotation about a fixed axis carries the first view into the second.
  const first=[...solarView,cross(...solarView)],second=[...galaxyView,cross(...galaxyView)];
  const Q=[0,1,2].map(i=>[0,1,2].map(j=>first[0][j]*second[0][i]+first[1][j]*second[1][i]+first[2][j]*second[2][i]));
  const swing=Math.acos(clamp((Q[0][0]+Q[1][1]+Q[2][2]-1)/2,-1,1));
  const axis=(v=>{const n=Math.hypot(...v)||1;return v.map(c=>c/n)})([Q[2][1]-Q[1][2],Q[0][2]-Q[2][0],Q[1][0]-Q[0][1]]);
  const swung=(v,t)=>{const c=Math.cos(swing*t),s=Math.sin(swing*t),k=cross(axis,v),along=dot(axis,v)*(1-c);return v.map((x,i)=>x*c+k[i]*s+axis[i]*along)};

  // Monotone cubic through the keyframes, at rest at both ends.
  function curve(xs,ys){
    const n=xs.length,d=[],m=[0];
    for(let i=0;i<n-1;i++)d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
    for(let i=1;i<n-1;i++)m.push(2*d[i-1]*d[i]/(d[i-1]+d[i]));
    m.push(0);
    return x=>{
      x=clamp(x);let i=0;while(i<n-2&&x>xs[i+1])i++;
      const width=xs[i+1]-xs[i],t=(x-xs[i])/width,t2=t*t,t3=t2*t;
      return ys[i]*(2*t3-3*t2+1)+width*m[i]*(t3-2*t2+t)+ys[i+1]*(3*t2-2*t3)+width*m[i+1]*(t3-t2);
    };
  }
  // Scrolling, in viewport heights, at which the frame reaches each scale.
  const stops=[0,32,74,108,140,166,204,236,280,326,372,420,476],length=stops[stops.length-1];
  const two=n=>Number(n.toPrecision(2)).toLocaleString('en-US');
  function distance(au){
    const km=au*kmPerAu,ly=au/auPerLightYear;
    if(km<1e6)return two(km)+' km';
    if(au<1)return two(km/1e6)+' million km';
    if(ly<.1)return two(au)+' AU';
    return two(ly)+(two(ly)==='1'?' light-year':' light-years');
  }
  const lightYears=d=>(d>=1e6?(Math.round(d/1e5)/10)+' million':d<20?d.toFixed(1):Math.round(d).toLocaleString('en-US'))+' ly';
  const font='10px ui-monospace, Consolas, monospace';
  // Visible while a feature is between two sizes on screen.
  // The share of the disc's radius that reads as the bright galaxy.
  const bright=.8;
  const between=(size,small,large)=>ease((size-small)/(small*1.4))*(1-ease((size-large)/(large*.5)));

  // The dust lanes along the arms are 154 runs, each stroked six times at nested widths.
  // Stroking them every frame costs more than the rest of the frame, but they lie in the plane of
  // the disc and only the camera moves. So they are stroked once into an image of the whole
  // disc, about 60 light-years to a texel, and each frame lays the image in with its own
  // transform. No lane is narrower than 900 light-years. The image holds the lanes at the
  // haze's full strength, and fainter frames lay it down more faintly.
  const laneStrength=.58;let laneImage=null;
  function lanesDrawn(){
    const inks=[[11,'#8f8fe0',.018],[8.4,'#8f8fe0',.022],[6.2,'#9aa0ea',.028],[4.4,'#a9b4f5',.036],[2.9,'#bcc6fa',.046],[1.6,'#cfd8ff',.06]];
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
    for(const lane of milkyWay.lanes){const r=lane.width*inks[0][0]/2;for(const [x,y] of lane.at){x0=Math.min(x0,x-r);y0=Math.min(y0,y-r);x1=Math.max(x1,x+r);y1=Math.max(y1,y+r)}}
    const res=2048/Math.max(x1-x0,y1-y0),canvas=document.createElement('canvas');
    canvas.width=Math.ceil((x1-x0)*res);canvas.height=Math.ceil((y1-y0)*res);
    const g=canvas.getContext('2d');g.setTransform(res,0,0,res,-x0*res,-y0*res);g.lineJoin='round';
    for(const lane of milkyWay.lanes){
      g.beginPath();lane.at.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
      for(const [wide,ink,alpha] of inks){g.globalAlpha=laneStrength*lane.strength*alpha;g.strokeStyle=ink;g.lineWidth=lane.width*wide;g.stroke()}
    }
    return {canvas,x0,y0,res};
  }
  // The layer for the galaxy's haze and lanes: cleared, with CSS pixels for its coordinates,
  // at glowScale of a CSS pixel's resolution.
  const glowScale=.5,glow={canvas:null,ctx:null};
  function glowLayer(w,h){
    const W=Math.ceil(w*glowScale),H=Math.ceil(h*glowScale);
    if(!glow.canvas){glow.canvas=document.createElement('canvas');glow.ctx=glow.canvas.getContext('2d')}
    if(glow.canvas.width!==W||glow.canvas.height!==H){glow.canvas.width=W;glow.canvas.height=H}
    const g=glow.ctx;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.clearRect(0,0,W,H);g.setTransform(glowScale,0,0,glowScale,0,0);
    return g;
  }

  // The frame's reach [au] along the pull back, as log10 against q.
  const scaleCurve=(reach,globe,finalField)=>{const ly=auPerLightYear;return curve(stops.map(v=>v/length),[earthRadius*reach/globe,moonDistance*1.3,2,38,260,1600,160000,8.5*ly,45*ly,330*ly,Math.min(2600*ly,finalField/12),finalField/3.4,finalField].map(Math.log10))};
  // For pages that drive the pull back by a width and carry on past it (the scale project):
  // the frame's width [au] at q, where the finished galaxy sits, and a way to fade the Sun's mark
  // and the galaxies behind the scene when that page draws its own beyond the Milky Way.
  function span(w,h,q){
    const reach=.4*Math.min(w,h),home=studioScenes.sunPoint(w,h,.4,true);
    return w*10**scaleCurve(reach,Math.min(w*.3,h*.36),discRadius*reach/home.radius)(q)/reach;
  }
  function finished(w,h){
    const reach=.4*Math.min(w,h),home=studioScenes.sunPoint(w,h,.4,true),last=home.radius/discRadius*auPerLightYear;
    return {x:home.x+dot(centreAt,second[0])*last,y:home.y+dot(centreAt,second[1])*last,discRadius:home.radius,poseRadius:bright*home.radius};
  }
  let beyond=0;

  // fold: 1 = the flat map, 0 = the globe. q: 0 = the globe filling the frame, 1 = the whole
  // galaxy. spin turns the finished galaxy about its centre and push moves the camera in.
  // pose, for the reel, moves the camera as one rigid turn: normal is where the disc's axis
  // should point, as screen right, screen down and depth; x, y and r are the centre and the
  // radius of the disc's bright part, and fit how far the centre and size have moved there.
  // turn, when given, is the visitor's own rotation as a 3×3 matrix in screen space (right,
  // down, into the screen). It is applied last, on top of the film's camera. zoom is the
  // globe's zoom slider: above 1 it moves the camera in on the Earth; below 1 the frame is at
  // least as wide as the zoomed-out globe's, so the pull back carries on from that width
  // without the globe growing first. Neither moves anything.
  // The galaxy's dots on the graphics card: one WebGL draw of every dot into a canvas of the
  // frame's size, laid over the frame in one step. It matches the 2D drawing below: a square of
  // the dot's size in its kind's tint and strength, and for the bright knots a soft round glow
  // four times as wide, blue-white or (every third) pink. If WebGL is missing or its context is
  // lost, draw() returns false and the dots are drawn one by one as before.
  const discDots=(()=>{
    let gl=null,canvas=null,program=null,count=0,where={},failed=false,colours=null;
    // Each dot's colour in the page's theme: the canvas colour hook does not reach the graphics
    // card, so the colours go through the theme here.
    const themed=rgb=>{
      if(typeof pageTheme==='undefined')return rgb.map(v=>v/255);
      const hex=pageTheme.tint('#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join(''));
      return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
    };
    function colourData(){
      const m=milkyWay,col=new Float32Array(m.count*4),inks=tint.map(themed),blue=themed([198,214,255]),pink=themed([255,179,198]);
      for(let i=0;i<m.count;i++){const k=m.kind[i],knot=k===1,rgb=knot?(i%3===0?pink:blue):inks[k];col.set([rgb[0],rgb[1],rgb[2],strength[k]],i*4)}
      return col;
    }
    function cores(){gl.uniform3fv(where.core,themed([255,255,255]));gl.uniform3fv(where.pinkCore,themed([255,244,246]))}
    function retheme(){
      if(!gl||failed||gl.isContextLost())return;
      gl.bindBuffer(gl.ARRAY_BUFFER,colours);gl.bufferData(gl.ARRAY_BUFFER,colourData(),gl.STATIC_DRAW);cores();
    }
    const tint=[[213,223,255],[255,255,255],[234,223,206],[255,220,174]],strength=[.9,.95,.55,.8];
    const vertex=`attribute vec3 p;attribute vec4 c;attribute float s;attribute float k;attribute float n;
      uniform vec3 R;uniform vec3 D;uniform vec2 sun;uniform vec4 m;uniform vec2 shift;uniform vec2 view;uniform float grain;uniform float gap;
      varying vec4 vc;varying float vk;
      void main(){
        vec2 css=sun+vec2(dot(p,R),dot(p,D));
        vec2 dev=vec2(m.x*css.x+m.z*css.y,m.y*css.x+m.w*css.y)+shift;
        gl_Position=vec4(dev.x/view.x*2.0-1.0,1.0-dev.y/view.y*2.0,0.0,1.0);
        float scale=length(m.xy),size=s*grain*scale*(k>0.5?4.0:1.0);
        // A square dot is drawn whole pixels wide, dimmed by the share of them its true size
        // covers, so a dot carries as much light as the 2D canvas gives it.
        float whole=k>0.5?max(size,1.0):max(ceil(size),1.0);
        gl_PointSize=whole;
        // A dot round the Sun comes in as the gap left for the cataloged stars closes.
        float shown=clamp((n-gap)/0.12,0.0,1.0);
        vc=vec4(c.rgb,c.a*shown*(k>0.5?1.0:min(1.0,size*size/(whole*whole))));vk=k;
      }`;
    const fragment=`precision mediump float;varying vec4 vc;varying float vk;uniform vec3 core;uniform vec3 pinkCore;
      void main(){
        float a=vc.a;vec3 rgb=vc.rgb;
        if(vk>0.5){
          float r=length(gl_PointCoord-0.5)*2.0;if(r>1.0)discard;
          // The sprite's gradient: white core, then the ink, then nothing at the rim.
          if(vk<1.5){
            float w=1.0-smoothstep(0.16,0.3,r);rgb=mix(rgb,core,w);
            a*=r<0.3?mix(1.0,0.784,smoothstep(0.16,0.3,r)):r<0.55?mix(0.784,0.22,(r-0.3)/0.25):mix(0.22,0.0,(r-0.55)/0.45);
          }else{
            rgb=mix(pinkCore,rgb,smoothstep(0.0,0.2,r));
            a*=r<0.2?mix(1.0,0.816,r/0.2):r<0.55?mix(0.816,0.25,(r-0.2)/0.35):mix(0.25,0.0,(r-0.55)/0.45);
          }
        }
        gl_FragColor=vec4(rgb*a,a);
      }`;
    function setup(){
      canvas=document.createElement('canvas');
      // Only a graphics card helps here: a WebGL drawn in software is slower than the 2D path.
      gl=canvas.getContext('webgl',{premultipliedAlpha:true,antialias:false,alpha:true,depth:false,stencil:false,preserveDrawingBuffer:false,failIfMajorPerformanceCaveat:true});
      if(!gl)return false;
      const info=gl.getExtension('WEBGL_debug_renderer_info');
      if(/swiftshader|llvmpipe|software|basic render/i.test(info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER))){gl=null;return false}
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true});
      const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh};
      program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));
      gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const m=milkyWay;count=m.count;
      const pos=new Float32Array(count*3),size=new Float32Array(count),kind=new Float32Array(count);
      for(let i=0;i<count;i++){
        pos[i*3]=m.X[i];pos[i*3+1]=m.Y[i];pos[i*3+2]=m.Z[i];size[i]=m.size[i];
        const k=m.kind[i],knot=k===1,pink=knot&&i%3===0;kind[i]=knot?(pink?2:1):0;
      }
      const attribute=(name,data,n)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,n,gl.FLOAT,false,0,0);return b};
      attribute('p',pos,3);colours=attribute('c',colourData(),4);attribute('s',size,1);attribute('k',kind,1);attribute('n',m.near,1);
      for(const u of ['R','D','sun','m','shift','view','grain','gap','core','pinkCore'])where[u]=gl.getUniformLocation(program,u);
      cores();
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
      return true;
    }
    function draw(ctx,w,h,sunX,sunY,r0,r1,r2,d0,d1,d2,grain,gap){
      if(failed)return false;
      try{if(!gl&&!setup()){failed=true;return false}}catch{failed=true;return false}
      if(gl.isContextLost()){failed=true;return false}
      const W=ctx.canvas.width,H=ctx.canvas.height,t=ctx.getTransform();
      if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
      gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform3f(where.R,r0,r1,r2);gl.uniform3f(where.D,d0,d1,d2);gl.uniform2f(where.sun,sunX,sunY);
      gl.uniform4f(where.m,t.a,t.b,t.c,t.d);gl.uniform2f(where.shift,t.e,t.f);gl.uniform2f(where.view,W,H);gl.uniform1f(where.grain,grain);gl.uniform1f(where.gap,gap);
      gl.drawArrays(gl.POINTS,0,count);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(canvas,0,0);ctx.restore();
      return true;
    }
    return {draw,retheme,disable(){failed=true}};
  })();
  if(typeof pageTheme!=='undefined')pageTheme.onChange(()=>{makeSprites();discDots.retheme();for(const k in pictures)delete pictures[k]});
  function draw(ctx,w,h,fold,q,sheet,spin=0,push=1,rims=0,pose=null,turn=null,zoom=1){
    const reach=.4*Math.min(w,h),largest=Math.max(w,h),globe=Math.min(w*.3,h*.36),narrow=w<700;
    const now=performance.now(),step=clamp((now-lastTime)/260,.02,.34);lastTime=now;frame++;
    const centre=[w/2,h/2],home=studioScenes.sunPoint(w,h,.4,true);
    const finalField=discRadius*reach/home.radius,ly=auPerLightYear;
    if(pose)push+=(pose.r/(bright*home.radius)-push)*pose.fit;
    const scale=scaleCurve(reach,globe,finalField);
    const natural=10**scale(q)/push,field=zoom<1?Math.max(natural,10**scale(0)/push/zoom):natural/zoom,z=reach/field,reachLy=field/ly,zl=z*ly,magnification=finalField/field;
    const notes=1-ease((q-.955)/.04);

    // Space replaces the page's own background as the Earth recedes.
    ctx.save();ctx.globalAlpha=ease(q/.06);studioScenes.field(ctx,w,h,'#10121c');ctx.restore();

    // The view swings from the plane of the planets to the plane of the galaxy while the
    // nearest stars come into the frame.
    const turned=ease(Math.log(reachLy/.25)/Math.log(120/.25)),about=([x,y,v])=>[x*Math.cos(spin)-y*Math.sin(spin),x*Math.sin(spin)+y*Math.cos(spin),v];
    let right=about(swung(first[0],turned)),down=about(swung(first[1],turned));
    if(pose){
      // The shortest turn that carries the disc's axis from where it points to pose.normal.
      const into=cross(right,down),from=[right[2],down[2],into[2]],about=cross(from,pose.normal),sin=Math.hypot(...about),cos=dot(from,pose.normal);
      if(sin>1e-6){
        const u=about.map(v=>v/sin),basis=[right,down,into];
        const carry=row=>{const e=[0,0,0];e[row]=1;const k=cross(u,e),along=u[row]*(1-cos);return [0,1,2].map(j=>[0,1,2].reduce((sum,i)=>sum+(e[i]*cos-k[i]*sin+u[i]*along)*basis[i][j],0))};
        right=carry(0);down=carry(1);
      }
    }
    if(turn){
      const into=cross(right,down),basis=[right,down,into];
      const combine=row=>[0,1,2].map(j=>row[0]*basis[0][j]+row[1]*basis[1][j]+row[2]*basis[2][j]);
      right=combine(turn[0]);down=combine(turn[1]);
    }
    const flat=v=>[dot(v,right),dot(v,down)];
    // For the lit Moon (moon.js): a galactic direction as [right, down, toward the eye].
    const into=cross(right,down),screen=g=>[dot(g,right),dot(g,down),-dot(g,into)];

    // The Earth holds the centre until the Sun approaches the frame, then the Sun takes
    // it. Near the end the Sun moves to its place in the galaxy.
    const settle=ease((Math.log10(60)-Math.log10(magnification))/Math.log10(60));
    const sunCentre=[centre[0]+(home.x-centre[0])*settle,centre[1]+(home.y-centre[1])*settle];
    if(spin||push!==1||pose){
      // The galaxy's centre keeps the place the finished pull back gave it, unless posed.
      const last=reach/finalField*ly;let gx=home.x+dot(centreAt,second[0])*last,gy=home.y+dot(centreAt,second[1])*last;
      if(pose){gx+=(pose.x-gx)*pose.fit;gy+=(pose.y-gy)*pose.fit}
      sunCentre[0]=gx-dot(centreAt,right)*zl;sunCentre[1]=gy-dot(centreAt,down)*zl;
    }
    const earthFlat=flat(earth.at),near=reach/1.6,arrive=ease(Math.log(near*60/z)/Math.log(60)),offset=Math.min(z,near*arrive);
    const earthAt=[sunCentre[0]+earthFlat[0]*offset,sunCentre[1]+earthFlat[1]*offset];
    const sunX=earthAt[0]-earthFlat[0]*z,sunY=earthAt[1]-earthFlat[1]*z;
    const onScreen=(x,y,margin=0)=>x>margin&&x<w-margin&&y>margin&&y<h-margin;
    const trace=(path,k,x=sunX,y=sunY)=>{
      ctx.beginPath();
      for(let i=0;i<path.length;i++){const v=path[i],px=x+dot(v,right)*k,py=y+dot(v,down)*k;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py)}
      ctx.closePath();ctx.stroke();
    };
    const boxes=[];
    // Find room for a label beside a point, on whichever side is free. gap is the room the mark needs.
    function place(text,x,y,gap,force){
      const width=text.length*6.05+4;
      for(const [dx,dy] of force?[[gap,0]]:[[gap,0],[-gap-width,0],[gap*.6,13],[gap*.6,-13],[-gap*.6-width,13],[-gap*.6-width,-13]]){
        const b=[x+dx-2,y+dy-7,x+dx+width,y+dy+7];
        if(!force&&(b[2]>w-6||b[0]<6||b[1]<6||b[3]>h-6||boxes.some(o=>b[0]<o[2]&&b[2]>o[0]&&b[1]<o[3]&&b[3]>o[1])))continue;
        boxes.push(b);return b;
      }
      return null;
    }
    function write(text,x,y,alpha,ink){
      ctx.save();ctx.globalAlpha=alpha;ctx.font=font;ctx.textBaseline='middle';
      ctx.lineWidth=2.6;ctx.strokeStyle='#12121ca8';ctx.strokeText(text,x,y);ctx.fillStyle=ink;ctx.fillText(text,x,y);ctx.restore();
    }
    function label(text,x,y,alpha,ink='#d6e2d4',force=false,gap=0){
      const box=alpha>.02?place(text,x,y,gap,force):null;
      if(box)write(text,box[0]+2,box[1]+7,alpha,ink);
      return !!box;
    }
    // A label on a fixed point in space (v, in light-years). It is drawn at the end of the
    // frame, so that one which loses its place fades out and does not vanish.
    function tag(key,text,v,x,y,alpha,ink,gap,stalk=false){
      const box=alpha>.02?place(text,x,y,gap,false):null;
      let t=tags.get(key);
      if(!t){if(!box)return false;t={shown:0,dx:0,dy:0};tags.set(key,t)}
      Object.assign(t,{text,v,ink,stalk,frame,on:!!box,alpha:box?alpha:Math.max(alpha,t.alpha??0)});
      if(box){t.dx=box[0]+2-x;t.dy=box[1]+7-y}
      return !!box;
    }
    // The Sun's own label and the readout rail keep their places.
    boxes.push([sunX-14,sunY-12,sunX+70,sunY+12],[0,h-64,w,h]);

    // Other galaxies, behind the scene. The frame is drawn as if seen from far off, but here it is
    // treated as a camera with a field of view of 60° across: it stands back from the middle of
    // the frame by the distance at which the frame's width fills that field, and every galaxy in
    // the direction it looks is drawn where it lies and at its true angular size from there.
    // Near the Earth that is the sky as seen from here; as the frame widens, the camera moves out
    // with it and the view changes as it would. Galaxies nearer than the scene's own depth are
    // left out, so nothing passes through the frame.
    {
      const sky=ease(q/.06)*(1-beyond);
      if(sky>.01){
        const into=cross(right,down),focal=w/2/Math.tan(30*rad),back=focal/zl;
        const mid=[0,1,2].map(i=>right[i]*(w/2-sunX)/zl+down[i]*(h/2-sunY)/zl),eye=mid.map((v,i)=>v-into[i]*back);
        for(const g of otherGalaxies){
          const rel=g.at.map((v,i)=>v-eye[i]),depth=dot(rel,into);
          if(depth<2.5*back)continue;
          const k=focal/depth,x=w/2+dot(rel,right)*k,y=h/2+dot(rel,down)*k,radius=g.size/2*k;
          if(x<-radius-4||x>w+radius+4||y<-radius-4||y>h+radius+4)continue;
          // Beyond the scene's depth they come in over a little distance, not at once.
          const alpha=sky*ease((depth-2.5*back)/(1.5*back))*(g.faint?.16:.85);
          ctx.save();ctx.globalAlpha=alpha;
          if(g.kind==='dwarf'||radius<2){
            const r=Math.max(1.1,radius*1.3),f=ctx.createRadialGradient(x,y,0,x,y,r*1.8);
            f.addColorStop(0,'#f6efdf');f.addColorStop(.35,'#e8dfcc90');f.addColorStop(1,'#e8dfcc00');
            ctx.fillStyle=f;ctx.fillRect(x-r*1.8,y-r*1.8,r*3.6,r*3.6);
          }else{
            const r=Math.max(2,radius*(g.kind==='spiral'?.34:.4)),f=ctx.createRadialGradient(x,y,0,x,y,r);
            f.addColorStop(0,g.kind==='spiral'?'#fff4dc':'#eef0ff');f.addColorStop(.3,g.kind==='spiral'?'#ffe2b49a':'#dde2fa80');f.addColorStop(1,'#d8dcf000');
            ctx.fillStyle=f;ctx.fillRect(x-r,y-r,2*r,2*r);
            let ux=dot(g.major,right)*k,uy=dot(g.major,down)*k,vx=dot(g.minor,right)*k,vy=dot(g.minor,down)*k;
            // The clouds are irregular and thick, not thin discs: from any side they stay a blob.
            if(g.kind==='cloud'){const n=Math.hypot(ux,uy)||1;[ux,uy]=[ux/n*k,uy/n*k];[vx,vy]=[-uy*.72,ux*.72]}
            ctx.transform(ux*g.size/2,uy*g.size/2,vx*g.size/2,vy*g.size/2,x,y);ctx.drawImage(picture(g.kind),-1,-1,2,2);
            if(g.kind==='spiral'&&radius<90){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*.55;ctx.drawImage(picture(g.kind),-1,-1,2,2)}
          }
          ctx.restore();
          if(radius>9&&g.big)label(g.name+' · '+lightYears(g.d),x,y,alpha*notes*ease((radius-9)/12)*.85,'#c9d3e4',false,radius*.6+6);
        }
      }
    }

    // The galaxy is drawn whenever any of it is in the frame. Nothing is faded in: as the
    // frame widens, more of the disc comes in from its edges.
    const edge=.53*largest/zl;
    if(edge>1500){
      const gx=sunX+dot(centreAt,right)*zl,gy=sunY+dot(centreAt,down)*zl;
      const grain=clamp(.62+28*zl,.72,1.3),m=milkyWay,r0=right[0]*zl,r1=right[1]*zl,r2=right[2]*zl,d0=down[0]*zl,d1=down[1]*zl,d2=down[2]*zl;
      // Light from the stars too faint and too many to draw, at a little over half its
      // earlier strength. It comes up gradually, over more than a factor of forty in scale.
      const haze=.58*ease(Math.log(edge/1200)/Math.log(40));
      if(haze>.005){
        // The haze and the lanes are soft light laid many layers deep. They are drawn at a
        // fraction of the frame's resolution into a layer of their own, which is then laid over
        // the frame in one step. On a canvas drawn by the processor this saves most of the cost
        // of the full galaxy, and nothing in them is fine enough to show the difference.
        const g=glowLayer(w,h),px=flat([1,0,0]),py=flat([0,1,0]);
        const wash=(radius,stops)=>{const fill=g.createRadialGradient(0,0,0,0,0,radius);for(const [at,ink] of stops)fill.addColorStop(at,ink);g.fillStyle=fill;g.fillRect(-radius,-radius,2*radius,2*radius)};
        g.save();g.globalAlpha=haze;g.transform(px[0]*zl,px[1]*zl,py[0]*zl,py[1]*zl,gx,gy);
        wash(60000,[[0,'#f8c7777a'],[.16,'#d98c6b5c'],[.5,'#9179c230'],[1,'#626baf00']]);
        g.rotate(Math.PI-28*rad);g.scale(1,.5);wash(15500,[[0,'#fff9eab0'],[.14,'#ffedcc90'],[.42,'#ffd1aa50'],[1,'#ffad7a00']]);g.restore();
        laneImage??=lanesDrawn();
        g.save();g.transform(px[0]*zl,px[1]*zl,py[0]*zl,py[1]*zl,sunX,sunY);g.translate(laneImage.x0,laneImage.y0);g.scale(1/laneImage.res,1/laneImage.res);
        g.globalAlpha=Math.min(1,haze/laneStrength);g.drawImage(laneImage.canvas,0,0);g.restore();
        ctx.save();ctx.globalAlpha=1;ctx.drawImage(g.canvas,0,0,g.canvas.width,g.canvas.height,0,0,g.canvas.width/glowScale,g.canvas.height/glowScale);ctx.restore();
      }
      // The very centre is too crowded to draw star by star, so a small glow stands in for it.
      const bulge=3600*zl;
      if(gx>-bulge&&gx<w+bulge&&gy>-bulge&&gy<h+bulge){
        const glow=ctx.createRadialGradient(gx,gy,0,gx,gy,bulge);
        glow.addColorStop(0,'#fff6e2e0');glow.addColorStop(.25,'#ffdfb480');glow.addColorStop(.6,'#ffc48c28');glow.addColorStop(1,'#ffb07000');
        ctx.fillStyle=glow;ctx.fillRect(gx-bulge,gy-bulge,2*bulge,2*bulge);
      }
      const tints=['#d5dfff','#ffffff','#eadfce','#ffdcae'],strength=[.9,.95,.55,.8];
      // Close in, the Sun's neighborhood is left to the cataloged stars (see galaxy.js). The
      // gap closes as the half-frame grows from 5,000 to 20,000 light-years: the model's dots
      // round the Sun come in one by one, the nearest last, and the Local arm runs through it.
      const gap=1-ease(Math.log(edge/5000)/Math.log(4));
      // The graphics card draws the disc's tens of thousands of dots in one call where it can;
      // drawn one by one below, they cost most of a frame on a modest laptop.
      if(!discDots.draw(ctx,w,h,sunX,sunY,r0,r1,r2,d0,d1,d2,grain,gap)){
        ctx.save();let kind=-1;
        for(let i=0;i<m.count;i++){
          const near=m.near[i];if(near<=gap)continue;
          const x=sunX+m.X[i]*r0+m.Y[i]*r1+m.Z[i]*r2;if(x<-6||x>w+6)continue;
          const y=sunY+m.X[i]*d0+m.Y[i]*d1+m.Z[i]*d2;if(y<-6||y>h+6)continue;
          if(m.kind[i]!==kind){kind=m.kind[i];ctx.fillStyle=tints[kind];ctx.globalAlpha=strength[kind]}
          // A dot still coming in is fainter; the next dot sets its own strength again.
          if(near<gap+.12){ctx.globalAlpha=strength[kind]*(near-gap)/.12;kind=-1}
          const size=m.size[i]*grain;
          // Bright knots stand for star-forming regions, pink or blue-white.
          if(m.kind[i]===1)ctx.drawImage(sprites[i%3?1:8],x-size*2,y-size*2,size*4,size*4);
          else ctx.fillRect(x-size/2,y-size/2,size,size);
        }
        ctx.restore();
      }
    }

    // Circles of fixed radius in the galactic plane give the scale and the tilt of the view.
    ctx.save();ctx.lineWidth=.8;ctx.strokeStyle='#9fb3c8';
    for(const ring of rings){
      const size=ring.r*zl,alpha=between(size,34,1.25*largest)*notes;
      if(alpha<.02)continue;
      ctx.globalAlpha=alpha*.3;ctx.setLineDash([2,5]);trace(ring.path,zl);ctx.setLineDash([]);
      let best=null;
      for(const v of ring.path){const x=sunX+dot(v,right)*zl,y=sunY+dot(v,down)*zl;if(onScreen(x,y,70)&&y<h-110&&(!best||x-y*.4>best[0]-best[1]*.4))best=[x,y]}
      if(best)label(ring.name,best[0],best[1]-9,alpha*.8,'#aebfd2',false,6);
    }
    ctx.restore();

    const shell=cloudOuter*z,cloudAlpha=ease((shell-40)/70)*(1-ease((cloudInner*z-.6*largest)/(.6*largest)));
    if(cloudAlpha>.02){
      const haze=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,shell);
      haze.addColorStop(0,'#9fb6d800');haze.addColorStop(cloudInner/cloudOuter,'#9fb6d800');haze.addColorStop(.12,'#9fb6d812');haze.addColorStop(.4,'#9fb6d810');haze.addColorStop(1,'#9fb6d800');
      ctx.save();ctx.globalAlpha=cloudAlpha;ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#c4d3ea';ctx.globalAlpha=cloudAlpha*.62;
      for(const v of cloud){const x=sunX+dot(v,right)*z,y=sunY+dot(v,down)*z;if(onScreen(x,y))ctx.fillRect(x,y,1.3,1.3)}
      ctx.restore();
      label('Oort cloud (predicted) · out to about 1.6 ly',sunX+Math.min(shell*.33,w*.22),sunY-Math.min(shell*.42,h*.3),cloudAlpha*notes,'#b9c8dc');
    }

    // Catalogued stars inside the sphere, down to the brightness limit for its size. Dimmer
    // stars drop out as the frame widens. The most luminous stay to the end.
    const starlight=ease(Math.log(reachLy/.3)/Math.log(8));
    if(starlight>.01){
      const soft=.5*edge,faintest=limit(edge/1.25),reference=Math.min(faintest,16),shrink=clamp(far*zl/300,.34,1);
      // Sizes run from the faintest star drawn to about the most luminous one this close,
      // so each scale has a few large stars among many small ones.
      // From far enough out that the arms show, a cataloged star is one more dot of the disc:
      // its glow closes down to a dot of about the model's size, a little larger for the most
      // luminous. Left at a star's size, the few hundred nearest the Sun stood in the galaxy as a
      // patch of big bright stars with nothing like it anywhere else in the disc.
      const settled=ease(Math.log(edge/5500)/Math.log(3));
      const range=reference-clamp(2-2.9*Math.log10(edge/8),-7.5,2),sized=m=>{const size=(.95+4.6*Math.min(1.1,(reference-m)/range)**1.8)*shrink;return size+(Math.min(size,.8+.12*size)-size)*settled};
      const r0=right[0]*zl,r1=right[1]*zl,r2=right[2]*zl,d0=down[0]*zl,d1=down[1]*zl,d2=down[2]*zl;
      ctx.save();
      for(let i=0;i<count&&starDistance[i]<edge;i++){
        const magnitude=starMagnitude[i];if(magnitude>=faintest)continue;
        const x=sunX+starX[i]*r0+starY[i]*r1+starZ[i]*r2;if(x<-12||x>w+12)continue;
        const y=sunY+starX[i]*d0+starY[i]*d1+starZ[i]*d2;if(y<-12||y>h+12)continue;
        const size=sized(magnitude);
        // A star brightens over a magnitude and a half as the limit passes it, and over half
        // the sphere's radius as the sphere reaches it.
        const alpha=starlight*Math.min(1,(faintest-magnitude)/1.5)*Math.min(1,(edge-starDistance[i])/soft);
        if(size<1.75){const dot=Math.max(.75,size);ctx.globalAlpha=alpha*Math.min(.95,.42+.45*size);ctx.fillStyle=inks[starInk[i]];ctx.fillRect(x-dot/2,y-dot/2,dot,dot)}
        else{ctx.globalAlpha=alpha;ctx.drawImage(sprites[starInk[i]],x-size*2.3,y-size*2.3,size*4.6,size*4.6)}
      }
      // Name the nearest stars first, then the ones that are brightest in our sky.
      const named=[];
      for(const [i,name,apparent] of starCatalog.names){
        if(starDistance[i]>=edge)break;
        const magnitude=starMagnitude[i];if(magnitude>=faintest-.3)continue;
        const x=sunX+starX[i]*r0+starY[i]*r1+starZ[i]*r2,y=sunY+starX[i]*d0+starY[i]*d1+starZ[i]*d2;
        if(!onScreen(x,y,20)||Math.hypot(x-sunX,y-sunY)<24)continue;
        const alpha=starlight*Math.min(1,(faintest-.3-magnitude)/1.5)*Math.min(1,(edge-starDistance[i])/soft);
        // Proxima sits beside Alpha Centauri at most scales, so the pair's name goes first.
        named.push({i,name,x,y,alpha,rank:edge<30?starDistance[i]+(name==='Proxima Centauri'?.3:0)-100:apparent});
      }
      named.sort((a,b)=>a.rank-b.rank);
      // Fewer names once the catalogued stars have shrunk to a small patch round the Sun.
      let written=0;const most=Math.min(narrow?7:14,Math.round(Math.min(edge,far)*zl/42));
      for(const star of named){
        if(written>=most)break;
        const i=star.i,size=sized(starMagnitude[i]);
        // The name comes with a stalk that drops from the star to the galactic plane.
        if(tag(i,star.name+' · '+lightYears(starDistance[i]),[starX[i],starY[i],starZ[i]],star.x,star.y,Math.min(1,star.alpha*2.2)*notes,'#d6e2d4',size+6,true))written++;
      }
      ctx.restore();
    }

    for(const arm of milkyWay.labels){
      const [fx,fy]=flat(arm.at),x=sunX+fx*zl,y=sunY+fy*zl;
      tag(arm.name,arm.name,arm.at,x,y,ease((sunToCentre*zl-150)/120)*notes,'#b8c7ee',4);
    }
    for(const mark of landmarks){
      const [fx,fy]=flat(mark.at),x=sunX+fx*zl,y=sunY+fy*zl,size=Math.hypot(fx,fy)*zl;
      const alpha=ease((2.3*reachLy-mark.d)/(.7*reachLy))*ease((size-26)/22)*notes;
      if(alpha<.02||!onScreen(x,y,8))continue;
      ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle='#e9c79a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y-4.5);ctx.lineTo(x+4.5,y);ctx.lineTo(x,y+4.5);ctx.lineTo(x-4.5,y);ctx.closePath();ctx.stroke();ctx.restore();
      tag(mark.name,mark.name+' · '+lightYears(mark.d),mark.at,x,y,alpha,'#ecd3ae',10);
    }

    // The planets, then the smaller bodies beyond them.
    const system=ease((30*z-3)/26),lanes=ease(Math.log(near*40/z)/Math.log(5));
    const outer=between(48*z,9,2.4*largest)*lanes;
    if(outer>.02){
      ctx.save();ctx.globalAlpha=outer*.55;ctx.fillStyle='#b9c6c9';
      for(const v of belt){const x=sunX+dot(v,right)*z,y=sunY+dot(v,down)*z;ctx.fillRect(x,y,1.1,1.1)}
      ctx.restore();
      label('Kuiper belt',sunX-46*z*.72-70,sunY+46*z*.3,outer*ease((48*z-90)/60),'#b9c6c9');
    }
    const detached=between(sedna.reach*z,16,5*largest);
    if(detached>.02){
      const [x,y]=flat(sedna.at);
      ctx.save();ctx.globalAlpha=detached*.5;ctx.strokeStyle='#d9a892';ctx.lineWidth=.9;trace(sedna.path,z);
      ctx.globalAlpha=detached;ctx.fillStyle=sedna.ink;ctx.beginPath();ctx.arc(sunX+x*z,sunY+y*z,sedna.size,0,tau);ctx.fill();ctx.restore();
      const [ax,ay]=flat(sedna.path[72]);
      label('Sedna’s orbit · farthest point 937 AU',sunX+ax*z+8,sunY+ay*z,detached*ease((sedna.reach*z-120)/80),'#e4bba8');
    }
    for(const probe of probes){
      const [fx,fy]=flat(probe.at),x=sunX+fx*z,y=sunY+fy*z,alpha=between(probe.distance*z,12,3.2*largest);
      if(alpha<.02)continue;
      ctx.save();ctx.globalAlpha=alpha*.5;ctx.strokeStyle='#bfe6a8';ctx.lineWidth=.8;ctx.setLineDash([3,4]);
      ctx.beginPath();ctx.moveTo(sunX,sunY);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=alpha;ctx.fillStyle='#d6f7c2';ctx.fillRect(x-1.5,y-1.5,3,3);ctx.restore();
      label(probe.name,x,y,alpha*ease((probe.distance*z-70)/50),'#d6f7c2',false,7);
    }
    // The interstellar visitors: the way each came in (faint), the way it has gone since
    // perihelion (brightening toward it, like a tail), and where it is today.
    for(const visitor of visitors){
      const [fx,fy]=flat(visitor.at),x=sunX+fx*z,y=sunY+fy*z,alpha=between(visitor.distance*z,14,3.2*largest);
      if(alpha<.02)continue;
      ctx.save();ctx.strokeStyle='#e6d3ff';ctx.lineCap='round';
      const points=visitor.path.map(p=>{const [px,py]=flat(p);return [sunX+px*z,sunY+py*z]}),n=points.length-1;
      ctx.globalAlpha=alpha*.2;ctx.lineWidth=.7;ctx.setLineDash([2,5]);ctx.beginPath();
      points.slice(0,visitor.inbound+1).forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();ctx.setLineDash([]);
      const bands=8,out=n-visitor.inbound;
      for(let b=0;b<bands;b++){
        const from=visitor.inbound+Math.floor(out*b/bands),to=visitor.inbound+Math.floor(out*(b+1)/bands),t=(b+1)/bands;
        ctx.globalAlpha=alpha*.8*t**1.7;ctx.lineWidth=.4+.8*t;ctx.beginPath();
        for(let i=from;i<=to;i++)i>from?ctx.lineTo(points[i][0],points[i][1]):ctx.moveTo(points[i][0],points[i][1]);
        ctx.stroke();
      }
      ctx.globalAlpha=alpha;ctx.fillStyle='#f1e6ff';ctx.beginPath();ctx.moveTo(x,y-2.8);ctx.lineTo(x+2.8,y);ctx.lineTo(x,y+2.8);ctx.lineTo(x-2.8,y);ctx.closePath();ctx.fill();ctx.restore();
      label(visitor.name,x,y,alpha*ease((visitor.distance*z-60)/50),'#e6d3ff',false,8);
    }
    if(system*lanes>.01||outer>.02){
      ctx.save();ctx.lineWidth=.9;
      for(const planet of planets){
        const size=planet.reach*z,shown=planet===pluto?outer:system*lanes;
        if(size<2||(size>14*largest&&planet!==earth))continue;
        const alpha=shown*ease((size-2)/10);if(alpha<.01)continue;
        ctx.globalAlpha=alpha*.5;ctx.strokeStyle='#c7d6cb';trace(planet.path,z);
        if(planet===earth)continue;
        const [fx,fy]=flat(planet.at),x=sunX+fx*z,y=sunY+fy*z;
        ctx.globalAlpha=alpha;ctx.fillStyle=planet.ink;ctx.beginPath();ctx.arc(x,y,planet.size,0,tau);ctx.fill();
        label(planet.name,x,y,alpha*ease((size-40)/40),'#d6e2d4',false,planet.size+6);
      }
      ctx.restore();
    }
    if(system*lanes>.01){
      // The Sun's true disc is smaller than a pixel at this scale, so its glow marks it.
      const core=Math.max(1.6,sunRadius*z),halo=core*4+16*system*lanes;
      const glow=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,halo);
      glow.addColorStop(0,'#fff8e0');glow.addColorStop(.18,'#ffe2a0d0');glow.addColorStop(.5,'#ffb86a40');glow.addColorStop(1,'#ff9d5a00');
      ctx.save();ctx.globalAlpha=system*lanes;ctx.fillStyle=glow;ctx.fillRect(sunX-halo,sunY-halo,2*halo,2*halo);ctx.restore();
    }
    if(lanes*(1-beyond)>.01)studioScenes.sunMark(ctx,sunX,sunY,lanes*(1-beyond),1-system);

    const lunar=moonDistance*z,moonAlpha=ease((2.4*largest-lunar)/largest)*ease((lunar-5)/22);
    if(moonAlpha>.01){
      const [mx,my]=flat(moon);
      ctx.save();ctx.globalAlpha=moonAlpha*.5;ctx.strokeStyle='#c7d6cb';ctx.lineWidth=.9;trace(moonPath,z,earthAt[0],earthAt[1]);
      // Once the Moon's true disc is a few pixels across it is drawn lit, with its phase and its
      // near side's maria (moon.js); the Sun is effectively in the same direction from it as from
      // the Earth. Smaller than that it is a dot of at least 1.6 px.
      const trueR=.2727*earthRadius*z,moonR=Math.max(1.6,trueR);
      if(typeof studioMoon!=='undefined'&&trueR>2.2){
        const sunward=(n=>earth.at.map(v=>-v/n))(Math.hypot(...earth.at)||1),earthward=(n=>moon.map(v=>-v/n))(Math.hypot(...moon)||1);
        studioMoon.draw(ctx,earthAt[0]+mx*z,earthAt[1]+my*z,trueR,v=>screen(fromEquatorial(v)),screen(earthward),screen(sunward),moonAlpha);
      }else{ctx.globalAlpha=moonAlpha;ctx.fillStyle='#d9d6cc';ctx.beginPath();ctx.arc(earthAt[0]+mx*z,earthAt[1]+my*z,moonR,0,tau);ctx.fill()}
      ctx.restore();
      label('Moon',earthAt[0]+mx*z,earthAt[1]+my*z,moonAlpha*ease((lunar-60)/60),'#d6e2d4',true,8);
    }

    // The marks fade with the pull back itself, not with the slider's zoom.
    const radius=earthRadius*z,shown=earthRadius*reach/natural/globe;
    if(radius>.7){
      ctx.save();
      // The satellites stay until the geostationary ring (6.61 Earth radii out) has shrunk to
      // about 12 px across the frame's pull back; the low ones merge into a cloud well before
      // that (see worldAtlas.fold).
      worldAtlas.fold(ctx,w,h,{k:fold,x:earthAt[0],y:earthAt[1],r:radius*(1+.3*Math.sin(fold*Math.PI)),flat:sheet,marks:clamp((shown-.2)/.5),sky:clamp((6.61*shown*globe-12)/26),frame:rims*clamp(shown)});
      ctx.restore();
    }
    const point=(1-clamp((radius-1.2)/1.6))*system;
    if(point>.01){
      ctx.save();ctx.globalAlpha=point;ctx.fillStyle=earth.ink;ctx.beginPath();ctx.arc(earthAt[0],earthAt[1],earth.size,0,tau);ctx.fill();ctx.restore();
    }
    label('Earth',earthAt[0],earthAt[1],(1-clamp((radius-4)/14))*system*ease((z-40)/40),'#d6e2d4',true,Math.max(radius,earth.size)+7);
    let fading=false;
    for(const [key,t] of tags){
      const want=t.frame===frame&&t.on?1:0;
      if(t.frame!==frame)t.alpha*=notes>0?1:0;
      t.shown+=clamp(want-t.shown,-step,step);
      if(t.shown<=0&&!want){tags.delete(key);continue}
      if(t.shown!==want)fading=true;
      const x=sunX+dot(t.v,right)*zl,y=sunY+dot(t.v,down)*zl,alpha=t.alpha*t.shown;
      if(alpha<.01)continue;
      if(t.stalk){
        const footX=sunX+(t.v[0]*right[0]+t.v[1]*right[1])*zl,footY=sunY+(t.v[0]*down[0]+t.v[1]*down[1])*zl;
        ctx.save();ctx.globalAlpha=alpha*.26;ctx.strokeStyle='#aebfd2';ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(footX,footY);ctx.stroke();ctx.fillStyle='#aebfd2';ctx.fillRect(footX-1,footY-1,2,2);ctx.restore();
      }
      write(t.text,x+t.dx,y+t.dy,alpha,t.ink);
    }
    if(fading)wake();
    return distance(w/z);
  }
  // The finished galaxy, turning slowly, for the first shot of the reel. t runs 0 to 1.
  // The still posters call this with other trailing arguments, so only a real pose counts.
  const galaxy=(ctx,w,h,t,pose,turn)=>draw(ctx,w,h,0,1,null,.3*t,1+.1*t,0,pose?.normal?pose:null,Array.isArray(turn)?turn:null);
  // The disc's axis in the pull back's last frame, as screen right, screen down and depth.
  const discAxis=[second[0][2],second[1][2],second[2][2]];
  return {draw,galaxy,axis:discAxis,length,dots:discDots,onFrame(fn){wake=fn},
    span,finished,view:second,centre:centreAt,galaxies:otherGalaxies,picture,beyond(k){beyond=clamp(k)}};
})();
