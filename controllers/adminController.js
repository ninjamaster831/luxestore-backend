const db = require('../config/db');

// ─── Get All Products ──────────────────────────────────────────
const getProducts = async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
};

// ─── Add Product ───────────────────────────────────────────────
const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, image_url } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: 'Name and price are required.' });
        }

        const [result] = await db.query(
            'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description || '', price, stock || 0, category || '', image_url || '']
        );

        res.status(201).json({ message: 'Product added.', id: result.insertId });
    } catch (err) {
        console.error('Add product error:', err);
        res.status(500).json({ message: 'Failed to add product.' });
    }
};

// ─── Update Product ────────────────────────────────────────────
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, category, image_url } = req.body;

        await db.query(
            'UPDATE products SET name=?, description=?, price=?, stock=?, category=?, image_url=? WHERE id=?',
            [name, description, price, stock, category, image_url, id]
        );

        res.json({ message: 'Product updated.' });
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ message: 'Failed to update product.' });
    }
};

// ─── Delete Product ────────────────────────────────────────────
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted.' });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ message: 'Failed to delete product.' });
    }
};

// ─── Get All Orders ────────────────────────────────────────────
const getOrders = async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT 
                o.id,
                o.total,
                o.status,
                o.created_at,
                u.name as user_name,
                u.email as user_email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        );
        res.json(orders);
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ message: 'Failed to fetch orders.' });
    }
};

// ─── Update Order Status ───────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }

        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Order status updated.' });
    } catch (err) {
        console.error('Update order status error:', err);
        res.status(500).json({ message: 'Failed to update order status.' });
    }
};

// ─── Get Dashboard Stats ───────────────────────────────────────
const getStats = async (req, res) => {
    try {
        const [[{ totalRevenue }]] = await db.query(
            "SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders WHERE status != 'cancelled'"
        );
        const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) as totalOrders FROM orders');
        const [[{ totalUsers }]] = await db.query("SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'");
        const [[{ lowStockCount }]] = await db.query('SELECT COUNT(*) as lowStockCount FROM products WHERE stock < 5');

        res.json({ totalRevenue, totalOrders, totalUsers, lowStockCount });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ message: 'Failed to fetch stats.' });
    }
};

module.exports = { getProducts, addProduct, updateProduct, deleteProduct, getOrders, updateOrderStatus, getStats };