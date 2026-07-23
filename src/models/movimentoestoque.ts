export interface MovimentoEstoque {
    id: number;
    produtoId: number;
    nome: string; //produto
    categoria: string;  //sobremesa, carne, pimenta, filé de mignom, etc
    unidade: string;  //kg, litro, unidade, etc
    quantidade: number;
    tipoMovimento: 'entrada' | 'saida';
    dataMovimento: Date;
}