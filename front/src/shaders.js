export const vertex1 = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main() {
 gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
 vTextureCoord = aTextureCoord;
}
`

export const fragment1 = `
// precision highp float;
precision mediump float;
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main() {
 // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
 vec4 c = texture2D(uSampler, vTextureCoord);
 gl_FragColor = c;
 //gl_FragColor.rgb *= c.a;
 
}
`

// TODO : https://tsherif.github.io/webgl2examples/dof.html