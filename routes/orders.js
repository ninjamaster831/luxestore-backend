const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { checkout, getMyOrders, getOrderItems } = require('../controllers/orderController');

router.post('/checkout', auth, checkout);
router.get('/', auth, getMyOrders);
router.get('/:id/items', auth, getOrderItems);

module.exports = router;