import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../banco.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");
   

db.exec(`
  CREATE TABLE IF NOT EXISTS categoria (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT
  );

  CREATE TABLE IF NOT EXISTS fornecedor (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      VARCHAR(100) NOT NULL,
    cnpj      VARCHAR(20)  NOT NULL UNIQUE,
    telefone  VARCHAR(20),
    endereco  TEXT,
    email     VARCHAR(100) UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usuario (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    nome  VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          VARCHAR(150) NOT NULL,
    valor_venda   REAL NOT NULL CHECK (valor_venda > 0),
    categoria_id  INTEGER NOT NULL,
    fornecedor_id INTEGER NOT NULL,
    estoque       INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
    FOREIGN KEY (categoria_id)  REFERENCES categoria(id),
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id)
  );

  CREATE TABLE IF NOT EXISTS pedidos (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id          INTEGER NOT NULL,
    data_pedido         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total_pedido  REAL NOT NULL CHECK (valor_total_pedido >= 0),
    status_pedido       VARCHAR(20) NOT NULL DEFAULT 'Pendente',
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
  );

  CREATE TABLE IF NOT EXISTS item_pedido (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id      INTEGER NOT NULL,
    produto_id     INTEGER NOT NULL,
    quantidade     INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario REAL    NOT NULL CHECK (preco_unitario > 0),
    subtotal       REAL    NOT NULL,
    FOREIGN KEY (pedido_id)  REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
  );

  CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
  CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);

  -- Trigger: controle de estoque
  CREATE TRIGGER IF NOT EXISTS baixar_estoque_venda
  BEFORE INSERT ON item_pedido
  BEGIN
    SELECT CASE
      WHEN (SELECT estoque FROM produtos WHERE id = NEW.produto_id) < NEW.quantidade
      THEN RAISE(ABORT, 'Estoque insuficiente')
    END;

    UPDATE produtos
    SET estoque = estoque - NEW.quantidade
    WHERE id = NEW.produto_id;
  END;

  -- View: relatório
  CREATE VIEW IF NOT EXISTS relatorio_vendas AS
  SELECT 
    ped.id AS pedido_id,
    u.nome AS nome_usuario,
    pr.nome AS nome_produto,
    ip.quantidade,
    ip.preco_unitario,
    (ip.quantidade * ip.preco_unitario) AS subtotal_calculado,
    ped.data_pedido,
    ped.status_pedido
  FROM item_pedido ip
  JOIN pedidos ped ON ip.pedido_id = ped.id
  JOIN usuario u ON ped.usuario_id = u.id
  JOIN produtos pr ON ip.produto_id = pr.id;
`);



export const inserirProduto = (nome: any, valor_venda: number, estoque: number, catID: any, fornId: any) => {
  if (!nome || valor_venda <= 0 || estoque < 0) {
    throw new Error("Dados inválidos");
  }

  const stmt = db.prepare(`
    INSERT INTO produtos (nome, valor_venda, estoque, categoria_id, fornecedor_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  return stmt.run(nome, valor_venda, estoque, catID, fornId);
};



export const buscarProdutos = () => {
  return db.prepare(`
    SELECT 
      p.id,
      p.nome,
      p.valor_venda,
      p.estoque,
      c.nome AS categoria,
      f.nome AS fornecedor
    FROM produtos p
    JOIN categoria c ON p.categoria_id = c.id
    JOIN fornecedor f ON p.fornecedor_id = f.id
  `).all();
};


export const buscarRelatorio = () => {
  return db.prepare(`SELECT * FROM relatorio_vendas`).all(); 
};

export default db;