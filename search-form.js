/**
 * Created by cesar on 30/9/16.
 */
import './search-form.html'
import {familyStatus} from "/imports/api/family/family-status";
import {optsGoogleplace} from "/imports/api/family/contact";
import '/imports/ui/componets/autoform/select-multi-checkbox-combo/select-multi-checkbox-combo'
import '/imports/ui/pages/family/export'
AutoForm.hooks({
    searchFamilyListForm: {
        onSubmit: function (search, modifier,) {
            if (search.address && search.address.geometry) {
                Session.setPersistent('searchFamilyListForm.address', search.address);
                Session.setPersistent('searchFamilyListForm.orderBy', {})
            } else {
                Session.setPersistent('searchFamilyListForm.address', null)
            }
            Session.setPersistent('searchFamilyListForm.distance', search.distance);
            Session.setPersistent('searchFamilyListForm.keyWord', search.keyWord);
            Session.setPersistent('searchFamilyListForm.familyStatus', search.familyStatus);
            if (Array.isArray(search.adults) && search.adults.length > 0) {
                Session.setPersistent('searchFamilyListForm.adults', search.adults)
            } else {
                Session.setPersistent('searchFamilyListForm.adults', null)
            }
            return false;
        }
    }
});

const AddressSchema = new SimpleSchema({
    fullAddress: {
        optional: true,
        type: String
    },
    lat: {
        optional: true,
        type: Number,
        decimal: true
    },
    lng: {
        optional: true,
        type: Number,
        decimal: true
    },
    geometry: {
        optional: true,
        type: Object,
        blackbox: true
    },
    placeId: {
        optional: true,
        type: String
    },
    street: {
        optional: true,
        type: String,
        max: 100
    },
    city: {
        optional: true,
        type: String,
        max: 50
    },
    state: {
        optional: true,
        type: String,
    },
    zip: {
        optional: true,
        type: String,
    },
    country: {
        optional: true,
        type: String
    }
});

export const searchSchema = new SimpleSchema({
    keyWord: {
        type: String,
        optional: true,
    },
    familyStatus: {
        optional: true,
        allowedValues: _.pluck(familyStatus, 'id'),
        type: Number,
        autoform: {
            firstOption: "All status",
            options: function () {
                return _.map(familyStatus, function (status) {
                    return {label: status.label, value: status.id}
                })
            },
            afFieldInput: {
                class: 'form-control'
            }
        }
    },
    distance: {
        type: Number,
        autoform: {
            firstOption: false,
            options: function () {
                const options = [];
                for (let i = 1; i <= 50; i++) {
                    options.push({label: `<${i} km`, value: i * 1000},)
                }
                return options
            },
        }
    },
    address: {
        type: AddressSchema,
        optional: true,
    },
    adults: {
        label: "Adult groups",
        optional: true,
        type: [String],
        autoform: {
            type: 'select-multi-checkbox-combo',
            options: [
                {
                    label: 'N/A',
                    value: 'n/a'
                },
                {
                    label: 'Applying',
                    value: 'applying'
                },
                {
                    label: 'Approved',
                    value: 'approved'
                },
                {
                    label: 'Declined',
                    value: 'declined'
                }
            ]
        }
    }
});


Template.searchFamilyListForm.onCreated(function () {
    Session.setDefaultPersistent('searchFamilyListForm.query', {roles: 'family'})
});
Template.searchFamilyListForm.helpers({
    searchSchema: searchSchema,
    optsGoogleplace: optsGoogleplace,
    distance: ()=> {
        return Session.get('searchFamilyListForm.distance')
    },
    address: ()=> {
        return Session.get('searchFamilyListForm.address')
    },
    keyWord: ()=> {
        return Session.get('searchFamilyListForm.keyWord')

    },
    familyStatus: ()=> {
        return Session.get('searchFamilyListForm.familyStatus')

    },
    adults: ()=> {
        return Session.get('searchFamilyListForm.adults')

    },
});

Template.searchFamilyListForm.events({
    'click .export'(e, instance){
        BootstrapModalPrompt.prompt({
            title: "Export to CSV",
            template: Template.exportCVS,
            btnDismissText: 'Cancel',
            btnOkText: 'Export'
        }, function (data) {
            if (data) {

            }
            else {
                console.log('cancel')
            }
        });
    }
});