# FarmCONNECT


FarmConnect is a digital platform that connects local farmers with consumers, promoting sustainable agriculture practices and reducing food waste. Consumers can discover and purchase fresh, locally sourced produce directly from farmers.

## Features

- **Product Listings**: Farmers can list their products with detailed descriptions, prices, and quantities available.
- **Search and Filter**: Consumers can search for specific products and filter results based on their preferences.
- **Cart and Checkout**: Consumers can add products to their cart and proceed to checkout for a seamless purchasing experience.
- **Geolocation**: The app helps consumers find the nearest farmers and markets based on their location.
- **User Profiles**: Both farmers and consumers can create profiles to manage their listings and orders.
- **Secure Transactions**: The platform ensures secure transactions between buyers and sellers.

## Installation

1. **Clone the repository**:
    ```sh
    git clone <repository-url>
    cd Tinkermen-main
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Set up the SQLite database**:
    The database will be initialized automatically when the server starts.

## Usage

1. **Start the server**:
    ```sh
    npm start
    ```

2. **Access the application**:
    Open your web browser and navigate to `http://localhost:3000`.

## API Endpoints

- **GET /products**: Fetch all products.
- **POST /products**: Add a new product.
- **POST /submit-profile**: Submit a new profile.
- **POST /add-to-cart**: Add a product to the cart.
- **GET /cart**: Fetch all items in the cart.
- **DELETE /cart/:productname**: Remove a product from the cart.

## Project Structure

```
Tinkermen-main/
├── templates/
│   ├── MainPage.html
│   ├── MainPageBuy.html
│   ├── ... (other HTML files)
├── server.js
├── package.json
├── README.md
└── ... (other files)
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
