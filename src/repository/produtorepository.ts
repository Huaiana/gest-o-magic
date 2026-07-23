import db from "../database/database";
import { Produto } from "../models/produtoModel";

export class ProdutoRepository {
    
    // Salvar um novo produto com unidade, tipo e quantidade
    salvar(produto: Omit<Produto, "id">): Produto {
        const resultado = db
            .prepare(`
                INSERT INTO produtos (nome, estoque, quantidade, unidade, tipo) 
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(
                produto.nome, 
                produto.estoque, 
                produto.quantidade, 
                produto.unidade, 
                produto.tipo
            );

        return { ...produto, id: resultado.lastInsertRowid as number };
    }

    // Listar todos os produtos
    listar(): Produto[] {
        const produtos = db.prepare("SELECT * FROM produtos").all();
        return produtos as Produto[];
    }

    // Buscar produto por ID
    buscarPorId(id: number): Produto | null {
        const produto = db.prepare("SELECT * FROM produtos WHERE id = ?").get(id);
        return (produto as Produto) || null;
    }

    // Buscar produtos por nome
    buscarPorNome(nome: string): Produto[] {
        const produtos = db.prepare("SELECT * FROM produtos WHERE nome LIKE ?").all(`%${nome}%`);
        return produtos as Produto[];
    }

    // Atualizar produto existente incluindo unidade, tipo e quantidade
    atualizar(id: number, produto: Omit<Produto, "id">): Produto | null {
        const resultado = db
            .prepare(`
                UPDATE produtos 
                SET nome = ?, quantidade = ?, unidade = ?, tipo = ? 
                WHERE id = ?
            `)
            .run(
                produto.nome, 
                produto.estoque,
                produto.quantidade, 
                produto.unidade, 
                produto.tipo, 
                id
            );
            
        if (resultado.changes === 0) {
            return null;
        }
        return { ...produto, id };
    }

    // Remover produto
    remover(id: number): boolean {
        const resultado = db.prepare("DELETE FROM produtos WHERE id = ?").run(id);
        return resultado.changes > 0;
    }
}