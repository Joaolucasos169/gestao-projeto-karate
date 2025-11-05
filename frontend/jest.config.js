module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  roots: ['<rootDir>/tests'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Relatório de Testes - Frontend Karate',
        outputPath: 'report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        theme: 'darkTheme',
      },
    ],
  ],
};
