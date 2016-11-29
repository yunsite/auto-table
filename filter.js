import "./filter.html"
import {AutoTable} from "./auto-table"
import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {AutoForm} from "meteor/aldeed:autoform"
import {_} from 'lodash'
/*
 const key=Template.instance().data.field.key
 let filters=Template.instance().filters.get()

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
        const selected = _.find(this.operators, {operator: this.operator})
        return selected
    },
    columnIsInFilter(){
        return !!Template.instance().autoTable.schema.schema(this.key)
    }


});


Template.atFilter.events({
    'click .operator a'(e, instance){
        const $parent = $(e.currentTarget).parents('.input-group ')
        const $form = $(e.currentTarget).parents('form')
        const $input = $parent.find('input[type="hidden"].operator')
        const $btn = $parent.find('button')
        $input.val(this.operator)

        $form.submit()
    }
});
formData1 = ''
Template.atFilter.onCreated(function () {
    const parentData = Template.parentData()
    this.autoTable=AutoTable.getInstance(parentData.id)
    const self = this
    AutoForm.addHooks(
        this.data.id,
        {

            onSubmit: function (doc, modifier, currentDoc) {
                const formData = new FormData($(this.event.currentTarget).get(0))
                let columns = parentData.columns.get()

                for (let column of columns) {
                    const val = _.get(doc,column.key.split('.'))
                    column.operator = formData.get(column.key + '_operator')
                    if (val !== '' && val !== null && val !== undefined) {
                        column.filter = val
                    } else {
                        delete column.filter
                    }
                }
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

