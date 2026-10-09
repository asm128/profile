"use strict";

// Galaxy Hell behavior arranged like ssiege: the game owns state and SEngine,
// while the browser presenter only reads the engine scene and forwards input.
const galaxyGame = (() => {
  class SGalaxyGame {
    constructor(random = Math.random) {
      this.Engine = new gpkEngine.SEngine();
      this.Cube = gpkEngine.EID_INVALID;
      this.Explosions = [];
      this.Random = random;
    }
  }

  function galaxyGameSetup(world) {
    world.Cube = world.Engine.CreateBox({Origin: [1, 1, 1], HalfSizes: [1, 1, 1]}, "Logo cube");
    world.Engine.SetPosition(world.Cube, [0, 0, -12]);
    world.Explosions.push(new galaxyExplosion.SExplosion(world.Engine, world.Cube, world.Random));
    world.Engine.UpdateTransforms();
    return world.Cube;
  }

  function galaxyGameExplode(world) {
    if(!world.Explosions.length || world.Explosions[0].Active)
      return false;
    world.Explosions[0].Start(world.Engine);
    return true;
  }

  function galaxyGameUpdate(world, secondsElapsed, orientation) {
    if(orientation)
      world.Engine.SetOrientation(world.Cube, orientation);
    world.Engine.Update(secondsElapsed);
    let transformsInvalidated = false;
    for(const explosion of world.Explosions) {
      explosion.Update(world.Engine, secondsElapsed);
      transformsInvalidated ||= explosion.Active;
    }
    if(transformsInvalidated)
      world.Engine.UpdateTransforms();
  }

  return {SGalaxyGame, galaxyGameSetup, galaxyGameExplode, galaxyGameUpdate};
})();
