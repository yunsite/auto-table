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
        return this.columnsReactive.get()
    },
    schema(){
        return Template.instance().autoTable.schema
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
    },
    value(){
        const schema = Template.instance().autoTable.schema.schema(this.key)
        if (typeof schema.type == "function" && schema.type() == new Date) {
            if (this.filter==undefined) return ''
            const value = new Date(this.filter).toString()
            return value
        }
        return this.filter

    }

});


Template.atFilter.events({
    'click .operator a'(e, instance){
        const $parent = $(e.currentTarget).parents('.input-group ')
        const $form = $(e.currentTarget).closest('form')
        const $input = $parent.find('input[type="hidden"].operator')
        const $btn = $parent.find('button')
        $input.val(this.operator)

        $form.submit()
    }
});
formData1 = ''
Template.atFilter.onCreated(function () {
    const parentData = Template.parentData()
    this.autoTable = parentData.at
    const self = this
    AutoForm.addHooks(
        this.autoTable.id,
        {
            onSubmit: function (doc, modifier, currentDoc) {
                const form = $(this.event.currentTarget)
                let columns = self.data.columnsReactive.get()
                for (let column of columns) {
                    const val = _.get(doc, column.key.split('.'))
                    column.operator = form.find("[name='" + column.key + "_operator']").val()
                    if (val !== '' && val !== null && val !== undefined) {
                        column.filter = val
                    } else {
                        delete column.filter
                    }
                }
                self.data.columnsReactive.set(columns)
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

