const DIRECTION = {
  NONE: -1,
  LEFT: 0,
  RIGHT: 1,
  UP: 2,
  DOWN: 3
};

const Direction = {
  opposite: function (direction) {
    switch(direction) {
      case DIRECTION.LEFT:
        return DIRECTION.RIGHT;
      case DIRECTION.RIGHT:
        return DIRECTION.LEFT;
      case DIRECTION.UP:
        return DIRECTION.DOWN;
      case DIRECTION.DOWN:
        return DIRECTION.UP;
      default:
        return DIRECTION.NONE;
    }
  }
};