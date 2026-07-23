export interface AdicionarProduto {
  produtoId: number;
  nome: string;
  categoria: string; //sobremesa, carne, pimenta, filé de mignom, etc
  quantidade: number;
  unidade: string; //kg, litro, unidade, etc
  dataEntrada: Date;
   
}

