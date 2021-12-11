const Model = require(".");

class ModelProgressing extends Model {
  tableName = "progressings";

  getOne = async (id) => {
    return await this.findOne({ id })
  }
}

module.exports = ModelProgressing;