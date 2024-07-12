import anyTest, { type TestFn } from "ava";
import { execa } from "execa";
import { getExecutableBinPath } from "get-executable-bin-path";

const test = anyTest as TestFn<{
	binPath: string;
}>;

test.before("setup context", async t => {
	t.context.binPath = await getExecutableBinPath();
});

for (const flag of ["--help", "-h"]) {
	test(`shows help (${flag})`, async t => {
		const { stdout: helpText } = await execa(t.context.binPath, [flag]);
		t.snapshot(helpText);
	});
}
