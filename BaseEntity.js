class BaseEntity extends Phaser.GameObjects.Sprite {
  constructor(config) {
    super(config.scene, config.x, config.y, config.texture);
    this.id = config.id;
    this.old_x = config.x;
    this.old_y = config.y;
    this.spd = 1.5;
    this.direction = DIRECTION.NONE;
    this.toPos = {x: this.x, y: this.y};
    this.fromPos = {x: this.x, y: this.y};
    this.flipped = config.flipped || false; // denotes the direction is flipped or normal
    this.tweenPreventMovement = false;
  }

  preUpdateCall(time, delta) {
    if (this.scene.preventMovement) { // all entities must not be moving before an entity can move
      return;
    }
    let dir = this.scene.movementHandler.getKeyDirection();
    if (!this.moving() && dir !== DIRECTION.NONE) {
      this.step();
      let dist = GAME_CONSTANTS.stepSize * (this.flipped ? -1 : 1);
      switch (dir) {
        case DIRECTION.LEFT:
          this.toPos.x = this.toPos.x - dist;
          this.direction = this.flipped ? DIRECTION.RIGHT : dir;
          break;
        case DIRECTION.RIGHT:
          this.toPos.x = this.toPos.x + dist;
          this.direction = this.flipped ? DIRECTION.LEFT : dir;
          break;
        case DIRECTION.UP:
          this.toPos.y = this.toPos.y - dist;
          this.direction = this.flipped ? DIRECTION.DOWN : dir;
          break;
        case DIRECTION.DOWN:
          this.toPos.y = this.toPos.y + dist;
          this.direction = this.flipped ? DIRECTION.UP : dir;
          break;
      }
      let revert = false;
      let tilemap = this.scene.tilemap;
      let tile = tilemap.getTileAt(Math.floor(this.toPos.x / tilemap.tileWidth), Math.floor(this.toPos.y / tilemap.tileHeight));
      if ((tile === null || tile.index === 2)) { // boulder tile
        revert = true;
      }
      // revert the positions
      if (revert) {
        this.resetToFromPosition();
        this.direction = DIRECTION.NONE;
      }
    }
    this.storeToFromPositions(this.toPos, this.fromPos);
  }

  update(time, delta) {
    super.update(time, delta);

    if (this.moving()) {
      // horizontal
      if (this.x < this.toPos.x) {
        this.x += this.spd;
      } else if (this.x > this.toPos.x) {
        this.x -= this.spd;
      }
      // veritcal
      if (this.y < this.toPos.y) {
        this.y += this.spd;
      } else if (this.y > this.toPos.y) {
        this.y -= this.spd;
      }
      // when the entity has reached the destination...
      if (!this.moving()) {
        this.x = this.toPos.x;
        this.y = this.toPos.y;
        this.fromPos.x = this.toPos.x;
        this.fromPos.y = this.toPos.y;
        this.direction = DIRECTION.NONE;
      }
    }
  }

  postUpdate(time, delta) {
    this.old_x = this.x;
    this.old_y = this.y;
    this.postStep();
  }

  resetToFromPosition() {
    this.toPos.x = this.fromPos.x;
    this.toPos.y = this.fromPos.y;
    this.direction = DIRECTION.NONE;
  }

  /**
   * Stores the entity's to/from positions on the scene. When the entities are processed
   * for collisions the stored positions will be used to determine whether or not the entity
   * is allowed to move.
   */
  storeToFromPositions(toPos, fromPos) {
    // to position
    if (toPos !== null) {
      const toCoord = GridUtils.getCoords(toPos);
      if (this.scene.entityToPosMap[toCoord] === null || this.scene.entityToPosMap[toCoord] === undefined) {
        this.scene.entityToPosMap[toCoord] = [];
      }
      this.scene.entityToPosMap[toCoord].push({
        id: this.id,
        toPos: toPos,
        fromPos: fromPos,
        direction: this.direction
      }); // add entity to position map
    }
    // from position
    if (fromPos !== null) {
      const fromCoord = GridUtils.getCoords(fromPos);
      if (this.scene.entityFromPosMap[fromCoord] === null || this.scene.entityFromPosMap[fromCoord] === undefined) {
        this.scene.entityFromPosMap[fromCoord] = [];
      }
      this.scene.entityFromPosMap[fromCoord].push({
        id: this.id,
        toPos: toPos,
        fromPos: fromPos,
        direction: this.direction
      }); // add entity to position map
    }
  }

  /**
   * Removes the stored to/from positions on the scene. This method is called when an entity collision
   * has occurred that has caused the entity's updated position to be reverted to the previous position.
   * @param toPos
   * @param fromPos
   */
  removeToFromPosition(toPos, fromPos) {
    // to position
    if (toPos !== null) {
      const toCoord = GridUtils.getCoords(toPos);
      if (this.scene.entityToPosMap[toCoord] !== null && this.scene.entityToPosMap[toCoord] !== undefined) {
        let updatedEntities = [];
        let oldEntities = this.scene.entityToPosMap[toCoord];
        for (let i = 0; i < oldEntities.length; i++) {
          let entity = oldEntities[i];
          if (entity.id !== this.id) {
            updatedEntities.push(entity);
          }
        }
        this.scene.entityToPosMap[toCoord] = updatedEntities;
      }
    }
    if (fromPos !== null) {
      const fromCoord = GridUtils.getCoords(fromPos);
      // from position
      if (this.scene.entityFromPosMap[fromCoord] !== null && this.scene.entityFromPosMap[fromCoord] !== undefined) {
        let updatedEntities = [];
        let oldEntities = this.scene.entityFromPosMap[fromCoord];
        for (let i = 0; i < oldEntities.length; i++) {
          let entity = oldEntities[i];
          if (entity.id !== this.id) {
            updatedEntities.push(entity);
          }
        }
        this.scene.entityToPosMap[fromCoord] = updatedEntities;
      }
    }
  }

  step() {

  }

  postStep() {

  }

  /**
   * Determines whether the two entities are neighbors.
   * @param self
   * @param other
   * @return {DIRECTION} returns the direction of which the neighbor is located, otherwise returns None.
   */
  static isNeighbor(self, other) {
    const tileSize = GAME_CONSTANTS.tileSize;
    const sx = Math.floor(Math.floor(self.fromPos.x) / tileSize);
    const sy = Math.floor(Math.floor(self.fromPos.y) / tileSize);
    const ox = Math.floor(Math.floor(other.fromPos.x) / tileSize);
    const oy = Math.floor(Math.floor(other.fromPos.y) / tileSize);

    if (sx - 1 === ox) {
      return DIRECTION.LEFT;
    } else if (sx + 1 === ox) {
      return DIRECTION.RIGHT;
    } else if (sy - 1 === oy) {
      return DIRECTION.UP;
    } else if (sy + 1 === oy) {
      return DIRECTION.DOWN;
    }
    return DIRECTION.NONE;
  }

  processCollision(other, neighborCollision) {
    let self = this;
    if (!this.tweenPreventMovement) {
      let size = neighborCollision ? 1.5 : 2;
      let diff_x = 0;
      if (this.direction === DIRECTION.LEFT) {
        diff_x = GAME_CONSTANTS.tileSize / size;
      } else if (this.direction === DIRECTION.RIGHT) {
        diff_x = -(GAME_CONSTANTS.tileSize / size);
      }
      let diff_y = 0;
      if (this.direction === DIRECTION.UP) {
        diff_y = GAME_CONSTANTS.tileSize / size;
      } else if (this.direction === DIRECTION.DOWN) {
        diff_y = -(GAME_CONSTANTS.tileSize / size);
      }

      this.tweenPreventMovement = true;

      // tween animation for colliding with other entities
      this.scene.tweens.add({
        targets: this,
        x: this.toPos.x + diff_x,
        y: this.toPos.y + diff_y,
        duration: 100,
        ease: 'Linear',
        yoyo: true,
        onComplete: function () {
          self.tweenPreventMovement = false;
        }
      });
    }
    return {neighborCollision: neighborCollision};
  }

  /**
   * Determines if the entity is moving towards its next position.
   */
  moving() {
    return ((this.direction === DIRECTION.LEFT && this.x > this.toPos.x) || (this.direction === DIRECTION.RIGHT && this.x < this.toPos.x))
        || ((this.direction === DIRECTION.UP && this.y > this.toPos.y) || (this.direction === DIRECTION.DOWN && this.y < this.toPos.y));
  }

  /**
   * Determines if the entity is currently preventing movement because tweening is in process.
   * @return {boolean}
   */
  preventMovementForTween() {
    return this.tweenPreventMovement;
  }
}