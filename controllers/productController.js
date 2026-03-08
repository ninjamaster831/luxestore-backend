const db = require('../config/db');

// ─── Get All Products (with optional search & category) ────────
const getProducts = async (req, res) => {
    try {
        const { search = '', category = '' } = req.query;

        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY created_at DESC';

        const [products] = await db.query(query, params);
        res.json(products);

    } catch (err) {
        console.error('Get products error:', err);
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
};

// ─── Get Single Product ────────────────────────────────────────
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json(products[0]);
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ message: 'Failed to fetch product.' });
    }
};

module.exports = { getProducts, getProduct };