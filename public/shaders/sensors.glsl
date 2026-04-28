vec3 drawSensors(vec2 p, vec3 col) {
  for (int i = 0; i < 25; i++) {
    if (i >= uSensorCount) break;
    vec2 sp = uSensorPos[i];

    float r = ring(p, sp, uGrid * 0.5, 1.0);
    col = mix(col, vec3(1.0, 0.0, 0.0), r);

    if (uSensorClick[i] > 0.0) {
      float gr = ring(p, sp, uSensorT[i], 1.5);
      col = mix(col, vec3(0.0), gr);
    }
  }
  return col;
}
