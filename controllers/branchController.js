// controllers/branchController.js
// Handles read access to restaurant branches (Kilimani, Pangani, Karen,
// Lavington, ...) and admin-only management of that list.

const pool = require('../db/db');

// Helper to map DB row to a clean frontend-friendly shape
const mapBranchRow = (row) => ({
    id: row.id,
    name: row.name,
    isMain: !!row.is_main,
    hasBar: !!row.has_bar,
    phone: row.phone,
    address: row.address,
    openingHours: row.opening_hours,
    description: row.description
});

/**
 * Retrieve all branches
 * GET /api/branches
 */
exports.getAllBranches = async (req, res, next) => {
    try {
        const rows = await pool('branches').orderBy('is_main', 'desc').orderBy('name');
        return res.status(200).json(rows.map(mapBranchRow));
    } catch (err) {
        console.error('💥 Error fetching branches:', err);
        next(err);
    }
};

/**
 * Retrieve a single branch by id
 * GET /api/branches/:id
 */
exports.getBranchById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const branch = await pool('branches').where({ id }).first();

        if (!branch) {
            return res.status(404).json({ error: 'Branch not found.' });
        }

        return res.status(200).json(mapBranchRow(branch));
    } catch (err) {
        console.error('💥 Error fetching branch:', err);
        next(err);
    }
};

/**
 * Create a new branch
 * POST /api/branches
 */
exports.createBranch = async (req, res, next) => {
    try {
        const { id, name, isMain, hasBar, phone, address, openingHours, description } = req.body;

        if (!id || !name) {
            return res.status(400).json({ error: 'Missing core branch properties (id, name).' });
        }

        const existing = await pool('branches').where({ id: id.trim() }).first();
        if (existing) {
            return res.status(409).json({ error: 'A branch with this id already exists.' });
        }

        const branchData = {
            id: id.trim(),
            name: name.trim(),
            is_main: !!isMain,
            has_bar: !!hasBar,
            phone: phone ? phone.trim() : null,
            address: address ? address.trim() : null,
            opening_hours: openingHours ? openingHours.trim() : null,
            description: description ? description.trim() : null
        };

        await pool('branches').insert(branchData);
        const newBranch = await pool('branches').where({ id: branchData.id }).first();

        return res.status(201).json({
            message: 'Branch created successfully.',
            branch: mapBranchRow(newBranch)
        });
    } catch (err) {
        console.error('💥 Error creating branch:', err);
        next(err);
    }
};

/**
 * Update an existing branch
 * PUT /api/branches/:id
 */
exports.updateBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, isMain, hasBar, phone, address, openingHours, description } = req.body;

        const existing = await pool('branches').where({ id }).first();
        if (!existing) {
            return res.status(404).json({ error: 'Branch not found.' });
        }

        await pool('branches')
            .where({ id })
            .update({
                name: name !== undefined ? name.trim() : existing.name,
                is_main: isMain !== undefined ? !!isMain : existing.is_main,
                has_bar: hasBar !== undefined ? !!hasBar : existing.has_bar,
                phone: phone !== undefined ? phone.trim() : existing.phone,
                address: address !== undefined ? address.trim() : existing.address,
                opening_hours: openingHours !== undefined ? openingHours.trim() : existing.opening_hours,
                description: description !== undefined ? description.trim() : existing.description,
                updated_at: pool.fn.now()
            });

        const updated = await pool('branches').where({ id }).first();
        return res.status(200).json({
            message: 'Branch updated successfully.',
            branch: mapBranchRow(updated)
        });
    } catch (err) {
        console.error('💥 Error updating branch:', err);
        next(err);
    }
};

/**
 * Delete a branch
 * DELETE /api/branches/:id
 *
 * Blocked (409) if any reservations or orders still reference the branch,
 * since branch_id is a NOT NULL foreign key on both tables (ON DELETE
 * RESTRICT) — this gives a clean API error instead of a raw DB constraint
 * error bubbling up.
 */
exports.deleteBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existing = await pool('branches').where({ id }).first();

        if (!existing) {
            return res.status(404).json({ error: 'Branch not found.' });
        }

        const [reservationCount, orderCount] = await Promise.all([
            pool('reservations').where({ branch_id: id }).count('id as count').first(),
            pool('orders').where({ branch_id: id }).count('id as count').first()
        ]);

        if (Number(reservationCount.count) > 0 || Number(orderCount.count) > 0) {
            return res.status(409).json({
                error: 'Cannot delete a branch that has existing reservations or orders.'
            });
        }

        await pool('branches').where({ id }).del();

        return res.status(200).json({
            message: 'Branch deleted successfully.',
            branch: mapBranchRow(existing)
        });
    } catch (err) {
        console.error('💥 Error deleting branch:', err);
        next(err);
    }
};
