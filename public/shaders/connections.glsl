float crossMark(vec2 p, vec2 c, float size, float w) {
  vec2 d = abs(p - c);
  float h = smoothstep(w, 0.0, d.y) * step(d.x, size); // 가로
  float v = smoothstep(w, 0.0, d.x) * step(d.y, size); // 세로
  return clamp(h + v, 0.0, 1.0);
}

vec3 drawConnections(vec2 p, vec3 col) {
  float conn = 0.0;
  for (int i = 0; i < 100; i++) {
    if (i >= uSegmentCount) break;
    conn = max(conn, lineSegment(p, uSegments[i * 2], uSegments[i * 2 + 1], 2.0));
  }
  col = mix(col, vec3(1.0, 0.0, 0.0), conn); // 빨간 선

  // 10px 그리드에서 connection 근처면 십자 표시
  float gridSize = 20.0;
  vec2 gridP = floor(p / gridSize) * gridSize + gridSize * 0.5; // 가장 가까운 그리드 점
  float nearConn = 0.0;
  for (int i = 0; i < 100; i++) {
    if (i >= uSegmentCount) break;
    nearConn = max(nearConn, lineSegment(gridP, uSegments[i * 2], uSegments[i * 2 + 1], 15.0));
  }
  if (nearConn > 0.5) {
    float c = crossMark(p, gridP, 4.0, 0.8);
    col = mix(col, vec3(1.0, 0.0, 0.0), c);
  }
  float b = ring(p, uEndPoint, uGrid * 0.3, 1.5);
  col = mix(col, vec3(0.0), b);

  return col;
}
