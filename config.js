const domain = process.env.TARGET_DOMAIN;
// Define this if the site is using another 
// URL for static assets such as images
const targetImageHost = undefined;

module.exports = {

	target: {
		domain: domain,
		imageHost: targetImageHost || domain
	},

	azureStorage: {
		accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
		accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
		containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
	},

	redis: {
		host: process.env.REDIS_HOST,
		authKey: process.env.REDIS_AUTHKEY,
		port: process.env.REDIS_PORT
	},

	promiseConcurrency: process.env.PROMISE_CONCURRENCY
};;