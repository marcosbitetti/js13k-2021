
//require('normalize.css/normalize.css');
require('./styles/index.scss');
import Soldier1 from './assets/soldier.png'
import Shot1 from './assets/fire.png'
import {vertex1, fragment1, vertex2, fragment2} from './shaders'
import {IDENT, PROJ, transl, transform} from './matrix'

var canvas, gl
var materialBG, material1, material2
var models = []
var then = 0

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
             return window.setTimeout(callback, 1000/60);
           };
  })();
  
/**
 * Provides cancelAnimationFrame in a cross browser way.
 */
window.cancelAnimFrame = (function() {
    return window.cancelAnimationFrame ||
           window.webkitCancelAnimationFrame ||
           window.mozCancelAnimationFrame ||
           window.oCancelAnimationFrame ||
           window.msCancelAnimationFrame ||
           window.clearTimeout;
})();

const fail = (n = 1) => {
    switch (n) {
        case 1:
            alert('Not supported yet')
        case 2:
            alert('Shadder error')
    }
}

const loadShader = (type, src) => {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.log(gl.getShaderInfoLog(s))
      return null
    }
    return s
}

const compileShader = (v, f) => {
    var s = gl.createProgram()
    gl.attachShader(s, loadShader(gl.VERTEX_SHADER, v))
    gl.attachShader(s, loadShader(gl.FRAGMENT_SHADER, f))
    gl.linkProgram(s)
    return s
}

// ex is a extra function to handle aditional parameters
const material = (s, img, ex = (o) => o) =>{
    const tex = gl.createTexture()
    const image = new Image()
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.generateMipmap(gl.TEXTURE_2D);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    //img && (image.src = img.indexOf('svg')<0 ? img : getBlobURL(img))
    img && (image.src = img)
    return ex({
        prog: s,
        texture: tex,
        att: {
            vertex: gl.getAttribLocation(s,'aVertexPosition'),
            uv: gl.getAttribLocation(s, 'aTextureCoord'),
        },
        uniform: {
            projectionMat: gl.getUniformLocation(s, 'uProjectionMatrix'),
            modelViewMat: gl.getUniformLocation(s, 'uModelViewMatrix'),
            tex: gl.getUniformLocation(s, 'uSampler'),
            time: gl.getUniformLocation(s, 'time'),
        }
    })
}

const model = (
    mat,
    ind = [
        0, 1, 2,
        2, 3, 0,
    ],
    pos = [
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        -1.0, 1.0,
    ],
    uv = [
        0,1,
        1,1,
        1,0,
        0,0,
    ]) => {
    const pBuff = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuff)
    gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(pos),
                gl.STATIC_DRAW)
    const uvBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuff)
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(uv),
            gl.STATIC_DRAW)
    const iBuff = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(ind),
            gl.STATIC_DRAW)
    return {
        bind: (pMatrix, vMatrix, time) => {
            //time = 0.5
            //console.log(time)
            // location from vertices
            gl.bindBuffer(gl.ARRAY_BUFFER, pBuff)
            gl.vertexAttribPointer(
                mat.att.vertex,
                2, // values per iterration
                gl.FLOAT,
                false, // no luse time normalizing it (for now)
                0, // stride aways be 0
                0, // offset aways be 0
            )
            gl.enableVertexAttribArray(mat.att.vertex)

            // uv coordinates
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuff)
            gl.vertexAttribPointer(
                mat.att.uv,
                2, // values per iterration
                gl.FLOAT,
                false, // no luse time normalizing it (for now)
                0, // stride aways be 0
                0, // offset aways be 0
            )
            gl.enableVertexAttribArray(mat.att.uv)

            // indices
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff)

            gl.useProgram(mat.prog)

            gl.uniform1f(mat.uniform.time, time);

            gl.uniformMatrix4fv(
                mat.uniform.projectionMat,
                false,
                pMatrix
            )
            gl.uniformMatrix4fv(
                mat.uniform.modelViewMat,
                false,
                vMatrix
            )

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mat.texture);

            gl.uniform1i(mat.uniform.tex, 0);

            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
        }
    }
}

const init = () => {
    console.clear()
    if (!window.WebGL2RenderingContext) return fail()
    // REF: https://csawesome.runestone.academy/runestone/books/published/learnwebgl2/appendices/webgl_context_options.html
    gl = canvas.getContext("webgl2", {
        alpha: false,
        premultipliedAlpha: false,
        antialias: true,
        depth: true,

    })
    if (!gl) return fail()
    window.gl = gl

    // prepare materials
    //materialBG = material(compileShader(vertex1, fragment1), Ground)
    materialBG = material(compileShader(vertex2, fragment2), null)
    material1 = material(compileShader(vertex1, fragment1), Soldier1)
    material2 = material(compileShader(vertex1, fragment1), Shot1)

    // prepare buffers
    models = [
        // grund
        model(materialBG, undefined, [
            -1.0,    -1.0,
            1.0,     -1.0,
            1.0,     1.0,
            -1.0,    1.0,
        ]),
        // soldier 1
        model(material1),
        // shot
        model(material2, undefined, ((t) => [
            -t,    -t,
            t,     -t,
            t,     t,
            -t,    t,
        ])(0.1)),
    ]

    if (!gl.getProgramParameter(material1.prog, gl.LINK_STATUS)) return fail(2)
}

let a = 0.0

const render = (now) => {
    now *= 0.001
    const delta = now - then
    then = now
    
    //gl.colorMask(false, false, false, true);
    gl.clearColor(0,0,0,1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.depthFunc(gl.LEQUAL)
    gl.enable(gl.BLEND);
    // alpha with true-color png
    //gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // alpha for palletized png
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // background
    models[0].bind(IDENT(), transl(0,0,0), then)


    // fire
    for(let s of shots) {
        s[1] += delta * 12
        models[2].bind(PROJ(), transform(s[0], s[1], -16, 0,1,0, 0), then)
    }

    // mainchar
    //a += 30*delta
    char.tilt += delta * (( 45 * char.mx) - char.tilt)
    char.x += char.mx * delta * 4
    char.y += char.my * delta * 4
    //models[1].bind(PROJ(), transl(char.x,char.y,-16.0))
    //models[1].bind(PROJ(), transform(char.x, char.y, -16, 0,1,1, a), then)
    models[1].bind(PROJ(), transform(char.x, char.y, -16, 0,1,0, char.tilt), then)

    if (char.fire) {
        char.t1 += delta
        if (char.t1>0.2) {
            shots.push([char.x, char.y - 0.2, 0])
            char.t1 = 0
        }
    }

    

    requestAnimFrame(render)
}

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementsByTagName('canvas')[0]
    init()
    requestAnimFrame(render)
});


const char = {
    x: 0, y: -5, 
    mx: 0, my : 0,
    tilt: 0,
    fire: false,
    t1: 0,
}

var shots = []

document.addEventListener("keydown", (e) => {
    //console.log(e)
    if (e.keyCode == 37 || e.keyCode==39) char.mx = {39: 1, 37: -1}[e.keyCode] || 0
    if (e.keyCode == 38 || e.keyCode==40) char.my = {38: 1, 40: -1}[e.keyCode] || 0
    if (e.keyCode == 32) char.fire = true
})

document.addEventListener("keyup", (e) => {
    if (e.keyCode == 37 || e.keyCode==39) char.mx = {39: 0, 37: 0}[e.keyCode] || 0
    if (e.keyCode == 38 || e.keyCode==40) char.my = {38: 0, 40: 0}[e.keyCode] || 0
    if (e.keyCode == 32) char.fire = false
})