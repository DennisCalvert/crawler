
const domain = 'www.example.com'; 

// Define this if the site is using another 
// URL for static assets such as images
const targetImageHost = undefined;

module.exports = {

	target: {
		domain: domain,
		imageHost: targetImageHost || domain
	},

	azureStorage: {
		accountName: 'AZURE_STORAGE_ACCOUNT_NAME',
		accountKey: 'AZURE_STORAGE_ACCOUNT_KEY',
		containerName: 'AZURE_STORAGE_CONTAINER_NAME'
	},

	redis: {
		host: 'REDIS_HOST',
		authKey: 'REDIS_KEY',
		port: 6379
	}
};