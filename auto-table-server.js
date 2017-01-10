import './auto-table'
import {AutoTable} from "./auto-table"
import {_} from 'lodash'
import json2csv from 'json2csv'

export class Exporter {
    constructor(userId) {
        this.export = {}
        this.userId = userId

    }

    added(collection, _id, doc) {
        if (collection != 'counts') {
            this.export[collection] = this.export[collection] || []
            this.export[collection].push(doc)
        }
    }

    changed(collection, _id, doc) {
    }

    removed(collection, _id) {
    }

    ready() {

    }

    onStop(cb) {
        cb()
    }

    get() {
        return this.export
    }

}
Meteor.methods({
    'autoTable.export': function (id, query, sort, columns) {
        const userId = this

        const autoTable = AutoTable.getInstance(id)
        //exportFamilies: function (query, order, columns) {
        this.unblock()
        if (!Roles.userIsInRole(this.userId, 'admin')) {
            throw new Meteor.Error(403, 'Access forbidden', 'Only admin can export data base')
        }
        let fields = _.map(autoTable.columns, 'key')
        const publishExtraFields = autoTable.publishExtraFields || []
        fields = fields.concat(publishExtraFields)
        fields = _.map(fields, (field) => {
            //todo remove this, when $ field operator restricion have been removed
            // see https://docs.meteor.com/api/collections.html#fieldspecifiers
            return field.split('.')[0]
        })
        fields = _.zipObject(fields, _.fill(Array(fields.length), true))
        if (!_.isEmpty(autoTable.query)) {
            const autoTableQuery = _.cloneDeep(autoTable.query)
            query = _.defaultsDeep(autoTableQuery, query)
        }
        const exporter = new Exporter(this.userId)
        const publication = autoTable.publish.call(exporter, id, 9999, query, sort)

        if (publication === false) {
            throw new Meteor.Error(403, 'Access deny')

        }
        let allData = []
        if (publication !== true) {
            const dataObj = exporter.get()
            for (const key in dataObj) {
                allData = allData.concat(dataObj[key])
            }
        } else {
            allData = autoTable.collection.find(query, {fields, sort}).fetch()
        }
        //apply render function
        //and data onñy ewill be contain columns key
        const data = []
        for (let i in allData) {
            const obj = {}
            for (const column of columns) {
                const atColumn = _.find(autoTable.columns, {key: column.key})// find the same colum in the autotable declarion for get the render function (that is not in passed columns)
                if (typeof atColumn.render == 'function') {
                    let val = atColumn.render.call(allData[i], _.get(allData[i], column.key))
                    if (typeof val == 'string') {

                        val = val.replace(/<(?:.|\n)*?>/gm, ' ');
                    }

                    _.set(obj, column.key, val)
                } else {
                    _.set(obj, column.key, _.get(allData[i], column.key))
                }
            }
            data.push(obj)
        }
        const fieldsCsv = [];
        for (let i in columns) {
            fieldsCsv.push({
                label: columns[i].label,
                value: columns[i].key, // data.path.to.something
                default: '',

            })
        }
        return json2csv({data: data, fields: fieldsCsv});

    }
})

Meteor.publish('atPubSub', function (id, limit, query = {}, sort = {}) {
    if (Meteor.isDevelopment) console.log('atPubSub', id, query)
    let time = new Date().getTime()
    check(id, String)
    check(limit, Number)
    check(query, Object)
    check(sort, Object)

    const autoTable = AutoTable.getInstance(id)
    if (!autoTable) {
        console.error('Can\'t find AutoTable instance for id ' + id + ', be sure you declare the instance in a share code (client and server side)')
        throw new Meteor.Error('Can\'t find AutoTable instance, be sure you declare the instance in a share code (client and server side)')
    }
    let fields = _.map(autoTable.columns, 'key')
    const publishExtraFields = autoTable.publishExtraFields || []
    fields = fields.concat(publishExtraFields)
    fields = _.map(fields, (field) => {
        //todo remove this, when $ field operator restricion have been removed
        // see https://docs.meteor.com/api/collections.html#fieldspecifiers
        return field.split('.')[0]
    })
    fields = _.zipObject(fields, _.fill(Array(fields.length), true))
    if (!_.isEmpty(autoTable.query)) {
        const autoTableQuery = _.cloneDeep(autoTable.query)
        query = _.defaultsDeep(autoTableQuery, query)
    }
    const publication = autoTable.publish.call(this, id, limit, query, sort)
    if (publication === false) {
        //user not allow to this publication
        return this.ready()
    }
    if (publication !== true) {
        //low level publication
        return publication
    }
    //default publication [cursor]
    if (autoTable.settings.options.showing) {

        let Counts = Package['tmeasday:publish-counts']
        if (!Counts) throw new Meteor.Error('Please install tmeasday:publish-counts pacage for use showing option')
        Counts = Counts.Counts
        Counts.publish(this, 'atCounter' + id, autoTable.collection.find(query, {limit, sort}), {noReady: true});
    }
    const cursor = autoTable.collection.find(query, {fields, sort, limit})
    let publications = [cursor]
    if (typeof autoTable.publishExtraCollection == 'function') {
        publications = publications.concat(autoTable.publishExtraCollection.call(this, cursor))
    }
    return publications

})