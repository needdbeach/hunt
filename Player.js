class Player extends BaseEntity {
  constructor(config) {
    super(config);
  }

  step() {
    super.step();
    this.scene.levelManager.step();
  }

  processCollision(other, neighborCollision) {
    return super.processCollision(other, neighborCollision);
  }

  didStep() {
    return this.step;
  }
}