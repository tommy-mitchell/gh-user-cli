import process from "node:process";
import anyTest, { type TestFn } from "ava";
import { Semaphore, type Permit } from "@shopify/semaphore";
import { execa } from "execa";
import { getBinPath } from "get-bin-path";
import { isExecutable } from "is-executable";
import { isCI } from "ci-info";

const test = anyTest as TestFn<{
	binPath: string;
	permit: Permit;
}>;

test.before("setup context", async t => {
	const binPath = await getBinPath();
	t.truthy(binPath, "No bin path found!");

	t.context.binPath = binPath!.replace("dist", "src").replace(".js", ".ts");
	t.true(await isExecutable(t.context.binPath), "Source binary not executable!");
});

// https://github.com/avajs/ava/discussions/3177
const semaphore = new Semaphore(Number(process.env["concurrency"]) || 5);

test.beforeEach("setup concurrency", async t => {
	t.context.permit = await semaphore.acquire();
});

test.afterEach.always(async t => {
	await t.context.permit.release();
});

// Tests only check that opening doesn't return an error, not that the correct page was opened.
// These have to be manually verified.

const testCli = test.macro(async (t, args: string[]) => {
	await t.notThrowsAsync(execa(t.context.binPath, args));
});

if (!isCI) {
	test("opens github - current user", testCli, []);
}

test("opens github - named user", testCli, ["tommy-mitchell"]);
test("opens github - multiple users", testCli, ["sindresorhus", "fregante"]);

for (const flag of ["--npm", "-n"]) {
	if (!isCI) {
		test(`opens npm (${flag}) - current user`, testCli, [flag]);
	}

	test(`opens npm (${flag}) - named user`, testCli, [flag, "tommy-mitchell"]);
	test(`opens npm (${flag}) - multiple users`, testCli, [flag, "sindresorhus", "fregante"]);
}
