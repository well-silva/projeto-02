import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { execSync } from 'child_process';

describe('Transactions routes', () => {
	beforeAll(async () => {
		await app.ready();
	});
	
	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		execSync('npm run knex migrate:rollback --all');
		execSync('npm run knex migrate:latest');
	});

	it('should be able to create a new transaction', async () => {
		await request(app.server)
			.post('/transactions')
			.send({
				title: 'Salário',
				amount: 3000,
				type: 'credit',
			})
			.expect(201);
	});

	it('should be able to list all transactions', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'Salário',
				amount: 3000,
				type: 'credit',
			});

		const cookies = createTransactionResponse.headers['set-cookie'];
			
		const listTransactionResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies);

		expect(listTransactionResponse.body.transactions).toEqual([
			expect.objectContaining({
				title: 'Salário',
				amount: 3000,
			})
		]);
	});

	it('should be able to get a specific transaction', async () => {
		const createTransactionResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'Salário',
				amount: 3000,
				type: 'credit',
			});

		const cookies = createTransactionResponse.headers['set-cookie'];
			
		const listTransactionResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies);

		const transactionId = listTransactionResponse.body.transactions[0].id;

		const getTransactionResponse = await request(app.server)
			.get(`/transactions/${transactionId}`)
			.set('Cookie', cookies);

		expect(getTransactionResponse.body.transaction).toEqual(
			expect.objectContaining({
				title: 'Salário',
				amount: 3000,
			})
		);
	});

	it('should be able to get summary', async () => {
		const createTransactionCreditResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'Salário',
				amount: 3000,
				type: 'credit',
			});

		const cookie = createTransactionCreditResponse.headers['set-cookie'];

		await request(app.server)
			.post('/transactions')
			.set('Cookie', cookie)
			.send({
				title: 'Aluguel',
				amount: 1000,
				type: 'debit',
			});

		const cookies = createTransactionCreditResponse.headers['set-cookie'];

		const summaryResponse = await request(app.server)
			.get('/transactions/summary')
			.set('Cookie', cookies)
			.expect(200);

		expect(summaryResponse.body.summary).toEqual({
			amount: 2000,
		});
	});
});
