import "./settings.html"
import {AutoTable} from './auto-table'
import {PersistentReactiveVar} from "meteor/cesarve:persistent-reactive-var"
import {confirm} from './confirm'
Template.atSettings.helpers({
    mySettings(){
        if (Roles.userIsInRole(Meteor.userId(),'admin')) {
            return AutoTable.collection.find({
                atId: Template.instance().data.at.id,
                $or:[{userId: Meteor.userId()},{userId: null}]
            }, {sort: {name: 1}})
        }else{
            return AutoTable.collection.find({
                atId: Template.instance().data.at.id,
                userId: Meteor.userId()
            }, {sort: {name: 1}})
        }

    },
    defaults(){

        return AutoTable.collection.find({atId: Template.instance().data.at.id, userId: null}, {sort: {name: 1}})
    },
    lastSetting(){
        return Template.instance().lastSetting.get() == this._id
    },
    isDefault(){
        return !this.userId
    }
});

Template.atSettings.events({
    'keydown input'(e, instance){
        const code = e.keyCode || e.which;
        const btn = instance.$('.settingNew')
        const input = instance.$('input[name="settingNew"]')
        const val = input.val()
        if (code == 13) {
            if (val) {
                Meteor.call('settingNew', instance.data.at.id, val, instance.data.columnsReactive.get(), function (err, res) {
                    console.log(err, res)
                    if (res) {
                        instance.lastSetting.set(res)
                        btn.show()
                        input.hide().val('')
                    }
                })
            } else {
                btn.show()
                input.hide()
            }
        }
        if (code == 27) {
            btn.show()
            input.hide()
        }
    },
    'click .settingNew'(e, instance){
        e.preventDefault()
        e.stopPropagation()
        console.log('click settingsNew')
        const btn = $(e.currentTarget)
        const input = instance.$('input[name="settingNew"]')
        console.log(btn, input)
        btn.hide()
        input.show().focus()
    },
    'click .settingUpdate'(e, instance){
        e.preventDefault()
        e.stopPropagation()
        if (Template.instance().lastSetting.get() != this._id) {
            confirm({
                content: 'Are you sure you want to overwrite this item',
                onConfirm: () => Meteor.call('settingUpdate', this._id, instance.data.columnsReactive.get(), (err, res) => {
                    if (res) instance.lastSetting.set(this._id)
                })
            })
        }
    },
    'click .settingsSet'(e, instance){
        instance.lastSetting.set(this._id)
        instance.data.columnsReactive.set(this.columns)
    },
    'click .settingsRemove'(e, instance){
        e.preventDefault()
        e.stopPropagation()
        confirm({
            content: 'Are you sure you want to remove this item',
            onConfirm: () => Meteor.call('settingsRemove', this._id)
        })
    },
    'click .settingsDefault'(e, instance){
        e.preventDefault()
        e.stopPropagation()
        confirm({
            content: 'Are you sure you want to make this item a default for all users',
            onConfirm: () => Meteor.call('settingsDefault', this._id)
        })
    },

});

Template.atSettings.onCreated(function () {
    this.lastSetting = new PersistentReactiveVar('lastStting_' + this.data.at.id)
    this.lastSetting.set(null)
    this.subscribe('atSettings', this.data.at.id)
});

Template.atSettings.onRendered(function () {
    this.$('.buttonSettings').on('hidden.bs.dropdown', () => {
        console.log('hidden.bs.dropdown')
        const btn = this.$('.settingNew')
        const input = this.$('input[name="settingNew"]')
        btn.show()
        input.hide()
    })
});

Template.atSettings.onDestroyed(function () {
    //add your statement here
});

