const config = {
  type: Phaser.AUTO, // which renderer to use
  width: 128, // canvas width in pixels
  height: 128, // canvas height in pixels
  pixelArt: true,
  zoom: 3,
  parent: "game", // id of the DOM element to add the canvas
  physics: {
    default: "arcade"
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);

function preload() {
  // Runs once, loads up assets (images, audio, etc.)
  this.load.image("tiles", "/imgs/tileset.png");
  this.load.spritesheet("animal", "imgs/animal.png", {frameWidth: 16, frameHeight: 16});
  this.load.spritesheet("hunter", "imgs/hunter.png", {frameWidth: 16, frameHeight: 16});
}

function create() {
  // Runs once, after all assets in preload are loaded
  // Load a map from a 2D array of tile indices
  // const level = [
  //   [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
  //   [  0,   1,   2,   3,   0,   0,   0,   1,   2,   3,   0 ],
  //   [  0,   5,   6,   7,   0,   0,   0,   5,   6,   7,   0 ],
  //   [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
  //   [  0,   0,   0,  14,  13,  14,   0,   0,   0,   0,   0 ],
  //   [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
  //   [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ],
  //   [  0,   0,  14,  14,  14,  14,  14,   0,   0,   0,   0 ],
  //   [  0,   0,   0,   0,   0,   0,   0,   0,   0,  15,   0 ],
  //   [ 35,  36,  37,   0,   0,   0,   0,   0,   0,   0,   0 ],
  //   [ 39,  39,  39,  39,  39,  39,  39,  39,  39,  39,  39 ]
  // ];
  const level = [
      [0, 0, 0, 1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 2, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 2, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0, 0]
  ];

  // When loading from an array, make sure to specify the tileWidth and tileHeight
  this.tilemap = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16 });
  const tiles = this.tilemap.addTilesetImage("tiles");
  const layer = this.tilemap.createStaticLayer(0, tiles, 0, 0);

  //this.levelManager = new LevelManager({});
  this.movementHandler = new MovementHandler(this.input.keyboard.createCursorKeys());

  this.anims.create({
    key: 'hunterIdle',
    repeat: -1,
    frameRate: 3,
    frames: this.anims.generateFrameNames('hunter', {start: 0, end: 1})
  });

  this.anims.create({
    key: 'animalIdle',
    repeat: -1,
    frameRate: 3,
    frames: this.anims.generateFrameNames('animal', {start: 0, end: 1})
  });

  this.entities = {}; // a map of all entities

  this.player = new Player({
    id: 0,
    scene: this,
    x: 104,
    y: 104,
    texture: "hunter"
  });
  this.player.play('hunterIdle');
  this.add.existing(this.player); // add the player to the scene
  this.entities[this.player.id] = this.player;

  // enemy positions
  let enemyConfigs = [
    {x: 104, y: 120},
    {x: 104, y: 88, flip: true, flipStepMax: 3}
  ];
  for (let i = 1; i <= enemyConfigs.length; i++) {
    let config = enemyConfigs[i - 1];
    let enemy = new Enemy({
      id: i,
      scene: this,
      x: config.x,
      y: config.y,
      flip: config.flip,
      flipStepsMax: config.flipStepMax,
      texture: "animal"
    });
    enemy.play('animalIdle');
    this.add.existing(enemy); // add the enemy to the scene
    this.entities[i] = enemy;
  }
}

function update(time, delta) {
  // Runs once per frame for the duration of the scene
  for (const id in this.entities) {
    if (this.entities.hasOwnProperty(id)) {
      const entity = this.entities[id];
      if ((entity.moving && entity.moving()) || entity.preventMovementForTween()) {
        this.preventMovement = true; // prevents non-moving entities from moving until entities are all stationary
        break;
      }
    }
  }
  this.movementHandler.update(); // update the key direction

  // used to store each entities to/from positions in a map
  this.entityToPosMap = {};
  this.entityFromPosMap = {};

  // preupdate
  for (const id in this.entities) {
    if (this.entities.hasOwnProperty(id)) {
      const entity = this.entities[id];
      entity.preUpdateCall(time, delta);
    }
  }

  handleCollisions(this);

  // update
  for (const id in this.entities) {
    if (this.entities.hasOwnProperty(id)) {
      const entity = this.entities[id];
      entity.update(time, delta);
    }
  }

  // preupdate
  for (const id in this.entities) {
    if (this.entities.hasOwnProperty(id)) {
      const entity = this.entities[id];
      entity.postUpdate(time, delta);
    }
  }

  this.preventMovement = false;
}

function handleCollisions(scene) {
  let toPosMap = scene.entityToPosMap;
  let fromPosMap = scene.entityFromPosMap;
  let collidedEntities = {};
  let nonCollidedEntities = {};
  for (const id in scene.entities) {
    if (scene.entities.hasOwnProperty(id)) {
      let entity = scene.entities[id];
      if (collidedEntities.hasOwnProperty(entity.id)) {
        continue; // entity has already been processed and had collision
      }
      let collision = false;
      // check the collisions from neighbors
      let fromEntities = toPosMap[GridUtils.getCoords(entity.fromPos)]; // note, we want to find entities moving towards our 'from' position
      if (fromEntities !== null && fromEntities !== undefined) {
        for (let j = 0; j < fromEntities.length; j++) {
          let fromEntity = fromEntities[j];
          if (entity.id !== fromEntity.id) { // do not check collisions with itself..
            // does the entity have a collision with the neighbor?
            const dir = BaseEntity.isNeighbor(entity, fromEntity);
            if (dir !== DIRECTION.NONE) {
              const oppositeDir = Direction.opposite(dir);
              if (entity.direction === dir && (fromEntity.direction === oppositeDir || fromEntity.direction === DIRECTION.NONE)) { // are the entities moving towards another, or stationary?
                let other = scene.entities[fromEntity.id];
                collidedEntities[entity.id] = entity.processCollision(other, true);
                collidedEntities[fromEntity.id] = other.processCollision(entity, true);
                collision = true;
              }
            }
          }
        }
      }
      // check the collisions in the position the entity moves towards
      if (!collision) {
        let toEntities = toPosMap[GridUtils.getCoords(entity.toPos)];
        if (toEntities !== null && toEntities !== undefined) {
          for (let j = 0; j < toEntities.length; j++) {
            let toEntity = toEntities[j];
            if (entity.id !== toEntity.id) { // do not check collisions with itself..
              let other = scene.entities[toEntity.id];
              collidedEntities[entity.id] = entity.processCollision(other, false);
              collidedEntities[toEntity.id] = other.processCollision(entity, false);
              collision = true;
            }
          }
        }
      }
      // no collisions occurred with the entity store for later when we do a final collision
      // check between the non-collision entities and the reverted entities
      if (!collision) {
        nonCollidedEntities[entity.id] = entity;
      }
    }
  }
  // did collisions occur? revert the entities 'to' position
  for (const id in collidedEntities) {
    if (collidedEntities.hasOwnProperty(id)) {
      let entity = scene.entities[id];
      entity.removeToFromPosition(entity.toPos, null); // remove the old 'to' position
      entity.resetToFromPosition(); // revert positions
      entity.storeToFromPositions(entity.toPos, null); // replace with reverted 'to' position
    }
  }
  // check the collisions between the non-collided entities and the reverted entities
  for (const id in nonCollidedEntities) {
    if (nonCollidedEntities.hasOwnProperty(id)) {
      let entity = nonCollidedEntities[id];
      let toEntities = toPosMap[GridUtils.getCoords(entity.toPos)];
      if (toEntities !== null && toEntities !== undefined) {
        for (let i = 0; i < toEntities.length; i++) {
          let toEntity = toEntities[i];
          if (entity.id !== toEntity.id) { // don't compare the same entity
            let other = scene.entities[toEntity.id];
            entity.processCollision(other, false);
            other.processCollision(entity, false); // no need to collect the results
            entity.resetToFromPosition(); // revert the positions
          }
        }
      }
    }
  }
}