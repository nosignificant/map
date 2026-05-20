precision mediump float;

uniform sampler2D uMainTex;
uniform vec2 uResolution;

vec3 sampleSpread(vec2 uv, float dist) {
  float px = dist / uResolution.x;
  float py = dist / uResolution.y;
  vec3 c = vec3(0.0);
  c = max(c, texture2D(uMainTex, uv + vec2( px,  0.0)).rgb);
  c = max(c, texture2D(uMainTex, uv + vec2(-px,  0.0)).rgb);
  c = max(c, texture2D(uMainTex, uv + vec2( 0.0,  py)).rgb);
  c = max(c, texture2D(uMainTex, uv + vec2( 0.0, -py)).rgb);
  c = max(c, texture2D(uMainTex, uv + vec2( px,  py)).rgb);
  c = max(c, texture2D(uMainTex, uv + vec2(-px,  py)).rgb);
  c = max(c, texture2D(uMainTex, uv + vec2( px, -py)).rgb);
  c = max(c, texture2D(uMainTex, uv + vec2(-px, -py)).rgb);
  return c;
}

void main() {
  // gl_FragCoord 기반 UV → 4분할 없음
  vec2 uv = gl_FragCoord.xy / uResolution;
  uv.y = 1.0 - uv.y;

  vec3 original = texture2D(uMainTex, uv).rgb;

  // 10px, 20px, 30px 오프셋으로 퍼지며 점점 약해짐
  vec3 spread1 = sampleSpread(uv, 10.0) * 0.7;
  vec3 spread2 = sampleSpread(uv, 20.0) * 0.45;
  vec3 spread3 = sampleSpread(uv, 30.0) * 0.25;

  vec3 col = max(original, spread1);
  col = max(col, spread2);
  col = max(col, spread3);

  gl_FragColor = vec4(col, 1.0);
}
