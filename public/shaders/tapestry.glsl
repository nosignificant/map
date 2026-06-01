vec3 drawTapestry(vec2 p, vec3 col) {
  float metaField = 0.0;
  float metaRadius = uGrid * 0.48;

  for (int i = 0; i < 200; i++) {
    if (i >= uTenCount) break;

    // metaball 필드: 반경 내 포인트만 계산
    float md = length(p - uTenOccupied[i]);
    if (md < metaRadius * 2.5) {
      md = max(md, 0.001);
      metaField += (metaRadius * metaRadius) / (md * md);
    }
  }

  // iso-contour(metaField ≈ 1.0) 주변만 테두리로 — 내부는 안 채움
  float EDGE_W = 0.5; // 테두리 두께(필드 단위)
  float edge = 1.0 - smoothstep(0.0, EDGE_W, abs(metaField - 1.0));

  col = mix(col, vec3(0, 0, 255), edge);

  return col;
}
