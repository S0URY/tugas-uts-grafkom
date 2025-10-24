// ====== tiny mat4 utilities (column-major) ======
const M4 = {
    I: ()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
    mul(a,b){ // a*b
      const o=new Float32Array(16);
      for(let c=0;c<4;c++){
        for(let r=0;r<4;r++){
          o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
        }
      }
      return o;
    },
    T(x,y,z){const m=M4.I(); m[12]=x; m[13]=y; m[14]=z; return m;},
    S(x,y,z){const m=M4.I(); m[0]=x; m[5]=y; m[10]=z; return m;},
    Rx(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I(); m[5]=c;m[6]=s;m[9]=-s;m[10]=c; return m;},
    Ry(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I(); m[0]=c;m[2]=-s;m[8]=s;m[10]=c; return m;},
    Rz(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I(); m[0]=c;m[1]=s;m[4]=-s;m[5]=c; return m;},
    persp(fovy,aspect,near,far){
      const f=1/Math.tan(fovy/2), nf=1/(near-far);
      const m=new Float32Array(16);
      m[0]=f/aspect; m[5]=f; m[10]=(far+near)*nf; m[11]=-1; m[14]=2*far*near*nf;
      return m;
    },
    look(eye,ctr,up){
      // compute view = inverse of [R | t]
      const zx=eye[0]-ctr[0], zy=eye[1]-ctr[1], zz=eye[2]-ctr[2];
      let zl=Math.hypot(zx,zy,zz); const z=[zx/zl, zy/zl, zz/zl];
      const xx=up[1]*z[2]-up[2]*z[1], xy=up[2]*z[0]-up[0]*z[2], xz=up[0]*z[1]-up[1]*z[0];
      let xl=Math.hypot(xx,xy,xz); const x=[xx/xl, xy/xl, xz/xl];
      const y=[z[1]*x[2]-z[2]*x[1], z[2]*x[0]-z[0]*x[2], z[0]*x[1]-z[1]*x[0]];
      const m=M4.I();
      m[0]=x[0]; m[4]=x[1]; m[8]=x[2];
      m[1]=y[0]; m[5]=y[1]; m[9]=y[2];
      m[2]=z[0]; m[6]=z[1]; m[10]=z[2];
      m[12]=-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]);
      m[13]=-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]);
      m[14]=-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]);
      return m;
    }
  };
  
  // ====== WebGL setup ======
  const canvas = document.querySelector('#c');
  const gl = canvas.getContext('webgl2', {antialias:true});
  if(!gl) alert('WebGL2 not supported');
  
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio||1);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h; gl.viewport(0,0,w,h);
    }
  }
  window.addEventListener('resize', resize);
  resize();
  
  // ====== Shaders (flat-color + simple lambert) ======
  const VS = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNor;
  uniform mat4 uP, uV, uM;
  out vec3 vN; out vec3 vWPos;
  void main(){
    vec4 wpos = uM * vec4(aPos,1.0);
    vWPos = wpos.xyz;
    vN = mat3(uM) * aNor;
    gl_Position = uP * uV * wpos;
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 vN; in vec3 vWPos;
  out vec4 o;
  uniform vec3 uColor;
  uniform vec3 uLightDir;  // world dir
  void main(){
    vec3 N = normalize(vN);
    float ndl = max(0.2, dot(N, normalize(-uLightDir))*0.9 + 0.1);
    o = vec4(uColor * ndl, 1.0);
  }`;
  function makeProgram(vs,fs){
    const p = gl.createProgram();
    const sv = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(sv,vs); gl.compileShader(sv);
    if(!gl.getShaderParameter(sv, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(sv);
    const sf = gl.createShader(gl.FRAGMENT_SHADER); gl.shaderSource(sf,fs); gl.compileShader(sf);
    if(!gl.getShaderParameter(sf, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(sf);
    gl.attachShader(p,sv); gl.attachShader(p,sf); gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw gl.getProgramInfoLog(p);
    return p;
  }
  const program = makeProgram(VS, FS);
  gl.useProgram(program);
  const loc = {
    uP: gl.getUniformLocation(program,'uP'),
    uV: gl.getUniformLocation(program,'uV'),
    uM: gl.getUniformLocation(program,'uM'),
    uColor: gl.getUniformLocation(program,'uColor'),
    uLightDir: gl.getUniformLocation(program,'uLightDir'),
  };
  
  // ====== Primitive builders (positions + normals) ======
  function createBox(w=1,h=1,d=1){
    const x=w/2,y=h/2,z=d/2;
    const P=[], N=[], push=(nx,ny,nz, a,b,c,d)=>{ // quad two tris
      const n=[nx,ny,nz];
      const v=[a,b,c,d];
      const idx=[0,1,2, 0,2,3];
      for(let i of idx){
        P.push(...v[i]);
        N.push(...n);
      }
    };
    push( 0, 0, 1,  [-x,-y, z],[ x,-y, z],[ x, y, z],[-x, y, z]);
    push( 0, 0,-1,  [ x,-y,-z],[-x,-y,-z],[-x, y,-z],[ x, y,-z]);
    push( 1, 0, 0,  [ x,-y, z],[ x,-y,-z],[ x, y,-z],[ x, y, z]);
    push(-1, 0, 0,  [-x,-y,-z],[-x,-y, z],[-x, y, z],[-x, y,-z]);
    push( 0, 1, 0,  [-x, y, z],[ x, y, z],[ x, y,-z],[-x, y,-z]);
    push( 0,-1, 0,  [-x,-y,-z],[ x,-y,-z],[ x,-y, z],[-x,-y, z]);
    return meshFrom(P,N);
  }
  function createCylinder(rt=0.5, rb=0.5, h=1, seg=24){
    const P=[],N=[];
    const y0=-h/2, y1= h/2;
    for(let i=0;i<seg;i++){
      const a0=i/seg*2*Math.PI, a1=(i+1)/seg*2*Math.PI;
      const c0=Math.cos(a0), s0=Math.sin(a0), c1=Math.cos(a1), s1=Math.sin(a1);
      const v00=[rb*c0,y0,rb*s0], v01=[rb*c1,y0,rb*s1];
      const v10=[rt*c0,y1,rt*s0], v11=[rt*c1,y1,rt*s1];
      // side (two tris)
      const n0=[c0,(rb-rt)/h,s0], n1=[c1,(rb-rt)/h,s1];
      // normalize normals:
      const ln0=1/Math.hypot(...n0), ln1=1/Math.hypot(...n1);
      n0[0]*=ln0; n0[1]*=ln0; n0[2]*=ln0; n1[0]*=ln1; n1[1]*=ln1; n1[2]*=ln1;
      P.push(...v00,...v10,...v11,  ...v00,...v11,...v01);
      N.push(...n0,...n0,...n1,     ...n0,...n1,...n1);
      // caps
      const up=[0,1,0], dn=[0,-1,0];
      P.push(0,y1,0, ...v11, ...v10); N.push(...up,...up,...up);
      P.push(0,y0,0, ...v00, ...v01); N.push(...dn,...dn,...dn);
    }
    return meshFrom(P,N);
  }
  function createSphere(r=0.5, lat=16, lon=24){
    const P=[],N=[];
    for(let i=0;i<lat;i++){
      const t0=i/lat*Math.PI, t1=(i+1)/lat*Math.PI;
      const y0=r*Math.cos(t0-Math.PI/2), y1=r*Math.cos(t1-Math.PI/2); // shifted
      const rr0=r*Math.sin(t0), rr1=r*Math.sin(t1);
      for(let j=0;j<lon;j++){
        const p0=j/lon*2*Math.PI, p1=(j+1)/lon*2*Math.PI;
        const a=[rr0*Math.cos(p0), y0, rr0*Math.sin(p0)];
        const b=[rr1*Math.cos(p0), y1, rr1*Math.sin(p0)];
        const c=[rr1*Math.cos(p1), y1, rr1*Math.sin(p1)];
        const d=[rr0*Math.cos(p1), y0, rr0*Math.sin(p1)];
        // two triangles a-b-c, a-c-d
        P.push(...a,...b,...c,  ...a,...c,...d);
        const n = (v)=>{const l=1/Math.hypot(v[0],v[1],v[2]); return [v[0]*l,v[1]*l,v[2]*l];};
        N.push(...n(a),...n(b),...n(c),  ...n(a),...n(c),...n(d));
      }
    }
    return meshFrom(P,N);
  }
  function meshFrom(P,N){
    const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
    const vbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
    const f32=new Float32Array(P.length+N.length);
    f32.set(P,0); f32.set(N,P.length);
    gl.bufferData(gl.ARRAY_BUFFER,f32,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,P.length*4);
    return {vao, count:P.length/3};
  }
  
  // ====== Colors ======
  const C = {
    leaf:  [0x3b/255, 0xaa/255, 0x3b/255],
    seed:  [1.0, 0.953, 0.855],
    olive: [0x5a/255, 0x3a/255, 0x88/255],
    wood:  [0xa9/255, 0x71/255, 0x2c/255],
    eye:   [0.14,0.22,0.3]
  };
  
  // ====== Build primitive VAOs ======
  const GEO = {
    box:  createBox(1,1,1),
    sph:  createSphere(0.5, 18, 28),
    cyl:  createCylinder(0.5,0.5,1, 36),
    cone: createCylinder(0.0,0.5,1, 36)
  };
  
  // ====== Helper: draw one piece ======
  function draw(mesh, M, color){
    gl.uniformMatrix4fv(loc.uM,false,M);
    gl.uniform3fv(loc.uColor, color);
    gl.bindVertexArray(mesh.vao);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }
  
  // ====== Scene assembly (following the plan) ======
  function partTorsoCore(){ // sphere → ellipsoid
    let M = M4.mul(M4.T(0,0.9,0), M4.S(0.26,0.32,0.22));
    draw(GEO.sph, M, C.seed);
  }
  function partBellySeed(){
    let M = M4.mul(M4.T(0,0.62,0), M4.S(0.18,0.24,0.18));
    draw(GEO.sph, M, C.seed);
  }
  function partNeck(){
    let M = M4.mul(M4.T(0,1.05,0), M4.S(0.12,0.18,0.12));
    draw(GEO.cyl, M, C.leaf);
  }
  function partHead(){
    let M = M4.mul(M4.T(0,1.22,0), M4.S(0.16,0.2,0.16));
    draw(GEO.sph, M, C.seed);
  }
  function partCrown(){
    const segs=[
      {t:[0,1.34,0], rz:0,   s:[0.16,0.22,0.16]},
      {t:[0,1.47,0], rz:-10, s:[0.13,0.18,0.13]},
      {t:[0,1.58,0], rz:8,   s:[0.10,0.14,0.10]},
    ];
    for(const s of segs){
      let M = M4.mul(M4.T(...s.t), M4.mul(M4.Rz(s.rz*Math.PI/180), M4.S(0.0,1,1)));
      M = M4.mul(M, M4.S(1,1,1)); // tip will be cone pointing +Y
      M = M4.mul(M, M4.S(s.s[0], s.s[1], s.s[2]));
      draw(GEO.cone, M, C.leaf);
    }
  }
  function partShoulderCross(){
    const L = {t:[0,1.02,0], rz:+18, s:[0.18,0.5,0.18]};
    const R = {t:[0,1.02,0], rz:-18, s:[0.18,0.5,0.18]};
    for(const p of [L,R]){
      let M = M4.mul(M4.T(...p.t), M4.Rz(p.rz*Math.PI/180));
      M = M4.mul(M, M4.Rx(Math.PI/2)); // lay cone sideways
      M = M4.mul(M, M4.S(p.s[0], p.s[1], p.s[2]));
      draw(GEO.cone, M, C.leaf);
    }
  }
  function partArms(){
    // left arm bars (boxes)
    const bars = [
      {t:[-0.45,0.92,0], s:[0.55,0.08,0.12], r:0},
      {t:[-0.95,0.92,0], s:[0.35,0.08,0.12], r:0},
      {t:[-1.25,0.92,0], s:[0.25,0.08,0.12], r:-5}
    ];
    for(const b of bars){
      let M = M4.mul(M4.T(...b.t), M4.Rz(b.r*Math.PI/180));
      M = M4.mul(M, M4.S(...b.s));
      draw(GEO.box, M, C.leaf);
    }
    // tip wedge + inner wedge (cones)
    let M1 = M4.mul(M4.T(-1.45,0.92,0), M4.Rz(-Math.PI/2));
    M1 = M4.mul(M1, M4.S(0.14,0.18,0.14));
    draw(GEO.cone, M1, C.leaf);
    let M2 = M4.mul(M4.T(-0.2,0.92,0), M4.Rz(+Math.PI/2));
    M2 = M4.mul(M2, M4.S(0.16,0.16,0.16));
    draw(GEO.cone, M2, C.leaf);
  
    // mirror to right
    function mirrorX(M){ const mm=M4.I(); mm[0]=-1; return M4.mul(M, mm); }
    const barsR = bars.map(b=>({t:[-b.t[0], b.t[1], b.t[2]], s:b.s, r:-b.r}));
    for(const b of barsR){
      let M = M4.mul(M4.T(...b.t), M4.Rz(b.r*Math.PI/180));
      M = M4.mul(M, M4.S(...b.s));
      draw(GEO.box, M, C.leaf);
    }
    let M3 = M4.mul(M4.T(1.45,0.92,0), M4.Rz(+Math.PI/2));
    M3 = M4.mul(M3, M4.S(0.14,0.18,0.14));
    draw(GEO.cone, M3, C.leaf);
    let M4i = M4.mul(M4.T(0.2,0.92,0), M4.Rz(-Math.PI/2));
    M4i = M4.mul(M4i, M4.S(0.16,0.16,0.16));
    draw(GEO.cone, M4i, C.leaf);
  }
  function partOlives(){
    const pts=[-0.35,-0.75,-1.10].map(x=>[x,0.84, 0.0]);
    for(const p of pts){
      let M = M4.mul(M4.T(p[0],p[1], p[2]+(Math.random()*0.08-0.04)), M4.S(0.11,0.14,0.11));
      draw(GEO.sph, M, C.olive);
    }
    for(const p of pts){
      let M = M4.mul(M4.T(-p[0],p[1], p[2]+(Math.random()*0.08-0.04)), M4.S(0.11,0.14,0.11));
      draw(GEO.sph, M, C.olive);
    }
  }
  function partSkirt(){
    const cones = [
      {t:[0,0.86,0.11], rx:+95},
      {t:[-0.12,0.86,0.03], rx:+95, rz:+25},
      {t:[+0.12,0.86,0.03], rx:+95, rz:-25},
    ];
    for(const c of cones){
      let M = M4.T(...c.t);
      if(c.rz) M = M4.mul(M, M4.Rz(c.rz*Math.PI/180));
      M = M4.mul(M, M4.Rx(c.rx*Math.PI/180));
      M = M4.mul(M, M4.S(0.20,0.22,0.20));
      draw(GEO.cone, M, C.leaf);
    }
  }
  function partTrunk(){
    // upper trunk (cone downwards)
    let M = M4.mul(M4.T(0,0.42,0), M4.S(0.16,0.35,0.16));
    draw(GEO.cone, M, C.wood);
  
    // roots
    let R1 = M4.mul(M4.T(0,0.22,0.08), M4.Rx(Math.PI/2));
    R1 = M4.mul(R1, M4.S(0.10,0.22,0.10));
    draw(GEO.cone, R1, C.wood);
  
    let R2 = M4.mul(M4.T(-0.07,0.22,-0.05), M4.Rz(+25*Math.PI/180));
    R2 = M4.mul(R2, M4.Rx(+70*Math.PI/180));
    R2 = M4.mul(R2, M4.S(0.10,0.22,0.10));
    draw(GEO.cone, R2, C.wood);
  
    let R3 = M4.mul(M4.T(+0.07,0.22,-0.05), M4.Rz(-25*Math.PI/180));
    R3 = M4.mul(R3, M4.Rx(+70*Math.PI/180));
    R3 = M4.mul(R3, M4.S(0.10,0.22,0.10));
    draw(GEO.cone, R3, C.wood);
  }
  function partFace(){
    // eyes as thin boxes
    let L = M4.mul(M4.T(-0.05,1.22,0.15), M4.S(0.05,0.01,0.02));
    draw(GEO.box, L, C.eye);
    let R = M4.mul(M4.T(+0.05,1.22,0.15), M4.S(0.05,0.01,0.02));
    draw(GEO.box, R, C.eye);
  }
  
  // ====== Camera/orbit controls ======
  let az=0.6, el=0.35, dist=3.2;
  const init = {az,el,dist};
  let isDown=false, px=0, py=0;
  canvas.addEventListener('mousedown',e=>{isDown=true;px=e.clientX;py=e.clientY});
  window.addEventListener('mouseup',()=>isDown=false);
  window.addEventListener('mousemove',e=>{
    if(!isDown) return;
    az += (e.clientX-px)*0.005; el += (e.clientY-py)*0.005;
    el=Math.max(-1.2, Math.min(1.2, el)); px=e.clientX; py=e.clientY;
  });
  canvas.addEventListener('wheel',e=>{ dist*=Math.pow(1.1, Math.sign(e.deltaY)); dist=Math.max(1.8, Math.min(8.0, dist)); });
  window.addEventListener('keydown',e=>{ if(e.key==='r'||e.key==='R'){ az=init.az; el=init.el; dist=init.dist; } });
  
  // ====== Render loop ======
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.07,0.07,0.09,1);
  gl.uniform3fv(loc.uLightDir, new Float32Array([0.6,1.0,0.8]));
  
  function frame(t){
    resize();
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  
    // matrices
    const aspect = canvas.width/canvas.height;
    const P = M4.persp(45*Math.PI/180, aspect, 0.01, 50);
    const eye=[Math.cos(az)*Math.cos(el)*dist, Math.sin(el)*dist, Math.sin(az)*Math.cos(el)*dist];
    const V = M4.look(eye,[0,0.95,0],[0,1,0]);
    gl.uniformMatrix4fv(loc.uP,false,P);
    gl.uniformMatrix4fv(loc.uV,false,V);
  
    // subtle idle sway
    const sway = Math.sin(t*0.001)*0.05;
    const root = M4.mul(M4.T(0,0,0), M4.Rz(sway));
  
    // draw all parts
    // (we multiply local transforms directly; root kept here for extension)
    partTrunk();
    partBellySeed();
    partTorsoCore();
    partNeck();
    partHead();
    partCrown();
    partShoulderCross();
    partArms();
    partSkirt();
    partOlives();
    partFace();
  
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  