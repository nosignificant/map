vec3 drawTapestry(vec2 p, vec3 col) {
  vec2 gridP = floor(p / uGrid + 0.5) * uGrid;

  // sub-grid 점 (작은 격자 중심)
  float subGrid = 15.0;
  vec2 subGridP = floor(p / subGrid) * subGrid + subGrid * 0.5;

  // tenOccupied 체크 + sub-grid 점이 경계선까지 거리
  bool occupied = false;
  float minBoxSdf = 9999.0;
  for (int i = 0; i < 200; i++) {
    if (i >= uTenCount) break;
    if (length(gridP - uTenOccupied[i]) < uGrid * 0.5) occupied = true;
    vec2 d = abs(subGridP - uTenOccupied[i]) - vec2(uGrid * 0.4);
    float boxD = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    minBoxSdf = min(minBoxSdf, boxD);
  }

  // sub-grid 십자 모양 (공통)
  vec2 subLocal = p - subGridP;
  float crossThick = 1.0;
  float crossLen = 4.0;
  float h = step(abs(subLocal.y), crossThick) * step(abs(subLocal.x), crossLen);
  float v = step(abs(subLocal.x), crossThick) * step(abs(subLocal.y), crossLen);
  float cross = max(h, v);

  // occupied (흰색) 영역
  if (occupied) {
    // 경계선 안쪽 1칸 침범한 검은 십자 (랜덤)
    if (minBoxSdf > -uGrid && minBoxSdf < 0.0) {
      vec2 noiseUV = subGridP / 256.0;
      float n = texture2D(uNoise, noiseUV).r;
      // 경계 가까울수록 확률 높음
      float prob = 0.5 * (1.0 - (-minBoxSdf) / uGrid);
      if (n < prob) {
        col = mix(col, vec3(0.0), cross);
      }
    }
    return col;
  }

  // 노란 영역 (occupied 아닌 곳)
  vec3 yellowCol = vec3(1.0, 0.85, 0.0);
  col = yellowCol;

  // 빨간 십자 (전체 노란 영역)
  col = mix(col, vec3(1.0, 0.0, 0.0), cross);

  // 경계선 한 줄에 검은 십자
  if (minBoxSdf > 0.0 && minBoxSdf < 8.0) {
    col = mix(col, vec3(0.0), cross);
  }

  return col;
}
