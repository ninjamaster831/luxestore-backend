const db = require('../config/db');

// ─── Get Cart ──────────────────────────────────────────────────
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const [items] = await db.query(
            `SELECT 
                ci.id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.image_url,
                p.stock
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ?`,
            [userId]
        );

        res.json(items);
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ message: 'Failed to fetch cart.' });
    }
};

// ─── Add to Cart ───────────────────────────────────────────────
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({ message: 'product_id is required.' });
        }

        // Check product exists and has stock
        const [products] = await db.query(
            'SELECT id, stock FROM products WHERE id = ?',
            [product_id]
        );
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        if (products[0].stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock.' });
        }

        // If item already in cart, increase quantity
        const [existing] = await db.query(
            'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (existing.length > 0) {
            await db.query(
                'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
                [quantity, existing[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, product_id, quantity]
            );
        }

        res.json({ message: 'Item added to cart.' });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ message: 'Failed to add to cart.' });
    }
};

// ─── Update Cart Item Quantity ─────────────────────────────────
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1.' });
        }

        await db.query(
            'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
            [quantity, id, userId]
        );

        res.json({ message: 'Cart updated.' });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ message: 'Failed to update cart.' });
    }
};

// ─── Remove from Cart ──────────────────────────────────────────
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await db.query(
            'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ message: 'Item removed from cart.' });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ message: 'Failed to remove item.' });
    }
};

// ─── Clear Entire Cart ─────────────────────────────────────────
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
        res.json({ message: 'Cart cleared.' });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ message: 'Failed to clear cart.' });
    }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };