if(typeof mat4 === 'undefined'){
  var mat4 = (function(){
    // Hierarki transform, node untuk animasi
  const SmolivNodes = {
    root: {pos: [0,0,0], rot: [0,1,0,0], scale: [1,1,1]}, // turn, move, squash/stretch global
    body: {pos: [0.0, -0.06, 0.0], rot: [0,0,0,0], scale: [1,1,1]},
    fruit: {pos: [0.00, 0.26, 0.00], rot: [0,0,0,0], scale: [1,0.9,1]},
    leaves: [
      {pos: [-0.10, 0.04, 0.10], rot: [-0.4, 1,0,0], scale: [1,1.05,1]},
      {pos: [0.11, 0.03, 0.07], rot: [0.4, 1,0,0], scale: [1,1.05,1]},
      {pos: [0.00, 0.02, -0.13], rot: [0, 0,0,1], scale: [0.85,1.13,1.1]}
    ],
    feet: [
    {pos: [-0.085, -0.36, -0.005], rot: [0,0,-1,0], scale: [1,1,1]},
    {pos: [0.085, -0.36, -0.005], rot: [0,0,1,0], scale: [1,1,1]}
  ]
};
window.SmolivNodes = SmolivNodes;
// === Hierarchical animation & drawing helpers ===
// (paste this after `window.SmolivNodes = SmolivNodes;`)
(function(){
  // small helper: compose axis-angle stored in a few forms into [axisX,axisY,axisZ,angle]
  function parseRot(rot){
    if(!rot) return null;
    if(rot.length === 4){
      // stored as [ax, ay, az, angle]
      return {axis: [rot[0], rot[1], rot[2]], angle: rot[3]};
    } else if(rot.length >= 3){
      // stored as vector whose magnitude = angle, direction = axis
      const ang = Math.hypot(rot[0], rot[1], rot[2]);
      if(ang < 1e-6) return null;
      return {axis: [rot[0]/ang, rot[1]/ang, rot[2]/ang], angle: ang};
    }
    return null;
  }

  // Compose two axis-angle rotations approximately by converting to matrix multiply:
  function applyAxisAngleToMat(mat, rot){
    if(!rot) return;
    mat4.rotate(mat, mat, rot.angle, rot.axis);
  }

  // updateAnim: produce the same "versi lama penuh" cycle (walk → jump → squash → turn → jump)
  let _animStart = performance.now();
  function updateAnim(time){
    const t = (time - _animStart) / 1000;
    const cycle = t % 10.0;
    const N = window.SmolivNodes;
    if(!N) return;

    // Reset root baseline
    N.root.pos[0] = 0; N.root.pos[1] = 0; N.root.pos[2] = 0;
    N.root.scale = [1,1,1];
    // use rot stored as [ax,ay,az,angle] for root to be consistent
    N.root.rot = N.root.rot && N.root.rot.length===4 ? N.root.rot : [0,1,0,0];

    const walkOsc = Math.sin(t * 6.0) * 0.05;

    if (cycle < 3.0) {
      const p = cycle / 3.0;
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
      N.root.pos[0] = 0.6 * ease;
      // feet vertical offset
      N.feet[0].pos[1] = -0.36 + walkOsc;
      N.feet[1].pos[1] = -0.36 - walkOsc;
      // subtle body bob
      N.body.pos[1] = -0.06 + Math.sin(t*12.0)*0.005;
    } else if (cycle < 4.0) {
      const p = (cycle - 3.0);
      const y = Math.sin(p * Math.PI) * 0.5;
      const s = 1.0 + Math.sin(p * Math.PI) * 0.3;
      N.root.pos[0] = 0.6;
      N.root.pos[1] = y;
      N.root.scale = [1/Math.sqrt(s), s, 1/Math.sqrt(s)];
    } else if (cycle < 5.0) {
      const p = (cycle - 4.0);
      const squash = 1.0 + Math.sin(p * Math.PI) * 0.4;
      N.root.pos = [0.6, 0, 0];
      N.root.scale = [squash, 1/squash, squash];
    } else if (cycle < 8.0) {
      const p = (cycle - 5.0) / 3.0;
      const ang = Math.PI * p;
      // root.rot stored [ax,ay,az,angle]
      N.root.rot = [0,1,0,ang];
      // walk back
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
      N.root.pos[0] = 0.6 * (1.0 - ease);
      N.feet[0].pos[1] = -0.36 + walkOsc;
      N.feet[1].pos[1] = -0.36 - walkOsc;
    } else {
      const p = (cycle - 8.0) / 2.0;
      const y = Math.sin(p * Math.PI) * 0.5;
      const s = 1.0 + Math.sin(p * Math.PI) * 0.3;
      N.root.pos[1] = y;
      N.root.scale = [1/Math.sqrt(s), s, 1/Math.sqrt(s)];
    }
    // keep small per-leaf wiggle so they feel attached
    for(let i=0;i<N.leaves.length;i++){
      const f = 0.06 * Math.sin(t*3.0 + i*1.3);
      N.leaves[i].pos[0] += f * (i%2?1:-1);
      N.leaves[i].pos[2] += f * 0.3;
    }
  }

  // updateHierarchy: compute world matrix for each node (root -> body -> fruit -> leaves, feet, face)
  function updateHierarchy(time){
    if(!window.SmolivNodes) return;
    updateAnim(time);
    const N = window.SmolivNodes;

    // root mat
    const rootMat = mat4.create();
    mat4.translate(rootMat, rootMat, N.root.pos);
    // apply root rotation; root.rot stored as [ax,ay,az,angle] preferably
    const r = parseRot(N.root.rot || [0,1,0,0]);
    if(r) applyAxisAngleToMat(rootMat, r);
    mat4.scale(rootMat, rootMat, N.root.scale);
    N.root._world = rootMat;

    // body = child of root: translate by body.pos relative to root
    const bodyMat = mat4.create(); mat4.copy(bodyMat, rootMat);
    mat4.translate(bodyMat, bodyMat, N.body.pos);
    const br = parseRot(N.body.rot);
    if(br) applyAxisAngleToMat(bodyMat, br);
    mat4.scale(bodyMat, bodyMat, N.body.scale);
    N.body._world = bodyMat;

    // fruit: child of root (position relative to root)
    const fruitMat = mat4.create(); mat4.copy(fruitMat, rootMat);
    mat4.translate(fruitMat, fruitMat, N.fruit.pos);
    const fr = parseRot(N.fruit.rot);
    if(fr) applyAxisAngleToMat(fruitMat, fr);
    mat4.scale(fruitMat, fruitMat, N.fruit.scale);
    N.fruit._world = fruitMat;

    // leaves: child of fruit (use leaf.pos, leaf.rot, leaf.scale)
    N.leaves.forEach((leaf, i) => {
      const m = mat4.create(); mat4.copy(m, fruitMat);
      mat4.translate(m, m, leaf.pos);
      const lr = parseRot(leaf.rot);
      if(lr) applyAxisAngleToMat(m, lr);
      mat4.scale(m, m, leaf.scale);
      leaf._world = m;
    });

    // feet: child of root
    N.feet.forEach((f,i) => {
      const m = mat4.create(); mat4.copy(m, rootMat);
      mat4.translate(m, m, f.pos);
      const frt = parseRot(f.rot);
      if(frt) applyAxisAngleToMat(m, frt);
      mat4.scale(m, m, f.scale);
      f._world = m;
    });

    // face (eyes/mouth) positions: create ready-to-use small world mats
    // eyes positions used in drawScene; derive them by translating bodyMat
    const eyeL = mat4.create(); mat4.copy(eyeL, bodyMat); mat4.translate(eyeL, eyeL, [-0.045, -0.04, 0.155]); N._eyeL = eyeL;
    const eyeR = mat4.create(); mat4.copy(eyeR, bodyMat); mat4.translate(eyeR, eyeR, [ 0.045, -0.04, 0.155]); N._eyeR = eyeR;
    const eyeWhiteOffset = [0,0,0.04];
    const eyeWL = mat4.create(); mat4.copy(eyeWL, eyeL); mat4.translate(eyeWL, eyeWL, eyeWhiteOffset); N._eyeWL = eyeWL;
    const eyeWR = mat4.create(); mat4.copy(eyeWR, eyeR); mat4.translate(eyeWR, eyeWR, eyeWhiteOffset); N._eyeWR = eyeWR;

    // mouth positions (a few small bumps) anchored to bodyMat
    N._mouthBase = mat4.create(); mat4.copy(N._mouthBase, bodyMat); mat4.translate(N._mouthBase, N._mouthBase, [0, -0.14, 0.175]);
  }

  // expose global function so render loop can call it
  window.updateHierarchy = updateHierarchy;
})();



    function create(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
    function copy(out,a){ for(let i=0;i<16;i++) out[i]=a[i]; return out; }
    function multiply(out,a,b){
      const a00=a[0],a01=a[1],a02=a[2],a03=a[3];
      const a10=a[4],a11=a[5],a12=a[6],a13=a[7];
      const a20=a[8],a21=a[9],a22=a[10],a23=a[11];
      const a30=a[12],a31=a[13],a32=a[14],a33=a[15];
      const b00=b[0],b01=b[1],b02=b[2],b03=b[3];
      const b10=b[4],b11=b[5],b12=b[6],b13=b[7];
      const b20=b[8],b21=b[9],b22=b[10],b23=b[11];
      const b30=b[12],b31=b[13],b32=b[14],b33=b[15];
      out[0]=a00*b00 + a10*b01 + a20*b02 + a30*b03;
      out[1]=a01*b00 + a11*b01 + a21*b02 + a31*b03;
      out[2]=a02*b00 + a12*b01 + a22*b02 + a32*b03;
      out[3]=a03*b00 + a13*b01 + a23*b02 + a33*b03;
      out[4]=a00*b10 + a10*b11 + a20*b12 + a30*b13;
      out[5]=a01*b10 + a11*b11 + a21*b12 + a31*b13;
      out[6]=a02*b10 + a12*b11 + a22*b12 + a32*b13;
      out[7]=a03*b10 + a13*b11 + a23*b12 + a33*b13;
      out[8]=a00*b20 + a10*b21 + a20*b22 + a30*b23;
      out[9]=a01*b20 + a11*b21 + a21*b22 + a31*b23;
      out[10]=a02*b20 + a12*b21 + a22*b22 + a32*b23;
      out[11]=a03*b20 + a13*b21 + a23*b22 + a33*b23;
      out[12]=a00*b30 + a10*b31 + a20*b32 + a30*b33;
      out[13]=a01*b30 + a11*b31 + a21*b32 + a31*b33;
      out[14]=a02*b30 + a12*b31 + a22*b32 + a32*b33;
      out[15]=a03*b30 + a13*b31 + a23*b32 + a33*b33;
      return out;
    }
    function translate(out,a,v){
      const x=v[0],y=v[1],z=v[2];
      if(out===a){
        out[12]=a[0]*x + a[4]*y + a[8]*z + a[12];
        out[13]=a[1]*x + a[5]*y + a[9]*z + a[13];
        out[14]=a[2]*x + a[6]*y + a[10]*z + a[14];
        out[15]=a[3]*x + a[7]*y + a[11]*z + a[15];
        return out;
      }
      copy(out,a);
      out[12]=a[0]*x + a[4]*y + a[8]*z + a[12];
      out[13]=a[1]*x + a[5]*y + a[9]*z + a[13];
      out[14]=a[2]*x + a[6]*y + a[10]*z + a[14];
      out[15]=a[3]*x + a[7]*y + a[11]*z + a[15];
      return out;
    }
    function scale(out,a,v){
      const x=v[0],y=v[1],z=v[2];
      out[0]=a[0]*x; out[1]=a[1]*x; out[2]=a[2]*x; out[3]=a[3]*x;
      out[4]=a[4]*y; out[5]=a[5]*y; out[6]=a[6]*y; out[7]=a[7]*y;
      out[8]=a[8]*z; out[9]=a[9]*z; out[10]=a[10]*z; out[11]=a[11]*z;
      out[12]=a[12]; out[13]=a[13]; out[14]=a[14]; out[15]=a[15];
      return out;
    }
    function perspective(out,fovy,aspect,near,far){
      const f=1.0/Math.tan(fovy/2);
      out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0;
      out[4]=0; out[5]=f; out[6]=0; out[7]=0;
      out[8]=0; out[9]=0; out[10]=(far+near)/(near-far); out[11]=-1;
      out[12]=0; out[13]=0; out[14]=(2*far*near)/(near-far); out[15]=0;
      return out;
    }
    function lookAt(out,eye,center,up){
      const x0=eye[0],x1=eye[1],x2=eye[2];
      const y0=center[0],y1=center[1],y2=center[2];
      const z0=up[0],z1=up[1],z2=up[2];
      let fx=y0-x0, fy=y1-x1, fz=y2-x2;
      let rlen=1/Math.hypot(fx,fy,fz); fx*=rlen; fy*=rlen; fz*=rlen;
      let sx=fy*z2-fz*z1, sy=fz*z0-fx*z2, sz=fx*z1-fy*z0;
      rlen=1/Math.hypot(sx,sy,sz); if(!isFinite(rlen)){ sx=0; sy=0; sz=0; } else { sx*=rlen; sy*=rlen; sz*=rlen; }
      let ux=sy*fz-sz*fy, uy=sz*fx-sx*fz, uz=sx*fy-sy*fx;
      out[0]=sx; out[1]=ux; out[2]= -fx; out[3]=0;
      out[4]=sy; out[5]=uy; out[6]= -fy; out[7]=0;
      out[8]=sz; out[9]=uz; out[10]= -fz; out[11]=0;
      out[12]= -(sx*x0 + sy*x1 + sz*x2);
      out[13]= -(ux*x0 + uy*x1 + uz*x2);
      out[14]=  (fx*x0 + fy*x1 + fz*x2);
      out[15]=1;
      return out;
    }
    function transpose(out,a){
      if(out===a){
        let a01=a[1],a02=a[2],a03=a[3],a12=a[6],a13=a[7],a23=a[11];
        out[1]=a[4]; out[2]=a[8]; out[3]=a[12]; out[4]=a01; out[6]=a[9]; out[7]=a[13]; out[8]=a02; out[9]=a12; out[11]=a[14]; out[12]=a03; out[13]=a13; out[14]=a23;
        return out;
      }
      out[0]=a[0]; out[1]=a[4]; out[2]=a[8]; out[3]=a[12];
      out[4]=a[1]; out[5]=a[5]; out[6]=a[9]; out[7]=a[13];
      out[8]=a[2]; out[9]=a[6]; out[10]=a[10]; out[11]=a[14];
      out[12]=a[3]; out[13]=a[7]; out[14]=a[11]; out[15]=a[15];
      return out;
    }
    // generic 4x4 inverse
    function invert(out,a){
      const a00=a[0],a01=a[1],a02=a[2],a03=a[3];
      const a10=a[4],a11=a[5],a12=a[6],a13=a[7];
      const a20=a[8],a21=a[9],a22=a[10],a23=a[11];
      const a30=a[12],a31=a[13],a32=a[14],a33=a[15];
      const b00 = a00 * a11 - a01 * a10;
      const b01 = a00 * a12 - a02 * a10;
      const b02 = a00 * a13 - a03 * a10;
      const b03 = a01 * a12 - a02 * a11;
      const b04 = a01 * a13 - a03 * a11;
      const b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30;
      const b07 = a20 * a32 - a22 * a30;
      const b08 = a20 * a33 - a23 * a30;
      const b09 = a21 * a32 - a22 * a31;
      const b10 = a21 * a33 - a23 * a31;
      const b11 = a22 * a33 - a23 * a32;
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      if(!det) return null;
      det = 1.0 / det;
      out[0] = ( a11 * b11 - a12 * b10 + a13 * b09) * det;
      out[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * det;
      out[2] = ( a31 * b05 - a32 * b04 + a33 * b03) * det;
      out[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * det;
      out[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * det;
      out[5] = ( a00 * b11 - a02 * b08 + a03 * b07) * det;
      out[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * det;
      out[7] = ( a20 * b05 - a22 * b02 + a23 * b01) * det;
      out[8] = ( a10 * b10 - a11 * b08 + a13 * b06) * det;
      out[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * det;
      out[10]= ( a30 * b04 - a31 * b02 + a33 * b00) * det;
      out[11]= (-a20 * b04 + a21 * b02 - a23 * b00) * det;
      out[12]= (-a10 * b09 + a11 * b07 - a12 * b06) * det;
      out[13]= ( a00 * b09 - a01 * b07 + a02 * b06) * det;
      out[14]= (-a30 * b03 + a31 * b01 - a32 * b00) * det;
      out[15]= ( a20 * b03 - a21 * b01 + a22 * b00) * det;
      return out;
    }
    function rotate(out,a,rad,axis){
      let x=axis[0], y=axis[1], z=axis[2];
      let len=Math.hypot(x,y,z); if(len<1e-6) return null; x/=len; y/=len; z/=len;
      const s=Math.sin(rad), c=Math.cos(rad), t=1-c;
      const r00 = x*x*t + c, r01 = y*x*t + z*s, r02 = z*x*t - y*s, r10 = x*y*t - z*s, r11 = y*y*t + c, r12 = z*y*t + x*s, r20 = x*z*t + y*s, r21 = y*z*t - x*s, r22 = z*z*t + c;
      const r = new Float32Array([r00,r01,r02,0, r10,r11,r12,0, r20,r21,r22,0, 0,0,0,1]);
      return multiply(out,a,r);
    }
    return {create:create,copy:copy,multiply:multiply,translate:translate,scale:scale,perspective:perspective,lookAt:lookAt,invert:invert,transpose:transpose,rotate:rotate};
  })();
}

// util: compile shader, create program
function createShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}
function createProgram(gl, vsSrc, fsSrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    return null;
  }
  return prog;
}

// basic shaders
const vsSource = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
uniform mat4 uNormalMatrix;

out vec3 vPosition;
out vec3 vNormal;

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vPosition = worldPos.xyz;
  vNormal = mat3(uNormalMatrix) * aNormal;
  gl_Position = uProj * uView * worldPos;
}
`;

const fsSource = `#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  // Unlit flat shader: output uniform color directly (no lighting)
  outColor = vec4(uColor, 1.0);
}
`;
// utilities
function cross(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function normalize(v){ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }
function mix(a,b,t){ return a*(1-t)+b*t; }
function smoothstep(a,b,x){ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); }


// Parametric surface generator
function generateMeshFromParametric(func, du, dv) {
const positions=[], normals=[], indices=[], grid=[];
for(let i=0;i<=du;i++){
  const u=i/du; grid[i]=[];
  for(let j=0;j<=dv;j++){
    const v=j/dv;
    const r=func(u,v); const p=r.pos;
    positions.push(...p);
    let dpdu=r.dpdu, dpdv=r.dpdv;
    if(!dpdu||!dpdv){
      const eps=1e-3;
      const pu=func(Math.min(1,u+eps),v).pos;
      const pu2=func(Math.max(0,u-eps),v).pos;
      dpdu=[(pu[0]-pu2[0])/(2*eps),(pu[1]-pu2[1])/(2*eps),(pu[2]-pu2[2])/(2*eps)];
      const pv=func(u,Math.min(1,v+eps)).pos;
      const pv2=func(u,Math.max(0,v-eps)).pos;
      dpdv=[(pv[0]-pv2[0])/(2*eps),(pv[1]-pv2[1])/(2*eps),(pv[2]-pv2[2])/(2*eps)];
    }
    const n=normalize(cross(dpdu,dpdv));
    normals.push(...n);
    grid[i][j]=i*(dv+1)+j;
  }
}
for(let i=0;i<du;i++){
  for(let j=0;j<dv;j++){
    const a=grid[i][j],b=grid[i+1][j],c=grid[i+1][j+1],d=grid[i][j+1];
    indices.push(a,b,d); indices.push(b,c,d);
  }
}
return {
  positions:new Float32Array(positions),
  normals:new Float32Array(normals),
  indices:new Uint32Array(indices)
};
}

// shape functions
function coneMesh(radius,height,segments,stacks){
  const func=(u,v)=>{
    const theta=u*Math.PI*2;
    const r=v*radius;
    const x=r*Math.cos(theta), z=r*Math.sin(theta), y=v*height;
    const dpdu=[-r*Math.sin(theta)*Math.PI*2,0,r*Math.cos(theta)*Math.PI*2];
    const dpdv=[Math.cos(theta)*radius,height,Math.sin(theta)*radius];
    return {pos:[x,y,z],dpdu,dpdv};
  };
  return generateMeshFromParametric(func,segments,stacks);
}
// custom foot mesh: a downward-pointing cone-like foot (apex at negative Y)
function downwardFootMesh(radius,height,segments){
const positions=[];
const normals=[];
const indices=[];
positions.push(0, -height, 0);
for(let i=0;i<segments;i++){
  const theta = i/segments * Math.PI * 2;
  const x = radius * Math.cos(theta);
  const z = radius * Math.sin(theta);
  positions.push(x, 0, z);
}
  positions.push(0, 0, 0);

  normals.push(0, -1, 0);
for(let i=0;i<segments;i++){
  const theta = i/segments * Math.PI * 2;
// approximate side normal using cone slope: (cos* h, r, sin* h)
  const nx = Math.cos(theta) * height;
  const ny = radius;
  const nz = Math.sin(theta) * height;
  const len = Math.hypot(nx, ny, nz) || 1;
  normals.push(nx/len, ny/len, nz/len);
}
  // cap normal (up)
normals.push(0, 1, 0);

  // indices: side triangles connecting apex (0) -> base i -> base i+1
for(let i=0;i<segments;i++){
  const a = 0;
  const b = 1 + i;
  const c = 1 + ((i+1)%segments);
  // winding so outside faces outwards
  indices.push(a,b,c);
}
  // cap triangles (optional) using center index = 1+segments
const centerIdx = 1 + segments;
for(let i=0;i<segments;i++){
  const a = centerIdx;
  const b = 1 + ((i+1)%segments);
  const c = 1 + i;
  indices.push(a,b,c);
}

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices)
  };
}
function ellipticParaboloid(a,b,scaleU,scaleV){
  const func=(u,v)=>{
    const theta=u*Math.PI*2,r=v;
    const x=a*r*Math.cos(theta),z=b*r*Math.sin(theta);
    const y=-0.6*((x*x)/(a*a)+(z*z)/(b*b))*scaleV;
    const dpdu=[-a*r*Math.sin(theta)*Math.PI*2,0,b*r*Math.cos(theta)*Math.PI*2];
    const dpdv=[a*Math.cos(theta),(-1.2)*((x*Math.cos(theta))/(a*a)+(z*Math.sin(theta))/(b*b))*scaleV,b*Math.sin(theta)];
    return {pos:[x,y,z],dpdu,dpdv};
  };
  return generateMeshFromParametric(func,48,24);
}
function ellipsoidWithIndent(a,b,c,indentDepth){
  const func=(u,v)=>{
    const theta=u*Math.PI*2,phi=v*Math.PI;
    let x=a*Math.sin(phi)*Math.cos(theta);
    let y=b*Math.cos(phi);
    let z=c*Math.sin(phi)*Math.sin(theta);
    const phi0=0.6,f=Math.exp(-Math.pow(phi/phi0,2));
    y-=indentDepth*f;
    const dpdu=[-a*Math.sin(phi)*Math.sin(theta)*Math.PI*2,0,c*Math.sin(phi)*Math.cos(theta)*Math.PI*2];
    const dpdv=[a*Math.cos(phi)*Math.cos(theta)*Math.PI,-b*Math.sin(phi)*Math.PI,a*Math.cos(phi)*Math.sin(theta)*Math.PI];
    return {pos:[x,y,z],dpdu,dpdv};
  };
  return generateMeshFromParametric(func,48,32);
}
function blendedBody(radiusX,radiusY,radiusZ){
  const func=(u,v)=>{
    const theta=u*Math.PI*2;
    const r=(1-Math.pow(v,1.2))*0.95;
    const xPar=radiusX*r*Math.cos(theta);
    const zPar=radiusZ*r*Math.sin(theta);
    const yPar=-radiusY*(v*2-1)*0.9;
    const sphereCenterY=-0.25*radiusY;
    const phi=v*Math.PI;
    const xSph=radiusX*Math.sin(phi)*Math.cos(theta);
    const ySph=radiusY*Math.cos(phi)+sphereCenterY;
    const zSph=radiusZ*Math.sin(phi)*Math.sin(theta);
    const t=smoothstep(0.2,0.8,v);
    const x=mix(xPar,xSph,t);
    const y=mix(yPar,ySph,t);
    const z=mix(zPar,zSph,t);
    const dpdu=[-Math.sin(theta)*Math.PI*2*Math.max(radiusX,radiusZ),0,Math.cos(theta)*Math.PI*2*Math.max(radiusX,radiusZ)];
    const dpdv=[0,-radiusY*2*0.8+(-Math.sin(phi)*radiusY*Math.PI),0];
    return {pos:[x,y,z],dpdu,dpdv};
  };
  return generateMeshFromParametric(func,64,64);
}

// VAO creation 
function createVAOFromMesh(gl,program,mesh){
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const posLoc = gl.getAttribLocation(program, 'aPosition');
  const nLoc = gl.getAttribLocation(program, 'aNormal');

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
  if (posLoc >= 0) {
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
  }

  const nBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuf);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
  if (nLoc >= 0) {
    gl.enableVertexAttribArray(nLoc);
    gl.vertexAttribPointer(nLoc, 3, gl.FLOAT, false, 0, 0);
  }

  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, ib, count: mesh.indices.length };
}

// ===== main =====
(function(){
  try {
  const canvas=document.getElementById('c');
  const gl=canvas.getContext('webgl2',{antialias:true});
  if(!gl){ alert('WebGL2 tidak tersedia di browser Anda.'); return; }

  function resize(){
    const dpr=window.devicePixelRatio||1;
    const w=Math.floor(canvas.clientWidth*dpr);
    const h=Math.floor(canvas.clientHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w; canvas.height=h;
    }
    gl.viewport(0,0,w,h);
  }
  window.addEventListener('resize',resize);
  resize();

  const program=createProgram(gl,vsSource,fsSource);
  gl.useProgram(program);

  // small cone for feet and tiny toes
  const cone = coneMesh(0.05, 0.10, 24, 12);
  // custom downward-pointing foot mesh (used instead of the simple cone instance)
  const foot = downwardFootMesh(0.055, 0.09, 24);
  // leaves: smaller elliptic paraboloids to look like the stylized leaves in the reference
  const leaf = ellipticParaboloid(0.18, 0.09, 1.0, 1.1);
  // fruit: slightly larger and rounder with a shallower indent to show the hole
  const fruit = ellipsoidWithIndent(0.22, 0.24, 0.22, 0.06);
  // body: make body smaller (reduce radii) so it appears less large
  const body = blendedBody(0.30, 0.45, 0.26);
  // bodyCap: add a curved ellipsoid topCover to fully close the top of the body
  const bodyCap = ellipsoidWithIndent(0.18,0.06,0.14,0.02);
  // cap: small ellipsoid to sit on top of the fruit
  const cap = ellipsoidWithIndent(0.14, 0.10, 0.12, 0.03);
  // small eye meshes (black pupil + white highlight)
  const eye = ellipsoidWithIndent(0.03,0.03,0.03,0.0);
  // sclera: larger white disk/ellipsoid behind the pupil
  const eyeWhite = ellipsoidWithIndent(0.045,0.045,0.015,0.0);
  const coneVAO=createVAOFromMesh(gl,program,cone);
  const footVAO = createVAOFromMesh(gl, program, foot);
  const leafVAO=createVAOFromMesh(gl,program,leaf);
  const fruitVAO=createVAOFromMesh(gl,program,fruit);
  const bodyVAO=createVAOFromMesh(gl,program,body);
  const bodyCapVAO=createVAOFromMesh(gl,program,bodyCap);
  const eyeVAO=createVAOFromMesh(gl,program,eye);
  const eyeWhiteVAO=createVAOFromMesh(gl,program,eyeWhite);
  // mouth: small flattened ellipsoid used as a simple mouth shape
  const mouth = ellipsoidWithIndent(0.06, 0.02, 0.02, 0.0);
  const mouthVAO = createVAOFromMesh(gl, program, mouth);


  // uniform lokasi
  const uModel=gl.getUniformLocation(program,'uModel');
  const uView=gl.getUniformLocation(program,'uView');
  const uProj=gl.getUniformLocation(program,'uProj');
  const uNormalMatrix=gl.getUniformLocation(program,'uNormalMatrix');
  const uLightPos=gl.getUniformLocation(program,'uLightPos');
  const uViewPos=gl.getUniformLocation(program,'uViewPos');
  const uColor=gl.getUniformLocation(program,'uColor');
  const uAmbient=gl.getUniformLocation(program,'uAmbient');

  // kamera
  const cam={distance:2.4,rotX:-0.25,rotY:0.9,target:[0,-0.1,0]};
  let dragging=false,last=[0,0];
  canvas.addEventListener('pointerdown',e=>{
    dragging=true; last=[e.clientX,e.clientY]; canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=(e.clientX-last[0])/200;
    const dy=(e.clientY-last[1])/200;
    last=[e.clientX,e.clientY];
    cam.rotY+=dx; cam.rotX+=dy;
    cam.rotX=Math.max(-1.3,Math.min(1.3,cam.rotX));
  });
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    cam.distance*=(1+e.deltaY*0.001);
    cam.distance=Math.max(0.6,Math.min(6,cam.distance));
  });

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  const lightPos=[1.8,2.0,2.0];
  let sceneScale = 0.88;

  function drawMesh(meshObj,translation,rotation,color,shininess,ambient,scale){
    const model=mat4.create();
    mat4.translate(model,model,translation);
    if(rotation){
      const ang=Math.hypot(rotation[0],rotation[1],rotation[2]);
      if(ang>1e-4){
        const axis=[rotation[0]/ang,rotation[1]/ang,rotation[2]/ang];
        mat4.rotate(model,model,ang,axis);
      }
    }
    const s = scale || [1,1,1];
    const finalScale = [s[0]*sceneScale, s[1]*sceneScale, s[2]*sceneScale];
  mat4.scale(model,model,finalScale);
  gl.uniformMatrix4fv(uModel,false,model);
  // normal matrix for transforming normals to world space
  const normalMat=mat4.create();
  mat4.invert(normalMat,model);
  mat4.transpose(normalMat,normalMat);
  gl.uniformMatrix4fv(uNormalMatrix,false,normalMat);
    gl.uniform3fv(uColor,color);
    gl.uniform1f(uAmbient,ambient);
    gl.bindVertexArray(meshObj.vao);
    gl.drawElements(gl.TRIANGLES,meshObj.count,gl.UNSIGNED_INT,0);
    gl.bindVertexArray(null);
  }

  // Draw the scene objects (body, fruit, leaves, feet, face)
  function drawScene(){
      // === Tambahan agar drawScene pakai animasi SmolivNodes ===
  const N = window.SmolivNodes;
  if (!N) return; // kalau belum siap, jangan gambar dulu

  const root = N.root;
  const feet = N.feet;
  const fruit = N.fruit;
  const leaves = N.leaves;

  drawMesh(bodyVAO, [root.pos[0] + 0.00, root.pos[1] - 0.06, root.pos[2]], root.rot, [0.74,0.96,0.46], 0, 0, root.scale);
  drawMesh(bodyCapVAO, [0.00, 0.14, 0.00], null, [0.74,0.96,0.46], 0, 0, [1.50,0.72,1.50]);
  drawMesh(
  fruitVAO,
  [root.pos[0] + 0.00, root.pos[1] + 0.26, root.pos[2] + 0.00],
  root.rot,
  [0.96,0.92,0.46],
  0, 0,
  root.scale
);
  // Leaves: place in five spots to match screenshot: left-top, left-bottom, right-bottom, right-top (near fruit) and a forehead droplet
drawMesh(leafVAO, [root.pos[0]-0.12, root.pos[1]+0.30, root.pos[2]-0.02], [-0.85, 0.55, 0.10], [0.15,0.83,0.35], 0, 0, [0.78,0.78,0.78]);
drawMesh(leafVAO, [root.pos[0]-0.06, root.pos[1]+0.24, root.pos[2]+0.03], [-0.40, 0.35, 0.08], [0.15,0.78,0.33], 0, 0, [0.62,0.62,0.62]);
drawMesh(leafVAO, [root.pos[0]+0.06, root.pos[1]+0.24, root.pos[2]+0.03], [0.40, -0.35, -0.08], [0.15,0.78,0.33], 0, 0, [0.62,0.62,0.62]);
drawMesh(leafVAO, [root.pos[0]+0.12, root.pos[1]+0.30, root.pos[2]-0.02], [0.85, -0.55, -0.10], [0.15,0.83,0.35], 0, 0, [0.78,0.78,0.78]);
drawMesh(leafVAO, [root.pos[0]+0.00, root.pos[1]+0.25, root.pos[2]+0.10], [-0.10, 0.10, 0.00], [0.14,0.72,0.20], 0, 0, [0.50,0.50,0.50]);
  // Feet: inverted cones (apex pointing down).
  drawMesh(footVAO, feet[0].pos, feet[0].rot, [0.28,0.48,0.26], 0, 0, [0.80,0.80,0.80]);
  drawMesh(footVAO, feet[1].pos, feet[1].rot, [0.28,0.48,0.26], 0, 0, [0.80,0.80,0.80]);

  // Eyes: draw the black pupil, then increase the white highlight size and move it slightly backward
  drawMesh(eyeVAO, [root.pos[0]-0.045, root.pos[1]-0.10, root.pos[2]+0.155], null, [0.04,0.04,0.04], 0, 0, [1.20,1.20,1.20]);
  // enlarge the white highlight and pull it slightly back toward the pupil (but not inside)
  drawMesh(eyeWhiteVAO, [root.pos[0]-0.045, root.pos[1]-0.10, root.pos[2]+0.195], null, [0.98,0.98,0.98], 0, 0, [0.50,0.50,0.50]);
  drawMesh(eyeVAO, [root.pos[0]+0.045, root.pos[1]-0.10, root.pos[2]+0.155], null, [0.04,0.04,0.04], 0, 0, [1.20,1.20,1.20]);
  drawMesh(eyeWhiteVAO, [root.pos[0]+0.045, root.pos[1]-0.10, root.pos[2]+0.195], null, [0.98,0.98,0.98], 0, 0, [0.50,0.50,0.50]);
  // Wavy mouth: draw several small mouth bumps to approximate a wavy shape, lowered slightly
  drawMesh(mouthVAO, [-0.045, -0.20, 0.175], [0.0,0.0,0.12], [0.78,0.38,0.46], 0, 0, [0.40,0.20,0.16]);
  drawMesh(mouthVAO, [-0.015, -0.202, 0.176], [0.0,0.0,-0.10], [0.78,0.38,0.46], 0, 0, [0.36,0.18,0.14]);
  drawMesh(mouthVAO, [0.015, -0.202, 0.176], [0.0,0.0,0.10], [0.78,0.38,0.46], 0, 0, [0.36,0.18,0.14]);
  drawMesh(mouthVAO, [0.045, -0.20, 0.175], [0.0,0.0,-0.12], [0.78,0.38,0.46], 0, 0, [0.40,0.20,0.16]);
  }
  window.drawScene = drawScene;
  // === Hierarchical Animation Handler ===
function updateHierarchy(time) {
  if (!window.SmolivNodes) return;
  const N = window.SmolivNodes;

  // Ambil root transform
  const root = N.root;
  const fruit = N.fruit;
  const leaves = N.leaves;
  const feet = N.feet;

  // Matriks root
  const rootMat = mat4.create();
  mat4.translate(rootMat, rootMat, root.pos);
  const rotAngle = Math.hypot(root.rot[0], root.rot[1], root.rot[2]);
  if (rotAngle > 1e-4) {
    const axis = [root.rot[0]/rotAngle, root.rot[1]/rotAngle, root.rot[2]/rotAngle];
    mat4.rotate(rootMat, rootMat, rotAngle, axis);
  }
  mat4.scale(rootMat, rootMat, root.scale);

  // === Hierarki: semua bagian ikut root ===
  // Fruit
  fruit.world = mat4.create();
  mat4.copy(fruit.world, rootMat);
  mat4.translate(fruit.world, fruit.world, [0.00, 0.26, 0.00]);

  // Leaves mengikuti fruit
  leaves.forEach((leaf, i) => {
    leaf.world = mat4.create();
    mat4.copy(leaf.world, fruit.world);
    mat4.translate(leaf.world, leaf.world, leaf.pos);
    if (leaf.rot) {
      const a = Math.hypot(leaf.rot[0], leaf.rot[1], leaf.rot[2]);
      if (a > 1e-4) {
        const axis = [leaf.rot[1], leaf.rot[2], leaf.rot[3]];
        mat4.rotate(leaf.world, leaf.world, a, axis);
      }
    }
    mat4.scale(leaf.world, leaf.world, leaf.scale);
  });

  // Feet mengikuti root
  feet.forEach((foot) => {
    foot.world = mat4.create();
    mat4.copy(foot.world, rootMat);
    mat4.translate(foot.world, foot.world, foot.pos);
    if (foot.rot) {
      const a = Math.hypot(foot.rot[0], foot.rot[1], foot.rot[2]);
      if (a > 1e-4) {
        const axis = [foot.rot[1], foot.rot[2], foot.rot[3]];
        mat4.rotate(foot.world, foot.world, a, axis);
      }
    }
    mat4.scale(foot.world, foot.world, foot.scale);
  });
}

  function render(){
    resize();
    gl.clearColor(0.94,0.86,0.72,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    // Tambahan: panggil updateHierarchy agar transform diterapkan sebelum menggambar
    if (typeof updateHierarchy === "function") {
        updateHierarchy(performance.now());
    }

    const aspect=canvas.width/canvas.height;
    const proj=mat4.create();
    mat4.perspective(proj,Math.PI/4,aspect,0.01,20);
    const camPos=[
      cam.distance*Math.cos(cam.rotX)*Math.sin(cam.rotY),
      cam.distance*Math.sin(cam.rotX)+0.1,
      cam.distance*Math.cos(cam.rotX)*Math.cos(cam.rotY)
    ];
    const view=mat4.create();
    mat4.lookAt(view,camPos,cam.target,[0,1,0]);
    gl.uniformMatrix4fv(uView,false,view);
    gl.uniformMatrix4fv(uProj,false,proj);
  gl.uniform3fv(uLightPos,lightPos);
  gl.uniform3fv(uViewPos,camPos);

  drawScene();

    requestAnimationFrame(render);
  }
    render();
  } catch (err) {
    console.error('Runtime error in smoliv.js:', err);
  }
  // === Tambahan Animasi Hierarkis Smoliv (non-intrusif) ===
window.addEventListener("load", () => {
  setTimeout(() => {
    if (typeof window.SmolivNodes === "undefined") {
      console.warn("SmolivNodes belum siap, animasi dilewati.");
      return;
    }

    const SmolivNodes = window.SmolivNodes;
    let start = performance.now();

    function easeInOutSine(x) {
      return 0.5 - 0.5 * Math.cos(Math.PI * x);
    }

    function updateAnim(time) {
      const t = (time - start) / 1000.0;
      const cycle = t % 10.0;

      // Reset
      SmolivNodes.root.pos = [0, 0, 0];
      SmolivNodes.root.scale = [1, 1, 1];
      SmolivNodes.root.rot = [0, 1, 0, 0];

      const walkOsc = Math.sin(t * 6.0) * 0.05;

      // === 1. Jalan ke depan (0–3 s)
      if (cycle < 3.0) {
        const p = cycle / 3.0;
        SmolivNodes.root.pos[0] = 0.6 * easeInOutSine(p);
        SmolivNodes.feet[0].pos[1] = -0.36 + walkOsc;
        SmolivNodes.feet[1].pos[1] = -0.36 - walkOsc;
      }

      // === 2. Lompat (3–4 s)
      else if (cycle < 4.0) {
        const p = (cycle - 3.0);
        const y = Math.sin(p * Math.PI) * 0.5;
        const s = 1.0 + Math.sin(p * Math.PI) * 0.3;
        SmolivNodes.root.pos[0] = 0.6;
        SmolivNodes.root.pos[1] = y;
        SmolivNodes.root.scale = [1 / Math.sqrt(s), s, 1 / Math.sqrt(s)];
      }

      // === 3. Mendarat (4–5 s)
      else if (cycle < 5.0) {
        const p = (cycle - 4.0);
        const squash = 1.0 + Math.sin(p * Math.PI) * 0.4;
        SmolivNodes.root.pos = [0.6, 0, 0];
        SmolivNodes.root.scale = [squash, 1 / squash, squash];
      }

      // === 4. Putar dan jalan balik (5–8 s)
      else if (cycle < 8.0) {
        const p = (cycle - 5.0) / 3.0;
        const ang = Math.PI * p;
        SmolivNodes.root.rot = [0, 1, 0, ang];
        SmolivNodes.root.pos[0] = 0.6 * (1.0 - easeInOutSine(p));
        SmolivNodes.feet[0].pos[1] = -0.36 + walkOsc;
        SmolivNodes.feet[1].pos[1] = -0.36 - walkOsc;
      }

      // === 5. Lompat kedua (8–10 s)
      else {
        const p = (cycle - 8.0) / 2.0;
        const y = Math.sin(p * Math.PI) * 0.5;
        const s = 1.0 + Math.sin(p * Math.PI) * 0.3;
        SmolivNodes.root.pos[1] = y;
        SmolivNodes.root.scale = [1 / Math.sqrt(s), s, 1 / Math.sqrt(s)];
      }
    }

    function loop() {
      updateAnim(performance.now());
      requestAnimationFrame(loop);
    }

    console.log("✅ Animasi hierarkis Smoliv aktif (versi non-intrusif).");
    loop();
  }, 1000);
});

})();