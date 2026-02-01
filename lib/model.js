import { query } from "./db.js";

export class Model {
  constructor(tableName, schema) {
    this.tableName = tableName;
    this.schema = schema;
  }

  // Generate CREATE TABLE SQL from schema
  getCreateTableSQL() {
    const columns = ["id INT AUTO_INCREMENT PRIMARY KEY"];

    for (const [field, config] of Object.entries(this.schema)) {
      let column = `${field} ${config.type}`;

      if (config.required) {
        column += " NOT NULL";
      }

      if (config.unique) {
        column += " UNIQUE";
      }

      if (config.default !== undefined) {
        if (config.default === null) {
          column += " DEFAULT NULL";
        } else if (typeof config.default === "boolean") {
          column += ` DEFAULT ${config.default ? "TRUE" : "FALSE"}`;
        } else if (typeof config.default === "string") {
          column += ` DEFAULT '${config.default}'`;
        } else {
          column += ` DEFAULT ${config.default}`;
        }
      }

      columns.push(column);
    }

    // Add timestamps
    columns.push("created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    columns.push(
      "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    );

    return `CREATE TABLE IF NOT EXISTS ${this.tableName} (${columns.join(", ")})`;
  }

  // Sync table (create if not exists)
  async sync() {
    const sql = this.getCreateTableSQL();
    await query(sql);
    return { success: true, message: `Table ${this.tableName} synced` };
  }

  // Find all records
  async findAll(conditions = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const where = Object.entries(conditions)
        .map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        })
        .join(" AND ");
      sql += ` WHERE ${where}`;
    }

    return await query(sql, params);
  }

  // Find one record
  async findOne(conditions) {
    const results = await this.findAll(conditions);
    return results[0] || null;
  }

  // Find by ID
  async findById(id) {
    return await this.findOne({ id });
  }

  // Create a new record
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => "?").join(", ");

    const sql = `INSERT INTO ${this.tableName} (${fields.join(", ")}) VALUES (${placeholders})`;
    const result = await query(sql, values);

    return { id: result.insertId, ...data };
  }

  // Update a record
  async update(id, data) {
    const fields = Object.entries(data)
      .map(([key]) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(data), id];

    const sql = `UPDATE ${this.tableName} SET ${fields} WHERE id = ?`;
    await query(sql, values);

    return await this.findById(id);
  }

  // Delete a record
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await query(sql, [id]);
    return { success: true };
  }

  // Count records
  async count(conditions = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(conditions).length > 0) {
      const where = Object.entries(conditions)
        .map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        })
        .join(" AND ");
      sql += ` WHERE ${where}`;
    }

    const result = await query(sql, params);
    return result[0].count;
  }
}
