window.onload = main;

let g_angleX = 0, g_angleY = 0;
let g_rotVelocityX = 0, g_rotVelocityY = 0;
let g_isDragging = false;
let g_lastMouseX = 0, g_lastMouseY = 0;
let g_zoom = -25;
let g_targetZoom = -25;

function main() {
    // Setup pencahayaan

    const canvas = document.getElementById("glCanvas");
    const gl = canvas.getContext("webgl");
    if (!gl) { alert("WebGL tidak didukung"); return; }

    const shader = setupShaderProgram(gl);
    const program = shader.program;
    gl.useProgram(program);

    const lightDirLoc = gl.getUniformLocation(program, "uLightDirection");
    const lightColorLoc = gl.getUniformLocation(program, "uLightColor");
    const ambientColorLoc = gl.getUniformLocation(program, "uAmbientColor");

    gl.uniform3fv(lightDirLoc, [0.4, 1.0, 0.7]);

    gl.uniform3fv(lightColorLoc, [1.0, 0.95, 0.85]);

    gl.uniform3fv(ambientColorLoc, [0.3, 0.35, 0.4]);


    const COLOR = {
        DAUN: [0.2, 0.8, 0.2],
        BATANG: [0.7, 0.5, 0.2],
        KEPALA: [0.98, 0.96, 0.75],
        MATA: [0.2, 0.3, 0.1],
        BUAH: [0.35, 0.1, 0.6]
    };

    // OBJEK
    const kepala = createEllipsoid(1.0, 1.8, 1.0, 24, 24, COLOR.KEPALA);
    let mk = mat4.create();
    mat4.translate(mk, mk, [0, 6.2, 0]);
    const head = transformModel(kepala, mk);

    const daunKepala1 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunKepala1 = mat4.create();
    mat4.scale(mDaunKepala1, mDaunKepala1, [1, 0.4, 1]);
    mat4.translate(mDaunKepala1, mDaunKepala1, [-0.2, 25, -0.2]);
    mat4.rotateZ(mDaunKepala1, mDaunKepala1, 9.4);
    mat4.rotateY(mDaunKepala1, mDaunKepala1, 0.05);
    const daunkepala1 = transformModel(daunKepala1, mDaunKepala1);

    const daunKepala2 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunKepala2 = mat4.create();
    mat4.scale(mDaunKepala2, mDaunKepala2, [1, 0.4, 1]);
    mat4.translate(mDaunKepala2, mDaunKepala2, [0.2, 25, -0.2]);
    mat4.rotateZ(mDaunKepala2, mDaunKepala2, 9.45);
    mat4.rotateY(mDaunKepala2, mDaunKepala2, 0.05);
    const daunkepala2 = transformModel(daunKepala2, mDaunKepala2);

    const daunKepala3 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunKepala3 = mat4.create();
    mat4.scale(mDaunKepala3, mDaunKepala3, [0.7, 0.27, 0.7]);
    mat4.translate(mDaunKepala3, mDaunKepala3, [0.4, 34 , 0.4]);
    mat4.rotateZ(mDaunKepala3, mDaunKepala3, 9.4);
    mat4.rotateY(mDaunKepala3, mDaunKepala3, 10);
    const daunkepala3 = transformModel(daunKepala3, mDaunKepala3);

    const daunKepala4 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunKepala4 = mat4.create();
    mat4.scale(mDaunKepala4, mDaunKepala4, [0.7, 0.27, 0.7]);
    mat4.translate(mDaunKepala4, mDaunKepala4, [-0.4, 34, 0.4]);
    mat4.rotateZ(mDaunKepala4, mDaunKepala4, 9.45);
    mat4.rotateY(mDaunKepala4, mDaunKepala4, 0.05);
    const daunkepala4 = transformModel(daunKepala4, mDaunKepala4);

    const bawahDaunGeom = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.DAUN);
    let bwhDaun = mat4.create();
    mat4.translate(bwhDaun, bwhDaun, [0.3, 7.5, 0.4]);
    mat4.rotateY(bwhDaun, bwhDaun, 0.6);
    const bawahDaun = transformModel(bawahDaunGeom, bwhDaun);

    const bawahDaunGeom2 = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.DAUN);
    let bwhDaun2 = mat4.create();
    mat4.translate(bwhDaun2, bwhDaun2, [-0.3, 7.5, 0.4]);
    mat4.rotateY(bwhDaun2, bwhDaun2, 0.6);
    const bawahDaun2 = transformModel(bawahDaunGeom2, bwhDaun2);

    const daunKepala5 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunKepala5 = mat4.create();
    mat4.scale(mDaunKepala5, mDaunKepala5, [1, 0.27, 0.7]);
    mat4.translate(mDaunKepala5, mDaunKepala5, [-1.2, 34, -1.2]);
    mat4.rotateZ(mDaunKepala5, mDaunKepala5, 9.55);
    mat4.rotateX(mDaunKepala5, mDaunKepala5, 0.3);
    const daunkepala5 = transformModel(daunKepala5, mDaunKepala5);

    const daunKepala6 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunKepala6 = mat4.create();
    mat4.scale(mDaunKepala6, mDaunKepala6, [1, 0.27, 0.7]);
    mat4.translate(mDaunKepala6, mDaunKepala6, [1.2, 34, -1.2]);
    mat4.rotateZ(mDaunKepala6, mDaunKepala6, -9.55);
    mat4.rotateX(mDaunKepala6, mDaunKepala6, 0.3);
    const daunkepala6 = transformModel(daunKepala6, mDaunKepala6);

    const lengan = createCone(0.3, 0.25, 5, 24, COLOR.BATANG);
    let rantingKiriM = mat4.create();
    mat4.rotateZ(rantingKiriM, rantingKiriM, Math.PI / 2.1);
    mat4.translate(rantingKiriM, rantingKiriM, [4.5, 4.5, 0]);
    const rantingKiri = transformModel(lengan, rantingKiriM);

    let rantingKananM = mat4.create();
    mat4.rotateZ(rantingKananM, rantingKananM, -Math.PI / 2.1);
    mat4.translate(rantingKananM, rantingKananM, [4.5, 4.5, 0]);
    const rantingKanan = transformModel(lengan, rantingKananM);

    const daunSayapKiri = createCurvedLeaf(0.8, 0.3, 3.0, 32, 16, 0.6, 0.3, COLOR.DAUN);
    let mDaunSayapKiri = mat4.create();
    mat4.translate(mDaunSayapKiri, mDaunSayapKiri, [-4.2, 3.2, 0.3]);
    mat4.rotateZ(mDaunSayapKiri, mDaunSayapKiri, Math.PI / 6);
    mat4.rotateY(mDaunSayapKiri, mDaunSayapKiri, 1.0);
    const sayapKiri = transformModel(daunSayapKiri, mDaunSayapKiri);

    const daunSayapKanan = createCurvedLeaf(0.8, 0.3, 3.0, 32, 16, 0.6, 0.3, COLOR.DAUN);
    let mDaunSayapKanan = mat4.create();
    mat4.translate(mDaunSayapKanan, mDaunSayapKanan, [-4.2, 3.2, 0.3]);
    mat4.rotateZ(mDaunSayapKanan, mDaunSayapKanan, -Math.PI / 6);
    mat4.rotateY(mDaunSayapKanan, mDaunSayapKanan, -1.0);
    const sayapKanan = transformModel(daunSayapKanan, mDaunSayapKanan);

    const buahKiri = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.BUAH);
    let mbhKiri = mat4.create();
    mat4.translate(mbhKiri, mbhKiri, [3, 3, 0.4]);
    mat4.rotateY(mbhKiri, mbhKiri, 0.6);
    const oliveLeft = transformModel(buahKiri, mbhKiri);

    const buahKiri2 = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.BUAH);
    let mbhKiri2 = mat4.create();
    mat4.translate(mbhKiri2, mbhKiri2, [5, 2.5, 0.4]);
    mat4.rotateY(mbhKiri2, mbhKiri2, 0.6);
    const oliveLeft2 = transformModel(buahKiri2, mbhKiri2);

    const buahKiri3 = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.BUAH);
    let mbhKiri3 = mat4.create();
    mat4.translate(mbhKiri3, mbhKiri3, [7, 2.6, 0.4]);
    mat4.rotateY(mbhKiri3, mbhKiri3, 0.6);
    const oliveLeft3 = transformModel(buahKiri3, mbhKiri3);

    const buahKanan = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.BUAH);
    let mbhKanan = mat4.create();
    mat4.translate(mbhKanan, mbhKanan, [-3, 3, 0.4]);
    mat4.rotateY(mbhKanan, mbhKanan, -0.6);
    const oliveRight = transformModel(buahKanan, mbhKanan);

    const buahKanan2 = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.BUAH);
    let mbhKanan2 = mat4.create();
    mat4.translate(mbhKanan2, mbhKanan2, [-5, 2.5, 0.4]);
    mat4.rotateY(mbhKanan2, mbhKanan2, -0.6);
    const oliveRight2 = transformModel(buahKanan2, mbhKanan2);

    const buahKanan3 = createEllipsoidWithDepression(0.5, 0.7, 0.5, 24, 24, 0.25, COLOR.BUAH);
    let mbhKanan3 = mat4.create();
    mat4.translate(mbhKanan3, mbhKanan3, [-7, 2.6, 0.4]);
    mat4.rotateY(mbhKanan3, mbhKanan3, -0.6);
    const oliveRight3 = transformModel(buahKanan3, mbhKanan3);

    const mataKiri = createCurvedEye(0.4, 0.2, 30, COLOR.MATA);
    let mk2 = mat4.create();
    mat4.translate(mk2, mk2, [-0.4, 6.7, 0.8]);
    mat4.rotateX(mk2, mk2, -0.2);
    mat4.rotateY(mk2, mk2, -0.3);
    const mataL = transformModel(mataKiri, mk2);

    const mataKanan = createCurvedEye(0.4, 0.2, 30, COLOR.MATA);
    let mk3 = mat4.create();
    mat4.translate(mk3, mk3, [0.4, 6.7, 0.8]);
    mat4.rotateX(mk3, mk3, -0.2);
    mat4.rotateY(mk3, mk3, 0.3);
    const mataR = transformModel(mataKanan, mk3);

    const akarKiri = createCone(0.5, 0.2, 3, 16, COLOR.BATANG);
    let ma1 = mat4.create();
    mat4.rotateZ(ma1, ma1, 0.5);
    mat4.translate(ma1, ma1, [1.2, 0, 0]);
    const rootL = transformModel(akarKiri, ma1);

    const akarKanan = createCone(0.5, 0.2, 3, 16, COLOR.BATANG);
    let ma2 = mat4.create();
    mat4.rotateZ(ma2, ma2, -0.5);
    mat4.translate(ma2, ma2, [-1.2, 0, 0]);
    const rootR = transformModel(akarKanan, ma2);

    const daunLeher = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunLeher = mat4.create();
    mat4.scale(mDaunLeher, mDaunLeher, [1, 0.5, 1.4]);
    mat4.translate(mDaunLeher, mDaunLeher, [1.7, 13, 0]);
    mat4.rotateZ(mDaunLeher, mDaunLeher, 9.1);
    mat4.rotateY(mDaunLeher, mDaunLeher, 8);
    mat4.rotateX(mDaunLeher, mDaunLeher, 0.001);
    const daunleher = transformModel(daunLeher, mDaunLeher);

    const daunLeher2 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunLeher2 = mat4.create();
    mat4.scale(mDaunLeher2, mDaunLeher2, [1, 0.5, 1.4]);
    mat4.translate(mDaunLeher2, mDaunLeher2, [-1.7, 13, 0]);
    mat4.rotateZ(mDaunLeher2, mDaunLeher2, -9.1);
    mat4.rotateY(mDaunLeher2, mDaunLeher2, 0.5);
    const daunleher2 = transformModel(daunLeher2, mDaunLeher2);

    const daunLeher3 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunLeher3 = mat4.create();
    mat4.scale(mDaunLeher3, mDaunLeher3, [1.4, 0.5, 1]);
    mat4.translate(mDaunLeher3, mDaunLeher3, [0.5, 12, 1.1]);
    mat4.rotateX(mDaunLeher3, mDaunLeher3, 0.25);
    mat4.rotateZ(mDaunLeher3, mDaunLeher3, 3);
    const daunleher3 = transformModel(daunLeher3, mDaunLeher3);

    const daunLeher4 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunLeher4 = mat4.create();
    mat4.scale(mDaunLeher4, mDaunLeher4, [1.4, 0.5, 1]);
    mat4.translate(mDaunLeher4, mDaunLeher4, [-0.5, 12, 1.1]);
    mat4.rotateX(mDaunLeher4, mDaunLeher4, 0.25);
    mat4.rotateZ(mDaunLeher4, mDaunLeher4, -3);
    const daunleher4 = transformModel(daunLeher4, mDaunLeher4);

    const daunLeher5 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunLeher5 = mat4.create();
    mat4.scale(mDaunLeher5, mDaunLeher5, [1.4, 0.5, 1]);
    mat4.translate(mDaunLeher5, mDaunLeher5, [0.6, 14, -1.4]);
    mat4.rotateX(mDaunLeher5, mDaunLeher5, -0.25);
    mat4.rotateZ(mDaunLeher5, mDaunLeher5, -3.2);
    mat4.rotateY(mDaunLeher5, mDaunLeher5, -0.5);
    const daunleher5 = transformModel(daunLeher5, mDaunLeher5);

    const daunLeher6 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunLeher6 = mat4.create();
    mat4.scale(mDaunLeher6, mDaunLeher6, [1.4, 0.5, 1]);
    mat4.translate(mDaunLeher6, mDaunLeher6, [-0.6, 14, -1.4]);
    mat4.rotateX(mDaunLeher6, mDaunLeher6, -0.25);  
    mat4.rotateZ(mDaunLeher6, mDaunLeher6,  3.2);
    mat4.rotateY(mDaunLeher6, mDaunLeher6, -0.5);
    const daunleher6 = transformModel(daunLeher6, mDaunLeher6);
    
    const daunLeher7 = createParaboloid(0.4, 6, 16, 17, COLOR.DAUN);
    let mDaunLeher7 = mat4.create();
    mat4.scale(mDaunLeher7, mDaunLeher7, [1.6, 0.55, 1.3]);
    mat4.translate(mDaunLeher7, mDaunLeher7, [-0.2, 14, -1.5]);
    mat4.rotateZ(mDaunLeher7, mDaunLeher7, 3.2);
    mat4.rotateX(mDaunLeher7, mDaunLeher7, 6.5);
    const daunleher7 = transformModel(daunLeher7, mDaunLeher7);

    const daunKiriGeom = createCurvedOvalLeaf(
        0.4, 0.45, 3.5, 5, 2,
        0.4 , 0.15, 0.6, COLOR.DAUN
    );

    let mDaunKiri1 = mat4.create();
    mat4.translate(mDaunKiri1, mDaunKiri1, [2, 4.7, 0]);
    mat4.rotateY(mDaunKiri1, mDaunKiri1, Math.PI / 2);
    mat4.rotateZ(mDaunKiri1, mDaunKiri1, -Math.PI / 10); 
    mat4.rotateX(mDaunKiri1, mDaunKiri1, 0.1);
    const daunKiri1 = transformModel(daunKiriGeom, mDaunKiri1);

    let mDaunKiri2 = mat4.create();
    mat4.translate(mDaunKiri2, mDaunKiri2, [2, 3.5, 0]);
    mat4.rotateX(mDaunKiri2, mDaunKiri2, -Math.PI / -2); 
    mat4.rotateY(mDaunKiri2, mDaunKiri2, Math.PI / 3); 
    mat4.rotateZ(mDaunKiri2, mDaunKiri2, 2); 
    const daunKiri2 = transformModel(daunKiriGeom, mDaunKiri2);

    let mDaunKiri3 = mat4.create();
    mat4.translate(mDaunKiri3, mDaunKiri3, [3, 4.4, 0]);
    mat4.rotateY(mDaunKiri3, mDaunKiri3, Math.PI / 2);
    mat4.rotateZ(mDaunKiri3, mDaunKiri3, -Math.PI / 10); 
    mat4.rotateX(mDaunKiri3, mDaunKiri3, 0.1);
    const daunKiri3 = transformModel(daunKiriGeom, mDaunKiri3);

    let mDaunKiri4 = mat4.create();
    mat4.translate(mDaunKiri4, mDaunKiri4, [3, 3.2, 0]);
    mat4.rotateX(mDaunKiri4, mDaunKiri4, -Math.PI / -2); 
    mat4.rotateY(mDaunKiri4, mDaunKiri4, Math.PI / 3); 
    mat4.rotateZ(mDaunKiri4, mDaunKiri4, 2); 
    const daunKiri4 = transformModel(daunKiriGeom, mDaunKiri4);

    let mDaunKiri5 = mat4.create();
    mat4.translate(mDaunKiri5, mDaunKiri5, [4.3, 4, 0]);
    mat4.rotateY(mDaunKiri5, mDaunKiri5, Math.PI / 2);
    mat4.rotateZ(mDaunKiri5, mDaunKiri5, -Math.PI / 10); 
    mat4.rotateX(mDaunKiri5, mDaunKiri5, -0.1);
    const daunKiri5 = transformModel(daunKiriGeom, mDaunKiri5);

    let mDaunKiri6 = mat4.create();
    mat4.translate(mDaunKiri6, mDaunKiri6, [4, 3, 0]);
    mat4.rotateX(mDaunKiri6, mDaunKiri6, -Math.PI / -2); 
    mat4.rotateY(mDaunKiri6, mDaunKiri6, Math.PI / 3.5); 
    mat4.rotateZ(mDaunKiri6, mDaunKiri6, 2); 
    const daunKiri6 = transformModel(daunKiriGeom, mDaunKiri6);

    let mDaunKiri7 = mat4.create();
    mat4.translate(mDaunKiri7, mDaunKiri7, [5.4, 3.8, 0]);
    mat4.rotateY(mDaunKiri7, mDaunKiri7, Math.PI / 2);
    mat4.rotateZ(mDaunKiri7, mDaunKiri7, -Math.PI / 10.2); 
    mat4.rotateX(mDaunKiri7, mDaunKiri7, -0.2);
    const daunKiri7 = transformModel(daunKiriGeom, mDaunKiri7);

    let mDaunKiri8 = mat4.create();
    mat4.translate(mDaunKiri8, mDaunKiri8, [5, 2.8, 0]);
    mat4.rotateX(mDaunKiri8, mDaunKiri8, -Math.PI / -2.2); 
    mat4.rotateY(mDaunKiri8, mDaunKiri8, Math.PI / 2.9); 
    mat4.rotateZ(mDaunKiri8, mDaunKiri8, 2); 
    const daunKiri8 = transformModel(daunKiriGeom, mDaunKiri8);

    let mDaunKiri9 = mat4.create();
    mat4.translate(mDaunKiri9, mDaunKiri9, [6.9, 3.8, 0]);
    mat4.rotateY(mDaunKiri9, mDaunKiri9, Math.PI / 2);
    mat4.rotateZ(mDaunKiri9, mDaunKiri9, -Math.PI / 10.2); 
    mat4.rotateX(mDaunKiri9, mDaunKiri9, -0.45);
    const daunKiri9 = transformModel(daunKiriGeom, mDaunKiri9);

    let mDaunKiri10 = mat4.create();
    mat4.translate(mDaunKiri10, mDaunKiri10, [6, 2.8, 0]);
    mat4.rotateX(mDaunKiri10, mDaunKiri10, -Math.PI / -2); 
    mat4.rotateY(mDaunKiri10, mDaunKiri10, Math.PI / 2.5); 
    mat4.rotateZ(mDaunKiri10, mDaunKiri10, 2); 
    const daunKiri10 = transformModel(daunKiriGeom, mDaunKiri10);

    let mDaunKiri11 = mat4.create();
    mat4.translate(mDaunKiri11, mDaunKiri11, [7.9, 3.8, 0]);
    mat4.rotateY(mDaunKiri11, mDaunKiri11, Math.PI / 2);
    mat4.rotateZ(mDaunKiri11, mDaunKiri11, -Math.PI / 10.2); 
    mat4.rotateX(mDaunKiri11, mDaunKiri11, -0.45);
    const daunKiri11 = transformModel(daunKiriGeom, mDaunKiri11);

    let mDaunKiri12 = mat4.create();
    mat4.translate(mDaunKiri12, mDaunKiri12, [7.2, 2.8, 0]);
    mat4.rotateX(mDaunKiri12, mDaunKiri12, -Math.PI / -2); 
    mat4.rotateY(mDaunKiri12, mDaunKiri12, Math.PI / 2.5); 
    mat4.rotateZ(mDaunKiri12, mDaunKiri12, 2); 
    const daunKiri12 = transformModel(daunKiriGeom, mDaunKiri12);

    let mDaunKiri13 = mat4.create();
    mat4.translate(mDaunKiri13, mDaunKiri13, [8.9, 3.7, 0]);
    mat4.rotateY(mDaunKiri13, mDaunKiri13, Math.PI / 2);
    mat4.rotateZ(mDaunKiri13, mDaunKiri13, -Math.PI / 10.2); 
    mat4.rotateX(mDaunKiri13, mDaunKiri13, -0.45);
    const daunKiri13 = transformModel(daunKiriGeom, mDaunKiri13);

    let mDaunKiri14 = mat4.create();
    mat4.translate(mDaunKiri14, mDaunKiri14, [9.2, 2.8, 0]);
    mat4.rotateX(mDaunKiri14, mDaunKiri14, -Math.PI / -2); 
    mat4.rotateY(mDaunKiri14, mDaunKiri14, Math.PI / 2.5); 
    mat4.rotateZ(mDaunKiri14, mDaunKiri14, 2); 
    const daunKiri14 = transformModel(daunKiriGeom, mDaunKiri14);

    const daunKananGeom = createCurvedOvalLeaf(
        0.4, 0.45, 3.5, 5, 2,
        0.4 , 0.15, 0.6, COLOR.DAUN
    );

    let mDaunKanan1 = mat4.create();
    mat4.translate(mDaunKanan1, mDaunKanan1, [-2, 4.7, 0]);
    mat4.rotateY(mDaunKanan1, mDaunKanan1, -Math.PI / 2);
    mat4.rotateZ(mDaunKanan1, mDaunKanan1, Math.PI / 10);
    mat4.rotateX(mDaunKanan1, mDaunKanan1, 0.1);
    const daunKanan1 = transformModel(daunKananGeom, mDaunKanan1);

    let mDaunKanan2 = mat4.create();
    mat4.translate(mDaunKanan2, mDaunKanan2, [-2, 3.5, 0]);
    mat4.rotateX(mDaunKanan2, mDaunKanan2, -Math.PI / -2);
    mat4.rotateY(mDaunKanan2, mDaunKanan2, -Math.PI / 3);
    mat4.rotateZ(mDaunKanan2, mDaunKanan2, -2);
    const daunKanan2 = transformModel(daunKananGeom, mDaunKanan2);

    let mDaunKanan3 = mat4.create();
    mat4.translate(mDaunKanan3, mDaunKanan3, [-3, 4.4, 0]);
    mat4.rotateY(mDaunKanan3, mDaunKanan3, -Math.PI / 2);
    mat4.rotateZ(mDaunKanan3, mDaunKanan3, Math.PI / 10);
    mat4.rotateX(mDaunKanan3, mDaunKanan3, 0.1);
    const daunKanan3 = transformModel(daunKananGeom, mDaunKanan3);

    let mDaunKanan4 = mat4.create();
    mat4.translate(mDaunKanan4, mDaunKanan4, [-3, 3.2, 0]);
    mat4.rotateX(mDaunKanan4, mDaunKanan4, -Math.PI / -2);
    mat4.rotateY(mDaunKanan4, mDaunKanan4, -Math.PI / 3);
    mat4.rotateZ(mDaunKanan4, mDaunKanan4, -2);
    const daunKanan4 = transformModel(daunKananGeom, mDaunKanan4);

    let mDaunKanan5 = mat4.create();
    mat4.translate(mDaunKanan5, mDaunKanan5, [-4.3, 4, 0]);
    mat4.rotateY(mDaunKanan5, mDaunKanan5, -Math.PI / 2);
    mat4.rotateZ(mDaunKanan5, mDaunKanan5, Math.PI / 10);
    mat4.rotateX(mDaunKanan5, mDaunKanan5, -0.1);
    const daunKanan5 = transformModel(daunKananGeom, mDaunKanan5);

    let mDaunKanan6 = mat4.create();
    mat4.translate(mDaunKanan6, mDaunKanan6, [-4, 3, 0]);
    mat4.rotateX(mDaunKanan6, mDaunKanan6, -Math.PI / -2);
    mat4.rotateY(mDaunKanan6, mDaunKanan6, -Math.PI / 3.5);
    mat4.rotateZ(mDaunKanan6, mDaunKanan6, -2);
    const daunKanan6 = transformModel(daunKananGeom, mDaunKanan6);

    let mDaunKanan7 = mat4.create();
    mat4.translate(mDaunKanan7, mDaunKanan7, [-5.4, 3.8, 0]);
    mat4.rotateY(mDaunKanan7, mDaunKanan7, -Math.PI / 2);
    mat4.rotateZ(mDaunKanan7, mDaunKanan7, Math.PI / 10.2);
    mat4.rotateX(mDaunKanan7, mDaunKanan7, -0.2);
    const daunKanan7 = transformModel(daunKananGeom, mDaunKanan7);

    let mDaunKanan8 = mat4.create();
    mat4.translate(mDaunKanan8, mDaunKanan8, [-5, 2.8, 0]);
    mat4.rotateX(mDaunKanan8, mDaunKanan8, -Math.PI / -2.2);
    mat4.rotateY(mDaunKanan8, mDaunKanan8, -Math.PI / 2.9);
    mat4.rotateZ(mDaunKanan8, mDaunKanan8, -2);
    const daunKanan8 = transformModel(daunKananGeom, mDaunKanan8);

    let mDaunKanan9 = mat4.create();
    mat4.translate(mDaunKanan9, mDaunKanan9, [-6.9, 3.8, 0]);
    mat4.rotateY(mDaunKanan9, mDaunKanan9, -Math.PI / 2);
    mat4.rotateZ(mDaunKanan9, mDaunKanan9, Math.PI / 10.2);
    mat4.rotateX(mDaunKanan9, mDaunKanan9, -0.45);
    const daunKanan9 = transformModel(daunKananGeom, mDaunKanan9);

    let mDaunKanan10 = mat4.create();
    mat4.translate(mDaunKanan10, mDaunKanan10, [-6, 2.8, 0]);
    mat4.rotateX(mDaunKanan10, mDaunKanan10, -Math.PI / -2);
    mat4.rotateY(mDaunKanan10, mDaunKanan10, -Math.PI / 2.5);
    mat4.rotateZ(mDaunKanan10, mDaunKanan10, -2);
    const daunKanan10 = transformModel(daunKananGeom, mDaunKanan10);

    let mDaunKanan11 = mat4.create();
    mat4.translate(mDaunKanan11, mDaunKanan11, [-7.9, 3.8, 0]);
    mat4.rotateY(mDaunKanan11, mDaunKanan11, -Math.PI / 2);
    mat4.rotateZ(mDaunKanan11, mDaunKanan11, Math.PI / 10.2);
    mat4.rotateX(mDaunKanan11, mDaunKanan11, -0.45);
    const daunKanan11 = transformModel(daunKananGeom, mDaunKanan11);

    let mDaunKanan12 = mat4.create();
    mat4.translate(mDaunKanan12, mDaunKanan12, [-7.2, 2.8, 0]);
    mat4.rotateX(mDaunKanan12, mDaunKanan12, -Math.PI / -2);
    mat4.rotateY(mDaunKanan12, mDaunKanan12, -Math.PI / 2.5);
    mat4.rotateZ(mDaunKanan12, mDaunKanan12, -2);
    const daunKanan12 = transformModel(daunKananGeom, mDaunKanan12);

    let mDaunKanan13 = mat4.create();
    mat4.translate(mDaunKanan13, mDaunKanan13, [-8.9, 3.7, 0]);
    mat4.rotateY(mDaunKanan13, mDaunKanan13, -Math.PI / 2);
    mat4.rotateZ(mDaunKanan13, mDaunKanan13, Math.PI / 10.2);
    mat4.rotateX(mDaunKanan13, mDaunKanan13, -0.45);
    const daunKanan13 = transformModel(daunKananGeom, mDaunKanan13);

    let mDaunKanan14 = mat4.create();
    mat4.translate(mDaunKanan14, mDaunKanan14, [-9.2, 2.8, 0]);
    mat4.rotateX(mDaunKanan14, mDaunKanan14, -Math.PI / -2);
    mat4.rotateY(mDaunKanan14, mDaunKanan14, -Math.PI / 2.5);
    mat4.rotateZ(mDaunKanan14, mDaunKanan14, -2);
    const daunKanan14 = transformModel(daunKananGeom, mDaunKanan14);
    
    const badan2 = createEllipsoid(1.0, 1.8, 1.0, 24, 24, COLOR.BATANG);
    let mbadan = mat4.create();
    mat4.translate(mbadan, mbadan, [0, 2.6, 0]);
    const bbadan = transformModel(badan2, mbadan);

    const badan = createCone(0.4, 0.6, 1.5, 10, COLOR.BATANG);
    let mb = mat4.create();
    mat4.translate(mb, mb, [0, 0.39, 0]);
    const body = transformModel(badan, mb);

    const badan3 = createCone(0.5, 0.5, 4, 15, COLOR.DAUN);
    let mb2 = mat4.create();
    mat4.translate(mb2, mb2, [0, 3.9, 0]);
    const body2 = transformModel(badan3, mb2);

    const tangan = createEllipsoid(0.4, 1.2, 0.8, 24, 24, COLOR.KEPALA);
    let mtangan = mat4.create();
    mat4.translate(mtangan, mtangan, [1, 3, 0]);
    const btangan = transformModel(tangan, mtangan);

    const tangan2 = createEllipsoid(0.4, 1.2, 0.8, 24, 24, COLOR.KEPALA);
    let mtangan2 = mat4.create();
    mat4.translate(mtangan2, mtangan2, [-1, 3, 0]);
    const btangan2 = transformModel(tangan2, mtangan2);

    const motif = createEllipsoid(0.8, 1.2, 0.4, 24, 24, COLOR.KEPALA);
    let mmotif = mat4.create();
    mat4.translate(mmotif, mmotif, [-0.2, 3.7, 0.4]);
    mat4.rotateY(mmotif, mmotif, -Math.PI / 5);
    mat4.rotateX(mmotif, mmotif, Math.PI / -7);
    const bmotif = transformModel(motif, mmotif);

    const motif2 = createEllipsoid(0.8, 1.2, 0.4, 24, 24, COLOR.KEPALA);
    let mmotif2 = mat4.create();
    mat4.translate(mmotif2, mmotif2, [0.2, 3.7, 0.4]);
    mat4.rotateY(mmotif2, mmotif2, Math.PI / 5);
    mat4.rotateX(mmotif2, mmotif2, Math.PI / -7);
    const bmotif2 = transformModel(motif2, mmotif2);

    const motif3 = createEllipsoid(1, 1.6, 0.4, 24, 24, COLOR.KEPALA);
    let mmotif3 = mat4.create();
    mat4.translate(mmotif3, mmotif3, [0, 3.2, -0.8]);
    mat4.rotateX(mmotif3, mmotif3, Math.PI / 15);  
    const bmotif3 = transformModel(motif3, mmotif3);

    const motif4 = createEllipsoid(0.8, 1.2, 0.4, 24, 24, COLOR.DAUN);
    let mmotif4 = mat4.create();
    mat4.translate(mmotif4, mmotif4, [-0.6, 3.7, -0.7]);
    mat4.rotateY(mmotif4, mmotif4, -Math.PI / -5);
    mat4.rotateX(mmotif4, mmotif4, Math.PI / 7);
    const bmotif4 = transformModel(motif4, mmotif4);

    const motif5 = createEllipsoid(0.8, 1.2, 0.4, 24, 24, COLOR.DAUN);
    let mmotif5 = mat4.create();
    mat4.translate(mmotif5, mmotif5, [0.6, 3.7, -0.7]);
    mat4.rotateY(mmotif5, mmotif5, -Math.PI / 5);
    mat4.rotateX(mmotif5, mmotif5, Math.PI / 7);
    const bmotif5 = transformModel(motif5, mmotif5);

    const motif6 = createEllipsoid(0.6, 1.2, 0.4, 24, 24, COLOR.DAUN);
    let mmotif6 = mat4.create();
    mat4.translate(mmotif6, mmotif6, [-0.6, 4.5, 0.6]);
    mat4.rotateY(mmotif6, mmotif6, -Math.PI / 5);
    mat4.rotateX(mmotif6, mmotif6, Math.PI / -5);
    mat4.rotateZ(mmotif6, mmotif6, -Math.PI / 9);
    const bmotif6 = transformModel(motif6, mmotif6);

    const motif7 = createEllipsoid(0.6, 1.2, 0.4, 24, 24, COLOR.DAUN);
    let mmotif7 = mat4.create();
    mat4.translate(mmotif7, mmotif7, [0.6, 4.5, 0.6]);
    mat4.rotateY(mmotif7, mmotif7, -Math.PI / -5);
    mat4.rotateX(mmotif7, mmotif7, Math.PI / -5);
    mat4.rotateZ(mmotif7, mmotif7, Math.PI / 9);
    const bmotif7 = transformModel(motif7, mmotif7);

    const root = createEllipsoid(0.4, 2.2, 0.4, 24, 24, COLOR.BATANG);
    let mroot = mat4.create();
    mat4.translate(mroot, mroot, [0.7, -0.7, -0.6]);
    mat4.rotateY(mroot, mroot, -Math.PI / 8);
    mat4.rotateX(mroot, mroot, Math.PI / 5);
    mat4.rotateZ(mroot, mroot, Math.PI / 9);
    const broot = transformModel(root, mroot);

    const root2 = createEllipsoid(0.4, 2.2, 0.4, 24, 24, COLOR.BATANG);
    let mroot2 = mat4.create();
    mat4.translate(mroot2, mroot2, [0.7, -0.7, 0.6]);
    mat4.rotateY(mroot2, mroot2, -Math.PI / -8);
    mat4.rotateX(mroot2, mroot2, Math.PI / -5);
    mat4.rotateZ(mroot2, mroot2, Math.PI / 9);
    const broot2 = transformModel(root2, mroot2);

    const root3= createEllipsoid(0.4, 2.2, 0.4, 24, 24, COLOR.BATANG);
    let mroot3= mat4.create();
    mat4.translate(mroot3, mroot3, [-0.7, -0.7, -0.6]);
    mat4.rotateY(mroot3, mroot3, -Math.PI / -8);
    mat4.rotateX(mroot3, mroot3, Math.PI / 5);
    mat4.rotateZ(mroot3, mroot3, Math.PI / -9);
    const broot3 = transformModel(root3, mroot3);

    const root4 = createEllipsoid(0.4, 2.2, 0.4, 24, 24, COLOR.BATANG);
    let mroot4 = mat4.create();
    mat4.translate(mroot4, mroot4, [-0.7, -0.7, 0.6]);
    mat4.rotateY(mroot4, mroot4, -Math.PI / 8);
    mat4.rotateX(mroot4, mroot4, Math.PI / -5);
    mat4.rotateZ(mroot4, mroot4, Math.PI / -9);
    const broot4 = transformModel(root4, mroot4);

    const root5 = createEllipsoid(0.28, 2.2, 0.2, 24, 24, COLOR.KEPALA);
    let mroot5 = mat4.create();
    mat4.translate(mroot5, mroot5, [-0.25, -0.4, 0]);
    const broot5 = transformModel(root5, mroot5);

    const root6 = createEllipsoid(0.28, 2.2, 0.2, 24, 24, COLOR.KEPALA);
    let mroot6 = mat4.create();
    mat4.translate(mroot6, mroot6, [0.25, -0.4, 0]);
    const broot6 = transformModel(root6, mroot6);

    const allModels = mergeModels([
        head, body,
        oliveLeft, oliveRight, oliveLeft2, oliveRight2, oliveLeft3, oliveRight3,
        mataL, mataR, broot, broot2, broot3, broot4, broot5, broot6,
        daunleher, daunleher2, daunleher3, daunleher4, daunleher5, daunleher6, daunleher7,
        daunKiri1, daunKiri2, daunKiri3, daunKiri4, daunKiri5, daunKiri6, daunKiri7, daunKiri8, daunKiri9, daunKiri10,
        daunKiri11, daunKiri12, daunKiri13, daunKiri14,
        daunKanan1, daunKanan2, daunKanan3, daunKanan4, daunKanan5, daunKanan6, daunKanan7, daunKanan8, daunKanan9, daunKanan10,
        daunKanan11, daunKanan12, daunKanan13, daunKanan14,
        daunkepala1, daunkepala2, daunkepala3, daunkepala4, daunkepala5, daunkepala6,
        bawahDaun, bawahDaun2,
        bbadan, btangan, btangan2, body2, bmotif, bmotif2, bmotif3, bmotif4, bmotif5, bmotif6, bmotif7
    ]);

    const buffers = initBuffers(gl, allModels, shader);

    setupMouseHandlers(canvas);

    let lastTime = performance.now();

    function draw(now) {
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        // Inertia Rotasi
        if (!g_isDragging) {
            if (g_autoRotate) g_angleY += g_autoSpeed * dt;
            g_angleX += g_rotVelocityX * dt;
            g_angleY += g_rotVelocityY * dt;
            g_rotVelocityX *= 0.95;
            g_rotVelocityY *= 0.95;
        }

        g_zoom += (g_targetZoom - g_zoom) * 0.1;

        // Render Scene
        resizeCanvasToDisplaySize(canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.9, 0.95, 0.8, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let pMat = mat4.create();
        mat4.perspective(pMat, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);
        let mvMat = mat4.create();
        mat4.translate(mvMat, mvMat, [0, -3, g_zoom]);
        mat4.rotateX(mvMat, mvMat, g_angleX);
        mat4.rotateY(mvMat, mvMat, g_angleY);

        let nMat = mat4.create();
        mat4.invert(nMat, mvMat);
        mat4.transpose(nMat, nMat);

        gl.uniformMatrix4fv(shader.uniformLocations.projectionMatrix, false, pMat);
        gl.uniformMatrix4fv(shader.uniformLocations.modelViewMatrix, false, mvMat);
        gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, nMat);

        gl.drawElements(gl.TRIANGLES, allModels.indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}
    let g_autoRotate = false;
    let g_orbitEnabled = true;
    let g_panEnabled = false;
    let g_autoSpeed = 0.2;
// Setup Mouse Handler
function setupMouseHandlers(canvas) {
    let lastTime = 0;

    canvas.addEventListener('mousedown', (e) => {
        g_isDragging = true;
        g_lastMouseX = e.clientX;
        g_lastMouseY = e.clientY;
        g_rotVelocityX = 0;
        g_rotVelocityY = 0;
        lastTime = performance.now();
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!g_isDragging) return;
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        const deltaX = e.clientX - g_lastMouseX;
        const deltaY = e.clientY - g_lastMouseY;

        if (g_orbitEnabled) {
            g_angleY += deltaX * 0.005;
            g_angleX += deltaY * 0.005;
            g_angleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, g_angleX));
        }
        if (g_panEnabled) {
            // Pan (geser posisi kamera)
            g_targetZoom += deltaY * 0.01;
        }
        g_angleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, g_angleX));

        g_rotVelocityY = deltaX * 0.02 / dt;
        g_rotVelocityX = deltaY * 0.02 / dt;

        g_lastMouseX = e.clientX;
        g_lastMouseY = e.clientY;
    });

    canvas.addEventListener('mouseup', () => { g_isDragging = false; });
    canvas.addEventListener('mouseleave', () => { g_isDragging = false; });

    canvas.addEventListener('wheel', (e) => {
        g_targetZoom -= e.deltaY * 0.01;
        g_targetZoom = Math.min(-3, Math.max(-40, g_targetZoom));
        e.preventDefault();
    });
}

document.getElementById("btnOrbit").addEventListener("click", () => {
    g_orbitEnabled = !g_orbitEnabled;
    document.getElementById("btnOrbit").textContent = "Orbit: " + (g_orbitEnabled ? "ON" : "OFF");
    document.getElementById("btnOrbit").classList.toggle("active", g_orbitEnabled);
});

document.getElementById("btnPan").addEventListener("click", () => {
    g_panEnabled = !g_panEnabled;
    document.getElementById("btnPan").textContent = "Pan: " + (g_panEnabled ? "ON" : "OFF");
    document.getElementById("btnPan").classList.toggle("active", g_panEnabled);
});

document.getElementById("btnAuto").addEventListener("click", () => {
    g_autoRotate = !g_autoRotate;
    document.getElementById("btnAuto").textContent = "Auto-Rotate: " + (g_autoRotate ? "ON" : "OFF");
    document.getElementById("btnAuto").classList.toggle("active", g_autoRotate);
});

// Shader setup
function setupShaderProgram(gl) {
    const vsSource = document.getElementById('vertex-shader').textContent;
    const fsSource = document.getElementById('fragment-shader').textContent;
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Shader link error: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uPMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uMVMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNMatrix'),
        },
    };
}

function initBuffers(gl, model, shader) {
    const posBuf = createAndBindBuffer(gl, new Float32Array(model.vertices), gl.ARRAY_BUFFER);
    const normBuf = createAndBindBuffer(gl, new Float32Array(model.normals), gl.ARRAY_BUFFER);
    const colBuf = createAndBindBuffer(gl, new Float32Array(model.colors), gl.ARRAY_BUFFER);
    const idxBuf = createAndBindBuffer(gl, new Uint16Array(model.indices), gl.ELEMENT_ARRAY_BUFFER);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.vertexAttribPointer(shader.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
    gl.vertexAttribPointer(shader.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribLocations.vertexNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
    gl.vertexAttribPointer(shader.attribLocations.vertexColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.attribLocations.vertexColor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
}

function createAndBindBuffer(gl, data, target) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return buffer;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Shader error: ' + gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function resizeCanvasToDisplaySize(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}

// FUNGSI UTILITAS
function resizeCanvasToDisplaySize(canvas) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }
}

function transformModel(model, matrix) {
    let v = [], n = [];
    for (let i = 0; i < model.vertices.length; i += 3) {
        const pos = vec3.transformMat4([], [model.vertices[i], model.vertices[i+1], model.vertices[i+2]], matrix);
        v.push(...pos);
    }
    for (let i = 0; i < model.normals.length; i += 3) {
        const norm = vec3.transformMat4([], [model.normals[i], model.normals[i+1], model.normals[i+2]], matrix);
        vec3.normalize(norm, norm);
        n.push(...norm);
    }
    return { ...model, vertices: v, normals: n };
}

function mergeModels(models) {
    let vertices=[],normals=[],colors=[],indices=[];
    let offset=0;
    for (const m of models) {
        vertices.push(...m.vertices);
        normals.push(...m.normals);
        colors.push(...m.colors);
        indices.push(...m.indices.map(i => i + offset));
        offset += m.vertices.length / 3;
    }
    return { vertices, normals, colors, indices };
}

// BASE GEOMETRY
function createEllipsoid(rx, ry, rz, latBands, longBands, color) {
    let vertices = [], normals = [], colors = [], indices = [];
    for (let lat = 0; lat <= latBands; lat++) {
        const theta = lat * Math.PI / latBands;
        const sinT = Math.sin(theta), cosT = Math.cos(theta);
        for (let lon = 0; lon <= longBands; lon++) {
            const phi = lon * 2 * Math.PI / longBands;
            const sinP = Math.sin(phi), cosP = Math.cos(phi);
            const x = rx * cosP * sinT, y = ry * cosT, z = rz * sinP * sinT;
            vertices.push(x, y, z);
            const n = vec3.normalize([], [x / rx, y / ry, z / rz]);
            normals.push(...n);
            colors.push(...color);
        }
    }
    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < longBands; lon++) {
            const first = lat * (longBands + 1) + lon;
            const second = first + longBands + 1;
            indices.push(first, second, first + 1, second, second + 1, first + 1);
        }
    }
    return { vertices, normals, colors, indices };
}

function createCone(base, top, height, slices, color) {
    let vertices = [], normals = [], colors = [], indices = [];
    const half = height / 2;
    for (let i = 0; i <= slices; i++) {
        const ang = (i / slices) * 2 * Math.PI;
        const cosA = Math.cos(ang), sinA = Math.sin(ang);
        vertices.push(cosA * top, half, sinA * top);
        normals.push(cosA, height, sinA);
        colors.push(...color);
        vertices.push(cosA * base, -half, sinA * base);
        normals.push(cosA, height, sinA);
        colors.push(...color);
    }
    for (let i = 0; i < slices; i++) {
        const i0 = i * 2, i1 = i * 2 + 1, i2 = (i + 1) * 2, i3 = (i + 1) * 2 + 1;
        indices.push(i0, i1, i3, i0, i3, i2);
    }
    return { vertices, normals, colors, indices };
}

function createParaboloid(r, h, slices, stacks, color) {
    let vertices = [], normals = [], colors = [], indices = [];
    for (let i = 0; i <= stacks; i++) {
        const y = (i / stacks) * h;
        const radius = r * Math.sqrt(y / h);
        for (let j = 0; j <= slices; j++) {
            const ang = j * 2 * Math.PI / slices;
            const x = radius * Math.cos(ang);
            const z = radius * Math.sin(ang);
            vertices.push(x, y, z);
            normals.push(x, 0.5, z);
            colors.push(...color);
        }
    }
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            const a = i * (slices + 1) + j;
            const b = a + slices + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
    }
    return { vertices, normals, colors, indices };
}

function createEllipsoidWithDepression(rx, ry, rz, segU, segV, depression, color) {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];

    for (let i = 0; i <= segU; i++) {
        const theta = i * Math.PI / segU;
        for (let j = 0; j <= segV; j++) {
            const phi = j * 2 * Math.PI / segV;

            let x = rx * Math.sin(theta) * Math.cos(phi);
            let y = ry * Math.sin(theta) * Math.sin(phi);
            let z = rz * Math.cos(theta);

            const r2 = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            z -= depression * r2 * rz; 

            vertices.push(x, y, z);
            normals.push(x / rx, y / ry, z / rz);
            colors.push(...color);
        }
    }

    for (let i = 0; i < segU; i++) {
        for (let j = 0; j < segV; j++) {
            const first = i * (segV + 1) + j;
            const second = first + segV + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    return { vertices, normals, colors, indices };
}

function createCurvedLeaf(radiusX, radiusY, length, slices, stacks, curveDepth, depression, color) {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];

    for (let i = 0; i <= stacks; i++) {
        const v = i / stacks;
        const y = v * length;
        const bend = Math.sin(v * Math.PI) * curveDepth;
        for (let j = 0; j <= slices; j++) {
            const u = j / slices;
            const angle = (u - 0.5) * Math.PI;
            const x = radiusX * Math.sin(angle);
            const z = radiusY * Math.cos(angle) - bend;
            vertices.push(x, y, z - depression * Math.sin(v * Math.PI));
            normals.push(x, 0.3, z);
            colors.push(...color);
        }
    }

    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            const a = i * (slices + 1) + j;
            const b = a + slices + 1;
            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }

    return { vertices, normals, colors, indices };
}

function createCurvedEye(radius, width, segments, color) {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];

    const startAngle = Math.PI * 1.25;
    const endAngle = Math.PI * 1.75;

    for (let i = 0; i <= segments; i++) {
        const ang = startAngle + (i / segments) * (endAngle - startAngle);
        const x = Math.cos(ang) * radius;
        const y = Math.sin(ang) * radius;
        const z = 0;

        vertices.push(x, y, -width / 2);
        normals.push(0, 0, -1);
        colors.push(...color);

        vertices.push(x, y, width / 2);
        normals.push(0, 0, 1);
        colors.push(...color);

        if (i < segments) {
            const a = i * 2;
            const b = a + 2;
            indices.push(a, a + 1, b);
            indices.push(a + 1, b + 1, b);
        }
    }

    return { vertices, normals, colors, indices };
}

function createCurvedOvalLeaf(
    rx, ry, length, slices, stacks,
    curveDepth, depression, tipRoundness, color
) {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];

    for (let i = 0; i <= stacks; i++) {
        const v = i / stacks;

        const z = v * length - length / 2;

        const bend = Math.sin(v * Math.PI) * curveDepth;

        const taper = 1.0 - 0.85 * Math.pow(v, 1.5);
        const round = 1.0 - tipRoundness * Math.pow(v, 2.5);

        const smoothTip = 1.0 - 0.5 * Math.pow(Math.sin(v * Math.PI / 2), 3);

        for (let j = 0; j <= slices; j++) {
            const u = j / slices;
            const angle = u * 2 * Math.PI;

            let x = rx * Math.cos(angle) * taper * smoothTip;
            let y = ry * Math.sin(angle) * taper * smoothTip;

            const tipBulge = tipRoundness * 0.4 * Math.pow(Math.sin(v * Math.PI), 3);
            y += tipBulge;
            y -= bend;
            const depressionFactor = depression * Math.sin(v * Math.PI) * Math.cos(angle);

            const finalZ = z - depressionFactor;
            vertices.push(x, y, finalZ);

            const nx = x / rx;
            const ny = (y + bend) / ry;
            const nz = finalZ / length;
            const invLen = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
            normals.push(nx * invLen, ny * invLen, nz * invLen);

            colors.push(...color);
        }
    }

    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            const a = i * (slices + 1) + j;
            const b = a + slices + 1;
            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }

    return { vertices, normals, colors, indices };
}
