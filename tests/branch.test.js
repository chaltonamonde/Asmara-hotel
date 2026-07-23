const request = require('supertest');
const app = require('../server');

// Mock Knex query builder (same shape used by the other test suites)
jest.mock('../db/db', () => {
    const mockKnex = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn()
    };
    const mockDb = jest.fn(() => mockKnex);
    mockDb.fn = {
        now: jest.fn(() => 'MOCK_NOW')
    };
    return mockDb;
});

const pool = require('../db/db');

describe('GET /api/branches', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all branches with the main branch first', async () => {
        const mockBranches = [
            { id: 'kilimani', name: 'Kilimani (Main)', is_main: true, has_bar: false, phone: null, address: null, opening_hours: null, description: 'Our historic home branch.' },
            { id: 'karen', name: 'Karen', is_main: false, has_bar: false, phone: null, address: null, opening_hours: null, description: null }
        ];

        const mockKnex = pool();
        mockKnex.orderBy
            .mockReturnValueOnce(mockKnex)
            .mockReturnValueOnce(Promise.resolve(mockBranches));

        const res = await request(app).get('/api/branches');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toMatchObject({ id: 'kilimani', isMain: true });
        expect(pool).toHaveBeenCalledWith('branches');
    });
});

describe('GET /api/branches/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a single branch', async () => {
        const mockBranch = { id: 'pangani', name: 'Pangani', is_main: false, has_bar: true, phone: null, address: null, opening_hours: null, description: 'Restaurant by day, full bar by night.' };
        const mockKnex = pool();
        mockKnex.first.mockResolvedValueOnce(mockBranch);

        const res = await request(app).get('/api/branches/pangani');

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ id: 'pangani', hasBar: true });
    });

    it('should return 404 for an unknown branch', async () => {
        const mockKnex = pool();
        mockKnex.first.mockResolvedValueOnce(undefined);

        const res = await request(app).get('/api/branches/does-not-exist');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Branch not found.');
    });
});

describe('POST /api/branches (admin only)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject creating a branch without an auth token', async () => {
        const res = await request(app)
            .post('/api/branches')
            .send({ id: 'westlands', name: 'Westlands' });

        expect(res.statusCode).toBe(401);
        expect(pool).not.toHaveBeenCalled();
    });
});
