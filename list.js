import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {ReactiveVar} from "meteor/reactive-var"
import {AutoTable} from "./auto-table"
import {Template} from "meteor/templating"
import "./loading.css"
import "./auto-table.css"
import "./list.html"
import "./loading.html"
import "./filter"
import {_} from 'lodash'

const defaultLimit = 25

const areDifferents = function (coll1, coll2) {
    if (coll1.length != coll2.length)
        return true
    for (let i = 0; i < coll1.length; i++) {
        if (!_.isEqual(coll1[i], coll2[i])) {
            return true
        }
    }
    return false
}
Template.atTable.onCreated(function () {
    //todo set limit from data or settings
    if (!this.data.at) throw new Meteor.Error(400, 'Missing parameter', 'at parameter no present')
    if (!this.data.at instanceof AutoTable) throw new Meteor.Error(400, 'Wrong parameter', 'at parameter has to be  autoTable instance')
    this.autoTable = this.data.at
    this.showingMore = new ReactiveVar(false)
    const userId = typeof Meteor.userId === "function" ? Meteor.userId() || '' : ''
    this.sessionName = `${this.autoTable.id}${userId}`
    this.filters = new PersistentReactiveVar('filters' + this.sessionName, {})
    this.columns = new PersistentReactiveVar('columns' + this.sessionName, this.autoTable.columns)
    let storedColumns = _.map(this.columns.get(), (val) => _.pick(val, 'key', 'label', 'template', 'operator', 'operators'))
    let newColumns = _.map(this.autoTable.columns, (val) => _.pick(val, 'key', 'label', 'template', 'operator', 'operators'))
    newColumns = _.sortBy(newColumns, 'key')
    storedColumns = _.sortBy(storedColumns, 'key')
    if (areDifferents(storedColumns, newColumns)) {
        console.log('*******************************ARE DIFFERENTS*********************************', storedColumns, newColumns)
        this.columns.set(this.autoTable.columns)
    }
    this.limit = ReactiveVar(parseInt(this.data.limit || defaultLimit))
    this.query = new ReactiveVar({})
    this.filters = new ReactiveVar({})
    this.sort = new PersistentReactiveVar('sort' + this.sessionName, {});
    this.autorun(() => {
        const filters = this.autoTable.schema ? createFilter(this.columns.get(), this.autoTable.schema) : {}
        const customQuery = typeof this.data.customQuery=="function" ? this.data.customQuery() :  this.data.customQuery || {}
        const query = this.autoTable.query
        _.defaultsDeep(filters, customQuery)
        _.defaultsDeep(filters, query)
        this.query.set(filters)
        console.log('*****************************************************************customQuery list autotable',customQuery)
        //console.log('autorun queryToSend', filters)
        this.subscribe('atPubSub', this.autoTable.id, this.limit.get(), filters, this.sort.get(), {
            onReady: () => this.showingMore.set(false)
        })
    })

});
export const createFilter = function (columns, schema) {
    //columns has all information to create the filters
    //but has to be cleans (strings to dates for eg)
    // and has to be formated to selctor mongo
    const cleaned = {}
    for (const column of columns) {
        if (column.filter !== '' && column.filter !== null && column.filter !== undefined) {
            cleaned[column.key] = column.filter
        }
    }
    schema.clean(cleaned)
    const filters = {}
    for (let column of columns) {
        const selector = {}
        const val = cleaned[column.key]

        const operator = column.operator
        if (val !== '' && val !== null && val !== undefined) {
            selector[operator] = val
            if (operator == '$regex') selector['$options'] = 'gi'
            filters[column.key] = selector
        }
    }
    return filters
}
Template.atTable.onRendered(function () {
    let first = true
    if (this.autoTable.settings.options.columnsSort) {
        this.autorun(() => {
            if (this.subscriptionsReady() && first) {
                first = false
                let columns = this.columns.get()
                Meteor.setTimeout(() => {
                    const instance = this
                    this.$('.sortable').sortable({
                        cursor: 'ew-resize',
                        axis: 'x',
                        forceHelperSize: true,
                        forcePlaceholderSize: true,
                        helper: "clone",
                        revert: 300,
                        distance: 5,
                        delay: 100,
                        placeholder: "splaceholder",
                        update: function (event, ui) {
                            const keys = $(this).sortable("toArray")
                            columns = _.sortBy(columns, function (field) {
                                return keys.indexOf(field.key)
                            });
                            instance.columns.set(columns)
                            event.preventDefault()
                        },
                    }).disableSelection()
                });
            }
        });
    }

})

Template.atTable.onDestroyed(function () {
});


Template.atTable.helpers({
    link(row, key){
        return Template.instance().autoTable.link(row, key)
    },
    hiddenFilter(){

        return _.reduce(Template.instance().columns.get(), function (memo, field) {
                return memo + Number(!!field.invisible && !!field.filter)
            }, 0) > 0
    },
    filtered: () => !!_.isEmpty(Template.instance().filters.get()),
    atts: (field) => {
        if (!Template.instance().columns)
            return
        const instance = Template.instance();
        let columns = instance.columns.get()
        const total = columns.length
        const invisible = _.filter(columns, {invisible: true}).length;
        const atts = {}
        _.forEach(columns, (val) => {
            if (val.key == field.key) {
                if (total - invisible == 1 && !field.invisible) atts.disabled = true
                if (!field.invisible) atts.checked = true
            }
            atts.value = field.key
        })
        return atts
        //instance.columns.set(columns)
    },
    showingMore: () => Template.instance().showingMore.get(),
    columnsReactive: () => Template.instance().columns,
    settings: () => Template.instance().autoTable.settings,
    id: () => Template.instance().autoTable.id,
    isTemplate: function (template) {
        return (typeof template == 'string')
    },
    render: function (obj, column) {
        const render = _.find(Template.instance().autoTable.columns, {key: column.key}).render
        const path = column.key
        const val = path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : undefined
        }, obj || self)
        if (typeof render == 'function') {
            return render.call(obj, val, path)
        }
        if (typeof render == 'string') {
            return render
        }
        return val

    },
    columns: () =>  Template.instance().columns.get(),
    rows: () => {
        const instance = Template.instance()
        let query = instance.query.get() //
        console.log('local query',query)
        const cursor = instance.autoTable.collection.find(query, {
            sort: instance.sort.get(),
            limit: instance.limit.get(),
        })
        //console.log('rows',cursor.fetch())
        return cursor
    },
    showing: () => {
        const instance = Template.instance()
        const limit = instance.limit.get()
        const total = Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.autoTable.id)
        return limit < total ? limit : total
    },
    total: function () {
        const instance = Template.instance();
        if (instance.autoTable.settings.options.showing) {
            return Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.autoTable.id)
        }

    }
    ,
    showMore: function () {
        const instance = Template.instance();
        let query = instance.query.get()
        if (instance.autoTable.settings.options.showing) {
            return (instance.autoTable.collection.find(query, {
                sort: instance.sort.get(),
                limit: instance.limit.get(),
            }).count() < Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.autoTable.id))
        } else {
            return (instance.autoTable.collection.find(query, {
                sort: instance.sort.get(),
                limit: instance.limit.get(),
            }).count() === instance.limit.get())
        }
    }
    ,
    sort(sort)
    {
        const instance = Template.instance()
        const sortObj = instance.sort.get()
        if (_.isEmpty(sortObj)) return ''
        const sortKey = Object.keys(sortObj)[0];
        if (sort == sortKey) {
            if (sortObj[sortKey] > 0) {
                return instance.autoTable.settings.msg.sort.asc
            } else {
                return instance.autoTable.settings.msg.sort.desc
            }
        }
    }
})
;

Template.atTable.events({
    'change input[name="columns"]'(e, instance){
        let columns = instance.columns.get()
        const $input = $(e.currentTarget)
        const key = $input.val()
        //const number = $column.index('table thead th[key]')
        const invisible = !$input.prop('checked')
        columns = _.map(columns, (field) => {
            if (field.key == $input.val()) {
                field.invisible = invisible
            }
            return field
        })
        instance.columns.set(columns)
    },
    'click .showMore'(e, instance){
        instance.showingMore.set(true)
        instance.limit.set(instance.limit.get() + (instance.data.limit || defaultLimit))
    },
    'click .sortable'(e, instance) {
        const $target = $(e.target)
        if ($target.get(0).localName == "a") {
            e.preventDefault()
            const oldSortKey = Object.keys(instance.sort.get())[0];
            const newSortKey = $target.data('sort');
            let newSort = {};
            if (oldSortKey == newSortKey) {
                newSort[newSortKey] = instance.sort.get()[oldSortKey] * -1;
            } else {
                newSort[newSortKey] = $target.data('direction');
            }
            instance.sort.set(newSort)
        }

    },
});


