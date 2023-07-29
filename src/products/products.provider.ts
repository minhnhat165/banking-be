import { Product } from './product.model';
import { Provider } from '@nestjs/common';

export const productsProviders: Provider[] = [
  {
    provide: 'ProductRepository',
    useValue: Product,
  },
];
