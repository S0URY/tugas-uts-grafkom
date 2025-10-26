// combined.js — semua model tampil bersama dalam 1 ruangan
(() => {
  const canvas = document.getElementById('c');
  const gl = canvas.getContext('webgl2', {antialias:true});
  if (!gl) return alert('WebGL2 tidak didukung browser ini.');

  // Resize handler
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // === Shader ===
  const vs = `#version 300 es
  in vec3 aPosition;
  in vec3 aNormal;
  uniform mat4 uModel, uView, uProj;
  out vec3 vN, vW;
  void main(){
    vec4 w = uModel * vec4(aPosition,1.0);
    vN = mat3(uModel) * aNormal;
    vW = w.xyz;
    gl_Position = uProj * uView * w;
  }`;

  const fs = `#version 300 es
  precision highp float;
  in vec3 vN;
  out vec4 o;
  uniform vec3 uColor;
  uniform vec3 uLightDir;
  void main(){
    vec3 N = normalize(vN);
    float diff = max(0.2, dot(N, normalize(-uLightDir))*0.8 + 0.2);
    o = vec4(uColor * diff, 1.0);
  }`;

  function makeShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw gl.getShaderInfoLog(s);
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw gl.getProgramInfoLog(prog);
  gl.useProgram(prog);

  // === Pencahayaan & latar ===
  gl.clearColor(0.94, 0.96, 0.99, 1);
  gl.enable(gl.DEPTH_TEST);
  const lightDir = new Float32Array([0.5, 0.9, 0.4]);
  gl.uniform3fv(gl.getUniformLocation(prog, 'uLightDir'), lightDir);

  // === Utilitas matriks sederhana ===
  const M4 = {
    I: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
    mul(a,b){
      const o=new Float32Array(16);
      for(let c=0;c<4;c++) for(let r=0;r<4;r++)
        o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];
      return o;
    },
    T(x,y,z){const m=M4.I();m[12]=x;m[13]=y;m[14]=z;return m;},
    Rx(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I();m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;},
    Ry(a){const c=Math.cos(a),s=Math.sin(a),m=M4.I();m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;},
    persp(fovy,aspect,n,f){const t=Math.tan(fovy/2),m=M4.I();
      m[0]=1/(aspect*t);m[5]=1/t;m[10]=-(f+n)/(f-n);m[11]=-1;m[14]=-(2*f*n)/(f-n);m[15]=0;return m;},
    look(eye,ctr,up){
      const z=[eye[0]-ctr[0],eye[1]-ctr[1],eye[2]-ctr[2]];
      const zl=Math.hypot(...z);z[0]/=zl;z[1]/=zl;z[2]/=zl;
      const x=[up[1]*z[2]-up[2]*z[1],up[2]*z[0]-up[0]*z[2],up[0]*z[1]-up[1]*z[0]];
      const xl=Math.hypot(...x);x[0]/=xl;x[1]/=xl;x[2]/=xl;
      const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0],z[0]*x[1]-z[1]*x[0]];
      const m=M4.I();
      m[0]=x[0];m[4]=x[1];m[8]=x[2];
      m[1]=y[0];m[5]=y[1];m[9]=y[2];
      m[2]=z[0];m[6]=z[1];m[10]=z[2];
      m[12]=-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]);
      m[13]=-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]);
      m[14]=-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]);
      return m;
    }
  };

  // === Kamera kontrol ===
  const cam = {r: 8, theta: 0.8, phi: 0.8};
  let dragging=false, last=[0,0];
  canvas.addEventListener('pointerdown',e=>{
    dragging=true; last=[e.clientX,e.clientY];
  });
  canvas.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=(e.clientX-last[0])/150, dy=(e.clientY-last[1])/150;
    last=[e.clientX,e.clientY];
    cam.phi+=dx; cam.theta+=dy;
    cam.theta=Math.max(0.1,Math.min(Math.PI-0.1,cam.theta));
  });
  canvas.addEventListener('pointerup',()=>dragging=false);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault(); cam.r*=1+(e.deltaY*0.001);
    cam.r=Math.max(3,Math.min(15,cam.r));
  });

  function viewMat(){
    const x = cam.r * Math.sin(cam.theta) * Math.cos(cam.phi);
    const y = cam.r * Math.cos(cam.theta);
    const z = cam.r * Math.sin(cam.theta) * Math.sin(cam.phi);
    return M4.look([x,y,z],[0,1,0],[0,1,0]);
  }
  function projMat(){
    const aspect = canvas.width / canvas.height;
    return M4.persp(45*Math.PI/180, aspect, 0.1, 50);
  }

  const uP = gl.getUniformLocation(prog,'uProj');
  const uV = gl.getUniformLocation(prog,'uView');
  const uM = gl.getUniformLocation(prog,'uModel');
  const uC = gl.getUniformLocation(prog,'uColor');

  // === Render loop ===
  function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uP,false,projMat());
    gl.uniformMatrix4fv(uV,false,viewMat());

    // panggil fungsi dari tiap file model
    if(window.drawSmoliv)   window.drawSmoliv(gl, prog, uM, uC, [-3,0,0]);
    if(window.drawDolliv)   window.drawDolliv(gl, prog, uM, uC, [0,0,0]);
    if(window.drawArboliva) window.drawArboliva(gl, prog, uM, uC, [3,0,0]);

    requestAnimationFrame(render);
  }
  render();
})();