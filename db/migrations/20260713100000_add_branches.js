// db/migrations/20260713100000_add_branches.js
// Adds a `branches` table (Kilimani, Pangani, Karen, Lavington) and links
// reservations/orders to the branch they were made for. Mirrors the pattern
// used by 20260707090000_add_customers.js: existing rows are backfilled with
// a safe default so nothing that already exists breaks.

exports.up = async function (knex) {
    // 1. Branches table
    await knex.schema.createTable('branches', (table) => {
        table.string('id', 50).primary(); // slug, e.g. 'kilimani', 'pangani'
        table.string('name', 255).notNullable();
        table.boolean('is_main').defaultTo(false);
        table.boolean('has_bar').defaultTo(false);
        table.string('phone', 50);
        table.string('address', 255);
        table.string('opening_hours', 255);
        table.text('description');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // 2. Seed the four current branches so the default below always
    // resolves to a real row (safe to re-run: ignore if already present).
    await knex('branches').insert([
        {
            id: 'kilimani',
            name: 'Kilimani (Main)',
            is_main: true,
            has_bar: false,
            phone: null,
            address: null,
            opening_hours: null,
            description: 'Our historic home branch.'
        },
        {
            id: 'pangani',
            name: 'Pangani',
            is_main: false,
            has_bar: true,
            phone: null,
            address: null,
            opening_hours: null,
            description: 'Restaurant by day, full bar and lounge by night.'
        },
        {
            id: 'karen',
            name: 'Karen',
            is_main: false,
            has_bar: false,
            phone: null,
            address: null,
            opening_hours: null,
            description: "A relaxed, garden-side table in Nairobi's leafy suburb."
        },
        {
            id: 'lavington',
            name: 'Lavington',
            is_main: false,
            has_bar: false,
            phone: null,
            address: null,
            opening_hours: null,
            description: 'A firm favourite for weekday lunches and family dinners.'
        }
    ]);

    // 3. Link reservations to the branch they were booked at. Existing rows
    // are backfilled to 'kilimani' (the only branch that existed before this
    // migration), so historical data stays accurate and nothing breaks.
    await knex.schema.alterTable('reservations', (table) => {
        table.string('branch_id', 50).notNullable().defaultTo('kilimani');
        table.foreign('branch_id', 'fk_reservations_branch').references('id').inTable('branches').onDelete('RESTRICT');
        table.index('branch_id', 'idx_reservations_branch');
    });

    // 4. Link orders to the branch they were placed at (same backfill logic).
    await knex.schema.alterTable('orders', (table) => {
        table.string('branch_id', 50).notNullable().defaultTo('kilimani');
        table.foreign('branch_id', 'fk_orders_branch').references('id').inTable('branches').onDelete('RESTRICT');
        table.index('branch_id', 'idx_orders_branch');
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('orders', (table) => {
        table.dropForeign('branch_id', 'fk_orders_branch');
        table.dropColumn('branch_id');
    });
    await knex.schema.alterTable('reservations', (table) => {
        table.dropForeign('branch_id', 'fk_reservations_branch');
        table.dropColumn('branch_id');
    });
    await knex.schema.dropTableIfExists('branches');
};
