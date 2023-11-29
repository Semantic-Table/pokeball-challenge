void main() {
  //Disc
  // float strength = 1.0 - step(0.5,distance(gl_PointCoord, vec2(0.5)));

  //Diffuse
  // float strength = distance(gl_PointCoord, vec2(0.5));
  // strength *= 2.0;
  // strength = 1.0 - strength;


  //Light Point Pattern
  float strength = distance(gl_PointCoord, vec2(0.5));
  strength = 1.0 - strength;
  strength = pow(strength, 10.0);
  vec3 color = vec3(5,5,5);


  gl_FragColor = vec4(color, 1.0);
} 