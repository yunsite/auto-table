Package.describe({
    name: 'cesarve:auto-table',
    version: '0.1.0',
    summary: 'Create paginate list of records in minutes',
    git: 'https://github.com/cesarve77/auto-table',
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.4.2');
    api.use(['ecmascript','underscore','check']);
    api.use(['templating', 'cesarve:persistent-reactive-var','webtempest:animate','reactive-var'], 'client');
    api.use(['tmeasday:publish-counts'], ['client', 'server'], {weak: true})
    api.use(['aldeed:autoform','aldeed:simple-schema','cesarve:auto-import'], ['client'], {weak: true})
    api.mainModule('auto-table-client.js', 'client');
    api.mainModule('auto-table-server.js', 'server');
    api.mainModule('auto-table.js');
});

Npm.depends({
    'lodash':'4.17.2'
})