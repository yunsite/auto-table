import "./filter.html"
import {AutoTable} from "./auto-table"
import {AutoForm} from "meteor/aldeed:autoform"

Template.atFilter.helpers({
    id(){
        return this.id + '_' + this.field.key
    },
    schema(){
        console.log('this', this.field.key)
        const autoTable = AutoTable.getInstance(this.id)
        const schema = autoTable.schema
        const field = {}
        const fieldKey = this.field.key.replace(/\./g, '_')
        field[fieldKey] = (schema.schema(this.field.key))
        console.log(field[fieldKey])
        field[fieldKey].optional = true
        return new SimpleSchema(field)
    }
});


Template.atFilter.events({});

Template.atFilter.onCreated(function () {
    console.log('atFilter',Template.parentData())
    console.log(Blaze.getView($('atTable').get(0)))
    console.log('atFilter',Template.atTable)
    AutoForm.addHooks(
        this.data.id + '_' + this.data.field.key,
        {
            onSubmit:  (doc, updateDoc, currentDoc)=> {
                console.log(doc, updateDoc, currentDoc)
                let query=this.query.get()
                for (let key in doc){

                }
                this.query.set(doc)
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

