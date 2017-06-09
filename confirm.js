import './confirm.html'
Template.atConfirm.helpers({
    //add you helpers here
});

Template.atConfirm.events({
    'click .confirm'(e,instance){
        this.onConfirm()
        instance.$modal.modal('hide')
    }
});

Template.atConfirm.onCreated(function () {

});

Template.atConfirm.onRendered(function () {
    this.$modal=$(this.firstNode)
    this.$modal.modal('show')
    this.$modal.on('hidden.bs.modal',()=>{
        Blaze.remove(this.view)
    })
});

Template.atConfirm.onDestroyed(function () {
});

export const confirm=function({content, onConfirm}){
    Blaze.renderWithData(Template.atConfirm,{content, onConfirm},document.body)
}