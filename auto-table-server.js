import './auto-table'
import {AutoTable} from "./auto-table"
import {_} from 'meteor/underscore'


Meteor.publish('atPubSub', function (id, limit, query, sort) {
    Meteor._sleepForMs(700 * Meteor.isDevelopment)
    const autoTable = AutoTable.getInstance(id)
    let fields = _.pluck(autoTable.fields, 'key')
    fields=_.map(fields,(field)=>{
        //todo remove this, when $ field operator restricion have been removed
        // see https://docs.meteor.com/api/collections.html#fieldspecifiers
        return field.split('.')[0]
    })
    fields = _.object(fields, new Array(fields.length).fill(true))
    if (autoTable.settings.options.showing) {
        let Counts = Package['tmeasday:publish-counts']
        if (!Counts) throw new Error
        Counts=Counts.Counts
        Counts.publish(this, 'atCounter', autoTable.collection.find(query, {limit, sort}), {noReady: true});
    }
    return autoTable.collection.find(query, {fields, sort, limit})
})