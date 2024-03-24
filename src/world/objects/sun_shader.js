const sunVertex = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const sunFragment = `
#define EPSILON 0.02

varying vec2 vUv;
uniform vec2 u_resolution;
uniform float time;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float influence1 = abs(sin(time + uv.x * .8));
    float influence2 = abs(cos(time + uv.y * .3));

    float green = influence1 * influence2;
    float red = abs(sin(time + ((uv.x + uv.y) / 2.))) * .2 + .8;
    
    vec3 col = vec3(red, green, 0.);
    gl_FragColor = vec4(col, 1.0);
}
`

export {sunVertex, sunFragment};