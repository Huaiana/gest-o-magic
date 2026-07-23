import db from "../database/database";
import { Relatorio } from "../models/relatorioModel"; // Ajuste o caminho se necessário

export class RelatorioRepository {

    // Salvar um novo relatório gerado
    salvar(relatorio: Omit<Relatorio, "id">): Relatorio {
        const resultado = db
            .prepare(`
                INSERT INTO relatorios (
                    tipo_relatorio, datahora, nome, categoria, 
                    quantidade_estoque, unidade, tipo, 
                    total_movimentos, total_entrada, total_saida, estoque_atual
                ) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                relatorio.tipo_relatorio,
                relatorio.datahora,
                relatorio.nome,
                relatorio.categoria,
                relatorio.quantidade_estoque,
                relatorio.unidade,
                relatorio.tipo,
                relatorio.total_movimentos,
                relatorio.total_entrada,
                relatorio.total_saida,
                relatorio.estoque_atual
            );

        const relatorioId = resultado.lastInsertRowid as number;

        // Se houver uma lista de produtos associados ao relatório, você pode salvá-los em uma tabela de junção, se necessário.
        return { ...relatorio, id: relatorioId };
    }

    // Listar todos os relatórios salvos
    listar(): Relatorio[] {
        const relatorios = db.prepare("SELECT * FROM relatorios").all();
        return relatorios as Relatorio[];
    }

    // Buscar um relatório específico por ID
    buscarPorId(id: number): Relatorio | null {
        const relatorio = db.prepare("SELECT * FROM relatorios WHERE id = ?").get(id);
        return (relatorio as Relatorio) || null;
    }

    // Atualizar um relatório existente
    atualizar(id: number, relatorio: Omit<Relatorio, "id">): Relatorio | null {
        const resultado = db
            .prepare(`
                UPDATE relatorios 
                SET tipo_relatorio = ?, datahora = ?, nome = ?, categoria = ?, 
                    quantidade_estoque = ?, unidade = ?, tipo = ?, 
                    total_movimentos = ?, total_entrada = ?, total_saida = ?, estoque_atual = ?
                WHERE id = ?
            `)
            .run(
                relatorio.tipo_relatorio,
                relatorio.datahora,
                relatorio.nome,
                relatorio.categoria,
                relatorio.quantidade_estoque,
                relatorio.unidade,
                relatorio.tipo,
                relatorio.total_movimentos,
                relatorio.total_entrada,
                relatorio.total_saida,
                relatorio.estoque_atual,
                id
            );
            
        if (resultado.changes === 0) {
            return null;
        }
        return { ...relatorio, id };
    }

    // Remover um relatório
    remover(id: number): boolean {
        const resultado = db.prepare("DELETE FROM relatorios WHERE id = ?").run(id);
        return resultado.changes > 0;
    }
}