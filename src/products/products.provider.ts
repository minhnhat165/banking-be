import { Product } from './products.model';
import { Provider } from '@nestjs/common';

export const productsProviders: Provider[] = [
  {
    provide: 'ProductRepository',
    useValue: Product,
  },
];
