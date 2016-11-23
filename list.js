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
    const autoTable = this.data.at
    this.data.showingMore = new ReactiveVar(false)
    this.data.id = autoTable.id
    this.autoTable = autoTable
    this.link = autoTable.link
    this.data.settings = _.defaultsDeep(_.clone(this.data.settings) || {}, autoTable.settings)
    const userId = typeof Meteor.userId === "function" ? Meteor.userId() || '' : ''
    this.data.sessionName = `${autoTable.id}${userId}`

    this.data.filters = new PersistentReactiveVar('filters' + this.data.sessionName, {})
    this.data.collection = this.data.collection || autoTable.collection
    if (!this.data.collection instanceof Mongo.Collection) throw new Meteor.Error(400, 'Missing configuration', 'atList template has to be a Collection parameter')
    this.data.columns = new PersistentReactiveVar('columns' + this.data.sessionName, this.data.columns || autoTable.columns)

    let storedColumns = _.map(this.data.columns.get(), (val) => _.pick(val, 'key', 'label',  'operators'))
    let newColumns = _.map(autoTable.columns, (val) => _.pick(val, 'key', 'label', 'operators'))
    newColumns = _.sortBy(newColumns, 'key')
    storedColumns = _.sortBy(storedColumns, 'key')
    if (areDifferents(storedColumns, newColumns)) {
        console.log('areDifferents')
        this.data.columns.set(autoTable.columns)
        console.log('areDifferents')
    }
    this.data.customQuery = this.data.customQuery || {}
    this.limit = parseInt(this.data.limit || defaultLimit)
    this.data.limit = new ReactiveVar(this.limit)
    this.query = new ReactiveVar({})
    this.autorun(() => {
        this.query.set(_.defaultsDeep(_.clone(autoTable.query), this.data.customQuery || {}))
    })
    this.filters = new ReactiveVar({})
    this.data.sort = new PersistentReactiveVar('sort' + this.data.sessionName, {});
    this.autorun(() => {
        const filters = autoTable.schema ? createFilter(this.data.columns.get(), autoTable.schema) : {}
        console.log('filters', filters)
        console.log('this.query.get()', this.query.get())
        //const query=_.clone(this.query.get())
        const queryToSend = _.defaultsDeep(_.clone(this.query.get()), filters)
        console.log(filters)
        console.log('autorun queryToSend', queryToSend)
        this.subscribe('atPubSub', this.data.id, this.data.limit.get(), queryToSend, this.data.sort.get(), {
            onReady: () => this.data.showingMore.set(false)
        })
    })

});
export const createFilter = function (columns, schema) {
    //columns has all information to create the filters
    //but has to be cleans (strings to dates for eg)
    // and has to be formated to selctor mongo
    const cleaned = {}
    for (const column of columns) {
        if (column.filter) {
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
    if (this.data.settings.options.columnsSort) {
        this.autorun(() => {
            if (this.subscriptionsReady() && first) {
                first = false
                let columns = this.data.columns.get()
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
                            instance.data.columns.set(columns)
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
    link(row){
        return Template.instance().link(row)
    },
    hiddenFilter(){
        return _.reduce(Template.instance().data.columns.get(), function (memo, field) {
                return memo + Number(!!field.invisible && !!field.filter)
            }, 0) > 0
    },
    filtered: () => !!_.isEmpty(Template.instance().data.filters.get()),
    atts: (field) => {
        const instance = Template.instance();
        let columns = instance.data.columns.get()
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
    showingMore: () => Template.instance().data.showingMore.get(),
    settings: () => Template.instance().data.settings,
    isTemplate: function (render) {
        return (render == 'string')
    },
    render: function (obj, column) {
        const render=_.find(Template.instance().autoTable.columns,{key: column.key}).render
        const path = column.key
        const val = path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : undefined
        }, obj || self)
        if (typeof render == 'function') {
            return render.call(obj, val, path)
        }
        return val

    },
    columns: () => Template.instance().data.columns.get(),
    rows: () => {
        const instance = Template.instance()
        let query = instance.query.get()
        console.log('***',query,'***')
        const cursor = instance.data.collection.find(query, {
            sort: instance.data.sort.get(),
            limit: instance.data.limit.get(),
        })

        return instance.data.collection.find(query, {
            sort: instance.data.sort.get(),
            limit: instance.data.limit.get(),
        })
    },
    showing: () => {
        const instance = Template.instance()
        const limit = instance.data.limit.get()
        const total = Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.data.id)
        return limit < total ? limit : total
    },
    total: function () {
        const instance = Template.instance();
        if (instance.data.settings.options.showing) {
            return Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.data.id)
        }

    }
    ,
    showMore: function () {
        const instance = Template.instance();
        let query = instance.query.get()

        if (instance.data.settings.options.showing) {
            return (instance.data.collection.find(query, {
                sort: instance.data.sort.get(),
                limit: instance.data.limit.get(),
                transform: instance.data.transform
            }).count() < Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.data.id))
        } else {
            return (instance.data.collection.find(query, {
                sort: instance.data.sort.get(),
                limit: instance.data.limit.get(),
                transform: instance.data.transform
            }).count() === instance.data.limit.get())
        }
    }
    ,
    sort(sort)
    {
        const instance = Template.instance()
        const sortObj = instance.data.sort.get()
        if (_.isEmpty(sortObj)) return ''
        const sortKey = Object.keys(sortObj)[0];
        if (sort == sortKey) {
            if (sortObj[sortKey] > 0) {
                return instance.data.settings.msg.sort.asc
            } else {
                return instance.data.settings.msg.sort.desc
            }
        }
    }
})
;

Template.atTable.events({
    'change input[name="columns"]'(e, instance){
        let columns = instance.data.columns.get()
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
        instance.data.columns.set(columns)
    },
    'click .showMore'(e, instance){
        instance.data.showingMore.set(true)
        instance.data.limit.set(instance.data.limit.get() + (instance.limit || defaultLimit))
    },
    'click .sortable'(e, instance) {
        const $target = $(e.target)
        if ($target.get(0).localName == "a") {
            e.preventDefault()
            const oldSortKey = Object.keys(instance.data.sort.get())[0];
            const newSortKey = $target.data('sort');
            let newSort = {};
            if (oldSortKey == newSortKey) {
                newSort[newSortKey] = instance.data.sort.get()[oldSortKey] * -1;
            } else {
                newSort[newSortKey] = $target.data('direction');
            }
            instance.data.sort.set(newSort)
        }

    },
});


