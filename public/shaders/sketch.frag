precision mediump float;

uniform vec2 uResolution;
uniform float uGrid;
uniform sampler2D uNoise;

uniform vec2 uSensorPos[25];
uniform float uSensorT[25];
uniform float uSensorClick[25];
uniform int uSensorCount;

uniform vec2 uSegments[200];
uniform int uSegmentCount;
uniform vec2 uEndPoint;

uniform vec2 uFreq[50];   // 최대 50개
uniform int uFreqCount;

// #include sdf.glsl
// #include connections.glsl
// #include sensors.glsl
// #include contour.glsl

void main() {
  vec2 p = gl_FragCoord.xy;
  p.y = uResolution.y - p.y;

  vec3 col = vec3(1.0, 1.0, 1.0);

  col = drawContour(p, col);
  col = drawConnections(p, col);
  col = drawSensors(p, col);
  //col = drawDither(p, col); // 맨 마지막에 전체에 적용

  gl_FragColor = vec4(col, 1.0);
}
