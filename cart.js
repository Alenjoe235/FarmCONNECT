document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const cartItems = document.getElementById('cart-items');
    const addProductButton = document.getElementById('add-product');
    const clearButton = document.getElementById('clear');
    const finishButton = document.getElementById('finish');
    const resetButton = document.getElementById('reset');
  
    let products = [];

    const db = openDatabase('CartDB', '1.0', 'Shopping Cart Database', 2 * 1024 * 1024);

    db.transaction(tx => {
        tx.executeSql('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, price REAL)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS cart (id INTEGER PRIMARY KEY, name TEXT, price REAL)');
    });

    const addProductToList = () => {
        const productName = prompt('Enter product name:');
        if (productName) {
            const productPrice = parseFloat(prompt('Enter product price:'));
            if (!isNaN(productPrice)) {
                const product = { name: productName, price: productPrice };
                products.push(product);
                const listItem = document.createElement('li');
                listItem.textContent = `${product.name} - $${product.price}`;
                productList.appendChild(listItem);

                db.transaction(tx => {
                    tx.executeSql('INSERT INTO products (name, price) VALUES (?, ?)', [product.name, product.price]);
                });
            } else {
                alert('Invalid price. Please enter a valid number.');
            }
        }
    };

    addProductButton.addEventListener('click', addProductToList);

    clearButton.addEventListener('click', () => {
        products = [];
        productList.innerHTML = '';
        db.transaction(tx => {
            tx.executeSql('DELETE FROM products');
        });
    });

    resetButton.addEventListener('click', () => {
        products = [];
        productList.innerHTML = '';
        cartItems.innerHTML = '';
        db.transaction(tx => {
            tx.executeSql('DELETE FROM products');
            tx.executeSql('DELETE FROM cart');
        });
    });

    finishButton.addEventListener('click', () => {
        db.transaction(tx => {
            products.forEach(product => {
                tx.executeSql('INSERT INTO cart (name, price) VALUES (?, ?)', [product.name, product.price]);
            });
        });
        addProductButton.disabled = true;
        clearButton.disabled = true;
        finishButton.disabled = true;
    });

    const updateCart = () => {
        cartItems.innerHTML = '';
        db.transaction(tx => {
            tx.executeSql('SELECT * FROM cart', [], (tx, results) => {
                for (let i = 0; i < results.rows.length; i++) {
                    const item = results.rows.item(i);
                    const cartItem = document.createElement('div');
                    cartItem.textContent = `${item.name} - $${item.price}`;
                    cartItems.appendChild(cartItem);
                }
            });
        });
    };

    updateCart();
});