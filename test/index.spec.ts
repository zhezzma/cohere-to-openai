// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request as unknown as {
	new (input: RequestInfo, init?: RequestInit): Request;
};

describe('Cohere to OpenAI worker', () => {
	it('responds with Cohere to OpenAI! (unit style)', async () => {
		const request = new IncomingRequest('http://localhost:8787');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`Cohere to OpenAI`);
	});

	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('http://localhost:8787/hello');
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});
});
