import './auto-table'
import {AutoTable} from "./auto-table"
import {_} from 'meteor/underscore'

Meteor.publish('atPubSub', function (id, limit, query, sort) {
    Meteor._sleepForMs(700 * Meteor.isDevelopment)
    const autoTable = AutoTable.getInstance(id)
    let fields = _.pluck(autoTable.fields, 'id')
    fields = _.object(fields, new Array(fields.length).fill(1))

    console.log(Counts)
    if (autoTable.settings.options.showing) {
        const Counts = Package['tmeasday:publish-counts'].Counts
        Counts.publish(this, 'atCounter', autoTable.collection.find(query, {limit, sort}), {noReady: true});
    }
    return autoTable.collection.find(query, {fields, sort, limit})
})