import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {ReactiveVar} from "meteor/reactive-var"
import {AutoTable} from "./auto-table"
import {Template} from "meteor/templating"
import {_} from 'meteor/underscore'
import "./loading.css"
import "./auto-table.css"
import "./list.html"
import "./loading.html"
import "./filter"
import {deepObjectExtend} from "./auto-table";
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
    this.data.showingMore = new ReactiveVar(false)
    if (!this.data.id) throw new Meteor.Error(400, 'Missing configuration', 'atList template has to be an id parameter')
    autoTable = AutoTable.getInstance(this.data.id)
    this.data.settings = deepObjectExtend(this.data.settings, autoTable.settings)
    this.data.filters = new PersistentReactiveVar('filters' + this.sessionName, {})
    this.data.collection = this.data.collection || autoTable.collection
    if (!this.data.collection instanceof Mongo.Collection) throw new Meteor.Error(400, 'Missing configuration', 'atList template has to be a Collection parameter')
    this.data.fields = new PersistentReactiveVar('fields' + this.sessionName, this.data.fields || autoTable.fields)
    let storeFields = _.map(this.data.fields.get(), (val)=>_.pick(val, 'key', 'label', 'operators'))
    let newFields = _.map(autoTable.fields, (val)=>_.pick(val, 'key', 'label', 'operators'))
    newFields = _.sortBy(newFields, 'key')
    storeFields = _.sortBy(storeFields, 'key')
    if (areDifferents(storeFields, newFields)) {
        this.data.fields.set(autoTable.fields)
    }
    const userId = typeof Meteor.userId === "function" ? Meteor.userId() : ''
    this.data.sessionName = `${this.id}${userId}`
    this.limit = parseInt(this.data.limit || defaultLimit)
    console.log('this.limit', this.limit)
    this.data.limit = new ReactiveVar(this.limit)
    console.log('this.limit', this.limit)
    this.query = autoTable.query
    this.data.sort = new PersistentReactiveVar('sort' + this.data.sessionName, this.data.sort || {});
    this.autorun(()=> {
        console.log('autorun query ', this.data.filters.get())
        this.subscribe('atPubSub', this.data.id, this.data.limit.get(), this.data.filters.get(), this.data.sort.get(), {
            onReady: ()=>this.data.showingMore.set(false)
        })
    })
});
Template.atTable.onRendered(function () {
    let first = true
    if (this.data.settings.options.columnsSort) {
        this.autorun(()=> {
            if (this.subscriptionsReady() && first) {
                first = false
                let fields = this.data.fields.get()
                Meteor.setTimeout(()=> {
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
                            fields = _.sortBy(fields, function (field) {
                                return keys.indexOf(field.key)
                            });
                            instance.data.fields.set(fields)
                            event.preventDefault()
                        },
                    }).disableSelection()
                });
            }
        });
    }

})

Template.atTable.onDestroyed(function () {
    //add your statement here
});


Template.atTable.helpers({
    hiddenFilter(){
        return _.reduce(Template.instance().data.fields.get(), function (memo, field) {
                return memo + Number(!!field.invisible && !!field.filter)
            }, 0) > 0
    },
    filtered: ()=>!!_.isEmpty(Template.instance().data.filters.get()),
    atts: (field)=> {
        const instance = Template.instance();
        let fields = instance.data.fields.get()
        const total = fields.length
        const invisible = _.where(fields, {invisible: true}).length;
        const atts = {}
        _.forEach(fields, (val)=> {
            if (val.key == field.key) {
                if (total - invisible == 1 && !field.invisible) atts.disabled = true
                if (!field.invisible) atts.checked = true
            }
            atts.value = field.key
        })
        return atts
        //instance.fields.set(fields)
    },
    showingMore: ()=>Template.instance().data.showingMore.get(),
    settings: ()=>Template.instance().data.settings,
    valueOf: function (path, obj) {
        return path.split('.').reduce(function (prev, curr) {
            return prev ? prev[curr] : undefined
        }, obj || self)
    },
    fields: ()=> Template.instance().data.fields.get(),
    rows: ()=> {
        const instance=Template.instance()
        let query = instance.query
        if (!_.isEmpty(query)){
            query={$and:[instance.data.filters.get(),query]}
        }
        console.log('rows query ', query)
        return instance.data.collection.find(query, {
            sort: instance.data.sort.get(),
            limit: instance.data.limit.get(),
        })
    },
    showing: ()=> {
        const total = Package['tmeasday:publish-counts'].Counts.get('atCounter')
        const limit = Template.instance().data.limit.get()
        return limit < total ? limit : total
    },
    total: function () {
        if (Template.instance().data.settings.options.showing) {
            return Package['tmeasday:publish-counts'].Counts.get('atCounter')
        }

    }
    ,
    showMore: function () {
        const instance = Template.instance();
        let query = instance.query
        if (!_.isEmpty(query)){
            query={$and:[instance.data.filters.get(),query]}
        }
        console.log('showMore query ', query)
        if (instance.data.settings.options.showing) {
            return (instance.data.collection.find(query, {
                sort: instance.data.sort.get(),
                limit: instance.data.limit.get(),
                transform: instance.data.transform
            }).count() < Package['tmeasday:publish-counts'].Counts.get('atCounter'))
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
        let fields = instance.data.fields.get()
        const $input = $(e.currentTarget)
        const key = $input.val()
        //const number = $column.index('table thead th[key]')
        const invisible = !$input.prop('checked')
        console.log(fields)
        fields = _.map(fields, (field)=> {
            if (field.key == $input.val()) {
                field.invisible = invisible
            }
            return field
        })
        instance.data.fields.set(fields)
        console.log(fields, instance.data.fields.get())
    },
    'click .showMore'(e, instance){
        instance.data.showingMore.set(true)

        console.log('instance.data.limit.get() + (this.limit || defaultLimit)', instance.data.limit.get(), (instance.limit || defaultLimit))
        instance.data.limit.set(instance.data.limit.get() + (instance.limit || defaultLimit))
    },
    'click .sortable'(e, instance) {
        const $target = $(e.target)
        console.log($target)
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
            console.log('click sort', newSort)
            instance.data.sort.set(newSort)
        }

    },
    'click .zoom'(e, instance){
        if (Package['kadira:flow-router']) {
            Package['kadira:flow-router'].FlowRouter.go(instance.data.settings.link.routeDefinition, instance.data.settings.link.routeData)
        } else {
            location.href = instance.data.settings.link.path
        }

    },

});


