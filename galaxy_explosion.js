"use strict";

// Galaxy Hell explosion behavior represented entirely by gpk_engine resources.
// The ssiege-style game owner creates and updates this entity/node/skin/body state.
const galaxyExplosion = (() => {
  const {mat4, vec3} = glMatrix;
  function randomDirection(random, rotateZ = false) {
    const angleX = random() * Math.PI * 2;
    const angleY = random() * Math.PI * 2;
    const x = -Math.cos(angleX) * Math.sin(angleY);
    const y = Math.sin(angleX);
    const z = Math.cos(angleX) * Math.cos(angleY);
    if(!rotateZ) return vec3.fromValues(x, y, z);
    const angleZ = random() * Math.PI * 2;
    return vec3.fromValues(x * Math.cos(angleZ) - y * Math.sin(angleZ), x * Math.sin(angleZ) + y * Math.cos(angleZ), z);
  }

  class SExplosion {
    constructor(engine, source, random = Math.random) {
      this.Source = source;
      this.Random = random;
      this.Slices = [];
      this.Parts = [];
      this.PartDirections = [];
      this.VelocityScratch = vec3.create();
      this.Debris = [];
      this.DebrisDirections = [];
      this.DebrisSpeed = [];
      this.DebrisBrightness = [];
      this.Active = false;
      this.Center = vec3.create();
      this.SparkPosition = vec3.create();

      const scene = engine.Scene;
      const graphics = scene.Graphics;
      const sourceNode = scene.RenderNodes.RenderNodes[engine.GetRenderNode(source)];
      const mesh = graphics.Meshes.Elements[sourceNode.Mesh];
      const indices = graphics.Buffers.Elements[mesh.GeometryBuffers[0]].Data;
      this.IndexMesh = sourceNode.Mesh;
      this.IndexImage = graphics.Skins.Elements[sourceNode.Skin].Textures[0];

      for(let offset = 0; offset < indices.length; offset += 3) {
        const part = engine.Clone(source, false, false, false);
        const nodeId = engine.GetRenderNode(part);
        scene.RenderNodes.RenderNodes[nodeId].Slice = mesh.GeometrySlices.push({Slice: [offset, 3]}) - 1;
        scene.RenderNodes.Flags[nodeId].NoDraw = true;
        this.Slices.push({Offset: offset, Count: 3});
        this.Parts.push(part);
      }

      const sparkSurface = graphics.Surfaces.Create({
        Desc: {ColorType: "RGBA", Dimensions: [1, 1]},
        Data: new Uint8Array([255, 192, 66, 255]),
      });
      const sparkSkin = graphics.Skins.Clone(sourceNode.Skin);
      graphics.Skins.Elements[sparkSkin].Textures[0] = sparkSurface;
      for(let particle = 0; particle < 20; ++particle) {
        const spark = engine.Clone(source, false, false, false);
        const nodeId = engine.GetRenderNode(spark);
        scene.RenderNodes.RenderNodes[nodeId].Skin = sparkSkin;
        scene.RenderNodes.Flags[nodeId].NoDraw = true;
        mat4.fromScaling(scene.RenderNodes.BaseTransforms[nodeId].Model, [.035, .035, .035]);
        this.Debris.push(spark);
      }
    }
    LaunchBody(engine, entity, position, orientation, direction, speed, spin) {
      const integrator = engine.Integrator;
      const body = engine.GetRigidBody(entity);
      const frame = integrator.Frames[body];
      vec3.set(frame.AccumulatedForce, 0, 0, 0);
      vec3.set(frame.AccumulatedTorque, 0, 0, 0);
      integrator.SetPosition(body, position);
      integrator.SetOrientation(body, orientation);
      integrator.SetVelocity(body, vec3.scale(vec3.create(), direction, speed));
      integrator.SetRotation(body, spin);
      integrator.SetAcceleration(body, [0, 0, 0]);
      integrator.SetMass(body, 1);
      integrator.Masses[body].LinearDamping = 1;
      integrator.Masses[body].AngularDamping = 1;
      engine.Scene.RenderNodes.Flags[engine.GetRenderNode(entity)].NoDraw = false;
    }
    Start(engine) {
      engine.UpdateTransforms();
      const sourceNode = engine.GetRenderNode(this.Source);
      const sourceModel = engine.Scene.RenderNodes.Transforms[sourceNode].Model;
      const orientation = engine.Integrator.Centers[engine.GetRigidBody(this.Source)].Orientation;
      const center = vec3.fromValues(sourceModel[12], sourceModel[13], sourceModel[14]);
      vec3.copy(this.Center, center);
      engine.Scene.RenderNodes.Flags[sourceNode].NoDraw = true;
      this.Active = true;

      for(let slice = 0; slice < this.Slices.length; ++slice) {
        const direction = randomDirection(this.Random, true);
        const spin = vec3.fromValues(0, 0, 0);
        if(slice % 2) spin[2] = 2;
        else if(slice % 3) spin[0] = 2;
        else if(slice % 5) spin[1] = 2;
        this.PartDirections[slice] = direction;
        this.LaunchBody(engine, this.Parts[slice], center, orientation, direction, 13, spin);
      }
      for(let index = 0; index < this.Debris.length; ++index) {
        const spark = this.Debris[index];
        const direction = randomDirection(this.Random);
        this.DebrisDirections[index] = direction;
        this.DebrisSpeed[index] = 13;
        this.DebrisBrightness[index] = 2.8;
        this.LaunchBody(engine, spark, center, orientation, direction, 13, [0, 0, 0]);
        engine.Integrator.Flags[engine.GetRigidBody(spark)].Active = false;
      }
    }
    Update(engine, duration) {
      if(!this.Active) return;
      const integrator = engine.Integrator;
      if(duration > 0) {
        for(let index = 0; index < this.Parts.length; ++index) {
          const body = engine.GetRigidBody(this.Parts[index]);
          const speed = vec3.length(integrator.Forces[body].Velocity);
          if(speed <= 4) continue;
          const nextSpeed = Math.max(4, speed - duration * Math.floor(this.Random() * 16));
          vec3.scale(this.VelocityScratch, this.PartDirections[index], nextSpeed);
          integrator.SetVelocity(body, this.VelocityScratch);
        }
      }
      for(let index = 0; index < this.Debris.length; ++index) {
        const spark = this.Debris[index];
        const flags = engine.Scene.RenderNodes.Flags[engine.GetRenderNode(spark)];
        if(flags.NoDraw) continue;
        const body = engine.GetRigidBody(spark);
        const direction = this.DebrisDirections[index];
        const speed = this.DebrisSpeed[index];
        vec3.scaleAndAdd(this.SparkPosition, integrator.Centers[body].Position, direction, speed * duration);
        this.DebrisBrightness[index] -= duration;
        if(this.DebrisBrightness[index] < 0 || vec3.dot(vec3.subtract(this.VelocityScratch, this.SparkPosition, this.Center), direction) < 0) {
          flags.NoDraw = true;
          integrator.Flags[body].Active = false;
          continue;
        }
        integrator.SetPosition(body, this.SparkPosition);
        this.DebrisSpeed[index] = speed - duration * Math.floor(this.Random() * 16) * (speed < 0 ? 5 : 1);
        vec3.scale(this.VelocityScratch, direction, this.DebrisSpeed[index]);
        integrator.SetVelocity(body, this.VelocityScratch);
        integrator.Flags[body].Active = false;
      }
    }
  }

  return {SExplosion};
})();
