#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Product {
    pub id: u64,
    pub seller: Address,
    pub name: String,
    pub price: u64,
}

const PRODUCTS: Symbol = symbol_short!("PRODUCTS");

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    // Tambah produk baru
    pub fn create_product(env: Env, seller: Address, name: String, price: u64) -> String {
        let mut products: Vec<Product> = env
            .storage()
            .instance()
            .get(&PRODUCTS)
            .unwrap_or(Vec::new(&env));

        let product = Product {
            id: env.prng().gen::<u64>(),
            seller: seller.clone(),
            name,
            price,
        };

        products.push_back(product);
        env.storage().instance().set(&PRODUCTS, &products);

        String::from_str(&env, "Produk berhasil ditambahkan")
    }

    // Ambil semua produk
    pub fn get_products(env: Env) -> Vec<Product> {
        env.storage()
            .instance()
            .get(&PRODUCTS)
            .unwrap_or(Vec::new(&env))
    }

    // Beli produk
    pub fn buy_product(env: Env, buyer: Address, id: u64) -> String {
        let mut products: Vec<Product> = env
            .storage()
            .instance()
            .get(&PRODUCTS)
            .unwrap_or(Vec::new(&env));

        for i in 0..products.len() {
            let p = products.get(i).unwrap();
            if p.id == id {
                if p.seller == buyer {
                    return String::from_str(&env, "Tidak bisa membeli produk sendiri");
                }
                products.remove(i);
                env.storage().instance().set(&PRODUCTS, &products);
                return String::from_str(&env, "Pembelian berhasil!");
            }
        }

        String::from_str(&env, "Produk tidak ditemukan")
    }
}
mod test;