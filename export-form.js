import './export-form.html'


let SimpleSchema = {}


if (Package['aldeed:simple-schema']) {
    SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema
}


const color = new SimpleSchema({
    "argb": {
        type: String,
        autoform: {
            afFormGroup: {
                type: 'bootstrap-colorpicker',
            }
        },
        defaultValue: 1
    },
})

const pageSetup = new SimpleSchema({
    "margins": {
        type: Number,
        decimal: true,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Whitespace on the borders of the page. Units are inches.',
            }
        }
    },
    "orientation": {
        type: String,
        optional: true,
        allowedValues: ['portrait', 'landscape'],
        autoform: {
            options: 'allowed',
            capitalize: true,
            afFormGroup: {
                textHelp:  'Orientation of the page',
            }
        },
        defaultValue: 'portrait'
    },
    "horizontalDpi": {
        type: Number,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Horizontal Dots per Inch',
            }
        },
        defaultValue: -1
    },
    "verticalDpi": {
        type: Number,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  '	Vertical Dots per Inch',
            }
        },
        defaultValue: -1
    },
    "fitToPage": {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Whether to use fitToWidth and fitToHeight or scale settings. Default is based on presence of these settings in the pageSetup object - if both are present, scale wins (i.e. default will be false)',
            }
        },

    },
    "pageOrder": {
        type: String,
        optional: true,
        allowedValues: ['downThenOver', 'overThenDown'],
        autoform: {
            options: 'allowed',
            capitalize: true,
            afFormGroup: {
                textHelp:  'Which order to print the pages',
            }
        },
        defaultValue: 'downThenOver'
    },
    "blackAndWhite": {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Orientation of the page',
            }
        },
        defaultValue: false,
    },
    "draft": {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Print with less quality (and ink)',
            }
        },
        defaultValue: false,
    },
    "cellComments": {
        type: String,
        optional: true,
        allowedValues: ['atEnd', 'asDisplayed', 'None'],
        autoform: {
            options: 'allowed',
            capitalize: true,
            afFormGroup: {
                textHelp:  'Where to place comments',
            }
        },
        defaultValue: 'None'
    },
    "errors": {
        type: String,
        optional: true,
        allowedValues: ['dash', 'blank', 'NA', 'displayed'],
        autoform: {
            options: 'allowed',
            capitalize: true,
            afFormGroup: {
                textHelp:  'Where to show errors',
            }
        },
        defaultValue: 'displayed'
    },
    "scale": {
        type: Number,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Percentage value to increase or reduce the size of the print. Active when fitToPage is false',
            }
        },
        defaultValue: 100
    },
    "fitToWidth": {
        type: Number,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'How many pages wide the sheet should print on to. Active when fitToPage is true',
            }
        },
        defaultValue: 1
    },
    "fitToHeight": {
        type: Number,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'How many pages high the sheet should print on to. Active when fitToPage is true',
            }
        },
        defaultValue: 1
    },
    "paperSize": {
        type: String,
        decimal: true,
        optional: true,
        autoform: {
            firstOption: 'Letter',
            options: [
                {Label: 'Legal', value: 5},
                {Label: 'Executive', value: 7},
                {Label: 'A4', value: 9},
                {Label: 'A5', value: 11},
                {Label: 'B5 (JIS)', value: 13},
                {Label: 'Envelope #10', value: 20},
                {Label: 'Envelope DL', value: 27},
                {Label: 'Envelope C5', value: 28},
                {Label: 'Envelope B5', value: 34},
                {Label: 'Envelope Monarch', value: 37},
                {Label: 'Double Japan Postcard Rotated', value: 82},
                {Label: '16K 197x273 mm', value: 119},
            ],
            afFormGroup: {
                textHelp:  'What paper size to use ',
            }
        },
        defaultValue: 'portrait'
    },
    "showRowColHeaders": {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Whether to show the row numbers and column letters',
            }
        },
        defaultValue: false
    },
    "showGridLines": {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Whether to show grid lines',
            }
        },
        defaultValue: false
    },
    "firstPageNumber": {
        type: Number,
        optional: true,
        autoform: {
            textHelp:  'Which number to use for the first page',
        }
    },

    "horizontalCentered": {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Whether to center the sheet data horizontally',
            }
        },
        defaultValue: false
    },
    "verticalCentered": {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Whether to center the sheet data vertically',
            }
        },
        defaultValue: false
    }


})


const font = new SimpleSchema({
    name: {
        type: String,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  "Font name 'Arial', 'Calibri', etc.",
            }
        },
        defaultValue: 'Arial'
    },

    family: {
        type: Number,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  "Font family. An integer value.",
            }
        },
        defaultValue: 1
    },

    color: {
        type: color,
        optional: true,
    },
    italic: {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Font outline',
            }
        },
        defaultValue: false
    },
    bold: {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Font italic',
            }
        },
        defaultValue: false
    },
    underline: {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Font underline style',
            }
        },
        defaultValue: false
    },
    strike: {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Font strikethrough',
            }
        },
        defaultValue: false
    },
    outline: {
        type: Boolean,
        optional: true,
        autoform: {
            afFormGroup: {
                textHelp:  'Font outline',
            }
        },
        defaultValue: false
    }
})

const alignment = new SimpleSchema({
    horizontal: {
        type: String,
        optional: true,
        allowedValues: ['left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'],
        autoform: {
            options: 'allowed',
            capitalize: true,
        },
        defaultValue: 'left',
    },
    vertical: {
        type: Number,
        optional: true,
        allowedValues: ['top', 'middle', 'bottom', 'distributed', 'justify'],
        autoform: {
            options: 'allowed',
            capitalize: true,
        },
        defaultValue: 100
    },
    wraptext: {
        type: Boolean,
        optional: true,
        defaultValue: false
    }
})


const border = new SimpleSchema({
    style: {
        type: String,
        optional: true,
        allowedValues: ['thin', 'dotted', 'dashDot', 'hair', 'dashDotDot', 'slantDashDot', 'mediumDashed', 'mediumDashDotDot', 'mediumDashDot', 'medium', 'double', 'thick'],
        autoform: {
            options: 'allowed',
            capitalize: true,
        },
    },

})

const cell = new SimpleSchema({
    fgColor: {
        label: 'Background',
        type: color,
    },
    borderLeft: {
        type: border,
    },

    borderBottom: {
        type: border,
    },

    borderRight: {
        type: border,
    },

    alignment: {
        type: alignment,
    },
    font: {
        type: font,
    },
})
Template.atExportForm.helpers({
    schema(){
        const columns = _.reject(Template.instance().data.columns.get(), (col) => col.invisible == true)
        return new SimpleSchema({
            pageSetup: {
                type: pageSetup
            },
            cells: {
                type: new SimpleSchema({
                    column: {
                        type: String,
                        autoform: {
                            options: () => {
                                return columns.map((column) => {
                                    console.log(column.label, column.key)
                                    return {label: column.label, value: column.key}
                                })
                            }
                        }
                    },
                    properties: {
                        type: cell
                    }
                })
            }

        })
    }
});

Template.atExportForm.events({
    //add your events here
});

Template.atExportForm.onCreated(function () {
    //add your statement here
});

Template.atExportForm.onRendered(function () {
    $('#atExportForm').modal('show')
});

Template.atExportForm.onDestroyed(function () {
    //add your statement here
});

