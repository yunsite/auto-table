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
        //console.log('value', this)
        const schema = Template.instance().autoTable.schema.schema(this.key)
        //console.log($('[name="'+this.key+'"]'))

        if (typeof schema.type=="function" && schema.type() == new Date){
            return AutoForm.valueConverters.dateToDateString(new Date(this.filter))
        }

        return this.filter

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

    this.autoTable = parentData.at
    console.log('parentData', parentData)
    const self = this
    AutoForm.addHooks(
        this.autoTable.id,
        {

            onSubmit: function (doc, modifier, currentDoc) {
                console.log('onSubmit ***********************************', self)
                const formData = new FormData($(this.event.currentTarget).get(0))
                let columns = self.data.columnsReactive.get()

                for (let column of columns) {
                    const val = _.get(doc, column.key.split('.'))
                    column.operator = formData.get(column.key + '_operator')
                    if (val !== '' && val !== null && val !== undefined) {
                        column.filter = val
                    } else {
                        delete column.filter
                    }
                }
                console.log(1)
                self.data.columnsReactive.set(columns)
                console.log(2, columns)
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

