const GridUtils = {
  /**
   * Calculates the 1-dimensional position of the entity from its x,y positions
   * @param position represents the position of the entity
   * @return {number}
   */
  getCoords: function (position) {
    const x = Math.floor(Math.floor(position.x) / GAME_CONSTANTS.tileSize);
    const y = Math.floor(Math.floor(position.y) / GAME_CONSTANTS.tileSize);
    return (x * GAME_CONSTANTS.tileSize) + y;
  }
};