float density(vec2 p) {
  float dist = length(p - uEndPoint);
  return 1.0 / (1.0 + dist * dist * 0.0001);
}

float manualFwidth(vec2 p) {
  float dx = density(p + vec2(1.5, 0.0)) - density(p - vec2(1.5, 0.0));
  float dy = density(p + vec2(0.0, 1.5)) - density(p - vec2(0.0, 1.5));
  return length(vec2(dx, dy)) + 0.0001;
}

vec3 drawContour(vec2 p, vec3 col) {
  float d = density(p);
  float fw = manualFwidth(p);

  // 내부 흰색 채우기
  float fill = smoothstep(0.5, 1.5, d);
  col = mix(col, vec3(0.0, 0.0, 1.0), fill);

  // 등고선
  float z = d * 1.0;
  float band = fract(z);
  if (mod(z, 2.0) > 1.0) band = 1.0 - band;
  float lineVal = band / fw;
  float c = 1.0 - clamp(lineVal, 0.0, 1.0);

  return mix(col, vec3(0.0), c);
}
