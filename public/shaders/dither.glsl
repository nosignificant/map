vec3 drawDither(vec2 p, vec3 col) {
  vec2 noiseUV = fract(gl_FragCoord.xy / 300.0);
  float noise = texture2D(uNoise, noiseUV).r;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float dithered = step(noise, lum);
  return mix(col, vec3(1.0), dithered);
}
