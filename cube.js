"use strict";

const cubeVertexShader = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat4 uModelViewMatrix, uProjectionMatrix;
varying highp vec2 vTextureCoord;
void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;

const cubeFragmentShader = `
precision mediump float;
varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;
void main() { gl_FragColor = texture2D(uSampler, vTextureCoord); }
`;

const cubeVertices = [
  -1, -1,  1, 0, 0,   1, -1,  1, 1, 0,   1,  1,  1, 1, 1,  -1,  1,  1, 0, 1,
  -1, -1, -1, 1, 0,   1, -1, -1, 0, 0,   1,  1, -1, 0, 1,  -1,  1, -1, 1, 1,
   1,  1,  1, 0, 0,  -1,  1,  1, 1, 0,  -1,  1, -1, 1, 1,   1,  1, -1, 0, 1,
  -1, -1,  1, 0, 0,   1, -1,  1, 1, 0,   1, -1, -1, 1, 1,  -1, -1, -1, 0, 1,
   1, -1,  1, 0, 0,   1, -1, -1, 1, 0,   1,  1, -1, 1, 1,   1,  1,  1, 0, 1,
  -1, -1, -1, 0, 0,  -1, -1,  1, 1, 0,  -1,  1,  1, 1, 1,  -1,  1, -1, 0, 1,
];

const cubeIndices = [
  0, 1, 2, 0, 2, 3,       4, 5, 6, 4, 6, 7,
  0, 4, 7, 0, 7, 3,       1, 5, 6, 1, 6, 2,
  3, 2, 6, 3, 6, 7,       0, 1, 5, 0, 5, 4,
];

const circuitPaths = [
  [[18, 48], [92, 48], [92, 102], [119, 102]],
  [[18, 208], [72, 208], [72, 154], [119, 154]],
  [[238, 40], [172, 40], [172, 102], [137, 102]],
  [[238, 216], [184, 216], [184, 154], [137, 154]],
  [[34, 126], [86, 126], [86, 128], [119, 128]],
  [[222, 128], [170, 128], [137, 128]],
];

function pointOnCircuit(path, progress) {
  let total = 0;
  const lengths = [];
  for(let i = 1; i < path.length; ++i) {
    const length = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    lengths.push(length);
    total += length;
  }

  let distance = progress * total;
  for(let i = 0; i < lengths.length; ++i) {
    if(distance <= lengths[i]) {
      const ratio = lengths[i] ? distance / lengths[i] : 0;
      return [
        path[i][0] + (path[i + 1][0] - path[i][0]) * ratio,
        path[i][1] + (path[i + 1][1] - path[i][1]) * ratio,
      ];
    }
    distance -= lengths[i];
  }
  return path[path.length - 1];
}

function drawCubeTexture(context, size, time) {
  const scale = size / 256;
  context.save();
  context.setTransform(scale, 0, 0, scale, 0, 0);

  const background = context.createLinearGradient(0, 0, 256, 256);
  background.addColorStop(0, "#07120d");
  background.addColorStop(1, "#0b0e12");
  context.fillStyle = background;
  context.fillRect(0, 0, 256, 256);

  context.strokeStyle = "rgba(97, 208, 149, 0.12)";
  context.lineWidth = 1;
  for(let coordinate = 16; coordinate < 256; coordinate += 16) {
    context.beginPath();
    context.moveTo(coordinate, 0);
    context.lineTo(coordinate, 256);
    context.moveTo(0, coordinate);
    context.lineTo(256, coordinate);
    context.stroke();
  }

  context.strokeStyle = "rgba(97, 208, 149, 0.72)";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";
  for(const path of circuitPaths) {
    context.beginPath();
    context.moveTo(path[0][0], path[0][1]);
    for(let i = 1; i < path.length; ++i)
      context.lineTo(path[i][0], path[i][1]);
    context.stroke();
  }

  const pulse = (time * .24) % 1;
  for(let i = 0; i < circuitPaths.length; ++i) {
    const point = pointOnCircuit(circuitPaths[i], (pulse + i / circuitPaths.length) % 1);
    context.shadowColor = "#e3b341";
    context.shadowBlur = 12;
    context.fillStyle = "#e3b341";
    context.beginPath();
    context.arc(point[0], point[1], 5, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;

  context.fillStyle = "#101b17";
  context.strokeStyle = "#e8edf2";
  context.lineWidth = 3;
  context.fillRect(112, 92, 32, 72);
  context.strokeRect(112, 92, 32, 72);
  context.fillStyle = "#e8edf2";
  context.font = "700 18px Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("IO", 128, 128);

  const scanY = (time * 42) % 256;
  const scan = context.createLinearGradient(0, scanY - 14, 0, scanY + 14);
  scan.addColorStop(0, "rgba(97, 208, 149, 0)");
  scan.addColorStop(.5, "rgba(97, 208, 149, 0.18)");
  scan.addColorStop(1, "rgba(97, 208, 149, 0)");
  context.fillStyle = scan;
  context.fillRect(0, scanY - 14, 256, 28);

  context.restore();
}

function compileCubeShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if(gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    return shader;
  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createCubeProgram(gl) {
  const vertexShader = compileCubeShader(gl, gl.VERTEX_SHADER, cubeVertexShader);
  const fragmentShader = compileCubeShader(gl, gl.FRAGMENT_SHADER, cubeFragmentShader);
  if(!vertexShader || !fragmentShader)
    return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if(gl.getProgramParameter(program, gl.LINK_STATUS))
    return program;
  console.error(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

function startCanvasFallback(canvas) {
  const context = canvas.getContext("2d");
  if(!context)
    return 0;
  const render = now => {
    drawCubeTexture(context, canvas.width, now * .001);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
  return 1;
}

function startCube(gl, canvas) {
  const program = createCubeProgram(gl);
  if(!program)
    return 0;
  gl.useProgram(program);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "aVertexPosition");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 20, 0);

  const textureCoordinateLocation = gl.getAttribLocation(program, "aTextureCoord");
  gl.enableVertexAttribArray(textureCoordinateLocation);
  gl.vertexAttribPointer(textureCoordinateLocation, 2, gl.FLOAT, false, 20, 12);

  const samplerLocation = gl.getUniformLocation(program, "uSampler");
  const modelViewLocation = gl.getUniformLocation(program, "uModelViewMatrix");
  const projectionLocation = gl.getUniformLocation(program, "uProjectionMatrix");

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = textureCanvas.height = 256;
  const textureContext = textureCanvas.getContext("2d");
  drawCubeTexture(textureContext, 256, 0);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);
  gl.uniform1i(samplerLocation, 0);

  const {mat4} = glMatrix;
  const projection = mat4.create();
  const modelView = mat4.create();
  mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, .1, 100);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);

  let textureTime = -1;
  const render = now => {
    const time = now * .001;
    if(time - textureTime >= 1 / 30) {
      drawCubeTexture(textureContext, 256, time);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);
      textureTime = time;
    }

    gl.clearColor(.043, .055, .071, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.identity(modelView);
    mat4.translate(modelView, modelView, [0, 0, -6]);
    mat4.rotate(modelView, modelView, time * .5, [1, 1, 1]);
    gl.uniformMatrix4fv(modelViewLocation, false, modelView);
    gl.uniformMatrix4fv(projectionLocation, false, projection);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
  return 1;
}

function initLogo() {
  const canvas = document.getElementById("webgl-canvas");
  const gl = canvas.getContext("webgl");
  return gl ? startCube(gl, canvas) : startCanvasFallback(canvas);
}
