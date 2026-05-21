import { sqlToDiagram } from './sqlAdapter';

const SHOP_SQL = `
CREATE TABLE \`users\` (
  \`id\` bigint NOT NULL AUTO_INCREMENT,
  \`email\` varchar(255) NOT NULL,
  \`created_at\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`users_email_unique\` (\`email\`)
) ENGINE=InnoDB COMMENT='User accounts';

CREATE TABLE \`orders\` (
  \`id\` bigint NOT NULL AUTO_INCREMENT,
  \`user_id\` bigint NOT NULL,
  \`total\` decimal(10,2) NOT NULL,
  \`status\` varchar(32) NOT NULL,
  PRIMARY KEY (\`id\`),
  CONSTRAINT \`fk_orders_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
);

CREATE TABLE products (
  id bigint NOT NULL,
  name varchar(128) NOT NULL,
  price decimal(10,2) NOT NULL,
  PRIMARY KEY (id)
);
`;

test('sqlToDiagram parses CREATE TABLE and foreign keys', () => {
  const result = sqlToDiagram(SHOP_SQL);
  expect(result.ok).toBe(true);
  if (!result.ok) return;

  expect(result.diagram.tables).toHaveLength(3);
  const users = result.diagram.tables.find((t) => t.name === 'users');
  expect(users?.columns.find((c) => c.name === 'email')?.unique).toBe(true);
  expect(users?.columns.find((c) => c.name === 'id')?.primaryKey).toBe(true);

  expect(result.diagram.relationships).toHaveLength(1);
  const rel = result.diagram.relationships[0];
  expect(rel.kind).toBe('field-field');
  expect(rel.source.tableId).toBe('orders');
  expect(rel.source.columnId).toBe('user_id');
  expect(rel.target.tableId).toBe('users');
});

test('sqlToDiagram rejects empty input', () => {
  const result = sqlToDiagram('  ');
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.error).toMatch(/为空/);
});

test('sqlToDiagram strips line comments', () => {
  const result = sqlToDiagram(`
-- users table
CREATE TABLE users (
  id int NOT NULL PRIMARY KEY -- pk
);
`);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.diagram.tables[0].name).toBe('users');
});
