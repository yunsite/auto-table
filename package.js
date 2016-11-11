Package.describe({
    name: 'cesarve:auto-table',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.4.2');
    api.use(['ecmascript','underscore']);
    api.use(['templating', 'cesarve:persistent-reactive-var','webtempest:animate','reactive-var'], 'client');
    api.use(['tmeasday:publish-counts','kadira:flow-router'], ['client', 'server'], {weak: true})
    api.mainModule('auto-table-client.js', 'client');
    api.mainModule('auto-table-server.js', 'server');
    api.mainModule('auto-table.js');
});

Package.onTest(function (api) {
    api.use('ecmascript');
    api.use('tinytest');
    api.use('cesarve:auto-table');
    api.mainModule('auto-table-tests.js');
});
