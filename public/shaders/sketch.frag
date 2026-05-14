precision mediump float;

//화면 해상도 
uniform vec2 uResolution;
//그리드 한칸 크기 
uniform float uGrid;
//노이즈 텍스쳐 
uniform sampler2D uNoise;

// 진동센서 위치 
uniform vec2 uSensorPos[25];
//센서 개수 
uniform int uSensorCount;

//경로 
uniform vec2 uSegments[100];
uniform int uSegmentCount;
uniform vec2 uEndPoint;

//tentacle이 차지하고 있는 위치 
uniform vec2 uTenOccupied[200];
uniform int uTenCount;

uniform vec2 uTrail[50];
uniform int uTrailCount;

// #include sdf.glsl
// #include tapestry.glsl


void main(){
    vec2 p = gl_FragCoord.xy;
    p.y = uResolution.y - p.y;

    vec3 col = vec3(1.0, 1.0, 1.0);

    col = drawTapestry(p, col);

      gl_FragColor = vec4(col, 1.0);

}