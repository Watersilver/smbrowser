import { Filter } from "pixi.js";

export const fireMarioFilterUniforms = {
  red: 0.710,
}

const fireMarioFilter = new Filter(undefined, `
  varying vec2 vTextureCoord;
  uniform sampler2D uSampler;
  uniform float red;
  void main(void)
  {
    vec4 c = texture2D(uSampler, vTextureCoord);
    if (
      (c.x > 0.70 && c.y < 0.20 && c.z < 0.13)
    ) {
      gl_FragColor = vec4(0.969,0.847,0.647,c.a);
    } else if (
      (c.x < 0.43 && c.x > 0.4 && c.y < 0.43 && c.z < 0.02)
    ) {
      gl_FragColor = vec4(red,0.192,0.125,c.a);
    }  else {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  }
`, fireMarioFilterUniforms);

export default fireMarioFilter;