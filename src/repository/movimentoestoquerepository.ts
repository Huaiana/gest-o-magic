import db from "../database/database";
import { MovimentoEstoque } from "../models/movimentoEstoqueModel"; // Ajuste o caminho se necessário

export class MovimentoEstoqueRepository {

    // Registrar um novo movimento de estoque (entrada ou saída)
    criar(movimento: Omit<MovimentoEstoque, "id">): MovimentoEstoque {
        const resultado = db
            .prepare(`
                INSERT INTO movimentos (produto_id, categoria, tipo_movimento, quantidade, unidade, tipo, data_movimento) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                movimento.produto_id,
                movimento.categoria,
                movimento.tipo_movimento,
                movimento.quantidade,
                movimento.unidade,
                movimento.tipo,
                movimento.data_movimento
            );

        return { ...movimento, id: resultado.lastInsertRowid as number };
    }

    // Listar todos os movimentos de estoque
    listar(): MovimentoEstoque[] {
        const movimentos = db.prepare("SELECT * FROM movimentos").all();
        return movimentos as MovimentoEstoque[];
    }

    // Buscar um movimento específico por ID
    buscarPorId(id: number): MovimentoEstoque | null {
        const movimento = db.prepare("SELECT * FROM movimentos WHERE id = ?").get(id);
        return (movimento as MovimentoEstoque) || null;
    }

    // Buscar movimentos relacionados a um produto específico
    buscarPorProdutoId(produtoId: number): MovimentoEstoque[] {
        const movimentos = db.prepare("SELECT * FROM movimentos WHERE produto_id = ?").all(produtoId);
        return movimentos as MovimentoEstoque[];
    }

    // Atualizar um movimento de estoque existente
    atualizar(id: number, movimento: Omit<MovimentoEstoque, "id">): MovimentoEstoque | null {
        const resultado = db
            .prepare(`
                UPDATE movimentos 
                SET produto_id = ?, categoria = ?, tipo_movimento = ?, quantidade = ?, unidade = ?, tipo = ?, data_movimento = ? 
                WHERE id = ?
            `)
            .run(
                movimento.produto_id,
                movimento.categoria,
                movimento.tipo_movimento,
                movimento.quantidade,
                movimento.unidade,
                movimento.tipo,
                movimento.data_movimento,
                id
            );
            
        if (resultado.changes === 0) {
            return null;
        }
        return { ...movimento, id };
    }

    // Remover um movimento de estoque
    remover(id: number): boolean {
        const resultado = db.prepare("DELETE FROM movimentos WHERE id = ?").run(id);
        return resultado.changes > 0;
    }
}