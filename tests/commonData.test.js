import { createNewProductData } from '../commonData';

describe('createNewProductData function', () => {
  test('all values should be trimmed', () => {
    const pd = createNewProductData(
      '  Pillsbury pizza pocket 4 cheese ',
      ' $2.49  ',
      '     https://www.example.com'
    );

    expect(pd.title).toBe('Pillsbury pizza pocket 4 cheese');
    expect(pd.price).toBe(2.49);
    expect(pd.link).toBe('https://www.example.com');
  });
});