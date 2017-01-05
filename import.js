import "./import.html"
Template.atImport.helpers({
    fields: function () {
        const columns = Template.instance().data.columns
    }
});

Template.atImport.events({

});

Template.atImport.onCreated(function () {

});

Template.atImport.onRendered(function () {
    console.log('Template.atImport.onCreated')
    const $modal=$(this.firstNode)
    $modal.modal('show')
    $modal.on('hidden.bs.modal',()=>{
        Blaze.remove(Blaze.getView($modal.get(0)))
        $modal.remove();
    })
});

Template.atImport.onDestroyed(function () {
    //add your statement here
});

