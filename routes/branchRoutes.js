// routes/branchRoutes.js
// API routing for restaurant branches (Kilimani, Pangani, Karen, Lavington)

const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const auth = require('../middleware/auth');

// 1. Get all branches (Public)
router.get('/', branchController.getAllBranches);

// 2. Get a single branch (Public)
router.get('/:id', branchController.getBranchById);

// 3. Create new branch (Admin)
router.post('/', auth, branchController.createBranch);

// 4. Update existing branch (Admin)
router.put('/:id', auth, branchController.updateBranch);

// 5. Delete branch (Admin)
router.delete('/:id', auth, branchController.deleteBranch);

module.exports = router;
