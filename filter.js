import "./filter.html"
import {AutoTable} from "./auto-table"
import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {AutoForm} from "meteor/aldeed:autoform"
/*
 const key=Template.instance().data.field.key
 let filters=Template.instance().filters.get()
 console.log('filterValue',key,filters.key)
 return filters[key]
 */
Template.atFilter.helpers({
    columns () {
        return this.columns
    },
    schema(){
        return AutoTable.getInstance(this.id).schema
    },
    multipleOperators(){
        return Array.isArray(this.operators) && this.operators.length > 1
    },
    selected(){
        return _.findWhere(this.operators, {operator: this.operator})
    },
    keyOperator(){
        return this.key + '_operator'
    }


});


Template.atFilter.events({
    'click .operator a'(e, instance){
        const $form = $(e.currentTarget).parents('.form-group')
        const $input = $form.find('input[type="hidden"]')
        const $btn = $form.find('button')
        $input.val(this.operator)
        $form.submit()
    }
});

Template.atFilter.onCreated(function () {
    this.filters = new PersistentReactiveVar('filters' + this.data.id, {})
    const parentData = Template.parentData()
    const self = this
    //this.settings=parentData.settings
    console.log(' this.data.settings', this.settings)
    AutoForm.addHooks(
        this.data.id,
        {

            onSubmit: function (doc, modifier, currentDoc) {
                console.log('doc,modifier,currentDoc', doc, modifier, currentDoc)
                console.log('onSubmit', $(this.event.currentTarget))
                const formData = new FormData($(this.event.currentTarget).get(0))
                console.log(formData)
                let selector = {}, filters = {}
                let columns = parentData.columns.get()
                data = {}
                for (let column of columns) {
                    const val =formData.get(column.key)
                    const operator = formData.get(column.key + '_operator')
                    column.operator = operator
                    if (val !== '' && val !== null) {
                        selector[operator] = val
                        if (operator == '$regex') selector['$options'] = 'gi'
                        filters[column.key] = _.clone(selector)
                        column.filter = val

                    } else {
                        delete filters[column.key]
                        delete column.filter
                    }

                }

                parentData.filters.set(formData)
                parentData.columns.set(columns)
                return false
            }
        }
    );
});

Template.atFilter.onRendered(function () {
    //add your statement here
});

Template.atFilter.onDestroyed(function () {
    //add your statement here
});

