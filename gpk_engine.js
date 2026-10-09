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
    return {
      Material: {Color: {Diffuse: [1, 0, 0, 1], Ambient: [0, 1, 0, 1], Specular: [.75, .75, .75, 1]}, Emission: [0, 0, 0], SpecularPower: 0},
      MVP: glMatrix.mat4.create(),
      Model: glMatrix.mat4.create(),
      ModelInverse: glMatrix.mat4.create(),
      ModelInverseTranspose: glMatrix.mat4.create(),
      NodeSize: [0, 0, 0],
      PaddingC: 0,
    };
  }

  class SRenderNodeManager {
    constructor() {
      this.RenderNodes = [];
      this.Flags = [];
      this.Transforms = [];
      this.BaseTransforms = [];
      this.Lights = [];
      this.Cameras = [];
      this.LightsDirectional = [];
      this.LightsPoint = [];
      this.LightsSpot = [];
    }
    Create() {
      this.Flags.push({NoAmbient: false, NoDiffuse: false, NoSpecular: false, NoAlphaTest: false, NoAlphaBlend: false, NoDraw: false});
      this.Transforms.push(nodeConstants());
      this.BaseTransforms.push(nodeConstants());
      this.Lights.push(null);
      this.Cameras.push(null);
      return this.RenderNodes.push({Mesh: EID_INVALID, Slice: EID_INVALID, Shader: EID_INVALID, Skin: EID_INVALID}) - 1;
    }
    Clone(id) {
      const result = this.Create();
      this.RenderNodes[result] = copy(this.RenderNodes[id]);
      this.Flags[result] = copy(this.Flags[id]);
      this.Transforms[result] = copy(this.Transforms[id]);
      this.BaseTransforms[result] = copy(this.BaseTransforms[id]);
      this.Lights[result] = this.Lights[id];
      this.Cameras[result] = this.Cameras[id];
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
        graphics.Buffers.Create({Desc: {Usage: "Index", Format: indexData.constructor.name}, Data: indexData}),
        graphics.Buffers.Create({Desc: {Usage: "Position", Format: "Float32x3"}, Data: new Float32Array(geometry.Positions)}),
        graphics.Buffers.Create({Desc: {Usage: "Normal", Format: "Float32x3"}, Data: new Float32Array(geometry.Normals)}),
        graphics.Buffers.Create({Desc: {Usage: "UV", Format: "Float32x2"}, Data: new Float32Array(geometry.TextureCoords)}),
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

  class SRigidBodyIntegrator {
    constructor() {
      this.Frames = [];
      this.Flags = [];
      this.Masses = [];
      this.Forces = [];
      this.Centers = [];
      this.BoundingVolumes = [];
      this.TransformsLocal = [];
    }
    Create() {
      const {mat3, mat4, quat, vec3} = glMatrix;
      this.Frames.push({
        InverseInertiaTensorWorld: mat3.create(),
        LastFrameAcceleration: vec3.create(),
        AccumulatedForce: vec3.create(),
        AccumulatedTorque: vec3.create(),
      });
      this.Flags.push({BVType: 0, Collides: false, Active: false, Falling: false, UpdatedTransform: false, UpdatedTensorWorld: false});
      this.Masses.push({LinearDamping: 1, AngularDamping: 1, InverseMass: 0, InverseAngularMassTensor: mat3.create()});
      this.Forces.push({Velocity: vec3.create(), Acceleration: vec3.create(), Rotation: vec3.create()});
      this.Centers.push({Position: vec3.create(), Orientation: quat.create()});
      this.BoundingVolumes.push({HalfSizes: [.5, .5, .5]});
      return this.TransformsLocal.push(mat4.create()) - 1;
    }
    Clone(id) {
      this.Frames.push(copy(this.Frames[id]));
      this.Flags.push(copy(this.Flags[id]));
      this.Masses.push(copy(this.Masses[id]));
      this.Forces.push(copy(this.Forces[id]));
      this.Centers.push(copy(this.Centers[id]));
      this.BoundingVolumes.push(copy(this.BoundingVolumes[id]));
      return this.TransformsLocal.push(copy(this.TransformsLocal[id])) - 1;
    }
    GetTransform(id) {
      const {mat3, mat4, quat} = glMatrix;
      const flags = this.Flags[id];
      const transform = this.TransformsLocal[id];
      if(!flags.UpdatedTransform) {
        const center = this.Centers[id];
        quat.normalize(center.Orientation, center.Orientation);
        mat4.fromRotationTranslation(transform, center.Orientation, center.Position);
        flags.UpdatedTransform = true;
        flags.UpdatedTensorWorld = false;
      }
      if(!flags.UpdatedTensorWorld) {
        const rotation = mat3.fromMat4(mat3.create(), transform);
        const inverseRotation = mat3.transpose(mat3.create(), rotation);
        const tensor = mat3.multiply(mat3.create(), rotation, this.Masses[id].InverseAngularMassTensor);
        mat3.multiply(this.Frames[id].InverseInertiaTensorWorld, tensor, inverseRotation);
        flags.UpdatedTensorWorld = true;
      }
      return transform;
    }
    SetPosition(id, position) {
      const center = this.Centers[id];
      if(position.every((value, axis) => Object.is(Math.fround(value), center.Position[axis]))) return;
      glMatrix.vec3.copy(center.Position, position);
      this.Flags[id].UpdatedTransform = this.Flags[id].UpdatedTensorWorld = false;
    }
    SetOrientation(id, orientation) {
      const center = this.Centers[id];
      if(orientation.every((value, axis) => Object.is(Math.fround(value), center.Orientation[axis]))) return;
      glMatrix.quat.copy(center.Orientation, orientation);
      this.Flags[id].UpdatedTransform = this.Flags[id].UpdatedTensorWorld = false;
    }
    SetVelocity(id, velocity) {
      if(velocity.every((value, axis) => Object.is(Math.fround(value), this.Forces[id].Velocity[axis]))) return;
      glMatrix.vec3.copy(this.Forces[id].Velocity, velocity);
      this.Flags[id].Active = true;
      if(velocity[1]) this.Flags[id].Falling = true;
    }
    SetAcceleration(id, acceleration) {
      if(acceleration.every((value, axis) => Object.is(Math.fround(value), this.Forces[id].Acceleration[axis]))) return;
      glMatrix.vec3.copy(this.Forces[id].Acceleration, acceleration);
      this.Flags[id].Active = true;
    }
    SetRotation(id, rotation) {
      if(rotation.every((value, axis) => Object.is(Math.fround(value), this.Forces[id].Rotation[axis]))) return;
      glMatrix.vec3.copy(this.Forces[id].Rotation, rotation);
      this.Flags[id].Active = true;
      if(rotation[0] || rotation[2]) this.Flags[id].Falling = true;
    }
    SetMass(id, mass) { this.Masses[id].InverseMass = 1 / mass; }
    SetMassInverse(id, inverseMass) { this.Masses[id].InverseMass = inverseMass; }
    SetHalfSizes(id, halfSizes) { this.BoundingVolumes[id].HalfSizes = copy(halfSizes); }
    AddForce(id, force) { glMatrix.vec3.add(this.Frames[id].AccumulatedForce, this.Frames[id].AccumulatedForce, force); }
    AddForceAtPoint(id, force, point) {
      const {vec3} = glMatrix;
      const frame = this.Frames[id];
      const offset = vec3.subtract(vec3.create(), point, this.Centers[id].Position);
      const torque = vec3.cross(vec3.create(), offset, force);
      vec3.add(frame.AccumulatedTorque, frame.AccumulatedTorque, torque);
      vec3.add(frame.AccumulatedForce, frame.AccumulatedForce, force);
      this.Flags[id].Active = true;
    }
    Integrate(duration) {
      const {quat, vec3} = glMatrix;
      for(let id = 0; id < this.Flags.length; ++id) {
        const flags = this.Flags[id];
        if(!flags.Active) continue;
        this.GetTransform(id);
        const frame = this.Frames[id];
        const forces = this.Forces[id];
        const mass = this.Masses[id];
        const center = this.Centers[id];
        vec3.scaleAndAdd(frame.LastFrameAcceleration, forces.Acceleration, frame.AccumulatedForce, mass.InverseMass);
        vec3.scaleAndAdd(forces.Velocity, forces.Velocity, frame.LastFrameAcceleration, duration);
        const angularAcceleration = vec3.transformMat3(vec3.create(), frame.AccumulatedTorque, frame.InverseInertiaTensorWorld);
        vec3.scaleAndAdd(forces.Rotation, forces.Rotation, angularAcceleration, duration);
        vec3.scale(forces.Velocity, forces.Velocity, Math.pow(mass.LinearDamping, duration));
        vec3.scale(forces.Rotation, forces.Rotation, Math.pow(mass.AngularDamping, duration));
        vec3.set(frame.AccumulatedForce, 0, 0, 0);
        vec3.set(frame.AccumulatedTorque, 0, 0, 0);
        vec3.scaleAndAdd(center.Position, center.Position, forces.Velocity, duration);
        vec3.scaleAndAdd(center.Position, center.Position, forces.Velocity, duration * duration * .5);
        const deltaRotation = quat.fromValues(forces.Rotation[0] * duration, forces.Rotation[1] * duration, forces.Rotation[2] * duration, 0);
        quat.multiply(deltaRotation, deltaRotation, center.Orientation);
        for(let axis = 0; axis < 4; ++axis) center.Orientation[axis] += deltaRotation[axis] * .5;
        quat.normalize(center.Orientation, center.Orientation);
        flags.UpdatedTransform = flags.UpdatedTensorWorld = false;
        if(vec3.squaredLength(forces.Acceleration) < .001 && vec3.squaredLength(forces.Velocity) < .001 && vec3.squaredLength(forces.Rotation) < .00000001) {
          flags.Active = false;
          vec3.set(forces.Velocity, 0, 0, 0);
          vec3.set(forces.Acceleration, 0, 0, 0);
          vec3.set(forces.Rotation, 0, 0, 0);
        }
      }
    }
  }

  class SEngine {
    constructor() {
      this.Scene = new SEngineScene();
      this.Entities = new SVirtualEntityManager();
      this.Integrator = new SRigidBodyIntegrator();
      this.ParamsBox = [];
    }
    GetRenderNode(idEntity) { return this.Entities.Entities[idEntity].RenderNode; }
    GetRigidBody(idEntity) { return this.Entities.Entities[idEntity].RigidBody; }
    CreateEntityFromGeometry(name, halfSizes, createSkin, params, cache, builder) {
      const idEntity = this.Entities.Create(name);
      const entity = this.Entities.Entities[idEntity];
      entity.RigidBody = this.Integrator.Create();
      this.Integrator.SetHalfSizes(entity.RigidBody, halfSizes);
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
        : this.Integrator.Clone(source.RigidBody);
      entity.Parent = source.Parent;
      for(const idChild of this.Entities.Children[idSource]) {
        const idNewChild = this.Clone(idChild, cloneSkin, cloneSurfaces, cloneShaders);
        this.Entities.Entities[idNewChild].Parent = idNew;
        this.Entities.Children[idNew].push(idNewChild);
      }
      return idNew;
    }
    SetPosition(idEntity, position) { this.Integrator.SetPosition(this.GetRigidBody(idEntity), position); }
    SetOrientation(idEntity, orientation) { this.Integrator.SetOrientation(this.GetRigidBody(idEntity), orientation); }
    SetVelocity(idEntity, velocity) { this.Integrator.SetVelocity(this.GetRigidBody(idEntity), velocity); }
    SetAcceleration(idEntity, acceleration) { this.Integrator.SetAcceleration(this.GetRigidBody(idEntity), acceleration); }
    SetRotation(idEntity, rotation) { this.Integrator.SetRotation(this.GetRigidBody(idEntity), rotation); }
    SetMass(idEntity, mass) { this.Integrator.SetMass(this.GetRigidBody(idEntity), mass); }
    AddForceAtPoint(idEntity, force, point) { this.Integrator.AddForceAtPoint(this.GetRigidBody(idEntity), force, point); }
    SetMeshPosition(idEntity, position) {
      const node = this.GetRenderNode(idEntity);
      const model = this.Scene.RenderNodes.BaseTransforms[node].Model;
      model[12] = position[0];
      model[13] = position[1];
      model[14] = position[2];
    }
    SetParent(idEntity, idParent) { this.Entities.SetParent(idEntity, idParent); }
    Update(duration) {
      this.Integrator.Integrate(duration);
      this.UpdateTransforms();
    }
    UpdateTransforms() {
      const {mat4} = glMatrix;
      const update = idEntity => {
        const entity = this.Entities.Entities[idEntity];
        const parent = entity.Parent === EID_INVALID ? null : this.Entities.Entities[entity.Parent];
        const parentModel = !parent ? null : parent.RenderNode !== EID_INVALID
          ? this.Scene.RenderNodes.Transforms[parent.RenderNode].Model
          : parent.RigidBody !== EID_INVALID ? this.Integrator.TransformsLocal[parent.RigidBody] : null;
        const local = mat4.create();
        if(entity.RigidBody !== EID_INVALID)
          mat4.copy(local, this.Integrator.GetTransform(entity.RigidBody));
        const model = mat4.create();
        if(parentModel) mat4.multiply(model, parentModel, local);
        else mat4.copy(model, local);
        if(entity.RenderNode !== EID_INVALID) {
          const transforms = this.Scene.RenderNodes.Transforms[entity.RenderNode];
          mat4.copy(transforms.Model, model);
          mat4.invert(transforms.ModelInverse, model);
          mat4.transpose(transforms.ModelInverseTranspose, transforms.ModelInverse);
        }
        else if(entity.RigidBody !== EID_INVALID)
          mat4.copy(this.Integrator.TransformsLocal[entity.RigidBody], model);
        for(const child of this.Entities.Children[idEntity]) update(child);
      };
      for(let id = 0; id < this.Entities.size(); ++id)
        if(this.Entities.Entities[id].Parent === EID_INVALID) update(id);
    }
  }

  return {EID_INVALID, SResourceManager, SVirtualEntityManager, SRenderNodeManager, SEngineGraphics, SEngineScene, SRigidBodyIntegrator, SEngine, geometryBuildBox};
})();
