// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('Hello World worker', () => {
	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('http://localhost:8787/hello');
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});
});


