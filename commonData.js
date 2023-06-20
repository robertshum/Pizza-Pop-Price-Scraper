export function createNewProductData(titleInput, priceInput, productLink) {
    const title = titleInput.trim();
    const rawPrice = priceInput.trim();
    const link = productLink.trim();
    const price = parseFloat(rawPrice.replace('$', ''));
    return {
        title: title,
        price: price,
        link: link
    };
}