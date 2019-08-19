class Enemy extends BaseEntity {
  constructor(config) {
    super(config);
    this.flipSteps = 0;
    this.flipStepsMax = config.flipStepsMax || 5;
    if (config.flip) {
      this.flip();
    }
  }

  step() {
    super.step();
    this.flipSteps++;
  }

  postStep() {
    super.postStep();
    if (!this.moving()) {
      if (this.flipSteps === this.flipStepsMax) {
        this.flipSteps = 0;
        this.flip();
      }
    }
  }

  flip() {
    this.flipped = !this.flipped;
    this.setScale(this.flipped ? -1 : 1, 1);
  }

  processCollision(other, neighborCollision) {
    return super.processCollision(other, neighborCollision);
  }
}