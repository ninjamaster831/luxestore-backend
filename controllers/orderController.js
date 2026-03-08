const db = require('../config/db');

// ─── Checkout ──────────────────────────────────────────────────
const checkout = async (req, res) => {
    const conn = await (await require('../config/db')).getConnection
        ? db
        : db;

    try {
        const userId = req.user.id;

        // Get user's cart items
        const [cartItems] = await db.query(
            `SELECT 
                ci.id as cart_id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.stock
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.id
             WHERE ci.user_id = ?`,
            [userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty.' });
        }

        // Check stock for all items
        for (const item of cartItems) {
            if (item.stock < item.quantity) {
                return res.status(400).json({
                    message: `Not enough stock for "${item.name}". Only ${item.stock} left.`
                });
            }
        }

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create order
        const [orderResult] = await db.query(
            'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)',
            [userId, total.toFixed(2), 'paid']
        );

        const orderId = orderResult.insertId;

        // Insert order items + reduce stock
        for (const item of cartItems) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
            await db.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Clear cart
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        res.status(201).json({
            message: 'Order placed successfully!',
            orderId,
            total: total.toFixed(2)
        });

    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).json({ message: 'Checkout failed. Please try again.' });
    }
};

// ─── Get My Orders ─────────────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const [orders] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json(orders);
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ message: 'Failed to fetch orders.' });
    }
};

// ─── Get Order Items ───────────────────────────────────────────
const getOrderItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify order belongs to this user
        const [orders] = await db.query(
            'SELECT id FROM orders WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const [items] = await db.query(
            `SELECT 
                oi.id,
                oi.order_id,
                oi.product_id,
                oi.quantity,
                oi.price,
                p.name,
                p.image_url
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [id]
        );

        res.json(items);
    } catch (err) {
        console.error('Get order items error:', err);
        res.status(500).json({ message: 'Failed to fetch order items.' });
    }
};

module.exports = { checkout, getMyOrders, getOrderItems };