from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__, template_folder='.')
CORS(app)

DB_NAME = 'estoque.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tabela de Produtos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            categoria TEXT NOT NULL,
            quantidade INTEGER NOT NULL DEFAULT 0,
            unidade TEXT NOT NULL,
            estoque BOOLEAN NOT NULL DEFAULT 0,
            data_entrada TEXT NOT NULL
        )
    ''')

    # Tabela de Movimentações
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS movimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            categoria TEXT NOT NULL,
            tipo_movimento TEXT NOT NULL,
            quantidade INTEGER NOT NULL,
            unidade TEXT NOT NULL,
            data_movimento TEXT NOT NULL,
            FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE
        )
    ''')

    # Tabela de Relatórios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS relatorios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            datahora TEXT NOT NULL,
            total_movimentos INTEGER NOT NULL,
            total_entrada INTEGER NOT NULL,
            total_saida INTEGER NOT NULL,
            estoque_atual INTEGER NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

# Rota para carregar o HTML
@app.route('/')
def index():
    return render_template('index.html')

# --- ROTAS API: PRODUTOS ---

@app.route('/api/produtos', methods=['GET'])
def get_produtos():
    conn = get_db_connection()
    produtos = conn.execute('SELECT * FROM produtos').fetchall()
    conn.close()
    return jsonify([dict(p) for p in produtos])

@app.route('/api/produtos', methods=['POST'])
def add_produto():
    data = request.json
    nome = data['nome']
    categoria = data['categoria']
    quantidade = int(data['quantidade'])
    unidade = data['unidade']
    estoque = quantidade > 0
    now = datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO produtos (nome, categoria, quantidade, unidade, estoque, data_entrada) VALUES (?, ?, ?, ?, ?, ?)',
        (nome, categoria, quantidade, unidade, estoque, now)
    )
    produto_id = cursor.lastrowid

    # Caso a quantidade inicial seja > 0, cria movimentação de entrada
    if quantidade > 0:
        cursor.execute(
            'INSERT INTO movimentos (produto_id, categoria, tipo_movimento, quantidade, unidade, data_movimento) VALUES (?, ?, ?, ?, ?, ?)',
            (produto_id, categoria, 'entrada', quantidade, unidade, now)
        )

    conn.commit()
    conn.close()
    return jsonify({"status": "success", "id": produto_id}), 201

@app.route('/api/produtos/<int:id>', methods=['PUT'])
def update_produto(id):
    data = request.json
    nome = data['nome']
    categoria = data['categoria']
    quantidade = int(data['quantidade'])
    unidade = data['unidade']
    estoque = quantidade > 0

    conn = get_db_connection()
    conn.execute(
        'UPDATE produtos SET nome = ?, categoria = ?, quantidade = ?, unidade = ?, estoque = ? WHERE id = ?',
        (nome, categoria, quantidade, unidade, estoque, id)
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/produtos/<int:id>', methods=['DELETE'])
def delete_produto(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM produtos WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

# --- ROTAS API: MOVIMENTAÇÕES ---

@app.route('/api/movimentos', methods=['GET'])
def get_movimentos():
    conn = get_db_connection()
    movimentos = conn.execute('SELECT * FROM movimentos').fetchall()
    conn.close()
    return jsonify([dict(m) for m in movimentos])

@app.route('/api/movimentos', methods=['POST'])
def add_movimento():
    data = request.json
    produto_id = int(data['produto_id'])
    tipo = data['tipo_movimento']
    quantidade = int(data['quantidade'])
    now = datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    produto = cursor.execute('SELECT * FROM produtos WHERE id = ?', (produto_id,)).fetchone()
    if not produto:
        conn.close()
        return jsonify({"error": "Produto não encontrado"}), 404

    prod_dict = dict(produto)
    qtd_atual = prod_dict['quantidade']

    if tipo == 'saida' and qtd_atual < quantidade:
        conn.close()
        return jsonify({"error": "Estoque insuficiente"}), 400

    nova_qtd = qtd_atual + quantidade if tipo == 'entrada' else qtd_atual - quantidade
    novo_estoque = nova_qtd > 0

    cursor.execute(
        'UPDATE produtos SET quantidade = ?, estoque = ? WHERE id = ?',
        (nova_qtd, novo_estoque, produto_id)
    )

    cursor.execute(
        'INSERT INTO movimentos (produto_id, categoria, tipo_movimento, quantidade, unidade, data_movimento) VALUES (?, ?, ?, ?, ?, ?)',
        (produto_id, prod_dict['categoria'], tipo, quantidade, prod_dict['unidade'], now)
    )

    conn.commit()
    conn.close()
    return jsonify({"status": "success"}), 201

# --- ROTAS API: RELATÓRIOS ---

@app.route('/api/relatorios', methods=['GET'])
def get_relatorios():
    conn = get_db_connection()
    relatorios = conn.execute('SELECT * FROM relatorios').fetchall()
    conn.close()
    return jsonify([dict(r) for r in relatorios])

@app.route('/api/relatorios', methods=['POST'])
def add_relatorio():
    conn = get_db_connection()
    cursor = conn.cursor()

    movimentos = cursor.execute('SELECT * FROM movimentos').fetchall()
    produtos = cursor.execute('SELECT * FROM produtos').fetchall()

    total_mov = len(movimentos)
    total_entrada = sum(m['quantidade'] for m in movimentos if m['tipo_movimento'] == 'entrada')
    total_saida = sum(m['quantidade'] for m in movimentos if m['tipo_movimento'] == 'saida')
    estoque_atual = sum(1 for p in produtos if p['estoque'] > 0)
    now = datetime.now().isoformat()

    cursor.execute(
        'INSERT INTO relatorios (tipo, datahora, total_movimentos, total_entrada, total_saida, estoque_atual) VALUES (?, ?, ?, ?, ?, ?)',
        ('Diário', now, total_mov, total_entrada, total_saida, estoque_atual)
    )

    conn.commit()
    conn.close()
    return jsonify({"status": "success"}), 201

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=3000)