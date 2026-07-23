import db from "../database/database";
import { AdicionarProduto } from "../models/adicionarproduto";

export class AdicionarProdutoRepository {
    
    adicionar(produto: AdicionarProduto): AdicionarProduto {
        const resultado = db
            .prepare(`
                INSERT INTO adicionar_produto (nome, categoria, quantidade, unidade, tipo, data_entrada) 
                VALUES (?, ?, ?, ?, ?, ?)
            `)
            .run(
                produto.nome,
                produto.categoria,
                produto.quantidade,
                produto.unidade,
                produto.tipo,
                produto.data_entrada
            );

        return { 
            ...produto, 
            id: resultado.lastInsertRowid as number 
        };
    }
}