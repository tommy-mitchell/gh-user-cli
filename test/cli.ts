import anyTest, { type TestFn } from "ava";
import { execa } from "execa";
import { getBinPath } from "get-bin-path";
import { isExecutable } from "is-executable";

const test = anyTest as TestFn<{
	binPath: string;
}>;

test.before("setup context", async t => {
	const binPath = await getBinPath();
	t.truthy(binPath, "No bin path found!");

	t.context.binPath = binPath!.replace("dist", "src").replace(".js", ".ts");
	t.true(await isExecutable(t.context.binPath), "Source binary not executable!");
});

for (const flag of ["--help", "-h"]) {
	test(`shows help - ${flag} flag`, async t => {
		const { stdout: helpText } = await execa(t.context.binPath, [flag]);
		t.snapshot(helpText);
	});
}
