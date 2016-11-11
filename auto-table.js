/**
 * Created by cesar on 9/11/16.
 */
import {_} from 'meteor/underscore'
export const deepObjectExtend = function(target, source) {
    for (var prop in source)
        if (prop in target)
            deepObjectExtend(target[prop], source[prop]);
        else
            target[prop] = source[prop];
    return target;
}

export class AutoTable {
    constructor(id, collection, fields, settings = {}) {
        if (!id) throw new Meteor.Error(400, 'Missing settings', 'AutoTable constructor id is required')
        if (!collection) throw new Meteor.Error(400, 'Missing settings', 'AutoTable constructor  collection  is required')
        if (!fields) throw new Meteor.Error(400, 'Missing settings', 'AutoTable constructor fields  is required')
        this.id = id
        this.collection = collection
        this.fields = fields
        this.settings = {
            options: {
                loadingTemplate: 'atLoading',
                columnsSort: true,
                columnsDisplay: true,
                showing: false,
            },
            msg: {
                columns: 'Columns',
                showMore: 'Show more', //accept html
                showing: 'Showing', //accept html
                from: 'from', //accept
                sort:{
                    asc: '<i class="glyphicon glyphicon-triangle-top"></i>', //accept html
                    desc: '<i class="glyphicon glyphicon-triangle-bottom"></i>' //accept html
                },
                noRecords: 'There is not families with this criteria'
            },
            Klass: {
                tableWrapper: 'table-responsive',
                table: 'table table-bordered table-condensed table-striped',
                link: '',
                drag: 'glyphicon glyphicon-resize-horizontal',
                transitionIn: 'fadeInLeftBig',
                transitionOut: 'fadeOutRightBig',
                showMore: 'btn btn-block btn-default',
                showingWrapper: 'row',
                showing: 'col-xs-12 text-right small',
                noRecordsWrapper: 'row text-center',
                noRecords: 'col-xs-12 col-sm-12 col-md-12 col-lg-12'
            },
        }
        this.settings = deepObjectExtend(settings,this.settings)
        console.log('***** this.settings this.settings this.settings', this.settings)
        AutoTable.instances = AutoTable.instances ? AutoTable.instances : []
        AutoTable.instances.push(this)
    }
}
AutoTable.getInstance = function (id) {
    return _.findWhere(this.instances, {id})
}
