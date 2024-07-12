import process from "node:process";
import { execaCommand } from "execa";

export const exit = (message?: string): never => {
	if (message) {
		console.error(message);
	}

	process.exit(1);
};

const getUsername = async (command: string, service: string): Promise<string> => {
	const { all: output, exitCode } = await execaCommand(command, { reject: false, all: true });

	if (exitCode === 0) {
		return output;
	}

	return exit(`No ${service} username found!`);
};

export const githubUsername = async () => getUsername("git config user.name", "GitHub");
export const npmUsername = async () => getUsername("npm whoami", "NPM");
