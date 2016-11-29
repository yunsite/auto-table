/**
 * Created by cesar on 9/11/16.
 */
import {_} from 'lodash'


let SimpleSchema = {}


export class AutoTable {
    constructor({id, collection, columns, schema, query = {}, settings = {}, publish = () => true, link = () => '#', publishExtraFields = []}) {
        this.publishExtraFields = publishExtraFields
        if (!id) throw new Meteor.Error('id parameter is required')
        if (!collection) throw new Meteor.Error('collection parameter is required')

        if (Package['aldeed:simple-schema']) {
            SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema
            // this.schema = this.schema.pick(_.pluck(columns,'key'));
        }
        if (schema && !schema instanceof SimpleSchema) throw new Meteor.Error('schema parameter has to be a instance of SimpleSchema')
        if (collection && !collection instanceof Mongo.Collection) throw new Meteor.Error('collection parameter has to be a instance of Mongo.Collection')
        check(id, String)
        check(publish, Function)
        check(settings, Object)
        check(query, Object)
        this.id = id
        this.collection = collection
        this.schema = schema
        this.query = query
        this.link = link
        this.publish = publish
        const defaults = {
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
            klass: {
                hiddenFilter: 'small danger',
                filterInput: 'input-sm',
                filterWrapper: 'form-group',
                filterWrapperHasError: 'has-error',
                filterGroup: 'input-group-btn',
                filterOperatorButton: 'btn btn-default dropdown-toggle input-sm',
                filterOperatorList: 'dropdown-menu dropdown-menu-left operator',
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
                noRecordsWrapper: ' text-center noRecordsWrapper ',
                noRecords: 'noRecords'
            },
        }
            this.settings = _.defaultsDeep(_.clone(settings), defaults)
        if (!schema && this.settings.options.filters) throw new Meteor.Error('schema parameter is required when filter option is on')
        columns = _.map(columns, (column) => {
            if (!column.label && this.schema) {
                column.label = this.schema.label(column.key) || ''
            }
            if (!column.operator) {
                column.operator = '$regex'
            }
            return column
        })

        this.columns = columns
        check(columns, [{
            label: Match.Maybe(String),
            key: Match.Optional(String),
            template: Match.Optional(String),
            invisible: Match.Maybe(Boolean),
            operator: Match.Optional(Match.Where((operator) => {
                if (this.settings.options.filters) {
                    check(operator, String)
                }
                return true
            })),
            render: Match.Optional(Match.OneOf(Function,Object,String)),
            operators: Match.Optional([{
                label: String,
                shortLabel: String,
                operator: String,
            }])
        }])
        if (this.settings.options.showing && !Package['tmeasday:publish-counts']) throw new Meteor.Error('Missing package', 'To use showing option you need to install tmeasday:publish-counts package')
        if (this.settings.options.filters && !Package['aldeed:autoform']) throw new Meteor.Error('Missing package', 'To use filters option you need to install aldeed:autoform package')
        if (this.settings.options.columnsSort && Meteor.isClient && !$.ui && !$.ui.sortable) throw new Meteor.Error('Missing package', 'Columns sort option need Jquery UI sortable installed')

        AutoTable.instances = AutoTable.instances ? AutoTable.instances : []
        AutoTable.instances.push(this)
    }
}
AutoTable.getInstance = function (id) {
    return _.find(this.instances, {id})
}