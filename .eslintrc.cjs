// eslint-disable-next-line no-undef
module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
	],
	env: {
		browser: true,
		node: true,
	},
	rules: {
		'indent': ['error', 'tab', { SwitchCase: 1 }],
		'quotes': ['error', 'single', { allowTemplateLiterals: true }],
		'semi': ['error', 'always'],
		'comma-dangle': ['warn', 'always-multiline'],
		'no-console': ['warn'],
		'no-unused-vars': ['warn'],
		'space-before-function-paren': ['error', {
			'anonymous': 'never',
			'named': 'never',
			'asyncArrow': 'always',
		}],
	},
};
