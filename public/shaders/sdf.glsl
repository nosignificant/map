float lineSegment(vec2 p, vec2 a, vec2 b, float w) {
  // a~p 벡터와 a~b벡터 
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
