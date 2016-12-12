import './auto-table'
import {AutoTable} from "./auto-table"
import {_} from 'lodash'


Meteor.publish('atPubSub', function (id, limit, query = {}, sort = {}) {
    let time = new Date().getTime()
    check(id, String)
    check(limit, Number)
    check(query, Object)
    check(sort, Object)
    const autoTable = AutoTable.getInstance(id)
    if (!autoTable) {
        console.error('Can\'t find AutoTable instance, be sure you declare the instance in a share code (client and server side)')
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
        query = _.defaultsDeep(_.clone(autoTable.query), query)
    }

    if (!autoTable.publish.call(this)) {
        return this.ready()
    }
    if (autoTable.settings.options.showing) {

        let Counts = Package['tmeasday:publish-counts']
        if (!Counts) throw new Meteor.Error('Please install tmeasday:publish-counts pacage for use showing option')
        Counts = Counts.Counts
        Counts.publish(this, 'atCounter' + id, autoTable.collection.find(query, {limit, sort}), {noReady: true});
    }
    const cursor=autoTable.collection.find(query, {fields, sort, limit})
    let publications = [cursor]
    if (typeof autoTable.publishExtraCollection == 'function'){
        publications=publications.concat(autoTable.publishExtraCollection.call(this,cursor))
    }
    return publications
})