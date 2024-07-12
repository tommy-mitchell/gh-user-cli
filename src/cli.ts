#!/usr/bin/env tsimp
import meow from "meow";
import open from "open";
import { githubUsername, npmUsername } from "./helpers.js";

// dprint-ignore
const cli = meow(`
	Usage
	  $ gh-user [name] […]

	Options
	  --npm  -n  Open the NPM profile of the given or current user

	Examples
	  $ gh-user tommy-mitchell sindresorhus
	  $ gh-user -n
`, {
	importMeta: import.meta,
	description: false,
	flags: {
		help: {
			type: "boolean",
			shortFlag: "h",
		},
		npm: {
			type: "boolean",
			shortFlag: "n",
		},
	},
});

const { input, flags: { npm: openNpmProfile } } = cli;

const usernames = input.length > 0 ? input : [openNpmProfile ? await npmUsername() : await githubUsername()];

await Promise.all(usernames.map(async username => (
	openNpmProfile
		? open(`https://www.npmjs.com/~${username}`)
		: open(`https://github.com/${username}`)
)));
