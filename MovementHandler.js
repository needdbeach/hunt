class MovementHandler {
  constructor(cursorKeys) {
    this.pressed = false;
    this.key = {direction: DIRECTION.NONE};
    this.keys = cursorKeys;
  }

  update() {
    this.key.direction = DIRECTION.NONE;
    let keydown = this.keys.left.isDown || this.keys.right.isDown || this.keys.up.isDown || this.keys.down.isDown;
    if (keydown) {
      if (!this.pressed) {
        if (this.keys.left.isDown) {
          this.key.direction = DIRECTION.LEFT;
        } else if (this.keys.right.isDown) {
          this.key.direction = DIRECTION.RIGHT;
        } else if (this.keys.up.isDown) {
          this.key.direction = DIRECTION.UP;
        } else {
          this.key.direction = DIRECTION.DOWN;
        }
        this.pressed = true;
      }
    } else {
      this.pressed = false;
    }
  }

  /**
   * @returns {object} composed of the direction of the keyboard press
   */
  getKeyDirection() {
    return this.key.direction;
  }
}