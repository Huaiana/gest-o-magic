import { app } from '../app';
import { Request, Response } from 'express';
import { relatorioRepository } from '../repositories/relatoriorepository';

export function RelatorioController() {
    // Rota GET: Gerar relatório completo com estoque total
    app.get('/relatorio', async (req: Request, res: Response) => {
        try {
            const relatorio = await relatorioRepository.gerarRelatorio();
            const estoqueTotal = await relatorioRepository.calcularEstoqueTotal();
            return res.json({ relatorio, estoqueTotal });
        } catch (error) {
            return res.status(500).json({ message: "Erro ao gerar relatório", error });
        }
    });

    // Rota POST: Salvar / Gerar relatório por período
    app.post('/relatorio', async (req: Request, res: Response) => {
        try {
            const { dataInicio, dataFim } = req.body;
            const relatorioSalvo = await relatorioRepository.salvarRelatorio(dataInicio, dataFim);
            return res.status(201).json(relatorioSalvo);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao salvar relatório", error });
        }
    });

    // Rota PUT: Atualizar relatório existente
    app.put('/relatorio/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { dataInicio, dataFim } = req.body;
            
            const relatorioAtualizado = await relatorioRepository.atualizarRelatorio(id, dataInicio, dataFim);
            if (!relatorioAtualizado) {
                return res.status(404).json({ message: "Relatório não encontrado" });
            }

            return res.json(relatorioAtualizado);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao atualizar relatório", error });
        }
    });

    // Rota DELETE: Remover relatório
    app.delete('/relatorio/:id', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await relatorioRepository.removerRelatorio(id);
            return res.json({ message: "Relatório removido com sucesso" });
        } catch (error) {
            return res.status(500).json({ message: "Erro ao remover relatório", error });
        }
    });
}