const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin')); // All user management is admin-only

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);

module.exports = router;
