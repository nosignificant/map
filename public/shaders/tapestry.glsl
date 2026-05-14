vec3 drawTapestry(vec2 p, vec3 col) {
  vec2 gridP = floor(p / uGrid + 0.5) * uGrid;

  // sub-grid 점 (작은 격자 중심)
  float subGrid = 15.0;
  vec2 subGridP = floor(p / subGrid) * subGrid + subGrid * 0.5;

  bool occupied = false;
  float minBoxSDF = 9999.0;
  float metaField = 0.0;
  float metaRadius = uGrid * 0.5;

  for (int i = 0; i < 200; i++) {
    if (i >= uTenCount) break;
    if (length(gridP - uTenOccupied[i]) < uGrid * 0.5) occupied = true;

    vec2 d = abs(subGridP - uTenOccupied[i]) - vec2(uGrid * 0.4);
    float boxD = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    minBoxSDF = min(minBoxSDF, boxD);

    // metaball 필드: 반경 내 포인트만 계산
    float md = length(p - uTenOccupied[i]);
    if (md < metaRadius * 2.0) {
      md = max(md, 0.001);
      metaField += (metaRadius * metaRadius) / (md * md);
    }
  }

  // sub-grid 십자 모양
  vec2 subLocal = p - subGridP;
  float crossThick = 1.0;
  float crossLen = 4.0;
  float h = step(abs(subLocal.y), crossThick) * step(abs(subLocal.x), crossLen);
  float v = step(abs(subLocal.x), crossThick) * step(abs(subLocal.y), crossLen);
  float cross = max(h, v);

  // metaball 경계선: threshold 1.0 양쪽에서 만나는 곳
  float metaEdge = smoothstep(0.8, 1.0, metaField) - smoothstep(1.0, 1.1, metaField);

  // occupied 영역
  if (occupied) {
    if (minBoxSDF > -uGrid && minBoxSDF < 0.0) {
      vec2 noiseUV = subGridP / 256.0;
      float n = texture2D(uNoise, noiseUV).r;
      float prob = 0.5 * (1.0 - (-minBoxSDF) / uGrid);
      if (n < prob) {
        col = mix(col, vec3(0.0), cross);
      }
    }
    col = mix(col, vec3(0.0), metaEdge);
    return col;
  }

  col = mix(col, vec3(0.0), metaEdge);

  return col;
}
