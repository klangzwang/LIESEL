import React, { useRef, useEffect } from 'react';

export interface AnimatedLogoProps {
  variant?: 'continuous' | 'progress';
  percent?: number; // 0 to 100
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  variant = 'continuous',
  percent = 0,
  className = "w-full h-full pointer-events-none"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use refs so the animation loop always sees the latest props without re-running the effect
  const variantRef = useRef(variant);
  const percentRef = useRef(percent);

  useEffect(() => {
    variantRef.current = variant;
    percentRef.current = percent;
  }, [variant, percent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;

      uniform float u_time;
      uniform vec2 u_resolution;
      uniform int u_variant;
      uniform float u_percent;

      #define PI 3.14159265359

      float min_d = 1000.0;
      float path_t = 0.0;

      void checkLine(vec2 p, vec2 a, vec2 b, float base_t, float len) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          float d = length(pa - ba * h);
          if (d < min_d) {
              min_d = d;
              path_t = base_t + h * len;
          }
      }

      void checkArc(vec2 p, vec2 c, float r, float dir, float base_t, float len) {
          vec2 q = p - c;
          float a = atan(q.y, q.x);
          float t_local = 0.0;
          float d = 0.0;
          
          if (dir > 0.0) { 
              if (q.x < 0.0) {
                  float d1 = length(q - vec2(0.0, r));
                  float d2 = length(q - vec2(0.0, -r));
                  if (d1 < d2) { d = d1; t_local = 0.0; }
                  else { d = d2; t_local = 1.0; }
              } else {
                  d = abs(length(q) - r);
                  t_local = (PI/2.0 - a) / PI;
              }
          } else { 
              if (q.x > 0.0) {
                  float d1 = length(q - vec2(0.0, r));
                  float d2 = length(q - vec2(0.0, -r));
                  if (d1 < d2) { d = d1; t_local = 0.0; }
                  else { d = d2; t_local = 1.0; }
              } else {
                  d = abs(length(q) - r);
                  float norm_a = a;
                  if (norm_a < 0.0) norm_a += 2.0 * PI;
                  t_local = (norm_a - PI/2.0) / PI;
              }
          }
          
          if (d < min_d) {
              min_d = d;
              path_t = base_t + t_local * len;
          }
      }

      void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          uv.y = 1.0 - uv.y; // flip y so 0 is top
          
          float aspect = u_resolution.x / u_resolution.y;
          uv.x = (uv.x - 0.5) * aspect + 0.5;

          min_d = 1000.0;
          path_t = 0.0;
          
          // Path Definition (L and S)
          checkLine(uv, vec2(0.20, 0.15), vec2(0.20, 0.85), 0.0, 0.70);
          checkLine(uv, vec2(0.20, 0.85), vec2(0.65, 0.85), 0.70, 0.45);
          checkArc(uv, vec2(0.65, 0.70), 0.15, 1.0, 1.15, 0.4712);
          checkLine(uv, vec2(0.65, 0.55), vec2(0.50, 0.55), 1.6212, 0.15);
          checkArc(uv, vec2(0.50, 0.40), 0.15, -1.0, 1.7712, 0.4712);
          checkLine(uv, vec2(0.50, 0.25), vec2(0.80, 0.25), 2.2424, 0.30);
          
          float total_len = 2.5424;
          
          float track_width = 0.035;
          float border_width = 0.020;
          float edge_smooth = 0.01; 
          
          float outer_border = track_width + border_width;
          vec4 color = vec4(0.0);
          
          if (min_d < outer_border + edge_smooth) {
              float alpha_edge = smoothstep(outer_border + edge_smooth, outer_border, min_d);
              float inner_blend = smoothstep(track_width + edge_smooth, track_width - edge_smooth, min_d);
              
              vec4 border_col = vec4(0.4, 0.4, 0.4, 0.6); // Grey border
              
              vec3 track_rgb = vec3(0.02); // Deep black/grey inner
              float track_a = 0.5; // Transparent black areas
              
              if (u_variant == 0) { // continuous
                  float loop_time = mod(u_time, 10.0);
                  float speed = total_len / 4.0; // travels path in 4 seconds
                  float current_t = (loop_time - 1.0) * speed; 
                  
                  // Glowing line logic
                  float dist_along = path_t - current_t;
                  if (dist_along < 0.0 && dist_along > -0.7) {
                      float intensity = smoothstep(-0.7, 0.0, dist_along);
                      intensity = pow(intensity, 1.8); 
                      vec3 glowCol = vec3(0.4, 0.8, 1.0) * intensity * 2.0; 
                      track_rgb += glowCol;
                      track_a = min(1.0, track_a + intensity * 0.7);
                  }
              } else { // progress
                  float current_t = total_len * clamp(u_percent / 100.0, 0.0, 1.0);
                  
                  if (path_t <= current_t) {
                      float intensity = 0.8;
                      float dist_along = path_t - current_t;
                      if (dist_along > -0.3) {
                          intensity += smoothstep(-0.3, 0.0, dist_along) * 0.8;
                      }
                      vec3 glowCol = vec3(0.4, 0.8, 1.0) * intensity; 
                      track_rgb += glowCol;
                      track_a = min(1.0, track_a + intensity * 0.7);
                  }
              }
              
              vec4 track_col = vec4(track_rgb, track_a);
              
              color = mix(border_col, track_col, inner_blend);
              color.a *= alpha_edge;
          }
          
          gl_FragColor = vec4(color.rgb * color.a, color.a);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positions = new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const variantLocation = gl.getUniformLocation(program, 'u_variant');
    const percentLocation = gl.getUniformLocation(program, 'u_percent');

    const startTime = performance.now();
    let animationFrameId: number;

    const render = (time: number) => {
      const width = gl.canvas.width;
      const height = gl.canvas.height;
      gl.viewport(0, 0, width, height);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(timeLocation, (time - startTime) / 1000);
      gl.uniform2f(resolutionLocation, width, height);

      gl.uniform1i(variantLocation, variantRef.current === 'continuous' ? 0 : 1);
      gl.uniform1f(percentLocation, percentRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className={className}
    />
  );
};
