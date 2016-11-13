/**
 * Created by cesar on 9/11/16.
 */
import {_} from 'meteor/underscore'
export const deepObjectExtend = function (target, source) {
    for (var prop in source)
        if (prop in target)
            deepObjectExtend(target[prop], source[prop]);
        else
            target[prop] = source[prop];
    return target;
}

let SimpleSchema = {}


export class AutoTable {
    constructor(id, collection, fields, schema, settings = {}) {
        check(id, String)
        check(collection, Mongo.Collection)

        this.schema = schema
        if (Package['aldeed:simple-schema']) {
            SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema
            // this.schema = this.schema.pick(_.pluck(fields,'key'));
        }
        check(schema, Match.Maybe(SimpleSchema))
        check(settings, Object)
        this.id = id
        this.collection = collection

        this.fields = fields
        this.settings = {
            options: {
                loadingTemplate: 'atLoading',
                columnsSort: false,
                columnsDisplay: false,
                showing: false,
                filters: false,
            },
            msg: {
                columns: 'Columns',
                showMore: 'Show more', //accept html
                showing: 'Showing', //accept html
                from: 'from', //accept
                sort: {
                    asc: '<i class="glyphicon glyphicon-triangle-top"></i>', //accept html
                    desc: '<i class="glyphicon glyphicon-triangle-bottom"></i>' //accept html
                },
                noRecords: 'There are not records',
                noRecordsCriteria: 'There are not records with this criteria',
                hiddenFilter: '(hidden filters)'
            },
            Klass: {
                hiddenFilter: 'small danger',
                tableWrapper: 'table-responsive',
                table: 'table table-bordered table-condensed table-striped',
                buttonColumnWrapper: ' btn-group at-checkbox-group pull-right margin-up-down',
                buttonColumn: 'btn btn-default dropdown-toggle',
                buttonColumnList: ' dropdown-menu',
                buttonColumnItem: '',
                buttonColumnLabel: '',
                link: '',
                transitionIn: 'fadeInLeftBig',
                transitionOut: 'fadeOutRightBig',
                showMore: 'btn btn-block btn-default',
                showingWrapper: 'row',
                showing: 'col-xs-12 text-right small',
                noRecordsWrapper: 'row text-center',
                noRecords: 'col-xs-12 col-sm-12 col-md-12 col-lg-12'
            },
        }
        this.settings = deepObjectExtend(settings, this.settings)
        if (this.settings.options.filters) {
            fields = _.map(fields, (field)=> {
                if (!field.operator) {
                    field.operator ='$regex'
                }
                return field
            })
        }
        check(fields, [{
            label: Match.Optional(String),
            key: String,
            invisible: Match.Maybe(Boolean),
            operator: Match.Where((operator)=> {
                if (this.settings.options.filters) {
                    check(operator, String)
                }
                return true
            }),
            operators: Match.Optional([{
                label: String,
                shortLabel: String,
                operator: String,
            }])
        }])
        if (this.settings.options.showing && !Package['tmeasday:publish-counts']) throw new Meteor.Error('Missing package', 'To use showing option you need to install tmeasday:publish-counts package')
        if (this.settings.options.filters && !Package['aldeed:autoform']) throw new Meteor.Error('Missing package', 'To use filters option you need to install aldeed:autoform package')
        if (this.settings.options.filters && !schema instanceof SimpleSchema) throw new Meteor.Error('Missing parameter', 'To use filters option you need set up schema parameter')
        if (this.settings.options.columnsSort && Meteor.isClient && !$.ui && !$.ui.sortable) throw new Meteor.Error('Missing package', 'Columns sort option need Jquery UI sortable installed')

        AutoTable.instances = AutoTable.instances ? AutoTable.instances : []
        AutoTable.instances.push(this)
    }
}
AutoTable.getInstance = function (id) {
    return _.findWhere(this.instances, {id})
}
