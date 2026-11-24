// Scroll position is the time source for the procedural shots.
const studioScenes = (() => {
  const tau=2*Math.PI;
  let seed=137;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  const dust=Array.from({length:300},()=>[random(),random(),random()]);
  function glow(ctx,x,y,r,stops){const g=ctx.createRadialGradient(x,y,0,x,y,r);for(const [at,color] of stops)g.addColorStop(at,color);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)}
  function motes(ctx,w,h){
    for(const [x,y,s] of dust){ctx.fillStyle=s>.8?'#dedbd28c':'#cad4c43a';ctx.fillRect(x*w,y*h,s>.8?1.3:.75,.9)}
  }
  function field(ctx,w,h,bg){ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);motes(ctx,w,h)}
  // The galaxy shot frames a disc 100,000 light-years across, seen obliquely. The Sun is
  // 26,700 light-years from its centre.
  const sun={r:.534,angle:1.02};
  // Where the finished galaxy shot places the Sun, and the disc's radius in pixels.
  function sunPoint(w,h,p,wide){
    const framing=Number(wide),tilt=-.32+.16*p,flat=.44+.15*p;
    const s=Math.min(w*.48,h*(.84-.06*framing))*(.94+.28*p),angle=sun.angle+.33*p+.1*p/(sun.r+.2);
    const ax=sun.r*Math.cos(angle),ay=sun.r*Math.sin(angle)*flat;
    return {x:w*(.5+.1*framing)+s*(ax*Math.cos(tilt)-ay*Math.sin(tilt)),y:h*(.49-.06*framing)+s*(ax*Math.sin(tilt)+ay*Math.cos(tilt)),radius:s};
  }
  // The oblique view the galaxy shot takes of its disc, and where the Sun sits on it.
  const galaxyView=p=>({angle:sun.angle+.33*p+.1*p/(sun.r+.2),flat:.44+.15*p,tilt:-.32+.16*p,radius:sun.r});
  function sunMark(ctx,x,y,alpha,ring=1){
    ctx.save();ctx.globalAlpha*=alpha;
    ctx.fillStyle='#fff4d6';ctx.beginPath();ctx.arc(x,y,1.6,0,tau);ctx.fill();
    ctx.font='11px ui-monospace, Consolas, monospace';ctx.textBaseline='middle';ctx.fillStyle='#ffeecb';ctx.fillText('Sun',x+22+14*ring,y);
    if(ring>0){
      ctx.globalAlpha*=ring;ctx.strokeStyle='#ffe3a8';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(x,y,9,0,tau);ctx.stroke();ctx.beginPath();ctx.moveTo(x+9,y);ctx.lineTo(x+30,y);ctx.stroke();
    }
    ctx.restore();
  }
  // Each gear: place along the axle, radius and number of teeth. The axle leans by gearLean.
  const parts=[[-.74,.36,13],[-.49,.69,21],[-.12,.93,28],[.22,.70,21],[.52,.52,16],[.74,.32,12]],gearLean=-.39,gearFlat=.43;
  // The view of the gear train. tilt is the direction of a gear face's long axis on screen,
  // flat its short axis over its long one (1 looks straight down the axle, where the gears
  // sit one inside another), and scale the size. `rest` is the view the shots settle in.
  const rest={tilt:gearLean+Math.PI/2,flat:gearFlat,scale:1};
  function gearFrame(w,h,p,wide,view){
    const s=Math.min(w*(wide?.38:.4),h*.7)*view.scale;
    // The axle shortens as the view comes round to look along it.
    return {s,cx:w*(wide?.66:.53),cy:h*(wide?.43:.5),lean:view.tilt-Math.PI/2,sq:view.flat,along:s*(.78+.95*p)*Math.sqrt((1-view.flat**2)/(1-gearFlat**2))};
  }
  // The visitor's rotation applied to a gear view: the axle's direction is turned, and the
  // tilt and flatness are read back from it.
  function turnView(view,turn){
    if(!turn)return view;
    const s=Math.sqrt(Math.max(0,1-view.flat**2)),axis=view.axis||[s*Math.sin(view.tilt),-s*Math.cos(view.tilt),-view.flat];
    const a=turn.map(row=>row[0]*axis[0]+row[1]*axis[1]+row[2]*axis[2]),across=Math.hypot(a[0],a[1]);
    return {...view,axis:a,flat:Math.min(.999,Math.abs(a[2])),tilt:across>1e-4?Math.atan2(a[1],a[0])+Math.PI/2:view.tilt};
  }
  // The ellipse the largest gear's face makes on screen.
  function gearDisc(w,h,p,wide,view=rest){
    const {s,cx,cy,lean,along}=gearFrame(w,h,p,wide,view),[d,ratio]=parts[2];
    return {x:cx+d*along*Math.cos(lean),y:cy+d*along*Math.sin(lean),r:s*ratio,flat:view.flat,tilt:view.tilt};
  }
  // Draw concentric machined gears in an oblique projection. Scroll separates the parts.
  function gears(ctx,w,h,p,wide,sketch=false,view=rest){
    field(ctx,w,h,sketch?'#13252b':'#101918');
    const {s,cx,cy,lean,sq,along}=gearFrame(w,h,p,wide,view);
    if(sketch){
      const spacing=Math.max(20,s/8);
      ctx.beginPath();
      for(let x=cx%spacing;x<w;x+=spacing){ctx.moveTo(x,0);ctx.lineTo(x,h)}
      for(let y=cy%spacing;y<h;y+=spacing){ctx.moveTo(0,y);ctx.lineTo(w,y)}
      ctx.strokeStyle='#8faeae32';ctx.lineWidth=.7;ctx.stroke();
    }else glow(ctx,cx,cy,s*1.55,[[0,'#5374616a'],[1,'#19342800']]);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(lean);
    function project(ax,r,angle){return [ax+sq*r*Math.cos(angle),r*Math.sin(angle)]}
    function ring(ax,r,color){
      ctx.beginPath();ctx.ellipse(ax,0,r*sq,r,0,0,tau);ctx.strokeStyle=color;ctx.lineWidth=.8;ctx.stroke();
    }
    ctx.setLineDash([4,6]);ctx.strokeStyle='#d3e5ca80';ctx.beginPath();ctx.moveTo(-s*1.8,0);ctx.lineTo(s*1.8,0);ctx.stroke();ctx.setLineDash([]);
    for(const [d,ratio,teeth] of parts){
      const ax=d*along,r=s*ratio,th=s*.08*along/(s*(.78+.95*p));
      const pts=[];
      for(let k=0;k<teeth;k++)for(const [step,tip] of [[0,.9],[.17,.9],[.27,1],[.65,1],[.77,.9]])pts.push(project(ax,r*tip,(k+step)*tau/teeth+p*.2));
      function outline(shift){ctx.beginPath();pts.forEach(([a,b],i)=>{if(i===0)ctx.moveTo(a+shift,b);else ctx.lineTo(a+shift,b)});ctx.closePath()}
      if(sketch){ring(ax,r*1.12,'#b4cccc65');ring(ax,r*1.15,'#b4cccc30')}
      outline(-th);ctx.fillStyle=sketch?'#15292d80':'#18261f';ctx.fill();ctx.strokeStyle='#668376';ctx.stroke();
      for(let i=0;i<pts.length;i+=5){
        const [a,b]=pts[i];ctx.strokeStyle='#8dada463';ctx.beginPath();ctx.moveTo(a-th,b);ctx.lineTo(a,b);ctx.stroke();
      }
      outline(0);const metal=ctx.createLinearGradient(ax-r*.5,-r,ax+r*.55,r);
      metal.addColorStop(0,'#b9cbb2');metal.addColorStop(.28,'#71877a');metal.addColorStop(.49,'#354b40');metal.addColorStop(.78,'#738476');metal.addColorStop(1,'#3c5448');
      ctx.fillStyle=sketch?'#203c4170':metal;ctx.fill();ctx.strokeStyle=sketch?'#d1e5dc':'#c8d8c1';ctx.stroke();
      for(const ratio of [.83,.79,.5,.46,.28])ring(ax,r*ratio,'#cfddc780');
      for(let k=0;k<7;k++){const [x,y]=project(ax,r*.64,k*tau/7+p*.2);ctx.beginPath();ctx.ellipse(x,y,r*.102*sq,r*.10,0,0,tau);ctx.fillStyle='#1b2c24';ctx.fill();ctx.strokeStyle='#bacbb18a';ctx.stroke()}
      ctx.beginPath();ctx.ellipse(ax,0,r*.233*sq,r*.23,0,0,tau);ctx.fillStyle='#17251f';ctx.fill();ctx.strokeStyle='#bfd0b8';ctx.stroke();
    }
    ctx.restore();
  }
  function assembly(ctx,w,h,p,wide){gears(ctx,w,h,1-p,wide,true)}
  // One synthetic heartbeat, drawn as it would appear on each of the twelve standard
  // leads. Every deflection is a Gaussian: [centre in the beat, width, height].
  const deflections=[[.18,.026],[.338,.0085],[.36,.011],[.384,.0095],[.6,.048]];
  const leads=[  // P, Q, R, S, T heights for each lead
    [.09,-.06,.70,-.10,.22],[.15,-.09,1.0,-.14,.33],[.06,-.04,.42,-.09,.11],[-.12,.05,-.80,.06,-.28],
    [.04,-.05,.34,-.08,.09],[.11,-.07,.68,-.11,.21],[.05,0,.20,-.95,-.10],[.06,0,.36,-1.15,.42],
    [.07,0,.72,-.88,.52],[.08,-.07,1.2,-.42,.48],[.08,-.09,1.1,-.19,.38],[.08,-.09,.88,-.09,.29]];
  function heartbeat(lead,phase){
    phase-=Math.floor(phase);let y=0;
    for(let i=0;i<5;i++){const d=(phase-deflections[i][0])/deflections[i][1];if(d>-4&&d<4)y+=lead[i]*Math.exp(-.5*d*d)}
    return y;
  }
  const beats=3.4,samples=560,waveTilt=-.12;
  // Where the finished chart sits in the frame: its middle, half its width and its height.
  const chartFrame=(w,h,wide)=>({x:w*.54,y:h*(wide?.46:.51),sx:w*(wide?.48:.50),sy:Math.min(h*.39,w*.28)});
  // Sample `t` of lead `j` on the finished chart, in pixels before its tilt: how far along, how
  // far down the stack of leads, and how far its beat swings it.
  function chartSample(j,t,p,sx,sy){
    const z=j/(leads.length-1),edge=Math.min(1,t/.1,(1-t)/.1),envelope=edge*edge*(3-2*edge);
    return [(2*t-1)*sx+z*sx*.12,(z-.5)*1.72*sy,-heartbeat(leads[j],t*beats-p*1.6+j*.013)*envelope*.24*sy];
  }
  function chartPaper(ctx,w,h,wide){
    const {x,y,sx,sy}=chartFrame(w,h,wide);
    glow(ctx,x,y,Math.max(sx*.8,sy*1.5),[[0,'#7065a338'],[1,'#31254800']]);
    // The blueprint's grid stays in place and becomes the chart paper.
    const gearSize=Math.min(w*.38,h*.7),gx=w*.66,gy=h*.43,spacing=Math.max(20,gearSize/8);
    ctx.beginPath();
    for(let a=gx%spacing;a<w;a+=spacing){ctx.moveTo(a,0);ctx.lineTo(a,h)}
    for(let b=gy%spacing;b<h;b+=spacing){ctx.moveTo(0,b);ctx.lineTo(w,b)}
    ctx.strokeStyle='#9c94c61f';ctx.lineWidth=.7;ctx.stroke();
  }
  const sweepAt=p=>(.22+.9*p)%1;
  function cardiac(ctx,w,h,p,wide,unfold=1,turn=null){
    field(ctx,w,h,'#14131d');
    const {x,y,sx,sy}=chartFrame(w,h,wide);
    chartPaper(ctx,w,h,wide);
    // Each of the drawing's ring outlines opens into one lead. Both paths have the same
    // number of samples, so a particular point follows one continuous trajectory.
    const gearSize=Math.min(w*.38,h*.7),gx=w*.66,gy=h*.43,gearTilt=-.39,rows=leads.length;
    const cosG=Math.cos(gearTilt),sinG=Math.sin(gearTilt),cosW=Math.cos(waveTilt),sinW=Math.sin(waveTilt);
    const sweep=sweepAt(p),lineWidth=Math.max(1,h/520);
    ctx.save();ctx.lineJoin='round';
    leads.forEach((lead,j)=>{
      const z=j/(rows-1),ink='hsla('+(160+125*z)+',72%,'+(70+7*Math.sin(z*Math.PI))+'%,';
      const points=new Float32Array(2*(samples+1));
      for(let i=0;i<=samples;i++){
        const t=i/samples,[wx,down,swing]=chartSample(j,t,p,sx,sy),wy=down+swing;
        let px=x+wx*cosW-wy*sinW,py=y+wx*sinW+wy*cosW;
        if(unfold<1){
          const angle=t*tau-Math.PI/2,r=gearSize*(.27+.65*z);
          const dx=-gearSize*.09+.43*r*Math.cos(angle),dy=r*Math.sin(angle);
          px=(gx+dx*cosG-dy*sinG)*(1-unfold)+px*unfold;
          py=(gy+dx*sinG+dy*cosG)*(1-unfold)+py*unfold;
        }
        if(turn){
          // The twelve leads are a stack in depth, turned about the middle of the chart.
          const dx=px-x,dy=py-y,dz=(z-.5)*sy*1.6;
          px=x+turn[0][0]*dx+turn[0][1]*dy+turn[0][2]*dz;py=y+turn[1][0]*dx+turn[1][1]*dy+turn[1][2]*dz;
        }
        points[2*i]=px;points[2*i+1]=py;
      }
      const stroke=(from,to)=>{ctx.beginPath();ctx.moveTo(points[2*from],points[2*from+1]);for(let i=from+1;i<=to;i++)ctx.lineTo(points[2*i],points[2*i+1]);ctx.stroke()};
      ctx.strokeStyle=ink+(.5+.3*Math.sin(z*Math.PI))+')';ctx.lineWidth=lineWidth;stroke(0,samples);
      if(unfold>.6){
        // A brighter stretch of trace ends at the point being written.
        const head=Math.round(sweep*samples),tail=Math.max(0,head-Math.round(samples*.16));
        ctx.globalAlpha=(unfold-.6)/.4;ctx.strokeStyle=ink+'.95)';ctx.lineWidth=lineWidth*1.7;
        ctx.shadowColor=ink+'.9)';ctx.shadowBlur=12;stroke(tail,head);
        ctx.fillStyle='#f4fff2';ctx.beginPath();ctx.arc(points[2*head],points[2*head+1],lineWidth*2.1,0,tau);ctx.fill();
        ctx.globalAlpha=1;ctx.shadowBlur=0;
      }
    });
    ctx.restore();
  }
  // What the shot after the chart needs to carry its traces on: `time` is the chart's own
  // clock for a given point of the cardiac shot.
  const chart={leads:leads.length,samples,tilt:waveTilt,frame:chartFrame,sample:chartSample,paper:chartPaper,sweep:sweepAt,time:p=>.18+.44*p};
  // One of the twelve engraved lines in the contact section, as screen points [x0,y0,x1,y1,...].
  function codaTrace(w,h,p,j,count=420){
    const mobile=w<700,span=w*(mobile?.83:.69),height=h*(mobile?.16:.25),z=j/(leads.length-1);
    const ox=w*(mobile?.68:.78),oy=h*(mobile?.25:.46),cos=Math.cos(-.26+.12*p),sin=Math.sin(-.26+.12*p);
    const points=new Float32Array(2*(count+1));
    for(let i=0;i<=count;i++){
      const t=i/count,edge=Math.min(1,t/.12,(1-t)/.12),env=edge*edge*(3-2*edge);
      const px=(t-.5)*span,py=(-heartbeat(leads[j],t*2.6+p*.5)*env*(.2-.07*p)+(z-.5)*1.5)*height;
      points[2*i]=ox+px*cos-py*sin;points[2*i+1]=oy+px*sin+py*cos;
    }
    return points;
  }
  function coda(ctx,w,h,p){
    // The heart traces as engraved lines behind the contact section.
    ctx.save();
    leads.forEach((lead,j)=>{
      const z=j/(leads.length-1),points=codaTrace(w,h,p,j);
      ctx.beginPath();ctx.strokeStyle='rgba(172,212,188,'+(.2+.3*Math.sin(Math.PI*z))+')';ctx.lineWidth=.8;
      for(let i=0;i<points.length;i+=2){if(i===0)ctx.moveTo(points[i],points[i+1]);else ctx.lineTo(points[i],points[i+1])}
      ctx.stroke();
    });
    ctx.restore();
  }
  return {field,motes,galaxyView,sunPoint,sunMark,gears,gearDisc,gearRest:rest,turnView,assembly,cardiac,chart,coda};
})();
