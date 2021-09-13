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

export const vertex2 = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

varying highp vec2 vTextureCoord;
varying highp vec2 vFragCoord;

void main() {
 gl_Position = aVertexPosition;
 vTextureCoord = aTextureCoord;
 vFragCoord = vec2(aVertexPosition.x, aVertexPosition.y);
}
`

export const fragment2 = `
// precision highp float;
precision mediump float;
varying highp vec2 vTextureCoord;
varying highp vec2 vFragCoord;

uniform sampler2D uSampler;
uniform float time;

#define iterations 17
#define formuparam 0.53

#define volsteps 20
#define stepsize 0.1

#define zoom   0.800
#define tile   0.850
#define speed  0.010 

#define brightness 0.0015
#define darkmatter 0.300
#define distfading 0.730
#define saturation 0.850


void mainVR( out vec4 fragColor, in vec2 fragCoord, in vec3 ro, in vec3 rd )
{
	//get coords and direction
	vec3 dir=rd;
	vec3 from=ro;
	
	//volumetric rendering
	float s=0.1,fade=1.;
	vec3 v=vec3(0.);
	for (int r=0; r<volsteps; r++) {
		vec3 p=from+s*dir*.5;
		p = abs(vec3(tile)-mod(p,vec3(tile*2.))); // tiling fold
		float pa,a=pa=0.;
		for (int i=0; i<iterations; i++) { 
			p=abs(p)/dot(p,p)-formuparam; // the magic formula
			a+=abs(length(p)-pa); // absolute sum of average change
			pa=length(p);
		}
		float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a; // add contrast
		if (r>6) fade*=1.-dm; // dark matter, don't render near
		//v+=vec3(dm,dm*.5,0.);
		v+=fade;
		v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; // coloring based on distance
		fade*=distfading; // distance fading
		s+=stepsize;
	}
	v=mix(vec3(length(v)),v,saturation); //color adjust
	fragColor = vec4(v*.01,1.);	
}

void main() {
 vec4 c = vec4(mod(time,1.0), vTextureCoord.y, 0., 1.);
 gl_FragColor = vec4(0,0,0,1);

 vec3 dir = vec3(vTextureCoord*zoom,1.);
 float t = time * 0.006;
 vec3 from=vec3(1.0,0.5,0.5);
 from += vec3(0,-t,0.);
 mainVR(gl_FragColor, vFragCoord, from, dir);
}
`

// TODO : https://tsherif.github.io/webgl2examples/dof.html