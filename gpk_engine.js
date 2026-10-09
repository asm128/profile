"use strict";

// Browser translation of the box creation and resource ownership path in gpk_engine.
// IDs index parallel manager arrays, as they do in the C++ engine.
const gpkEngine = (() => {
  const EID_INVALID = 0xFFFFFFFF;

  function copy(value) {
    if(ArrayBuffer.isView(value)) return new value.constructor(value);
    if(Array.isArray(value)) return value.map(copy);
    if(value && typeof value === "object")
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
    return value;
  }

  class SResourceManager {
    constructor() {
      this.Elements = [];
      this.Names = [];
    }
    Create(value, name = "") {
      this.Names.push(name);
      return this.Elements.push(value) - 1;
    }
    Clone(id) { return this.Create(copy(this.Elements[id]), this.Names[id]); }
    Delete(id) {
      const last = this.Elements.length - 1;
      this.Elements[id] = this.Elements[last];
      this.Names[id] = this.Names[last];
      this.Elements.pop();
      this.Names.pop();
    }
    size() { return this.Elements.length; }
  }

  class SVirtualEntityManager {
    constructor() {
      this.Entities = [];
      this.Names = [];
      this.Children = [];
    }
    Create(name = "") {
      this.Names.push(name);
      this.Children.push([]);
      return this.Entities.push({RenderNode: EID_INVALID, RigidBody: EID_INVALID, Parent: EID_INVALID}) - 1;
    }
    SetParent(id, idParent) {
      if(idParent !== EID_INVALID && !this.Entities[idParent]) throw new RangeError("Invalid parent entity");
      const oldParent = this.Entities[id].Parent;
      if(oldParent !== EID_INVALID) {
        const siblings = this.Children[oldParent];
        const index = siblings.indexOf(id);
        if(index >= 0) siblings.splice(index, 1);
      }
      this.Entities[id].Parent = idParent;
      if(idParent !== EID_INVALID) this.Children[idParent].push(id);
    }
    GetChildren(id) { return this.Children[id]; }
    GetChildCount(id) { return this.Children[id].length; }
    size() { return this.Entities.length; }
  }

  function nodeConstants() {
    return {Model: glMatrix.mat4.create(), NodeSize: [0, 0, 0]};
  }

  class SRenderNodeManager {
    constructor() {
      this.RenderNodes = [];
      this.Flags = [];
      this.Transforms = [];
      this.BaseTransforms = [];
      this.Lights = [];
      this.Cameras = [];
    }
    Create() {
      this.Flags.push({NoDraw: false});
      this.Transforms.push(nodeConstants());
      this.BaseTransforms.push(nodeConstants());
      this.Lights.push([]);
      this.Cameras.push([]);
      return this.RenderNodes.push({Mesh: EID_INVALID, Slice: EID_INVALID, Shader: EID_INVALID, Skin: EID_INVALID}) - 1;
    }
    Clone(id) {
      const result = this.Create();
      this.RenderNodes[result] = copy(this.RenderNodes[id]);
      this.Flags[result] = copy(this.Flags[id]);
      this.Transforms[result] = copy(this.Transforms[id]);
      this.BaseTransforms[result] = copy(this.BaseTransforms[id]);
      this.Lights[result] = copy(this.Lights[id]);
      this.Cameras[result] = copy(this.Cameras[id]);
      return result;
    }
    size() { return this.RenderNodes.length; }
  }

  class SEngineGraphics {
    constructor() {
      this.Buffers = new SResourceManager();
      this.Surfaces = new SResourceManager();
      this.Meshes = new SResourceManager();
      this.Skins = new SResourceManager();
      this.Shaders = new SResourceManager();
    }
  }

  class SEngineScene {
    constructor() {
      this.Graphics = new SEngineGraphics();
      this.RenderNodes = new SRenderNodeManager();
    }
    CreateRenderNode(geometry, name, createSkin) {
      const graphics = this.Graphics;
      const vertexCount = geometry.Positions.length / 3;
      const indexData = vertexCount <= 255 ? new Uint8Array(geometry.PositionIndices)
        : vertexCount <= 65535 ? new Uint16Array(geometry.PositionIndices)
          : new Uint32Array(geometry.PositionIndices);
      const buffers = [
        graphics.Buffers.Create({Usage: "Index", Data: indexData}),
        graphics.Buffers.Create({Usage: "Position", Data: new Float32Array(geometry.Positions)}),
        graphics.Buffers.Create({Usage: "Normal", Data: new Float32Array(geometry.Normals)}),
        graphics.Buffers.Create({Usage: "TextureCoord", Data: new Float32Array(geometry.TextureCoords)}),
      ];
      const mesh = {GeometryBuffers: buffers, GeometrySlices: [], Desc: {Mode: "List", Type: "Triangle", NormalMode: "Point"}};
      const idMesh = graphics.Meshes.Create(mesh, name);
      const idNode = this.RenderNodes.Create();
      const node = this.RenderNodes.RenderNodes[idNode];
      node.Mesh = idMesh;
      if(createSkin) {
        const skin = {Material: {Color: {Diffuse: [1, 1, 1, 1]}}, Textures: []};
        node.Skin = graphics.Skins.Create(skin);
        skin.Textures.push(graphics.Surfaces.Create({Desc: {ColorType: "RGBA", Dimensions: [32, 32]}, Data: new Uint8Array(32 * 32 * 4).fill(255)}));
        mesh.GeometrySlices.push({Slice: [0, geometry.PositionIndices.length]});
        node.Slice = 0;
        node.Shader = graphics.Shaders.Create({Name: "psSolid"}, "psSolid");
      }
      return idNode;
    }
    Clone(idNode, cloneSkin, cloneSurfaces, cloneShaders) {
      const idNew = this.RenderNodes.Clone(idNode);
      const node = this.RenderNodes.RenderNodes[idNew];
      if(cloneShaders && node.Shader !== EID_INVALID)
        node.Shader = this.Graphics.Shaders.Clone(node.Shader);
      if(cloneSkin && node.Skin !== EID_INVALID) {
        node.Skin = this.Graphics.Skins.Clone(node.Skin);
        const skin = this.Graphics.Skins.Elements[node.Skin];
        if(cloneSurfaces) skin.Textures = skin.Textures.map(id => this.Graphics.Surfaces.Clone(id));
      }
      return idNew;
    }
  }

  // VOXEL_FACE_VERTICES, VOXEL_FACE_NORMALS, VOXEL_FACE_UV and
  // VOXEL_FACE_INDICES_16 from gpk_voxel.h, used by geometryBuildBox.
  const faceVertices = [
    [[0,1,0],[1,1,0],[0,1,1],[1,1,1]],
    [[1,0,0],[1,1,0],[1,0,1],[1,1,1]],
    [[0,0,1],[1,0,1],[0,1,1],[1,1,1]],
    [[0,0,0],[1,0,0],[0,0,1],[1,0,1]],
    [[0,0,0],[0,1,0],[0,0,1],[0,1,1]],
    [[0,0,0],[1,0,0],[0,1,0],[1,1,0]],
  ];
  const faceNormals = [[0,1,0],[1,0,0],[0,0,1],[0,-1,0],[-1,0,0],[0,0,-1]];
  const faceOrder = [3, 4, 5, 0, 1, 2];
  const forwardIndices = [0, 1, 2, 1, 3, 2];
  const reverseIndices = [0, 2, 1, 1, 2, 3];

  function geometryBuildBox(params) {
    const geometry = {Positions: [], Normals: [], TextureCoords: [], PositionIndices: []};
    const transformed = glMatrix.vec3.create();
    for(let face = 0; face < faceVertices.length; ++face) {
      for(let vertex = 0; vertex < 4; ++vertex) {
        const corner = faceVertices[face][vertex];
        const position = corner.map((value, axis) => value * params.HalfSizes[axis] * 2 - params.Origin[axis]);
        glMatrix.vec3.transformQuat(transformed, position, params.Orientation);
        geometry.Positions.push(...transformed);
        geometry.Normals.push(...faceNormals[face]);
        geometry.TextureCoords.push(vertex & 1, vertex >> 1);
      }
    }
    for(const face of faceOrder) {
      const pattern = face === 0 || face === 4 || face === 5 ? reverseIndices : forwardIndices;
      for(const vertex of pattern) geometry.PositionIndices.push(face * 4 + vertex);
    }
    return geometry;
  }

  class SEngine {
    constructor() {
      this.Scene = new SEngineScene();
      this.Entities = new SVirtualEntityManager();
      this.Integrator = {Bodies: []};
      this.ParamsBox = [];
    }
    GetRenderNode(idEntity) { return this.Entities.Entities[idEntity].RenderNode; }
    GetRigidBody(idEntity) { return this.Entities.Entities[idEntity].RigidBody; }
    CreateEntityFromGeometry(name, halfSizes, createSkin, params, cache, builder) {
      const idEntity = this.Entities.Create(name);
      const entity = this.Entities.Entities[idEntity];
      entity.RigidBody = this.Integrator.Bodies.push({Position: [0,0,0], Orientation: [0,0,0,1], HalfSizes: copy(halfSizes)}) - 1;
      const cached = cache.find(entry => entry.Params.Origin.every((value, i) => value === params.Origin[i])
        && entry.Params.HalfSizes.every((value, i) => value === params.HalfSizes[i]));
      if(cached) entity.RenderNode = this.Scene.Clone(cached.RenderNode, true, true, true);
      else {
        entity.RenderNode = this.Scene.CreateRenderNode(builder(params), name, createSkin);
        cache.push({Params: copy(params), RenderNode: entity.RenderNode});
      }
      return idEntity;
    }
    CreateBox(params = {}, name = "Box") {
      const box = {
        Origin: params.Origin || [.5,.5,.5],
        HalfSizes: params.HalfSizes || [.5,.5,.5],
        Orientation: params.Orientation || [0,0,0,1],
      };
      return this.CreateEntityFromGeometry(name, box.HalfSizes, true, box, this.ParamsBox, geometryBuildBox);
    }
    Clone(idSource, cloneSkin, cloneSurfaces, cloneShaders) {
      const source = this.Entities.Entities[idSource];
      const idNew = this.Entities.Create();
      const entity = this.Entities.Entities[idNew];
      entity.RenderNode = source.RenderNode === EID_INVALID ? EID_INVALID
        : this.Scene.Clone(source.RenderNode, cloneSkin, cloneSurfaces, cloneShaders);
      entity.RigidBody = source.RigidBody === EID_INVALID ? EID_INVALID
        : this.Integrator.Bodies.push(copy(this.Integrator.Bodies[source.RigidBody])) - 1;
      entity.Parent = source.Parent;
      for(const idChild of this.Entities.Children[idSource]) {
        const idNewChild = this.Clone(idChild, cloneSkin, cloneSurfaces, cloneShaders);
        this.Entities.Entities[idNewChild].Parent = idNew;
        this.Entities.Children[idNew].push(idNewChild);
      }
      return idNew;
    }
    SetPosition(idEntity, position) { this.Integrator.Bodies[this.GetRigidBody(idEntity)].Position = copy(position); }
    SetOrientation(idEntity, orientation) { this.Integrator.Bodies[this.GetRigidBody(idEntity)].Orientation = copy(orientation); }
    SetParent(idEntity, idParent) { this.Entities.SetParent(idEntity, idParent); }
    UpdateTransforms() {
      const {mat4} = glMatrix;
      const update = (idEntity, parentModel) => {
        const entity = this.Entities.Entities[idEntity];
        const body = this.Integrator.Bodies[entity.RigidBody];
        const local = mat4.create();
        if(body) mat4.fromRotationTranslation(local, body.Orientation, body.Position);
        const model = mat4.create();
        if(parentModel) mat4.multiply(model, parentModel, local);
        else mat4.copy(model, local);
        if(entity.RenderNode !== EID_INVALID)
          mat4.copy(this.Scene.RenderNodes.Transforms[entity.RenderNode].Model, model);
        for(const child of this.Entities.Children[idEntity]) update(child, model);
      };
      for(let id = 0; id < this.Entities.size(); ++id)
        if(this.Entities.Entities[id].Parent === EID_INVALID) update(id, null);
    }
  }

  return {EID_INVALID, SResourceManager, SVirtualEntityManager, SRenderNodeManager, SEngineGraphics, SEngineScene, SEngine, geometryBuildBox};
})();
