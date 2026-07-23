import db from "../database/database";
import { Estoque } from "../models/estoqueModel"; // Ajuste o caminho se necessário

export class EstoqueRepository {

    // Adicionar um novo registro ao estoque
    adicionar(estoque: Omit<Estoque, "id">): Estoque {
        const resultado = db
            .prepare(`
                INSERT INTO estoque (nome, categoria, quantidade, unidade, tipo, data_entrada, data_saida) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                estoque.nome,
                estoque.categoria,
                estoque.quantidade,
                estoque.unidade,
                estoque.tipo,
                estoque.data_entrada,
                estoque.data_saida
            );

        return { ...estoque, id: resultado.lastInsertRowid as number };
    }

    // Listar todos os registros do estoque
    listar(): Estoque[] {
        const itens = db.prepare("SELECT * FROM estoque").all();
        return itens as Estoque[];
    }

    // Buscar registro de estoque por ID
    buscarPorId(id: number): Estoque | null {
        const item = db.prepare("SELECT * FROM estoque WHERE id = ?").get(id);
        return (item as Estoque) || null;
    }

    // Atualizar um registro de estoque existente
    atualizar(id: number, estoque: Omit<Estoque, "id">): Estoque | null {
        const resultado = db
            .prepare(`
                UPDATE estoque 
                SET nome = ?, categoria = ?, quantidade = ?, unidade = ?, tipo = ?, data_entrada = ?, data_saida = ? 
                WHERE id = ?
            `)
            .run(
                estoque.nome,
                estoque.categoria,
                estoque.quantidade,
                estoque.unidade,
                estoque.tipo,
                estoque.data_entrada,
                estoque.data_saida,
                id
            );
            
        if (resultado.changes === 0) {
            return null;
        }
        return { ...estoque, id };
    }

    // Remover um registro do estoque
    remover(id: number): boolean {
        const resultado = db.prepare("DELETE FROM estoque WHERE id = ?").run(id);
        return resultado.changes > 0;
    }
}