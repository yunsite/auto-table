/**
 * Created by cesar on 9/11/16.
 */
import {_} from 'lodash'
import {ReactiveVar} from 'meteor/reactive-var'

let SimpleSchema = {}


export class AutoTable {
    constructor({id, collection, columns, schema, query = {}, settings = {}, publish = () => true, link = () => '#', publishExtraFields = [], publishExtraCollection}) {
        this.publishExtraFields = publishExtraFields
        this.publishExtraCollection = publishExtraCollection
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
        this.subsReadyVar = new ReactiveVar(false)
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
                buttons: [],
                export: false,
                settings: true,
                affix: true,
            },
            xls: {
                firstRows: [[]],
                pageSetup: {
                    orientation: 'landscape',
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 1,
                    margins: {
                        left: 0.3, right: 0.3,
                        top: 0.3, bottom: 0.3,
                        header: 0.0, footer: 0.0
                    },
                },
                lastRows: [[]],
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
                hiddenFilter: '(hidden filters)',
                export: 'Export',
                exportFile: 'file',
                settings: 'Settings',
                clearFilter: 'Clear filter'
            },
            klass: {
                hiddenFilter: 'small warning',
                filterInput: 'input-sm',
                filterWrapper: 'form-group',
                filterWrapperHasError: 'has-error',
                filterGroup: 'input-group-btn',
                filterOperatorButton: 'btn btn-default dropdown-toggle input-sm',
                filterOperatorList: 'dropdown-menu dropdown-menu-left operator',
                tableWrapper: 'table-responsive',
                table: 'table table-bordered table-condensed table-striped',
                buttonColumnWrapper2: ' btn-group at-checkbox-group pull-right margin-up-down',
                buttonColumnWrapper1: ' btn-group at-checkbox-group pull-left margin-up-down',
                buttonClearFilter: 'btn btn-warning ',
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
                noRecords: 'noRecords',
                buttonExport: 'btn btn-default',
                exportSpinner: 'fa fa-spinner fa-spin fa-fw',
                buttonSettings: 'btn btn-default dropdown-toggle ',
            },
        }
        this.settings = _.defaultsDeep(_.clone(settings), defaults)


        if (!schema && this.settings.options.filters) throw new Meteor.Error('schema parameter is required when filter option is on')
        columns = _.map(columns, (column) => {
            if (!column.label && this.schema) {
                column.label = (this.schema && this.schema.label(column.key)) || ''
            }
            if (!column.operator) {
                column.operator = null
            }
            return column
        })

        this.columns = columns
        try {
            check(columns, [{
                label: Match.Maybe(String),
                key: Match.Optional(String),
                template: Match.Optional(String),
                templateData: Match.Optional(Function),
                invisible: Match.Maybe(Boolean),
                operator: Match.Optional(Match.OneOf(String, null)),
                render: Match.Optional(Match.OneOf(Function, Object, String)),
                operators: Match.Optional([{
                    label: String,
                    shortLabel: String,
                    operator: String,
                    options: Match.Optional(Array)
                }])
            }])
        } catch (e) {
            console.error(e)
            console.log(id)
            console.log(columns)
        }

        if (this.settings.options.export && !Package['aldeed:simple-schema']) throw new Meteor.Error('Missing package', 'To use export option you need to install aldeed:simple-schema package')
        if (this.settings.options.showing && !Package['tmeasday:publish-counts']) throw new Meteor.Error('Missing package', 'To use showing option you need to install tmeasday:publish-counts package')
        if (this.settings.options.filters && !Package['aldeed:autoform']) throw new Meteor.Error('Missing package', 'To use filters option you need to install aldeed:autoform package')
        if (this.settings.options.filters && !Package['aldeed:simple-schema']) throw new Meteor.Error('Missing package', 'To use filters option you need to install aldeed:simple-schema package')
        if (this.settings.options.columnsSort && Meteor.isClient && !$.ui && !$.ui.sortable) throw new Meteor.Error('Missing package', 'Columns sort option need Jquery UI sortable installed')

        AutoTable.instances = AutoTable.instances ? AutoTable.instances : []
        AutoTable.instances.push(this)

    }

    setSubscriptionReady(value) {
        this.subsReadyVar.set(value)
    }

    subscriptionReady() {
        return this.subsReadyVar.get()
    }
}
AutoTable.getInstance = function (id) {
    return _.find(this.instances, {id})
}
AutoTable.collection = new Mongo.Collection('atSettings')

Meteor.methods({
    settingNew(atId, name, columns){
        check(atId, String)
        check(name, String)
        check(columns, [Object])
        const userId = this.userId
        if (!userId) throw new Meteor.Error('403', 'You must to be logged')
        return AutoTable.collection.insert({atId, userId, name, columns})
    },
    settingsRemove(_id){
        check(_id, String)
        const userId = this.userId
        if (!userId) throw new Meteor.Error('403', 'You must to be logged')
        return AutoTable.collection.remove({_id, userId})
    },
    settingUpdate(_id, columns){
        check(_id, String)
        check(columns, [Object])
        const userId = this.userId
        if (!userId) throw new Meteor.Error('403', 'You must to be logged')
        return AutoTable.collection.update(_id, {$set: {columns}})
    },
    settingsDefault(_id){
        check(_id, String)
        let userId = this.userId
        if (!Roles.userIsInRole(userId, 'admin')) throw new Meteor.Error('403', 'You must have administrator level')
        const settings = AutoTable.collection.findOne(_id)
        if (settings.userId) userId = null //toggle userId
        return AutoTable.collection.update(_id, {$set: {userId}})
    },
})