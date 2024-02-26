import type { RequireExactlyOne as OneOf, RequireOneOrNone as OneOrNoneOf } from "type-fest";
import test from "ava";
import esmock from "esmock";
import { execaCommand } from "execa";

class ProcessExitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ProcessExitError";
	}
}

type MacroArgs = [{
	args: string[];
} & OneOf<{
	expected: Array<string | RegExp>;
	errorMessage: string;
}> & OneOrNoneOf<{
	githubUser: string;
	npmUser: string;
}>];

const verifyCli = test.macro<MacroArgs>(async (t, { args, expected: expectations = [], errorMessage, githubUser = "", npmUser = "" }) => {
	try {
		await esmock("../src/cli.ts", import.meta.url, {
			open: (url: string) => {
				const expected = expectations.shift();

				if (expected === undefined) {
					t.fail("Missing expectation!");
				} else if (typeof expected === "string") {
					t.is(url, expected);
				} else {
					t.regex(url, expected);
				}
			},
		}, {
			"node:process": { // eslint-disable-line @typescript-eslint/naming-convention
				argv: ["", "", ...args],
				exit: () => {
					throw new ProcessExitError("");
				},
			},
			execa: {
				execaCommand: async (command: string) => {
					if (command === "git config user.name") {
						return {
							all: githubUser,
							exitCode: githubUser ? 0 : 1,
						};
					}

					if (command === "npm whoami") {
						return {
							all: npmUser,
							exitCode: npmUser ? 0 : 1,
						};
					}

					return execaCommand(command, { reject: false, all: true });
				},
			},
			import: { "console": { error: (message: string) => {
				if (errorMessage) {
					t.is(message, errorMessage);
				} else {
					t.fail("Expected an error message!");
				}
			} } },
		});
	} catch (error: unknown) {
		if (!(error instanceof ProcessExitError)) {
			throw error;
		}
	}
});

test("opens github - current user", verifyCli, {
	args: [],
	githubUser: "tommy-mitchell",
	expected: ["https://github.com/tommy-mitchell"],
});

test("opens github - named user", verifyCli, {
	args: ["tommy-mitchell"],
	expected: ["https://github.com/tommy-mitchell"],
});

test("opens github - multiple users", verifyCli, {
	args: ["sindresorhus", "fregante"],
	expected: [
		"https://github.com/sindresorhus",
		"https://github.com/fregante",
	],
});

test("github - fails if current user not found", verifyCli, {
	args: [],
	errorMessage: "No GitHub username found!",
});

for (const flag of ["--npm", "-n"]) {
	test(`opens npm (${flag}) - current user`, verifyCli, {
		args: [flag],
		npmUser: "tommy-mitchell",
		expected: ["https://www.npmjs.com/~tommy-mitchell"],
	});

	test(`opens npm (${flag}) - named user`, verifyCli, {
		args: [flag, "tommy-mitchell"],
		expected: ["https://www.npmjs.com/~tommy-mitchell"],
	});

	test(`opens npm (${flag}) - multiple users`, verifyCli, {
		args: [flag, "sindresorhus", "fregante"],
		expected: [
			"https://www.npmjs.com/~sindresorhus",
			"https://www.npmjs.com/~fregante",
		],
	});

	test(`npm (${flag}) - fails if current user not found`, verifyCli, {
		args: [flag],
		errorMessage: "No NPM username found!",
	});
}
