Package.describe({
    name: 'cesarve:auto-table',
    version: '0.0.1',
    summary: 'Create paginate list of records in minutes',
    git: 'https://github.com/cesarve77/auto-table',
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.4.2');
    api.use(['ecmascript','underscore','check']);
    api.use(['templating', 'cesarve:persistent-reactive-var','webtempest:animate','reactive-var'], 'client');
    api.use(['tmeasday:publish-counts','kadira:flow-router'], ['client', 'server'], {weak: true})
    api.use(['aldeed:autoform','aldeed:simple-schema'], ['client'], {weak: true})
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
