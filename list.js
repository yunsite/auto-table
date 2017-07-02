import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {ReactiveVar} from "meteor/reactive-var"
import {AutoTable} from "./auto-table"
import {AutoForm} from "meteor/aldeed:autoform"
import {Template} from "meteor/templating"
import "./loading.css"
import "./auto-table.css"
import "./list.html"
import "./loading.html"
import "./filter"
import {_} from 'lodash'


const defaultLimit = 50
/*
 const hashCode = function (str) {
 var hash = 0, i, chr, len;
 if (str.length === 0) return hash;
 for (i = 0, len = str.length; i < len; i++) {
 chr = str.charCodeAt(i);
 hash = ((hash << 5) - hash) + chr;
 hash |= 0; // Convert to 32bit integer
 }
 return hash;
 };*/
const areDifferents = function (newColumns) {

    const hashNew = (JSON.stringify(this.autoTable.columns))
    const hashOld = new PersistentReactiveVar('columnsTracker' + this.sessionName)
    const res = hashNew != hashOld.get()
    if (res) {
        hashOld.set(hashNew)
    }
    return res
    /*
     if (storedColumns.length != newColumns.length) {
     return true
     }
     for (let i = 0; i < storedColumns.length; i++) {
     storedColumns = _.omitBy(storedColumns, _.isNil)
     if (!_.isMatch(storedColumns[i], newColumns[i])) {
     console.log(storedColumns[i], newColumns[i])
     return true
     }
     }
     return false*/
}
Template.atTable.onCreated(function () {
    //todo set limit from data or settings
    this.allin = false

    if (!this.data.at) {
        console.log(this.data)
        throw new Meteor.Error(400, 'Missing parameter', 'at parameter no present')
    }
    if (!this.data.at instanceof AutoTable) {
        console.log(this.data)
        throw new Meteor.Error(400, 'Wrong parameter', 'at parameter has to be  autoTable instance')
    }

    /**settings from data***/
    let settings = this.data.settings || this.data.at.settings
    if (typeof settings == 'function') settings = settings()
    this.settings = _.defaultsDeep(settings, this.data.at.settings)



    this.autoTable = this.data.at
    this.showingMore = new ReactiveVar(false)
    const userId = typeof Meteor.userId === "function" ? Meteor.userId() || '' : ''
    this.sessionName = `${this.autoTable.id}${userId}`
    this.columns = new PersistentReactiveVar('columns' + this.sessionName, this.autoTable.columns)
    let storedColumns = _.map(this.columns.get(), (val) => _.pick(val, 'key', 'label', 'template', 'operator', 'operators'))
    let newColumns = _.map(this.autoTable.columns, (val) => _.pick(val, 'key', 'label', 'template', 'operator', 'operators'))
    newColumns = _.sortBy(newColumns, 'key')
    storedColumns = _.sortBy(storedColumns, 'key')
    if (areDifferents.call(this, storedColumns, newColumns)) {
        if (Meteor.isDevelopment) console.log('*******************************ARE DIFFERENTS*********************************', storedColumns, newColumns)
        this.columns.set(this.autoTable.columns)
    }
    this.limit = ReactiveVar(parseInt(this.data.limit || defaultLimit))
    this.query = new ReactiveVar({})
    this.filtered = new ReactiveVar({})
    this.sort = new PersistentReactiveVar('sort' + this.sessionName, {});
    this.autorun(() => {
        //if (!this.allin) {
        this.autoTable.setSubscriptionReady(false)
        //}
        const filters = this.autoTable.schema ? createFilter(this.columns.get(), this.autoTable.schema) : {}
        this.autoTable.filters = filters
        this.filtered.set(!_.isEmpty(filters))
        const customQuery = typeof this.data.customQuery == "function" ? this.data.customQuery() : this.data.customQuery || {}
        const query = _.cloneDeep(this.autoTable.query)
        _.defaultsDeep(filters, customQuery)
        _.defaultsDeep(filters, query)
        this.query.set(filters)
        if (Meteor.isDevelopment) console.log('autotable query', filters)
        if (Meteor.isDevelopment) console.log('autotable sort', this.sort.get())
        const limit = this.limit.get()
        //if (!this.allin) {
        this.subscribe('atPubSub', this.autoTable.id, this.limit.get(), filters, this.sort.get(), {
            onReady: () => {
                this.showingMore.set(false)
                this.autoTable.setSubscriptionReady(true)

            }

        })
        //}
    })

});
export const tryParseJSON = function (jsonString) {
    if (typeof jsonString != 'string') return false
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) {

    }
    return false;
};
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
        let val = cleaned[column.key]

        const operator = column.operator
        if (val !== '' && val !== null && val !== undefined) {
            //for any JSON value forget about the operator and use the object
            const queryObj = tryParseJSON(val)

            if (queryObj) {
                console.log('queryObj', queryObj)
                _.merge(filters, queryObj)
            } else {
                if (val instanceof Date) {
                    selector[operator] = moment(val).startOf('day').toDate()
                } else {
                    selector[operator] = val
                }

                if (operator == '$exists') {
                    if (val instanceof Date && val.getTime() == AutoForm.valueConverters.stringToDate("0").getTime()) {
                        val = false
                    }
                    if (typeof val == 'string' && val == "0") {
                        val = false
                    }
                    selector[operator] = !!val
                }
                if (operator == '$regex') selector['$options'] = 'gi'
                filters[column.key] = selector
            }

        }
    }
    console.log('createFilter', filters)
    return filters
}
Template.atTable.onRendered(function () {


    let first = true
    if (this.settings.options.columnsSort) {
        this.autorun(() => {
            if (this.subscriptionsReady() && first) {
                first = false
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
                            let columns = instance.columns.get()
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
    classFormat:(str)=>str.replace(/\./gi,'-'),
    link(row, key){
        return Template.instance().autoTable.link(row, key)
    },
    hiddenFilter(){

        return _.reduce(Template.instance().columns.get(), function (memo, field) {
                return memo + Number(!!field.invisible && !!field.filter)
            }, 0) > 0
    },
    filtered: () => Template.instance().filtered.get(),
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
    settings: () => Template.instance().settings,

    id: () => Template.instance().autoTable.id,
    isTemplate: function (template) {
        return (typeof template == 'string')
    },
    render: function (obj, column) {        //console.log('Template.instance().autoTable.columns',Template.instance().autoTable.columns,column.key)
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
    columns: () => Template.instance().columns.get(),
    rows: () => {
        const instance = Template.instance()
        let query = instance.query.get() //
        //for (var attrname in instance.data.customQuery) { query[attrname] = instance.data.customQuery[attrname];}
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
        if (instance.settings.options.showing) {
            return Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.autoTable.id)
        }

    }

    ,
    showMore: function () {
        const instance = Template.instance();
        let query = instance.query.get()
        let showMore
        if (instance.settings.options.showing) {
            if (Meteor.isDevelopment) console.log('query', query)
            if (Meteor.isDevelopment) console.log('atCounter', Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.autoTable.id))
            if (Meteor.isDevelopment) console.log('count', instance.autoTable.collection.find(query).count())
            showMore = (instance.autoTable.collection.find(query).count() < Package['tmeasday:publish-counts'].Counts.get('atCounter' + instance.autoTable.id))
        } else {
            showMore = (instance.autoTable.collection.find(query, {
                sort: instance.sort.get(),
                limit: instance.limit.get(),
            }).count() === instance.limit.get())
        }
        instance.allin = !showMore && !Template.instance().filtered.get()
        return showMore
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
                return instance.settings.msg.sort.asc
            } else {
                return instance.settings.msg.sort.desc
            }
        }
    }
})
;

Template.atTable.events({
    'click .columnsDisplay.dropdown-menu': function (evt, tpl) {
        evt.stopPropagation(); //avoid to close thbe dropdown after click on text
    },
    'click .clearFilter'(e, instance){
        $('#' + instance.autoTable.id).find('[data-schema-key]').val('')
        $('#' + instance.autoTable.id).find('[data-schema-key] input[type="checkbox"]:checked').click()
        $('#' + instance.autoTable.id).submit()
    },
    'click .buttonExport'(e, instance){
        e.preventDefault();
        if ($('.showMore').length == 0) {
            exportTableToCSV(instance.$('table'), instance.settings.msg.exportFile)
        } else {

            $('.buttonExport i').addClass(instance.settings.klass.exportSpinner);
            const query = instance.query.get()
            const sort = instance.sort.get()
            const columns = instance.columns.get()
            Meteor.call('autoTable.export', instance.autoTable.id, query, sort, columns, (err, file) => {
                var anchor = document.createElement('a');
                anchor.href = '/download/' + file;
                anchor.target = '_blank';
                anchor.download = instance.settings.msg.exportFile + '.xlsx';
                anchor.click();
            })
        }

    },
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


function exportTableToCSV($table, filename) {
    var $rows = $table.find('tr'),
        // Temporary delimiter characters unlikely to be typed by keyboard
        // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character
        // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

        // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
                const $row = $(row), $cols = $row.find('.td:visible,th:visible');

                return $cols.map(function (j, col) {
                    const $col = $(col), text = getText($col.get(0))

                    return text.replace(/"/g, '""').trim(); // escape double quotes

                }).get().join(tmpColDelim);

            }).get().join(tmpRowDelim)
                .split(tmpRowDelim).join(rowDelim)
                .split(tmpColDelim).join(colDelim) + '"',
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);
    saveAs(new Blob([csv]), filename + '.csv')

}

function getText(n) {
    var rv = '';

    if (n.nodeType == 3) {
        rv = n.nodeValue;
    } else {
        for (var i = 0; i < n.childNodes.length; i++) {
            rv += getText(n.childNodes[i]);
        }
        var d = getComputedStyle(n).getPropertyValue('display');
        if (d.match(/^block/) || d.match(/list/) || n.tagName == 'BR') {
            rv += "\n";
        }
    }

    return rv;

};



