precision mediump float;

uniform vec2 uResolution;
uniform float uGrid;
uniform sampler2D uNoise;

uniform vec2 uSensorPos[25];
uniform float uSensorT[25];
uniform float uSensorClick[25];
uniform int uSensorCount;

// connection 선분들 (최대 100개 = start/end 쌍 200개의 vec2)
uniform vec2 uSegments[200];
uniform int uSegmentCount;

uniform vec2 uNear[200];
uniform int uNearCount;

float lineSegment(vec2 p, vec2 a, vec2 b, float w) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float d = length(pa - ba * h);
  return smoothstep(w + 1.0, w - 1.0, d);
}

float ring(vec2 p, vec2 c, float r, float w) {
  float d = abs(length(p - c) - r);
  return smoothstep(w, 0.0, d);
}

float circle(vec2 p, vec2 c, float r) {
  return smoothstep(r + 1.0, r - 1.0, length(p - c));
}

void main() {
  vec2 p = gl_FragCoord.xy;
  p.y = uResolution.y - p.y; // p5 좌표계 (Y 위에서 아래)

vec3 col = vec3(200.0/255.0, 210.0/255.0, 255.0/255.0);
  // // 격자선
  // float gx = mod(p.x, uGrid);
  // float gy = mod(p.y, uGrid);
  // float gridLine = step(gx, 0.5) + step(uGrid - gx, 0.5)
  //                + step(gy, 0.5) + step(uGrid - gy, 0.5);
  // col = mix(col, vec3(0.75), clamp(gridLine, 0.0, 1.0));

  // near 흰 네모
  for (int i = 0; i < 200; i++) {
    if (i >= uNearCount) break;
    vec2 d = abs(p - uNear[i]);
    if (d.x < uGrid * 0.5 && d.y < uGrid * 0.5) {
      col = vec3(255);
    }
  }

  // connection 선분들 (파랑)
  float conn = 0.0;
  for (int i = 0; i < 100; i++) {
    if (i >= uSegmentCount) break;
    conn = max(conn, lineSegment(p, uSegments[i * 2], uSegments[i * 2 + 1], 2.0));
  }
  col = mix(col, vec3(0.0, 0.0, 1.0), conn);

  // vSensor
  for (int i = 0; i < 25; i++) {
    if (i >= uSensorCount) break;
    vec2 sp = uSensorPos[i];

    // 빨간 링 (센서 위치 표시)
    float r = ring(p, sp, uGrid * 0.5, 1.0);
    col = mix(col, vec3(1.0, 0.0, 0.0), r);

    // 클릭됐을 때 커지는 원
    if (uSensorClick[i] > 0.0) {
      float gr = ring(p, sp, uSensorT[i], 1.5);
      col = mix(col, vec3(0.0), gr);
    }
  }

  // noise 기반 디더링
  vec2 noiseUV = fract(gl_FragCoord.xy / 400.0);
  float noise = texture2D(uNoise, noiseUV).r;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float dithered = step(noise, lum * 0.5);
  //col = mix(col, vec3(1.0), dithered);

  gl_FragColor = vec4(col, 1.0);
}
