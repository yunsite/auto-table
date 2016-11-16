import './auto-table'
import {AutoTable} from "./auto-table"
import {_} from 'meteor/underscore'


Meteor.publish('atPubSub', function (id, limit, query={}, sort={}) {
    check(id,String)
    check(limit,Number)
    check(query,Object)
    check(sort,Object)
    Meteor._sleepForMs(400 * Meteor.isDevelopment)
    console.log('id',id)
    const autoTable = AutoTable.getInstance(id)
    if (!autoTable) throw new Meteor.Error ('Can\'t find AutoTable instance, be sure you declare the instance in a share code (client and server side)')
    let fields = _.pluck(autoTable.columns, 'key')
    console.log(fields)
    fields=_.map(fields,(field)=>{
        //todo remove this, when $ field operator restricion have been removed
        // see https://docs.meteor.com/api/collections.html#fieldspecifiers
        return field.split('.')[0]
    })
    fields = _.object(fields, new Array(fields.length).fill(true))
    console.log(query)

    if (!_.isEmpty(autoTable.query)){
        query={$and:[query,autoTable.query]}
    }
    if (!autoTable.publish.call(this)){
        return this.ready()
    }
    if (autoTable.settings.options.showing) {
        let Counts = Package['tmeasday:publish-counts']
        if (!Counts) throw new Error
        Counts=Counts.Counts
        Counts.publish(this, 'atCounter', autoTable.collection.find(query, {limit, sort}), {noReady: true});
    }
    console.log(query)

    return autoTable.collection.find(query, {fields, sort, limit})
})