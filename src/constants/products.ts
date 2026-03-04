import type { Product } from "../types/cashier";

export const PRODUCTS_BY_CATEGORY: Record<string, Product[]> = {
    "Semua Menu": [
        { id: 1, name: "Es Teh", category: "Minuman Dingin", price: 5000, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200" },
        { id: 2, name: "Es Lemon Teh", category: "Minuman Dingin", price: 7000, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200" },
        { id: 3, name: "Es Teh Tarik", category: "Minuman Dingin", price: 7000, image: "https://grosirmesin.com/wp-content/uploads/2019/08/d823a1284bbd539e91df1402c1afafcc.jpg" },
        { id: 4, name: "Es Coklat Nusantara", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
        { id: 5, name: "Es Matcha Nusantara", category: "Minuman Dingin", price: 10000, image: "https://cdn.loveandlemons.com/wp-content/uploads/2023/06/iced-matcha-latte.jpg" },
        { id: 6, name: "Es Kopi Susu", category: "Minuman Dingin", price: 10000, image: "https://jasindo.co.id/uploads/media/otwgs4vrqfbvvy30ymyeelsug-kopijpg" },
        { id: 7, name: "Es Susu Nusantara", category: "Minuman Dingin", price: 8000, image: "https://media.zcreators.id/crop/0x0:0x0/750x500/photo/indizone/2020/09/27/L9sabJz/es-susu-yakult-nikmat-diminum-bersama-buah-hati-tercinta88.jpg" },
        { id: 8, name: "Jagung Bakar Serut", category: "Makanan", price: 12500, image: "https://img-global.cpcdn.com/recipes/afb2127a3b558e33/1200x630cq80/photo.jpg" },
        { id: 9, name: "Roti Bakar Tipuk", category: "Makanan", price: 10000, image: "https://img-global.cpcdn.com/recipes/307de85d5d46931d/680x781cq80/roti-bakar-coklat-foto-resep-utama.jpg" },
        {
            id: 10, name: "Roti Maryam", category: "Makanan", price: 10000, image: "https://pasarbadung.com/wp-content/uploads/2025/05/katalog-100fresh-5.jpg",
            variants: ["Cokelat", "Tiramisu", "Matcha", "Keju", "Oreo"],
            toppings: [
                { name: "Keju", price: 500 },
                { name: "Oreo", price: 500 }
            ]
        },
        { id: 11, name: "Kopi Irong Jahe", category: "Minuman Panas - Kopi", price: 8000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr4XFmuIuE_ZFoMPEMpQiqMWU-fQqJzEQx4Q&s" },
    ],
    "Minuman Dingin": [
        { id: 1, name: "Es Teh", category: "Minuman Dingin", price: 5000, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=200" },
        { id: 2, name: "Es Lemon Teh", category: "Minuman Dingin", price: 7000, image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=200" },
        { id: 3, name: "Es Teh Tarik", category: "Minuman Dingin", price: 7000, image: "https://grosirmesin.com/wp-content/uploads/2019/08/d823a1284bbd539e91df1402c1afafcc.jpg" },
        { id: 4, name: "Es Coklat Nusantara", category: "Minuman Dingin", price: 10000, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=200" },
        { id: 5, name: "Es Matcha Nusantara", category: "Minuman Dingin", price: 10000, image: "https://cdn.loveandlemons.com/wp-content/uploads/2023/06/iced-matcha-latte.jpg" },
        { id: 6, name: "Es Kopi Susu", category: "Minuman Dingin", price: 10000, image: "https://jasindo.co.id/uploads/media/otwgs4vrqfbvvy30ymyeelsug-kopijpg" },
        { id: 7, name: "Es Susu Nusantara", category: "Minuman Dingin", price: 8000, image: "https://media.zcreators.id/crop/0x0:0x0/750x500/photo/indizone/2020/09/27/L9sabJz/es-susu-yakult-nikmat-diminum-bersama-buah-hati-tercinta88.jpg" },
    ],
    "Minuman Panas - Kopi": [
        { id: 11, name: "Kopi Irong Jahe", category: "Minuman Panas - Kopi", price: 8000, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSr4XFmuIuE_ZFoMPEMpQiqMWU-fQqJzEQx4Q&s" },
    ],
    "Minuman Panas - Non Kopi": [
        { id: 12, name: "Teh Jahe", category: "Minuman Panas - Non Kopi", price: 7000, image: "https://res.cloudinary.com/dk0z4ums3/image/upload/v1719800212/attached_image/teh-jahe-inilah-9-manfaatnya-bagi-kesehatan.jpg" },
        { id: 13, name: "Susu Jahe", category: "Minuman Panas - Non Kopi", price: 8000, image: "https://res.cloudinary.com/dk0z4ums3/image/upload/v1727855537/attached_image/susu-jahe-ketahui-manfaat-dan-cara-membuatnya.jpg" },
    ],
    "Makanan": [
        { id: 8, name: "Jagung Bakar Serut", category: "Makanan", price: 12500, image: "https://img-global.cpcdn.com/recipes/afb2127a3b558e33/1200x630cq80/photo.jpg" },
        { id: 9, name: "Roti Bakar Tipuk", category: "Makanan", price: 10000, image: "https://img-global.cpcdn.com/recipes/307de85d5d46931d/680x781cq80/roti-bakar-coklat-foto-resep-utama.jpg" },
        {
            id: 10, name: "Roti Maryam", category: "Makanan", price: 10000, image: "https://pasarbadung.com/wp-content/uploads/2025/05/katalog-100fresh-5.jpg",
            variants: ["Cokelat", "Tiramisu", "Matcha", "Keju", "Oreo"],
            toppings: [
                { name: "Keju", price: 500 },
                { name: "Oreo", price: 500 }
            ]
        },
    ]
};

export const CATEGORIES = [
    { name: "Semua Menu", count: 11, icon: "📋" },
    { name: "Minuman Dingin", count: 7, icon: "🥤" },
    { name: "Minuman Panas - Kopi", count: 1, icon: "☕" },
    { name: "Minuman Panas - Non Kopi", count: 2, icon: "🍵" },
    { name: "Makanan", count: 3, icon: "🍽️" },
];
