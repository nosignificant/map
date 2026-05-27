precision mediump float;

uniform vec2 uResolution;
uniform float uGrid;
uniform sampler2D uNoise;

uniform vec2 uTenOccupied[200];
uniform int uTenCount;

// #include sdf.glsl
// #include tapestry.glsl

void main(){
    vec2 p = gl_FragCoord.xy;
    p.y = uResolution.y - p.y;

    vec3 col = vec3(0.0);
    col = drawTapestry(p, col);

    float a = max(col.r, max(col.g, col.b));
    gl_FragColor = vec4(col, a);
}
