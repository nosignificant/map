vec3 drawTapestry(vec2 p, vec3 col) {
  vec2 gridP = floor(p / uGrid + 0.5) * uGrid;

  bool occupied = false;
  float minBoxSDF = 9999.0;
  float metaField = 0.0;
  float metaRadius = uGrid * 0.48;

  for (int i = 0; i < 200; i++) {
    if (i >= uTenCount) break;
    if (length(gridP - uTenOccupied[i]) < uGrid * 0.5) occupied = true;

    vec2 d = abs(p - uTenOccupied[i]) - vec2(uGrid * 0.26);
    float boxD = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    minBoxSDF = min(minBoxSDF, boxD);

    // metaball 필드: 반경 내 포인트만 계산
    float md = length(p - uTenOccupied[i]);
    if (md < metaRadius * 2.0) {
      md = max(md, 0.001);
      metaField += (metaRadius * metaRadius) / (md * md);
    }
  }

  // metaball 내부 채우기: threshold 1.0 이상이면 색칠
  float metaFill = smoothstep(0.8, 1.05, metaField);

  // occupied 영역
  if (occupied) {
    if (minBoxSDF > -uGrid && minBoxSDF < 0.0) {
      vec2 noiseUV = p / 256.0;
      float n = texture2D(uNoise, noiseUV).r;
      float prob = 0.5 * (1.0 - (-minBoxSDF) / uGrid);
      if (n < prob) {
        col = mix(col, vec3(0, 0, 255), 1.0);
      }
    }
    col = mix(col, vec3(0, 0, 255), metaFill);
    return col;
  }

  col = mix(col, vec3(0, 0, 255), metaFill);

  return col;
}
