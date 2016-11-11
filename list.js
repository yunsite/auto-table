import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {ReactiveVar} from "meteor/reactive-var"
import {AutoTable} from "./auto-table"
import {Template} from "meteor/templating"
import {_} from 'meteor/underscore'
import "./loading.css"
import "./auto-table.css"
import "./list.html"
import "./loading.html"
import {deepObjectExtend} from "./auto-table";
const defaultLimit = 25

const fieldUpdate = function (id, property, value) {
    fields = _.map(fields, (field)=> {
        if (field.id == $input.val()) {
            field.invisible = invisible
        }
        return field
    })
}
Template.atTable.onCreated(function () {
    //todo set limit from data or settings
    this.showingMore = new ReactiveVar(false)
    this.id = this.data.id
    if (!this.id) throw new Meteor.Error(400, 'Missing configuration', 'atList template has to be an id parameter')
    autoTable = AutoTable.getInstance(this.id)
    this.settings = deepObjectExtend(this.data.settings, autoTable.settings)
    if (this.settings.options.showing && !Package['tmeasday:publish-counts']) throw new Meteor.Error(400, 'Missing configuration', 'In Sort to use showing option you need to install tmeasday:publish-counts package')
    this.collection = this.data.collection || autoTable.collection
    this.fields = new PersistentReactiveVar('fields' + this.sessionName, this.data.fields || autoTable.fields)
    console.log('this.fields', this.fields.get())
    if (!this.id) throw new Meteor.Error(400, 'Missing configuration', 'atList template has to be a Collection parameter')
    const userId = typeof Meteor.userId === "function" ? Meteor.userId() : ''
    this.sessionName = `${this.id}${userId}`
    this.limit = new ReactiveVar(this.data.limit || defaultLimit)
    this.query = new PersistentReactiveVar('query' + this.sessionName);
    this.sort = new PersistentReactiveVar('sort' + this.sessionName);
    this.query.setDefault(this.data.query || {})
    this.sort.setDefault(this.data.sort || {})
    this.autorun(()=> {
        this.subscribe('atPubSub', this.id, this.limit.get(), this.query.get(), this.sort.get(), {
            onReady: ()=>this.showingMore.set(false)
        })
    })
});
Template.atTable.onRendered(function () {
    let first = true
    if (this.settings.options.columnsSort) {
        this.autorun(()=> {
            if (this.subscriptionsReady() && first) {
                first = false
                let fields = this.fields.get()
                Meteor.setTimeout(()=> {
                    const instance=this
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
                            const ids=$(this).sortable( "toArray" )
                            fields=_.sortBy(fields, function(field){ return ids.indexOf(field.id) });
                            instance.fields.set(fields)
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
    atts: (field)=> {
        const instance = Template.instance();
        let fields = instance.fields.get()
        const total = fields.length
        const invisible = _.where(fields, {invisible: true}).length;
        const atts = {}
        console.log(total, invisible)
        _.forEach(fields, (val)=> {
            if (val.id == field.id) {
                if (total - invisible == 1 && !field.invisible) atts.disabled = true
                if (!field.invisible) atts.checked = true
            }
            atts.value = field.id
        })
        return atts
        //instance.fields.set(fields)
    },
    showingMore: ()=>Template.instance().showingMore.get(),
    settings: ()=>Template.instance().settings,
    valueOf: (row, field)=> row[field.id],
    fields: ()=>  Template.instance().fields.get(),
    rows: ()=> {
        const instance = Template.instance();
        return instance.collection.find(instance.query.get(), {
            sort: instance.sort.get(),
            limit: instance.limit.get(),
        })
    },
    showing: ()=> {
        const total = Package['tmeasday:publish-counts'].Counts.get('atCounter')
        const limit = Template.instance().limit.get()
        return limit < total ? limit : total
    },
    total: function () {
        if (Template.instance().settings.options.showing) {
            return Package['tmeasday:publish-counts'].Counts.get('atCounter')
        }

    }
    ,
    showMore: function () {
        const instance = Template.instance();
        if (instance.settings.options.showing) {
            return (instance.collection.find(instance.query.get(), {
                sort: instance.sort.get(),
                limit: instance.limit.get(),
                transform: instance.transform
            }).count() < Package['tmeasday:publish-counts'].Counts.get('atCounter'))
        } else {
            return (instance.collection.find(instance.query.get(), {
                sort: instance.sort.get(),
                limit: instance.limit.get(),
                transform: instance.transform
            }).count() === instance.limit.get())
        }
    }
    ,
    sort(sort)
    {
        const instance = Template.instance()
        const sortObj = instance.sort.get()
        const sortKey = Object.keys(sortObj)[0];
        if (sort == sortKey) {
            if (sortObj[sortKey] > 0) {
                return instance.settings.msg.sort.asc
            } else {
                return instance.settings.msg.sort.desc
            }
        }
    }
})
;

Template.atTable.events({
    'change input[name="columns"]'(e, instance){
        let fields = instance.fields.get()
        const $input = $(e.currentTarget)
        const id = $input.val()
        //const number = $column.index('table thead th[id]')
        const invisible = !$input.prop('checked')
        console.log(fields)
        fields = _.map(fields, (field)=> {
            if (field.id == $input.val()) {
                field.invisible = invisible
            }
            return field
        })
        instance.fields.set(fields)
        console.log(fields, instance.fields.get())
    },
    'click .showMore'(e, instance){
        instance.showingMore.set(true)
        instance.limit.set(instance.limit.get() + (this.limit || defaultLimit))
    },
    'click .sortable'(e, instance) {
        const $target=$(e.target)
        console.log($target)
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
            console.log('click sort', newSort)
            instance.sort.set(newSort)
        }

    },
    'click .zoom'(e, instance){
        if (Package['kadira:flow-router']) {
            Package['kadira:flow-router'].FlowRouter.go(instance.settings.link.routeDefinition, instance.settings.link.routeData)
        } else {
            location.href = instance.settings.link.path
        }

    },

});


