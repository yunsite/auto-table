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
    fields () {
        return this.fields
    },
    schema(){
        return AutoTable.getInstance(this.id).schema
    },
    multipleOperators(){
        return Array.isArray(this.operators) && this.operators.length > 1
    },
    selected(){
        return _.findWhere(this.operators, {operator: this.operator})
    }
});


Template.atFilter.events({
    'click .operator a'(e, instance){
        const $form=$(e.currentTarget).parents('.form-group')
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
    console.log('Template.atFilter.onCreated', parentData, this)
    AutoForm.addHooks(
        this.data.id,
        {
            onSubmit: function (doc, modifier, currentDoc) {
                console.log('onSubmit', $(this.event.currentTarget))
                const formData = new FormData($(this.event.currentTarget).get(0))
                let selector = {},  filters = {}
                let fields = parentData.fields.get()
                data={}
                for (field of fields) {
                    const val = formData.get(field.key)
                    const operator = formData.get(field.key + '_operator')
                    field.operator=operator
                    if (val !== '') {
                        selector[operator] = val
                        if (operator == '$regex')  selector['$options'] = 'gi'
                        filters[field.key] = _.clone(selector)
                        field.filter = val

                    } else {
                        delete filters[field.key]
                        delete field.filter
                    }

                }

                parentData.filters.set(filters)
                parentData.fields.set(fields)
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

