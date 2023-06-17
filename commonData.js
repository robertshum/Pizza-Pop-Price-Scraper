export function createNewProductData(titleInput, priceInput) {
    const title = titleInput.trim();
    const rawPrice = priceInput.trim();
    const price = parseFloat(rawPrice.replace('$', ''));
    return {
        title: title,
        price: price
    };
}