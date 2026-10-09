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

function createFrameStats() {
  const fps = document.getElementById("cube-fps");
  const frameTime = document.getElementById("cube-frame-time");
  const tooltip = document.getElementById("cube-tooltip");
  let previousFrame;
  return now => {
    if(previousFrame === undefined) {
      previousFrame = now;
      return;
    }
    const lastFrame = now - previousFrame;
    previousFrame = now;
    if(lastFrame <= 0)
      return;
    fps.textContent = `FPS ${(1000 / lastFrame).toFixed(2)}`;
    frameTime.textContent = `Frame ${lastFrame.toFixed(2)} ms`;
    tooltip.textContent = `${fps.textContent} · ${frameTime.textContent}`;
  };
}

function startCanvasFallback(canvas, frameStats) {
  const context = canvas.getContext("2d");
  if(!context)
    return 0;
  const render = now => {
    drawCubeTexture(context, canvas.width, now * .001);
    frameStats(now);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
  return 1;
}

function startCube(gl, canvas, frameStats) {
  const engine = new gpkEngine.SEngine();
  const cube = engine.CreateBox({Origin: [1, 1, 1], HalfSizes: [1, 1, 1]}, "Logo cube");
  const scene = engine.Scene;
  const graphics = scene.Graphics;
  const node = scene.RenderNodes.RenderNodes[engine.GetRenderNode(cube)];
  const mesh = graphics.Meshes.Elements[node.Mesh];
  const [indicesId, positionsId, , uvId] = mesh.GeometryBuffers;
  const indices = graphics.Buffers.Elements[indicesId].Data;
  const positions = graphics.Buffers.Elements[positionsId].Data;
  const uv = graphics.Buffers.Elements[uvId].Data;
  const vertices = new Float32Array(positions.length / 3 * 5);
  for(let vertex = 0; vertex < positions.length / 3; ++vertex) {
    vertices.set(positions.subarray(vertex * 3, vertex * 3 + 3), vertex * 5);
    vertices.set(uv.subarray(vertex * 2, vertex * 2 + 2), vertex * 5 + 3);
  }
  const skin = graphics.Skins.Elements[node.Skin];
  const sourceSurface = skin.Textures[0];
  const surface = graphics.Surfaces.Elements[sourceSurface];

  const program = createCubeProgram(gl);
  if(!program)
    return 0;
  gl.useProgram(program);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

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
  surface.Desc.Dimensions = [256, 256];
  surface.Data = new Uint8Array(textureContext.getImageData(0, 0, 256, 256).data.buffer);

  const gpuTextures = new Map();
  let boundSurface = gpkEngine.EID_INVALID;
  const bindSurface = id => {
    if(boundSurface === id) return;
    let texture = gpuTextures.get(id);
    if(!texture) {
      const source = graphics.Surfaces.Elements[id];
      texture = gl.createTexture();
      gpuTextures.set(id, texture);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.Desc.Dimensions[0], source.Desc.Dimensions[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, source.Data);
    }
    else {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    boundSurface = id;
  };
  bindSurface(sourceSurface);
  gl.uniform1i(samplerLocation, 0);

  const {mat4, quat, vec3} = glMatrix;
  const projection = mat4.create();
  const modelView = mat4.create();
  const orientation = quat.create();
  const rotationAxis = vec3.normalize(vec3.create(), [1, 1, 1]);
  engine.SetPosition(cube, [0, 0, -12]);
  const explosion = new galaxyExplosion.SExplosion(engine, cube);
  mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, .1, 100);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);
  gl.disable(gl.CULL_FACE);

  const sourceNode = engine.GetRenderNode(cube);
  const projected = new Float32Array(positions.length / 3 * 2);
  const hitModel = mat4.create();
  const hitTransform = mat4.create();
  const hitVertex = vec3.create();
  engine.UpdateTransforms();
  const hitCube = (clientX, clientY) => {
    if(explosion.Active || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return false;
    const bounds = canvas.getBoundingClientRect();
    if(!bounds.width || !bounds.height) return false;
    const x = (clientX - bounds.left) / bounds.width * 2 - 1;
    const y = 1 - (clientY - bounds.top) / bounds.height * 2;
    mat4.multiply(hitModel, scene.RenderNodes.Transforms[sourceNode].Model, scene.RenderNodes.BaseTransforms[sourceNode].Model);
    mat4.multiply(hitTransform, projection, hitModel);
    for(let index = 0; index < positions.length / 3; ++index) {
      vec3.set(hitVertex, positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
      vec3.transformMat4(hitVertex, hitVertex, hitTransform);
      projected[index * 2] = hitVertex[0];
      projected[index * 2 + 1] = hitVertex[1];
    }
    for(let index = 0; index < indices.length; index += 3) {
      const a = indices[index] * 2;
      const b = indices[index + 1] * 2;
      const c = indices[index + 2] * 2;
      const ab = (x - projected[a]) * (projected[b + 1] - projected[a + 1]) - (y - projected[a + 1]) * (projected[b] - projected[a]);
      const bc = (x - projected[b]) * (projected[c + 1] - projected[b + 1]) - (y - projected[b + 1]) * (projected[c] - projected[b]);
      const ca = (x - projected[c]) * (projected[a + 1] - projected[c + 1]) - (y - projected[c + 1]) * (projected[a] - projected[c]);
      if((ab >= 0 && bc >= 0 && ca >= 0) || (ab <= 0 && bc <= 0 && ca <= 0)) return true;
    }
    return false;
  };

  canvas.setAttribute("role", "button");
  canvas.setAttribute("aria-label", "Explode the rotating 3D cube");
  canvas.tabIndex = 0;
  canvas.addEventListener("pointermove", event => {
    canvas.style.cursor = hitCube(event.clientX, event.clientY) ? "pointer" : "default";
  });
  canvas.addEventListener("click", event => {
    if(hitCube(event.clientX, event.clientY)) explosion.Start();
  });
  canvas.addEventListener("keydown", event => {
    if(event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    explosion.Start();
  });

  const drawEntity = entity => {
    const nodeId = engine.GetRenderNode(entity);
    if(scene.RenderNodes.Flags[nodeId].NoDraw) return;
    const renderNode = scene.RenderNodes.RenderNodes[nodeId];
    const renderMesh = graphics.Meshes.Elements[renderNode.Mesh];
    const renderSkin = graphics.Skins.Elements[renderNode.Skin];
    bindSurface(renderSkin.Textures[0]);
    mat4.multiply(modelView, scene.RenderNodes.Transforms[nodeId].Model, scene.RenderNodes.BaseTransforms[nodeId].Model);
    gl.uniformMatrix4fv(modelViewLocation, false, modelView);
    const slice = renderMesh.GeometrySlices[renderNode.Slice].Slice;
    gl.drawElements(gl.TRIANGLES, slice[1], gl.UNSIGNED_SHORT, slice[0] * Uint16Array.BYTES_PER_ELEMENT);
  };

  let textureTime = -1;
  let lastRenderTime;
  const render = now => {
    const time = now * .001;
    const duration = lastRenderTime === undefined ? 0 : Math.min(Math.max((now - lastRenderTime) * .001, 0), .05);
    lastRenderTime = now;
    if(time - textureTime >= 1 / 30) {
      drawCubeTexture(textureContext, 256, time);
      surface.Data = new Uint8Array(textureContext.getImageData(0, 0, 256, 256).data.buffer);
      bindSurface(sourceSurface);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, surface.Data);
      textureTime = time;
    }

    gl.clearColor(.043, .055, .071, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    quat.setAxisAngle(orientation, rotationAxis, time * .5);
    engine.SetOrientation(cube, orientation);
    engine.Update(duration);
    explosion.Update(duration);
    if(explosion.Active) engine.UpdateTransforms();
    gl.uniformMatrix4fv(projectionLocation, false, projection);
    drawEntity(cube);
    for(const entity of explosion.Parts) drawEntity(entity);
    for(const entity of explosion.Debris) drawEntity(entity);
    frameStats(now);
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
  return 1;
}

function initLogo() {
  const canvas = document.getElementById("webgl-canvas");
  const gl = canvas.getContext("webgl");
  const frameStats = createFrameStats();
  return gl ? startCube(gl, canvas, frameStats) : startCanvasFallback(canvas, frameStats);
}
