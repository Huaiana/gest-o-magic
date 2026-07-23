export interface Relatorio {
    id: number;
    tipo: 'Diário' | 'Semanal' | 'Mensal';
    datahora: Date;
    nome: string; //produto
    categoria: string;  //sobremesa, carne, pimenta, filé de mignom, etc
    quantidadeEstoque: number;
    unidade: string;  //kg, litro, unidade, etc 
    totalMovimentos: number;
    totalEntrada: number;
    totalSaida: number;
    estoqueAtual: number;   
}


