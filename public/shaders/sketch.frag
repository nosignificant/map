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

//tentacle이 차지하고 있는 위치
uniform vec2 uTenOccupied[200];
uniform int uTenCount;

// #include sdf.glsl
// #include connections.glsl
// #include tapestry.glsl


void main(){
    vec2 p = gl_FragCoord.xy;
    p.y = uResolution.y - p.y;

    vec3 col = vec3(0.0, 0.0, 0.0);

    col = drawConnections(p, col);
    col = drawTapestry(p, col);

    // 뭔가 그려진 곳(색이 0이 아닌 곳)은 완전 불투명, 배경은 투명
    float brightness = max(col.r, max(col.g, col.b));
    float a = brightness > 0.001 ? 1.0 : 0.0;
    gl_FragColor = vec4(col, a);

}