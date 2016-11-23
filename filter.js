import "./filter.html"
import {AutoTable} from "./auto-table"
import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {AutoForm} from "meteor/aldeed:autoform"
import {_} from 'lodash'
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
        const selected = _.find(this.operators, {operator: this.operator})
        return selected
    },


});


Template.atFilter.events({
    'click .operator a'(e, instance){
        const $parent = $(e.currentTarget).parents('.input-group ')
        const $form = $(e.currentTarget).parents('form')
        const $input = $parent.find('input[type="hidden"].operator')
        const $btn = $parent.find('button')
        $input.val(this.operator)
        console.log($parent, $form, $input, $btn, this.operator)
        $form.submit()
    }
});
formData1 = ''
Template.atFilter.onCreated(function () {
    const parentData = Template.parentData()
    const self = this
    AutoForm.addHooks(
        this.data.id,
        {

            onSubmit: function (doc, modifier, currentDoc) {
                console.log('onSubmit', doc,modifier, currentDoc,parentData)
                console.log(doc)
                const formData = new FormData($(this.event.currentTarget).get(0))
                let columns = parentData.columns.get()
                data = {}
                for (let column of columns) {
                    let val = formData.get(column.key)
                    if (Array.isArray(doc[column.key])) val = doc[column.key]
                    //if (typeof doc[column.key] == "number") val = doc[column.key]
                    column.operator = formData.get(column.key + '_operator')
                    if (val !== '' && val !== null) {
                        column.filter = val
                    } else {
                        delete column.filter
                    }
                }
                console.log('submu----------------')
                parentData.columns.set(columns)
                console.log('submu----------------')

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

