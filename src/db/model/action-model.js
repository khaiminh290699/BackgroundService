const Model = require("./index");

class ModelAction extends Model {
  tableName = "actions";

  listActionsByWeb = async (web_id, type) => {
    const query = this.query().where({ web_id }).orderByRaw("type, order_number");;
    if (type) {
      query.where({ type });
    }
    return query;
  }
}

module.exports = ModelAction;