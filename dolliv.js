(() => {
    const canvas = document.getElementById('c');
    const gl = canvas.getContext('webgl', {antialias: true});
    if (!gl) { alert('WebGL not supported'); return; }
  
    // ---------- Resize ----------
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w*dpr || canvas.height !== h*dpr) {
        canvas.width = w*dpr; canvas.height = h*dpr;
        gl.viewport(0,0,canvas.width,canvas.height);
      }
    }
    new ResizeObserver(resize).observe(canvas);
  
    // ---------- Shader helpers ----------
    function compile(src, type){
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh));
      }
      return sh;
    }
    function createProgram(vsId, fsId){
      const vs = compile(document.getElementById(vsId).textContent, gl.VERTEX_SHADER);
      const fs = compile(document.getElementById(fsId).textContent, gl.FRAGMENT_SHADER);
      const p = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    const prog = createProgram('vs','fs');
    gl.useProgram(prog);
    const loc = {
      aPos: gl.getAttribLocation(prog,'aPos'),
      aNor: gl.getAttribLocation(prog,'aNor'),
      uProj: gl.getUniformLocation(prog,'uProj'),
      uView: gl.getUniformLocation(prog,'uView'),
      uModel: gl.getUniformLocation(prog,'uModel'),
      uNormal: gl.getUniformLocation(prog,'uNormal'),
      uColor: gl.getUniformLocation(prog,'uColor'),
      uLightDir: gl.getUniformLocation(prog,'uLightDir'),
    };
  
    // ---------- Minimal mat utilities ----------
    const M = {
      ident(){ return [1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1]; },
      mul(a,b){ // a*b
        const r = new Array(16).fill(0);
        for(let c=0;c<4;c++)
          for(let rI=0;rI<4;rI++)
            for(let k=0;k<4;k++)
              r[c*4+rI]+=a[k*4+rI]*b[c*4+k];
        return r;
      },
      T(x,y,z){ return [1,0,0,0,  0,1,0,0,  0,0,1,0,  x,y,z,1]; },
      S(x,y,z){ return [x,0,0,0,  0,y,0,0,  0,0,z,0,  0,0,0,1]; },
      Rx(a){ const c=Math.cos(a), s=Math.sin(a);
        return [1,0,0,0,  0,c,s,0,  0,-s,c,0,  0,0,0,1];},
      Ry(a){ const c=Math.cos(a), s=Math.sin(a);
        return [c,0,-s,0,  0,1,0,0,  s,0,c,0,  0,0,0,1];},
      Rz(a){ const c=Math.cos(a), s=Math.sin(a);
        return [c,s,0,0,  -s,c,0,0,  0,0,1,0,  0,0,0,1];},
      perspective(fovy, aspect, near, far){
        const f = 1/Math.tan(fovy/2); const nf = 1/(near-far);
        return [f/aspect,0,0,0,  0,f,0,0,  0,0,(far+near)*nf,-1,  0,0,(2*far*near)*nf,0];
      },
      lookAt(eye, target, up){
        const z = norm(sub(eye,target));
        const x = norm(cross(up,z));
        const y = cross(z,x);
        return [ x[0],y[0],z[0],0,
                 x[1],y[1],z[1],0,
                 x[2],y[2],z[2],0,
                -dot(x,eye),-dot(y,eye),-dot(z,eye),1];
      },
      toMat3(a){ return [
        a[0],a[1],a[2],
        a[4],a[5],a[6],
        a[8],a[9],a[10]
      ];},
      invertMat3(m){ // inverse of 3x3
        const a=m[0],b=m[1],c=m[2], d=m[3],e=m[4],f=m[5], g=m[6],h=m[7],i=m[8];
        const A =   e*i - f*h;
        const B = -(d*i - f*g);
        const C =   d*h - e*g;
        const D = -(b*i - c*h);
        const E =   a*i - c*g;
        const F = -(a*h - b*g);
        const G =   b*f - c*e;
        const H = -(a*f - c*d);
        const I =   a*e - b*d;
        const det = a*A + b*B + c*C;
        const invDet = 1.0/det;
        return [A*invDet, D*invDet, G*invDet,
                B*invDet, E*invDet, H*invDet,
                C*invDet, F*invDet, I*invDet];
      },
      transposeMat3(m){ return [m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8]]; },
      RAxis(axis, a){
        const [x, y, z] = norm(axis);
        const c = Math.cos(a), s = Math.sin(a), t = 1 - c;
        return [
          t*x*x + c,   t*x*y - z*s, t*x*z + y*s, 0,
          t*x*y + z*s, t*y*y + c,   t*y*z - x*s, 0,
          t*x*z - y*s, t*y*z + x*s, t*z*z + c,   0,
          0, 0, 0, 1
        ];
      }
    };
    function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}
    function cross(a,b){return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];}
    function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
    function norm(a){const l=Math.hypot(a[0],a[1],a[2]);return [a[0]/l,a[1]/l,a[2]/l];}
  
    // ---------- Primitive builders (positions, normals, indices) ----------
    function buildSphere(segments=24, rings=16){
      const pos=[], nor=[], idx=[];
      for(let y=0;y<=rings;y++){
        const v=y/rings, phi=v*Math.PI; // 0..PI
        for(let x=0;x<=segments;x++){
          const u=x/segments, th=u*2*Math.PI;
          const nx=Math.sin(phi)*Math.cos(th);
          const ny=Math.cos(phi);
          const nz=Math.sin(phi)*Math.sin(th);
          pos.push(nx,ny,nz); nor.push(nx,ny,nz);
        }
      }
      for(let y=0;y<rings;y++){
        for(let x=0;x<segments;x++){
          const i=y*(segments+1)+x;
          idx.push(i,i+segments+1,i+1, i+1,i+segments+1,i+segments+2);
        }
      }
      return {pos:new Float32Array(pos), nor:new Float32Array(nor), idx:new Uint16Array(idx)};
    }
    function buildCylinder(segments=24, capped=true){
      const pos=[], nor=[], idx=[];
      for(let y of [ -1, 1 ]){ // side ring y=-1..1
        for(let i=0;i<=segments;i++){
          const a=i/segments*2*Math.PI;
          const x=Math.cos(a), z=Math.sin(a);
          pos.push(x,y,z); nor.push(x,0,z);
        }
      }
      for(let i=0;i<segments;i++){
        const a=i, b=i+1, row=segments+1;
        idx.push(a, a+row, b, b, a+row, b+row);
      }
      if (capped){
        // top
        const baseTop=pos.length/3;
        pos.push(0,1,0); nor.push(0,1,0);
        for(let i=0;i<=segments;i++){
          const a=i/segments*2*Math.PI; pos.push(Math.cos(a),1,Math.sin(a)); nor.push(0,1,0);
        }
        for(let i=0;i<segments;i++){ idx.push(baseTop, baseTop+1+i, baseTop+2+i); }
        // bottom
        const baseBot=pos.length/3;
        pos.push(0,-1,0); nor.push(0,-1,0);
        for(let i=0;i<=segments;i++){
          const a=i/segments*2*Math.PI; pos.push(Math.cos(a),-1,Math.sin(a)); nor.push(0,-1,0);
        }
        for(let i=0;i<segments;i++){ idx.push(baseBot, baseBot+2+i, baseBot+1+i); }
      }
      return {pos:new Float32Array(pos), nor:new Float32Array(nor), idx:new Uint16Array(idx)};
    }
    function buildCone(segments=20, capped=true){
      const pos=[], nor=[], idx=[];
      // side
      const tipY = 0.9;   // how far up the rounded section starts (1 = point, lower = duller)
      const tipR = 0.2;   // how wide the rounded area is
      for(let i=0;i<=segments;i++){
        const a=i/segments*2*Math.PI, x=Math.cos(a), z=Math.sin(a);
        const n = norm([x, 1, z]);
        pos.push(x, -1, z);                nor.push(n[0], n[1], n[2]);
        pos.push(x * tipR, tipY, z * tipR); nor.push(n[0], n[1], n[2]);
      }
      for(let i=0;i<segments;i++){
        const a=i*2, b=a+1, c=a+2, d=a+3;
        idx.push(a,b,c, c,b,d);
      }
      if(capped){
        const base = pos.length/3;
        pos.push(0,-1,0); nor.push(0,-1,0);
        for(let i=0;i<=segments;i++){
          const a=i/segments*2*Math.PI; pos.push(Math.cos(a),-1,Math.sin(a)); nor.push(0,-1,0);
        }
        for(let i=0;i<segments;i++){ idx.push(base, base+1+i, base+2+i); }
      }
      return {pos:new Float32Array(pos), nor:new Float32Array(nor), idx:new Uint16Array(idx)};
    }
    function buildBox(){
      const p = [
        // +Z
        -1,-1, 1,  1,-1, 1,  1, 1, 1,  -1, 1, 1,
        // -Z
         1,-1,-1, -1,-1,-1, -1, 1,-1,  1, 1,-1,
        // +X
         1,-1, 1,  1,-1,-1,  1, 1,-1,  1, 1, 1,
        // -X
        -1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1,
        // +Y
        -1, 1, 1,  1, 1, 1,  1, 1,-1, -1, 1,-1,
        // -Y
        -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,
      ];
      const n = [
        0,0,1, 0,0,1, 0,0,1, 0,0,1,
        0,0,-1,0,0,-1,0,0,-1,0,0,-1,
        1,0,0,1,0,0,1,0,0,1,0,0,
       -1,0,0,-1,0,0,-1,0,0,-1,0,0,
        0,1,0,0,1,0,0,1,0,0,1,0,
        0,-1,0,0,-1,0,0,-1,0,0,-1,0
      ];
      const idx=[];
      for(let f=0;f<6;f++){
        const o=f*4; idx.push(o,o+1,o+2,o,o+2,o+3);
      }
      return {pos:new Float32Array(p), nor:new Float32Array(n), idx:new Uint16Array(idx)};
    }
  
    // ---------- Geometry library ----------
    const GEO = {
      sphere: buildSphere(24,16),
      cone: buildCone(20,true),
      cylinder: buildCylinder(24,true),
      box: buildBox()
    };
  
    // ---------- GPU buffers ----------
    function makeMesh(geo){
      const vao = gl.createBuffer(), nbo = gl.createBuffer(), ibo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vao);
      gl.bufferData(gl.ARRAY_BUFFER, geo.pos, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc.aPos);
      gl.vertexAttribPointer(loc.aPos,3,gl.FLOAT,false,0,0);
  
      gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
      gl.bufferData(gl.ARRAY_BUFFER, geo.nor, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc.aNor);
      gl.vertexAttribPointer(loc.aNor,3,gl.FLOAT,false,0,0);
  
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW);
      return {geo, vao, nbo, ibo, count: geo.idx.length};
    }
    const MESH = {
      sphere: makeMesh(GEO.sphere),
      cone: makeMesh(GEO.cone),
      cylinder: makeMesh(GEO.cylinder),
      box: makeMesh(GEO.box),
    };
  
    // ---------- Dolliv instance data (from the plan; units: head radius=1) ----------
    // Colors
    const C = {
      pale:  [0.97,0.91,0.65],
      olive: [0.91,0.84,0.36],
      oliveD:[0.78,0.72,0.29],
      leaf:  [0.18,0.69,0.29],
      lilac: [0.85,0.78,0.95],
      black: [0.06,0.06,0.08],
    };
  
    // Node list; transform order = T * Rz * Ry * Rx * S
    const NODES = [
      {id:'Torso', prim:'cone', parent:null,  S:[0.4,1.1,0.4], R:[0,0,0], T:[0,0.15,0], color:C.leaf},
      {id:'H', prim:'sphere', parent:null,   S:[0.95,1.10,0.85], R:[0,0,0], T:[0,1.6,0], color:C.pale},
      {id:'OB_L', prim:'sphere', parent:'H', S:[1.0,0.55,0.65], R:[0,0,0], T:[-1.1,0.70,0], color:C.olive},
      {id:'OB_R', prim:'sphere', parent:'H', S:[1.0,0.55,0.65], R:[0,0,0], T:[ 1.1,0.70,0], color:C.olive},
  
      {id:'LeafTop_A', prim:'cone', parent:'H', S:[0.45,0.80,0.12], R:[-15*Math.PI/180,0,0],   T:[0,1,0.7], color:C.leaf},
      {id:'LeafTop_B', prim:'cone', parent:'H', S:[0.45,0.80,0.12], R:[15*Math.PI/180,0,120*Math.PI/180], T:[0,1,0.7], color:C.leaf},
      {id:'LeafTop_C', prim:'cone', parent:'H', S:[0.45,0.80,0.12], R:[15*Math.PI/180,0,240*Math.PI/180], T:[0,1,0.7], color:C.leaf},
  
      {id:'Fringe_L', prim:'cone', parent:'H', S:[0.65,0.18,0.25], R:[0,0, 30*Math.PI/180], T:[-0.45,0.9,0.30], color:C.leaf},
      {id:'Fringe_R', prim:'cone', parent:'H', S:[0.65,0.18,0.25], R:[0,0,-30*Math.PI/180], T:[ 0.45,0.9,0.30], color:C.leaf},
  
      {id:'Collar_L',  prim:'cone', parent:'Torso', S:[0.85,0.15,0.30], R:[Math.PI,0.5,-10*Math.PI/180], T:[-0.775,0.3,0.4], color:C.leaf},
      {id:'Collar_R',  prim:'cone', parent:'Torso', S:[0.85,0.15,0.30], R:[Math.PI,-0.5,10*Math.PI/180], T:[ 0.775,0.3,0.4], color:C.leaf},
      {id:'Collar_L2', prim:'cone', parent:'Torso', S:[0.85,0.15,0.30], R:[Math.PI,-0.5,-10*Math.PI/180], T:[-0.775,0.3,-0.4], color:C.leaf},
      {id:'Collar_R2', prim:'cone', parent:'Torso', S:[0.85,0.15,0.30], R:[Math.PI,0.5,10*Math.PI/180], T:[ 0.775,0.3,-0.4], color:C.leaf},

  
  
      {id:'Arm_L', prim:'cone', parent:'Torso', S:[0.18,0.70,0.18], R:[0,0, 130*Math.PI/180], T:[-0.95,-0.2,0], color:C.leaf},
      {id:'Arm_R', prim:'cone', parent:'Torso', S:[0.18,0.70,0.18], R:[0,0,-130*Math.PI/180], T:[ 0.95,-0.2,0], color:C.leaf},
  
      // skirt petals around Y
      {id:'Skirt_A', prim:'cone', parent:'Torso', S:[0.60,0.40,0.23], R:[Math.PI-0.4,-45*Math.PI/180,0], T:[-0.65, -1.34, 0.59], color:C.leaf},
      {id:'Skirt_B', prim:'cone', parent:'Torso', S:[0.60,0.40,0.23], R:[Math.PI-0.4,45*Math.PI/180,0], T:[0.65,-1.34,0.59], color:C.leaf},
      // {id:'Skirt_C', prim:'cone', parent:'Torso', S:[0.60,0.90,0.23], R:[Math.PI,90*Math.PI/180,0],T:[0.65,-1.34,0],    color:C.leaf},
      // {id:'Skirt_D', prim:'cone', parent:'Torso', S:[0.60,0.90,0.20], R:[0,216*Math.PI/180,0],T:[0.71,-0.45,-0.50], color:C.leaf},
      // {id:'Skirt_E', prim:'cone', parent:'Torso', S:[0.60,0.90,0.20], R:[0,288*Math.PI/180,0],T:[0,-0.45,-0.75],    color:C.leaf},
      // {id:'InnerPetal_L', prim:'cone', parent:'Torso', S:[0.28,0.65,0.12], R:[0, 25*Math.PI/180,0], T:[-0.22,-0.55,0.35], color:C.lilac},
      // {id:'InnerPetal_R', prim:'cone', parent:'Torso', S:[0.28,0.65,0.12], R:[0,-25*Math.PI/180,0], T:[ 0.22,-0.55,0.35], color:C.lilac},
  
      {id:'LegR', prim:'cone', parent:'Torso', S:[0.22,0.55,0.22], R:[0,0,Math.PI], T:[-0.3,-1.25,0.05], color:C.pale},
      {id:'LegL', prim:'cone', parent:'Torso', S:[0.22,0.55,0.22], R:[0,0,Math.PI], T:[0.3,-1.25,0.05], color:C.pale},
  
      // face (tiny spheres / box for mouth)
      {id:'Eye_L', prim:'sphere', parent:'H', S:[0.08,0.08,0.08], R:[0,0,0], T:[-0.35,-0.3,0.90], color:C.black},
      {id:'Eye_R', prim:'sphere', parent:'H', S:[0.08,0.08,0.08], R:[0,0,0], T:[ 0.35,-0.3,0.90], color:C.black},
      {id:'Mouth', prim:'box',    parent:'H', S:[0.10,0.02,0.01], R:[0,0,0], T:[0,-0.70,0.7],    color:C.black},
    ];
  
    // Build a map for parents
    const map = Object.fromEntries(NODES.map(n=>[n.id,n]));
    function worldMatrixOf(node){
      const S = M.S(node.S[0],node.S[1],node.S[2]);
      const R = node._customR ? node._customR : M.mul(M.mul(M.Rz(node.R[2]||0), M.Ry(node.R[1]||0)), M.Rx(node.R[0]||0));
      const T = M.T(node.T[0],node.T[1],node.T[2]);
      const local = M.mul(M.mul(T,R),S);
      if (!node.parent) return local;
      return M.mul(worldMatrixOf(map[node.parent]), local);
    }
  
    // ---------- Camera / interaction ----------
    const cam = {r: 6.5, theta: 0.9, phi: 0.9, target:[0,0.9,0]};
    function viewMat(){
      const x = cam.r*Math.sin(cam.theta)*Math.cos(cam.phi);
      const y = cam.r*Math.cos(cam.theta);
      const z = cam.r*Math.sin(cam.theta)*Math.sin(cam.phi);
      return M.lookAt([x,y,z], cam.target, [0,1,0]);
    }
    function projMat(){
      return M.perspective(45*Math.PI/180, canvas.width/canvas.height, 0.1, 100);
    }
    // mouse orbit
    let last=null;
    canvas.addEventListener('mousedown', e=>{last=[e.clientX,e.clientY];});
    window.addEventListener('mousemove', e=>{
      if(!last) return;
      const dx=(e.clientX-last[0])/canvas.clientWidth;
      const dy=(e.clientY-last[1])/canvas.clientHeight;
      cam.phi += dx*2.5;
      cam.theta = Math.max(0.1, Math.min(Math.PI-0.1, cam.theta + dy*2.5));
      last=[e.clientX,e.clientY];
    });
    window.addEventListener('mouseup', ()=>{last=null;});
    canvas.addEventListener('wheel', e=>{
      cam.r = Math.max(3.0, Math.min(14.0, cam.r * (1 + Math.sign(e.deltaY)*0.08)));
      e.preventDefault();
    }, {passive:false});
    canvas.addEventListener('dblclick', ()=>{
      cam.r=6.5; cam.theta=0.9; cam.phi=0.9;
    });
  
    // ---------- Draw ----------
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.965,0.972,0.985,1);

      function render(time){
        resize();
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        const t = time * 0.001; // seconds
        const V = viewMat();
        const P = projMat();
        gl.uniformMatrix4fv(loc.uView,false,new Float32Array(V));
        gl.uniformMatrix4fv(loc.uProj,false,new Float32Array(P));
        gl.uniform3fv(loc.uLightDir,new Float32Array([0.5,0.9,0.4]));

        // ---------- Animation logic ----------
        const moveZ = Math.sin(t) * 0.5;
        for (const n of NODES) {
          if (!n._baseT) n._baseT = [...n.T];
          if (!n._baseR) n._baseR = [...n.R];
          if (!n._baseS) n._baseS = [...n.S];
        }
        // Whole model hop
        const hopHeight = Math.abs(Math.sin(t * 3)) * 0.5;
        for (const n of NODES) {
          if (!n._baseT) n._baseT = [...n.T];
          if (!n.parent) {
            n.T[1] = n._baseT[1] + hopHeight;
          }
        }

        // legs walking (swing)
        const legSwing = Math.sin(t * 5) * 0.5;
        map["LegL"].R[0] = map["LegL"]._baseR[0] + legSwing;
        map["LegR"].R[0] = map["LegR"]._baseR[0] - legSwing;

        // eyes pulsating (scaling)
        const eyeScale = 1 + 0.2 * Math.sin(t * 6);
        for (const eyeId of ["Eye_L", "Eye_R"]) {
          const e = map[eyeId];
          if (e) {
            if (!e._baseS) e._baseS = [...e.S];
            e.S[0] = e._baseS[0] * eyeScale;
            e.S[1] = e._baseS[1] * eyeScale;
            e.S[2] = e._baseS[2] * eyeScale;
          }
        }

        const head = map["H"];
        if (head) {
          if (!head._baseR) head._baseR = [...head.R];
          if (!head._baseS) head._baseS = [...head.S];

          const nodAngle = Math.sin(t * 2) * 0.2;    // up/down nod
          const turnAngle = Math.sin(t * 1.5) * 0.5; // left/right turn

          // --- Matrices ---
          const nod = M.Rx(nodAngle);             // nod
          const turn = M.RAxis([0,1,0], turnAngle); // turn around Y
          const baseR = M.mul(
              M.mul(M.Rz(head._baseR[2]), M.Ry(head._baseR[1])),
              M.Rx(head._baseR[0])
          );

          // --- Combine: base * turn * nod ---
          head._customR = M.mul(baseR, M.mul(turn, nod));
        }
        for (const n of NODES) {
          const mesh = MESH[n.prim];
          gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vao);
          gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, mesh.nbo);
          gl.vertexAttribPointer(loc.aNor, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo);

          const MW = worldMatrixOf(n);
          gl.uniformMatrix4fv(loc.uModel, false, new Float32Array(MW));

          const VM = M.mul(V, MW);
          const N3 = M.transposeMat3(M.invertMat3(M.toMat3(VM)));
          gl.uniformMatrix3fv(loc.uNormal, false, new Float32Array(N3));

          gl.uniform3fv(loc.uColor, new Float32Array(n.color));
          gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
        }

        // keep looping
        requestAnimationFrame(render);
      }

      // start animation loop once
      requestAnimationFrame(render);
})();